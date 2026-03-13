# Founder Diaries - Technical Architecture

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native + Expo                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Diary    │  │ Content  │  │ Discover │  │ Settings │   │
│  │  Tab      │  │  Tab     │  │  Tab     │  │  Tab     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐   │
│  │              Zustand Stores + TanStack Query          │   │
│  └────┬──────────────┬──────────────────────────────────┘   │
│       │              │                                       │
│  ┌────┴────┐    ┌────┴────────────┐                         │
│  │  Expo   │    │  Service Layer  │                         │
│  │  SQLite │    │  (API clients)  │                         │
│  └─────────┘    └────┬────────────┘                         │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┼──────────────────────────────────────┐
│                  Supabase Platform                           │
│  ┌───────────┐  ┌────┴────────┐  ┌──────────────────────┐  │
│  │   Auth    │  │   Edge      │  │   Storage            │  │
│  │  (GoTrue) │  │  Functions  │  │  (S3-compatible)     │  │
│  └───────────┘  └────┬────────┘  │  ├─ diary-audio/     │  │
│                      │           │  ├─ diary-images/     │  │
│  ┌───────────────────┴────────┐  │  ├─ generated-images/ │  │
│  │      PostgreSQL            │  │  └─ avatars/          │  │
│  │  (10 tables + RLS)        │  └──────────────────────┘  │
│  └────────────────────────────┘                             │
└──────────────────────────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────┴─────┐ ┌───┴───┐ ┌─────┴──────┐
    │  Claude   │ │ Groq  │ │   Gemini   │
    │  API      │ │Whisper│ │ (Nano      │
    │           │ │       │ │  Banana 2) │
    └───────────┘ └───────┘ └────────────┘
          │
    ┌─────┴─────┐
    │  Apify    │
    │  Actors   │
    └───────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React Native + Expo | Expo SDK 52 | Cross-platform mobile |
| Routing | Expo Router | v4 | File-based navigation |
| Language | TypeScript | strict mode | Type safety |
| Backend | Supabase | v2 | Auth, DB, Storage, Edge Functions |
| Database | PostgreSQL | 15+ | Primary data store |
| Local DB | Expo SQLite | v15 | Offline-first diary |
| State (UI) | Zustand | v5 | Client-side state |
| State (Server) | TanStack Query | v5 | Server state cache + sync |
| AI (Text) | Claude API | claude-sonnet-4-6 | Content analysis + generation |
| AI (Images) | Gemini API | gemini-3.1-flash-preview | Image generation (Nano Banana 2) |
| AI (Audio) | Groq Whisper | whisper-large-v3-turbo | Audio transcription |
| Scraping | Apify | Various actors | Social media data collection |
| Validation | Zod | v3 | Schema validation + Claude structured outputs |

---

## 3. Database Schema

### 3.1 Table: `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  industry TEXT,
  niche_keywords TEXT[],
  onboarding_completed BOOLEAN DEFAULT FALSE,
  diary_start_date TIMESTAMPTZ,
  discovery_unlocked BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Table: `diary_entries`

```sql
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  text_content TEXT,
  raw_audio_url TEXT,
  transcription_text TEXT,
  transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  mood TEXT,
  tags TEXT[],
  local_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, local_id)
);

CREATE INDEX idx_diary_entries_user_date ON diary_entries(user_id, entry_date DESC);
```

### 3.3 Table: `diary_images`

```sql
CREATE TABLE diary_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  caption TEXT,
  used_in_posts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Table: `platform_configs`

```sql
CREATE TABLE platform_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'x')),
  weekly_post_quota INTEGER DEFAULT 3,
  active BOOLEAN DEFAULT TRUE,
  preferred_content_types TEXT[],
  posting_times JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

### 3.5 Table: `creator_profiles`

```sql
CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'x')),
  creator_handle TEXT NOT NULL,
  creator_name TEXT,
  profile_url TEXT,
  follower_count INTEGER,
  bio TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  relevance_score FLOAT,
  UNIQUE(user_id, platform, creator_handle)
);
```

### 3.6 Table: `creator_content_samples`

```sql
CREATE TABLE creator_content_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('post', 'carousel', 'thread', 'reel_caption', 'story')),
  engagement_score FLOAT,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_samples_creator ON creator_content_samples(creator_profile_id);
```

### 3.7 Table: `content_writing_profiles`

