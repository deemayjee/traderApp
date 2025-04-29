-- Update user_profiles table schema
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS display_name;

-- Add new columns if they don't exist
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create new policies with more permissive rules
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (true);  -- Allow all users to view profiles

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (true);  -- Allow all authenticated users to update

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);  -- Allow all authenticated users to insert

-- Drop existing constraints if they exist
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS unique_username,
  DROP CONSTRAINT IF EXISTS unique_email,
  DROP CONSTRAINT IF EXISTS user_profiles_wallet_address_key;

-- Add case-insensitive unique constraint for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username_lower ON user_profiles (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_lower ON user_profiles (LOWER(email));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a function to check if username exists
CREATE OR REPLACE FUNCTION username_exists(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE LOWER(username) = LOWER(p_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle profile updates
CREATE OR REPLACE FUNCTION update_user_profile(
  p_wallet_address TEXT,
  p_username TEXT,
  p_bio TEXT,
  p_timezone TEXT,
  p_public_profile BOOLEAN,
  p_email TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS user_profiles AS $$
DECLARE
  v_current_username TEXT;
  v_wallet_exists BOOLEAN;
  v_result user_profiles;
BEGIN
  -- Check if wallet exists
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE wallet_address = p_wallet_address
  ) INTO v_wallet_exists;

  -- If wallet exists, get current username
  IF v_wallet_exists THEN
    SELECT username INTO v_current_username
    FROM user_profiles
    WHERE wallet_address = p_wallet_address;

    -- If username is being changed and new username exists (case-insensitive)
    IF v_current_username IS DISTINCT FROM p_username AND p_username IS NOT NULL AND username_exists(p_username) THEN
      RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Update existing profile
    UPDATE user_profiles
    SET 
      username = COALESCE(p_username, username),
      bio = COALESCE(p_bio, bio),
      timezone = COALESCE(p_timezone, timezone),
      public_profile = COALESCE(p_public_profile, public_profile),
      email = COALESCE(p_email, email),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE wallet_address = p_wallet_address
    RETURNING * INTO v_result;
  ELSE
    -- Check if username exists before inserting
    IF p_username IS NOT NULL AND username_exists(p_username) THEN
      RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Insert new profile
    INSERT INTO user_profiles (
      wallet_address,
      username,
      bio,
      timezone,
      public_profile,
      email,
      avatar_url,
      updated_at
    ) VALUES (
      p_wallet_address,
      p_username,
      p_bio,
      p_timezone,
      p_public_profile,
      p_email,
      p_avatar_url,
      CURRENT_TIMESTAMP
    )
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 