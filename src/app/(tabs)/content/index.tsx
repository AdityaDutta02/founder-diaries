import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContentStore, type GeneratedPost, type PlatformFilter } from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/content/PostCard';
import { WeeklyQuotaProgress } from '@/components/content/WeeklyQuotaProgress';
import {
  PlatformFilter as PlatformFilterComponent,
  type DiscoverPlatformFilter,
} from '@/components/discover/PlatformFilter';

export default function ContentDashboard() {
  const router = useRouter();
  const posts = useContentStore((state) => state.posts);
  const platformFilter = useContentStore((state) => state.platformFilter);
  const setPlatformFilter = useContentStore((state) => state.setPlatformFilter);
  const getWeeklyQuota = useContentStore((state) => state.getWeeklyQuota);

  const quotas = useMemo(() => getWeeklyQuota(), [getWeeklyQuota, posts]);

  const filteredPosts = useMemo(() => {
    if (platformFilter === 'all') return posts;
    return posts.filter((post) => post.platform === platformFilter);
  }, [posts, platformFilter]);

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
        <Text style={styles.sectionLabel}>This Week's Progress</Text>
        <WeeklyQuotaProgress quotas={quotas} />
        <View style={styles.filterWrapper}>
          <PlatformFilterComponent
            selected={platformFilter as DiscoverPlatformFilter}
            onSelect={handleFilterChange}
          />
        </View>
        <Text style={styles.sectionLabel}>Today's Posts</Text>
      </View>
    ),
    [quotas, platformFilter, handleFilterChange],
  );

  const ListFooterComponent = useMemo(
    () => (
      <View style={styles.footer}>
        <Button
          label="View Queue"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => router.push('/content/queue')}
          testID="btn-view-queue"
        />
      </View>
    ),
    [router],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>✨</Text>}
        title="No posts yet"
        description="Your generated posts will appear here after 7 days of diary entries."
        testID="content-empty-state"
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} testID="content-dashboard">
      <HeaderBar title="Content" testID="content-header" />
      <FlatList
        data={filteredPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
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
    backgroundColor: colors.gray[50],
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
    ...typography.headingSm,
    color: colors.gray[700],
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
  },
});
