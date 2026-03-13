CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'x')),
  creator_handle TEXT NOT NULL,
  creator_name TEXT,
  profile_url TEXT,
  follower_count INTEGER,
  bio TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  relevance_score FLOAT,
  UNIQUE(user_id, platform, creator_handle)
);
