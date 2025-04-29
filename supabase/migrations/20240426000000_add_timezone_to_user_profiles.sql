-- Add timezone column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- Update existing rows to have UTC as default timezone
UPDATE user_profiles
SET timezone = 'UTC'
WHERE timezone IS NULL; 