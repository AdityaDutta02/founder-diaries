import { logger } from "./logger.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_INPUT_TOKENS = 8000;
const MAX_BATCH_SIZE = 20;

function getApiKey(): string {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY not configured — RAG disabled");
  return key;
}

/** Check if embeddings are available (OPENROUTER_API_KEY is set) */
export function isEmbeddingEnabled(): boolean {
  return Boolean(Deno.env.get("OPENROUTER_API_KEY"));
}

/** Truncate text to approximate token limit (rough: 4 chars per token) */
function truncateForEmbedding(text: string): string {
  const maxChars = MAX_INPUT_TOKENS * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { prompt_tokens: number; total_tokens: number };
}

/**
 * Embed a single text string via OpenRouter (routes to OpenAI text-embedding-3-small).
 * Returns a 1536-dimensional float array.
 */
export async function embedText(text: string): Promise<number[]> {
  const results = await embedTexts([text]);
  return results[0];
}

/**
 * Batch embed multiple texts in a single API call.
 * Max 20 texts per call (OpenAI limit).
 * Returns array of 1536-dimensional float arrays in input order.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > MAX_BATCH_SIZE) {
    throw new Error(`embedTexts: batch size ${texts.length} exceeds max ${MAX_BATCH_SIZE}`);
  }

  const apiKey = getApiKey();
  const startTime = Date.now();

  const truncated = texts.map(truncateForEmbedding);

  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://founderdiaries.app",
      "X-Title": "Founder Diaries",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: truncated,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("OpenAI Embeddings API error", {
      functionName: "embedTexts",
      metadata: { status: response.status, body: errorBody, latencyMs },
    });
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const result = (await response.json()) as EmbeddingResponse;

  logger.info("Embeddings computed", {
    functionName: "embedTexts",
    metadata: {
      count: texts.length,
      model: EMBEDDING_MODEL,
      promptTokens: result.usage.prompt_tokens,
      latencyMs,
    },
  });

  // Sort by index to preserve input order
  return result.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

export interface SimilarEntry {
  id: string;
  entry_date: string;
  text_content: string | null;
  transcription_text: string | null;
  mood: string | null;
  similarity: number;
}

/**
 * Find diary entries semantically similar to a query embedding.
 * Calls the match_diary_entries RPC function in Supabase.
 */
export async function findSimilarEntries(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  userId: string,
  excludeEntryId?: string,
  limit = 5
): Promise<SimilarEntry[]> {
  const { data, error } = await supabase.rpc("match_diary_entries", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_user_id: userId,
    exclude_entry_id: excludeEntryId ?? null,
    match_count: limit,
    match_threshold: 0.3,
  });

  if (error) {
    logger.error("Similarity search failed", {
      functionName: "findSimilarEntries",
      userId,
      metadata: { error: error.message },
    });
    return [];
  }

  return (data ?? []) as SimilarEntry[];
}

/**
 * Compute and store embeddings for diary entries that don't have one yet.
 * Called after diary sync. Processes in batches of 20.
 */
export async function embedMissingEntries(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (!isEmbeddingEnabled()) return 0;

  // Fetch entries without embeddings
  const { data: entries, error } = await supabase
    .from("diary_entries")
    .select("id, text_content, transcription_text")
    .eq("user_id", userId)
    .is("embedding", null)
    .order("entry_date", { ascending: false })
    .limit(100);

  if (error || !entries || entries.length === 0) return 0;

  let embeddedCount = 0;

  // Process in batches of 20
  for (let i = 0; i < entries.length; i += MAX_BATCH_SIZE) {
    const batch = entries.slice(i, i + MAX_BATCH_SIZE);
    const texts = batch.map((entry) => {
      const text = entry.text_content ?? entry.transcription_text ?? "";
      return text.trim() || "empty diary entry";
    });

    try {
      const embeddings = await embedTexts(texts);

      // Update each entry with its embedding
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from("diary_entries")
          .update({ embedding: JSON.stringify(embeddings[j]) })
          .eq("id", batch[j].id);

        if (updateError) {
          logger.warn("Failed to store embedding", {
            functionName: "embedMissingEntries",
            userId,
            metadata: { entryId: batch[j].id, error: updateError.message },
          });
        } else {
          embeddedCount++;
        }
      }
    } catch (err) {
      logger.error("Batch embedding failed", {
        functionName: "embedMissingEntries",
        userId,
        metadata: {
          batchStart: i,
          batchSize: batch.length,
          error: err instanceof Error ? err.message : String(err),
        },
      });
      // Continue with next batch — don't fail the entire sync
    }
  }

  if (embeddedCount > 0) {
    logger.info("Embedded diary entries", {
      functionName: "embedMissingEntries",
      userId,
      metadata: { embeddedCount, totalMissing: entries.length },
    });
  }

  return embeddedCount;
}
