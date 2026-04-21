import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { WritingProfileCard } from '@/components/discover';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import type { ContentWritingProfile } from '@/types/database';

export default function WritingProfilesScreen() {
  const { colors } = useTheme();
  const session = useAuthStore((s) => s.session);
  const [profiles, setProfiles] = useState<ContentWritingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setRefreshingPlatform] = useState<string | null>(null);

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
      if (!session?.user.id) return;
      setRefreshingPlatform(platform);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-creators', {
          body: { userId: session.user.id, platform },
        });

        if (error) {
          logger.error('Failed to refresh writing profile', { error: error.message, platform });
        } else {
          logger.info('Writing profile refreshed', { platform });
          await fetchProfiles();
        }
      } catch (err) {
        logger.error('Unexpected error refreshing writing profile', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setRefreshingPlatform(null);
      }
    },
    [session?.user.id, fetchProfiles],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      testID="writing-profiles-screen"
    >
      <HeaderBar title="Writing Profiles" showBack />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState} testID="profiles-empty-state">
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
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
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 24,
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
    textAlign: 'center',
    lineHeight: 22,
  },
});
