-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON community_posts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON community_posts;
DROP POLICY IF EXISTS "Enable update for users based on wallet_address" ON community_posts;
DROP POLICY IF EXISTS "Enable delete for users based on wallet_address" ON community_posts;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON community_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON community_posts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on wallet_address" ON community_posts
  FOR UPDATE
  USING (wallet_address = wallet_address)
  WITH CHECK (wallet_address = wallet_address);

CREATE POLICY "Enable delete for users based on wallet_address" ON community_posts
  FOR DELETE
  USING (wallet_address = wallet_address); 