```sql
CREATE TABLE content_writing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'x')),
  tone_description TEXT,
  format_patterns JSONB,
  vocabulary_notes TEXT,
  structural_patterns JSONB,
  example_hooks TEXT[],
  hashtag_strategy JSONB,
  generated_by_model TEXT,
  last_refreshed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

**`format_patterns` JSONB shape:**
```json
{
  "hookStyle": "question",
  "averageLength": 1200,
  "usesLineBreaks": true,
  "usesEmojis": false,
  "paragraphCount": 4,
  "usesBulletPoints": true
}
```

**`structural_patterns` JSONB shape:**
```json
{
  "primaryStructure": "story-first",
  "secondaryStructure": "lesson-then-example",
  "callToActionStyle": "question-based"
}
```

**`hashtag_strategy` JSONB shape:**
```json
{
  "averageCount": 5,
  "broadToNicheRatio": "2:3",
  "exampleHashtags": ["#startup", "#saas", "#buildinpublic"]
}
```

### 3.8 Table: `generated_posts`

```sql
CREATE TABLE generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  diary_entry_id UUID REFERENCES diary_entries(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'x')),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'carousel', 'thread', 'reel_caption')),
  title TEXT,
  body_text TEXT NOT NULL,
  carousel_slides JSONB,
  thread_tweets JSONB,
  image_prompt TEXT,
  generated_image_url TEXT,
  user_image_id UUID REFERENCES diary_images(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'posted', 'rejected')),
  scheduled_for TIMESTAMPTZ,
  generation_metadata JSONB,
  user_edits TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_posts_user_status ON generated_posts(user_id, status);
CREATE INDEX idx_generated_posts_scheduled ON generated_posts(user_id, scheduled_for) WHERE status = 'scheduled';
```

**`carousel_slides` JSONB shape:**
```json
[
  { "slideNumber": 1, "heading": "The Hook", "bodyText": "Why most founders fail at content", "imagePrompt": "..." },
  { "slideNumber": 2, "heading": "The Problem", "bodyText": "You have stories but no time", "imagePrompt": "..." }
]
```

**`thread_tweets` JSONB shape:**
```json
[
  { "order": 1, "text": "I almost shut down my startup last week. Here's what happened:" },
  { "order": 2, "text": "We had 3 customers churn in the same day..." }
]
```

### 3.9 Table: `generation_queue`

```sql
CREATE TABLE generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('transcription', 'content_generation', 'image_generation', 'scraping', 'profile_analysis')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  payload JSONB NOT NULL,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_generation_queue_pending ON generation_queue(status, created_at) WHERE status = 'pending';
```

### 3.10 Table: `user_activity_log`

```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row-Level Security

All tables use the same base RLS pattern:

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON <table_name>
  FOR ALL
  USING (user_id = auth.uid());
```

For `profiles`: `USING (id = auth.uid())`.

### Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `diary-audio` | Private (per-user RLS) | Raw audio recordings |
| `diary-images` | Private (per-user RLS) | User-uploaded images |
| `generated-images` | Private (per-user RLS) | Nano Banana outputs |
| `avatars` | Public (read), Private (write) | Profile pictures |

---

## 4. Edge Functions

### 4.1 `transcribe-audio`

**Trigger:** Client call after audio upload to Storage.

**Input:**
```typescript
interface TranscribeRequest {
  diaryEntryId: string;
  audioStoragePath: string;
}
```

**Flow:**
1. Validate JWT from `Authorization` header
2. Download audio from Supabase Storage (admin client)
3. POST to Groq Whisper (`https://api.groq.com/openai/v1/audio/transcriptions`, model: `whisper-large-v3-turbo`)
4. Update `diary_entries.transcription_text`, set `transcription_status = 'completed'`
5. Background: Extract tags via Claude → update `diary_entries.tags`

**Env:** `GROQ_API_KEY`

**Error handling:** On failure, set `transcription_status = 'failed'`, enqueue retry in `generation_queue`.

---

### 4.2 `generate-content`

**Trigger:** `daily-generation-cron` or manual client call.

**Input:**
```typescript
interface GenerateContentRequest {
  userId: string;
  diaryEntryId: string;
  platform: 'linkedin' | 'instagram' | 'x';
  contentType: 'post' | 'carousel' | 'thread' | 'reel_caption';
}
```

