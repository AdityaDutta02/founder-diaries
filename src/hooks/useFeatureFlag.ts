import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  enabled_for_user_ids: string[] | null;
  rollout_pct: number;
}

async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, enabled, enabled_for_user_ids, rollout_pct');

  if (error) {
    logger.error('Failed to fetch feature flags', { error: error.message });
    throw error;
  }

  return data ?? [];
}

export function useFeatureFlag(key: string): boolean {
  const { data } = useQuery<FeatureFlag[], Error>({
    queryKey: ['feature_flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    throwOnError: false,
  });

  if (!data) return false;

  const flag = data.find((f) => f.key === key);
  if (!flag) return false;

  return flag.enabled;
}
