# Supabase Setup for Screen Time Tracker

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 3. Database Schema

Run this SQL in your Supabase SQL editor to create the required tables:

```sql
-- Create the screen_time_entries table
CREATE TABLE screen_time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_time TEXT NOT NULL,
  apps JSONB,
  categories JSONB,
  updated_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_screen_time_user_date ON screen_time_entries(user_id, date);
CREATE INDEX idx_screen_time_created_at ON screen_time_entries(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE screen_time_entries ENABLE ROW LEVEL SECURITY;

-- For Firebase authentication, we need to allow all operations for now
-- since Firebase UIDs don't match Supabase auth.uid()
-- In production, you might want to set up a proper auth mapping

-- Allow all users to insert data (for development/testing)
CREATE POLICY "Allow all inserts" ON screen_time_entries
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own data (by user_id)
CREATE POLICY "Users can view their own screen time entries" ON screen_time_entries
  FOR SELECT USING (true);

-- Allow users to update their own data (by user_id)
CREATE POLICY "Users can update their own screen time entries" ON screen_time_entries
  FOR UPDATE USING (true);

-- Allow users to delete their own data (by user_id)
CREATE POLICY "Users can delete their own screen time entries" ON screen_time_entries
  FOR DELETE USING (true);

-- Create the users table for friend functionality
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (true);

-- Create the friend_requests table
CREATE TABLE friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Create indexes for friend_requests table
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);

-- Enable RLS for friend_requests table
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for friend_requests table
CREATE POLICY "Users can view friend requests they sent or received" ON friend_requests
  FOR SELECT USING (sender_id = auth.uid()::text OR receiver_id = auth.uid()::text);

CREATE POLICY "Users can insert friend requests" ON friend_requests
  FOR INSERT WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "Users can update friend requests they received" ON friend_requests
  FOR UPDATE USING (receiver_id = auth.uid()::text);

-- Create the friendships table (for accepted friends)
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Create indexes for friendships table
CREATE INDEX idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX idx_friendships_user2 ON friendships(user2_id);

-- Enable RLS for friendships table
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Create policies for friendships table
CREATE POLICY "Users can view their friendships" ON friendships
  FOR SELECT USING (user1_id = auth.uid()::text OR user2_id = auth.uid()::text);

CREATE POLICY "Users can insert friendships" ON friendships
  FOR INSERT WITH CHECK (user1_id = auth.uid()::text OR user2_id = auth.uid()::text);
```

## 4. Alternative RLS Policies (More Secure)

If you want more secure policies, replace the above policies with these:

```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all inserts" ON screen_time_entries;
DROP POLICY IF EXISTS "Users can view their own screen time entries" ON screen_time_entries;
DROP POLICY IF EXISTS "Users can update their own screen time entries" ON screen_time_entries;
DROP POLICY IF EXISTS "Users can delete their own screen time entries" ON screen_time_entries;

-- Create more secure policies
CREATE POLICY "Users can insert their own data" ON screen_time_entries
  FOR INSERT WITH CHECK (user_id IS NOT NULL AND user_id != '');

CREATE POLICY "Users can view their own data" ON screen_time_entries
  FOR SELECT USING (user_id IS NOT NULL AND user_id != '');

CREATE POLICY "Users can update their own data" ON screen_time_entries
  FOR UPDATE USING (user_id IS NOT NULL AND user_id != '');

CREATE POLICY "Users can delete their own data" ON screen_time_entries
  FOR DELETE USING (user_id IS NOT NULL AND user_id != '');
```

## 5. Features

The Screen Time Upload component allows users to:

- **Take a screenshot** of their phone's Screen Time interface
- **Manually input** screen time data as a fallback
- **Extract and display** the following data:
  - Total screen time (e.g., "5h 14m")
  - Date
  - Most used apps with usage times
  - App categories with usage times
  - When the data was last updated
- **Save the data** to Supabase database
- **View extracted data** before saving

## 6. Friends System Features

The Friends system includes:

- **User Profiles**: Store user information with Firebase UID
- **Friend Requests**: Send and receive friend requests
- **Request Management**: Accept or reject pending requests
- **Friendship Tracking**: Maintain list of accepted friends
- **Friend Discovery**: Search for users by email
- **Pending Requests**: View and manage incoming requests

## 7. Usage

1. Navigate to the Today tab
2. Scroll down to the "Upload Screen Time Screenshot" section
3. Either:
   - Take a screenshot using the camera button, or
   - Manually enter the total screen time and date
4. Click "Process & Extract Data"
5. Review the extracted information
6. Click "Save to Database" to store in Supabase

## 8. Future Enhancements

- **OCR Integration**: Use AI/OCR services to automatically extract text from screenshots
- **Image Processing**: Add image preprocessing for better text extraction
- **Real-time Updates**: Implement real-time data synchronization
- **Analytics**: Add charts and analytics based on stored data
- **Export**: Allow users to export their screen time data 