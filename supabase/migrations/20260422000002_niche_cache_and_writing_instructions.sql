-- Niche-level creator cache: shared across users with the same niche+platform
CREATE TABLE niche_creator_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        TEXT NOT NULL CHECK (platform IN ('linkedin', 'x')),
  niche_hash      TEXT NOT NULL,
  niche_keywords  TEXT[] NOT NULL,
  creators        JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, niche_hash)
);

-- Service role only — edge functions read/write, clients never touch this
ALTER TABLE niche_creator_cache ENABLE ROW LEVEL SECURITY;

-- Index for fast lookup
CREATE INDEX idx_niche_cache_lookup ON niche_creator_cache (platform, niche_hash);
CREATE INDEX idx_niche_cache_expiry ON niche_creator_cache (expires_at);

-- User-supplied writing instructions per platform
CREATE TABLE user_writing_instructions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('linkedin', 'x')),
  instructions TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE user_writing_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own writing instructions"
  ON user_writing_instructions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own writing instructions"
  ON user_writing_instructions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own writing instructions"
  ON user_writing_instructions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
