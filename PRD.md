# Founder Diaries - Product Requirements Document

## 1. Product Overview

**Founder Diaries** is a cross-platform mobile app (iOS + Android) that helps founders turn their daily experiences into high-performing social media content. Founders record events via text or audio, and the app uses AI to generate platform-specific posts for LinkedIn, Instagram, and X (Twitter) — styled after viral creators in their niche.

### Problem Statement

Founders know they should build in public and share their journey on social media, but they:
- Don't have time to craft platform-specific content daily
- Don't know what content formats perform best on each platform
- Struggle to translate raw experiences into engaging posts
- Can't maintain consistency across multiple platforms

### Solution

A diary-first content engine that:
1. Captures the founder's daily experiences with zero friction (text or voice)
2. Learns what works on each platform by analyzing viral creators in their niche
3. Generates ready-to-post content tailored to each platform's style and format
4. Manages content across platforms with weekly quotas and scheduling

### Target User

Early-stage to growth-stage founders who:
- Are actively building a product or company
- Want to grow their personal brand on LinkedIn, Instagram, and/or X
- Have daily experiences worth sharing but lack time to create content
- Value authenticity — content should sound like them, not generic AI

---

## 2. User Personas

### Persona 1: "The Builder" (Primary)
- **Role**: Technical founder, seed to Series A
- **Platforms**: LinkedIn + X
- **Behavior**: Has plenty of stories (launches, failures, hiring wins) but never posts. Tried ghostwriters but it felt inauthentic.
- **Goal**: Post 3-5x/week on LinkedIn and X without spending more than 5 min/day
- **Pain**: "I have so many stories but I never have time to write them up"

### Persona 2: "The Storyteller" (Secondary)
- **Role**: Non-technical founder or solopreneur
- **Platforms**: Instagram + LinkedIn
- **Behavior**: Posts occasionally but inconsistently. Wants to build a brand around their journey.
- **Goal**: Create a mix of posts, carousels, and reels content weekly
- **Pain**: "I don't know what format works best or how to make my content stand out"

### Persona 3: "The Scale-Up CEO" (Tertiary)
- **Role**: CEO of a 20-50 person company
- **Platforms**: LinkedIn
- **Behavior**: Has a marketing team but wants authentic founder content. Records voice memos between meetings.
- **Goal**: 2-3 high-quality LinkedIn posts per week from voice recordings
- **Pain**: "I can talk about my experience all day but writing it down is another story"

---

## 3. Core User Flows

### Flow 1: Onboarding (First Launch)

```
Sign Up (email/password)
    ↓
Welcome Screen
    "Turn your daily founder journey into viral content"
    [Get Started]
    ↓
Industry Selection
    - Select industry (SaaS, FinTech, HealthTech, E-commerce, etc.)
    - Add niche keywords (AI, developer tools, B2B, etc.)
    ↓
Platform Setup
    - Toggle platforms ON/OFF: LinkedIn, Instagram, X
    - For each active platform, select preferred content types:
      - LinkedIn: Post, Carousel
      - Instagram: Post, Carousel, Reel Caption
      - X: Tweet, Thread
    ↓
Quota Configuration
    - Per active platform, set weekly post quota (1-7 posts/week)
    - Optional: set preferred posting days/times
    ↓
Landing on Diary Tab
    "Start recording your first diary entry!"
```

**Acceptance Criteria:**
- User must select at least one industry and one platform
- Default weekly quota: 3 posts/week per platform
- Onboarding state persists — user never sees it again after completion
- Onboarding can be completed in under 2 minutes

---

### Flow 2: Daily Diary Entry (Core Loop)

