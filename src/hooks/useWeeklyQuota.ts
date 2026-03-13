import { useMemo } from 'react';
import { useContentStore, type WeeklyQuotaEntry } from '@/stores/contentStore';

export interface UseWeeklyQuotaReturn {
  quotas: WeeklyQuotaEntry[];
}

export function useWeeklyQuota(): UseWeeklyQuotaReturn {
  const getWeeklyQuota = useContentStore((state) => state.getWeeklyQuota);

  const quotas = useMemo(() => getWeeklyQuota(), [getWeeklyQuota]);

  return { quotas };
}
