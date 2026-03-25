
# Founder Diaries — Full Screen Build Plan

## Design System Foundation

### Visual DNA (from existing Figma)
- **Brand font:** Serif, all-caps for "FOUNDER DIARIES" wordmark
- **UI font:** Clean sans-serif for all interaction text
- **Palette:** Warm earth tones — cream/off-white backgrounds, copper/rust accents, warm grays
- **Mood:** Industrial aesthetic (brand layer) + human warmth (interaction layer). Think Leica camera meets iMessage.
- **Border-radius:** 12px cards, 8px buttons, 20px pills
- **Spacing rhythm:** 8/12/16/24px

### Tab Bar (Redesigned)

**4 tabs with labels:**

| Tab | Icon | Label | Content |
|-----|------|-------|---------|
| 1 | Book/journal icon | **Diary** | Calendar + entries (Archive merged as "All" filter) |
| 2 | Sparkles/wand icon | **Content** | Generated posts + Queue |
| 3 | Compass/search icon | **Discover** | Creators + Writing Profiles (locked until Day 7) |
| 4 | Gear icon | **Settings** | Platform config, account, preferences |

**iOS:** Standard `UITabBar`, no FAB. "New Entry" via top-right `+` nav bar button on Diary tab.
**Android:** M3 Navigation Bar with active pill indicator. Extended FAB "New Entry" floating bottom-right on Diary tab only.

---

## Screen Specifications

### Group 1: Onboarding (4 screens)

---

#### Screen 1.1: Welcome
**Purpose:** First impression, value prop, get started.

**Layout:**
- Full-screen, centered content
- "FOUNDER DIARIES" wordmark (serif, large) at top
- Illustration or abstract graphic: forge/anvil motif, warm tones
- Headline: "Your daily grind, turned into content that performs."
- Subtext: "Record your founder journey. We'll turn it into posts for LinkedIn, Instagram, and X."
- Primary CTA: "Get Started" (full-width, copper/rust accent)
- Secondary link: "Already have an account? Sign In"

**States:** Single state, no loading.

---

#### Screen 1.2: Industry Selection
**Purpose:** Set user's niche for creator discovery pipeline.

**Layout:**
- Progress indicator: Step 1 of 3 (dots or bar)
- Title: "What are you building?"
- Subtitle: "We'll find creators in your space to learn from."
- Scrollable list of industry chips/cards (single select):
  - SaaS, FinTech, HealthTech, E-commerce, Developer Tools, AI/ML, EdTech, Climate, Consumer, Marketplace, Other
- Each chip: emoji + label (e.g., "💻 SaaS", "🏥 HealthTech")
- Below: "Add niche keywords" text input with tag-style chips (e.g., "B2B", "developer tools", "AI")
- Bottom: "Continue" button (disabled until selection made)
- Back arrow top-left

**States:** Default, one selected (highlighted chip), keywords added.

---

#### Screen 1.3: Platform Setup
**Purpose:** Choose which platforms to generate content for.

**Layout:**
- Progress indicator: Step 2 of 3
- Title: "Where do you post?"
- Subtitle: "Toggle on the platforms you're active on."
- 3 platform cards (toggle-style, multi-select):
  - **LinkedIn** card: icon + name + content type chips below (Post, Carousel) — chips appear when toggled ON
  - **Instagram** card: icon + name + content type chips (Post, Carousel, Reel Caption)
  - **X** card: icon + name + content type chips (Tweet, Thread)
- Each card: platform icon left, name center, toggle right. When ON, expand to show content type selection chips below.
- Bottom: "Continue" button (disabled until at least 1 platform)
- Back arrow

**States:** All off, one on with content types visible, multiple on.

---

#### Screen 1.4: Quota Configuration
**Purpose:** Set weekly posting volume per platform.

**Layout:**
- Progress indicator: Step 3 of 3
- Title: "How often?"
- Subtitle: "Set your weekly posting goal per platform."
- For each active platform (from previous step):
  - Platform icon + name
  - Slider: 1-7 posts/week (default: 3)
  - Value label showing current selection: "3 posts/week"
- Optional section: "Preferred posting days" — day-of-week pills (M T W T F S S) multi-select
- Bottom: "Start Your Diary" CTA (full-width, primary)
- Back arrow

**States:** Default (3/week each), adjusted values.