```
Diary Tab → Tap "+" FAB
    ↓
New Entry Screen
    - Date: auto-filled (today)
    - Text input: multiline, expandable
    - Audio button: opens audio recorder modal
    - Image button: opens image picker modal
    - Mood selector: optional emoji/tag
    ↓
[If Audio]
    Audio Recorder Modal
        - Tap to record → waveform animation + timer
        - Pause / Resume
        - Stop → preview playback
        - [Discard] or [Save]
        - Returns to New Entry screen with audio attached
    ↓
    Audio uploads to cloud storage
    Transcription starts automatically (Groq Whisper)
    Transcription status shown: pending → processing → completed
    Transcribed text auto-fills the text input (user can edit)
    ↓
[If Images]
    Image Picker Modal
        - Take photo (camera)
        - Choose from gallery
        - Select multiple images
        - Returns to New Entry with images attached
    ↓
[Save Entry]
    - Saved to local SQLite immediately (offline-first)
    - Background sync to cloud when online
    - Entry appears in diary calendar view
    - Toast: "Entry saved"
```

**Acceptance Criteria:**
- Entry saves in <100ms (local SQLite)
- Audio recording supports up to 10 minutes
- Transcription completes within 30 seconds for a 5-minute recording
- Images can be up to 10MB each, max 5 per entry
- Entries created offline sync automatically when connectivity returns
- Calendar view shows dots on days with entries

---

### Flow 3: Discovery Unlock (After 7 Days)

```
Day 1-6: Diary Tab shows DiscoveryCountdown component
    "Record your founder journey for 7 days to unlock AI-powered content"
    Progress bar: X/7 days completed
    ↓
Day 7: User creates their 7th diary entry
    ↓
Discovery Unlocked notification
    "Your content engine is ready! We're finding creators in your space..."
    ↓
Background: Scraping pipeline triggers
    1. Apify actors search LinkedIn, Instagram, X for creators in user's niche
    2. Top 10-15 creators per platform discovered
    3. Their top 20-30 posts (past 3 months) scraped and scored by engagement
    4. Claude analyzes content patterns → generates writing profiles per platform
    ↓
Discovery Tab becomes active
    - Shows discovered creators grouped by platform
    - Each creator card: name, handle, follower count, relevance score
    - Tap creator → see their top posts + engagement metrics
    ↓
Writing Profiles screen
    - Per-platform content writing profile:
      - Tone description
      - Format patterns (hook style, length, structure)
      - Example hooks from top-performing posts
      - Hashtag strategy
    - User can trigger re-analysis
```

**Acceptance Criteria:**
- "7 days" means 7 unique calendar days with at least 1 entry each (not 7 entries on the same day)
- Scraping completes within 5 minutes
- At least 5 creators discovered per active platform
- Writing profile generated for each active platform
- User can manually refresh/re-scrape (max once per 24 hours)
- Creator data refreshes monthly automatically

---

### Flow 4: Daily Content Generation

```
Daily CRON job runs at 6:00 AM user's timezone
    ↓
For each user with discovery_unlocked = true:
    ↓
For each active platform:
    1. Check weekly quota: if already met, skip
    2. Get most recent diary entry (today or yesterday)
    3. Get platform's content writing profile
    4. Get recent diary context (last 3 entries for continuity)
    5. Determine content type (rotation: mostly posts, periodic carousels/threads)
    ↓
Claude generates content with structured output:
    - LinkedIn Post: hook line + body + hashtags + image prompt
    - Instagram Carousel: 5-8 slides (heading + body each) + caption + image prompts
    - Instagram Post: caption + image prompt
    - X Thread: 4-8 tweets (each ≤280 chars) + image prompt for first tweet
    - X Tweet: single tweet + image prompt
    - Reel Caption: caption text + concept description
    ↓
Nano Banana (Gemini) generates images:
    - Single image for posts/tweets
    - Per-slide images for carousels
    - Aspect ratios: 1:1 (Instagram), 4:5 (Instagram portrait), 16:9 (LinkedIn/X)
    ↓
Posts saved as "draft" status
    ↓
User opens Content Tab
    - Sees today's generated posts
    - Weekly quota progress bars per platform
    - Each post shows: platform badge, content type, preview text, generated image
```

**Acceptance Criteria:**
- Content generated by 7:00 AM user's timezone
- Each generated post must be based on actual diary content (no fabrication)
- Generated content matches the writing profile's tone and format
- Image generated for every post (except reel captions which get concept descriptions)
- User never gets more posts than their weekly quota allows
- Content type rotation: ~60% regular posts, ~25% carousels/threads, ~15% reel captions

