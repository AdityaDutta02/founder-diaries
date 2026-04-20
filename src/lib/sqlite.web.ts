import { logger } from './logger';

// Web stub — SQLite is not available on web platform.
// All diary CRUD on web goes through Supabase directly.

export async function initDatabase(): Promise<void> {
  logger.debug('SQLite not available on web — using Supabase direct');
}

export function getDatabase(): never {
  throw new Error('SQLite is not available on web platform. Use Supabase directly.');
}
