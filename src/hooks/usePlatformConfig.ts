import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { getPlatformConfigs, upsertPlatformConfig } from '@/services/supabaseService';
import type { PlatformConfig, Platform } from '@/types/database';

export interface UsePlatformConfigReturn {
  configs: PlatformConfig[];
  isLoading: boolean;
  isError: boolean;
  updateConfig: (
    platform: Platform,
    updates: Partial<Omit<PlatformConfig, 'id' | 'user_id' | 'platform' | 'created_at' | 'updated_at'>>,
  ) => Promise<void>;
  togglePlatform: (platform: Platform) => Promise<void>;
}

export function usePlatformConfig(): UsePlatformConfigReturn {
  const { session } = useAuthStore();
  const queryClient = useQueryClient();

  const userId = session?.user.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform-configs', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      return getPlatformConfigs(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

  const configs = data ?? [];

  const updateConfig = useCallback(
    async (
      platform: Platform,
      updates: Partial<Omit<PlatformConfig, 'id' | 'user_id' | 'platform' | 'created_at' | 'updated_at'>>,
    ): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');

      const existing = configs.find((c) => c.platform === platform);

      await upsertPlatformConfig({
        user_id: userId,
        platform,
        weekly_post_quota: existing?.weekly_post_quota ?? 3,
        active: existing?.active ?? true,
        preferred_content_types: existing?.preferred_content_types ?? null,
        posting_times: existing?.posting_times ?? null,
        ...updates,
      });

      await queryClient.invalidateQueries({ queryKey: ['platform-configs', userId] });
      logger.info('Platform config updated', { platform });
    },
    [userId, configs, queryClient],
  );

  const togglePlatform = useCallback(
    async (platform: Platform): Promise<void> => {
      const existing = configs.find((c) => c.platform === platform);
      const currentlyActive = existing?.active ?? false;
      await updateConfig(platform, { active: !currentlyActive });
      logger.info('Platform toggled', { platform, active: !currentlyActive });
    },
    [configs, updateConfig],
  );

  return { configs, isLoading, isError, updateConfig, togglePlatform };
}