---

### Flow 5: Content Review and Approval

```
Content Tab → Tap on a PostCard
    ↓
Post Detail Screen
    - Full post text (editable)
    - Platform badge + content type label
    - Generated image preview (tappable to view full screen)
    - For carousels: swipeable slide preview
    - For threads: threaded tweet preview
    ↓
Action Bar:
    [Approve] → status changes to "approved", moves to queue
    [Edit] → inline text editing, save creates "user_edits" version
    [Regenerate] → triggers new generation with same diary entry
    [Reject] → status changes to "rejected", removed from queue
    [Use My Image] → opens image picker to replace generated image with user's uploaded diary image
    ↓
Queue Screen (from Content Tab)
    - List of approved posts sorted by scheduled date
    - Drag to reorder
    - Status badges: draft, approved, scheduled, posted
    - Calendar view option
```

**Acceptance Criteria:**
- Edit mode shows character count and platform limits
- LinkedIn posts: max 3,000 characters
- X tweets: max 280 characters per tweet
- Instagram captions: max 2,200 characters
- Regeneration uses the same diary entry but produces different content
- User can swap generated image with any of their uploaded diary images
- Rejected posts don't count toward weekly quota

---

### Flow 6: Image Management

```
Diary Entry → Attach images
    - Images stored in user's image library
    - Auto-tagged by content/topic
    ↓
Content Generation
    - AI considers user's uploaded images when generating posts
    - If a diary entry has images relevant to the post topic, AI may suggest using them
    ↓
Post Detail → "Use My Image"
    - Browse user's uploaded images (from all diary entries)
    - Select one → replaces generated image
    - For carousels: can replace individual slide images
    ↓
Image appears in the approved post
```

**Acceptance Criteria:**
- Users can upload JPG, PNG, HEIC images up to 10MB
- Images persist across sessions and are browsable
- Generated images can always be swapped for user images
- Carousel slides can have a mix of generated and user images

---

### Flow 7: Settings and Configuration

```
Settings Tab
    ├── Platforms
    │   ├── LinkedIn: ON/OFF, weekly quota slider, content types, posting times
    │   ├── Instagram: ON/OFF, weekly quota slider, content types, posting times
    │   └── X: ON/OFF, weekly quota slider, content types, posting times
    ├── Account
    │   ├── Name, avatar, email
    │   ├── Industry and niche keywords (editable)
    │   └── Delete account
    └── About
        ├── App version
        ├── Privacy policy
        └── Terms of service
```

**Acceptance Criteria:**
- Changing industry/niche triggers a re-scrape of creators
- Quota changes take effect from the next week
- Disabling a platform stops content generation for it
- Account deletion removes all data (GDPR compliance)

---

## 4. Feature Priority Matrix

| Feature | Priority | Phase | Rationale |
|---------|----------|-------|-----------|
| Text diary entries | P0 | 1 | Core data collection |
| Auth + onboarding | P0 | 1 | Required for everything |
| Audio recording + transcription | P0 | 2 | Key differentiator for busy founders |
| Offline diary (SQLite) | P0 | 2 | Reliability is non-negotiable |
| Image upload to diary | P1 | 2 | Enables authentic content |
| Creator discovery (Apify) | P0 | 3 | Foundation for content quality |
| Content writing profiles | P0 | 3 | Foundation for content quality |
| Daily content generation | P0 | 4 | Core value proposition |
| Image generation | P1 | 4 | Visual content is essential |
| Carousel generation | P1 | 4 | High-performing format |
| Thread generation | P1 | 4 | High-performing format on X |
| Content approval flow | P0 | 4 | User must control what goes out |
| Weekly quota management | P1 | 4 | User control over volume |
| Content queue/calendar | P2 | 4 | Nice to have for planning |
| Reel caption generation | P2 | 4 | Lower priority content type |
| Settings/platform config | P1 | 5 | Configuration flexibility |
| Push notifications | P3 | 5+ | Reminder to record diary |
| Direct posting to platforms | P3 | 5+ | Future integration |
| Analytics/performance tracking | P3 | 5+ | Track which posts perform well |

