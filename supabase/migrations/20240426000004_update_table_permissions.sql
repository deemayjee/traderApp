-- Grant permissions to authenticated users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to users table
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;
GRANT SELECT ON users TO anon;

-- Grant access to wallets table
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO service_role;
GRANT SELECT ON wallets TO anon;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can insert their own data"
    ON users FOR INSERT
    WITH CHECK (wallet_address = auth.uid()::text);

-- Update RLS policies for wallets table
DROP POLICY IF EXISTS "Users can view their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can insert their own wallets" ON wallets;

CREATE POLICY "Users can view their own wallets"
    ON wallets FOR SELECT
    USING (user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

CREATE POLICY "Users can update their own wallets"
    ON wallets FOR UPDATE
    USING (user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

CREATE POLICY "Users can insert their own wallets"
    ON wallets FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Update RLS policies for settings tables to use auth.uid()
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (wallet_address = auth.uid()::text);

-- Repeat for other settings tables
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (wallet_address = auth.uid()::text);

-- Update notification settings policies
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;

CREATE POLICY "Users can view their own notification settings"
    ON notification_settings FOR SELECT
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own notification settings"
    ON notification_settings FOR UPDATE
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can insert their own notification settings"
    ON notification_settings FOR INSERT
    WITH CHECK (wallet_address = auth.uid()::text);

-- Update security settings policies
DROP POLICY IF EXISTS "Users can view their own security settings" ON security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON security_settings;
DROP POLICY IF EXISTS "Users can insert their own security settings" ON security_settings;

CREATE POLICY "Users can view their own security settings"
    ON security_settings FOR SELECT
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own security settings"
    ON security_settings FOR UPDATE
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can insert their own security settings"
    ON security_settings FOR INSERT
    WITH CHECK (wallet_address = auth.uid()::text);

-- Update dashboard preferences policies
DROP POLICY IF EXISTS "Users can view their own dashboard preferences" ON dashboard_preferences;
DROP POLICY IF EXISTS "Users can update their own dashboard preferences" ON dashboard_preferences;
DROP POLICY IF EXISTS "Users can insert their own dashboard preferences" ON dashboard_preferences;

CREATE POLICY "Users can view their own dashboard preferences"
    ON dashboard_preferences FOR SELECT
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own dashboard preferences"
    ON dashboard_preferences FOR UPDATE
    USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can insert their own dashboard preferences"
    ON dashboard_preferences FOR INSERT
    WITH CHECK (wallet_address = auth.uid()::text); 