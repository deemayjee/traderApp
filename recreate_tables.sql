-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Enable update for authenticated users" 
ON users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Enable read access for authenticated users" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create policies for wallets table
CREATE POLICY "Enable all operations for wallet owners" 
ON wallets FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for portfolio table
CREATE POLICY "Enable all operations for portfolio owners" 
ON portfolio FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for settings table
CREATE POLICY "Enable all operations for settings owners" 
ON settings FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for assets table
CREATE POLICY "Enable all operations for asset owners" 
ON assets FOR ALL 
USING (auth.uid() = user_id); 