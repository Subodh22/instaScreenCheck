import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Helper function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Helper function to parse time string to minutes
function parseTimeToMinutes(timeString: string): number {
  const hoursMatch = timeString.match(/(\d+)h/);
  const minutesMatch = timeString.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

// Helper function to format minutes back to readable time
function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Helper function to get the start and end of the current week (Monday to Sunday)
function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { start: startOfWeek, end: endOfWeek };
}

// GET - Get friends' weekly screen time activity
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

    // Add current user to the list
    const allUserIds = [userId, ...friendIds];

    // Get user details
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name, avatar_url')
      .in('firebase_uid', allUserIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get this week's screen time data for all users
    const { start: weekStart, end: weekEnd } = getWeekRange();
    
    const { data: screenTimeData, error: screenTimeError } = await supabaseAdmin
      .from('screen_time_entries')
      .select('*')
      .in('user_id', allUserIds)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());

    if (screenTimeError) {
      console.error('Error fetching screen time data:', screenTimeError);
      return NextResponse.json({ error: 'Failed to fetch screen time data' }, { status: 500 });
    }

    // Calculate weekly totals for each user
    const weeklyActivity = users?.map(user => {
      const userEntries = screenTimeData?.filter(entry => entry.user_id === user.firebase_uid) || [];
      
      // Calculate total minutes for the week
      const totalMinutes = userEntries.reduce((total, entry) => {
        return total + parseTimeToMinutes(entry.total_time);
      }, 0);

      // Count days with data
      const daysWithData = userEntries.length;

      // Get the most recent entry for additional context
      const mostRecentEntry = userEntries.length > 0 
        ? userEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

      return {
        user: {
          firebase_uid: user.firebase_uid,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        },
        weeklyStats: {
          totalTime: formatMinutesToTime(totalMinutes),
          totalMinutes: totalMinutes,
          daysWithData: daysWithData,
          averagePerDay: daysWithData > 0 ? formatMinutesToTime(Math.round(totalMinutes / daysWithData)) : '0m',
          lastUpdated: mostRecentEntry?.created_at || null
        },
        isCurrentUser: user.firebase_uid === userId
      };
    }) || [];

    // Sort by total minutes (ascending - lowest first for screen time challenge)
    weeklyActivity.sort((a, b) => a.weeklyStats.totalMinutes - b.weeklyStats.totalMinutes);

    // Add rank to each entry
    const activityWithRanks = weeklyActivity.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json({
      success: true,
      data: {
        weeklyActivity: activityWithRanks,
        weekRange: {
          start: weekStart.toISOString(),
          end: weekEnd.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 