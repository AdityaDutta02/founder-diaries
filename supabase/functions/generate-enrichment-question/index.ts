import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import {
  callOpenRouterChat,
  MODELS,
  type ChatMessage,
} from "../_shared/openrouter.ts";

const FUNCTION_NAME = "generate-enrichment-question";
const MODEL = MODELS.ANALYSIS;

type QuestionCategory = "professional" | "personal" | "lifestyle" | "values" | "story";

interface QuestionEntry {
  text: string;
  category: QuestionCategory;
}

// Hardcoded pool of 60 questions across 5 categories
const QUESTION_POOL: QuestionEntry[] = [
  // professional (12)
  { category: "professional", text: "What's the company or project you're most proud of building?" },
  { category: "professional", text: "What problem were you trying to solve when you started your current venture?" },
  { category: "professional", text: "What's the biggest lesson your first failure taught you?" },
  { category: "professional", text: "How did you get into your industry?" },
  { category: "professional", text: "What does a really good work day look like for you?" },
  { category: "professional", text: "What skill do you wish you had developed earlier?" },
  { category: "professional", text: "Who's a mentor or role model who shaped how you work?" },
  { category: "professional", text: "What's the one thing about your industry most people get wrong?" },
  { category: "professional", text: "What does success look like for you 3 years from now?" },
  { category: "professional", text: "What's a decision you made that looked risky but felt right?" },
  { category: "professional", text: "What part of your work energizes you the most?" },
  { category: "professional", text: "What would you do if you knew you couldn't fail?" },
  // personal (12)
  { category: "personal", text: "What's your morning routine when things are going well?" },
  { category: "personal", text: "What did you want to be when you were 12?" },
  { category: "personal", text: "What's the last thing that genuinely surprised you?" },
  { category: "personal", text: "What's your go-to order when you want to treat yourself?" },
  { category: "personal", text: "What do you do to unwind after a hard day?" },
  { category: "personal", text: "Who's the most interesting person you've met in the last year?" },
  { category: "personal", text: "What's a book or podcast that changed how you think?" },
  { category: "personal", text: "What's a skill or hobby you picked up during a quiet period of your life?" },
  { category: "personal", text: "What's something you've changed your mind about recently?" },
  { category: "personal", text: "What city or place has shaped you the most?" },
  { category: "personal", text: "What's your relationship with exercise or movement?" },
  { category: "personal", text: "What does a great weekend look like for you?" },
  // lifestyle (12)
  { category: "lifestyle", text: "Are you more of a morning person or night owl?" },
  { category: "lifestyle", text: "What's your favourite kind of food?" },
  { category: "lifestyle", text: "Do you work better alone or with people around?" },
  { category: "lifestyle", text: "What app do you use most that most people haven't heard of?" },
  { category: "lifestyle", text: "What's your coffee or tea order?" },
  { category: "lifestyle", text: "Where do your best ideas usually come from?" },
  { category: "lifestyle", text: "What's your workspace like?" },
  { category: "lifestyle", text: "What's the last thing you splurged on without regret?" },
  { category: "lifestyle", text: "How do you prefer to travel?" },
  { category: "lifestyle", text: "What's your favourite way to celebrate a win?" },
  { category: "lifestyle", text: "What music do you listen to when you need to focus?" },
  { category: "lifestyle", text: "What would people be surprised to know you enjoy?" },
  // values (12)
  { category: "values", text: "What's something you refuse to compromise on?" },
  { category: "values", text: "What does 'doing good work' mean to you?" },
  { category: "values", text: "What's a cause you care about that isn't obvious from your job?" },
  { category: "values", text: "How important is money vs impact in your decisions?" },
  { category: "values", text: "What's a boundary you've had to set in your professional life?" },
  { category: "values", text: "Who do you build things for?" },
  { category: "values", text: "What legacy do you want to leave in your industry?" },
  { category: "values", text: "What does loyalty mean to you?" },
  { category: "values", text: "What's something you believe that most people in your field disagree with?" },
  { category: "values", text: "How do you define integrity in your work?" },
  { category: "values", text: "What would you never sacrifice for success?" },
  { category: "values", text: "What's a value you were raised with that still guides you?" },
  // story (12)
  { category: "story", text: "What's the moment you decided to go all in on what you're doing?" },
  { category: "story", text: "What's a story from your childhood that explains a lot about who you are today?" },
  { category: "story", text: "What's the hardest chapter of your professional life so far?" },
  { category: "story", text: "What's a time you helped someone that you still think about?" },
  { category: "story", text: "What's a moment where everything almost fell apart?" },
  { category: "story", text: "Tell me about a time you felt completely out of your depth." },
  { category: "story", text: "What's a story you've never quite known how to tell publicly?" },
  { category: "story", text: "What's a pivot or change that turned out to be the best thing that happened?" },
  { category: "story", text: "What's something you built or created that you're quietly really proud of?" },
  { category: "story", text: "What's a mistake you made that others could learn from?" },
  { category: "story", text: "What's the story behind your name or where you're from?" },
  { category: "story", text: "What's a relationship that changed the direction of your life?" },
];

interface PersonaRow {
  confidence_score: number | null;
  personality_traits: unknown;
  communication_style: string | null;
  content_themes: unknown;
}

interface AskedQuestionRow {
  question: string;
  question_category: string | null;
}

interface ProfileRow {
  full_name: string | null;
  industry: string | null;
}

