-- Drop dependent policies first
DROP POLICY IF EXISTS "Enable update for users based on privy_id" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on privy_id" ON users;
DROP POLICY IF EXISTS "Enable all operations for wallet owners" ON wallets;
DROP POLICY IF EXISTS "Enable all operations for portfolio owners" ON portfolio;
DROP POLICY IF EXISTS "Enable all operations for settings owners" ON settings;
DROP POLICY IF EXISTS "Enable all operations for asset owners" ON assets;

-- Now drop the column
ALTER TABLE users DROP COLUMN privy_id;

-- Create new policies based on user_id instead
CREATE POLICY "Enable update for authenticated users" 
ON users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Enable read access for authenticated users" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Enable all operations for wallet owners" 
ON wallets FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Enable all operations for portfolio owners" 
ON portfolio FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Enable all operations for settings owners" 
ON settings FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Enable all operations for asset owners" 
ON assets FOR ALL 
USING (auth.uid() = user_id); 