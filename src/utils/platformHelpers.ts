import type { Platform, ContentType } from '@/types/database';
import type { ThemeColors } from '@/theme/colors';

/**
 * Returns the brand hex color for a given platform.
 * Requires the theme colors object so it respects light/dark mode.
 */
export function getPlatformColor(platform: Platform, colors: ThemeColors): string {
  return colors.platform[platform];
}

/**
 * Returns an emoji icon representing the platform.
 */
export function getPlatformIcon(platform: Platform): string {
  const icons: Record<Platform, string> = {
    linkedin: '💼',
    instagram: '📸',
    x: '🐦',
  };
  return icons[platform];
}

/**
 * Returns an emoji icon representing a content type.
 */
export function getContentTypeIcon(type: ContentType): string {
  const icons: Record<ContentType, string> = {
    post: '📄',
    carousel: '🎠',
    thread: '🧵',
    reel_caption: '🎬',
  };
  return icons[type];
}

/**
 * Returns the maximum character count allowed for a platform + content type combination.
 */
export function getMaxChars(platform: Platform, contentType: ContentType): number {
  const limits: Record<Platform, Partial<Record<ContentType, number>>> = {
    linkedin: {
      post: 3000,
      carousel: 1300,
    },
    instagram: {
      post: 2200,
      carousel: 2200,
      reel_caption: 2200,
    },
    x: {
      post: 280,
      thread: 280,
    },
  };

  return limits[platform][contentType] ?? 3000;
}

/**
 * Returns the display name for a platform.
 */
export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    x: 'X (Twitter)',
  };
  return labels[platform];
}