**Flow:**
1. Fetch diary entry from `diary_entries`
2. Fetch `content_writing_profiles` for target platform
3. Fetch last 3 diary entries for context continuity
4. Build prompt combining diary content + writing profile + content type instructions
5. Call Claude API with structured output (Zod schema per content type)
6. Insert into `generated_posts` with `status = 'draft'`
7. Enqueue image generation job(s)

**Env:** `ANTHROPIC_API_KEY`

**Zod schemas (structured output):**

```typescript
// LinkedIn Post
const LinkedInPostSchema = z.object({
  title: z.string().max(100),
  hookLine: z.string().max(200),
  bodyText: z.string().min(100).max(3000),
  hashtags: z.array(z.string()).max(10),
  imagePrompt: z.string().max(500),
  estimatedReadTime: z.string(),
});

// Instagram Carousel
const CarouselSchema = z.object({
  title: z.string().max(100),
  caption: z.string().max(2200),
  slides: z.array(z.object({
    slideNumber: z.number(),
    heading: z.string().max(60),
    bodyText: z.string().max(150),
    imagePrompt: z.string().max(500),
  })).min(5).max(8),
  hashtags: z.array(z.string()).max(30),
});

// X Thread
const ThreadSchema = z.object({
  title: z.string().max(100),
  tweets: z.array(z.object({
    order: z.number(),
    text: z.string().max(280),
  })).min(4).max(8),
  imagePrompt: z.string().max(500),
});

// Single Post (LinkedIn/Instagram/X)
const SinglePostSchema = z.object({
  title: z.string().max(100),
  bodyText: z.string().max(3000),
  hashtags: z.array(z.string()).max(30),
  imagePrompt: z.string().max(500),
});
```

---

### 4.3 `generate-image`

**Trigger:** After content generation or from generation queue.

**Input:**
```typescript
interface GenerateImageRequest {
  postId: string;
  imagePrompt: string;
  aspectRatio: '1:1' | '4:5' | '16:9';
}
```

**Flow:**
1. Call Gemini API (model: `gemini-3.1-flash-preview`) with refined prompt
2. Upload image to `generated-images/{userId}/{postId}.png`
3. Update `generated_posts.generated_image_url`

**Env:** `GEMINI_API_KEY`

**Prompt wrapper:**
```
Create a professional, visually striking social media graphic for a {platform} post.
Topic: {imagePrompt}
Style: Clean, modern design. Professional color palette for {industry}.
No text overlay. Aspect ratio: {aspectRatio}.
```

---

### 4.4 `scrape-creators`

**Trigger:** When `discovery_unlocked` becomes true, or manual refresh (max 1/24h).

**Input:**
```typescript
interface ScrapeCreatorsRequest {
  userId: string;
  platforms: Array<'linkedin' | 'instagram' | 'x'>;
  nicheKeywords: string[];
  industry: string;
}
```

**Flow:**
1. For each platform, call Apify actor:
   - LinkedIn: `curious_coder/linkedin-post-search-scraper` (search by niche keywords, last 3 months)
   - Instagram: Instagram profile + posts scraper (search by hashtags)
   - X: Twitter/X scraper (search by keywords, `min_faves:100`)
2. Group results by creator handle
3. Calculate engagement scores: `(likes + comments*2 + shares*3) / follower_count`
4. Claude ranks by relevance to user's niche → `relevance_score`
5. Store top 10-15 creators per platform in `creator_profiles`
6. Fetch top 20-30 posts per creator → store in `creator_content_samples`
7. Trigger `analyze-creators` via `EdgeRuntime.waitUntil()`

**Env:** `APIFY_API_TOKEN`

---

### 4.5 `analyze-creators`

**Trigger:** After `scrape-creators` completes.

**Input:**
```typescript
interface AnalyzeCreatorsRequest {
  userId: string;
  platform: 'linkedin' | 'instagram' | 'x';
}
```

**Flow:**
1. Fetch all `creator_content_samples` for user's creators on this platform
2. Sort by `engagement_score` DESC, take top 50
3. Send to Claude with analysis prompt → extract:
   - Tone and voice patterns
   - Structural patterns (hook style, length, formatting)
   - Vocabulary patterns
   - Top-performing hooks (verbatim)
   - Hashtag usage patterns
4. Upsert into `content_writing_profiles`

**Env:** `ANTHROPIC_API_KEY`

