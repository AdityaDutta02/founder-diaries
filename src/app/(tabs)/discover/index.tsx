import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { CreatorCard, PlatformFilter } from '@/components/discover';
import type { CreatorCardData, DiscoverPlatformFilter } from '@/components/discover';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Platform } from '@/types/database';

const PLATFORM_SECTIONS: Array<{ platform: Platform; label: string }> = [
  { platform: 'linkedin', label: 'LinkedIn Creators' },
  { platform: 'instagram', label: 'Instagram Creators' },
  { platform: 'x', label: 'X Creators' },
];

interface CreatorsByPlatform {
  linkedin: CreatorCardData[];
  instagram: CreatorCardData[];
  x: CreatorCardData[];
}

export default function DiscoverScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const [platformFilter, setPlatformFilter] = useState<DiscoverPlatformFilter>('all');
  const [creators, setCreators] = useState<CreatorsByPlatform>({
    linkedin: [],
    instagram: [],
    x: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const discoveryUnlocked = profile?.discovery_unlocked ?? false;

  const daysRecorded = useCallback((): number => {
    if (!profile?.diary_start_date) return 0;
    const start = new Date(profile.diary_start_date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff, 7);
  }, [profile?.diary_start_date]);

  const fetchCreators = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('id, creator_name, creator_handle, platform, follower_count, bio, relevance_score')
        .order('relevance_score', { ascending: false });

      if (error) {
        logger.error('Failed to fetch creator profiles', { error: error.message });
        return;
      }

      const grouped: CreatorsByPlatform = { linkedin: [], instagram: [], x: [] };
      for (const item of data ?? []) {
        const p = item.platform as Platform;
        if (p in grouped) {
          grouped[p].push(item as CreatorCardData);
        }
      }
      setCreators(grouped);
    } catch (err) {
      logger.error('Unexpected error fetching creators', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (discoveryUnlocked) {
      fetchCreators();
    }
  }, [discoveryUnlocked, fetchCreators]);

  const handleCreatorPress = useCallback(
    (id: string) => {
      router.push(`/discover/${id}`);
    },
    [router],
  );

  if (!discoveryUnlocked) {
    const days = daysRecorded();
    return (
      <SafeAreaView style={styles.safeArea} testID="discover-locked-screen">
        <View style={styles.lockedContainer}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Discover is locked</Text>
          <Text style={styles.lockedBody}>
            Record your journey for 7 days to unlock discovery
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer} testID="unlock-progress">
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${(days / 7) * 100}%` }]}
                testID="progress-fill"
              />
            </View>
            <Text style={styles.progressLabel}>{days} / 7 days</Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/diary')}
            style={styles.diaryLink}
            accessibilityRole="link"
            testID="go-to-diary-link"
          >
            <Text style={styles.diaryLinkText}>Go to diary →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const visibleSections =
    platformFilter === 'all'
      ? PLATFORM_SECTIONS
      : PLATFORM_SECTIONS.filter((s) => s.platform === platformFilter);

  return (
    <SafeAreaView style={styles.safeArea} testID="discover-screen">
      <HeaderBar
        title="Discover"
        rightAction={
          <Pressable
            onPress={() => fetchCreators(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Refresh creators"
            testID="discover-refresh-button"
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </Pressable>
        }
      />

      <FlatList
        data={visibleSections}
        keyExtractor={(item) => item.platform}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchCreators(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <PlatformFilter selected={platformFilter} onSelect={setPlatformFilter} />
            <Pressable
              style={styles.profilesLink}
              onPress={() => router.push('/discover/profiles')}
              accessibilityRole="link"
              testID="writing-profiles-link"
            >
              <Text style={styles.profilesLinkText}>View Writing Profiles →</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: section }) => {
          const sectionCreators = creators[section.platform];
          return (
            <View style={styles.section} testID={`section-${section.platform}`}>
              <Text style={styles.sectionTitle}>{section.label}</Text>
              {isLoading ? (
                <ActivityIndicator
                  color={colors.primary[500]}
                  style={styles.sectionLoader}
                  testID={`section-loader-${section.platform}`}
                />
              ) : sectionCreators.length === 0 ? (
                <View style={styles.emptyState} testID={`empty-state-${section.platform}`}>
                  <Text style={styles.emptyText}>No creators found for this platform yet.</Text>
                </View>
              ) : (
                <FlatList
                  data={sectionCreators}
                  keyExtractor={(creator) => creator.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
                  renderItem={({ item: creator }) => (
                    <CreatorCard creator={creator} onPress={handleCreatorPress} />
                  )}
                />
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    gap: spacing.lg,
  },
  lockEmoji: {
    fontSize: 64,
  },
  lockedTitle: {
    ...typography.headingLg,
    color: colors.gray[900],
    textAlign: 'center',
  },
  lockedBody: {
    ...typography.bodyMd,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressLabel: {
    ...typography.bodySm,
    color: colors.gray[500],
    textAlign: 'center',
  },
  diaryLink: {
    marginTop: spacing.sm,
  },
  diaryLinkText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '600',
  },
  listHeader: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  profilesLink: {
    paddingHorizontal: spacing.lg,
  },
  profilesLinkText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.headingMd,
    color: colors.gray[900],
  },
  sectionLoader: {
    marginVertical: spacing.lg,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.gray[400],
  },
  cardSeparator: {
    height: spacing.sm,
  },
  refreshIcon: {
    fontSize: 22,
    color: colors.gray[700],
  },
});