---

### Group 2: Redesigned Core Screens (3 screens)

---

#### Screen 2.1: Diary Tab (Redesigned)
**Purpose:** Daily journal — the core input loop.

**Layout:**
- Large title: "Diary" (iOS large title style)
- Top-right: "+" button to create new entry
- **Week strip** (not full calendar): Shows current week, M-S, 44pt per day minimum. Dot indicators on days with entries. Swipe to navigate weeks. Tap to expand to month view.
- Below week strip: Streak counter pill "🔥 4 day streak"
- **Discovery countdown banner** (Days 1-6 only): "Record for 3 more days to unlock AI content" — progress bar — dismissable after Day 7
- **Entry list:** Chronological, grouped by time
  - Each entry card: timestamp, mood emoji, preview text (2 lines), attachment indicators (mic icon if audio, camera icon if images)
  - Swipe left: Delete. Swipe right: Archive.
- **Empty state** (first launch): Illustration + "Start recording your founder journey" + "Your first entry is just a tap away" + large "+" button

**States:** Empty (first use), with entries, with countdown banner, streak display, month view expanded.

---

#### Screen 2.2: New Entry (Redesigned)
**Purpose:** Capture diary entry — text or voice.

**Layout:**
- Modal presentation (iOS sheet / Android bottom sheet)
- Header: "Cancel" (left), "New Entry" (center), "Save" (right, disabled until content)
- Date/time: Tappable, shows compact date picker on tap — "Mar 15, 2026 · 10:30 AM"
- **Text area:** Large, auto-expanding, placeholder: "What happened today?" — this is THE primary element, given maximum space
- **Mood selector** (below text, optional): Horizontal scroll of mood pills: 😤 Frustrated, 🔥 Fired Up, 💡 Breakthrough, 😊 Good Day, 😓 Tough Day, 🚀 Shipped It
- **Toolbar** (bottom, above keyboard when active):
  - 🎤 Voice button — opens Audio Recorder
  - 📷 Photo button — opens camera/gallery picker
  - Attachment count indicator if media attached

**States:** Empty, typing, with audio attached (shows waveform chip), with images attached (shows thumbnail strip), mood selected.

---

#### Screen 2.3: Audio Recorder Modal
**Purpose:** Voice recording with live transcription.

**Layout:**
- Half-sheet modal (covers bottom 60% of screen)
- **Recording state:**
  - Large waveform visualization (animated)
  - Timer: "02:34" centered
  - Controls: Pause (left), Stop/Done (center, large red circle), Cancel (right)
- **Preview state** (after stopping):
  - Static waveform
  - Playback controls: rewind 15s, play/pause, forward 15s
  - Duration shown
  - "Discard" (left) and "Use Recording" (right, primary)
- **Transcribing state** (after "Use Recording"):
  - Returns to New Entry screen
  - Shows transcription chip: "Transcribing..." with spinner
  - When complete: Text auto-fills into text area, chip changes to "✓ Transcribed — 2:34 audio"
  - User can edit transcribed text

**States:** Idle (ready to record), recording (waveform + timer), paused, preview (playback), transcribing.

---

### Group 3: Content Flow (4 screens)

---

#### Screen 3.1: Content Tab (Redesigned)
**Purpose:** Review AI-generated content, manage posting pipeline.

**Layout:**
- Large title: "Content"
- Subtitle: "This week" with quota pill: "3 of 7 posts"
- **Segment control** (top): "Ready" | "Queue" | "Posted"
- **Ready tab:** Cards of newly generated posts awaiting review
  - Each card: Platform badge pill (LinkedIn/IG/X), content type label, 3-line preview, generated image thumbnail, status badge
  - Single tap: Opens Post Detail
- **Queue tab:** Approved posts sorted by scheduled date
- **Posted tab:** History of published posts (copy-pasted by user in v1)
- Empty state for Ready: "No new content today. Write a diary entry to generate posts!"

**States:** Ready (with cards), Ready (empty), Queue view, Posted view.

---

#### Screen 3.2: Post Detail
**Purpose:** Full content review with approve/edit/reject/regenerate.

