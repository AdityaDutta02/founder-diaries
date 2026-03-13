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
        if (!payload.imageLocalUri) {
          throw new Error('Missing imageLocalUri for upload_image sync operation');
        }
        logger.debug('Skipping upload_image — not yet implemented');
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
