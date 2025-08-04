'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  Clock, 
  Loader2,
  Send,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { useFriends, User, FriendRequest } from '../lib/hooks/useFriends';
import { useWeeklyActivity } from '../lib/hooks/useWeeklyActivity';
import { WeeklyActivityCard } from './WeeklyActivityCard';

export function FriendsTab() {
  const { user } = useAuth();
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    refetch,
    sendFriendRequest,
    respondToRequest,
    searchUsers,
    createUserProfile
  } = useFriends(user?.uid);

  const {
    data: weeklyActivityData,
    loading: weeklyLoading,
    error: weeklyError,
    refetch: refetchWeekly
  } = useWeeklyActivity(user?.uid);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [respondingToRequest, setRespondingToRequest] = useState<string | null>(null);

  // Create user profile when component mounts
  useEffect(() => {
    if (user && user.email) {
      createUserProfile({
        firebase_uid: user.uid,
        email: user.email,
        display_name: user.displayName || undefined,
        avatar_url: user.photoURL || undefined
      });
    }
  }, [user, createUserProfile]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;

    setSearching(true);
    try {
      const results = await searchUsers(searchEmail);
      setSearchResults(results.filter(u => u.firebase_uid !== user?.uid)); // Exclude current user
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (receiverEmail: string) => {
    setSendingRequest(receiverEmail);
    try {
      const result = await sendFriendRequest(receiverEmail);
      if (result.success) {
        setSearchResults(prev => prev.filter(u => u.email !== receiverEmail));
        setSearchEmail('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setRespondingToRequest(requestId);
    try {
      const result = await respondToRequest(requestId, action);
      if (result.success) {
        await refetch();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to respond to request');
    } finally {
      setRespondingToRequest(null);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.firebase_uid === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return pendingRequests.some(req => req.sender?.firebase_uid === userId) ||
           sentRequests.some(req => req.receiver?.firebase_uid === userId);
  };

  if (!user) {
    return (
      <div className="p-4 pb-20 space-y-6 bg-gradient-to-b from-blue-50 to-purple-50 min-h-screen">
        <div className="text-center space-y-2 pt-2">
          <div className="text-4xl">👥</div>
          <h1 className="text-xl font-semibold">Friends</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your friends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6 bg-gradient-to-b from-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl">👥</div>
        <h1 className="text-xl font-semibold">Friends</h1>
        <p className="text-sm text-muted-foreground">Connect with friends and track together</p>
      </div>

      {/* Weekly Activity Challenge */}
      {weeklyLoading && !weeklyActivityData ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Loading weekly activity...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : weeklyActivityData ? (
        <WeeklyActivityCard 
          data={weeklyActivityData.weeklyActivity}
          weekRange={weeklyActivityData.weekRange}
          onRefresh={refetchWeekly}
          loading={weeklyLoading}
        />
      ) : null}

      {/* Add Friends Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold">Add Friends</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Search Results:</h4>
                {searchResults.map((user) => (
                  <div key={user.firebase_uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.display_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.display_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAlreadyFriend(user.firebase_uid) ? (
                        <Badge variant="secondary" className="text-xs">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Friends
                        </Badge>
                      ) : hasPendingRequest(user.firebase_uid) ? (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user.email)}
                          disabled={sendingRequest === user.email}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {sendingRequest === user.email ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold">Pending Requests</h3>
            <Badge variant="secondary" className="text-xs">{pendingRequests.length}</Badge>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.sender?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(request.sender?.display_name, request.sender?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{request.sender?.display_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{request.sender?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespondToRequest(request.id, 'accept')}
                      disabled={respondingToRequest === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {respondingToRequest === request.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespondToRequest(request.id, 'reject')}
                      disabled={respondingToRequest === request.id}
                    >
                      {respondingToRequest === request.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Requests */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold">Sent Requests</h3>
            <Badge variant="secondary" className="text-xs">{sentRequests.length}</Badge>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No sent requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.receiver?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(request.receiver?.display_name, request.receiver?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{request.receiver?.display_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{request.receiver?.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friends List */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold">Your Friends</h3>
            <Badge variant="secondary" className="text-xs">{friends.length}</Badge>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p className="text-sm">{error}</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm">No friends yet</p>
              <p className="text-xs">Search for friends by email to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.firebase_uid} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(friend.display_name, friend.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{friend.display_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Friends
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 