# Founder Diaries - Frontend Design Brief

## 1. Design System

### 1.1 Color Palette

**Brand Colors:**
| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#EEF2FF` | Primary tint/background |
| `primary-100` | `#E0E7FF` | Hover states, subtle fills |
| `primary-200` | `#C7D2FE` | Active states |
| `primary-500` | `#6366F1` | Primary buttons, links, accents |
| `primary-600` | `#4F46E5` | Primary button pressed |
| `primary-700` | `#4338CA` | Primary dark variant |

**Neutral Colors:**
| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#F9FAFB` | Page backgrounds |
| `gray-100` | `#F3F4F6` | Card backgrounds, dividers |
| `gray-200` | `#E5E7EB` | Borders |
| `gray-400` | `#9CA3AF` | Placeholder text |
| `gray-500` | `#6B7280` | Secondary text |
| `gray-700` | `#374151` | Body text |
| `gray-900` | `#111827` | Headings |

**Semantic Colors:**
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` | Approved, synced, completed |
| `warning` | `#F59E0B` | Pending, processing |
| `error` | `#EF4444` | Failed, rejected, errors |
| `info` | `#3B82F6` | Informational badges |

**Platform Colors:**
| Token | Hex | Usage |
|-------|-----|-------|
| `linkedin` | `#0A66C2` | LinkedIn badges, icons |
| `instagram` | `#E1306C` | Instagram badges, icons |
| `x-twitter` | `#000000` | X/Twitter badges, icons |

**Dark Mode:**
- `gray-50` → `#111827` (background)
- `gray-100` → `#1F2937` (card background)
- `gray-900` → `#F9FAFB` (headings)
- Primary colors stay the same (indigo works in both modes)

### 1.2 Typography

**Font Family:** System default (San Francisco on iOS, Roboto on Android)

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `heading-xl` | 28px | 700 (Bold) | 34px | Screen titles |
| `heading-lg` | 22px | 700 (Bold) | 28px | Section headers |
| `heading-md` | 18px | 600 (Semibold) | 24px | Card titles |
| `heading-sm` | 16px | 600 (Semibold) | 22px | Subsection headers |
| `body-lg` | 16px | 400 (Regular) | 24px | Primary body text |
| `body-md` | 14px | 400 (Regular) | 20px | Secondary body, descriptions |
| `body-sm` | 12px | 400 (Regular) | 16px | Captions, labels, timestamps |
| `button` | 16px | 600 (Semibold) | 20px | Button labels |
| `label` | 12px | 500 (Medium) | 16px | Form labels, badges |

### 1.3 Spacing Scale

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;
```

### 1.4 Border Radius

```typescript
const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
```

### 1.5 Shadows

```typescript
const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
} as const;
```

---

## 2. Component Library

### 2.1 UI Primitives (`components/ui/`)

#### `Button.tsx`

**Variants:**
| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `primary` | `primary-500` | `white` | none |
| `secondary` | `gray-100` | `gray-700` | `gray-200` |
| `outline` | `transparent` | `primary-500` | `primary-500` |
| `ghost` | `transparent` | `gray-700` | none |
| `danger` | `error` | `white` | none |

**Sizes:** `sm` (32px height), `md` (44px height), `lg` (52px height)

**States:** default, pressed (opacity 0.8), disabled (opacity 0.5), loading (spinner replaces text)

**Props:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}
```

#### `Input.tsx`

**Variants:** `default`, `textarea` (multiline)

**States:** default, focused (primary-500 border), error (error border + error message), disabled

**Props:**
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  multiline?: boolean;
  maxLength?: number;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardType;
  autoFocus?: boolean;
  helperText?: string;
}
```

#### `Card.tsx`

```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing;
  onPress?: () => void;
}
```
- `elevated`: white bg + shadow-md
- `outlined`: white bg + gray-200 border
- `filled`: gray-50 bg, no border

#### `Badge.tsx`

```typescript
interface BadgeProps {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'linkedin' | 'instagram' | 'x';
  size?: 'sm' | 'md';
}
```

#### `Avatar.tsx`

```typescript
interface AvatarProps {
  source?: string;
  fallback: string;  // initials
  size: 'sm' | 'md' | 'lg' | 'xl';  // 32, 40, 48, 64
}
```

#### `BottomSheet.tsx`

Uses `react-native-gesture-handler` + `react-native-reanimated` for smooth gesture-driven sheet.

```typescript
interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  snapPoints: number[];  // e.g., [300, 500]
  children: React.ReactNode;
}
```

#### `LoadingSpinner.tsx`

Simple animated indigo spinner. Sizes: `sm` (20px), `md` (32px), `lg` (48px).

#### `EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

