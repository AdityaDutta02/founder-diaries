import {
  format,
  isToday as dateFnsIsToday,
  isYesterday as dateFnsIsYesterday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

/**
 * Formats a date as "Wednesday, March 12".
 */
export function formatEntryDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE, MMMM d');
}

/**
 * Formats a date as "2:30 PM".
 */
export function formatEntryTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'h:mm a');
}

/**
 * Returns "Today", "Yesterday", or "Mar 10" for older dates.
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (dateFnsIsToday(d)) return 'Today';
  if (dateFnsIsYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

/**
 * Returns the ISO date string range for the current week (Sunday to Saturday).
 */
export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 0 });
  const end = endOfWeek(now, { weekStartsOn: 0 });
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Returns true if the given date is today.
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFnsIsToday(d);
}

/**
 * Returns true if the given date was yesterday.
 */
export function isYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFnsIsYesterday(d);
}
