export type Platform = "linkedin" | "instagram" | "x";
export type ContentType = "post" | "carousel" | "thread" | "reel_caption";
export type PostStatus = "draft" | "approved" | "scheduled" | "posted" | "rejected";
export type TranscriptionStatus = "pending" | "processing" | "completed" | "failed";
export type JobType =
  | "transcription"
  | "content_generation"
  | "image_generation"
  | "scraping"
  | "profile_analysis";
export type QueueStatus = "pending" | "processing" | "completed" | "failed" | "retrying";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  industry: string | null;
  niche_keywords: string[];
  onboarding_completed: boolean;
  diary_start_date: string | null;
  discovery_unlocked: boolean;
  timezone: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  text_content: string | null;
  raw_audio_url: string | null;
  transcription_text: string | null;
  transcription_status: TranscriptionStatus | null;
  mood: string | null;
  tags: string[];
  local_id: string | null;
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
  status: PostStatus;
}

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

export interface ContentWritingProfile {
  id: string;
  user_id: string;
  platform: Platform;
  tone_description: string | null;
  format_patterns: Record<string, unknown> | null;
  vocabulary_notes: string | null;
  structural_patterns: Record<string, unknown> | null;
  example_hooks: string[];
  hashtag_strategy: Record<string, unknown> | null;
}
