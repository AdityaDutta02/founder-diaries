import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { logger } from "../_shared/logger.ts";
import type { Platform, ContentType } from "../_shared/types.ts";

const FUNCTION_NAME = "daily-generation-cron";

/**
 * Weighted random content type selection.
 * Distribution: 60% post, 20% carousel, 10% thread, 10% reel_caption
 */
function selectContentType(platform: Platform): ContentType {
  const rand = Math.random();
  if (platform === "linkedin") {
    if (rand < 0.60) return "post";
    if (rand < 0.85) return "carousel";
    return "post"; // LinkedIn doesn't have threads; fallback to post
  }
  if (platform === "instagram") {
    if (rand < 0.60) return "post";
    if (rand < 0.80) return "carousel";
    return "reel_caption";
  }
  if (platform === "x") {
    if (rand < 0.60) return "post";
    return "thread";
  }
  return "post";
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

async function generatePostForUser(
  userId: string,
  platform: Platform,
  diaryEntryId: string,
  contentType: ContentType
): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error("Missing Supabase configuration", { functionName: FUNCTION_NAME });
    return false;
  }

  // Call the generate-content function using service role (no user JWT needed internally)
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({ userId, diaryEntryId, platform, contentType }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("Internal generate-content call failed", {
      functionName: FUNCTION_NAME,
      userId,
      metadata: { platform, status: response.status, body: errorBody },
    });
    return false;
  }

  return true;
}

Deno.serve(async (_req: Request) => {
  logger.info("Daily generation cron triggered", { functionName: FUNCTION_NAME });

  try {
    // Fetch users with discovery unlocked and active platform configs
    const { data: eligibleUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id, industry, timezone")
      .eq("discovery_unlocked", true)
      .eq("onboarding_completed", true);

    if (usersError) {
      logger.error("Failed to fetch eligible users", {
        functionName: FUNCTION_NAME,
        error: usersError.message,
      });
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), { status: 500 });
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      logger.info("No eligible users found for daily generation", { functionName: FUNCTION_NAME });
      return new Response(JSON.stringify({ success: true, processed: 0 }), { status: 200 });
    }

    logger.info(`Processing ${eligibleUsers.length} eligible users`, {
      functionName: FUNCTION_NAME,
    });

    const weekStart = getWeekStart();
    let totalGenerated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const userProfile of eligibleUsers) {
      try {
        // Fetch active platform configs for this user
        const { data: platformConfigs, error: configError } = await supabaseAdmin
          .from("platform_configs")
          .select("platform, weekly_post_quota")
          .eq("user_id", userProfile.id)
          .eq("active", true);

        if (configError || !platformConfigs || platformConfigs.length === 0) continue;

        // Fetch most recent diary entry
        const { data: recentEntry, error: entryError } = await supabaseAdmin
          .from("diary_entries")
          .select("id, entry_date")
          .eq("user_id", userProfile.id)
          .order("entry_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (entryError || !recentEntry) {
          logger.warn("No diary entries found for user", {
            functionName: FUNCTION_NAME,
            userId: userProfile.id,
          });
          continue;
        }

        for (const config of platformConfigs) {
          const platform = config.platform as Platform;

          // Count posts generated this week for this platform
          const { count: weeklyCount, error: countError } = await supabaseAdmin
            .from("generated_posts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userProfile.id)
            .eq("platform", platform)
            .gte("created_at", weekStart);

          if (countError) {
            logger.warn("Failed to count weekly posts", {
              functionName: FUNCTION_NAME,
              userId: userProfile.id,
              metadata: { platform },
            });
            continue;
          }

          const currentCount = weeklyCount ?? 0;
          if (currentCount >= config.weekly_post_quota) {
            logger.info("Weekly quota reached, skipping", {
              functionName: FUNCTION_NAME,
              userId: userProfile.id,
              metadata: { platform, currentCount, quota: config.weekly_post_quota },
            });
            totalSkipped++;
            continue;
          }

          const contentType = selectContentType(platform);

          const success = await generatePostForUser(
            userProfile.id,
            platform,
            recentEntry.id,
            contentType
          );

          if (success) {
            totalGenerated++;

            // Log to activity log
            await supabaseAdmin.from("user_activity_log").insert({
              user_id: userProfile.id,
              action: "daily_content_generated",
              metadata: {
                platform,
                contentType,
                diaryEntryId: recentEntry.id,
                generatedAt: new Date().toISOString(),
              },
            });
          }
        }
      } catch (userError) {
        const msg = userError instanceof Error ? userError.message : String(userError);
        errors.push(`User ${userProfile.id}: ${msg}`);
        logger.error("Error processing user in cron", {
          functionName: FUNCTION_NAME,
          userId: userProfile.id,
          error: msg,
        });
      }
    }

    logger.info("Daily generation cron completed", {
      functionName: FUNCTION_NAME,
      metadata: {
        usersProcessed: eligibleUsers.length,
        totalGenerated,
        totalSkipped,
        errorCount: errors.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: eligibleUsers.length,
        totalGenerated,
        totalSkipped,
        errors,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Cron function failed", { functionName: FUNCTION_NAME, error: message });
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
