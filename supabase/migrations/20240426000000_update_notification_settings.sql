-- Drop existing notification_settings table
DROP TABLE IF EXISTS notification_settings;

-- Create updated notification_settings table
CREATE TABLE notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    in_app_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    signal_alerts BOOLEAN DEFAULT true,
    performance_alerts BOOLEAN DEFAULT true,
    price_alerts BOOLEAN DEFAULT false,
    copy_trading_updates BOOLEAN DEFAULT true,
    community_mentions BOOLEAN DEFAULT true,
    last_signature TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users"
    ON notification_settings
    FOR ALL
    USING (true)
    WITH CHECK (true); 