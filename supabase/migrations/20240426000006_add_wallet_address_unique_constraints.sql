-- First, find and delete duplicate entries, keeping only the most recently updated ones
DELETE FROM user_profiles
WHERE id IN (
  SELECT p.id
  FROM user_profiles p
  INNER JOIN (
    SELECT wallet_address, MAX(updated_at) as max_updated_at
    FROM user_profiles
    GROUP BY wallet_address
    HAVING COUNT(*) > 1
  ) latest ON p.wallet_address = latest.wallet_address
  WHERE p.updated_at < latest.max_updated_at
);

-- Add unique constraint on wallet_address if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_wallet_address_key'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_wallet_address_key UNIQUE (wallet_address);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_wallet_address_key'
    ) THEN
        ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_wallet_address_key UNIQUE (wallet_address);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_preferences_wallet_address_key'
    ) THEN
        ALTER TABLE dashboard_preferences ADD CONSTRAINT dashboard_preferences_wallet_address_key UNIQUE (wallet_address);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notification_settings_wallet_address_key'
    ) THEN
        ALTER TABLE notification_settings ADD CONSTRAINT notification_settings_wallet_address_key UNIQUE (wallet_address);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'security_settings_wallet_address_key'
    ) THEN
        ALTER TABLE security_settings ADD CONSTRAINT security_settings_wallet_address_key UNIQUE (wallet_address);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trading_preferences_wallet_address_key'
    ) THEN
        ALTER TABLE trading_preferences ADD CONSTRAINT trading_preferences_wallet_address_key UNIQUE (wallet_address);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscription_settings_wallet_address_key'
    ) THEN
        ALTER TABLE subscription_settings ADD CONSTRAINT subscription_settings_wallet_address_key UNIQUE (wallet_address);
    END IF;
END
$$; 