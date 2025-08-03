import { useState, useEffect, useCallback } from 'react';

export interface ScreenTimeEntry {
  id: string;
  user_id: string;
  date: string;
  total_time: string;
  apps: Array<{ name: string; time: string }>;
  categories: Array<{ name: string; time: string }>;
  updated_at: string;
  created_at: string;
  updated_at_timestamp: string;
}

export interface ScreenTimeData {
  entries: ScreenTimeEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useScreenTimeData(userId?: string, date?: string): ScreenTimeData {
  const [entries, setEntries] = useState<ScreenTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      // Don't filter by date initially to get all user data
      // We'll filter for today's data on the client side

      const response = await fetch(`/api/screen-time?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        let filteredEntries = result.data || [];
        
        // If a specific date is requested, filter for today's data
        if (date) {
          filteredEntries = filteredEntries.filter((entry: ScreenTimeEntry) => {
            return isTodayEntry(entry.date);
          });
        }
        
        setEntries(filteredEntries);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => {
    fetchData();
  }, [userId, date, fetchData]);

  return {
    entries,
    loading,
    error,
    refetch: fetchData,
  };
}

// Helper function to check if a date entry represents today
function isTodayEntry(dateString: string): boolean {
  const today = new Date();
  
  // Simple check: if it contains "Today", it's today
  if (dateString.toLowerCase().includes('today')) {
    return true;
  }
  
  // Check if it contains today's date number and month
  const todayDay = today.getDate();
  const todayMonth = today.toLocaleDateString('en-US', { month: 'long' });
  
  if (dateString.includes(todayDay.toString()) && dateString.includes(todayMonth)) {
    return true;
  }
  
  return false;
}

// Helper function to parse time string (e.g., "2h 30m") to minutes
export function parseTimeToMinutes(timeString: string): number {
  const hoursMatch = timeString.match(/(\d+)h/);
  const minutesMatch = timeString.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

// Helper function to format minutes to time string
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Helper function to get today's date in the format used by the app
export function getTodayDateString(): string {
  const today = new Date();
  return today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
} 