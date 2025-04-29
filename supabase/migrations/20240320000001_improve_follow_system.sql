-- Create function to update follow stats
CREATE OR REPLACE FUNCTION update_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update following count for follower
        INSERT INTO community_user_follow_stats (wallet_address, following_count)
        VALUES (NEW.follower_wallet, 1)
        ON CONFLICT (wallet_address) DO UPDATE
        SET following_count = community_user_follow_stats.following_count + 1;

        -- Update followers count for followed user
        INSERT INTO community_user_follow_stats (wallet_address, followers_count)
        VALUES (NEW.following_wallet, 1)
        ON CONFLICT (wallet_address) DO UPDATE
        SET followers_count = community_user_follow_stats.followers_count + 1;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update following count for follower
        UPDATE community_user_follow_stats
        SET following_count = GREATEST(0, following_count - 1)
        WHERE wallet_address = OLD.follower_wallet;

        -- Update followers count for followed user
        UPDATE community_user_follow_stats
        SET followers_count = GREATEST(0, followers_count - 1)
        WHERE wallet_address = OLD.following_wallet;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain follow stats
DROP TRIGGER IF EXISTS tr_update_follow_stats_insert ON community_follows;
CREATE TRIGGER tr_update_follow_stats_insert
    AFTER INSERT ON community_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_stats();

DROP TRIGGER IF EXISTS tr_update_follow_stats_delete ON community_follows;
CREATE TRIGGER tr_update_follow_stats_delete
    AFTER DELETE ON community_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_stats();

-- Add RLS policies
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can read follows
CREATE POLICY "Enable read access for all users" ON community_follows
    FOR SELECT USING (true);

-- Only authenticated users can follow
CREATE POLICY "Enable insert for authenticated users" ON community_follows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can only unfollow their own follows
CREATE POLICY "Enable delete for followers" ON community_follows
    FOR DELETE USING (auth.jwt() ->> 'wallet_address' = follower_wallet); 