import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { useSyncStore } from '@/stores/syncStore';

const CONNECTIVITY_CHECK_URL = 'https://www.google.com/generate_204';
const POLL_INTERVAL_MS = 30_000;

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, 5000);
    const response = await fetch(CONNECTIVITY_CHECK_URL, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

export interface UseNetworkStatusReturn {
  isOnline: boolean;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const { isOnline, setOnline } = useSyncStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function probe() {
      const online = await checkConnectivity();
      setOnline(online);
      if (!initialized) setInitialized(true);
      logger.debug('Network status checked', { isOnline: online });
    }

    void probe();

    const interval = setInterval(() => {
      void probe();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline };
}
