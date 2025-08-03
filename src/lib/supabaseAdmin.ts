import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if we have the required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables. Supabase features will be disabled.');
}

// Admin client that bypasses RLS (use service role key in production)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) 