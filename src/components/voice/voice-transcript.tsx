"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Volume2, User, Bot, Loader2 } from "lucide-react";
import { useVoiceSession } from "@/hooks/use-voice-session";
import type { TranscriptEntry } from "@/types/voice";

interface VoiceTranscriptProps {
  className?: string;
  maxHeight?: string;
  showTimestamps?: boolean;
  autoScroll?: boolean;
}

export function VoiceTranscript({
  className,
  maxHeight = "400px",
  showTimestamps = false,
  autoScroll = true
}: VoiceTranscriptProps) {
  const { transcript, isListening, isSpeaking } = useVoiceSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  // Update entries when transcript changes
  useEffect(() => {
    if (transcript) {
      setEntries(transcript);
    }
  }, [transcript]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);


  return (
    <div className={cn("flex flex-col", className)}>
      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2 text-sm">
          {isListening && (
            <div className="flex items-center gap-1 text-blue-500">
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span>Listening...</span>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center gap-1 text-green-500">
              <Bot className="h-3 w-3 animate-pulse" />
              <span>Speaking...</span>
            </div>
          )}
          {!isListening && !isSpeaking && (
            <span className="text-muted-foreground">Waiting...</span>
          )}
        </div>
      </div>

      {/* Transcript Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight }}
      >
        {entries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Voice transcript will appear here</p>
            <p className="text-sm mt-1">Start speaking to begin</p>
          </div>
        ) : (
          entries.map((entry) => (
            <TranscriptEntry
              key={entry.id}
              entry={entry}
              showTimestamp={showTimestamps}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Format timestamp helper
 */
const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Individual transcript entry component
 */
function TranscriptEntry({
  entry,
  showTimestamp
}: {
  entry: TranscriptEntry;
  showTimestamp: boolean;
}) {
  const isUser = entry.speaker === 'user';

  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {/* Speaker label and timestamp */}
        {showTimestamp && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{isUser ? "You" : "Assistant"}</span>
            <span>{formatTimestamp(entry.timestamp)}</span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "px-3 py-2 rounded-lg max-w-[80%] relative",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted",
            !entry.isFinal && "opacity-70",
            entry.isInterrupted && "line-through opacity-50"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{entry.text}</p>

          {/* Interim indicator */}
          {!entry.isFinal && (
            <Loader2 className="h-3 w-3 animate-spin absolute -bottom-1 -right-1" />
          )}
        </div>

        {/* Status indicators */}
        {entry.isInterrupted && (
          <span className="text-xs text-muted-foreground">Interrupted</span>
        )}
      </div>

      {/* Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

/**
 * Compact transcript display for inline use
 */
export function CompactTranscript({ className }: { className?: string }) {
  const { transcript, isListening } = useVoiceSession();
  const latestEntry = transcript?.[transcript.length - 1];

  if (!latestEntry) return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {latestEntry.speaker === 'user' ? (
        <User className="h-3 w-3" />
      ) : (
        <Bot className="h-3 w-3" />
      )}

      <span className={cn(
        "truncate max-w-[200px]",
        !latestEntry.isFinal && "opacity-70"
      )}>
        {latestEntry.text}
      </span>

      {isListening && !latestEntry.isFinal && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
    </div>
  );
}

/**
 * Voice activity indicator
 */
export function VoiceActivityIndicator({ className }: { className?: string }) {
  const { isListening, isSpeaking, audioLevel } = useVoiceSession();

  if (!isListening && !isSpeaking) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-current transition-all duration-150",
            isListening ? "bg-blue-500" : "bg-green-500"
          )}
          style={{
            height: `${Math.max(4, Math.min(20, audioLevel * 100 * (i + 1) / 5))}px`,
            animationDelay: `${i * 50}ms`
          }}
        />
      ))}
    </div>
  );
}