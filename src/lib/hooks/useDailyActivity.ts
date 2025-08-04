import { useState, useEffect } from 'react';

export interface DailyStats {
  screenTime: string;
  totalMinutes: number;
  apps: any[];
  categories: any[];
  lastUpdated: string | null;
}

export interface UserStatus {
  status: string;
  emoji: string;
  color: string;
  badge: string;
}

export interface DailyActivityEntry {
  user: {
    firebase_uid: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  dailyStats: DailyStats;
  status: UserStatus;
  isCurrentUser: boolean;
}

export interface DailyActivityData {
  dailyActivity: DailyActivityEntry[];
  totalFriends: number;
}

export function useDailyActivity(userId: string | undefined) {
  const [data, setData] = useState<DailyActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyActivity = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/friends/daily-activity?user_id=${userId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch daily activity');
      }
    } catch (err) {
      setError('Failed to fetch daily activity');
      console.error('Error fetching daily activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyActivity();
  }, [userId]);

  const refetch = () => {
    fetchDailyActivity();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
} 