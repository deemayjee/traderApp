-- Drop existing views first
DROP VIEW IF EXISTS community_user_follow_stats;
DROP VIEW IF EXISTS community_post_details;

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS community_topic_follows;
DROP TABLE IF EXISTS community_post_topics;
DROP TABLE IF EXISTS community_comment_likes;
DROP TABLE IF EXISTS community_post_likes;
DROP TABLE IF EXISTS community_shares;
DROP TABLE IF EXISTS community_follows;
DROP TABLE IF EXISTS community_comments;
DROP TABLE IF EXISTS community_posts;
DROP TABLE IF EXISTS community_topics;

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[],
    is_ai_generated BOOLEAN DEFAULT false,
    accuracy_percentage INTEGER,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create community_likes table to track post likes
CREATE TABLE IF NOT EXISTS community_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, wallet_address)
);

-- Create community_comment_likes table to track comment likes
CREATE TABLE IF NOT EXISTS community_comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, wallet_address)
);

-- Create community_shares table to track post shares
CREATE TABLE IF NOT EXISTS community_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    platform TEXT, -- e.g., 'twitter', 'telegram', 'internal'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, wallet_address, platform)
);

-- Create community_follows table to track user follows
CREATE TABLE IF NOT EXISTS community_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_wallet TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    following_wallet TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_wallet, following_wallet),
    CHECK (follower_wallet != following_wallet) -- Prevent self-follows
);

-- Create community_topics table
CREATE TABLE IF NOT EXISTS community_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    posts_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create community_post_topics table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS community_post_topics (
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, topic_id)
);

-- Create community_topic_follows table
CREATE TABLE IF NOT EXISTS community_topic_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, wallet_address)
);

-- Add functions to manage counters

-- Function to update post likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post shares_count
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET shares_count = shares_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update topic posts_count
CREATE OR REPLACE FUNCTION update_topic_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_topics SET posts_count = posts_count + 1 WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_topics SET posts_count = posts_count - 1 WHERE id = OLD.topic_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update topic followers_count
CREATE OR REPLACE FUNCTION update_topic_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_topics SET followers_count = followers_count + 1 WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_topics SET followers_count = followers_count - 1 WHERE id = OLD.topic_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for counter updates
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON community_post_likes;
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON community_comments;
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS update_post_shares_count_trigger ON community_shares;
CREATE TRIGGER update_post_shares_count_trigger
AFTER INSERT OR DELETE ON community_shares
FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

DROP TRIGGER IF EXISTS update_topic_posts_count_trigger ON community_post_topics;
CREATE TRIGGER update_topic_posts_count_trigger
AFTER INSERT OR DELETE ON community_post_topics
FOR EACH ROW EXECUTE FUNCTION update_topic_posts_count();

DROP TRIGGER IF EXISTS update_topic_followers_count_trigger ON community_topic_follows;
CREATE TRIGGER update_topic_followers_count_trigger
AFTER INSERT OR DELETE ON community_topic_follows
FOR EACH ROW EXECUTE FUNCTION update_topic_followers_count();

DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON community_comment_likes;
CREATE TRIGGER update_comment_likes_count_trigger
AFTER INSERT OR DELETE ON community_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Create views for common queries

-- View for post details with author info
CREATE OR REPLACE VIEW community_post_details AS
SELECT 
    p.id,
    p.content,
    p.image_url,
    p.tags,
    p.is_ai_generated,
    p.accuracy_percentage,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    p.created_at,
    p.updated_at,
    p.wallet_address,
    u.username,
    up.avatar_url,
    u.email,
    (p.likes_count + p.comments_count + p.shares_count) as total_engagement
FROM 
    community_posts p
JOIN 
    users u ON p.wallet_address = u.wallet_address
LEFT JOIN 
    user_profiles up ON p.wallet_address = up.wallet_address;

-- View for user follow stats
CREATE OR REPLACE VIEW community_user_follow_stats AS
SELECT 
    u.wallet_address,
    u.username,
    (SELECT COUNT(*) FROM community_follows WHERE following_wallet = u.wallet_address) AS followers_count,
    (SELECT COUNT(*) FROM community_follows WHERE follower_wallet = u.wallet_address) AS following_count,
    (SELECT COUNT(*) FROM community_posts WHERE wallet_address = u.wallet_address) AS posts_count
FROM 
    users u;

-- Setup RLS policies

-- Enable RLS on all tables
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_topic_follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON community_posts;

DROP POLICY IF EXISTS "Anyone can read comments" ON community_comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON community_comments;

DROP POLICY IF EXISTS "Anyone can read post likes" ON community_post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON community_post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON community_post_likes;

DROP POLICY IF EXISTS "Anyone can read comment likes" ON community_comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON community_comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON community_comment_likes;

DROP POLICY IF EXISTS "Anyone can read shares" ON community_shares;
DROP POLICY IF EXISTS "Users can share posts" ON community_shares;
DROP POLICY IF EXISTS "Users can delete their shares" ON community_shares;

DROP POLICY IF EXISTS "Anyone can read follows" ON community_follows;
DROP POLICY IF EXISTS "Users can follow others" ON community_follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON community_follows;

