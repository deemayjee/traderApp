-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own subscription settings" ON subscription_settings;
DROP POLICY IF EXISTS "Users can update their own subscription settings" ON subscription_settings;
DROP POLICY IF EXISTS "Users can insert their own subscription settings" ON subscription_settings;
DROP POLICY IF EXISTS "Service role can access all subscription settings" ON subscription_settings;

-- Disable RLS temporarily to allow admin operations
ALTER TABLE subscription_settings DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE subscription_settings ENABLE ROW LEVEL SECURITY;

-- Create new policies that use wallet_address
CREATE POLICY "Users can view their own subscription settings"
    ON subscription_settings FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own subscription settings"
    ON subscription_settings FOR UPDATE
    USING (true);

CREATE POLICY "Users can insert their own subscription settings"
    ON subscription_settings FOR INSERT
    WITH CHECK (true);

-- Add a policy for service role
CREATE POLICY "Service role can access all subscription settings"
    ON subscription_settings FOR ALL
    USING (true)
    WITH CHECK (true); 