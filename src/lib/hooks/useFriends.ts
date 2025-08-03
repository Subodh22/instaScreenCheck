import { useState, useEffect } from 'react';

export interface User {
  firebase_uid: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface FriendsData {
  friends: User[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  sendFriendRequest: (receiverEmail: string) => Promise<{ success: boolean; message: string }>;
  respondToRequest: (requestId: string, action: 'accept' | 'reject') => Promise<{ success: boolean; message: string }>;
  searchUsers: (email: string) => Promise<User[]>;
  createUserProfile: (userData: { firebase_uid: string; email: string; display_name?: string; avatar_url?: string }) => Promise<{ success: boolean; message: string }>;
}

export function useFriends(userId?: string): FriendsData {
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendsData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/friends?user_id=${userId}`);
      const result = await response.json();

      if (result.success) {
        setFriends(result.data.friends || []);
        setPendingRequests(result.data.pendingRequests || []);
        setSentRequests(result.data.sentRequests || []);
      } else {
        setError(result.error || 'Failed to fetch friends data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (receiverEmail: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: userId,
          receiverEmail
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchFriendsData(); // Refresh data
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error };
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to send friend request' };
    }
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'reject'): Promise<{ success: boolean; message: string }> => {
    if (!userId) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/friends/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
          userId
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchFriendsData(); // Refresh data
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error };
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to respond to request' };
    }
  };

  const searchUsers = async (email: string): Promise<User[]> => {
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (result.success) {
        return result.data || [];
      } else {
        console.error('Error searching users:', result.error);
        return [];
      }
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  };

  const createUserProfile = async (userData: { firebase_uid: string; email: string; display_name?: string; avatar_url?: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error };
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to create user profile' };
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, [userId, fetchFriendsData]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    refetch: fetchFriendsData,
    sendFriendRequest,
    respondToRequest,
    searchUsers,
    createUserProfile,
  };
} 