import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Helper function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Helper function to get today's date in the format used by the app
function getTodayDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Helper function to send notification (placeholder for now)
async function sendNotification(userId: string, message: string) {
  console.log(`Sending notification to user ${userId}: ${message}`);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const todayDate = getTodayDate();

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name, notification_preferences');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get users who have uploaded today
    const { data: todayUploads, error: uploadsError } = await supabaseAdmin
      .from('screen_time_entries')
      .select('user_id')
      .eq('date', todayDate);

    if (uploadsError) {
      console.error('Error fetching today\'s uploads:', uploadsError);
      return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
    }

    // Get user IDs who have uploaded today
    const uploadedUserIds = todayUploads?.map(entry => entry.user_id) || [];

    // Find users who haven't uploaded today
    const usersToNotify = users?.filter(user => 
      !uploadedUserIds.includes(user.firebase_uid)
    ) || [];

    // Send notifications
    const notificationResults = await Promise.allSettled(
      usersToNotify.map(user => {
        const message = `Hey ${user.display_name || user.email.split('@')[0]}! Don't forget to upload your screen time screenshot for today. 📱⏰`;
        return sendNotification(user.firebase_uid, message);
      })
    );

    // Count successful notifications
    const successfulNotifications = notificationResults.filter(
      result => result.status === 'fulfilled'
    ).length;

    return NextResponse.json({
      success: true,
      message: `Test: Sent ${successfulNotifications} reminders`,
      totalUsers: users?.length || 0,
      usersNotified: usersToNotify.length,
      usersAlreadyUploaded: uploadedUserIds.length,
      todayDate,
      usersToNotify: usersToNotify.map(user => ({
        id: user.firebase_uid,
        name: user.display_name || user.email.split('@')[0],
        email: user.email
      }))
    });

  } catch (error) {
    console.error('Test notification API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 