import type { Platform, ContentType } from '../types/database';

// Audio / media limits
export const MAX_AUDIO_DURATION_MS = 600_000; // 10 minutes
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGES_PER_ENTRY = 5;

// Discovery / quota
export const DISCOVERY_DAYS_REQUIRED = 7;
export const DEFAULT_WEEKLY_QUOTA = 3;

// Supported platforms
export const PLATFORMS: Platform[] = ['linkedin', 'instagram', 'x'];

// Content types available per platform
export const PLATFORM_CONTENT_TYPES: Record<Platform, ContentType[]> = {
  linkedin: ['post', 'carousel'],
  instagram: ['post', 'carousel', 'reel_caption'],
  x: ['post', 'thread'],
};

// Mood options
export interface MoodOption {
  value: string;
  label: string;
  emoji: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'energized', label: 'Energized', emoji: '⚡' },
  { value: 'productive', label: 'Productive', emoji: '🎯' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'stressed', label: 'Stressed', emoji: '😰' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
];

// Industry options
export interface IndustryOption {
  value: string;
  label: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: 'saas', label: 'SaaS' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'aiml', label: 'AI/ML' },
  { value: 'dtc', label: 'DTC' },
  { value: 'other', label: 'Other' },
];
