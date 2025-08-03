import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Helper function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// PUT - Accept or reject friend request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, userId } = body; // action: 'accept' or 'reject'

    if (!requestId || !action || !userId) {
      return NextResponse.json({ error: 'Request ID, action, and user ID are required' }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be accept or reject' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get the friend request
    const { data: friendRequest, error: requestError } = await supabaseAdmin
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (requestError || !friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    if (action === 'accept') {
      // Update friend request status to accepted
      const { error: updateError } = await supabaseAdmin
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating friend request:', updateError);
        return NextResponse.json({ error: 'Failed to accept friend request' }, { status: 500 });
      }

      // Create friendship record
      const user1Id = friendRequest.sender_id < friendRequest.receiver_id 
        ? friendRequest.sender_id 
        : friendRequest.receiver_id;
      const user2Id = friendRequest.sender_id < friendRequest.receiver_id 
        ? friendRequest.receiver_id 
        : friendRequest.sender_id;

      const { error: friendshipError } = await supabaseAdmin
        .from('friendships')
        .insert([
          {
            user1_id: user1Id,
            user2_id: user2Id
          }
        ]);

      if (friendshipError) {
        console.error('Error creating friendship:', friendshipError);
        return NextResponse.json({ error: 'Failed to create friendship' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Friend request accepted successfully'
      });

    } else if (action === 'reject') {
      // Update friend request status to rejected
      const { error: updateError } = await supabaseAdmin
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating friend request:', updateError);
        return NextResponse.json({ error: 'Failed to reject friend request' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Friend request rejected successfully'
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 