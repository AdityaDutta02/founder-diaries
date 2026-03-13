// Re-export the shared JSONB shape types defined in database.ts for convenience.
export type { CarouselSlide, ThreadTweet, FormatPatterns, StructuralPatterns, HashtagStrategy } from './database';

// ─── Content generation output types ───────────────────────────────────────

export interface LinkedInPostOutput {
  title: string;
  hookLine: string;
  bodyText: string;
  hashtags: string[];
  imagePrompt: string;
  estimatedReadTime: string;
}

export interface CarouselOutput {
  title: string;
  caption: string;
  slides: Array<{
    slideNumber: number;
    heading: string;
    bodyText: string;
    imagePrompt: string;
  }>;
  hashtags: string[];
}

export interface ThreadOutput {
  title: string;
  tweets: Array<{
    order: number;
    text: string;
  }>;
  imagePrompt: string;
}

export interface SinglePostOutput {
  title: string;
  bodyText: string;
  hashtags: string[];
  imagePrompt: string;
}

// ─── Writing profile display types (for UI rendering) ──────────────────────

export interface WritingProfileDisplay {
  platform: string;
  toneDescription: string;
  formatPatterns: {
    hookStyle: string;
    averageLength: number;
    usesLineBreaks: boolean;
    usesEmojis: boolean;
    paragraphCount: number;
    usesBulletPoints: boolean;
  };
  vocabularyNotes: string;
  structuralPatterns: {
    primaryStructure: string;
    secondaryStructure: string;
    callToActionStyle: string;
  };
  exampleHooks: string[];
  hashtagStrategy: {
    averageCount: number;
    broadToNicheRatio: string;
    exampleHashtags: string[];
  };
  lastRefreshed: string; // ISO datetime string
}
