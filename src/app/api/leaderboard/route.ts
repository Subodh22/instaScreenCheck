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

// Helper function to check if a date entry represents today
function isTodayEntry(dateString: string): boolean {
  const today = new Date();

  // Simple check: if it contains "Today", it's today
  if (dateString.toLowerCase().includes('today')) {
    return true;
  }

  // Check if it contains today's date number and month
  const todayDay = today.getDate();
  const todayMonth = today.toLocaleDateString('en-US', { month: 'long' });

  if (dateString.includes(todayDay.toString()) && dateString.includes(todayMonth)) {
    return true;
  }

  return false;
}

// GET - Get leaderboard data for friends
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

    // Get friend user details
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, email, display_name, avatar_url')
      .in('firebase_uid', allUserIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get today's screen time data for all users
    const { data: screenTimeData, error: screenTimeError } = await supabaseAdmin
      .from('screen_time_entries')
      .select('*')
      .in('user_id', allUserIds);

    if (screenTimeError) {
      console.error('Error fetching screen time data:', screenTimeError);
      return NextResponse.json({ error: 'Failed to fetch screen time data' }, { status: 500 });
    }

    // Filter for today's entries and create leaderboard
    const leaderboardData = users?.map(user => {
      const userScreenTime = screenTimeData?.find(entry => 
        entry.user_id === user.firebase_uid && isTodayEntry(entry.date)
      );

      if (userScreenTime) {
        const totalMinutes = parseTimeToMinutes(userScreenTime.total_time);
        return {
          user: {
            firebase_uid: user.firebase_uid,
            email: user.email,
            display_name: user.display_name,
            avatar_url: user.avatar_url
          },
          screenTime: userScreenTime.total_time,
          totalMinutes: totalMinutes,
          apps: userScreenTime.apps || [],
          categories: userScreenTime.categories || [],
          isCurrentUser: user.firebase_uid === userId
        };
      } else {
        // User has no screen time data for today
        return {
          user: {
            firebase_uid: user.firebase_uid,
            email: user.email,
            display_name: user.display_name,
            avatar_url: user.avatar_url
          },
          screenTime: '0m',
          totalMinutes: 0,
          apps: [],
          categories: [],
          isCurrentUser: user.firebase_uid === userId
        };
      }
    }) || [];

    // Sort by total minutes (descending - highest first)
    leaderboardData.sort((a, b) => b.totalMinutes - a.totalMinutes);

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