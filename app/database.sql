-- Community tables

-- Posts table
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes table
CREATE TABLE community_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comment likes table
CREATE TABLE community_comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Follows table
CREATE TABLE community_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

-- Post details view for easier retrieval
CREATE OR REPLACE VIEW community_post_details AS
SELECT 
  p.id,
  p.content,
  p.created_at,
  p.user_id,
  u.name AS author,
  u.avatar_url AS avatar,
  CASE WHEN u.verified = true THEN true ELSE false END AS verified,
  (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS likes,
  (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS comments,
  0 AS shares, -- Placeholder for future implementation
  (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) + 
  (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS total_engagement,
  to_char(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS time
FROM 
  community_posts p
JOIN 
  users u ON p.user_id = u.id;

-- Comment details view for easier retrieval
CREATE OR REPLACE VIEW community_comment_details AS
SELECT 
  c.id,
  c.post_id,
  c.content,
  c.created_at,
  c.user_id,
  u.name AS author,
  u.avatar_url AS avatar,
  CASE WHEN u.verified = true THEN true ELSE false END AS verified,
  (SELECT COUNT(*) FROM community_comment_likes l WHERE l.comment_id = c.id) AS likes,
  to_char(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS time
FROM 
  community_comments c
JOIN 
  users u ON c.user_id = u.id;

-- Row Level Security Policies
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "Allow read access to all authenticated users" 
ON community_posts FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Allow read access to all authenticated users" 
ON community_comments FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Allow read access to all authenticated users" 
ON community_post_likes FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Allow read access to all authenticated users" 
ON community_comment_likes FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Allow read access to all authenticated users" 
ON community_follows FOR SELECT 
TO authenticated USING (true);

-- Allow insert access for authenticated users
CREATE POLICY "Allow authenticated users to create posts" 
ON community_posts FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to create comments" 
ON community_comments FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to like posts" 
ON community_post_likes FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to like comments" 
ON community_comment_likes FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to follow others" 
ON community_follows FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = follower_id);

-- Allow update access for own content
CREATE POLICY "Allow users to update their own posts" 
ON community_posts FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own comments" 
ON community_comments FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

-- Allow delete access for own content
CREATE POLICY "Allow users to delete their own posts" 
ON community_posts FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments" 
ON community_comments FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to remove their post likes" 
ON community_post_likes FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to remove their comment likes" 
ON community_comment_likes FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to unfollow" 
ON community_follows FOR DELETE 
TO authenticated USING (auth.uid() = follower_id);

-- Create triggers to update post counts
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post comment count in the future if we add denormalized counts
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update post comment count in the future if we add denormalized counts
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON community_comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_count();

CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post like count in the future if we add denormalized counts
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update post like count in the future if we add denormalized counts
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_like_count(); 