import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { getCreatorProfiles, getWritingProfiles } from '@/services/supabaseService';
import { requestScraping } from '@/services/scrapingService';
import type { CreatorProfile, ContentWritingProfile } from '@/types/database';

export interface UseCreatorDiscoveryReturn {
  creators: CreatorProfile[];
  writingProfiles: ContentWritingProfile[];
  isLoading: boolean;
  isError: boolean;
  triggerScrape: () => Promise<void>;
  refreshProfiles: () => void;
}

export function useCreatorDiscovery(): UseCreatorDiscoveryReturn {
  const { session, profile } = useAuthStore();
  const queryClient = useQueryClient();

  const userId = session?.user.id;

  const creatorsQuery = useQuery({
    queryKey: ['creator-profiles', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      return getCreatorProfiles(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 10,
  });

  const writingProfilesQuery = useQuery({
    queryKey: ['writing-profiles', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      return getWritingProfiles(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 10,
  });

  const triggerScrape = useCallback(async (): Promise<void> => {
    if (!userId || !profile) {
      throw new Error('Not authenticated or profile not loaded');
    }

    await requestScraping(
      userId,
      ['linkedin', 'instagram', 'x'],
      profile.niche_keywords ?? [],
      profile.industry ?? '',
    );

    await queryClient.invalidateQueries({ queryKey: ['creator-profiles', userId] });
    logger.info('Scrape triggered and creator profiles invalidated');
  }, [userId, profile, queryClient]);

  const refreshProfiles = useCallback((): void => {
    void queryClient.invalidateQueries({ queryKey: ['writing-profiles', userId] });
    void queryClient.invalidateQueries({ queryKey: ['creator-profiles', userId] });
    logger.debug('Creator discovery queries refreshed');
  }, [userId, queryClient]);

  return {
    creators: creatorsQuery.data ?? [],
    writingProfiles: writingProfilesQuery.data ?? [],
    isLoading: creatorsQuery.isLoading || writingProfilesQuery.isLoading,
    isError: creatorsQuery.isError || writingProfilesQuery.isError,
    triggerScrape,
    refreshProfiles,
  };
}