#### `ProgressBar.tsx`

```typescript
interface ProgressBarProps {
  progress: number;  // 0 to 1
  color?: string;    // defaults to primary-500
  height?: number;   // defaults to 8
  label?: string;    // e.g., "3/5 posts this week"
}
```

#### `Toast.tsx`

Slides in from top, auto-dismisses after 3s. Variants: `success`, `error`, `info`.

```typescript
interface ToastProps {
  message: string;
  variant: 'success' | 'error' | 'info';
  duration?: number;
}
```

---

### 2.2 Diary Components (`components/diary/`)

#### `DiaryEntryCard.tsx`

Displays a diary entry in a list. Shows:
- Date + time (top left)
- Mood emoji (top right, if set)
- First 2 lines of text content (truncated)
- Audio indicator icon (if has audio)
- Image thumbnail strip (if has images, max 3 shown + "+N" badge)
- Sync status indicator (green dot = synced, yellow = pending, red = failed)

**Dimensions:** Full width, ~100px height. Card variant: `outlined`.

**Interactions:** Tap → navigate to `diary/[date]`

#### `DiaryCalendar.tsx`

Monthly calendar grid showing:
- Dots on days with entries (primary-500 dot)
- Today highlighted (primary-100 background)
- Selected day highlighted (primary-500 background, white text)
- Swipe left/right to change months

**Interactions:** Tap day → navigate to `diary/[date]` or `diary/new` if no entry exists

#### `DiaryEntryForm.tsx`

Main form for creating/editing diary entries:
- Date display (non-editable, auto-filled to today)
- Large multiline `Input` (textarea variant) for text content
- Row of action buttons below text:
  - Microphone icon → opens audio recorder modal
  - Camera icon → opens image picker modal
  - Mood icon → toggles MoodSelector
- Attached audio preview (if recorded): waveform thumbnail + duration + remove button
- Attached images preview (if uploaded): horizontal scroll of thumbnails + remove buttons
- Save button (primary, full width) at bottom

**Layout:** ScrollView wrapping the form, KeyboardAvoidingView for proper keyboard handling.

#### `AudioRecordButton.tsx`

Circular button (56px) with microphone icon. States:
- Default: gray-100 background, gray-500 icon
- Recording: error background (red), white icon, pulsing animation

#### `TranscriptionStatus.tsx`

Inline status indicator:
- `pending`: Clock icon + "Waiting to transcribe..." (gray-400)
- `processing`: Spinner + "Transcribing..." (warning color)
- `completed`: Check icon + "Transcribed" (success color) + show transcribed text
- `failed`: Error icon + "Transcription failed" (error color) + retry button

#### `ImageAttachment.tsx`

Horizontal scrollable row of image thumbnails (64x64, rounded-md). Each thumbnail has:
- The image (cropped to fill)
- Small "X" button in top-right corner to remove
- "+" button at the end to add more

#### `MoodSelector.tsx`

Horizontal row of mood options. Each is a tappable circle (40px) with an emoji:
- Energized, Productive, Neutral, Stressed, Frustrated

Selected mood gets primary-100 background ring.

---

### 2.3 Content Components (`components/content/`)

#### `PostCard.tsx`

Card displaying a generated post in a list. Shows:
- Top row: PlatformBadge (left) + ContentTypeIcon + status Badge (right)
- Title (heading-sm, gray-900)
- Body text preview (body-md, gray-500, max 3 lines truncated)
- Generated image thumbnail (if present): 80x80 rounded, right-aligned
- Bottom row: diary entry date reference + created time

**Dimensions:** Full width, variable height (~140-160px). Card variant: `elevated`.

**Interactions:** Tap → navigate to `content/[postId]`

#### `PostEditor.tsx`

Full-screen post editing component:
- Editable text area with the post content
- Character counter (shows limit for current platform)
- Platform-specific formatting preview
- For threads: separate text areas per tweet with "+" to add/remove
- For carousels: per-slide editing (heading + body + image)

#### `CarouselPreview.tsx`

Horizontal swipeable preview of carousel slides:
- Each slide: full-width card with heading (bold, centered), body text, background image
- Slide indicator dots at bottom
- Slide counter: "3/7"
- Dimensions: match Instagram aspect ratio (1:1 or 4:5)

#### `ThreadPreview.tsx`

Vertical thread preview styled like X/Twitter:
- Each tweet in a card with connecting line (left side)
- Character count per tweet (top right)
- Tweet order number (subtle, left margin)
- Visual indication if any tweet exceeds 280 chars (error border)

#### `PlatformBadge.tsx`

