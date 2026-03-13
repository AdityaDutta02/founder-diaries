import type { Platform, ContentType } from '@/types/database';
import { getMaxChars } from './platformHelpers';

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface PostContentValidationResult extends ValidationResult {
  charCount: number;
}

/**
 * Validates an email address format.
 */
export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Validates a password against minimum security requirements.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates post content against platform character limits.
 */
export function validatePostContent(
  text: string,
  platform: Platform,
  contentType: ContentType,
): PostContentValidationResult {
  const charCount = text.length;
  const maxChars = getMaxChars(platform, contentType);

  if (!text.trim()) {
    return { valid: false, message: 'Post content cannot be empty', charCount };
  }

  if (charCount > maxChars) {
    return {
      valid: false,
      message: `Content exceeds the ${String(maxChars)}-character limit for ${platform}`,
      charCount,
    };
  }

  return { valid: true, message: '', charCount };
}
