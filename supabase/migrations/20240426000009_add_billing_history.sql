-- Add billing_history column to subscription_settings
ALTER TABLE subscription_settings ADD COLUMN IF NOT EXISTS billing_history JSONB DEFAULT '[]'; 