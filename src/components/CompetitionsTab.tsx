'use client';

import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Trophy, 
  Medal, 
  Crown, 
  Users, 
  Clock, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { useLeaderboard, LeaderboardEntry } from '../lib/hooks/useLeaderboard';

export function CompetitionsTab() {
  const { user } = useAuth();
  const { leaderboard, loading, error, refetch } = useLeaderboard(user?.uid);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Trophy className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  const getTopApps = (apps: any[]) => {
    if (!apps || apps.length === 0) return [];
    return apps.slice(0, 3); // Show top 3 apps
  };

  if (!user) {
    return (
      <div className="p-4 pb-20 space-y-6 bg-gradient-to-b from-purple-50 to-pink-50 min-h-screen">
        <div className="text-center space-y-2 pt-2">
          <div className="text-4xl">🏆</div>
          <h1 className="text-xl font-semibold">Competitions</h1>
          <p className="text-sm text-muted-foreground">Sign in to view the leaderboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6 bg-gradient-to-b from-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl">🏆</div>
        <h1 className="text-xl font-semibold">Today&apos;s Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Compete with your friends for the lowest screen time</p>
      </div>

      {/* Leaderboard */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold">Screen Time Challenge</h3>
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {leaderboard.length} Participants
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="ml-auto"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p className="text-sm">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm">No friends to compete with yet</p>
              <p className="text-xs">Add friends to see the leaderboard</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div 
                  key={entry.user.firebase_uid} 
                  className={`flex items-center justify-between p-4 rounded-xl ${getRankColor(entry.rank)} ${
                    entry.isCurrentUser ? 'ring-2 ring-purple-400' : ''
                  }`}
                >
                  {/* Rank and User Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(entry.rank)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(entry.user.display_name, entry.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {entry.user.display_name || entry.user.email.split('@')[0]}
                        </p>
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs opacity-75">
                        {entry.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Screen Time and Apps */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-bold text-sm">{entry.screenTime}</span>
                      </div>
                      {entry.apps.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs opacity-75">Top:</span>
                          {getTopApps(entry.apps).map((app, index) => (
                            <span key={index} className="text-xs bg-black bg-opacity-10 px-1 rounded">
                              {app.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competition Stats */}
      {leaderboard.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <div className="text-3xl">🎯</div>
              <h3 className="text-lg font-semibold">Today&apos;s Challenge</h3>
              <p className="text-sm opacity-90">
                {leaderboard.length > 1 
                  ? `${leaderboard.length} friends competing for the lowest screen time!`
                  : 'Add more friends to start competing!'
                }
              </p>
              
              {leaderboard.length > 1 && (
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">🥇</div>
                    <div className="text-xs opacity-75">Winner</div>
                    <div className="text-sm font-medium">
                      {leaderboard[0]?.user.display_name || leaderboard[0]?.user.email.split('@')[0]}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{leaderboard[0]?.screenTime || '0m'}</div>
                    <div className="text-xs opacity-75">Best Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {leaderboard.find(entry => entry.isCurrentUser)?.rank || 'N/A'}
                    </div>
                    <div className="text-xs opacity-75">Your Rank</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold">Tips to Win</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Set app limits and use focus mode</p>
            <p>• Turn off notifications during work hours</p>
            <p>• Use grayscale mode to reduce engagement</p>
            <p>• Keep your phone in another room while sleeping</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 