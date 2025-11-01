import { useState, useCallback, useRef } from 'react';

export function useSessionTimer() {
  const [sessionDuration, setSessionDuration] = useState(0);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startSessionTimer = useCallback(() => {
    // Clear any existing timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    // Reset duration and store start time
    setSessionDuration(0);
    startTimeRef.current = Date.now();

    // Start new timer
    sessionTimerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const stopSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setSessionDuration(0);
    startTimeRef.current = null;
  }, []);

  const pauseSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const resumeSessionTimer = useCallback(() => {
    if (!sessionTimerRef.current && startTimeRef.current) {
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    sessionDuration,
    startSessionTimer,
    stopSessionTimer,
    pauseSessionTimer,
    resumeSessionTimer,
    formatDuration
  };
}