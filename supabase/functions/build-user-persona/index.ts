import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import {
  callOpenRouterChat,
  MODELS,
  type ChatMessage,
} from "../_shared/openrouter.ts";

const FUNCTION_NAME = "build-user-persona";
const MODEL = MODELS.ANALYSIS;
const MIN_ENTRIES_REQUIRED = 2;
const MAX_ENTRIES_TO_FETCH = 100;

interface DiaryEntryRow {
  id: string;
  entry_date: string;
  text_content: string | null;
  transcription_text: string | null;
  mood: string | null;
  created_at: string;
}

interface EnrichmentAnswerRow {
  question: string;
  question_category: string | null;
  answer: string | null;
}

interface ProfileRow {
  full_name: string | null;
  industry: string | null;
  niche_keywords: string[] | null;
}

interface ExistingPersonaRow {
  confidence_score: number | null;
  entry_count_at_last_analysis: number | null;
}

interface PersonaPayload {
  company_name: string | null;
  job_title: string | null;
  years_experience: number | null;
  personality_traits: string[];
  communication_style: string | null;
  writing_tone: string | null;
  interests: string[];
  hobbies: string[];
  values: string[];
  life_context: Record<string, unknown>;
  founder_story: string | null;
  biggest_challenges: string[];
  proudest_wins: string[];
  content_themes: string[];
  emotional_range: string | null;
  audience_connection_style: string | null;
  confidence_score: number;
}

