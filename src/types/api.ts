import type { Platform, ContentType, SyncStatus } from './database';

// ─── Edge Function: transcribe-audio ───────────────────────────────────────

export interface TranscribeRequest {
  diaryEntryId: string;
  audioStoragePath: string;
}

export interface TranscribeResponse {
  success: boolean;
  transcriptionText: string;
}

// ─── Edge Function: generate-content ───────────────────────────────────────

export interface GenerateContentRequest {
  userId: string;
  diaryEntryId: string;
  platform: Platform;
  contentType: ContentType;
}

export interface GenerateContentResponse {
  success: boolean;
  postId: string;
}

// ─── Edge Function: generate-image ─────────────────────────────────────────

export interface GenerateImageRequest {
  postId: string;
  imagePrompt: string;
  aspectRatio: '1:1' | '4:5' | '16:9';
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
}

// ─── Edge Function: scrape-creators ────────────────────────────────────────

export interface ScrapeCreatorsRequest {
  userId: string;
  platforms: Platform[];
  nicheKeywords: string[];
  industry: string;
}

export interface ScrapeCreatorsResponse {
  success: boolean;
  creatorsScraped: number;
}

// ─── Edge Function: analyze-creators ───────────────────────────────────────

export interface AnalyzeCreatorsRequest {
  userId: string;
  platform: Platform;
}

export interface AnalyzeCreatorsResponse {
  success: boolean;
  profileGenerated: boolean;
}

// ─── Edge Function: sync-diary ─────────────────────────────────────────────

export interface SyncDiaryEntryPayload {
  localId: string;
  entryDate: string;
  textContent: string;
  audioStoragePath?: string;
  imageStoragePaths?: string[];
}

export interface SyncDiaryRequest {
  entries: SyncDiaryEntryPayload[];
}

export interface SyncDiaryResponseEntry {
  localId: string;
  remoteId: string;
  syncStatus: SyncStatus;
}

export interface SyncDiaryResponse {
  success: boolean;
  synced: SyncDiaryResponseEntry[];
  discoveryUnlocked: boolean;
}
