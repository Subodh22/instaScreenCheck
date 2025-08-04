import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { serverStorage } from '../../../../lib/serverStorage';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const todayDate = getTodayDate();

    // Try Supabase first (only if properly configured)
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin
          .from('screen_time_entries')
          .select('*')
          .eq('user_id', userId)
          .eq('date', todayDate)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Supabase error: ${error.message}`);
        }

        const hasUploadedToday = data && data.length > 0;
        
        return NextResponse.json({ 
          success: true, 
          hasUploadedToday,
          existingEntry: hasUploadedToday ? data[0] : null,
          source: 'supabase' 
        });
      } catch (supabaseError) {
        console.log('Supabase failed, using server storage:', supabaseError);
      }
    } else {
      console.log('Skipping Supabase - not properly configured');
    }
    
    // Fallback to server storage
    const entries = serverStorage.getAllEntries();
    const todayEntries = entries.filter(entry => 
      entry.user_id === userId && entry.date === todayDate
    );
    
    const hasUploadedToday = todayEntries.length > 0;
    const existingEntry = hasUploadedToday ? todayEntries[0] : null;

    return NextResponse.json({ 
      success: true, 
      hasUploadedToday,
      existingEntry,
      source: 'serverStorage',
      message: 'Data retrieved from server memory successfully!'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 