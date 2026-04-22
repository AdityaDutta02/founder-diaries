// Shared union types
export type Platform = 'linkedin' | 'instagram' | 'x';
export type ContentType = 'post' | 'carousel' | 'thread' | 'reel_caption';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'posted' | 'rejected';
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type JobType =
  | 'transcription'
  | 'content_generation'
  | 'image_generation'
  | 'scraping'
  | 'profile_analysis';
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

// ─── profiles ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  industry: string | null;
  niche_keywords: string[] | null;
  onboarding_completed: boolean;
  diary_start_date: string | null;
  discovery_unlocked: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// ─── diary_entries ─────────────────────────────────────────────────────────

export interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  text_content: string | null;
  raw_audio_url: string | null;
  transcription_text: string | null;
  transcription_status: TranscriptionStatus | null;
  mood: string | null;
  tags: string[] | null;
  local_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── diary_images ──────────────────────────────────────────────────────────

export interface DiaryImage {
  id: string;
  diary_entry_id: string;
  user_id: string;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  used_in_posts: boolean;
  created_at: string;
}

// ─── platform_configs ──────────────────────────────────────────────────────

export interface PlatformConfig {
  id: string;
  user_id: string;
  platform: Platform;
  weekly_post_quota: number;
  active: boolean;
  preferred_content_types: ContentType[] | null;
  posting_times: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ─── creator_profiles ──────────────────────────────────────────────────────

export interface CreatorProfile {
  id: string;
  user_id: string;
  platform: Platform;
  creator_handle: string;
  creator_name: string | null;
  profile_url: string | null;
  follower_count: number | null;
  bio: string | null;
  scraped_at: string;
  relevance_score: number | null;
}

// ─── creator_content_samples ───────────────────────────────────────────────

export interface CreatorContentSample {
  id: string;
  creator_profile_id: string;
  platform: Platform;
  content_text: string;
  content_type: ContentType | 'story' | null;
  engagement_score: number | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  posted_at: string | null;
  scraped_at: string;
}

// ─── content_writing_profiles ──────────────────────────────────────────────

export interface FormatPatterns {
  hookStyle: string;
  averageLength: number;
  usesLineBreaks: boolean;
  usesEmojis: boolean;
  paragraphCount: number;
  usesBulletPoints: boolean;
}

export interface StructuralPatterns {
  primaryStructure: string;
  secondaryStructure: string;
  callToActionStyle: string;
}

export interface HashtagStrategy {
  averageCount: number;
  broadToNicheRatio: string;
  exampleHashtags: string[];
}

export interface ContentWritingProfile {
  id: string;
  user_id: string;
  platform: Platform;
  tone_description: string | null;
  format_patterns: FormatPatterns | null;
  vocabulary_notes: string | null;
  structural_patterns: StructuralPatterns | null;
  example_hooks: string[] | null;
  hashtag_strategy: HashtagStrategy | null;
  generated_by_model: string | null;
  last_refreshed: string;
  created_at: string;
}

// ─── generated_posts ───────────────────────────────────────────────────────

export interface CarouselSlide {
  slideNumber: number;
  heading: string;
  bodyText: string;
  imagePrompt: string;
}

export interface ThreadTweet {
  order: number;
  text: string;
}

export interface GeneratedPost {
  id: string;
  user_id: string;
  diary_entry_id: string | null;
  platform: Platform;
  content_type: ContentType;
  title: string | null;
  body_text: string;
  carousel_slides: CarouselSlide[] | null;
  thread_tweets: ThreadTweet[] | null;
  image_prompt: string | null;
  generated_image_url: string | null;
  user_image_id: string | null;
  status: PostStatus;
  scheduled_for: string | null;
  generation_metadata: Record<string, unknown> | null;
  user_edits: string | null;
  created_at: string;
  updated_at: string;
}

// ─── generation_queue ──────────────────────────────────────────────────────

export interface GenerationQueue {
  id: string;
  user_id: string;
  job_type: JobType;
  status: QueueStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// ─── user_activity_log ─────────────────────────────────────────────────────

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── user_writing_instructions ────────────────────────────────────────────

export interface UserWritingInstruction {
  id: string;
  user_id: string;
  platform: Platform;
  instructions: string;
  created_at: string;
  updated_at: string;
}
