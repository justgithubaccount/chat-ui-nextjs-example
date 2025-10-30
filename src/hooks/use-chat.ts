import { useState, useCallback } from "react";
import { useChatStore } from "@/store/chat-store";
import { nanoid } from "nanoid";
import { Message } from "@/types/chat";

export function useChat(chatId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const { addMessage, updateMessage } = useChatStore();

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!content.trim() && !files?.length) return;

      setIsStreaming(true);

      try {
        // Add user message
        const userMessageId = nanoid();
        const userMessage: Message = {
          id: userMessageId,
          chatId,
          role: "user",
          content,
          createdAt: new Date(),
        };
        addMessage(chatId, userMessage);

        // Add placeholder for assistant message
        const assistantMessageId = nanoid();
        const assistantMessage: Message = {
          id: assistantMessageId,
          chatId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
        };
        addMessage(chatId, assistantMessage);

        // Stream response
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            content,
            messageId: assistantMessageId,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          updateMessage(chatId, assistantMessageId, assistantContent);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [chatId, addMessage, updateMessage]
  );

  return { sendMessage, isStreaming };
}
