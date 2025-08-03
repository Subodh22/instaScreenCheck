import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Helper function to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// GET - Get user profile or search users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    if (userId) {
      // Get specific user profile
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('firebase_uid, email, display_name, avatar_url, created_at')
        .eq('firebase_uid', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: user });
    }

    if (email) {
      // Search users by email
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('firebase_uid, email, display_name, avatar_url')
        .ilike('email', `%${email}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: users || [] });
    }

    return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebase_uid, email, display_name, avatar_url } = body;

    if (!firebase_uid || !email) {
      return NextResponse.json({ error: 'Firebase UID and email are required' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', firebase_uid)
      .single();

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email,
          display_name,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('firebase_uid', firebase_uid)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'User profile updated successfully'
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            firebase_uid,
            email,
            display_name,
            avatar_url
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: newUser,
        message: 'User profile created successfully'
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 