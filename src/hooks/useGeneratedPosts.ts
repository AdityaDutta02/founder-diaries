import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { useContentStore } from '@/stores/contentStore';
import { getGeneratedPosts } from '@/services/supabaseService';
import type { GeneratedPost } from '@/types/database';

export interface UseGeneratedPostsReturn {
  posts: GeneratedPost[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useGeneratedPosts(): UseGeneratedPostsReturn {
  const { session } = useAuthStore();
  const { platformFilter, setPosts } = useContentStore();

  const userId = session?.user.id;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['generated-posts', userId, platformFilter],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      return getGeneratedPosts(userId, {
        platform: platformFilter !== 'all' ? platformFilter : undefined,
      });
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (data) {
      setPosts(data);
      logger.debug('Generated posts loaded into store', { count: data.length });
    }
  }, [data, setPosts]);

  return {
    posts: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}
