"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import { ChatMessage } from "./chat-message";
import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  chatId: string;
}

export function ChatMessages({ chatId }: ChatMessagesProps) {
  const { chats, isLoading } = useChatStore();
  const { messagesRef, scrollRef } = useScrollAnchor();

  const chat = chats.find((c) => c.id === chatId);
  const messages = chat?.messages || [];

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <h2 className="text-2xl font-bold mb-2">Start a conversation</h2>
          <p className="text-muted-foreground">
            Send a message to begin chatting with AI
          </p>
        </div>
      ) : (
        <div>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex gap-3 px-4 py-6 bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesRef} />
        </div>
      )}
    </div>
  );
}
