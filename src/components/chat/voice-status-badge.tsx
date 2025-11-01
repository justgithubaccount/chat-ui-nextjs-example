"use client";

import { ConnectionIndicator } from "@/components/ui/connection-indicator";

interface VoiceStatusBadgeProps {
  isConnected: boolean;
  message?: string;
}

export function VoiceStatusBadge({
  isConnected,
  message = "Voice mode active - speak to send messages"
}: VoiceStatusBadgeProps) {
  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <ConnectionIndicator isConnected={isConnected} size="sm" />
        <span>{message}</span>
      </div>
    </div>
  );
}