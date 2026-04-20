-- Phase 1.5: Enable RAG pipeline feature flag
-- The backend embedding + persona builder already runs fire-and-forget on sync.
-- This flag enables client-side profile readiness detection and future RAG features.
UPDATE feature_flags SET enabled = true WHERE key = 'rag_pipeline';
