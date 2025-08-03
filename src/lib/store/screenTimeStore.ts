import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScreenTimeSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number;
  date: string;
}

export interface DailyStats {
  date: string;
  totalTime: number;
  sessions: number;
  averageSessionLength: number;
}

interface ScreenTimeState {
  isTracking: boolean;
  currentSession: ScreenTimeSession | null;
  sessions: ScreenTimeSession[];
  dailyStats: DailyStats[];
  startTracking: () => void;
  stopTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  updateDailyStats: () => void;
  getTodayStats: () => DailyStats;
  getWeeklyStats: () => DailyStats[];
  getMonthlyStats: () => DailyStats[];
}

export const useScreenTimeStore = create<ScreenTimeState>()(
  persist(
    (set, get) => ({
      isTracking: false,
      currentSession: null,
      sessions: [],
      dailyStats: [],

      startTracking: () => {
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];
        
        const newSession: ScreenTimeSession = {
          id: `session_${now}`,
          startTime: now,
          duration: 0,
          date: today,
        };

        set({
          isTracking: true,
          currentSession: newSession,
        });
      },

      stopTracking: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const endTime = Date.now();
        const duration = endTime - currentSession.startTime;

        const completedSession: ScreenTimeSession = {
          ...currentSession,
          endTime,
          duration,
        };

        set((state) => ({
          isTracking: false,
          currentSession: null,
          sessions: [...state.sessions, completedSession],
        }));

        // Update daily stats
        get().updateDailyStats();
      },

      pauseTracking: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const now = Date.now();
        const duration = now - currentSession.startTime;

        const pausedSession: ScreenTimeSession = {
          ...currentSession,
          endTime: now,
          duration,
        };

        set((state) => ({
          isTracking: false,
          currentSession: null,
          sessions: [...state.sessions, pausedSession],
        }));

        // Update daily stats
        get().updateDailyStats();
      },

      resumeTracking: () => {
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];
        
        const newSession: ScreenTimeSession = {
          id: `session_${now}`,
          startTime: now,
          duration: 0,
          date: today,
        };

        set({
          isTracking: true,
          currentSession: newSession,
        });
      },

      updateDailyStats: () => {
        const { sessions } = get();
        const today = new Date().toISOString().split('T')[0];
        
        const todaySessions = sessions.filter(session => session.date === today);
        const totalTime = todaySessions.reduce((sum, session) => sum + session.duration, 0);
        const sessionsCount = todaySessions.length;
        const averageSessionLength = sessionsCount > 0 ? totalTime / sessionsCount : 0;

        const todayStats: DailyStats = {
          date: today,
          totalTime,
          sessions: sessionsCount,
          averageSessionLength,
        };

        set((state) => {
          const existingStatsIndex = state.dailyStats.findIndex(stat => stat.date === today);
          const updatedStats = [...state.dailyStats];
          
          if (existingStatsIndex >= 0) {
            updatedStats[existingStatsIndex] = todayStats;
          } else {
            updatedStats.push(todayStats);
          }

          return { dailyStats: updatedStats };
        });
      },

      getTodayStats: () => {
        const { dailyStats } = get();
        const today = new Date().toISOString().split('T')[0];
        return dailyStats.find(stat => stat.date === today) || {
          date: today,
          totalTime: 0,
          sessions: 0,
          averageSessionLength: 0,
        };
      },

      getWeeklyStats: () => {
        const { dailyStats } = get();
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return dailyStats.filter(stat => {
          const statDate = new Date(stat.date);
          return statDate >= weekAgo && statDate <= today;
        });
      },

      getMonthlyStats: () => {
        const { dailyStats } = get();
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        return dailyStats.filter(stat => {
          const statDate = new Date(stat.date);
          return statDate >= monthAgo && statDate <= today;
        });
      },
    }),
    {
      name: 'screen-time-storage',
    }
  )
); 