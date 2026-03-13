import { useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useSyncStore } from '@/stores/syncStore';
import { syncPendingEntries, getSyncQueueCount } from '@/services/syncService';

export interface UseDiarySyncReturn {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  triggerSync: () => Promise<void>;
}

export function useDiarySync(): UseDiarySyncReturn {
  const {
    isSyncing,
    pendingCount,
    lastSyncAt,
    isOnline,
    setSyncing,
    setPendingCount,
    setLastSync,
  } = useSyncStore();

  const triggerSync = useCallback(async (): Promise<void> => {
    if (isSyncing) {
      logger.debug('Sync already in progress — skipping');
      return;
    }

    setSyncing(true);
    try {
      const count = await getSyncQueueCount();
      setPendingCount(count);

      if (count === 0) {
        logger.debug('No pending items to sync');
        return;
      }

      await syncPendingEntries();

      const remaining = await getSyncQueueCount();
      setPendingCount(remaining);
      setLastSync(new Date().toISOString());
      logger.info('Sync complete', { remaining });
    } catch (err) {
      logger.error('Sync failed', { error: String(err) });
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [isSyncing, setSyncing, setPendingCount, setLastSync]);

  useEffect(() => {
    async function initSync() {
      try {
        const count = await getSyncQueueCount();
        setPendingCount(count);

        if (isOnline && count > 0) {
          await triggerSync();
        }
      } catch (err) {
        logger.warn('Auto-sync on mount failed', { error: String(err) });
      }
    }

    void initSync();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isSyncing, pendingCount, lastSyncAt, triggerSync };
}
