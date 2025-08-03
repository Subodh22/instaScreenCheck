import { useEffect, useRef, useState } from 'react';
import { useScreenTimeStore } from '../store/screenTimeStore';

export const useScreenTimeTracker = () => {
  const {
    isTracking,
    currentSession,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
  } = useScreenTimeStore();

  const [currentDuration, setCurrentDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Handle visibility change (tab switching, app switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        if (isTracking) {
          pauseTracking();
        }
      } else {
        setIsVisible(true);
        if (isTracking) {
          resumeTracking();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, pauseTracking, resumeTracking]);

  // Handle window focus/blur
  useEffect(() => {
    const handleFocus = () => {
      setIsVisible(true);
      if (isTracking) {
        resumeTracking();
      }
    };

    const handleBlur = () => {
      setIsVisible(false);
      if (isTracking) {
        pauseTracking();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isTracking, pauseTracking, resumeTracking]);

  // Update current duration when tracking
  useEffect(() => {
    if (isTracking && isVisible && currentSession) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const duration = now - currentSession.startTime;
        setCurrentDuration(duration);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, isVisible, currentSession]);

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDurationShort = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return {
    isTracking,
    isVisible,
    currentDuration,
    formatDuration,
    formatDurationShort,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
  };
}; 