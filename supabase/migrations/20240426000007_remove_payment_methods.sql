-- Remove payment_methods column from subscription_settings
ALTER TABLE subscription_settings DROP COLUMN IF EXISTS payment_methods; 