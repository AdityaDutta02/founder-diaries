import type { ContentWritingProfile, DiaryEntry } from "../_shared/types.ts";

interface PromptContext {
  diaryText: string;
  writingProfile: ContentWritingProfile | null;
  recentEntries: DiaryEntry[];
  industry: string;
}

function buildWritingProfileInstructions(writingProfile: ContentWritingProfile | null): string {
  if (!writingProfile) {
    return "Use a professional, authentic, and engaging tone suited to the platform.";
  }

  const parts: string[] = [];

  if (writingProfile.tone_description) {
    parts.push(`Tone: ${writingProfile.tone_description}`);
  }
  if (writingProfile.vocabulary_notes) {
    parts.push(`Vocabulary style: ${writingProfile.vocabulary_notes}`);
  }
  if (writingProfile.example_hooks && writingProfile.example_hooks.length > 0) {
    parts.push(`Example hook styles:\n${writingProfile.example_hooks.slice(0, 3).map((h) => `- ${h}`).join("\n")}`);
  }
  if (writingProfile.hashtag_strategy) {
    const strategy = writingProfile.hashtag_strategy as Record<string, unknown>;
    if (strategy.description) {
      parts.push(`Hashtag strategy: ${strategy.description}`);
    }
  }

  return parts.join("\n\n");
}

function buildRecentContext(recentEntries: DiaryEntry[]): string {
  if (recentEntries.length === 0) return "";
  const summaries = recentEntries
    .map((e) => `- ${e.entry_date}: ${(e.text_content ?? e.transcription_text ?? "").slice(0, 150)}`)
    .join("\n");
  return `\n\nRecent diary context (for narrative continuity):\n${summaries}`;
}

export function buildLinkedInPostPrompt(ctx: PromptContext): { system: string; user: string } {
  const profileInstructions = buildWritingProfileInstructions(ctx.writingProfile);
  const recentContext = buildRecentContext(ctx.recentEntries);

  const system = `You are a LinkedIn content strategist helping a founder in the ${ctx.industry} industry share authentic stories from their journey.

${profileInstructions}

LinkedIn post guidelines:
- Start with a hook that stops the scroll (question, bold statement, or surprising insight)
- Use short paragraphs (1-3 sentences each) for mobile readability
- Include a personal insight or lesson learned
- End with a call to action or thought-provoking question
- 150-300 words optimal
- Include 3-5 relevant hashtags at the end
- Suggest an image concept that complements the post`;

  const user = `Transform this diary entry into a compelling LinkedIn post:

"${ctx.diaryText}"${recentContext}

Generate a post that feels authentic, not promotional. Focus on the human story and the lesson.`;

  return { system, user };
}

export function buildCarouselPrompt(ctx: PromptContext): { system: string; user: string } {
  const profileInstructions = buildWritingProfileInstructions(ctx.writingProfile);
  const recentContext = buildRecentContext(ctx.recentEntries);

  const system = `You are a LinkedIn carousel designer helping a founder in the ${ctx.industry} industry create educational and inspiring content.

${profileInstructions}

LinkedIn carousel guidelines:
- Slide 1: Bold hook/title that promises value
- Slides 2-6: One key insight per slide, short and punchy
- Last slide: Clear takeaway and call to action
- Each slide: max 30 words of body text
- Visual prompt for each slide should be concrete and minimal
- Include 3-5 hashtags for the caption`;

  const user = `Transform this diary entry into a LinkedIn carousel (5-7 slides):

"${ctx.diaryText}"${recentContext}

Make it feel like a founder sharing hard-won wisdom, not a polished marketing deck.`;

  return { system, user };
}

export function buildThreadPrompt(ctx: PromptContext): { system: string; user: string } {
  const profileInstructions = buildWritingProfileInstructions(ctx.writingProfile);
  const recentContext = buildRecentContext(ctx.recentEntries);

  const system = `You are an X (Twitter) content strategist helping a founder in the ${ctx.industry} industry share their journey in thread format.

${profileInstructions}

X thread guidelines:
- Tweet 1: Hook that makes people want to read more (end with "A thread:")
- Tweets 2-7: Each tweet is one point/insight, max 280 characters
- Final tweet: Summary or call to action
- Conversational, direct tone
- No hashtag overload — 1-2 max, only if genuinely relevant`;

  const user = `Transform this diary entry into an X thread (6-8 tweets):

"${ctx.diaryText}"${recentContext}

Write in a raw, honest founder voice. No corporate speak.`;

  return { system, user };
}

export function buildTweetPrompt(ctx: PromptContext): { system: string; user: string } {
  const profileInstructions = buildWritingProfileInstructions(ctx.writingProfile);

  const system = `You are an X (Twitter) content strategist helping a founder in the ${ctx.industry} industry craft single, impactful posts.

${profileInstructions}

Single tweet guidelines:
- Max 280 characters
- One clear idea or insight
- Conversational and direct
- Optionally suggest an image concept`;

  const user = `Distill the core insight from this diary entry into a single tweet (max 280 characters):

"${ctx.diaryText}"

Capture the most shareable, thought-provoking element.`;

  return { system, user };
}

export function buildReelCaptionPrompt(ctx: PromptContext): { system: string; user: string } {
  const profileInstructions = buildWritingProfileInstructions(ctx.writingProfile);
  const recentContext = buildRecentContext(ctx.recentEntries);

  const system = `You are an Instagram Reels content strategist helping a founder in the ${ctx.industry} industry create authentic short-form video content.

${profileInstructions}

Instagram Reel caption guidelines:
- Caption: 100-150 words, conversational
- Hook in first line (shows before "more" cutoff)
- Describe what the reel video should show (b-roll concept, talking head points)
- 5-10 hashtags mixing niche and broad
- Optional: suggest audio/music vibe`;

  const user = `Transform this diary entry into an Instagram Reel concept and caption:

"${ctx.diaryText}"${recentContext}

Make it feel like a day-in-the-life or behind-the-scenes moment that resonates with aspiring founders.`;

  return { system, user };
}
