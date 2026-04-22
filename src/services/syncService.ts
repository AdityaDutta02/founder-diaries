import { getDatabase } from '@/lib/sqlite';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { SyncDiaryRequest, SyncDiaryResponseEntry } from '@/types/api';

export type SyncOperation = 'create_entry' | 'update_entry' | 'upload_audio' | 'upload_image';

export interface SyncQueueItem {
  id: number;
  operation: SyncOperation;
  payload: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  retry_count: number;
  created_at: string;
}

export interface SyncQueuePayload {
  localId?: string;
  entryDate?: string;
  textContent?: string;
  audioLocalUri?: string;
  audioStoragePath?: string;
  imageLocalUri?: string;
  imageStoragePath?: string;
  localImageId?: string;
  userId?: string;
  entryId?: string;
}

export async function addToSyncQueue(
  operation: SyncOperation,
  payload: SyncQueuePayload,
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO sync_queue (operation, payload, status, retry_count)
     VALUES (?, ?, 'pending', 0)`,
    [operation, JSON.stringify(payload)],
  );
  logger.debug('Added to sync queue', { operation });
}

export async function getSyncQueueCount(): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`,
  );
  return result?.count ?? 0;
}

export async function processQueueItem(item: SyncQueueItem): Promise<void> {
  const db = getDatabase();
  const payload = JSON.parse(item.payload) as SyncQueuePayload;

  try {
    await db.runAsync(
      `UPDATE sync_queue SET status = 'processing' WHERE id = ?`,
      [item.id],
    );

    switch (item.operation) {
      case 'create_entry':
      case 'update_entry': {
        if (!payload.localId || !payload.entryDate) {
          throw new Error('Missing localId or entryDate in sync payload');
        }

        const request: SyncDiaryRequest = {
          entries: [
            {
              localId: payload.localId,
              entryDate: payload.entryDate,
              textContent: payload.textContent ?? '',
              ...(payload.audioStoragePath && { audioStoragePath: payload.audioStoragePath }),
            },
          ],
        };

        const { data, error } = await supabase.functions.invoke<{
          success: boolean;
          synced: SyncDiaryResponseEntry[];
          discoveryUnlocked: boolean;
        }>('sync-diary', { body: request });

        if (error) {
          throw new Error(`sync-diary edge function error: ${error.message}`);
        }

        if (data?.synced?.length) {
          const synced = data.synced[0];
          if (synced) {
            await db.runAsync(
              `UPDATE diary_entries SET sync_status = 'synced', remote_id = ?, updated_at = datetime('now')
               WHERE local_id = ?`,
              [synced.remoteId, payload.localId],
            );
          }
        }
        break;
      }

      case 'upload_audio': {
        if (!payload.audioLocalUri || !payload.userId || !payload.entryId) {
          throw new Error('Missing fields for upload_audio sync operation');
        }
        // Audio upload is handled by audioService before queuing;
        // this operation type is reserved for retry scenarios where
        // the storage path needs to be re-linked to the remote entry.
        logger.debug('Skipping upload_audio re-link — handled by audioService');
        break;
      }

      case 'upload_image': {
        if (!payload.imageLocalUri || !payload.userId || !payload.entryId || !payload.localImageId) {
          throw new Error('Missing required fields for upload_image sync operation');
        }

        // Check dependency: parent entry must have a remote_id before we can upload the image
        const parentEntry = await db.getFirstAsync<{ remote_id: string | null }>(
          `SELECT remote_id FROM diary_entries WHERE local_id = ?`,
          [payload.entryId],
        );

        if (!parentEntry?.remote_id) {
          // Parent entry not synced yet — reset to pending so it retries later
          // without consuming retry budget
          await db.runAsync(
            `UPDATE sync_queue SET status = 'pending' WHERE id = ?`,
            [item.id],
          );
          logger.debug('upload_image deferred — parent entry not yet synced', {
            entryId: payload.entryId,
          });
          return; // return early — skip the final 'done' update below
        }

        const remoteEntryId = parentEntry.remote_id;
        const storagePath = `${payload.userId}/${remoteEntryId}/${payload.localImageId}.jpg`;

        // Read file as base64
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any -- expo-file-system lazy require
        const FileSystem = require('expo-file-system') as any;
        let base64: string;
        try {
          base64 = await FileSystem.readAsStringAsync(payload.imageLocalUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {
          // File no longer exists on disk — mark as failed immediately
          logger.warn('upload_image: local file missing, marking failed', {
            uri: payload.imageLocalUri,
          });
          await db.runAsync(
            `UPDATE sync_queue SET status = 'failed', retry_count = 3 WHERE id = ?`,
            [item.id],
          );
          await db.runAsync(
            `UPDATE diary_images SET sync_status = 'failed' WHERE local_id = ?`,
            [payload.localImageId],
          );
          return;
        }

        // Decode base64 → Uint8Array for Supabase Storage upload
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('diary-images')
          .upload(storagePath, bytes, { contentType: 'image/jpeg', upsert: true });

        if (uploadError && uploadError.message !== 'The resource already exists') {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // Get public URL (or signed URL if bucket is private)
        const { data: urlData } = supabase.storage.from('diary-images').getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        // Insert into diary_images Supabase table
        const { data: insertedRow, error: insertError } = await supabase
          .from('diary_images')
          .upsert(
            {
              diary_entry_id: remoteEntryId,
              user_id: payload.userId,
              storage_path: storagePath,
              public_url: publicUrl,
            },
            { onConflict: 'storage_path' },
          )
          .select('id')
          .single();

        if (insertError) {
          throw new Error(`diary_images insert failed: ${insertError.message}`);
        }

        // Update SQLite diary_images row
        await db.runAsync(
          `UPDATE diary_images SET sync_status = 'synced', remote_id = ? WHERE local_id = ?`,
          [insertedRow?.id ?? null, payload.localImageId],
        );

        logger.info('Image uploaded and synced', {
          localImageId: payload.localImageId,
          storagePath,
        });
        break;
      }

      default: {
        const _exhaustive: never = item.operation;
        throw new Error(`Unknown sync operation: ${String(_exhaustive)}`);
      }
    }

    await db.runAsync(
      `UPDATE sync_queue SET status = 'done' WHERE id = ?`,
      [item.id],
    );
    logger.info('Sync queue item processed', { id: item.id, operation: item.operation });
  } catch (err) {
    const newRetryCount = item.retry_count + 1;
    const nextStatus = newRetryCount >= 3 ? 'failed' : 'pending';

    await db.runAsync(
      `UPDATE sync_queue SET status = ?, retry_count = ? WHERE id = ?`,
      [nextStatus, newRetryCount, item.id],
    );

    logger.error('Sync queue item failed', {
      id: item.id,
      operation: item.operation,
      retryCount: newRetryCount,
      error: String(err),
    });

    if (nextStatus === 'failed') {
      throw err;
    }
  }
}

export async function syncPendingEntries(): Promise<void> {
  const db = getDatabase();

  const pendingItems = await db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC`,
  );

  if (pendingItems.length === 0) {
    logger.debug('No pending sync items');
    return;
  }

  logger.info('Processing sync queue', { count: pendingItems.length });

  for (const item of pendingItems) {
    try {
      await processQueueItem(item);
    } catch (err) {
      // processQueueItem already logged and updated status.
      // Continue processing remaining items even if one fails.
      logger.warn('Continuing sync after item failure', { id: item.id });
    }
  }

  logger.info('Sync queue processing complete');
}