---

## 5. Content Type Specifications

### LinkedIn Post
- **Format**: Text-only or text + single image
- **Length**: 200-3,000 characters (sweet spot: 800-1,500)
- **Structure**: Hook line → Story/insight → Lesson → CTA
- **Image**: 1200x627px (16:9) or 1080x1080px (1:1)
- **Hashtags**: 3-5 relevant hashtags at the end

### LinkedIn Carousel
- **Format**: PDF-style swipeable slides
- **Slides**: 5-8 slides
- **Structure**: Hook slide → Content slides → CTA slide
- **Per slide**: Heading (max 8 words) + body (max 30 words)
- **Image per slide**: 1080x1080px or 1080x1350px
- **Caption**: Complementary text, not repetition of slides

### Instagram Post
- **Format**: Single image + caption
- **Caption length**: Up to 2,200 characters
- **Image**: 1080x1080px (1:1) or 1080x1350px (4:5)
- **Hashtags**: 10-20 relevant hashtags
- **Structure**: Hook → Story → CTA + hashtags

### Instagram Carousel
- **Format**: Up to 10 swipeable image slides
- **Slides**: 5-8 slides (same as LinkedIn carousel but styled for IG)
- **Image per slide**: 1080x1080px or 1080x1350px
- **Caption**: Complementary text + hashtags

### Instagram Reel Caption
- **Format**: Caption text + concept description for filming
- **Caption length**: Up to 2,200 characters
- **Concept**: Shot-by-shot description the founder can follow
- **Hashtags**: 10-20 relevant hashtags

### X/Twitter Single Tweet
- **Format**: Text-only or text + single image
- **Length**: Max 280 characters
- **Image**: 1200x675px (16:9)
- **Style**: Punchy, opinionated, shareable

### X/Twitter Thread
- **Format**: 4-8 connected tweets
- **Per tweet**: Max 280 characters
- **Structure**: Hook tweet → Value tweets → Summary/CTA tweet
- **Image**: Optional, first tweet only
- **Numbering**: No explicit numbering (threads are auto-threaded)

---

## 6. Non-Functional Requirements

### Performance
- App launch to interactive: <2 seconds
- Diary entry save: <100ms (local), <3s (synced)
- Audio transcription: <30s for 5-minute recording
- Content generation: <60s per post
- Image generation: <30s per image

### Reliability
- Offline diary must work with zero connectivity
- Sync queue must be durable (survives app kill)
- Failed transcriptions auto-retry (max 3 attempts)
- Failed content generation auto-retry (max 3 attempts)

### Security
- All API keys stored server-side in Edge Functions
- Client never sees AI provider credentials
- Row-Level Security on all database tables
- Audio/images in private storage buckets (per-user access)
- Auth tokens stored in secure storage (not AsyncStorage)

### Privacy
- Diary data encrypted at rest (Supabase default)
- Audio files encrypted in transit and at rest
- No diary data shared with third parties
- Account deletion removes all data within 30 days
- Scraped creator data is public information only

### Scalability
- Edge Functions scale automatically (Supabase/Deno Deploy)
- Database indexes on all query-hot paths
- Image generation queued (not blocking UI)
- CRON job handles batch generation efficiently

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily diary entries per active user | 5+/week | `diary_entries` table count |
| Content approval rate | >60% | approved / (approved + rejected) |
| Weekly quota utilization | >70% | approved posts / quota |
| Time from diary entry to content review | <5 min | `diary_entries.created_at` to push notification |
| User retention (Week 4) | >40% | Users with entries in week 4 / total signups |
| Audio vs text entries | >30% audio | Entries with audio / total entries |

---

## 8. Out of Scope (v1)

- Direct posting to social platforms (copy-paste for now)
- Multi-user teams / agency features
- Analytics on posted content performance
- A/B testing of generated content
- Video generation for reels
- Scheduling with platform calendars
- Web app (mobile-only for v1)
- Multi-language support
- Paid subscription / monetization (free during beta)
