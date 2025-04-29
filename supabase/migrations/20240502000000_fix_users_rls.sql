-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Create new policies that use wallet_address
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (true);

CREATE POLICY "Users can insert their own data"
    ON users FOR INSERT
    WITH CHECK (true);

-- Add a policy for service role
CREATE POLICY "Service role can access all users"
    ON users FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role'); 