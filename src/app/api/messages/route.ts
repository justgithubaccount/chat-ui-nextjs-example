import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { openai } from "@/lib/openai";
import { generateChatTitle } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    // Check if OPENAI_API_KEY is available at runtime
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy-key-for-build") {
      console.error("OPENAI_API_KEY is not configured");
      return new Response("OpenAI API key is not configured", { status: 500 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { chatId, content } = await req.json();

    // Verify chat belongs to user
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    // Save user message
    await prisma.message.create({
      data: {
        chatId,
        role: "user",
        content,
      },
    });

    // Update chat title if it's the first message
    if (chat.messages.length === 0 && chat.title === "New Chat") {
      const newTitle = generateChatTitle(content);
      await prisma.chat.update({
        where: { id: chatId },
        data: { title: newTitle },
      });
    }

    // Prepare messages for OpenAI
    const messages = [
      ...chat.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content,
      },
    ];

    // Create streaming response using OpenAI SDK directly
    const response = await openai.chat.completions.create({
      model: chat.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Create a TransformStream to handle the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let assistantMessage = "";

        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              assistantMessage += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          // Save assistant message after completion
          if (assistantMessage) {
            await prisma.message.create({
              data: {
                chatId,
                role: "assistant",
                content: assistantMessage,
              },
            });

            // Update chat timestamp
            await prisma.chat.update({
              where: { id: chatId },
              data: { updatedAt: new Date() },
            });
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}