import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { ScrapeCreatorsRequestSchema } from "../_shared/validators.ts";
import type { Platform } from "../_shared/types.ts";
import { scrapeLinkedIn } from "./platforms/linkedin.ts";
import { scrapeInstagram } from "./platforms/instagram.ts";
import { scrapeTwitter } from "./platforms/twitter.ts";

interface CreatorSample {
  handle: string;
  name: string;
  profileUrl: string;
  followerCount: number;
  bio: string;
  posts: {
    contentText: string;
    contentType: "post" | "carousel" | "thread" | "reel_caption" | "story";
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    postedAt: string | null;
  }[];
}

function computeEngagementScore(
  likes: number,
  comments: number,
  shares: number,
  followers: number
): number {
  if (followers === 0) return 0;
  return (likes + comments * 2 + shares * 3) / followers;
}

async function upsertCreatorData(
  userId: string,
  platform: Platform,
  creators: CreatorSample[]
): Promise<number> {
  let savedCount = 0;

  for (const creator of creators) {
    // Upsert creator profile
    const { data: creatorProfile, error: profileError } = await supabaseAdmin
      .from("creator_profiles")
      .upsert(
        {
          user_id: userId,
          platform,
          creator_handle: creator.handle,
          creator_name: creator.name,
          profile_url: creator.profileUrl,
          follower_count: creator.followerCount,
          bio: creator.bio,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform,creator_handle" }
      )
      .select("id")
      .single();

    if (profileError || !creatorProfile) {
      logger.warn("Failed to upsert creator profile", {
        functionName: "scrape-creators",
        userId,
        metadata: { handle: creator.handle, error: profileError?.message },
      });
      continue;
    }

    // Insert content samples
    const samples = creator.posts.map((post) => ({
      creator_profile_id: creatorProfile.id,
      platform,
      content_text: post.contentText,
      content_type: post.contentType,
      engagement_score: computeEngagementScore(
        post.likesCount,
        post.commentsCount,
        post.sharesCount,
        creator.followerCount
      ),
      likes_count: post.likesCount,
      comments_count: post.commentsCount,
      shares_count: post.sharesCount,
      posted_at: post.postedAt,
      scraped_at: new Date().toISOString(),
    }));

    if (samples.length > 0) {
      const { error: samplesError } = await supabaseAdmin
        .from("creator_content_samples")
        .insert(samples);

      if (samplesError) {
        logger.warn("Failed to insert content samples", {
          functionName: "scrape-creators",
          userId,
          metadata: { handle: creator.handle, error: samplesError.message },
        });
      }
    }

    savedCount++;
  }

  return savedCount;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = "scrape-creators";

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new AppError("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new AppError("Invalid or expired token", 401);

    // Parse and validate body
    const rawBody = await req.json();
    const parseResult = ScrapeCreatorsRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      throw new AppError("Invalid request body", 400, { issues: parseResult.error.issues });
    }
    const { userId, platforms, nicheKeywords, industry } = parseResult.data;

    if (user.id !== userId) throw new AppError("Forbidden", 403);

    logger.info("Creator scraping started", {
      functionName,
      userId,
      metadata: { platforms, nicheKeywords },
    });

    const results: Record<string, number> = {};

    for (const platform of platforms) {
      try {
        let creators: CreatorSample[] = [];

        if (platform === "linkedin") {
          creators = await scrapeLinkedIn(nicheKeywords, industry);
        } else if (platform === "instagram") {
          creators = await scrapeInstagram(nicheKeywords, industry);
        } else if (platform === "x") {
          creators = await scrapeTwitter(nicheKeywords, industry);
        }

        const savedCount = await upsertCreatorData(userId, platform, creators);
        results[platform] = savedCount;

        logger.info(`Platform scrape completed`, {
          functionName,
          userId,
          metadata: { platform, creatorsScraped: creators.length, creatorsSaved: savedCount },
        });
      } catch (platformError) {
        logger.error(`Failed to scrape ${platform}`, {
          functionName,
          userId,
          error: platformError instanceof Error ? platformError.message : String(platformError),
        });
        results[platform] = 0;
      }
    }

    return new Response(
      JSON.stringify({ success: true, creatorCounts: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, functionName);
  }
});
