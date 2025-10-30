import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { openai } from "@/lib/openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { generateChatTitle } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { chatId, content, messageId } = await req.json();

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

    // Create streaming response
    const response = await openai.chat.completions.create({
      model: chat.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    let fullContent = "";

    // Convert to ReadableStream with callback
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        fullContent = completion;
        // Save assistant message
        await prisma.message.create({
          data: {
            chatId,
            role: "assistant",
            content: completion,
          },
        });

        // Update chat timestamp
        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
