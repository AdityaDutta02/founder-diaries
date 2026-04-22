import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
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

  const isSyncingRef = useRef(isSyncing);
  isSyncingRef.current = isSyncing;

  const triggerSync = useCallback(async (): Promise<void> => {
    if (isSyncingRef.current) {
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
    } finally {
      setSyncing(false);
    }
  }, [setSyncing, setPendingCount, setLastSync]);

  // Sync on mount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when app returns to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        logger.debug('App foregrounded — triggering sync');
        void triggerSync();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [triggerSync]);

  // Periodic sync every 30s — catches network recovery and retries
  useEffect(() => {
    const interval = setInterval(() => {
      void triggerSync();
    }, 30_000);

    return () => clearInterval(interval);
  }, [triggerSync]);

  return { isSyncing, pendingCount, lastSyncAt, triggerSync };
}