function buildPersonaPrompt(
  entries: DiaryEntryRow[],
  answers: EnrichmentAnswerRow[],
  profile: ProfileRow,
  existingPersona: ExistingPersonaRow | null,
  entryCount: number
): string {
  const entrySummaries = entries
    .map((e) => {
      const text = e.text_content ?? e.transcription_text ?? "";
      return `[${e.entry_date}] mood: ${e.mood ?? "unknown"}\n${text.slice(0, 600)}`;
    })
    .join("\n\n---\n\n");

  const answeredQAs = answers
    .filter((a) => a.answer)
    .map((a) => `Category: ${a.question_category ?? "general"}\nQ: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");

  const profileContext = [
    profile.full_name ? `Name: ${profile.full_name}` : null,
    profile.industry ? `Industry: ${profile.industry}` : null,
    profile.niche_keywords?.length
      ? `Niche keywords: ${profile.niche_keywords.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const incrementalNote =
    existingPersona
      ? `\n\nNOTE: This is an incremental update. Previous confidence score was ${existingPersona.confidence_score ?? 0}. The user now has ${entryCount} entries (previously ${existingPersona.entry_count_at_last_analysis ?? 0}). Refine and deepen the profile based on the new data.`
      : "";

  return `You are building a rich, nuanced personal brand profile for a founder. Your goal is to deeply understand who this person is so that an AI can later generate content that sounds authentically like them — not generic.

CRITICAL INSTRUCTION: Infer personality, communication style, and tone primarily from HOW they write — their sentence structure, vocabulary choices, what they emphasise, how they express emotions — not just what they write about.

PROFILE CONTEXT:
${profileContext}${incrementalNote}

DIARY ENTRIES (${entries.length} total, up to 600 chars each):
${entrySummaries}

${answeredQAs ? `ENRICHMENT Q&A ANSWERS:\n${answeredQAs}` : "No enrichment answers provided yet."}

Analyse all of the above carefully and return a JSON object with EXACTLY the following fields. Do not include any text outside the JSON block.

\`\`\`json
{
  "company_name": "string or null — infer from context if mentioned",
  "job_title": "string or null — their role/title",
  "years_experience": "integer or null — estimated years in their field",
  "personality_traits": ["array", "of", "strings", "— 3-7 adjectives inferred from writing style"],
  "communication_style": "one of: formal, conversational, humorous, inspirational — pick closest",
  "writing_tone": "one of: authoritative, vulnerable, energetic, calm — pick closest",
  "interests": ["array of strings — topics they care about beyond work"],
  "hobbies": ["array of strings — activities outside work"],
  "values": ["array of strings — core principles driving their decisions, inferred from writing"],
  "life_context": {"key": "value — free-form facts about their life: family, location, routines, health, etc."},
  "founder_story": "1-2 paragraph narrative about their journey, written in third person, based on what you've learned",
  "biggest_challenges": ["array of strings — recurring struggles mentioned or implied"],
  "proudest_wins": ["array of strings — achievements or moments of pride"],
  "content_themes": ["array of strings — 3-6 recurring themes in their writing"],
  "emotional_range": "brief description of how emotionally varied and expressive they are",
  "audience_connection_style": "brief description of how they naturally connect with an audience — e.g. through vulnerability, storytelling, data, humour",
  "confidence_score": 0.0
}
\`\`\`

For confidence_score:
- 0.0–0.3: fewer than 5 entries, very limited signal
- 0.3–0.6: 5–20 entries, moderate signal
- 0.6–0.8: 20–50 entries or good Q&A answers, strong signal
- 0.8–1.0: 50+ entries and Q&A answers, very strong signal
Current entry count: ${entryCount}. Answered Q&As: ${answeredQAs ? answers.filter((a) => a.answer).length : 0}.

Return ONLY the JSON block. No preamble. No commentary after.`;
}

function extractJsonFromText(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    return text.slice(braceStart, braceEnd + 1);
  }
  return text.trim();
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const rawBody = await req.json();
    const userId: string | undefined = rawBody?.user_id;
    if (!userId || typeof userId !== "string") {
      throw new AppError("Missing or invalid user_id in request body", 400);
    }

    logger.info("Persona build started", { functionName: FUNCTION_NAME, userId });

    // Fetch diary entries — most recent 100
    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("diary_entries")
      .select("id, entry_date, text_content, transcription_text, mood, created_at")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(MAX_ENTRIES_TO_FETCH);

    if (entriesError) {
      throw new AppError("Failed to fetch diary entries", 500, { detail: entriesError.message });
    }

    const safeEntries: DiaryEntryRow[] = entries ?? [];
    const entryCount = safeEntries.length;

    if (entryCount < MIN_ENTRIES_REQUIRED) {
      logger.info("Not enough diary entries for persona build", {
        functionName: FUNCTION_NAME,
        userId,
        metadata: { entryCount },
      });
      return new Response(
        JSON.stringify({ success: false, reason: "not_enough_entries", entryCount }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch answered enrichment Q&As
    const { data: answers, error: answersError } = await supabaseAdmin
      .from("persona_enrichment_answers")
      .select("question, question_category, answer")
      .eq("user_id", userId)
      .eq("is_answered", true);

    if (answersError) {
      logger.warn("Failed to fetch enrichment answers — continuing without them", {
        functionName: FUNCTION_NAME,
        userId,
        metadata: { error: answersError.message },
      });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, industry, niche_keywords")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new AppError("Failed to fetch user profile", 500, { detail: profileError?.message });
    }

    // Fetch existing persona for incremental context
    const { data: existingPersona } = await supabaseAdmin
      .from("user_persona")
      .select("confidence_score, entry_count_at_last_analysis")
      .eq("user_id", userId)
      .maybeSingle();

    const prompt = buildPersonaPrompt(
      safeEntries,
      (answers ?? []) as EnrichmentAnswerRow[],
      profile as ProfileRow,
      existingPersona as ExistingPersonaRow | null,
      entryCount
    );

    // Call OpenRouter with Gemini Flash (analytical task)
    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
    const rawText = await callOpenRouterChat(MODEL, messages, 2000, {
      functionName: FUNCTION_NAME,
      userId,
    });

    let personaPayload: PersonaPayload;
    try {
      const jsonString = extractJsonFromText(rawText);
      personaPayload = JSON.parse(jsonString) as PersonaPayload;
    } catch (parseErr) {
      logger.error("Failed to parse persona JSON", {
        functionName: FUNCTION_NAME,
        userId,
        metadata: { rawText: rawText.slice(0, 500), error: String(parseErr) },
      });
      throw new AppError("Failed to parse persona from AI response", 500);
    }

    // Upsert into user_persona
    const { error: upsertError } = await supabaseAdmin
      .from("user_persona")
      .upsert(
        {
          user_id: userId,
          company_name: personaPayload.company_name ?? null,
          job_title: personaPayload.job_title ?? null,
          years_experience: personaPayload.years_experience ?? null,
          personality_traits: personaPayload.personality_traits ?? [],
          communication_style: personaPayload.communication_style ?? null,
          writing_tone: personaPayload.writing_tone ?? null,
          interests: personaPayload.interests ?? [],
          hobbies: personaPayload.hobbies ?? [],
          values: personaPayload.values ?? [],
          life_context: personaPayload.life_context ?? {},
          founder_story: personaPayload.founder_story ?? null,
          biggest_challenges: personaPayload.biggest_challenges ?? [],
          proudest_wins: personaPayload.proudest_wins ?? [],
          content_themes: personaPayload.content_themes ?? [],
          emotional_range: personaPayload.emotional_range ?? null,
          audience_connection_style: personaPayload.audience_connection_style ?? null,
          confidence_score: personaPayload.confidence_score ?? 0.0,
          last_analyzed_at: new Date().toISOString(),
          entry_count_at_last_analysis: entryCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      throw new AppError("Failed to save persona", 500, { detail: upsertError.message });
    }

    logger.info("Persona build completed", {
      functionName: FUNCTION_NAME,
      userId,
      metadata: {
        model: MODEL,
        entryCount,
        confidenceScore: personaPayload.confidence_score,
        answeredQAs: answers?.length ?? 0,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        confidenceScore: personaPayload.confidence_score,
        entryCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, FUNCTION_NAME);
  }
});
