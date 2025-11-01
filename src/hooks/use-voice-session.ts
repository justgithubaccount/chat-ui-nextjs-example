"use client";

import { useVoiceSessionContext } from "@/components/providers/voice-session-provider";

/**
 * Hook to access voice session functionality
 * This is a convenience hook that re-exports the context
 * and can add additional logic if needed
 */
export function useVoiceSession() {
  return useVoiceSessionContext();
}