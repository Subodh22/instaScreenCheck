import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

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

// Helper function to get the start and end of the current month
function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  return { start: startOfMonth, end: endOfMonth };
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

// GET - Get leaderboard data for all users
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

    // Get all users from the database
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name, avatar_url');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get all user IDs
    const allUserIds = users?.map(user => user.firebase_uid) || [];

    // Get this month's screen time data for all users
    const { start: monthStart, end: monthEnd } = getMonthRange();
    
    const { data: screenTimeData, error: screenTimeError } = await supabaseAdmin
      .from('screen_time_entries')
      .select('*')
      .in('user_id', allUserIds)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString());

    if (screenTimeError) {
      console.error('Error fetching screen time data:', screenTimeError);
      return NextResponse.json({ error: 'Failed to fetch screen time data' }, { status: 500 });
    }

    // Calculate monthly totals for each user
    const leaderboardData = users?.map(user => {
      const userEntries = screenTimeData?.filter(entry => entry.user_id === user.firebase_uid) || [];
      
      // Calculate total minutes for the month
      const totalMinutes = userEntries.reduce((total, entry) => {
        return total + parseTimeToMinutes(entry.total_time);
      }, 0);

      return {
        user: {
          firebase_uid: user.firebase_uid,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        },
        screenTime: formatMinutesToTime(totalMinutes),
        totalMinutes: totalMinutes,
        apps: [], // No apps for weekly view
        categories: [], // No categories for weekly view
        isCurrentUser: user.firebase_uid === userId
      };
    }) || [];

    // Sort by total minutes (ascending - lowest first)
    leaderboardData.sort((a, b) => a.totalMinutes - b.totalMinutes);

    // Add rank to each entry
    const leaderboardWithRanks = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json({
      success: true,
      data: leaderboardWithRanks
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 