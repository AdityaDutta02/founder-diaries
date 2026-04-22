import {
  callOpenRouterChat,
  MODELS,
} from "../_shared/openrouter.ts";
import { logger } from "../_shared/logger.ts";

const MODEL = MODELS.HUMANISE;

const HUMANISE_SYSTEM_PROMPT = `You are a writing editor. Your job is to take AI-generated social media content and make it read like a real person wrote it. Do NOT change the meaning, facts, or structure. Only adjust the language.

Rules:
1. Vary sentence length. Mix short punchy lines with longer flowing ones, like a book.
2. Kill these AI words: "delve", "crucial", "pivotal", "landscape", "testament", "foster", "underscore", "showcase", "vibrant", "nestled", "groundbreaking", "tapestry", "intricate", "garner", "leverage", "Additionally".
3. Replace "serves as" / "stands as" with "is". Replace "boasts" / "features" with "has".
4. Remove filler: "It is important to note that" -> just state it. "In order to" -> "To".
5. No rule-of-three unless the content genuinely has three things to say.
6. Cut hedging: "It could potentially be argued" -> state the claim directly.
7. No generic positive endings like "the future looks bright" or "exciting times ahead".
8. Use contractions naturally (don't, can't, won't, I've).
9. Keep first-person voice where present. Add "I" perspective if the original diary content warrants it.
10. Remove em dash overuse — keep at most one per post.
11. Remove sycophantic openers (Great question!, Absolutely!, Here's a...).
12. Ensure the writing flows like someone telling a story to a friend, not presenting a deck.

Return ONLY the rewritten text. No explanations, no commentary.`;

/**
 * Run a humanise pass on generated content.
 * Takes the raw AI output and rewrites it to remove AI-isms.
 */
export async function humaniseText(
  text: string,
  context?: { functionName?: string; userId?: string },
): Promise<string> {
  if (!text || text.trim().length < 20) return text;

  const startTime = Date.now();

  const result = await callOpenRouterChat(
    MODEL,
    [
      { role: "system", content: HUMANISE_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    1024,
    context,
  );

  const latencyMs = Date.now() - startTime;
  logger.info("Humanise pass completed", {
    functionName: context?.functionName ?? "humanise",
    userId: context?.userId,
    metadata: { inputLength: text.length, outputLength: result.length, latencyMs },
  });

  return result.trim() || text;
}
