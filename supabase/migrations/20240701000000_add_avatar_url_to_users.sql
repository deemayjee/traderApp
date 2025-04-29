-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a function to sync avatar_url between user_profiles and users
CREATE OR REPLACE FUNCTION sync_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If avatar_url is updated in user_profiles, update it in users
    UPDATE users
    SET avatar_url = NEW.avatar_url
    WHERE wallet_address = NEW.wallet_address;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync avatar_url from user_profiles to users
DROP TRIGGER IF EXISTS sync_avatar_url_trigger ON user_profiles;
CREATE TRIGGER sync_avatar_url_trigger
AFTER INSERT OR UPDATE OF avatar_url ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_avatar_url();

-- Sync existing avatar_url values from user_profiles to users
UPDATE users u
SET avatar_url = up.avatar_url
FROM user_profiles up
WHERE u.wallet_address = up.wallet_address
AND up.avatar_url IS NOT NULL; 