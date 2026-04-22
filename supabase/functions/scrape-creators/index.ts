import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { ScrapeCreatorsRequestSchema } from "../_shared/validators.ts";
import type { Platform } from "../_shared/types.ts";
import { buildNicheHash, getNicheCache, setNicheCache } from "../_shared/nicheCache.ts";
import type { CachedCreator } from "../_shared/types.ts";
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

const TOP_CREATORS = 5;
const TOP_POSTS_PER_CREATOR = 10;

function computeAvgEngagement(creator: CreatorSample): number {
  if (creator.posts.length === 0) return 0;
  const total = creator.posts.reduce((sum, post) => {
    return sum + computeEngagementScore(
      post.likesCount,
      post.commentsCount,
      post.sharesCount,
      creator.followerCount,
    );
  }, 0);
  return total / creator.posts.length;
}

function rankAndTrim(creators: CreatorSample[]): CachedCreator[] {
  const ranked = creators
    .map((c) => ({ creator: c, avgEngagement: computeAvgEngagement(c) }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, TOP_CREATORS);

  return ranked.map(({ creator, avgEngagement }) => {
    const scoredPosts = creator.posts
      .map((post) => ({
        ...post,
        engagementScore: computeEngagementScore(
          post.likesCount,
          post.commentsCount,
          post.sharesCount,
          creator.followerCount,
        ),
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, TOP_POSTS_PER_CREATOR);

    return {
      handle: creator.handle,
      name: creator.name,
      profileUrl: creator.profileUrl,
      followerCount: creator.followerCount,
      bio: creator.bio,
      avgEngagement,
      posts: scoredPosts,
    };
  });
}

function cachedToCreatorSamples(cached: CachedCreator[]): CreatorSample[] {
  return cached.map((c) => ({
    handle: c.handle,
    name: c.name,
    profileUrl: c.profileUrl,
    followerCount: c.followerCount,
    bio: c.bio,
    posts: c.posts.map((p) => ({
      contentText: p.contentText,
      contentType: p.contentType,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      sharesCount: p.sharesCount,
      postedAt: p.postedAt,
    })),
  }));
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
        const nicheHash = await buildNicheHash(platform, nicheKeywords);

        // 1. Check cache
        const cached = await getNicheCache(platform, nicheHash);

        let creatorsToSave: CreatorSample[];

        if (cached) {
          logger.info("Using cached creators", {
            functionName,
            userId,
            metadata: { platform, nicheHash, cachedCount: cached.length },
          });
          creatorsToSave = cachedToCreatorSamples(cached);
        } else {
          // 2. Scrape fresh
          let rawCreators: CreatorSample[] = [];

          if (platform === "linkedin") {
            rawCreators = await scrapeLinkedIn(nicheKeywords, industry);
          } else if (platform === "instagram") {
            rawCreators = await scrapeInstagram(nicheKeywords, industry);
          } else if (platform === "x") {
            rawCreators = await scrapeTwitter(nicheKeywords, industry);
          }

          // 3. Rank and trim to top 5 creators, top 10 posts each
          const trimmed = rankAndTrim(rawCreators);

          // 4. Write to shared cache
          await setNicheCache(platform, nicheHash, nicheKeywords, trimmed);

          creatorsToSave = cachedToCreatorSamples(trimmed);

          logger.info("Platform scrape completed and cached", {
            functionName,
            userId,
            metadata: {
              platform,
              rawCreators: rawCreators.length,
              trimmedCreators: trimmed.length,
            },
          });
        }

        // 5. Upsert to per-user tables
        const savedCount = await upsertCreatorData(userId, platform, creatorsToSave);
        results[platform] = savedCount;
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
