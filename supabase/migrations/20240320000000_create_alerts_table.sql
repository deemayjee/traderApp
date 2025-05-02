-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('price', 'signal', 'whale')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  asset TEXT NOT NULL,
  symbol TEXT NOT NULL,
  target_price NUMERIC,
  current_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS alerts_wallet_address_idx ON alerts(wallet_address);

-- Add RLS policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own alerts
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (wallet_address = auth.jwt()->>'sub');

-- Policy to allow users to insert their own alerts
CREATE POLICY "Users can create their own alerts"
  ON alerts FOR INSERT
  WITH CHECK (wallet_address = auth.jwt()->>'sub');

-- Policy to allow users to update their own alerts
CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  USING (wallet_address = auth.jwt()->>'sub');

-- Policy to allow users to delete their own alerts
CREATE POLICY "Users can delete their own alerts"
  ON alerts FOR DELETE
  USING (wallet_address = auth.jwt()->>'sub');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 