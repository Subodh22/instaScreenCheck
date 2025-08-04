import { useState, useEffect } from 'react';

export interface WeeklyStats {
  totalTime: string;
  totalMinutes: number;
  daysWithData: number;
  averagePerDay: string;
  lastUpdated: string | null;
}

export interface WeeklyActivityEntry {
  user: {
    firebase_uid: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  weeklyStats: WeeklyStats;
  isCurrentUser: boolean;
  rank: number;
}

export interface WeeklyActivityData {
  weeklyActivity: WeeklyActivityEntry[];
  weekRange: {
    start: string;
    end: string;
  };
}

export function useWeeklyActivity(userId: string | undefined) {
  const [data, setData] = useState<WeeklyActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyActivity = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/friends/weekly-activity?user_id=${userId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch weekly activity');
      }
    } catch (err) {
      setError('Failed to fetch weekly activity');
      console.error('Error fetching weekly activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyActivity();
  }, [userId]);

  const refetch = () => {
    fetchWeeklyActivity();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
} 