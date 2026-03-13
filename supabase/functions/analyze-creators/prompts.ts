import type { Platform } from "../_shared/types.ts";

interface ContentSampleRow {
  content_text: string;
  content_type: string | null;
  engagement_score: number | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
}

export function buildAnalysisPrompt(
  platform: Platform,
  samples: ContentSampleRow[]
): { system: string; user: string } {
  const platformName = platform === "x" ? "X (Twitter)" : platform.charAt(0).toUpperCase() + platform.slice(1);

  const formattedSamples = samples
    .map((sample, index) => {
      const engagement = sample.engagement_score?.toFixed(4) ?? "0";
      const likes = sample.likes_count ?? 0;
      const comments = sample.comments_count ?? 0;
      const shares = sample.shares_count ?? 0;
      return `[Sample ${index + 1}] Type: ${sample.content_type ?? "post"} | Engagement: ${engagement} | Likes: ${likes} | Comments: ${comments} | Shares: ${shares}\n"${sample.content_text.slice(0, 500)}"`;
    })
    .join("\n\n---\n\n");

  const system = `You are an expert content strategist specializing in ${platformName} for founders and entrepreneurs. Your task is to analyze a collection of high-performing content samples and extract a writing profile that captures the patterns, tone, and strategies that make this content successful.

Be specific and actionable. The writing profile you create will be used to generate new content that mimics the successful patterns.`;

  const user = `Analyze these ${samples.length} high-performing ${platformName} content samples from creators in this founder's niche. Extract the key patterns that drive engagement.

${formattedSamples}

Based on these samples, generate a comprehensive writing profile with:
1. **tone_description**: The overall tone and voice (e.g., "vulnerable and honest with occasional humor, uses first-person storytelling, avoids corporate jargon")
2. **vocabulary_notes**: Specific vocabulary patterns (e.g., "uses 'we built', 'we failed', 'here's what I learned', avoids passive voice")
3. **format_patterns**: JSON object describing structural patterns (opening style, paragraph length, use of lists, closing patterns)
4. **structural_patterns**: JSON object describing content architecture (hook types, body structure, CTA patterns)
5. **example_hooks**: Array of 5 example hook styles extracted from the best-performing content
6. **hashtag_strategy**: JSON object describing hashtag usage (count, mix of niche vs broad, placement)`;

  return { system, user };
}
