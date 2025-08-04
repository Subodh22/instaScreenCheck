'use client';

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Users, RefreshCw, Flame } from 'lucide-react';
import { DailyActivityEntry } from '../lib/hooks/useDailyActivity';

interface FriendsDailyActivityProps {
  data: DailyActivityEntry[];
  totalFriends: number;
  onRefresh?: () => void;
  loading?: boolean;
}

export function FriendsDailyActivity({ data, totalFriends, onRefresh, loading }: FriendsDailyActivityProps) {
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.split('@')[0].slice(0, 2).toUpperCase();
    }
    return '??';
  };

  const getAvatarColor = (name?: string, email?: string) => {
    const text = name || email || '';
    const colors = [
      'bg-green-500',
      'bg-blue-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500'
    ];
    const index = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (data.length === 0) {
    return (
      <Card className="w-full border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-blue-600" />
              Friends Update
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              0 friends
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">No friends yet</p>
            <p className="text-xs">Add friends to see their daily activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-600" />
            Friends Update
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalFriends} friends
            </Badge>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
              <Avatar className={`w-10 h-10 ${getAvatarColor(entry.user.display_name, entry.user.email)}`}>
                <AvatarImage src={entry.user.avatar_url || undefined} />
                <AvatarFallback className="text-white text-sm font-medium">
                  {getInitials(entry.user.display_name, entry.user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {entry.user.display_name || entry.user.email.split('@')[0]}
                  </span>
                  <span className={`text-lg ${entry.status.color}`}>
                    {entry.status.emoji}
                  </span>
                  {entry.isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="font-medium">
                    {entry.dailyStats.screenTime} today
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-lg ${entry.status.color}`}>
                {entry.status.emoji}
              </span>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Daily Challenge</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            See how your friends are doing today! Lower screen time = better performance. 🏆
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 