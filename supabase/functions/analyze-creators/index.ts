import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { AnalyzeCreatorsRequestSchema } from "../_shared/validators.ts";
import { buildAnalysisPrompt } from "./prompts.ts";
import {
  callOpenRouter,
  extractToolUse,
  convertTool,
  MODELS,
  type ChatMessage,
} from "../_shared/openrouter.ts";

const MODEL = MODELS.CONTENT_GENERATION;
const TOP_SAMPLES_LIMIT = 50;

const WritingProfileTool = {
  name: "create_writing_profile",
  description: "Create a structured writing profile from content analysis",
  input_schema: {
    type: "object",
    properties: {
      tone_description: {
        type: "string",
        description: "Detailed description of tone, voice, and personality",
      },
      vocabulary_notes: {
        type: "string",
        description: "Specific vocabulary patterns, phrases, and language style notes",
      },
      format_patterns: {
        type: "object",
        description: "Structural formatting patterns as a JSON object",
        properties: {
          openingStyle: { type: "string" },
          paragraphLength: { type: "string" },
          useOfLists: { type: "string" },
          lineBreaks: { type: "string" },
          closingStyle: { type: "string" },
        },
      },
      structural_patterns: {
        type: "object",
        description: "Content architecture patterns as a JSON object",
        properties: {
          hookTypes: { type: "array", items: { type: "string" } },
          bodyStructure: { type: "string" },
          ctaPatterns: { type: "array", items: { type: "string" } },
          contentRatio: { type: "string" },
        },
      },
      example_hooks: {
        type: "array",
        items: { type: "string" },
        description: "5 example hook styles extracted from high-performing content",
      },
      hashtag_strategy: {
        type: "object",
        description: "Hashtag usage strategy as a JSON object",
        properties: {
          averageCount: { type: "number" },
          nicheVsBroad: { type: "string" },
          placement: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    required: [
      "tone_description",
      "vocabulary_notes",
      "format_patterns",
      "structural_patterns",
      "example_hooks",
      "hashtag_strategy",
    ],
  },
};

const openAITool = convertTool(WritingProfileTool);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = "analyze-creators";

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new AppError("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new AppError("Invalid or expired token", 401);

    // Parse and validate body
    const rawBody = await req.json();
    const parseResult = AnalyzeCreatorsRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      throw new AppError("Invalid request body", 400, { issues: parseResult.error.issues });
    }
    const { userId, platform } = parseResult.data;

    if (user.id !== userId) throw new AppError("Forbidden", 403);

    logger.info("Creator analysis started", {
      functionName,
      userId,
      metadata: { platform },
    });

    // Fetch top content samples by engagement score
    const { data: samples, error: samplesError } = await supabaseAdmin
      .from("creator_content_samples")
      .select(
        "content_text, content_type, engagement_score, likes_count, comments_count, shares_count, creator_profile_id"
      )
      .eq("platform", platform)
      .in(
        "creator_profile_id",
        supabaseAdmin
          .from("creator_profiles")
          .select("id")
          .eq("user_id", userId)
          .eq("platform", platform)
      )
      .order("engagement_score", { ascending: false })
      .limit(TOP_SAMPLES_LIMIT);

    if (samplesError) {
      throw new AppError("Failed to fetch content samples", 500, {
        error: samplesError.message,
      });
    }

    if (!samples || samples.length === 0) {
      throw new AppError(
        "No content samples found. Please scrape creators first.",
        422
      );
    }

    logger.info("Building analysis prompt", {
      functionName,
      userId,
      metadata: { sampleCount: samples.length, platform },
    });

    const { system, user: userMessage } = buildAnalysisPrompt(platform, samples);

    // Call OpenRouter with Claude Sonnet 4 (needs tool use)
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ];

    const response = await callOpenRouter(
      {
        model: MODEL,
        messages,
        tools: [openAITool],
        tool_choice: { type: "function", function: { name: WritingProfileTool.name } },
        max_tokens: 2048,
      },
      { functionName, userId },
    );

    const profileData = extractToolUse(response);
    if (!profileData) throw new AppError("No analysis result from AI", 500);

    // Upsert writing profile
    const { data: writingProfile, error: upsertError } = await supabaseAdmin
      .from("content_writing_profiles")
      .upsert(
        {
          user_id: userId,
          platform,
          tone_description: profileData.tone_description as string,
          vocabulary_notes: profileData.vocabulary_notes as string,
          format_patterns: profileData.format_patterns as Record<string, unknown>,
          structural_patterns: profileData.structural_patterns as Record<string, unknown>,
          example_hooks: profileData.example_hooks as string[],
          hashtag_strategy: profileData.hashtag_strategy as Record<string, unknown>,
          generated_by_model: MODEL,
          last_refreshed: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
      )
      .select()
      .single();

    if (upsertError || !writingProfile) {
      throw new AppError("Failed to save writing profile", 500);
    }

    logger.info("Creator analysis completed", {
      functionName,
      userId,
      metadata: { platform, profileId: writingProfile.id },
    });

    return new Response(
      JSON.stringify({ success: true, writingProfile }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, functionName);
  }
});