DROP POLICY IF EXISTS "Anyone can read topics" ON community_topics;

DROP POLICY IF EXISTS "Anyone can read post-topics" ON community_post_topics;
DROP POLICY IF EXISTS "Users can add topics to their posts" ON community_post_topics;
DROP POLICY IF EXISTS "Users can remove topics from their posts" ON community_post_topics;

DROP POLICY IF EXISTS "Anyone can read topic follows" ON community_topic_follows;
DROP POLICY IF EXISTS "Users can follow topics" ON community_topic_follows;
DROP POLICY IF EXISTS "Users can unfollow topics" ON community_topic_follows;

-- Posts policies
CREATE POLICY "Anyone can read posts"
    ON community_posts FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own posts"
    ON community_posts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own posts"
    ON community_posts FOR UPDATE
    USING (wallet_address = wallet_address);

CREATE POLICY "Users can delete their own posts"
    ON community_posts FOR DELETE
    USING (wallet_address = wallet_address);

-- Comments policies
CREATE POLICY "Anyone can read comments"
    ON community_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own comments"
    ON community_comments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
    ON community_comments FOR UPDATE
    USING (wallet_address = wallet_address);

CREATE POLICY "Users can delete their own comments"
    ON community_comments FOR DELETE
    USING (wallet_address = wallet_address);

-- Post likes policies
CREATE POLICY "Anyone can read post likes"
    ON community_post_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like posts"
    ON community_post_likes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can unlike posts"
    ON community_post_likes FOR DELETE
    USING (wallet_address = wallet_address);

-- Comment likes policies
CREATE POLICY "Anyone can read comment likes"
    ON community_comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like comments"
    ON community_comment_likes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can unlike comments"
    ON community_comment_likes FOR DELETE
    USING (wallet_address = wallet_address);

-- Shares policies
CREATE POLICY "Anyone can read shares"
    ON community_shares FOR SELECT
    USING (true);

CREATE POLICY "Users can share posts"
    ON community_shares FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can delete their shares"
    ON community_shares FOR DELETE
    USING (wallet_address = wallet_address);

-- Follows policies
CREATE POLICY "Anyone can read follows"
    ON community_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON community_follows FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can unfollow others"
    ON community_follows FOR DELETE
    USING (follower_wallet = follower_wallet);

-- Topics policies
CREATE POLICY "Anyone can read topics"
    ON community_topics FOR SELECT
    USING (true);

-- Post-topics policies
CREATE POLICY "Anyone can read post-topics"
    ON community_post_topics FOR SELECT
    USING (true);

CREATE POLICY "Users can add topics to their posts"
    ON community_post_topics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can remove topics from their posts"
    ON community_post_topics FOR DELETE
    USING (true);

-- Topic follows policies
CREATE POLICY "Anyone can read topic follows"
    ON community_topic_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow topics"
    ON community_topic_follows FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can unfollow topics"
    ON community_topic_follows FOR DELETE
    USING (wallet_address = wallet_address);

-- Create indexes for performance
CREATE INDEX idx_community_posts_wallet ON community_posts(wallet_address);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_wallet ON community_comments(wallet_address);
CREATE INDEX idx_community_post_likes_post_id ON community_post_likes(post_id);
CREATE INDEX idx_community_post_likes_wallet ON community_post_likes(wallet_address);
CREATE INDEX idx_community_comment_likes_comment_id ON community_comment_likes(comment_id);
CREATE INDEX idx_community_comment_likes_wallet ON community_comment_likes(wallet_address);
CREATE INDEX idx_community_shares_post_id ON community_shares(post_id);
CREATE INDEX idx_community_shares_wallet ON community_shares(wallet_address);
CREATE INDEX idx_community_follows_follower ON community_follows(follower_wallet);
CREATE INDEX idx_community_follows_following ON community_follows(following_wallet);
CREATE INDEX idx_community_post_topics_post_id ON community_post_topics(post_id);
CREATE INDEX idx_community_post_topics_topic_id ON community_post_topics(topic_id);
CREATE INDEX idx_community_topic_follows_topic_id ON community_topic_follows(topic_id);
CREATE INDEX idx_community_topic_follows_wallet ON community_topic_follows(wallet_address);

-- Insert some initial topics
INSERT INTO community_topics (name, slug, description)
VALUES 
('Bitcoin', 'bitcoin', 'Discussions about Bitcoin, the first cryptocurrency'),
('Ethereum', 'ethereum', 'All about Ethereum, smart contracts and DApps'),
('Solana', 'solana', 'Fast, secure, and censorship-resistant blockchain'),
('DeFi', 'defi', 'Decentralized Finance protocols and news'),
('NFTs', 'nfts', 'Non-fungible tokens, digital art and collectibles'),
('Altcoins', 'altcoins', 'Alternative cryptocurrencies and tokens'),
('Trading', 'trading', 'Trading strategies, technical analysis and market predictions'),
('Investing', 'investing', 'Long-term investment strategies and portfolio management'),
('Blockchain', 'blockchain', 'Blockchain technology, innovations and use cases')
ON CONFLICT (slug) DO NOTHING; 