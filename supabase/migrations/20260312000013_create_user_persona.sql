CREATE TABLE user_persona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Professional context
  company_name TEXT,
  job_title TEXT,
  years_experience INTEGER,
  -- Personality & communication
  personality_traits JSONB DEFAULT '[]', -- array of strings like ["analytical", "empathetic"]
  communication_style TEXT, -- "formal", "conversational", "humorous", "inspirational"
  writing_tone TEXT, -- "authoritative", "vulnerable", "energetic", "calm"
  -- Interests & life context
  interests JSONB DEFAULT '[]', -- array of strings
  hobbies JSONB DEFAULT '[]',
  values JSONB DEFAULT '[]', -- what they care about most
  life_context JSONB DEFAULT '{}', -- free-form facts: family, location, routines
  -- Professional story
  founder_story TEXT, -- 1-2 paragraph narrative extracted from entries
  biggest_challenges JSONB DEFAULT '[]',
  proudest_wins JSONB DEFAULT '[]',
  -- Content signals (derived, not asked)
  content_themes JSONB DEFAULT '[]', -- recurring themes in their writing
  emotional_range TEXT, -- how emotionally varied their entries are
  audience_connection_style TEXT, -- how they naturally connect with people
  -- Metadata
  confidence_score FLOAT DEFAULT 0.0, -- 0-1, how confident the AI is in this profile
  last_analyzed_at TIMESTAMPTZ,
  entry_count_at_last_analysis INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_persona_user_id ON user_persona(user_id);

ALTER TABLE user_persona ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own persona" ON user_persona FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own persona" ON user_persona FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to persona" ON user_persona USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_user_persona_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER user_persona_updated_at BEFORE UPDATE ON user_persona
  FOR EACH ROW EXECUTE FUNCTION update_user_persona_updated_at();
