import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface TodayUploadData {
  hasUploadedToday: boolean;
  existingEntry: any | null;
  source: string;
}

export function useTodayUpload() {
  const { user } = useAuth();
  const [data, setData] = useState<TodayUploadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTodayUpload = async () => {
    if (!user?.uid) {
      setData({ hasUploadedToday: false, existingEntry: null, source: 'no-user' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/screen-time/check-today?user_id=${user.uid}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check today\'s upload');
      }

      setData(result);
    } catch (err) {
      console.error('Error checking today\'s upload:', err);
      setError(err instanceof Error ? err.message : 'Failed to check today\'s upload');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTodayUpload();
  }, [user?.uid]);

  const refetch = () => {
    checkTodayUpload();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
} 