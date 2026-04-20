import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { logger } from './logger';

const DATABASE_NAME = 'founder_diaries.db';

let database: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    logger.debug('SQLite not available on web — using Supabase direct');
    return;
  }

  database = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS diary_entries (
      local_id TEXT PRIMARY KEY,
      entry_date TEXT NOT NULL,
      text_content TEXT,
      audio_local_uri TEXT,
      mood TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      remote_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diary_images (
      local_id TEXT PRIMARY KEY,
      diary_local_id TEXT NOT NULL REFERENCES diary_entries(local_id) ON DELETE CASCADE,
      local_uri TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      remote_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  logger.info('SQLite database initialized', { database: DATABASE_NAME });
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (Platform.OS === 'web') {
    throw new Error('SQLite is not available on web platform. Use Supabase directly.');
  }
  if (database === null) {
    throw new Error(
      'Database not initialized. Call initDatabase() before getDatabase().',
    );
  }
  return database;
}
