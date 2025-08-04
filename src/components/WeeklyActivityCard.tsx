'use client';

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Trophy, Clock, Calendar, TrendingDown, Crown, Medal, RefreshCw } from 'lucide-react';
import { WeeklyActivityEntry } from '../lib/hooks/useWeeklyActivity';

interface WeeklyActivityCardProps {
  data: WeeklyActivityEntry[];
  weekRange: {
    start: string;
    end: string;
  };
  onRefresh?: () => void;
  loading?: boolean;
}

export function WeeklyActivityCard({ data, weekRange, onRefresh, loading }: WeeklyActivityCardProps) {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const startFormatted = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endFormatted = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.split('@')[0].slice(0, 2).toUpperCase();
    }
    return '??';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Weekly Screen Time Challenge
              </CardTitle>
              <p className="text-sm text-gray-500">
                {formatDateRange(weekRange.start, weekRange.end)}
              </p>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            No friends found. Add some friends to start competing!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Weekly Screen Time Challenge
        </CardTitle>
        <p className="text-sm text-gray-500">
          {formatDateRange(weekRange.start, weekRange.end)}
        </p>
        <p className="text-xs text-gray-400">
          Lowest total screen time wins! 🏆
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((entry, index) => (
          <div
            key={entry.user.firebase_uid}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              entry.isCurrentUser 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getRankIcon(entry.rank)}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.user.avatar_url || undefined} />
                  <AvatarFallback className="text-sm">
                    {getInitials(entry.user.display_name || undefined, entry.user.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {entry.user.display_name || entry.user.email.split('@')[0]}
                  </span>
                  {entry.isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{entry.weeklyStats.totalTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{entry.weeklyStats.daysWithData} days</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>Avg: {entry.weeklyStats.averagePerDay}</span>
                  </div>
                </div>
              </div>
            </div>

            <Badge className={getRankBadgeColor(entry.rank)}>
              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
            </Badge>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Weekly Challenge</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            The person with the lowest total screen time this week wins! 
            Keep track of your daily usage to stay competitive.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 