Small badge with platform icon + name:
- LinkedIn: blue background, LinkedIn logo
- Instagram: gradient pink/purple background, Instagram logo
- X: black background, X logo

Size: fits `label` typography.

#### `ContentTypeIcon.tsx`

Small icon indicating content type:
- Post: document icon
- Carousel: layers/slides icon
- Thread: chain/thread icon
- Reel: video/play icon

#### `ImageGenerationPreview.tsx`

Shows the AI-generated image with:
- Full-width image display
- Loading skeleton while generating
- "Regenerate" button (ghost variant) below
- "Use my image" button (outline variant) below
- Aspect ratio preserved

#### `PostActionBar.tsx`

Fixed bottom bar with action buttons:
```
[ Reject (ghost/danger) ]  [ Edit (outline) ]  [ Approve (primary) ]
```
Additional actions in overflow menu: Regenerate, Use My Image, Change Content Type

#### `WeeklyQuotaProgress.tsx`

Per-platform quota display:
- Platform icon + name
- ProgressBar showing approved/total quota
- Text: "3 of 5 posts this week"
- Color: platform color for the progress bar

Displays as a horizontal card. Three cards stacked vertically (one per active platform).

---

### 2.4 Discover Components (`components/discover/`)

#### `CreatorCard.tsx`

Card displaying a discovered creator:
- Left: Avatar (48px) with platform badge overlay (bottom-right)
- Center: Creator name (heading-sm) + @handle (body-sm, gray-500) + follower count
- Right: Relevance score as a percentage badge
- Bottom: 1-line bio text (truncated)

**Interactions:** Tap → navigate to `discover/[creatorId]`

#### `ContentSampleCard.tsx`

Card displaying a scraped post from a creator:
- Post text (body-md, max 4 lines truncated)
- Engagement metrics row: likes, comments, shares icons with counts
- Engagement score badge
- Posted date (body-sm, gray-400)

#### `WritingProfileCard.tsx`

Expandable card displaying a content writing profile for a platform:
- Header: PlatformBadge + "Writing Profile" + last refreshed date
- Collapsed: Tone description (1 line) + "Tap to expand"
- Expanded sections:
  - **Tone**: Full tone description
  - **Format**: Hook style, avg length, structure notes
  - **Example Hooks**: Numbered list of top hooks (quoted, italic)
  - **Hashtags**: Strategy description + example hashtags as badges
- Footer: "Refresh Profile" button (outline)

#### `DiscoveryCountdown.tsx`

Prominent card shown on Diary tab before discovery is unlocked:
- Icon: locked/rocket icon
- Heading: "Unlock Your Content Engine"
- Subtext: "Record your journey for 7 days to activate AI content generation"
- ProgressBar: X/7 days completed
- Day labels below progress bar showing which days have entries (filled dots vs empty dots)

**Visual style:** Primary-50 background, primary-500 accent, slightly larger than regular cards.

#### `PlatformFilter.tsx`

Horizontal segmented control:
```
[ All ] [ LinkedIn ] [ Instagram ] [ X ]
```
- Selected tab: primary-500 background, white text
- Unselected: transparent background, gray-500 text
- Sticky at top of scrollable lists

---

### 2.5 Layout Components (`components/layout/`)

#### `ScreenContainer.tsx`

Standard screen wrapper:
- SafeAreaView
- Optional scroll behavior (ScrollView or static)
- Consistent horizontal padding (spacing.lg = 16px)
- Background color: gray-50

#### `HeaderBar.tsx`

Custom header bar (not default navigation header):
- Title (heading-lg, left-aligned)
- Optional right action button(s)
- Optional subtitle (body-sm, gray-500)
- Border-bottom: gray-100

#### `TabBarIcon.tsx`

Custom tab bar icon:
- Icon from chosen icon set
- Label below (label typography)
- Active: primary-500
- Inactive: gray-400
- Badge dot for notifications (optional)

---

## 3. Screen Designs

### 3.1 Auth Screens

#### Sign In (`(auth)/sign-in.tsx`)

```
┌──────────────────────────────┐
│                              │
│        [App Logo]            │
│     Founder Diaries          │
│                              │
│  ┌────────────────────────┐  │
│  │ Email                  │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ Password          [👁] │  │
│  └────────────────────────┘  │
│                              │
│  [    Sign In (primary)   ]  │
│                              │
│      Forgot password?        │
│                              │
│  ─────── or ────────         │
│                              │
│  Don't have an account?      │
│  [  Create Account (ghost) ] │
│                              │
└──────────────────────────────┘
```

#### Sign Up (`(auth)/sign-up.tsx`)

Same layout as sign in with:
- Full Name input (added above email)
- "Create Account" as primary button
- "Already have an account? Sign In" at bottom

