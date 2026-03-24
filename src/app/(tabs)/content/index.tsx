import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContentStore, type GeneratedPost, type PlatformFilter } from '@/stores/contentStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { PostCard } from '@/components/content/PostCard';
import { WeeklyQuotaProgress } from '@/components/content/WeeklyQuotaProgress';
import {
  PlatformFilter as PlatformFilterComponent,
  type DiscoverPlatformFilter,
} from '@/components/discover/PlatformFilter';
import { useSyncStore } from '@/stores/syncStore';
import { fontFamily } from '@/theme/typography';

type StatusTab = 'ready' | 'scheduled' | 'posted';

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'ready', label: 'Ready' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'posted', label: 'Posted' },
];

export default function ContentDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const posts = useContentStore((state) => state.posts);
  const platformFilter = useContentStore((state) => state.platformFilter);
  const setPlatformFilter = useContentStore((state) => state.setPlatformFilter);
  const getWeeklyQuota = useContentStore((state) => state.getWeeklyQuota);
  const [statusTab, setStatusTab] = useState<StatusTab>('ready');
  const [generationFailed, setGenerationFailed] = useState(false);
  const isOnline = useSyncStore((s) => s.isOnline);

  // posts is used by getWeeklyQuota internally; include to recompute when posts change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quotas = useMemo(() => getWeeklyQuota(), [getWeeklyQuota, posts]);

  const filteredPosts = useMemo(() => {
    // First filter by status tab
    const statusFiltered = posts.filter((post) => {
      if (statusTab === 'ready') return post.status === 'draft' || post.status === 'approved';
      if (statusTab === 'scheduled') return post.status === 'scheduled';
      return post.status === 'posted';
    });
    // Then by platform
    if (platformFilter === 'all') return statusFiltered;
    return statusFiltered.filter((post) => post.platform === platformFilter);
  }, [posts, platformFilter, statusTab]);

  const handlePostPress = useCallback(
    (postId: string) => {
      router.push(`/content/${postId}`);
    },
    [router],
  );

  const handleFilterChange = useCallback(
    (value: DiscoverPlatformFilter) => {
      setPlatformFilter(value as PlatformFilter);
    },
    [setPlatformFilter],
  );

  const renderItem = useCallback(
    ({ item }: { item: GeneratedPost }) => (
      <View style={styles.cardWrapper}>
        <PostCard
          post={item}
          onPress={() => handlePostPress(item.id)}
          testID={`post-card-${item.id}`}
        />
      </View>
    ),
    [handlePostPress],
  );

  const keyExtractor = useCallback((item: GeneratedPost) => item.id, []);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {"This Week's Progress"}
        </Text>
        <WeeklyQuotaProgress quotas={quotas} />

        {/* Status segment control */}
        <View
          style={[
            styles.segmentControl,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = statusTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setStatusTab(tab.key)}
                style={[
                  styles.segmentTab,
                  isActive && { backgroundColor: colors.accent, borderRadius: borderRadius.sm },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                testID={`segment-tab-${tab.key}`}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: isActive ? colors.accentText : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filterWrapper}>
          <PlatformFilterComponent
            selected={platformFilter as DiscoverPlatformFilter}
            onSelect={handleFilterChange}
          />
        </View>
      </View>
    ),
    [quotas, platformFilter, handleFilterChange, statusTab, colors],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        testID="content-empty-state"
      >
        {/* Accent top stripe */}
        <View style={[styles.emptyAccent, { backgroundColor: colors.accent }]} />

        <View style={styles.emptyBody}>
          {/* Large numeric entry count */}
          <Text style={[styles.emptyCountDisplay, { color: colors.accent }]}>
            {posts.length}
            <Text style={[styles.emptyCountSeparator, { color: colors.textMuted }]}>
              {' / 7'}
            </Text>
          </Text>

          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Content comes after discovery
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Keep journaling — once we learn your voice, daily content appears here.
          </Text>

          {posts.length > 0 && posts.length < 7 ? (
            <View style={styles.emptyProgress} testID="entry-progress">
              <View
                style={[styles.emptyProgressTrack, { backgroundColor: colors.surface2 }]}
              >
                <View
                  style={[
                    styles.emptyProgressFill,
                    {
                      width: `${(posts.length / 7) * 100}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                  testID="entry-progress-fill"
                />
              </View>
              <Text style={[styles.emptyProgressLabel, { color: colors.textMuted }]}>
                {posts.length} of 7 entries
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    ),
    [posts.length, colors],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      testID="content-dashboard"
    >
      <HeaderBar title="Content" testID="content-header" />

      {/* Offline banner */}
      {!isOnline ? (
        <View
          style={[styles.banner, { backgroundColor: colors.surface2, borderBottomColor: colors.border }]}
          testID="content-offline-banner"
        >
          <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
            {'☁  Offline — showing cached content'}
          </Text>
        </View>
      ) : null}

      {/* Generation failed banner */}
      {generationFailed ? (
        <View
          style={[styles.banner, styles.bannerError, { backgroundColor: colors.errorLight ?? colors.surface2, borderBottomColor: colors.error }]}
          testID="content-generation-failed-banner"
        >
          <Text style={[styles.bannerText, { color: colors.error, flex: 1 }]}>
            Couldn't generate today's content
          </Text>
          <Pressable
            onPress={() => setGenerationFailed(false)}
            style={styles.bannerRetryBtn}
            accessibilityRole="button"
            testID="generation-retry-btn"
          >
            <Text style={[styles.bannerRetryText, { color: colors.error }]}>Retry</Text>
          </Pressable>
          <Text style={[styles.bannerMeta, { color: colors.textMuted }]}>
            We'll try again tomorrow
          </Text>
        </View>
      ) : null}

      <FlatList
        data={filteredPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        testID="content-flat-list"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  bannerError: {
    paddingVertical: spacing.sm,
  },
  bannerText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  bannerRetryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerRetryText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  bannerMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  filterWrapper: {
    marginHorizontal: -spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    marginTop: spacing.xs,
  },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    ...typography.label,
  },
  emptyContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyAccent: {
    height: 3,
  },
  emptyBody: {
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyCountDisplay: {
    ...typography.numericLg,
  },
  emptyCountSeparator: {
    ...typography.headingMd,
  },
  emptyTitle: {
    ...typography.headingMd,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  emptyProgress: {
    width: '100%',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  emptyProgressTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  emptyProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  emptyProgressLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
});
