"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { ConnectionIndicator } from "@/components/ui/connection-indicator";

interface VoiceControlProps {
  className?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  chatId?: string;
}

export function VoiceControl({ className, onTranscript, chatId }: VoiceControlProps) {
  const {
    isConnected,
    isConnecting,
    isMuted,
    audioLevel,
    connectionError,
    connect,
    disconnect,
    toggleMute,
    isListening
  } = useVoiceSession();

  const [showError, setShowError] = useState(false);
  const audioVisualizerRef = useRef<HTMLDivElement>(null);

  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  // Animate audio level indicator
  useEffect(() => {
    if (audioVisualizerRef.current && isConnected && !isMuted) {
      const scale = 1 + (audioLevel * 0.5);
      audioVisualizerRef.current.style.transform = `scale(${scale})`;
    }
  }, [audioLevel, isConnected, isMuted]);

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect({ chatId });
    }
  };

  const getConnectionButtonIcon = () => {
    if (isConnecting) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isConnected) return <PhoneOff className="h-4 w-4" />;
    return <Phone className="h-4 w-4" />;
  };

  const getConnectionButtonText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) return "End Voice Chat";
    return "Start Voice Chat";
  };

  const getMicButtonIcon = () => {
    if (isMuted) return <MicOff className="h-4 w-4" />;
    return <Mic className="h-4 w-4" />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Connection Button */}
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant={isConnected ? "destructive" : "default"}
        size="sm"
        className="relative"
      >
        {getConnectionButtonIcon()}
        <span className="ml-2">{getConnectionButtonText()}</span>

        {/* Connection status indicator */}
        {isConnected && (
          <ConnectionIndicator isConnected={isConnected} size="md" className="absolute -top-1 -right-1" />
        )}
      </Button>

      {/* Mute Button - Only show when connected */}
      {isConnected && (
        <Button
          onClick={toggleMute}
          variant={isMuted ? "outline" : "secondary"}
          size="sm"
          className="relative"
        >
          {getMicButtonIcon()}
          <span className="ml-2">{isMuted ? "Unmute" : "Mute"}</span>

          {/* Audio level indicator */}
          {!isMuted && isListening && (
            <div
              ref={audioVisualizerRef}
              className="absolute -inset-1 rounded-md bg-blue-500 opacity-20 transition-transform duration-100"
              style={{ transformOrigin: 'center' }}
            />
          )}
        </Button>
      )}

      {/* Listening indicator */}
      {isConnected && isListening && !isMuted && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Volume2 className="h-3 w-3" />
          <span>Listening...</span>
        </div>
      )}

      {/* Error message */}
      {showError && connectionError && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-destructive text-destructive-foreground rounded-md text-sm z-50">
          {connectionError}
        </div>
      )}
    </div>
  );
}

/**
 * Compact voice control for inline use
 */
export function CompactVoiceControl({ className }: { className?: string }) {
  const { isConnected, isConnecting, connect, disconnect } = useVoiceSession();

  const handleToggle = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isConnecting}
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      title={isConnected ? "End voice chat" : "Start voice chat"}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isConnected ? (
        <MicOff className="h-4 w-4 text-destructive" />
      ) : (
        <Mic className="h-4 w-4" />
      )}

      {/* Connection indicator */}
      {isConnected && (
        <ConnectionIndicator isConnected={isConnected} size="sm" className="absolute -top-0.5 -right-0.5" />
      )}
    </Button>
  );
}

/**
 * Voice status bar for showing detailed connection info
 */
export function VoiceStatusBar({ className }: { className?: string }) {
  const {
    isConnected,
    sessionDuration,
    networkQuality,
    voiceModel,
    selectedVoice
  } = useVoiceSession();

  if (!isConnected) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={cn("flex items-center gap-4 text-xs text-muted-foreground", className)}>
      <div className="flex items-center gap-1">
        <Phone className="h-3 w-3" />
        <span>Voice Active</span>
      </div>

      {sessionDuration !== undefined && (
        <div className="flex items-center gap-1">
          <span>{formatDuration(sessionDuration)}</span>
        </div>
      )}

      {networkQuality && (
        <div className={cn("flex items-center gap-1", getQualityColor(networkQuality))}>
          <span>Network: {networkQuality}</span>
        </div>
      )}

      {voiceModel && (
        <div className="flex items-center gap-1">
          <span>Model: {voiceModel}</span>
        </div>
      )}

      {selectedVoice && (
        <div className="flex items-center gap-1">
          <span>Voice: {selectedVoice}</span>
        </div>
      )}
    </div>
  );
}