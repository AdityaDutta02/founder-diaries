import { supabaseAdmin } from "./supabaseAdmin.ts";
import { logger } from "./logger.ts";
import type { Platform, CachedCreator } from "./types.ts";

const CACHE_TTL_DAYS = 7;

/**
 * Build a deterministic hash from sorted, lowercased keywords + platform.
 * Uses Web Crypto API available in Deno.
 */
export async function buildNicheHash(
  platform: Platform,
  keywords: string[],
): Promise<string> {
  const normalized = keywords.map((k) => k.trim().toLowerCase()).sort().join("|");
  const key = `${platform}:${normalized}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(key));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Look up cached creators for a niche+platform combo.
 * Returns null if no cache exists or cache has expired.
 */
export async function getNicheCache(
  platform: Platform,
  nicheHash: string,
): Promise<CachedCreator[] | null> {
  const { data, error } = await supabaseAdmin
    .from("niche_creator_cache")
    .select("creators, expires_at")
    .eq("platform", platform)
    .eq("niche_hash", nicheHash)
    .single();

  if (error || !data) return null;

  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    logger.debug("Niche cache expired", { platform, nicheHash });
    return null;
  }

  logger.info("Niche cache hit", { platform, nicheHash });
  return data.creators as CachedCreator[];
}

/**
 * Write creators to the niche cache. Upserts on (platform, niche_hash).
 */
export async function setNicheCache(
  platform: Platform,
  nicheHash: string,
  keywords: string[],
  creators: CachedCreator[],
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  const { error } = await supabaseAdmin
    .from("niche_creator_cache")
    .upsert(
      {
        platform,
        niche_hash: nicheHash,
        niche_keywords: keywords,
        creators,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform,niche_hash" },
    );

  if (error) {
    logger.warn("Failed to write niche cache", {
      functionName: "nicheCache",
      metadata: { platform, nicheHash, error: error.message },
    });
  } else {
    logger.info("Niche cache written", {
      functionName: "nicheCache",
      metadata: { platform, nicheHash, creatorCount: creators.length },
    });
  }
}
