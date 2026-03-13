import { logger } from "../../_shared/logger.ts";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const TWITTER_ACTOR_ID = "apidojo~tweet-scraper";
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

interface ApifyTwitterItem {
  author?: {
    userName?: string;
    displayName?: string;
    profileUrl?: string;
    followers?: number;
    description?: string;
  };
  text?: string;
  isThread?: boolean;
  likeCount?: number;
  replyCount?: number;
  retweetCount?: number;
  createdAt?: string;
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

export async function scrapeTwitter(
  keywords: string[],
  industry: string
): Promise<CreatorSample[]> {
  const apifyToken = Deno.env.get("APIFY_API_TOKEN");
  if (!apifyToken) throw new Error("APIFY_API_TOKEN not configured");

  logger.info("Starting X/Twitter scrape", {
    functionName: "scrape-creators",
    metadata: { keywords, industry },
  });

  // Build search queries using keywords
  const searchTerms = keywords.map((kw) => `${kw} -is:retweet lang:en`);

  const runRes = await fetch(
    `${APIFY_BASE_URL}/acts/${TWITTER_ACTOR_ID}/runs?token=${apifyToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchTerms,
        maxTweets: 100,
        queryType: "Top",
        proxyConfiguration: { useApifyProxy: true },
      }),
    }
  );

  if (!runRes.ok) {
    const errorBody = await runRes.text();
    throw new Error(`Failed to start Twitter scraper: ${runRes.status} ${errorBody}`);
  }

  const runData = await runRes.json();
  const runId: string = runData.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  const datasetId = await waitForApifyRun(runId, apifyToken);

  const datasetRes = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${apifyToken}&format=json`
  );
  if (!datasetRes.ok) throw new Error("Failed to fetch Apify dataset");

  const items: ApifyTwitterItem[] = await datasetRes.json();

  const creatorMap = new Map<string, CreatorSample>();

  for (const item of items) {
    const handle = item.author?.userName ?? "unknown";
    if (!creatorMap.has(handle)) {
      creatorMap.set(handle, {
        handle,
        name: item.author?.displayName ?? handle,
        profileUrl:
          item.author?.profileUrl ?? `https://x.com/${handle}`,
        followerCount: item.author?.followers ?? 0,
        bio: item.author?.description ?? "",
        posts: [],
      });
    }

    const creator = creatorMap.get(handle)!;
    if (item.text) {
      creator.posts.push({
        contentText: item.text,
        contentType: item.isThread ? "thread" : "post",
        likesCount: item.likeCount ?? 0,
        commentsCount: item.replyCount ?? 0,
        sharesCount: item.retweetCount ?? 0,
        postedAt: item.createdAt ?? null,
      });
    }
  }

  const results = Array.from(creatorMap.values()).filter(
    (creator) => creator.posts.length > 0
  );

  logger.info("X/Twitter scrape completed", {
    functionName: "scrape-creators",
    metadata: { creatorsFound: results.length },
  });

  return results;
}
