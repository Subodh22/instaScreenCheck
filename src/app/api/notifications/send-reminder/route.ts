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
  // This would integrate with a real notification service like:
  // - Firebase Cloud Messaging (FCM)
  // - Push notifications
  // - Email notifications
  // - SMS notifications
  
  console.log(`Sending notification to user ${userId}: ${message}`);
  
  // For now, we'll just log the notification
  // In a real implementation, you would:
  // 1. Get user's notification preferences
  // 2. Send via their preferred method
  // 3. Store notification history
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a scheduled task (add authentication in production)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const todayDate = getTodayDate();
    const currentHour = new Date().getHours();

    // Only send reminders around 10 PM (between 9:30 PM and 10:30 PM)
    if (currentHour < 21 || currentHour > 22) {
      return NextResponse.json({ 
        message: 'Not the right time for reminders',
        currentHour,
        shouldSend: false
      });
    }

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
      !uploadedUserIds.includes(user.firebase_uid) &&
      user.notification_preferences?.daily_reminders !== false // Check notification preferences
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

    // Store notification history
    const notificationHistory = usersToNotify.map(user => ({
      user_id: user.firebase_uid,
      type: 'daily_reminder',
      message: `Screen time upload reminder sent to ${user.display_name || user.email}`,
      sent_at: new Date().toISOString()
    }));

    // Save to notification history table (if it exists)
    try {
      await supabaseAdmin
        .from('notification_history')
        .insert(notificationHistory);
    } catch (error) {
      console.log('Notification history table not found, skipping history save');
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${successfulNotifications} reminders`,
      totalUsers: users?.length || 0,
      usersNotified: usersToNotify.length,
      usersAlreadyUploaded: uploadedUserIds.length,
      currentHour,
      todayDate
    });

  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 