---

### 3.2 Onboarding Screens

#### Welcome (`(onboarding)/welcome.tsx`)

```
┌──────────────────────────────┐
│                              │
│                              │
│      [Illustration:          │
│       founder writing         │
│       in a diary]            │
│                              │
│   Turn your daily founder    │
│   journey into viral content │
│                              │
│   Record your day. We'll     │
│   craft posts that match     │
│   what works on each         │
│   platform.                  │
│                              │
│                              │
│  [   Get Started (primary) ] │
│                              │
│         1 · 2 · 3 · 4       │
└──────────────────────────────┘
```

#### Industry Select (`(onboarding)/industry-select.tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│  What's your industry?       │
│  This helps us find creators │
│  in your space               │
│                              │
│  ┌─────────┐ ┌─────────┐    │
│  │  SaaS   │ │ FinTech  │    │
│  └─────────┘ └─────────┘    │
│  ┌─────────┐ ┌─────────┐    │
│  │HealthTch│ │E-commerc │    │
│  └─────────┘ └─────────┘    │
│  ┌─────────┐ ┌─────────┐    │
│  │ EdTech  │ │ AI/ML    │    │
│  └─────────┘ └─────────┘    │
│  ┌─────────┐ ┌─────────┐    │
│  │  DTC    │ │  Other   │    │
│  └─────────┘ └─────────┘    │
│                              │
│  Add niche keywords:         │
│  ┌────────────────────────┐  │
│  │ e.g., "developer tools"│  │
│  └────────────────────────┘  │
│  [chip: AI] [chip: B2B] [+] │
│                              │
│  [      Next (primary)     ] │
│         1 · ● · 3 · 4       │
└──────────────────────────────┘
```

Industry cards: `outlined` variant, `primary-100` bg + `primary-500` border when selected. Grid: 2 columns.

#### Platform Setup (`(onboarding)/platform-setup.tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│  Where do you want to post?  │
│  Select your platforms       │
│                              │
│  ┌──────────────────────────┐│
│  │ [LinkedIn logo]  LinkedIn ││
│  │ ☑ Post  ☑ Carousel       ││
│  │                     [ON] ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ [IG logo]  Instagram      ││
│  │ ☑ Post ☑ Carousel ☐ Reel ││
│  │                     [ON] ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ [X logo]  X / Twitter     ││
│  │ ☑ Tweet  ☑ Thread        ││
│  │                    [OFF] ││
│  └──────────────────────────┘│
│                              │
│  [      Next (primary)     ] │
│         1 · 2 · ● · 4       │
└──────────────────────────────┘
```

Each platform card is toggleable (ON/OFF switch). Content type checkboxes only visible when platform is ON.

#### Quota Config (`(onboarding)/quota-config.tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│  How often do you want       │
│  to post?                    │
│                              │
│  LinkedIn                    │
│  [───────●──────] 3/week     │
│                              │
│  Instagram                   │
│  [────●─────────] 2/week     │
│                              │
│  You can always change       │
│  this later in settings.     │
│                              │
│                              │
│                              │
│                              │
│  [ Start My Diary (primary)] │
│         1 · 2 · 3 · ●       │
└──────────────────────────────┘
```

Only shows sliders for active platforms. Range: 1-7 posts/week. Default: 3.

---

### 3.3 Main Tab Screens

#### Tab Bar Layout

```
┌──────────────────────────────┐
│         [Screen Content]     │
│                              │
│                              │
├──────────────────────────────┤
│  📓 Diary  📝 Content  🔍 Discover  ⚙ Settings │
└──────────────────────────────┘
```

- 4 tabs
- Active tab: primary-500 icon + label
- Inactive: gray-400 icon + label
- Tab bar height: 56px + safe area bottom inset

---

### 3.4 Diary Tab Screens

#### Diary Home (`(tabs)/diary/index.tsx`)

```
┌──────────────────────────────┐
│  My Diary                    │
│                              │
│  ┌──────────────────────────┐│
│  │     March 2026           ││
│  │  M  T  W  T  F  S  S    ││
│  │                 1  2     ││
│  │  3  4  5· 6  7· 8  9    ││
│  │  10·11·[12] 13 14 15 16 ││
│  │  17 18 19 20 21 22 23   ││
│  │  24 25 26 27 28 29 30   ││
│  │  31                      ││
│  └──────────────────────────┘│
│                              │
│  ┌ DiscoveryCountdown ──────┐│
│  │ 🔒 Unlock Content Engine ││
│  │ ███████░░░░ 5/7 days     ││
│  └──────────────────────────┘│
│                              │
│  Today's Entry               │
│  ┌ DiaryEntryCard ──────────┐│
│  │ Mar 12 · 2:30 PM    😊  ││
│  │ Had a great call with... ││
│  │ 🎤 2:45  📷 ×3    ● ││
│  └──────────────────────────┘│
│                              │
│  Yesterday                   │
│  ┌ DiaryEntryCard ──────────┐│
│  │ Mar 11 · 9:15 AM    😤  ││
│  │ Deployment broke and...  ││
│  │         📷 ×1      ● ││
│  └──────────────────────────┘│
│                              │
│                        [+]   │ ← FAB (56px, primary)
├──────────────────────────────┤
│  📓 Diary  📝 Content  ...  │
└──────────────────────────────┘
```

- DiaryCalendar at top (collapsible on scroll)
- DiscoveryCountdown below calendar (hidden after unlock)
- FlashList of DiaryEntryCards grouped by date
- FAB (floating action button) bottom-right: primary-500, "+" icon, 56px circle with shadow-lg

#### New Diary Entry (`(tabs)/diary/new.tsx`)

```
┌──────────────────────────────┐
│  ← Cancel        Save        │
│                              │
│  Wednesday, March 12         │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │  What happened today?  │  │
│  │                        │  │
│  │                        │  │
│  │                        │  │
│  │                        │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 🎤   │ │ 📷   │ │ 😊   │ │
│  │Record│ │Image │ │Mood  │ │
│  └──────┘ └──────┘ └──────┘ │
│                              │
│  [Audio waveform preview     │
│   if recorded: ▄▆█▅▃▇▅ 2:45 │
│                        ✕ ]   │
│                              │
│  [📷 img1] [📷 img2] [+]    │
│                              │
│  [ ● Energized  ○ Stressed ] │
│                              │
│  [     Save Entry (primary)] │
└──────────────────────────────┘
```

- KeyboardAvoidingView wraps the entire screen
- Text input expands to fill available space
- Action button row is fixed above keyboard
- Audio/image previews appear between actions and save button

#### Diary Entry Detail (`(tabs)/diary/[date].tsx`)

```
┌──────────────────────────────┐
│  ← Back           ✏️ Edit    │
│                              │
│  Wednesday, March 12         │
│  2:30 PM · 😊 Energized     │
│                              │
│  Had a great call with our   │
│  investor today. They loved  │
│  the new product demo and    │
│  mentioned they're sharing   │
│  it with 3 other portfolio   │
│  companies...                │
│                              │
│  🎤 Audio Recording          │
│  ┌──────────────────────────┐│
│  │ ▶ ▄▆█▅▃▇▅▃▆█▅ 4:32     ││
│  │ ✅ Transcribed            ││
│  └──────────────────────────┘│
│                              │
│  📷 Images                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │      │ │      │ │      │ │
│  │ img1 │ │ img2 │ │ img3 │ │
│  │      │ │      │ │      │ │
│  └──────┘ └──────┘ └──────┘ │
│                              │
│  🏷️ Tags                     │
│  [fundraising] [investors]   │
│  [product-demo]              │
│                              │
│  📝 Generated Content        │
│  ┌ PostCard (LinkedIn) ─────┐│
│  │ How a 10-minute demo     ││
│  │ changed everything...    ││
│  └──────────────────────────┘│
│  ┌ PostCard (X Thread) ─────┐│
│  │ Just got off a call with ││
│  │ our investor...          ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

