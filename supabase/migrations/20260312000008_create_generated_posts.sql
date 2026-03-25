CREATE TABLE generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  diary_entry_id UUID REFERENCES diary_entries(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'x')),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'carousel', 'thread', 'reel_caption')),
  title TEXT,
  body_text TEXT NOT NULL,
  carousel_slides JSONB,
  thread_tweets JSONB,
  image_prompt TEXT,
  generated_image_url TEXT,
  user_image_id UUID REFERENCES diary_images(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'posted', 'rejected')),
  scheduled_for TIMESTAMPTZ,
  generation_metadata JSONB,
  user_edits TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_generated_posts_user_status ON generated_posts(user_id, status);
CREATE INDEX idx_generated_posts_scheduled ON generated_posts(user_id, scheduled_for) WHERE status = 'scheduled';
