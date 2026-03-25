CREATE TABLE creator_content_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('post', 'carousel', 'thread', 'reel_caption', 'story')),
  engagement_score FLOAT,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_content_samples_creator ON creator_content_samples(creator_profile_id);
