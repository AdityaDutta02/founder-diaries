-- Enable the creator_discovery feature flag for Phase 3
UPDATE feature_flags
SET enabled = true
WHERE key = 'creator_discovery';