- Scrollable full detail view
- Audio playback inline
- Image gallery (horizontal scroll, tap to full-screen)
- Tags as badges
- Related generated posts section at bottom

---

### 3.5 Content Tab Screens

#### Content Dashboard (`(tabs)/content/index.tsx`)

```
┌──────────────────────────────┐
│  Content                     │
│                              │
│  This Week's Progress        │
│  ┌ WeeklyQuotaProgress ─────┐│
│  │ 🔵 LinkedIn  ████░░ 3/5  ││
│  │ 🟣 Instagram ██░░░░ 1/3  ││
│  │ ⚫ X          █░░░░ 1/4  ││
│  └──────────────────────────┘│
│                              │
│  [ All ] [ LinkedIn ] [IG] [X]│ ← PlatformFilter
│                              │
│  Today's Posts               │
│  ┌ PostCard ────────────────┐│
│  │ 🔵 LinkedIn · Post  Draft││
│  │ The 10-Minute Demo That  ││
│  │ Changed Everything       ││
│  │ Had an incredible call...││
│  │               [🖼️ img]   ││
│  └──────────────────────────┘│
│  ┌ PostCard ────────────────┐│
│  │ 🟣 Instagram · Carousel  ││
│  │ 5 Things I Learned From  ││
│  │ Our Investor Meeting     ││
│  │ Slide 1: The Setup...    ││
│  │               [🖼️ img]   ││
│  └──────────────────────────┘│
│  ┌ PostCard ────────────────┐│
│  │ ⚫ X · Thread       Draft││
│  │ Just got off a call that ││
│  │ made my entire month.    ││
│  └──────────────────────────┘│
│                              │
│  [   View Queue (outline)  ] │
├──────────────────────────────┤
│  📓 Diary  📝 Content  ...  │
└──────────────────────────────┘
```

