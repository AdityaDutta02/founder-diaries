-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to diary_entries (schema-qualified for Supabase)
ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_diary_entries_embedding
  ON diary_entries
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- RPC function: find diary entries semantically similar to a query vector
CREATE OR REPLACE FUNCTION match_diary_entries(
  query_embedding extensions.vector(1536),
  match_user_id uuid,
  exclude_entry_id uuid DEFAULT NULL,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  entry_date date,
  text_content text,
  transcription_text text,
  mood text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.entry_date,
    de.text_content,
    de.transcription_text,
    de.mood,
    (1 - (de.embedding <=> query_embedding))::float AS similarity
  FROM diary_entries de
  WHERE de.user_id = match_user_id
    AND de.embedding IS NOT NULL
    AND (exclude_entry_id IS NULL OR de.id != exclude_entry_id)
    AND (1 - (de.embedding <=> query_embedding)) > match_threshold
  ORDER BY de.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_diary_entries TO authenticated;
GRANT EXECUTE ON FUNCTION match_diary_entries TO service_role;
