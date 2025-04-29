-- Drop existing columns from user_preferences table
ALTER TABLE user_preferences
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS compact_mode,
  DROP COLUMN IF EXISTS show_advanced_charts,
  DROP COLUMN IF EXISTS enable_animations;

-- Update theme column to have a check constraint
ALTER TABLE user_preferences
  ADD CONSTRAINT theme_check CHECK (theme IN ('light', 'dark'));

-- Update existing rows to ensure theme is valid
UPDATE user_preferences
SET theme = 'light'
WHERE theme NOT IN ('light', 'dark');

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Service role can access all tables" ON user_preferences;

-- Create new policies
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (wallet_address = auth.uid()::text);

CREATE POLICY "Service role can access all preferences"
    ON user_preferences FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role'); 