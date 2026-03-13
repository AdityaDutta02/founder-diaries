CREATE TABLE content_writing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'x')),
  tone_description TEXT,
  format_patterns JSONB,
  vocabulary_notes TEXT,
  structural_patterns JSONB,
  example_hooks TEXT[],
  hashtag_strategy JSONB,
  generated_by_model TEXT,
  last_refreshed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
