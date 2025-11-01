"use client";

import { Mic } from "lucide-react";

interface VoiceModeIndicatorProps {
  isActive: boolean;
}

export function VoiceModeIndicator({ isActive }: VoiceModeIndicatorProps) {
  if (!isActive) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-4 border rounded-lg bg-muted/50">
      <div className="text-center">
        <Mic className="w-8 h-8 mx-auto mb-2 text-green-500 animate-pulse" />
        <p className="text-sm text-muted-foreground">Voice mode active</p>
        <p className="text-xs text-muted-foreground mt-1">
          Speak naturally to send messages
        </p>
      </div>
    </div>
  );
}