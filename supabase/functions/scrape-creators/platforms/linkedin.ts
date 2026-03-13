import { logger } from "../../_shared/logger.ts";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const LINKEDIN_ACTOR_ID = "curious_coder~linkedin-post-search-scraper";
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

interface ApifyDatasetItem {
  authorName?: string;
  authorHandle?: string;
  authorUrl?: string;
  authorFollowerCount?: number;
  authorBio?: string;
  text?: string;
  postType?: string;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  postedAt?: string;
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

export async function scrapeLinkedIn(
  keywords: string[],
  industry: string
): Promise<CreatorSample[]> {
  const apifyToken = Deno.env.get("APIFY_API_TOKEN");
  if (!apifyToken) throw new Error("APIFY_API_TOKEN not configured");

  logger.info("Starting LinkedIn scrape", {
    functionName: "scrape-creators",
    metadata: { keywords, industry },
  });

  const runRes = await fetch(
    `${APIFY_BASE_URL}/acts/${LINKEDIN_ACTOR_ID}/runs?token=${apifyToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchTerms: keywords,
        maxResults: 50,
        proxyConfiguration: { useApifyProxy: true },
      }),
    }
  );

  if (!runRes.ok) {
    const errorBody = await runRes.text();
    throw new Error(`Failed to start LinkedIn scraper: ${runRes.status} ${errorBody}`);
  }

  const runData = await runRes.json();
  const runId: string = runData.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  const datasetId = await waitForApifyRun(runId, apifyToken);

  const datasetRes = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${apifyToken}&format=json`
  );
  if (!datasetRes.ok) throw new Error("Failed to fetch Apify dataset");

  const items: ApifyDatasetItem[] = await datasetRes.json();

  // Group items by author handle
  const creatorMap = new Map<string, CreatorSample>();

  for (const item of items) {
    const handle = item.authorHandle ?? item.authorUrl ?? "unknown";
    if (!creatorMap.has(handle)) {
      creatorMap.set(handle, {
        handle,
        name: item.authorName ?? handle,
        profileUrl: item.authorUrl ?? "",
        followerCount: item.authorFollowerCount ?? 0,
        bio: item.authorBio ?? "",
        posts: [],
      });
    }

    const creator = creatorMap.get(handle)!;
    if (item.text) {
      const postType = item.postType?.toLowerCase() ?? "post";
      creator.posts.push({
        contentText: item.text,
        contentType: postType === "carousel" ? "carousel" : "post",
        likesCount: item.likesCount ?? 0,
        commentsCount: item.commentsCount ?? 0,
        sharesCount: item.repostsCount ?? 0,
        postedAt: item.postedAt ?? null,
      });
    }
  }

  const results = Array.from(creatorMap.values()).filter(
    (creator) => creator.posts.length > 0
  );

  logger.info("LinkedIn scrape completed", {
    functionName: "scrape-creators",
    metadata: { creatorsFound: results.length },
  });

  return results;
}
