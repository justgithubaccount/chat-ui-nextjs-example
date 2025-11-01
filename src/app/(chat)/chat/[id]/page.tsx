"use client";

import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { VoiceSessionProvider } from "@/components/providers/voice-session-provider";
import { VoiceTranscript } from "@/components/voice/voice-transcript";
import { VoiceStatusBar } from "@/components/voice/voice-control";
import { useChatStore } from "@/store/chat-store";
import { useState } from "react";

export default function ChatPage({ params }: { params: { id: string } }) {
  const { voiceMode } = useChatStore();
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <VoiceSessionProvider>
      <div className="flex flex-col h-full relative">
        {/* Voice status bar - show when voice is enabled */}
        {voiceMode && (
          <div className="border-b px-4 py-2 bg-muted/50">
            <div className="flex items-center justify-between">
              <VoiceStatusBar />
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTranscript ? "Hide" : "Show"} Transcript
              </button>
            </div>
          </div>
        )}

        {/* Main chat area with optional transcript sidebar */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <ChatMessages chatId={params.id} />
            <ChatInput chatId={params.id} />
          </div>

          {/* Voice transcript sidebar */}
          {voiceMode && showTranscript && (
            <div className="w-80 border-l bg-muted/10">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Voice Transcript</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Real-time transcription of your conversation
                </p>
              </div>
              <VoiceTranscript
                maxHeight="calc(100vh - 200px)"
                showTimestamps={true}
                autoScroll={true}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>
    </VoiceSessionProvider>
  );
}
