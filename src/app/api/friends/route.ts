import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Helper function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// GET - Get user's friends, pending requests, and sent requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get user's friends
    const { data: friendships, error: friendshipsError } = await supabaseAdmin
      .from('friendships')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (friendshipsError) {
      console.error('Error fetching friendships:', friendshipsError);
      return NextResponse.json({ error: 'Failed to fetch friendships' }, { status: 500 });
    }

    // Get friend user IDs
    const friendIds = friendships?.map(friendship => 
      friendship.user1_id === userId ? friendship.user2_id : friendship.user1_id
    ) || [];

    // Get friend user details
    const { data: friends, error: friendsError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name, avatar_url')
      .in('firebase_uid', friendIds);

    if (friendsError) {
      console.error('Error fetching friends:', friendsError);
      return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
    }

    // Get pending friend requests (received)
    const { data: pendingRequests, error: pendingError } = await supabaseAdmin
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending requests:', pendingError);
      return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 });
    }

    // Get sender details for pending requests
    const pendingSenderIds = pendingRequests?.map(req => req.sender_id) || [];
    const { data: pendingSenders, error: sendersError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name, avatar_url')
      .in('firebase_uid', pendingSenderIds);

    if (sendersError) {
      console.error('Error fetching pending senders:', sendersError);
    }

    // Combine pending requests with sender data
    const pendingRequestsWithSenders = pendingRequests?.map(request => ({
      ...request,
      sender: pendingSenders?.find(sender => sender.firebase_uid === request.sender_id)
    })) || [];

    // Get sent friend requests
    const { data: sentRequests, error: sentError } = await supabaseAdmin
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (sentError) {
      console.error('Error fetching sent requests:', sentError);
      return NextResponse.json({ error: 'Failed to fetch sent requests' }, { status: 500 });
    }

    // Get receiver details for sent requests
    const sentReceiverIds = sentRequests?.map(req => req.receiver_id) || [];
    const { data: sentReceivers, error: receiversError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name, avatar_url')
      .in('firebase_uid', sentReceiverIds);

    if (receiversError) {
      console.error('Error fetching sent receivers:', receiversError);
    }

    // Combine sent requests with receiver data
    const sentRequestsWithReceivers = sentRequests?.map(request => ({
      ...request,
      receiver: sentReceivers?.find(receiver => receiver.firebase_uid === request.receiver_id)
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        friends: friends || [],
        pendingRequests: pendingRequestsWithSenders || [],
        sentRequests: sentRequestsWithReceivers || []
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send friend request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverEmail } = body;

    if (!senderId || !receiverEmail) {
      return NextResponse.json({ error: 'Sender ID and receiver email are required' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Find receiver by email
    const { data: receiver, error: receiverError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name')
      .eq('email', receiverEmail)
      .single();

    if (receiverError || !receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (receiver.firebase_uid === senderId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabaseAdmin
      .from('friendships')
      .select('*')
      .or(`user1_id.eq.${senderId},user2_id.eq.${senderId}`)
      .or(`user1_id.eq.${receiver.firebase_uid},user2_id.eq.${receiver.firebase_uid}`);

    if (existingFriendship && existingFriendship.length > 0) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    // Check if friend request already exists
    const { data: existingRequest } = await supabaseAdmin
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiver.firebase_uid}),and(sender_id.eq.${receiver.firebase_uid},receiver_id.eq.${senderId})`);

    if (existingRequest && existingRequest.length > 0) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
    }

    // Create friend request
    const { data: friendRequest, error: requestError } = await supabaseAdmin
      .from('friend_requests')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiver.firebase_uid,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (requestError) {
      console.error('Error creating friend request:', requestError);
      return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: friendRequest,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 