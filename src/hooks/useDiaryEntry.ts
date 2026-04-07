import { useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { usePostHog } from 'posthog-react-native';
import { getDatabase } from '@/lib/sqlite';
import { logger } from '@/lib/logger';
import { useDiaryStore, type LocalDiaryEntry, type LocalDiaryImage } from '@/stores/diaryStore';
import { addToSyncQueue } from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';

export interface ImageInput {
  local_id: string;
  local_uri: string;
}

export interface CreateEntryData {
  entry_date: string;
  text_content?: string;
  audio_local_uri?: string;
  mood?: string;
  images?: ImageInput[];
}

export interface UpdateEntryData {
  text_content?: string;
  audio_local_uri?: string;
  mood?: string;
}

export interface UseDiaryEntryReturn {
  entries: LocalDiaryEntry[];
  allEntryDates: Set<string>;
  createEntry: (data: CreateEntryData) => Promise<LocalDiaryEntry>;
  updateEntry: (id: string, data: UpdateEntryData) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export function useDiaryEntry(): UseDiaryEntryReturn {
  const {
    selectedDate,
    getEntriesForDate,
    getEntryDates,
    addEntry,
    updateEntry: storeUpdate,
    deleteEntry: storeDelete,
  } = useDiaryStore();

  const { session } = useAuthStore();
  const posthog = usePostHog();

  const entries = getEntriesForDate(selectedDate);
  const allEntryDates = getEntryDates();

  const createEntry = useCallback(
    async (data: CreateEntryData): Promise<LocalDiaryEntry> => {
      const localId = Crypto.randomUUID();
      const now = new Date().toISOString();
      const userId = session?.user.id;

      const db = getDatabase();
      await db.runAsync(
        `INSERT INTO diary_entries
           (local_id, entry_date, text_content, audio_local_uri, mood, sync_status, remote_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, ?)`,
        [
          localId,
          data.entry_date,
          data.text_content ?? null,
          data.audio_local_uri ?? null,
          data.mood ?? null,
          now,
          now,
        ],
      );

      // Build local images from input
      const localImages: LocalDiaryImage[] = (data.images ?? []).map((img) => ({
        local_id: img.local_id,
        diary_local_id: localId,
        local_uri: img.local_uri,
        sync_status: 'pending' as const,
        remote_id: null,
        created_at: now,
      }));

      // Write images to SQLite
      for (const img of localImages) {
        await db.runAsync(
          `INSERT INTO diary_images
             (local_id, diary_local_id, local_uri, sync_status, remote_id, created_at)
           VALUES (?, ?, ?, 'pending', NULL, ?)`,
          [img.local_id, localId, img.local_uri, now],
        );
      }

      const newEntry: LocalDiaryEntry = {
        local_id: localId,
        entry_date: data.entry_date,
        text_content: data.text_content ?? null,
        audio_local_uri: data.audio_local_uri ?? null,
        mood: data.mood ?? null,
        sync_status: 'pending',
        remote_id: null,
        created_at: now,
        updated_at: now,
        images: localImages,
      };

      addEntry(newEntry);

      await addToSyncQueue('create_entry', {
        localId,
        entryDate: data.entry_date,
        textContent: data.text_content ?? '',
        userId,
      });

      // Queue image uploads
      for (const img of localImages) {
        await addToSyncQueue('upload_image', {
          imageLocalUri: img.local_uri,
          localImageId: img.local_id,
          entryId: localId,
          userId,
        });
      }

      logger.info('Diary entry created', { localId, imageCount: localImages.length });

      posthog.capture('diary_entry_created', {
        has_text: Boolean(data.text_content),
        has_audio: Boolean(data.audio_local_uri),
        image_count: localImages.length,
        mood: data.mood ?? null,
        // NO content, NO user ID, NO email — PII policy
      });

      return newEntry;
    },
    [addEntry, session, posthog],
  );

  const updateEntry = useCallback(
    async (id: string, data: UpdateEntryData): Promise<void> => {
      const now = new Date().toISOString();

      const db = getDatabase();
      await db.runAsync(
        `UPDATE diary_entries
         SET text_content = COALESCE(?, text_content),
             audio_local_uri = COALESCE(?, audio_local_uri),
             mood = COALESCE(?, mood),
             sync_status = 'pending',
             updated_at = ?
         WHERE local_id = ?`,
        [
          data.text_content ?? null,
          data.audio_local_uri ?? null,
          data.mood ?? null,
          now,
          id,
        ],
      );

      storeUpdate(id, { ...data, sync_status: 'pending', updated_at: now });

      // Get entry_date from store for sync queue (required by processQueueItem)
      const entryDate = useDiaryStore.getState().entries.get(id)?.entry_date;

      await addToSyncQueue('update_entry', {
        localId: id,
        entryDate: entryDate,
        textContent: data.text_content,
        userId: session?.user.id,
      });

      logger.info('Diary entry updated', { id });
    },
    [storeUpdate, session],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      const db = getDatabase();
      await db.runAsync(`DELETE FROM diary_entries WHERE local_id = ?`, [id]);
      storeDelete(id);
      logger.info('Diary entry deleted', { id });
    },
    [storeDelete],
  );

  return { entries, allEntryDates, createEntry, updateEntry, deleteEntry };
}
