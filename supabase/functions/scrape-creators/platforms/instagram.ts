import { logger } from "../../_shared/logger.ts";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const INSTAGRAM_ACTOR_ID = "apify~instagram-hashtag-scraper";
const APIFY_POLL_INTERVAL_MS = 5000;
const APIFY_MAX_WAIT_MS = 120000;

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

interface ApifyInstagramItem {
  ownerUsername?: string;
  ownerFullName?: string;
  ownerProfileUrl?: string;
  ownerFollowersCount?: number;
  ownerBiography?: string;
  caption?: string;
  type?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
}

async function waitForApifyRun(
  runId: string,
  apifyToken: string
): Promise<string> {
  const deadline = Date.now() + APIFY_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const runRes = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${runId}?token=${apifyToken}`
    );
    if (!runRes.ok) throw new Error(`Failed to poll Apify run: ${runRes.status}`);
    const runData = await runRes.json();
    const status: string = runData.data?.status ?? "RUNNING";
    if (status === "SUCCEEDED") return runData.data.defaultDatasetId as string;
    if (status === "FAILED" || status === "ABORTED") {
      throw new Error(`Apify run ${status.toLowerCase()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, APIFY_POLL_INTERVAL_MS));
  }
  throw new Error("Apify run timed out");
}

export async function scrapeInstagram(
  keywords: string[],
  industry: string
): Promise<CreatorSample[]> {
  const apifyToken = Deno.env.get("APIFY_API_TOKEN");
  if (!apifyToken) throw new Error("APIFY_API_TOKEN not configured");

  logger.info("Starting Instagram scrape", {
    functionName: "scrape-creators",
    metadata: { keywords, industry },
  });

  // Convert keywords to hashtags
  const hashtags = keywords.map((kw) =>
    kw.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
  );

  const runRes = await fetch(
    `${APIFY_BASE_URL}/acts/${INSTAGRAM_ACTOR_ID}/runs?token=${apifyToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hashtags,
        resultsLimit: 50,
        proxyConfiguration: { useApifyProxy: true },
      }),
    }
  );

  if (!runRes.ok) {
    const errorBody = await runRes.text();
    throw new Error(`Failed to start Instagram scraper: ${runRes.status} ${errorBody}`);
  }

  const runData = await runRes.json();
  const runId: string = runData.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  const datasetId = await waitForApifyRun(runId, apifyToken);

  const datasetRes = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${apifyToken}&format=json`
  );
  if (!datasetRes.ok) throw new Error("Failed to fetch Apify dataset");

  const items: ApifyInstagramItem[] = await datasetRes.json();

  const creatorMap = new Map<string, CreatorSample>();

  for (const item of items) {
    const handle = item.ownerUsername ?? "unknown";
    if (!creatorMap.has(handle)) {
      creatorMap.set(handle, {
        handle,
        name: item.ownerFullName ?? handle,
        profileUrl: item.ownerProfileUrl ?? `https://instagram.com/${handle}`,
        followerCount: item.ownerFollowersCount ?? 0,
        bio: item.ownerBiography ?? "",
        posts: [],
      });
    }

    const creator = creatorMap.get(handle)!;
    if (item.caption) {
      const postType = item.type?.toLowerCase() ?? "post";
      let contentType: "post" | "carousel" | "thread" | "reel_caption" | "story" = "post";
      if (postType === "carousel") contentType = "carousel";
      else if (postType === "reel") contentType = "reel_caption";
      else if (postType === "story") contentType = "story";

      creator.posts.push({
        contentText: item.caption,
        contentType,
        likesCount: item.likesCount ?? 0,
        commentsCount: item.commentsCount ?? 0,
        sharesCount: 0,
        postedAt: item.timestamp ?? null,
      });
    }
  }

  const results = Array.from(creatorMap.values()).filter(
    (creator) => creator.posts.length > 0
  );

  logger.info("Instagram scrape completed", {
    functionName: "scrape-creators",
    metadata: { creatorsFound: results.length },
  });

  return results;
}