**Layout:**
- Full screen, push navigation from Content tab
- Header: Back arrow, platform badge, content type label
- **Image preview:** Full-width generated image (tappable for fullscreen). "Use My Image" button overlay in corner.
- **Post text:** Full editable text area. Character count in bottom corner (e.g., "847 / 3,000" for LinkedIn)
- **Hashtags:** Shown as removable chips below text
- **Source reference:** "Based on your diary entry from Mar 15" — tappable to view original entry
- **Action bar** (bottom, fixed):
  - "Reject" (left, text button, muted)
  - "Regenerate" (center-left, secondary button with ↻ icon)  
  - "Approve" (right, primary button, full copper accent)
- If editing: Save bar replaces action bar

**Carousel variant:** Swipeable slide preview replacing single image. Slide counter: "3 of 7". Each slide editable.
**Thread variant:** Threaded tweet cards stacked vertically. Each tweet editable with per-tweet character count.

**States:** Draft review, editing mode, carousel view, thread view, regenerating (loading shimmer).

---

#### Screen 3.3: Content Queue
**Purpose:** Manage approved posts schedule.

**Layout:**
- Accessed from "Queue" segment in Content Tab
- Calendar week view at top (matching Diary week strip style)
- Below: List of approved posts sorted by date
  - Each row: Date, platform icon, content type, preview snippet, status badge
  - Drag handles for reorder
  - Swipe left to remove from queue
- Status badges: "Approved" (copper), "Scheduled" (blue-gray), "Posted" (green)
- Tap any item: Opens Post Detail

**States:** Empty queue, populated queue, reordering mode.

---

#### Screen 3.4: Image Swap Picker
**Purpose:** Replace AI-generated image with user's own diary photos.

**Layout:**
- Modal sheet from Post Detail
- Title: "Your Images"
- Grid of all images from diary entries (3-column photo grid)
- Each image: thumbnail + date badge overlay
- Tap to select → shows checkmark → "Use This Image" button at bottom
- For carousels: Shows which slide is being replaced ("Replace slide 3 of 7")

**States:** Browsing, image selected, empty (no diary images yet).

---

### Group 4: Discovery (3 screens)

---

#### Screen 4.1: Discovery Tab — Locked State
**Purpose:** Motivate daily journaling during Days 1-6.

**Layout:**
- Large title: "Discover" (dimmed/locked styling)
- Centered illustration: Lock/compass motif
- Headline: "Unlock your content engine"
- Body: "Write diary entries for 7 days and we'll analyze top creators in your niche to craft your unique voice."
- Progress: "4 of 7 days completed" with circular or linear progress bar
- Day indicators: 7 dots showing completed vs remaining
- Subtle: "Why 7 days? We need enough of your voice to match you with the right creators."

**States:** Day 1 (just started), Day 4 (progress), Day 6 (almost there), Unlocking animation.

---

#### Screen 4.2: Discovery Tab — Unlocked
**Purpose:** Show discovered creators and writing profiles.

**Layout:**
- Large title: "Discover"
- **Segment control:** "Creators" | "Your Voice"
- **Creators tab:**
  - Platform filter pills: All, LinkedIn, Instagram, X
  - Creator cards (vertical list):
    - Avatar (circle), Name, Handle, Platform badge
    - Follower count, Relevance score pill
    - "See top posts →" link
  - 10-15 creators per platform
  - Pull to refresh (max once per 24 hours — show "Last updated 3h ago")
- **Your Voice tab:**
  - Per-platform writing profile cards:
    - Platform header (LinkedIn/IG/X)
    - "Tone: Conversational, story-driven, technical but accessible"
    - "Hook style: Question or bold claim"
    - "Typical length: 800-1200 chars"
    - Example hooks section (2-3 examples)
    - "Refresh Analysis" button

**States:** Loading (first unlock, "Analyzing creators in your space..."), populated, refreshing.

---

#### Screen 4.3: Creator Detail
**Purpose:** Deep dive into a discovered creator's content.

**Layout:**
- Push navigation from Discovery
- Header: Creator avatar, name, handle, platform, follower count
- Stats row: Avg engagement, post frequency, top content type
- **Top posts list:** 
  - Post cards showing: preview text, engagement metrics (likes, comments, reposts), date
  - Sorted by engagement
- "This creator's style influences your [Platform] writing profile" — context note at top

**States:** Loaded with posts, loading.

---

### Group 5: Settings (Redesigned) + Supporting Screens

---

