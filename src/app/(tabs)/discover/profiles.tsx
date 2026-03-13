import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { WritingProfileCard } from '@/components/discover';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import type { ContentWritingProfile } from '@/types/database';

export default function WritingProfilesScreen() {
  const session = useAuthStore((s) => s.session);
  const [profiles, setProfiles] = useState<ContentWritingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingPlatform, setRefreshingPlatform] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!session?.user.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('content_writing_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .order('platform');

      if (error) {
        logger.error('Failed to fetch writing profiles', { error: error.message });
        return;
      }

      setProfiles((data ?? []) as ContentWritingProfile[]);
    } catch (err) {
      logger.error('Unexpected error fetching writing profiles', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleRefresh = useCallback(
    async (platform: ContentWritingProfile['platform']) => {
      setRefreshingPlatform(platform);
      try {
        // Trigger refresh via generation queue in Supabase
        const { error } = await supabase.from('generation_queue').insert({
          user_id: session?.user.id,
          job_type: 'profile_analysis',
          status: 'pending',
          payload: { platform },
          retry_count: 0,
          max_retries: 3,
        });

        if (error) {
          logger.error('Failed to queue profile refresh', { error: error.message, platform });
        } else {
          logger.info('Profile refresh queued', { platform });
        }
      } catch (err) {
        logger.error('Unexpected error queuing profile refresh', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setRefreshingPlatform(null);
      }
    },
    [session?.user.id],
  );

  return (
    <SafeAreaView style={styles.safeArea} testID="writing-profiles-screen">
      <HeaderBar title="Writing Profiles" showBack />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState} testID="profiles-empty-state">
              <Text style={styles.emptyText}>
                No writing profiles generated yet. Enable platforms and record diary entries to get
                started.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <WritingProfileCard
              profile={item}
              onRefresh={handleRefresh}
              testID={`writing-profile-${item.platform}`}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: 22,
  },
});
