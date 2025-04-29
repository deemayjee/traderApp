-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS dashboard_preferences CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS trading_preferences CASCADE;
DROP TABLE IF EXISTS security_settings CASCADE;
DROP TABLE IF EXISTS subscription_settings CASCADE;

-- Create user_preferences table
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'USD',
    compact_mode BOOLEAN DEFAULT false,
    show_advanced_charts BOOLEAN DEFAULT false,
    enable_animations BOOLEAN DEFAULT true,
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Create dashboard_preferences table
CREATE TABLE dashboard_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    default_view TEXT DEFAULT 'overview',
    show_balance BOOLEAN DEFAULT true,
    show_transactions BOOLEAN DEFAULT true,
    show_holdings BOOLEAN DEFAULT true,
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for dashboard_preferences
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dashboard preferences"
    ON dashboard_preferences FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own dashboard preferences"
    ON dashboard_preferences FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own dashboard preferences"
    ON dashboard_preferences FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Create notification_settings table
CREATE TABLE notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    price_alerts BOOLEAN DEFAULT false,
    transaction_alerts BOOLEAN DEFAULT true,
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification settings"
    ON notification_settings FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own notification settings"
    ON notification_settings FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own notification settings"
    ON notification_settings FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Create trading_preferences table
CREATE TABLE trading_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    default_exchange TEXT DEFAULT 'binance',
    default_pair TEXT DEFAULT 'BTC/USD',
    slippage_tolerance DECIMAL DEFAULT 1.0,
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for trading_preferences
ALTER TABLE trading_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trading preferences"
    ON trading_preferences FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own trading preferences"
    ON trading_preferences FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own trading preferences"
    ON trading_preferences FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Create security_settings table
CREATE TABLE security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    two_factor_auth BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30,
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for security_settings
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security settings"
    ON security_settings FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own security settings"
    ON security_settings FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own security settings"
    ON security_settings FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Create subscription_settings table
CREATE TABLE subscription_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    subscription_tier TEXT DEFAULT 'free',
    payment_methods JSONB DEFAULT '[]',
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for subscription_settings
ALTER TABLE subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription settings"
    ON subscription_settings FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own subscription settings"
    ON subscription_settings FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own subscription settings"
    ON subscription_settings FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Create indexes
CREATE INDEX idx_user_preferences_wallet ON user_preferences(wallet_address);
CREATE INDEX idx_user_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX idx_dashboard_preferences_wallet ON dashboard_preferences(wallet_address);
CREATE INDEX idx_notification_settings_wallet ON notification_settings(wallet_address);
CREATE INDEX idx_trading_preferences_wallet ON trading_preferences(wallet_address);
CREATE INDEX idx_security_settings_wallet ON security_settings(wallet_address);
CREATE INDEX idx_subscription_settings_wallet ON subscription_settings(wallet_address);

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
CREATE TRIGGER update_user_preferences_last_active
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_user_profiles_last_active
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_dashboard_preferences_last_active
    BEFORE UPDATE ON dashboard_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_notification_settings_last_active
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_trading_preferences_last_active
    BEFORE UPDATE ON trading_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_security_settings_last_active
    BEFORE UPDATE ON security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_subscription_settings_last_active
    BEFORE UPDATE ON subscription_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active(); 