#### Post Detail (`(tabs)/content/[postId].tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│  🔵 LinkedIn · Post · Draft  │
│                              │
│  The 10-Minute Demo That     │
│  Changed Everything          │
│                              │
│  ┌──────────────────────────┐│
│  │                          ││
│  │  [Generated Image        ││
│  │   Full Width Preview]    ││
│  │                          ││
│  └──────────────────────────┘│
│  [Regenerate Image] [Use My] │
│                              │
│  ┌────────────────────────┐  │
│  │ Yesterday, I had a 10- │  │
│  │ minute demo call that   │  │
│  │ completely shifted our  │  │
│  │ trajectory.             │  │
│  │                         │  │
│  │ Our lead investor had   │  │
│  │ been on the fence about │  │
│  │ our Series A...         │  │
│  │                         │  │
│  │ 3 things that made the  │  │
│  │ difference:             │  │
│  │ 1. We showed, didn't    │  │
│  │    tell                 │  │
│  │ 2. ...                  │  │
│  │                         │  │
│  │ #startup #fundraising   │  │
│  │              1,247 chars│  │
│  └────────────────────────┘  │
│                              │
│  From diary: Mar 12, 2026    │
│                              │
├──────────────────────────────┤
│ [Reject]   [Edit]  [Approve] │ ← PostActionBar
└──────────────────────────────┘
```

For **carousels**: replace text area with CarouselPreview (swipeable slides).

For **threads**: replace text area with ThreadPreview (connected tweets).

#### Content Queue (`(tabs)/content/queue.tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│  Content Queue               │
│                              │
│  [ All ] [ LinkedIn ] [IG] [X]│
│                              │
│  Approved                    │
│  ┌ PostCard (compact) ──────┐│
│  │ 🔵 LinkedIn · Post  ✅   ││
│  │ The 10-Minute Demo...    ││
│  └──────────────────────────┘│
│  ┌ PostCard (compact) ──────┐│
│  │ 🟣 IG · Carousel    ✅   ││
│  │ 5 Things I Learned...    ││
│  └──────────────────────────┘│
│                              │
│  Drafts                      │
│  ┌ PostCard (compact) ──────┐│
│  │ ⚫ X · Thread       📝   ││
│  │ Just got off a call...   ││
│  └──────────────────────────┘│
│                              │
│  Rejected                    │
│  ┌ PostCard (compact) ──────┐│
│  │ 🔵 LinkedIn · Post  ❌   ││
│  │ When I started my...     ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

Grouped by status. Compact PostCard variant (smaller, no image thumbnail).

---

### 3.6 Discover Tab Screens

#### Discovery Dashboard (`(tabs)/discover/index.tsx`)

**Before unlock:**
```
┌──────────────────────────────┐
│  Discover                    │
│                              │
│                              │
│      [Locked illustration]   │
│                              │
│  Record your journey for     │
│  7 days to unlock discovery  │
│                              │
│  ████████░░░░ 5/7 days       │
│                              │
│  Go to diary →               │
│                              │
└──────────────────────────────┘
```

**After unlock:**
```
┌──────────────────────────────┐
│  Discover              🔄    │
│                              │
│  [ All ] [ LinkedIn ] [IG] [X]│
│                              │
│  [View Writing Profiles →]   │
│                              │
│  LinkedIn Creators           │
│  ┌ CreatorCard ─────────────┐│
│  │ [👤] Sarah Chen          ││
│  │      @sarahchen · 45K    ││
│  │      SaaS growth expert  ││
│  │                  92% ██  ││
│  └──────────────────────────┘│
│  ┌ CreatorCard ─────────────┐│
│  │ [👤] Alex Rivera         ││
│  │      @arivera · 120K     ││
│  │      B2B founder stories ││
│  │                  88% ██  ││
│  └──────────────────────────┘│
│                              │
│  Instagram Creators          │
│  ┌ CreatorCard ─────────────┐│
│  │ ...                      ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

#### Creator Detail (`(tabs)/discover/[creatorId].tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│  [👤 large avatar]           │
│  Sarah Chen                  │
│  @sarahchen · 🔵 LinkedIn   │
│  45,000 followers            │
│  Relevance: 92%              │
│                              │
│  SaaS growth strategist.     │
│  Ex-Stripe. Building in      │
│  public.                     │
│                              │
│  Top Performing Posts        │
│  ┌ ContentSampleCard ───────┐│
│  │ "I spent $0 on ads and   ││
│  │ grew to $1M ARR. Here's  ││
│  │ exactly how..."          ││
│  │ ❤️ 2.4K  💬 189  🔄 412  ││
│  │ Score: 9.2 · Feb 15      ││
│  └──────────────────────────┘│
│  ┌ ContentSampleCard ───────┐│
│  │ "Stop building features  ││
│  │ nobody asked for..."     ││
│  │ ❤️ 1.8K  💬 142  🔄 298  ││
│  │ Score: 8.7 · Jan 28      ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

