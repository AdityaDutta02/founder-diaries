import type { SyncStatus } from './database';

// ─── SQLite-backed local types ─────────────────────────────────────────────

export interface LocalDiaryEntry {
  local_id: string;
  entry_date: string; // ISO date string: "2026-03-12"
  text_content: string | null;
  audio_local_uri: string | null;
  mood: string | null;
  sync_status: SyncStatus;
  remote_id: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface LocalDiaryImage {
  local_id: string;
  diary_local_id: string;
  local_uri: string;
  sync_status: SyncStatus;
  remote_id: string | null;
  created_at: string; // ISO datetime string
}

export interface SyncQueueItem {
  id: number;
  operation: 'create_entry' | 'upload_audio' | 'upload_image' | 'update_entry';
  payload: string; // JSON string
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  created_at: string; // ISO datetime string
}

// ─── Form types ─────────────────────────────────────────────────────────────

export interface DiaryFormData {
  text_content: string;
  audio_local_uri: string | null;
  image_local_uris: string[];
  mood: string | null;
  entry_date: string; // ISO date string
}