**Output schema:**
```typescript
const WritingProfileSchema = z.object({
  toneDescription: z.string().min(20).max(500),
  formatPatterns: z.object({
    hookStyle: z.string(),
    averageLength: z.number(),
    usesLineBreaks: z.boolean(),
    usesEmojis: z.boolean(),
    paragraphCount: z.number(),
    usesBulletPoints: z.boolean(),
  }),
  vocabularyNotes: z.string().min(20).max(500),
  structuralPatterns: z.object({
    primaryStructure: z.string(),
    secondaryStructure: z.string(),
    callToActionStyle: z.string(),
  }),
  exampleHooks: z.array(z.string()).min(3).max(5),
  hashtagStrategy: z.object({
    averageCount: z.number(),
    broadToNicheRatio: z.string(),
    exampleHashtags: z.array(z.string()),
  }),
});
```

---

### 4.6 `daily-generation-cron`

**Trigger:** Supabase CRON, daily at 06:00 UTC.

**Flow:**
1. Query users: `discovery_unlocked = true` AND has active `platform_configs`
2. Per user, per active platform:
   a. Check if today's quota already generated → skip if so
   b. Find most recent diary entry (today > yesterday > most recent)
   c. Determine content type via rotation (60% post, 25% carousel/thread, 15% reel caption)
   d. Call `generate-content`
3. Log results in `user_activity_log`

---

### 4.7 `sync-diary`

**Trigger:** Client call after batch sync from SQLite.

**Input:**
```typescript
interface SyncDiaryRequest {
  entries: Array<{
    localId: string;
    entryDate: string;
    textContent: string;
    audioStoragePath?: string;
    imageStoragePaths?: string[];
  }>;
}
```

**Flow:**
1. Upsert entries using `local_id` for dedup
2. Enqueue transcription for entries with audio
3. Create `diary_images` for entries with images
4. Check unique diary days → update `discovery_unlocked` if >= 7

---

### Shared Edge Function Utilities (`_shared/`)

```
_shared/
├── supabaseAdmin.ts   # createClient with service_role key
├── logger.ts          # Structured logger (debug/info/warn/error)
├── types.ts           # Shared TypeScript types
├── validators.ts      # Input validation with Zod
├── errors.ts          # AppError class, error handler
└── cors.ts            # CORS headers helper
```

---

## 5. Offline Architecture

