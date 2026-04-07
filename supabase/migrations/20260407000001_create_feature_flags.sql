-- supabase/migrations/20260407000001_create_feature_flags.sql

CREATE TABLE feature_flags (
  key                   TEXT PRIMARY KEY,
  enabled               BOOLEAN NOT NULL DEFAULT false,
  enabled_for_user_ids  UUID[] DEFAULT NULL,
  rollout_pct           INTEGER NOT NULL DEFAULT 100
                          CHECK (rollout_pct >= 0 AND rollout_pct <= 100),
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Authenticated users can read flags; only service role can write
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read feature flags"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed initial flags — all off except diary_core
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('diary_core',          true,  'Auth + diary entry CRUD + offline sync'),
  ('rag_pipeline',        false, 'Background embeddings + writing profile'),
  ('web_interface',       false, 'Expo Web entry CRUD'),
  ('creator_discovery',   false, 'Creator matching + writing profiles'),
  ('content_generation',  false, 'AI post generation'),
  ('rich_formats',        false, 'Threads + carousels + AI images'),
  ('notifications',       false, 'Push notification flows'),
  ('scheduling',          false, 'Content calendar + scheduling'),
  ('monetization',        false, 'RevenueCat paywall'),
  ('auto_posting',        false, 'Direct social API publishing');
