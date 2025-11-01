"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { RealtimeSession } from "@openai/agents/realtime";
import { createVoiceAgent, VoiceAgentPresets } from "@/lib/voice-agent";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  TranscriptEntry,
  VoiceSessionContextType,
  ConnectOptions,
  VoiceAgentInstructions
} from "@/types/voice";
import { useAudioContext } from "@/hooks/use-audio-context";
import { useSessionTimer } from "@/hooks/use-session-timer";

const VoiceSessionContext = createContext<VoiceSessionContextType | undefined>(undefined);

export function VoiceSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: authSession } = useSession();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Session config
  const [networkQuality] = useState<string>('good');
  const [voiceModel] = useState<string>('gpt-realtime');
  const [selectedVoice, setSelectedVoice] = useState<string>('alloy');
  const [currentAgentPreset, setCurrentAgentPreset] = useState<keyof typeof VoiceAgentPresets>('default');

  // Transcript
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // References
  const sessionRef = useRef<RealtimeSession<any> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Use custom hooks
  const {
    initAudioContext,
    cleanupAudio,
    getAudioLevel,
    mediaStreamRef
  } = useAudioContext();

  const {
    sessionDuration,
    startSessionTimer,
    stopSessionTimer
  } = useSessionTimer();

  // Monitor audio levels
  useEffect(() => {
    if (!isConnected || isMuted) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const monitorAudioLevel = () => {
      const level = getAudioLevel();
      setAudioLevel(level);

      // Throttle to 30fps
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      }, 33);
    };

    monitorAudioLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isConnected, isMuted, getAudioLevel]);

  // Add transcript entry
  const addTranscriptEntry = useCallback((entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => {
    const newEntry: TranscriptEntry = {
      ...entry,
      id: nanoid(),
      timestamp: new Date()
    };
    setTranscript(prev => [...prev, newEntry]);
  }, []);

  // Handle disconnection cleanup
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsSpeaking(false);
    setSessionId(null);
    setAudioLevel(0);
    stopSessionTimer();
    cleanupAudio();

    if (sessionRef.current) {
      // Close the session properly
      try {
        sessionRef.current.close();
      } catch (error) {
        console.error('Error closing session:', error);
      }
      sessionRef.current = null;
    }
  }, [cleanupAudio, stopSessionTimer]);

  // Connect to voice session
  const connect = useCallback(async (options: ConnectOptions = {}) => {
    if (!authSession?.user) {
      setConnectionError("Please sign in to use voice features");
      toast.error("Please sign in to use voice features");
      return;
    }

    if (isConnected || isConnecting) {
      console.warn("Already connected or connecting");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Initialize audio
      const audioResult = await initAudioContext();
      if (!audioResult.success) {
        throw new Error(audioResult.error || "Failed to initialize audio");
      }

      // Get ephemeral token from our API
      const tokenResponse = await fetch("/api/voice/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: options.model || voiceModel,
          voice: options.voice || selectedVoice,
          instructions: options.instructions,
          temperature: options.temperature
        })
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get voice session token");
      }

      const { token } = await tokenResponse.json();

      // Create agent based on preset
      const preset = options.agentPreset || currentAgentPreset;
      const agent = VoiceAgentPresets[preset] || createVoiceAgent();

      // Create session with proper options
      const session = new RealtimeSession(agent, {
        apiKey: token,
        transport: 'webrtc', // Use WebRTC for browser
        model: options.model || voiceModel
      });

      // Set up basic event listeners
      // History updates
      session.on('history_updated', (history: any[]) => {
        console.log('History updated with', history.length, 'items');
      });

      // Error handling
      session.on('error', (error: any) => {
        console.error('Session error:', error);
        toast.error("Voice session error occurred");
        handleDisconnect();
      });

      // Agent activity
      session.on('agent_start', () => {
        setIsSpeaking(true);
        console.log('Agent started');
      });

      session.on('agent_end', (_context: any, _agent: any, output: string) => {
        setIsSpeaking(false);
        console.log('Agent finished:', output);
        if (output) {
          addTranscriptEntry({
            speaker: 'assistant',
            text: output,
            isFinal: true
          });
        }
      });

      // Connect the session
      await session.connect({
        apiKey: token,
        model: options.model || voiceModel
      });

      // Store session reference
      sessionRef.current = session;
      const newSessionId = nanoid();
      setSessionId(newSessionId);

      // Update state
      setIsConnected(true);
      setIsConnecting(false);
      startSessionTimer();

      toast.success("Voice chat connected");
      console.log('Voice session connected with ID:', newSessionId);

    } catch (error) {
      console.error("Failed to connect voice session:", error);
      setConnectionError(error instanceof Error ? error.message : "Connection failed");
      setIsConnecting(false);
      cleanupAudio();
      toast.error(error instanceof Error ? error.message : "Failed to connect");
    }
  }, [
    authSession,
    isConnected,
    isConnecting,
    initAudioContext,
    voiceModel,
    selectedVoice,
    currentAgentPreset,
    addTranscriptEntry,
    handleDisconnect,
    cleanupAudio,
    startSessionTimer
  ]);

  // Disconnect from voice session
  const disconnect = useCallback(() => {
    handleDisconnect();
    toast.info("Voice chat disconnected");
  }, [handleDisconnect]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!sessionRef.current || !isConnected) return;

    setIsMuted(prev => {
      const newMuted = !prev;
      // Implement actual mute logic with the session
      if (mediaStreamRef.current) {
        const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !newMuted;
        }
      }

      // Try to mute the transport if supported
      try {
        if (sessionRef.current && 'transport' in sessionRef.current) {
          const transport = (sessionRef.current as any).transport;
          if (transport && 'setMuted' in transport) {
            transport.setMuted(newMuted);
          }
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
      }

      toast.info(newMuted ? "Microphone muted" : "Microphone unmuted");
      return newMuted;
    });
  }, [isConnected, mediaStreamRef]);

  // Send text message in voice mode
  const sendMessage = useCallback((message: string) => {
    if (!sessionRef.current || !isConnected) {
      console.warn('Cannot send message: not connected');
      return;
    }

    // Add user message to transcript
    addTranscriptEntry({
      speaker: 'user',
      text: message,
      isFinal: true
    });

    // Send message to session
    try {
      if (sessionRef.current && 'sendUserInput' in sessionRef.current) {
        (sessionRef.current as any).sendUserInput(message);
        console.log('Sent text message in voice mode:', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [isConnected, addTranscriptEntry]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  // Reconnect with new config
  const reconnectWithConfig = useCallback(
    async (newConfig: Partial<ConnectOptions>) => {
      const wasConnected = isConnected;

      if (wasConnected) {
        disconnect();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (wasConnected) {
        await connect(newConfig);
      }
    },
    [isConnected, disconnect, connect]
  );

  // Change voice
  const changeVoice = useCallback((voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') => {
    setSelectedVoice(voice);
    reconnectWithConfig({ voice });
  }, [reconnectWithConfig]);

  // Set agent preset
  const setAgentPreset = useCallback((preset: keyof typeof VoiceAgentInstructions) => {
    setCurrentAgentPreset(preset as keyof typeof VoiceAgentPresets);
    reconnectWithConfig({ agentPreset: preset as keyof typeof VoiceAgentPresets });
  }, [reconnectWithConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, [handleDisconnect]);

  const contextValue: VoiceSessionContextType = {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    sessionId,

    // Audio state
    isMuted,
    isListening,
    isSpeaking,
    audioLevel,

    // Session info
    sessionDuration,
    networkQuality,
    voiceModel,
    selectedVoice,

    // Transcript
    transcript,

    // Actions
    connect,
    disconnect,
    toggleMute,
    sendMessage,
    clearTranscript,
    changeVoice,
    setAgentPreset
  };

  return (
    <VoiceSessionContext.Provider value={contextValue}>
      {children}
    </VoiceSessionContext.Provider>
  );
}

export function useVoiceSessionContext() {
  const context = useContext(VoiceSessionContext);
  if (context === undefined) {
    throw new Error('useVoiceSessionContext must be used within a VoiceSessionProvider');
  }
  return context;
}