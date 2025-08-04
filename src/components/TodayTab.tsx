'use client';

import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Clock, Users, Trophy, Zap, Target, Loader2 } from 'lucide-react';
import { useScreenTimeStore } from '../lib/store/screenTimeStore';
import { ScreenTimeUpload } from './ScreenTimeUpload';
import { useScreenTimeData, parseTimeToMinutes, formatMinutesToTime, getTodayDateString } from '../lib/hooks/useScreenTimeData';
import { useAuth } from '../lib/hooks/useAuth';
import { useDailyActivity } from '../lib/hooks/useDailyActivity';
import { FriendsDailyActivity } from './FriendsDailyActivity';

// Mock data for friends (removed - now using real data from API)

const formatTime = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getStatusEmoji = (status: string) => {
  switch (status) {
    case 'champion': return '👑';
    case 'good': return '✨';
    case 'struggling': return '😅';
    case 'danger': return '🆘';
    default: return '📱';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'champion': return 'text-green-600';
    case 'good': return 'text-blue-600';
    case 'struggling': return 'text-orange-600';
    case 'danger': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// App emoji mapping
const getAppEmoji = (appName: string): string => {
  const appEmojis: { [key: string]: string } = {
    'Instagram': '📷',
    'TikTok': '🎵',
    'YouTube': '▶️',
    'WhatsApp': '💬',
    'Chrome': '🌐',
    'Safari': '🌐',
    'Settings': '⚙️',
    'Reddit': '🤖',
    'Twitter': '🐦',
    'Facebook': '📘',
    'Snapchat': '👻',
    'Discord': '🎮',
    'Spotify': '🎵',
    'Netflix': '📺',
    'Gmail': '📧',
    'Messages': '💬',
    'Phone': '📞',
    'Camera': '📸',
    'Photos': '🖼️',
    'Maps': '🗺️',
    'Calendar': '📅',
    'Notes': '📝',
    'Calculator': '��',
    'Weather': '🌤️',
    'Mail': '📧',
    'App Store': '🛍️',
    'Music': '🎵',
    'Podcasts': '🎧',
    'Books': '📚',
    'Health': '❤️',
    'Fitness': '🏃‍♂️',
    'Wallet': '💳',
    'Home': '🏠',
    'Shortcuts': '⚡',
    'Files': '📁',
    'Clock': '⏰',
    'Alarm': '⏰',
    'Timer': '⏱️',
    'Stopwatch': '⏱️',
    'vibecode': '💻',
  };
  
  return appEmojis[appName] || '📱';
};

// App color mapping
const getAppColor = (appName: string): string => {
  const appColors: { [key: string]: string } = {
    'Instagram': 'bg-gradient-to-r from-purple-500 to-pink-500',
    'TikTok': 'bg-gradient-to-r from-black to-gray-700',
    'YouTube': 'bg-gradient-to-r from-red-500 to-red-600',
    'WhatsApp': 'bg-gradient-to-r from-green-500 to-green-600',
    'Chrome': 'bg-gradient-to-r from-blue-500 to-blue-600',
    'Safari': 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Settings': 'bg-gradient-to-r from-gray-500 to-gray-600',
    'Reddit': 'bg-gradient-to-r from-orange-500 to-orange-600',
    'Twitter': 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Facebook': 'bg-gradient-to-r from-blue-600 to-blue-700',
    'Snapchat': 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    'Discord': 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    'Spotify': 'bg-gradient-to-r from-green-500 to-green-600',
    'Netflix': 'bg-gradient-to-r from-red-600 to-red-700',
    'Gmail': 'bg-gradient-to-r from-red-500 to-red-600',
    'Messages': 'bg-gradient-to-r from-green-500 to-green-600',
    'Phone': 'bg-gradient-to-r from-green-400 to-green-500',
    'Camera': 'bg-gradient-to-r from-gray-600 to-gray-700',
    'Photos': 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Maps': 'bg-gradient-to-r from-blue-500 to-blue-600',
    'Calendar': 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Notes': 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    'Calculator': 'bg-gradient-to-r from-gray-500 to-gray-600',
    'Weather': 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Mail': 'bg-gradient-to-r from-blue-500 to-blue-600',
    'App Store': 'bg-gradient-to-r from-blue-500 to-blue-600',
    'Music': 'bg-gradient-to-r from-pink-500 to-pink-600',
    'Podcasts': 'bg-gradient-to-r from-purple-500 to-purple-600',
    'Books': 'bg-gradient-to-r from-orange-500 to-orange-600',
    'Health': 'bg-gradient-to-r from-red-400 to-red-500',
    'Fitness': 'bg-gradient-to-r from-green-500 to-green-600',
    'Wallet': 'bg-gradient-to-r from-green-400 to-green-500',
    'Home': 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    'Shortcuts': 'bg-gradient-to-r from-purple-500 to-purple-600',
    'Files': 'bg-gradient-to-r from-blue-500 to-blue-600',
    'Clock': 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Alarm': 'bg-gradient-to-r from-orange-400 to-orange-500',
    'Timer': 'bg-gradient-to-r from-red-400 to-red-500',
    'Stopwatch': 'bg-gradient-to-r from-green-400 to-green-500',
    'vibecode': 'bg-gradient-to-r from-indigo-500 to-purple-600',
  };
  
  return appColors[appName] || 'bg-gradient-to-r from-gray-500 to-gray-600';
};

export function TodayTab() {
  const { getTodayStats } = useScreenTimeStore();
  const { user } = useAuth();
  
  // Fetch real screen time data from Supabase
  const { entries, loading, error, refetch } = useScreenTimeData(
    user?.uid, 
    getTodayDateString()
  );

  // Fetch friends daily activity
  const {
    data: dailyActivityData,
    loading: dailyLoading,
    error: dailyError,
    refetch: refetchDaily
  } = useDailyActivity(user?.uid);
  
  const todayStats = getTodayStats();
  const currentScreenTime = todayStats.totalTime / (1000 * 60 * 60); // Convert to hours
  const goal = 6.0; // 6 hours goal
  const isUnderGoal = currentScreenTime < goal;
  const progress = Math.min((currentScreenTime / goal) * 100, 100);

  // Get the most recent entry for today
  const todayEntry = entries.length > 0 ? entries[0] : null; // Most recent entry
  
  // Calculate total screen time from Supabase data
  const supabaseScreenTime = todayEntry ? parseTimeToMinutes(todayEntry.total_time) / 60 : 0;
  
  // Use Supabase data if available, otherwise fall back to local tracking
  const displayScreenTime = todayEntry ? supabaseScreenTime : currentScreenTime;
  const displayProgress = Math.min((displayScreenTime / goal) * 100, 100);

  // Get top apps from Supabase data
  const topApps = todayEntry?.apps?.slice(0, 4) || [];

  // Check if the entry is actually from today
  const isFromToday = todayEntry && todayEntry.date.toLowerCase().includes('today');

  return (
    <div className="p-4 pb-20 space-y-6 bg-gradient-to-b from-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl">📱</div>
        <h1 className="text-xl font-semibold">Today&apos;s Vibe Check</h1>
        <p className="text-sm text-muted-foreground">
          {getTodayDateString()}
        </p>
      </div>

      {/* Your Progress */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm opacity-90">Your Screen Time</p>
              <p className="text-3xl font-bold">{formatTime(displayScreenTime)}</p>
              {loading && (
                <div className="flex items-center gap-2 text-xs opacity-75">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading data...
                </div>
              )}
              {todayEntry && (
                <div className="text-xs opacity-75">
                  Data from: {todayEntry.date}
                  {!isFromToday && (
                    <span className="text-yellow-300 ml-1">(Most recent)</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm opacity-90">Goal: {formatTime(goal)}</p>
              <div className="flex items-center gap-2">
                {displayScreenTime < goal ? (
                  <>
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Crushing it! 🎉</span>
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Keep going!</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Progress value={displayProgress} className="h-2 bg-white/20" />
          <p className="text-xs mt-2 opacity-75">
            {Math.round(displayProgress)}% of daily goal
          </p>
        </CardContent>
      </Card>

      {/* Screen Time Upload Component */}
      <ScreenTimeUpload onUploadSuccess={refetch} />

      {/* Top Apps */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold">Top Apps Today</h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
            {todayEntry && !isFromToday && (
              <Badge variant="secondary" className="text-xs">
                Most Recent
              </Badge>
            )}
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">
              Error loading data: {error}
            </div>
          )}
          
          {topApps.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {topApps.map((app, index) => (
                <div key={index} className={`${getAppColor(app.name)} p-3 rounded-xl text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{getAppEmoji(app.name)}</span>
                    <span className="text-xs font-medium">{app.time}</span>
                  </div>
                  <p className="text-sm font-medium">{app.name}</p>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm">No app data available</p>
              <p className="text-xs">Upload your screen time to see your top apps</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 p-3 rounded-xl animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friends Daily Activity */}
      {dailyLoading && !dailyActivityData ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Loading friends activity...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : dailyActivityData ? (
        <FriendsDailyActivity 
          data={dailyActivityData.dailyActivity}
          totalFriends={dailyActivityData.totalFriends}
          onRefresh={refetchDaily}
          loading={dailyLoading}
        />
      ) : null}


    </div>
  );
} 