function pickQuestionFromPool(
  askedQuestions: AskedQuestionRow[],
  persona: PersonaRow | null
): QuestionEntry | null {
  const askedTexts = new Set(askedQuestions.map((q) => q.question));

  const answeredPerCategory: Record<QuestionCategory, number> = {
    professional: 0,
    personal: 0,
    lifestyle: 0,
    values: 0,
    story: 0,
  };
  for (const q of askedQuestions) {
    if (q.question_category && q.question_category in answeredPerCategory) {
      answeredPerCategory[q.question_category as QuestionCategory]++;
    }
  }

  const remaining = QUESTION_POOL.filter((q) => !askedTexts.has(q.text));
  if (remaining.length === 0) return null;

  const confidenceScore = persona?.confidence_score ?? 0;
  if (confidenceScore < 0.4) {
    const categoryOrder: QuestionCategory[] = ["professional", "story", "values", "personal", "lifestyle"];
    for (const cat of categoryOrder) {
      const candidate = remaining.find((q) => q.category === cat);
      if (candidate) return candidate;
    }
    return remaining[0];
  }

  const sortedCategories = (Object.keys(answeredPerCategory) as QuestionCategory[]).sort(
    (a, b) => answeredPerCategory[a] - answeredPerCategory[b]
  );

  for (const cat of sortedCategories) {
    const candidate = remaining.find((q) => q.category === cat);
    if (candidate) return candidate;
  }

  return remaining[0];
}

async function pickQuestionWithAI(
  askedQuestions: AskedQuestionRow[],
  persona: PersonaRow | null,
  profile: ProfileRow,
  remaining: QuestionEntry[]
): Promise<QuestionEntry> {
  const candidateSample = remaining.slice(0, 15);
  const candidateList = candidateSample
    .map((q, i) => `${i + 1}. [${q.category}] ${q.text}`)
    .join("\n");

  const personaSummary = persona
    ? `Communication style: ${persona.communication_style ?? "unknown"}\nContent themes: ${JSON.stringify(persona.content_themes ?? [])}`
    : "No persona built yet.";

  const answeredCategories = askedQuestions.reduce<Record<string, number>>((acc, q) => {
    const cat = q.question_category ?? "unknown";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const prompt = `You are selecting the best next onboarding question for a founder building their personal brand.

ABOUT THIS USER:
Name: ${profile.full_name ?? "unknown"}
Industry: ${profile.industry ?? "unknown"}
${personaSummary}

QUESTIONS ALREADY ASKED PER CATEGORY:
${JSON.stringify(answeredCategories, null, 2)}

CANDIDATE QUESTIONS (pick one):
${candidateList}

Pick the single question that will surface the most UNIQUE, USEFUL, and AUTHENTIC information we don't yet have. Prefer questions from under-represented categories. Return ONLY a JSON object:
\`\`\`json
{"index": 1}
\`\`\`
Where index is 1-based from the candidate list above.`;

  try {
    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
    const rawText = await callOpenRouterChat(MODEL, messages, 100, {
      functionName: FUNCTION_NAME,
    });

    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : rawText.trim();
    const parsed = JSON.parse(jsonStr) as { index: number };
    const idx = parsed.index - 1;
    if (idx >= 0 && idx < candidateSample.length) {
      return candidateSample[idx];
    }
  } catch {
    // Fall back to first candidate on any failure
  }

  return candidateSample[0];
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

    logger.info("Enrichment question generation started", {
      functionName: FUNCTION_NAME,
      userId,
    });

    // Fetch existing persona
    const { data: persona } = await supabaseAdmin
      .from("user_persona")
      .select("confidence_score, personality_traits, communication_style, content_themes")
      .eq("user_id", userId)
      .maybeSingle();

    // Fetch all previously asked questions to avoid repeats
    const { data: askedQuestions, error: askedError } = await supabaseAdmin
      .from("persona_enrichment_answers")
      .select("question, question_category")
      .eq("user_id", userId);

    if (askedError) {
      logger.warn("Failed to fetch asked questions — proceeding with empty set", {
        functionName: FUNCTION_NAME,
        userId,
        metadata: { error: askedError.message },
      });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, industry")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new AppError("Failed to fetch user profile", 500, { detail: profileError?.message });
    }

    const safeAsked: AskedQuestionRow[] = askedQuestions ?? [];
    const askedTexts = new Set(safeAsked.map((q) => q.question));
    const remaining = QUESTION_POOL.filter((q) => !askedTexts.has(q.text));

    if (remaining.length === 0) {
      return new Response(
        JSON.stringify({ success: false, reason: "all_questions_asked" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const confidenceScore = (persona as PersonaRow | null)?.confidence_score ?? 0;
    const totalAsked = safeAsked.length;

    let selectedQuestion: QuestionEntry;

    // Use AI when we have enough context, otherwise deterministic
    if (confidenceScore > 0.2 && totalAsked >= 3) {
      selectedQuestion = await pickQuestionWithAI(
        safeAsked,
        persona as PersonaRow | null,
        profile as ProfileRow,
        remaining
      );
    } else {
      const picked = pickQuestionFromPool(safeAsked, persona as PersonaRow | null);
      if (!picked) {
        return new Response(
          JSON.stringify({ success: false, reason: "all_questions_asked" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      selectedQuestion = picked;
    }

    // Save the question to the database
    const { data: savedQuestion, error: insertError } = await supabaseAdmin
      .from("persona_enrichment_answers")
      .insert({
        user_id: userId,
        question: selectedQuestion.text,
        question_category: selectedQuestion.category,
        is_answered: false,
        asked_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !savedQuestion) {
      throw new AppError("Failed to save enrichment question", 500, {
        detail: insertError?.message,
      });
    }

    logger.info("Enrichment question generated and saved", {
      functionName: FUNCTION_NAME,
      userId,
      metadata: {
        questionId: savedQuestion.id,
        category: selectedQuestion.category,
        confidenceScore,
        totalAsked,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        question: selectedQuestion.text,
        question_id: savedQuestion.id,
        category: selectedQuestion.category,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, FUNCTION_NAME);
  }
});
