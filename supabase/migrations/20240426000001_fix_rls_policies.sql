-- Add service role policies for API access
CREATE POLICY "Service role can access all tables"
    ON user_profiles FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all tables"
    ON user_preferences FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all tables"
    ON dashboard_preferences FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all tables"
    ON notification_settings FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all tables"
    ON trading_preferences FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all tables"
    ON security_settings FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all tables"
    ON subscription_settings FOR ALL
    USING (auth.role() = 'service_role');

-- Update RLS policies to use auth.uid() for authenticated users
ALTER POLICY "Users can view their own preferences" ON user_preferences
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can update their own preferences" ON user_preferences
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can insert their own preferences" ON user_preferences
    WITH CHECK (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

-- Update policies for user_profiles
ALTER POLICY "Users can view their own profile" ON user_profiles
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can update their own profile" ON user_profiles
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can insert their own profile" ON user_profiles
    WITH CHECK (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

-- Update policies for dashboard_preferences
ALTER POLICY "Users can view their own dashboard preferences" ON dashboard_preferences
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can update their own dashboard preferences" ON dashboard_preferences
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can insert their own dashboard preferences" ON dashboard_preferences
    WITH CHECK (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

-- Update policies for notification_settings
ALTER POLICY "Users can view their own notification settings" ON notification_settings
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can update their own notification settings" ON notification_settings
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can insert their own notification settings" ON notification_settings
    WITH CHECK (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

-- Update policies for trading_preferences
ALTER POLICY "Users can view their own trading preferences" ON trading_preferences
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can update their own trading preferences" ON trading_preferences
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can insert their own trading preferences" ON trading_preferences
    WITH CHECK (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

-- Update policies for security_settings
ALTER POLICY "Users can view their own security settings" ON security_settings
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can update their own security settings" ON security_settings
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can insert their own security settings" ON security_settings
    WITH CHECK (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

-- Update policies for subscription_settings
ALTER POLICY "Users can view their own subscription settings" ON subscription_settings
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can update their own subscription settings" ON subscription_settings
    USING (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid()));

ALTER POLICY "Users can insert their own subscription settings" ON subscription_settings
    WITH CHECK (wallet_address = (SELECT wallet_address FROM auth.users WHERE id = auth.uid())); 