-- Phase 2: Enable web interface feature flag
UPDATE feature_flags SET enabled = true WHERE key = 'web_interface';
