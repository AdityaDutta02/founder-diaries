import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { getCreatorProfiles, getWritingProfiles, getDistinctDiaryDays } from '@/services/supabaseService';
import { requestScraping, requestAnalysis } from '@/services/scrapingService';
import type { CreatorProfile, ContentWritingProfile, Platform } from '@/types/database';
import type { DiscoverPlatformFilter } from '@/components/discover/PlatformFilter';

const SCRAPE_PLATFORMS: Platform[] = ['linkedin', 'x'];

export interface UseCreatorDiscoveryReturn {
  creators: CreatorProfile[];
  writingProfiles: ContentWritingProfile[];
  diaryDaysCount: number;
  isLoading: boolean;
  isError: boolean;
  triggerScrapeAndAnalyze: () => Promise<void>;
  refreshProfiles: () => void;
}

export function useCreatorDiscovery(
  platformFilter: DiscoverPlatformFilter = 'all',
): UseCreatorDiscoveryReturn {
  const { session, profile } = useAuthStore();
  const queryClient = useQueryClient();

  const userId = session?.user.id;

  const creatorsQuery = useQuery({
    queryKey: ['creator-profiles', userId, platformFilter],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const platform = platformFilter === 'all' ? undefined : platformFilter;
      return getCreatorProfiles(userId, platform);
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

  const diaryDaysQuery = useQuery({
    queryKey: ['diary-days-count', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      return getDistinctDiaryDays(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

  const triggerScrapeAndAnalyze = useCallback(async (): Promise<void> => {
    if (!userId || !profile) {
      throw new Error('Not authenticated or profile not loaded');
    }

    await requestScraping(
      userId,
      SCRAPE_PLATFORMS,
      profile.niche_keywords ?? [],
      profile.industry ?? '',
    );

    // Chain analysis for each scraped platform
    for (const platform of SCRAPE_PLATFORMS) {
      try {
        await requestAnalysis(userId, platform);
      } catch (err) {
        logger.warn('Analysis failed for platform after scrape', {
          platform,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['creator-profiles', userId] });
    await queryClient.invalidateQueries({ queryKey: ['writing-profiles', userId] });
    logger.info('Scrape + analyze completed and caches invalidated');
  }, [userId, profile, queryClient]);

  const refreshProfiles = useCallback((): void => {
    void queryClient.invalidateQueries({ queryKey: ['writing-profiles', userId] });
    void queryClient.invalidateQueries({ queryKey: ['creator-profiles', userId] });
    logger.debug('Creator discovery queries refreshed');
  }, [userId, queryClient]);

  return {
    creators: creatorsQuery.data ?? [],
    writingProfiles: writingProfilesQuery.data ?? [],
    diaryDaysCount: diaryDaysQuery.data ?? 0,
    isLoading: creatorsQuery.isLoading || writingProfilesQuery.isLoading,
    isError: creatorsQuery.isError || writingProfilesQuery.isError,
    triggerScrapeAndAnalyze,
    refreshProfiles,
  };
}
