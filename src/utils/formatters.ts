/**
 * Formats a follower count as a human-readable abbreviated string.
 * Examples: 45000 → "45K", 1200000 → "1.2M", 999 → "999"
 */
export function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    return `${value % 1 === 0 ? String(value) : value.toFixed(1)}M`;
  }
  if (count >= 1_000) {
    const value = count / 1_000;
    return `${value % 1 === 0 ? String(value) : value.toFixed(1)}K`;
  }
  return String(count);
}

/**
 * Formats a duration in seconds as "M:SS" (e.g., 272 → "4:32").
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(minutes)}:${String(secs).padStart(2, '0')}`;
}

/**
 * Truncates text at maxLength characters, appending "..." if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Formats a character count display string (e.g., "1,247 / 3,000").
 */
export function formatCharCount(current: number, max: number): string {
  const formatNumber = (n: number): string =>
    n.toLocaleString('en-US');
  return `${formatNumber(current)} / ${formatNumber(max)}`;
}
