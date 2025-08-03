import { useState, useEffect } from 'react';

export interface LeaderboardEntry {
  rank: number;
  user: {
    firebase_uid: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  screenTime: string;
  totalMinutes: number;
  apps: any[];
  categories: any[];
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeaderboard(userId?: string): LeaderboardData {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard?user_id=${userId}`);
      const result = await response.json();

      if (result.success) {
        setLeaderboard(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch leaderboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [userId, fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
} 