#### Writing Profiles (`(tabs)/discover/profiles.tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│  Writing Profiles            │
│                              │
│  ┌ WritingProfileCard ──────┐│
│  │ 🔵 LinkedIn Profile      ││
│  │ Last refreshed: Mar 10   ││
│  │                          ││
│  │ Tone: Conversational,    ││
│  │ data-driven, authentic   ││
│  │                          ││
│  │ ▼ Format Patterns        ││
│  │   Hook: Question-based   ││
│  │   Avg length: 1,200 char ││
│  │   Uses line breaks: Yes  ││
│  │   Uses bullet points: Yes││
│  │                          ││
│  │ ▼ Top Hooks              ││
│  │   1. "I spent $0 on..."  ││
│  │   2. "Nobody tells you..." ││
│  │   3. "The hardest part..." ││
│  │                          ││
│  │ ▼ Hashtag Strategy       ││
│  │   5 tags: 2 broad + 3    ││
│  │   niche                  ││
│  │                          ││
│  │ [  Refresh Profile  ]    ││
│  └──────────────────────────┘│
│                              │
│  ┌ WritingProfileCard ──────┐│
│  │ 🟣 Instagram Profile     ││
│  │ ...                      ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

---

### 3.7 Settings Screens

#### Settings Home (`(tabs)/settings/index.tsx`)

```
┌──────────────────────────────┐
│  Settings                    │
│                              │
│  ┌──────────────────────────┐│
│  │ [👤] Aditya Kumar       ││
│  │      aditya@example.com  ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ 📱 Platforms & Quotas   →││
│  ├──────────────────────────┤│
│  │ 👤 Account              →││
│  ├──────────────────────────┤│
│  │ 📄 Privacy Policy       →││
│  ├──────────────────────────┤│
│  │ 📄 Terms of Service     →││
│  ├──────────────────────────┤│
│  │ ℹ️  About                →││
│  └──────────────────────────┘│
│                              │
│  [  Sign Out (ghost/danger)] │
│                              │
│  v1.0.0                      │
└──────────────────────────────┘
```

#### Platform Settings (`(tabs)/settings/platforms.tsx`)

```
┌──────────────────────────────┐
│  ← Back                      │
│  Platforms & Quotas          │
│                              │
│  ┌──────────────────────────┐│
│  │ 🔵 LinkedIn        [ON] ││
│  │                          ││
│  │ Weekly quota:            ││
│  │ [──────●────] 3/week     ││
│  │                          ││
│  │ Content types:           ││
│  │ ☑ Post  ☑ Carousel      ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ 🟣 Instagram       [ON] ││
│  │                          ││
│  │ Weekly quota:            ││
│  │ [───●───────] 2/week     ││
│  │                          ││
│  │ Content types:           ││
│  │ ☑ Post ☑ Carousel ☐ Reel││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ ⚫ X / Twitter    [OFF] ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

---

### 3.8 Modal Screens

#### Audio Recorder (`(modals)/audio-recorder.tsx`)

```
┌──────────────────────────────┐
│  ✕ Close                     │
│                              │
│  Record your thoughts        │
│                              │
│                              │
│       ▄▆█▅▃▇▅▃▆█▅▃▇         │
│       [waveform animation]   │
│                              │
│          4:32                 │
│                              │
│                              │
│     [⏸]   [ ⏹ STOP ]       │
│                              │
│  ─────────────────────       │
│  or                          │
│                              │
│  [   🎤 Start Recording   ] │
│                              │
└──────────────────────────────┘
```

- Presented as a bottom sheet (snap points: 50%, 75%)
- Record button: large circle (72px), red when recording with pulse animation
- Waveform: real-time audio level visualization
- After stop: preview playback with play/pause button + [Discard] [Save] buttons

#### Post Preview (`(modals)/post-preview.tsx`)

Renders the post as it would appear on the target platform:
- **LinkedIn**: mimics LinkedIn post card with profile header, post text, image, reaction bar
- **Instagram**: mimics Instagram post with profile header, image, caption, like/comment row
- **X**: mimics tweet or thread with profile pic, text, engagement row

Presented as a full-screen modal with "Close" button in top-left.

---

## 4. Navigation Structure

```
Root Layout (_layout.tsx)
├── (auth) - Stack Navigator
│   ├── sign-in
│   ├── sign-up
│   └── forgot-password
│
├── (onboarding) - Stack Navigator
│   ├── welcome
│   ├── industry-select
│   ├── platform-setup
│   └── quota-config
│
├── (tabs) - Bottom Tab Navigator
│   ├── diary/ - Stack Navigator
│   │   ├── index (calendar + list)
│   │   ├── new (create entry)
│   │   └── [date] (entry detail)
│   │
│   ├── content/ - Stack Navigator
│   │   ├── index (dashboard)
│   │   ├── [postId] (post detail)
│   │   └── queue (scheduled posts)
│   │
│   ├── discover/ - Stack Navigator
│   │   ├── index (creator list)
│   │   ├── [creatorId] (creator detail)
│   │   └── profiles (writing profiles)
│   │
│   └── settings/ - Stack Navigator
│       ├── index (settings home)
│       ├── platforms (platform config)
│       └── account (account settings)
│
└── (modals) - Modal Group
    ├── audio-recorder
    ├── image-picker
    ├── post-preview
    └── content-type-select