### Local SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS diary_entries (
  local_id TEXT PRIMARY KEY,
  entry_date TEXT NOT NULL,
  text_content TEXT,
  audio_local_uri TEXT,
  mood TEXT,
  sync_status TEXT DEFAULT 'pending',  -- pending | synced | failed
  remote_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diary_images (
  local_id TEXT PRIMARY KEY,
  diary_local_id TEXT REFERENCES diary_entries(local_id),
  local_uri TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  remote_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,  -- create_entry | upload_audio | upload_image
  payload TEXT NOT NULL,    -- JSON string
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Sync Flow

```
User saves diary entry
    ↓
Write to SQLite (immediate, <100ms)
    ↓
Add to sync_queue (FIFO)
    ↓
Network available?
    ├── YES → Process queue:
    │   1. Upload audio to Storage → get storage path
    │   2. Upload images to Storage → get storage paths
    │   3. POST to sync-diary Edge Function
    │   4. Update local sync_status = 'synced'
    │   5. Store remote_id for future reference
    └── NO → Queue persists, retries on connectivity
    ↓
Background sync via expo-background-fetch (periodic)
```

**Conflict resolution:** Server wins. Dedup via `UNIQUE(user_id, local_id)` constraint. If a remote entry already exists for a local_id, skip.

---

## 6. AI Pipeline

### Content Generation Pipeline

```
Diary Entry (text/transcription)
    ↓
+ Content Writing Profile (platform-specific)
+ Recent diary context (last 3 entries)
+ Content type instructions
    ↓
Claude API (structured output with Zod schema)
    ↓
Generated Post Object (title, body, slides/tweets, image prompt)
    ↓
Gemini API (Nano Banana 2) with image prompt
    ↓
Generated Image → Supabase Storage
    ↓
Complete draft post ready for review
```

### Creator Analysis Pipeline

```
Apify scrapes creator posts (LinkedIn/Instagram/X)
    ↓
Group by creator, calculate engagement scores
    ↓
Claude ranks creators by niche relevance
    ↓
Top 10-15 creators per platform stored
    ↓
Top 50 posts per platform sent to Claude
    ↓
Claude extracts: tone, format, vocabulary, hooks, hashtags
    ↓
Content Writing Profile generated per platform
```

### Prompt Templates

All prompts stored in `supabase/functions/generate-content/prompts.ts` and `supabase/functions/analyze-creators/prompts.ts`. Key prompt variables:

| Variable | Source |
|----------|--------|
| `{diary_entry_text}` | `diary_entries.text_content` or `transcription_text` |
| `{tone_description}` | `content_writing_profiles.tone_description` |
| `{format_patterns}` | `content_writing_profiles.format_patterns` |
| `{structural_patterns}` | `content_writing_profiles.structural_patterns` |
| `{example_hooks}` | `content_writing_profiles.example_hooks` |
| `{industry}` | `profiles.industry` |
| `{platform}` | Target platform |
| `{recent_diary_entries_summary}` | Last 3 `diary_entries` summarized |

---

## 7. Authentication Flow

```
App Launch
    ↓
Check Supabase session (expo-secure-store)
    ├── Valid session → Check onboarding_completed
    │   ├── TRUE → Navigate to (tabs)
    │   └── FALSE → Navigate to (onboarding)
    └── No session → Navigate to (auth)/sign-in
```

- Auth tokens stored in `expo-secure-store` (not AsyncStorage)
- Session refresh handled by `supabase-js` automatically
- `profiles` row created via Supabase database trigger on `auth.users` insert

---

## 8. Environment Variables

### Client-side (Expo)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Edge Functions (Supabase Secrets)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
APIFY_API_TOKEN=apify_api_...
```

All secrets set via `supabase secrets set KEY=VALUE`. Never exposed to client.

---

## 9. Dependencies

### Client
```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "expo-sqlite": "~15.x",
  "expo-av": "~15.x",
  "expo-image-picker": "~16.x",
  "expo-image": "~2.x",
  "expo-secure-store": "~14.x",
  "expo-background-fetch": "~13.x",
  "@supabase/supabase-js": "^2.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^5.x",
  "zod": "^3.x",
  "date-fns": "^3.x",
  "@shopify/flash-list": "^2.x",
  "react-native-reanimated": "~3.x",
  "react-native-gesture-handler": "~2.x"
}
```

### Edge Functions (Deno)
```typescript
// Import from deno.land or npm: specifiers
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { z } from "npm:zod";
```

---

## 10. Database Migrations Order

```
supabase/migrations/
├── 001_create_profiles.sql
├── 002_create_diary_entries.sql
├── 003_create_diary_images.sql
├── 004_create_platform_configs.sql
├── 005_create_creator_profiles.sql
├── 006_create_content_samples.sql
├── 007_create_writing_profiles.sql
├── 008_create_generated_posts.sql
├── 009_create_generation_queue.sql
├── 010_create_activity_log.sql
├── 011_create_storage_buckets.sql
└── 012_create_rls_policies.sql
```

---

## 11. API Rate Limits and Quotas

| Service | Limit | Strategy |
|---------|-------|----------|
| Claude API | Depends on tier | Queue jobs, process sequentially per user |
| Groq Whisper | 20 req/min (free) | Queue transcriptions, exponential backoff |
| Gemini API | 15 req/min (free) | Queue image generation, process sequentially |
| Apify | Depends on plan | Max 1 scrape per user per 24 hours |
| Supabase Edge Functions | 500K invocations/month (Pro) | Monitor usage, batch where possible |

---

## 12. Error Handling Strategy

### Client
- Network errors → queue for retry, show offline indicator
- API errors → show toast with user-friendly message, log structured error
- Auth errors → redirect to sign-in

### Edge Functions
- AI API failures → enqueue in `generation_queue` with retry (max 3)
- Scraping failures → partial results acceptable, log and continue
- Database errors → return 500, log full error context
- All errors logged with structured format: `{ level, message, userId, functionName, error, timestamp }`

### Retry Logic (`generation_queue`)
```
Attempt 1: immediate
Attempt 2: 30 second delay
Attempt 3: 5 minute delay
After 3 failures: mark as 'failed', notify user via activity log
```

---

## 13. File Structure

```
founder-diaries/
├── .env.example
├── .gitignore
├── app.json
├── babel.config.js
├── tsconfig.json
├── eas.json
├── package.json
├── PRD.md
├── ARCHITECTURE.md
├── FRONTEND.md
│
├── src/
│   ├── app/                          # Expo Router
│   │   ├── _layout.tsx               # Root: providers, auth gate
│   │   ├── +not-found.tsx
│   │   ├── index.tsx                 # Redirect logic
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── sign-in.tsx
│   │   │   ├── sign-up.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (onboarding)/
│   │   │   ├── _layout.tsx
│   │   │   ├── welcome.tsx
│   │   │   ├── industry-select.tsx
│   │   │   ├── platform-setup.tsx
│   │   │   └── quota-config.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           # Tab bar
│   │   │   ├── diary/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx         # Calendar + entry list
│   │   │   │   ├── [date].tsx        # Entry detail
│   │   │   │   └── new.tsx           # New entry
│   │   │   ├── content/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx         # Today's posts + quota
│   │   │   │   ├── [postId].tsx      # Post detail/edit
│   │   │   │   └── queue.tsx         # Scheduled posts
│   │   │   ├── discover/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx         # Creator dashboard
│   │   │   │   ├── [creatorId].tsx   # Creator detail
│   │   │   │   └── profiles.tsx      # Writing profiles
│   │   │   └── settings/
│   │   │       ├── _layout.tsx
│   │   │       ├── index.tsx
│   │   │       ├── platforms.tsx
│   │   │       └── account.tsx
│   │   └── (modals)/
│   │       ├── _layout.tsx
│   │       ├── audio-recorder.tsx
│   │       ├── image-picker.tsx
│   │       ├── post-preview.tsx
│   │       └── content-type-select.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # Button, Input, Card, Badge, Avatar,
│   │   │                              # BottomSheet, LoadingSpinner, EmptyState,
│   │   │                              # ProgressBar, Toast
│   │   ├── diary/                     # DiaryEntryCard, DiaryCalendar,
│   │   │                              # AudioRecordButton, TranscriptionStatus,
│   │   │                              # ImageAttachment, DiaryEntryForm, MoodSelector
│   │   ├── content/                   # PostCard, PostEditor, CarouselPreview,
│   │   │                              # ThreadPreview, PlatformBadge, ContentTypeIcon,
│   │   │                              # ImageGenerationPreview, PostActionBar,
│   │   │                              # WeeklyQuotaProgress
│   │   ├── discover/                  # CreatorCard, ContentSampleCard,
│   │   │                              # WritingProfileCard, DiscoveryCountdown,
│   │   │                              # PlatformFilter
│   │   └── layout/                    # ScreenContainer, HeaderBar, TabBarIcon
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── sqlite.ts
│   │   ├── logger.ts
│   │   ├── env.ts
│   │   └── constants.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDiaryEntry.ts
│   │   ├── useDiarySync.ts
│   │   ├── useAudioRecorder.ts
│   │   ├── useGeneratedPosts.ts
│   │   ├── useCreatorDiscovery.ts
│   │   ├── useContentProfile.ts
│   │   ├── usePlatformConfig.ts
│   │   ├── useWeeklyQuota.ts
│   │   └── useNetworkStatus.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── diaryStore.ts
│   │   ├── contentStore.ts
│   │   ├── syncStore.ts
│   │   └── uiStore.ts
│   │
│   ├── services/
│   │   ├── supabaseService.ts
│   │   ├── audioService.ts
│   │   ├── transcriptionService.ts
│   │   ├── contentGenerationService.ts
│   │   ├── imageGenerationService.ts
│   │   ├── scrapingService.ts
│   │   └── syncService.ts
│   │
│   ├── types/
│   │   ├── database.ts
│   │   ├── diary.ts
│   │   ├── content.ts
│   │   ├── creator.ts
│   │   ├── api.ts
│   │   └── navigation.ts
│   │
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── platformHelpers.ts
│   │   └── audioHelpers.ts
│   │
│   └── theme/
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── index.ts
│
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   ├── migrations/                    # 12 migration files
│   └── functions/
│       ├── _shared/                   # supabaseAdmin, logger, types, validators, errors, cors
│       ├── transcribe-audio/
│       ├── generate-content/          # index.ts, prompts.ts, schemas.ts
│       ├── generate-image/
│       ├── scrape-creators/           # index.ts, platforms/{linkedin,instagram,twitter}.ts
│       ├── analyze-creators/          # index.ts, prompts.ts
│       ├── daily-generation-cron/
│       └── sync-diary/
│
└── __tests__/
    ├── components/
    ├── hooks/
    ├── services/
    ├── stores/
    └── utils/
```
