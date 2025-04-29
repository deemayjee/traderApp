-- Add new profile display columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS show_trading_history BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_portfolio_value BOOLEAN DEFAULT false; 