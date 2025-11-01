import { useCallback } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useVoiceSession } from './use-voice-session';

export function useVoiceToggle() {
  const { setVoiceMode } = useChatStore();
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
  } = useVoiceSession();

  const toggleVoiceConnection = useCallback(
    async (chatId?: string) => {
      try {
        if (isConnected) {
          disconnect();
          setVoiceMode(false);
        } else if (!isConnecting) {
          await connect({ chatId });
          setVoiceMode(true);
        }
      } catch (error) {
        console.error('Failed to toggle voice connection:', error);
        setVoiceMode(false);
      }
    },
    [isConnected, isConnecting, connect, disconnect, setVoiceMode]
  );

  const reconnectWithConfig = useCallback(
    async (newConfig: Parameters<typeof connect>[0]) => {
      const wasConnected = isConnected;

      if (wasConnected) {
        disconnect();
        // Give time for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (wasConnected) {
        try {
          await connect(newConfig);
        } catch (error) {
          console.error('Failed to reconnect with new config:', error);
          setVoiceMode(false);
        }
      }
    },
    [isConnected, connect, disconnect, setVoiceMode]
  );

  return {
    toggleVoiceConnection,
    reconnectWithConfig,
    isConnected,
    isConnecting
  };
}