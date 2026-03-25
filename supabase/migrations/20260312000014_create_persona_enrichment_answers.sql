CREATE TABLE persona_enrichment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_category TEXT, -- "professional", "personal", "lifestyle", "values", "story"
  answer TEXT,
  is_answered BOOLEAN DEFAULT FALSE,
  asked_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrichment_answers_user_id ON persona_enrichment_answers(user_id);
CREATE INDEX idx_enrichment_answers_is_answered ON persona_enrichment_answers(is_answered);

ALTER TABLE persona_enrichment_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own answers" ON persona_enrichment_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON persona_enrichment_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own answers" ON persona_enrichment_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to answers" ON persona_enrichment_answers USING (auth.role() = 'service_role');
