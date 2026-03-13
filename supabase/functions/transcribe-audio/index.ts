import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { TranscribeRequestSchema } from "../_shared/validators.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = "transcribe-audio";

  try {
    // Validate JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new AppError("Missing Authorization header", 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      throw new AppError("Invalid or expired token", 401);
    }

    logger.info("Transcription request received", { functionName, userId: user.id });

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = TranscribeRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      throw new AppError("Invalid request body", 400, {
        issues: parseResult.error.issues,
      });
    }
    const { diaryEntryId, audioStoragePath } = parseResult.data;

    // Verify the diary entry belongs to the authenticated user
    const { data: diaryEntry, error: entryError } = await supabaseAdmin
      .from("diary_entries")
      .select("id, user_id")
      .eq("id", diaryEntryId)
      .single();

    if (entryError || !diaryEntry) {
      throw new AppError("Diary entry not found", 404);
    }
    if (diaryEntry.user_id !== user.id) {
      throw new AppError("Forbidden", 403);
    }

    // Mark transcription as processing
    await supabaseAdmin
      .from("diary_entries")
      .update({ transcription_status: "processing", updated_at: new Date().toISOString() })
      .eq("id", diaryEntryId);

    // Download audio from storage
    const { data: audioData, error: downloadError } = await supabaseAdmin.storage
      .from("diary-audio")
      .download(audioStoragePath);

    if (downloadError || !audioData) {
      await supabaseAdmin
        .from("diary_entries")
        .update({ transcription_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", diaryEntryId);
      throw new AppError("Failed to download audio file", 500, {
        storageError: downloadError?.message,
      });
    }

    logger.info("Audio downloaded, sending to Groq", { functionName, userId: user.id });

    // Build form data for Groq Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([await audioData.arrayBuffer()], { type: "audio/webm" });
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "json");

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      throw new AppError("GROQ_API_KEY not configured", 500);
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: formData,
      }
    );

    if (!groqResponse.ok) {
      const groqError = await groqResponse.text();
      logger.error("Groq transcription failed", {
        functionName,
        userId: user.id,
        metadata: { status: groqResponse.status, body: groqError },
      });
      await supabaseAdmin
        .from("diary_entries")
        .update({ transcription_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", diaryEntryId);
      throw new AppError("Transcription service error", 502);
    }

    const groqResult = await groqResponse.json();
    const transcriptionText: string = groqResult.text ?? "";

    // Persist transcription result
    const { error: updateError } = await supabaseAdmin
      .from("diary_entries")
      .update({
        transcription_text: transcriptionText,
        transcription_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", diaryEntryId);

    if (updateError) {
      throw new AppError("Failed to save transcription", 500);
    }

    logger.info("Transcription completed successfully", { functionName, userId: user.id });

    return new Response(
      JSON.stringify({ success: true, transcriptionText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, functionName);
  }
});
