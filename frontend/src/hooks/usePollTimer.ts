import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePollTimerReturn {
  remainingTime: number;
  isExpired: boolean;
  progress: number; // 0 to 100
}

export function usePollTimer(endTime: string | null, duration: number): UsePollTimerReturn {
  const [remainingTime, setRemainingTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!endTime) {
      setRemainingTime(0);
      return;
    }

    // calc time left based on server endTime
    const calculateRemaining = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingTime(remaining);
      return remaining;
    };

    // Calculate immediately
    const initial = calculateRemaining();
    
    // If already expired, don't start interval
    if (initial <= 0) {
      return;
    }

    // Update every second
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endTime]);

  const isExpired = remainingTime <= 0 && endTime !== null;
  const progress = duration > 0 ? (remainingTime / duration) * 100 : 0;

  return { remainingTime, isExpired, progress };
}

// Format seconds to MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
