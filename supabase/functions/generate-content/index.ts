import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { GenerateContentRequestSchema } from "../_shared/validators.ts";
import {
  callOpenRouter,
  extractToolUse,
  MODELS,
  type ChatMessage,
} from "../_shared/openrouter.ts";
import {
  embedText,
  findSimilarEntries,
  isEmbeddingEnabled,
} from "../_shared/embeddings.ts";
import type { ContentType, DiaryEntry, ContentWritingProfile } from "../_shared/types.ts";
import {
  buildLinkedInPostPrompt,
  buildCarouselPrompt,
  buildThreadPrompt,
  buildTweetPrompt,
  buildReelCaptionPrompt,
} from "./prompts.ts";
import { contentTools } from "./schemas.ts";

const MODEL = MODELS.CONTENT_GENERATION;

function selectPromptBuilder(
  contentType: ContentType,
  platform: string
): (ctx: {
  diaryText: string;
  writingProfile: ContentWritingProfile | null;
  recentEntries: DiaryEntry[];
  industry: string;
  userPersona?: Record<string, unknown> | null;
}) => { system: string; user: string } {
  if (platform === "x" && contentType === "post") return buildTweetPrompt;
  if (platform === "x" && contentType === "thread") return buildThreadPrompt;
  if (contentType === "carousel") return buildCarouselPrompt;
  if (contentType === "reel_caption") return buildReelCaptionPrompt;
  return buildLinkedInPostPrompt;
}

function selectTool(contentType: ContentType, platform: string) {
  if (platform === "x" && contentType === "thread") return contentTools.thread;
  if (platform === "x" && contentType === "post") return contentTools.single_post;
  if (contentType === "carousel") return contentTools.carousel;
  if (contentType === "reel_caption") return contentTools.reel_caption;
  return contentTools.linkedin_post;
}

function buildBodyText(contentType: ContentType, toolInput: Record<string, unknown>): string {
  if (contentType === "thread") {
    const tweets = toolInput.tweets as Array<{ order: number; text: string }>;
    return tweets.map((t) => t.text).join("\n\n");
  }
  if (contentType === "carousel") {
    return (toolInput.caption as string) ?? "";
  }
  return (toolInput.bodyText as string) ?? "";
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = "generate-content";

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new AppError("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new AppError("Invalid or expired token", 401);

    // Parse and validate body
    const rawBody = await req.json();
    const parseResult = GenerateContentRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      throw new AppError("Invalid request body", 400, { issues: parseResult.error.issues });
    }
    const { userId, diaryEntryId, platform, contentType } = parseResult.data;

    if (user.id !== userId) throw new AppError("Forbidden", 403);

    logger.info("Content generation started", {
      functionName,
      userId,
      metadata: { platform, contentType, diaryEntryId },
    });

    // Fetch diary entry
    const { data: diaryEntry, error: entryError } = await supabaseAdmin
      .from("diary_entries")
      .select("*")
      .eq("id", diaryEntryId)
      .eq("user_id", userId)
      .single();

    if (entryError || !diaryEntry) throw new AppError("Diary entry not found", 404);

    const diaryText =
      diaryEntry.transcription_text ?? diaryEntry.text_content ?? "";
    if (!diaryText.trim()) throw new AppError("Diary entry has no content to generate from", 422);

    // Fetch writing profile
    const { data: writingProfile } = await supabaseAdmin
      .from("content_writing_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform)
      .maybeSingle();

    // Fetch user persona for richer content
    const { data: personaData } = await supabaseAdmin
      .from("user_persona")
      .select("company_name, job_title, personality_traits, communication_style, writing_tone, interests, values, founder_story, biggest_challenges, content_themes, audience_connection_style")
      .eq("user_id", userId)
      .maybeSingle();

    // Fetch user profile for industry
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("industry")
      .eq("id", userId)
      .single();

    const industry = profile?.industry ?? "technology";

    // RAG: semantic retrieval of relevant diary entries (falls back to chronological)
    let recentEntries: DiaryEntry[] = [];
    let retrievalMethod = "chronological";

    if (isEmbeddingEnabled()) {
      try {
        const queryEmbedding = await embedText(diaryText);
        const similar = await findSimilarEntries(
          supabaseAdmin,
          queryEmbedding,
          userId,
          diaryEntryId,
          5,
        );

        if (similar.length >= 3) {
          recentEntries = similar as unknown as DiaryEntry[];
          retrievalMethod = "semantic";
        }
      } catch (err) {
        logger.warn("Semantic retrieval failed — falling back to chronological", {
          functionName,
          userId,
          metadata: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    }

    // Fallback: chronological last 3 if semantic retrieval unavailable or insufficient
    if (retrievalMethod === "chronological") {
      const { data: chronoEntries } = await supabaseAdmin
        .from("diary_entries")
        .select("id, entry_date, text_content, transcription_text")
        .eq("user_id", userId)
        .neq("id", diaryEntryId)
        .order("entry_date", { ascending: false })
        .limit(3);
      recentEntries = (chronoEntries ?? []) as DiaryEntry[];
    }

    logger.info("Context entries retrieved", {
      functionName,
      userId,
      metadata: { method: retrievalMethod, count: recentEntries.length },
    });

    // Build prompt
    const promptBuilder = selectPromptBuilder(contentType, platform);
    const { system, user: userMessage } = promptBuilder({
      diaryText,
      writingProfile: writingProfile ?? null,
      recentEntries,
      industry,
      userPersona: personaData ?? null,
    });

    const tool = selectTool(contentType, platform);

    // Call OpenRouter
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ];

    const response = await callOpenRouter(
      {
        model: MODEL,
        messages,
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
        max_tokens: 2048,
      },
      { functionName, userId },
    );

    const toolInput = extractToolUse(response);
    if (!toolInput) throw new AppError("No content generated by AI", 500);

    // Build the post record
    const bodyText = buildBodyText(contentType, toolInput);
    const carouselSlides =
      contentType === "carousel" ? toolInput.slides : null;
    const threadTweets =
      contentType === "thread" ? toolInput.tweets : null;
    const imagePrompt =
      (toolInput.imagePrompt as string) ??
      (toolInput.conceptDescription as string) ??
      null;

    const { data: newPost, error: insertError } = await supabaseAdmin
      .from("generated_posts")
      .insert({
        user_id: userId,
        diary_entry_id: diaryEntryId,
        platform,
        content_type: contentType,
        title: (toolInput.title as string) ?? null,
        body_text: bodyText,
        carousel_slides: carouselSlides ?? null,
        thread_tweets: threadTweets ?? null,
        image_prompt: imagePrompt,
        status: "draft",
        generation_metadata: {
          model: MODEL,
          tool: tool.function.name,
          generatedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError || !newPost) {
      throw new AppError("Failed to save generated post", 500);
    }

    logger.info("Content generation completed", {
      functionName,
      userId,
      metadata: { postId: newPost.id, platform, contentType },
    });

    return new Response(JSON.stringify({ success: true, post: newPost }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error, functionName);
  }
});
