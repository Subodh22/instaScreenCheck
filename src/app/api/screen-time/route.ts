import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { serverStorage } from '../../../lib/serverStorage';

// Helper function to validate Firebase UID
function isValidFirebaseUID(uid: string): boolean {
  return uid && uid.length > 0 && uid !== 'anonymous';
}

// Helper function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, total_time, apps, categories, updated_at, user_id } = body;

    // Try Supabase first (only if we have a valid Firebase UID and Supabase is configured)
    if (isValidFirebaseUID(user_id) && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin
          .from('screen_time_entries')
          .insert([
            {
              date,
              total_time,
              apps,
              categories,
              updated_at,
              user_id
            }
          ])
          .select();

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Supabase error: ${error.message}`);
        }

        console.log('Successfully saved to Supabase:', data);
        return NextResponse.json({ success: true, data, source: 'supabase' });
      } catch (supabaseError) {
        console.log('Supabase failed, using server storage:', supabaseError);
      }
    } else {
      console.log('Skipping Supabase - Firebase UID invalid or Supabase not configured');
    }
    
    // Fallback to server storage
    const savedEntry = serverStorage.saveEntry({
      date,
      total_time,
      apps,
      categories,
      updated_at,
      user_id
    });

    return NextResponse.json({ 
      success: true, 
      data: savedEntry, 
      source: 'serverStorage',
      message: 'Data saved to server memory successfully!'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const date = searchParams.get('date');

    // Try Supabase first (only if properly configured)
    if (isSupabaseConfigured()) {
      try {
        let query = supabaseAdmin
          .from('screen_time_entries')
          .select('*');

        if (userId) {
          query = query.eq('user_id', userId);
        }

        if (date) {
          query = query.eq('date', date);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Supabase error: ${error.message}`);
        }

        return NextResponse.json({ success: true, data, source: 'supabase' });
      } catch (supabaseError) {
        console.log('Supabase failed, using server storage:', supabaseError);
      }
    } else {
      console.log('Skipping Supabase - not properly configured');
    }
    
    // Fallback to server storage
    let entries = serverStorage.getAllEntries();
    
    if (userId) {
      entries = entries.filter(entry => entry.user_id === userId);
    }
    
    if (date) {
      entries = entries.filter(entry => entry.date === date);
    }
    
    // Sort by created_at descending
    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ 
      success: true, 
      data: entries, 
      source: 'serverStorage',
      message: 'Data retrieved from server memory successfully!'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 