import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { SyncDiaryRequestSchema } from "../_shared/validators.ts";
import { embedMissingEntries } from "../_shared/embeddings.ts";

const FUNCTION_NAME = "sync-diary";
const DISCOVERY_UNLOCK_THRESHOLD = 7;

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Validate JWT and extract user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new AppError("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new AppError("Invalid or expired token", 401);

    // Parse and validate body
    const rawBody = await req.json();
    const parseResult = SyncDiaryRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      throw new AppError("Invalid request body", 400, { issues: parseResult.error.issues });
    }
    const { entries } = parseResult.data;

    logger.info("Diary sync started", {
      functionName: FUNCTION_NAME,
      userId: user.id,
      metadata: { entryCount: entries.length },
    });

    let syncedCount = 0;
    const audioEntryIds: string[] = [];

    for (const entry of entries) {
      // Upsert diary entry using local_id conflict key
      const { data: upsertedEntry, error: upsertError } = await supabaseAdmin
        .from("diary_entries")
        .upsert(
          {
            user_id: user.id,
            local_id: entry.localId,
            entry_date: entry.entryDate,
            text_content: entry.textContent ?? null,
            raw_audio_url: entry.audioStoragePath ?? null,
            transcription_status: entry.audioStoragePath ? "pending" : null,
            mood: entry.mood ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,local_id" }
        )
        .select("id")
        .single();

      if (upsertError || !upsertedEntry) {
        logger.warn("Failed to upsert diary entry", {
          functionName: FUNCTION_NAME,
          userId: user.id,
          metadata: { localId: entry.localId, error: upsertError?.message },
        });
        continue;
      }

      syncedCount++;

      // Track entries with audio for later processing
      if (entry.audioStoragePath) {
        audioEntryIds.push(upsertedEntry.id);
      }

      // Insert diary images if present
      if (entry.imageStoragePaths && entry.imageStoragePaths.length > 0) {
        const imageRecords = entry.imageStoragePaths.map((storagePath) => ({
          diary_entry_id: upsertedEntry.id,
          user_id: user.id,
          storage_path: storagePath,
          public_url: null,
          used_in_posts: false,
          created_at: new Date().toISOString(),
        }));

        const { error: imagesError } = await supabaseAdmin
          .from("diary_images")
          .insert(imageRecords);

        if (imagesError) {
          logger.warn("Failed to insert diary images", {
            functionName: FUNCTION_NAME,
            userId: user.id,
            metadata: { entryId: upsertedEntry.id, error: imagesError.message },
          });
        }
      }
    }

    // Count unique diary dates for discovery unlock check
    const { data: dateCounts, error: dateCountError } = await supabaseAdmin
      .from("diary_entries")
      .select("entry_date")
      .eq("user_id", user.id);

    if (dateCountError) {
      logger.warn("Failed to count diary dates", {
        functionName: FUNCTION_NAME,
        userId: user.id,
        error: dateCountError.message,
      });
    }

    const uniqueDateCount = new Set(dateCounts?.map((row) => row.entry_date) ?? []).size;

    // Check and update discovery unlock
    let discoveryUnlocked = false;
    if (uniqueDateCount >= DISCOVERY_UNLOCK_THRESHOLD) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("discovery_unlocked")
        .eq("id", user.id)
        .single();

      if (profile && !profile.discovery_unlocked) {
        const { error: unlockError } = await supabaseAdmin
          .from("profiles")
          .update({
            discovery_unlocked: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (!unlockError) {
          discoveryUnlocked = true;

          // Log the unlock event
          await supabaseAdmin.from("user_activity_log").insert({
            user_id: user.id,
            action: "discovery_unlocked",
            metadata: {
              uniqueDiaryDays: uniqueDateCount,
              unlockedAt: new Date().toISOString(),
            },
          });

          logger.info("Discovery feature unlocked for user", {
            functionName: FUNCTION_NAME,
            userId: user.id,
            metadata: { uniqueDateCount },
          });
        }
      } else if (profile?.discovery_unlocked) {
        discoveryUnlocked = true;
      }
    }

    logger.info("Diary sync completed", {
      functionName: FUNCTION_NAME,
      userId: user.id,
      metadata: {
        syncedCount,
        audioEntries: audioEntryIds.length,
        uniqueDateCount,
        discoveryUnlocked,
      },
    });

    // Fire-and-forget persona rebuild — don't await, don't fail if this errors
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    fetch(`${supabaseUrl}/functions/v1/build-user-persona`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: user.id }),
    }).catch(() => {}); // intentionally swallow errors

    // Fire-and-forget: compute embeddings for entries that don't have one yet (RAG support)
    embedMissingEntries(supabaseAdmin, user.id).catch((err) => {
      logger.warn("Embedding computation failed — RAG will use chronological fallback", {
        functionName: FUNCTION_NAME,
        userId: user.id,
        metadata: { error: err instanceof Error ? err.message : String(err) },
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        syncedCount,
        uniqueDiaryDays: uniqueDateCount,
        discoveryUnlocked,
        audioEntriesPendingTranscription: audioEntryIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, FUNCTION_NAME);
  }
});
