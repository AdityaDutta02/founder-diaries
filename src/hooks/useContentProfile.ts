import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getWritingProfiles } from '@/services/supabaseService';
import type { ContentWritingProfile, Platform } from '@/types/database';

export interface UseContentProfileReturn {
  profiles: Record<Platform, ContentWritingProfile | undefined>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const PLATFORMS: Platform[] = ['linkedin', 'instagram', 'x'];

export function useContentProfile(): UseContentProfileReturn {
  const { session } = useAuthStore();
  const userId = session?.user.id;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['writing-profiles', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      return getWritingProfiles(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 10,
  });

  const profiles = PLATFORMS.reduce<Record<Platform, ContentWritingProfile | undefined>>(
    (acc, platform) => {
      acc[platform] = data?.find((profile) => profile.platform === platform);
      return acc;
    },
    { linkedin: undefined, instagram: undefined, x: undefined },
  );

  return { profiles, isLoading, isError, refetch };
}