```

**Auth Gate Logic (root `_layout.tsx`):**
```
if (no session) → redirect to (auth)/sign-in
else if (!profile.onboarding_completed) → redirect to (onboarding)/welcome
else → show (tabs)
```

---

## 5. Animations and Interactions

### Micro-interactions
- **FAB press**: Scale down to 0.9 on press, bounce back
- **Card press**: Subtle opacity reduction (0.95)
- **Tab switch**: Smooth cross-fade between tab content
- **Pull to refresh**: Custom loading animation (diary icon spinning)

### Transitions
- **Screen push**: Standard iOS/Android stack push (right-to-left on iOS)
- **Modal present**: Bottom-to-top slide with dim overlay
- **Bottom sheet**: Gesture-driven with spring physics (react-native-reanimated)

### Loading States
- **Skeleton screens**: Gray pulsing rectangles matching card layouts
- **Image loading**: Blur-up technique with `expo-image` (blurhash placeholder)
- **Transcription**: Shimmer animation on TranscriptionStatus while processing
- **Content generation**: Typing animation dots (...) on PostCard while generating

### Gesture Handling
- **Calendar**: Swipe left/right to change months
- **Carousel preview**: Swipe left/right to navigate slides
- **Bottom sheet**: Swipe down to dismiss
- **Post queue**: Long press to reorder (future)

---

## 6. Responsive Behavior

The app targets phone screens only (no tablet optimization in v1).

| Element | Portrait | Consideration |
|---------|----------|---------------|
| Calendar | Full width, 6 rows | Compact month view |
| Cards | Full width - 32px padding | Single column |
| Image grid | 3-up thumbnails | Fixed 3 columns |
| Carousel preview | Full width | Aspect ratio preserved |
| Platform filter | Horizontal scroll if >4 items | Scrollable |

**Safe areas:** All screens use `SafeAreaView` for notch/dynamic island handling.

**Keyboard:** `KeyboardAvoidingView` on all input screens. Diary entry form scrolls to keep input visible.

---

## 7. Accessibility

- All interactive elements have `accessibilityLabel` and `accessibilityRole`
- Minimum touch target: 44x44px
- Color contrast: WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- Images have `accessibilityLabel` descriptions
- Audio recorder: haptic feedback on record start/stop
- Screen reader announces transcription status changes
- Platform badges include platform name in accessibility label (not just color)
- Focus order follows visual layout (top to bottom, left to right)

---

## 8. Error States

| Scenario | Display |
|----------|---------|
| No diary entries yet | EmptyState: diary icon + "Start recording your first entry" + [Create Entry] button |
| No content generated yet | EmptyState: sparkle icon + "Your first posts will appear here after 7 days of diary entries" |
| Discovery locked | DiscoveryCountdown with progress |
| No creators found | EmptyState: search icon + "No creators found in your niche. Try updating your keywords." + [Update Keywords] |
| Transcription failed | TranscriptionStatus error + [Retry] button |
| Content generation failed | PostCard with error badge + [Retry Generation] button |
| Network offline | Subtle banner at top: "Offline — diary entries will sync when connected" (warning color) |
| Image generation failed | Placeholder image with broken-image icon + [Retry] button |