#### Screen 5.1: Settings (Redesigned)
**Purpose:** All configuration in one place.

**Layout:**
- Large title: "Settings"
- **Section: Platforms**
  - Each platform row: Icon, name, toggle, quota preview ("3/week")
  - Tap row → Platform Detail screen (quota slider, content types, posting times)
- **Section: Profile**
  - "Industry & Niche" row → editable (warns: changes trigger re-analysis)
  - "Account Details" row → name, email, avatar
- **Section: Preferences**
  - "Appearance" → Light/Dark/System
  - "Notifications" → toggle diary reminder, content ready alerts
- **Section: Data**
  - "Export Data" row
  - "Delete Account" row (red text, destructive)
- **Footer:** App version, Privacy Policy, Terms of Service links

---

#### Screen 5.2: Login (Redesigned)
**Purpose:** Streamlined auth with social sign-in.

**Layout:**
- "FOUNDER DIARIES" wordmark (serif, large, centered)
- "Your forge. Your story." tagline
- **Primary:** "Continue with Apple" (dark button, Apple logo) — iOS required
- **Secondary:** "Continue with Google" (outlined button)
- **Divider:** "or"
- Email field (label: "Email", not "Access Identification")
- Password field (label: "Password", not "Secure Cipher")
- "Sign In" button (primary accent)
- "Forgot password?" link
- "Don't have an account? Sign Up" link

---

#### Screen 5.3: Empty States Collection

**First Diary Entry:**
- Warm illustration
- "Your story starts here"
- "Tap + to record your first founder diary entry. It only takes a minute."

**No Content Yet (pre-Discovery):**
- "Content comes after discovery"
- "Keep journaling — once we learn your voice, daily content appears here."

**Discovery Locked:**
- See Screen 4.1 above

**Offline Mode:**
- Subtle banner at top: "Offline — entries saved locally"
- All diary features work normally
- Content/Discovery tabs show cached data with "Last updated" timestamp

**Generation Failed:**
- Inline on Content tab: "Couldn't generate today's content"
- "Retry" button + "We'll try again tomorrow" fallback text

**Sync Failed:**
- Toast/snackbar: "Couldn't sync. Will retry when connected."
- Persistent indicator on entry card: cloud icon with ✗

---

## Build Priority and Sequencing

| Priority | Screens | Rationale |
|----------|---------|-----------|
| **Build 1** | Login (redesigned), Onboarding (4 screens), Diary Tab (redesigned), New Entry (redesigned), Tab Bar | Unblocks the core input loop |
| **Build 2** | Audio Recorder, Discovery Tab (locked + unlocked), Discovery Countdown | Core differentiators |
| **Build 3** | Content Tab (redesigned), Post Detail, Content Queue | Content output loop |
| **Build 4** | Creator Detail, Image Swap, Settings (redesigned), Empty States, Error States | Polish and completeness |

## Design Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Tab count | 4 (Diary, Content, Discover, Settings) | Archive merged into Diary, cleaner IA |
| FAB removal (iOS) | "+" in nav bar | HIG compliance |
| Calendar style | Collapsible week strip | 44pt targets, saves vertical space |
| Onboarding steps | 3 steps (Industry, Platforms, Quota) | Welcome is separate, 3 steps feels achievable |
| Industrial vibe boundary | Serif for brand, sans for UI | Industrial aesthetic without interaction friction |
| Content card CTA | Single "Review and Publish" | Eliminates decision paralysis on list view |
| Discovery as tab | Own tab, not hidden | Most differentiating feature deserves top-level nav |

## Execution Decides

- Exact color palette values (copper/rust exact hex within warm earth range)
- Typography sizes and weights within the scale
- Icon selection (SF Symbols for iOS, Material Symbols for Android)
- Animation and transition specifics
- Exact card shadow/elevation values
- Image placeholder and loading skeleton patterns

## Constraints

- **DO NOT** use industrial jargon for UI labels ("Access Identification", "Secure Cipher" etc.)
- **DO NOT** use icon-only tab bar — always include text labels
- **DO NOT** center a FAB in the tab bar on iOS
- **DO NOT** show version numbers in production UI
- **DO** maintain the warm earth tone palette and serif brand identity
- **DO** ensure 44pt minimum touch targets on all interactive elements
- **DO** use consistent status badge styling (pill pattern with semantic colors)
