import type { CreatorProfile, CreatorContentSample, ContentWritingProfile } from './database';

// ─── Composite / display types ──────────────────────────────────────────────

export interface CreatorWithSamples {
  creator: CreatorProfile;
  samples: CreatorContentSample[];
}

export interface WritingProfileDisplay {
  profile: ContentWritingProfile;
  /** Human-readable date string, e.g. "Mar 10, 2026" */
  lastRefreshedFormatted: string;
  /** Whether this profile has all required fields populated */
  isComplete: boolean;
}
