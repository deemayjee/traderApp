-- Drop existing tables if they exist
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    email TEXT,
    username TEXT,
    last_signature TEXT,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create wallets table
CREATE TABLE wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    address TEXT NOT NULL UNIQUE CHECK (address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
    chain TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    last_signature TEXT,
    nonce TEXT DEFAULT encode(gen_random_bytes(16), 'base64'),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and create policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet_address'));

CREATE POLICY "Users can insert their own data"
    ON users FOR INSERT
    WITH CHECK (wallet_address = current_setting('app.current_wallet_address'));

-- Enable RLS and create policies for wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
    ON wallets FOR SELECT
    USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address')));

CREATE POLICY "Users can update their own wallets"
    ON wallets FOR UPDATE
    USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address')));

CREATE POLICY "Users can insert their own wallets"
    ON wallets FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.current_wallet_address')));

-- Create indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_address ON wallets(address);

-- Create triggers for last_active updates
CREATE TRIGGER update_users_last_active
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_wallets_last_active
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active(); 