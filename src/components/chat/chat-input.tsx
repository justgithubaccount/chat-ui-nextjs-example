"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Phone, PhoneOff } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useChatStore } from "@/store/chat-store";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { useVoiceToggle } from "@/hooks/use-voice-toggle";
import { ChatTextInput } from "./chat-text-input";
import { VoiceStatusBadge } from "./voice-status-badge";
import { VoiceModeIndicator } from "./voice-mode-indicator";

interface ChatInputProps {
  chatId: string;
}

export function ChatInput({ chatId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { sendMessage, isStreaming } = useChat(chatId);
  const { transcript, isConnecting } = useVoiceSession();
  const { toggleVoiceConnection, isConnected: isVoiceConnected } = useVoiceToggle();

  // Auto-send voice transcriptions
  useEffect(() => {
    if (!transcript?.length) return;

    const latestEntry = transcript[transcript.length - 1];
    if (latestEntry.isFinal && latestEntry.speaker === 'user') {
      sendMessage(latestEntry.text);
    }
  }, [transcript, sendMessage]);

  const handleSubmit = async () => {
    if (!message.trim() || isStreaming) return;

    const content = message;
    setMessage("");
    await sendMessage(content);
  };

  const handleVoiceToggle = () => {
    toggleVoiceConnection(chatId);
  };

  const handleFileAttach = () => {
    // TODO: Implement file attachment
    console.log("File attachment not yet implemented");
  };

  return (
    <div className="border-t p-4">
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        {/* Voice status indicator */}
        <VoiceStatusBadge isConnected={isVoiceConnected} />

        {/* Main input area */}
        <div className="flex gap-2 items-end">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            disabled={isVoiceConnected}
            onClick={handleFileAttach}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Voice toggle button */}
          <Button
            type="button"
            variant={isVoiceConnected ? "destructive" : "ghost"}
            size="icon"
            className="flex-shrink-0"
            onClick={handleVoiceToggle}
            disabled={isConnecting}
            title={isVoiceConnected ? "End voice chat" : "Start voice chat"}
          >
            {isVoiceConnected ? (
              <PhoneOff className="w-5 h-5" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
          </Button>

          {/* Text input or voice indicator */}
          {!isVoiceConnected ? (
            <ChatTextInput
              value={message}
              onChange={setMessage}
              onSubmit={handleSubmit}
              isDisabled={isStreaming}
            />
          ) : (
            <VoiceModeIndicator isActive={isVoiceConnected} />
          )}
        </div>
      </div>
    </div>
  );
}