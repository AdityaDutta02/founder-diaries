import React, { useCallback, useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useContentStore,
  type GeneratedPost,
  type PlatformFilter,
} from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { PostCard } from '@/components/content/PostCard';
import {
  PlatformFilter as PlatformFilterComponent,
  type DiscoverPlatformFilter,
} from '@/components/discover/PlatformFilter';

type QueueStatus = 'approved' | 'draft' | 'rejected';

interface QueueSection {
  title: string;
  status: QueueStatus;
  data: GeneratedPost[];
}

const SECTION_CONFIG: { title: string; status: QueueStatus }[] = [
  { title: 'Approved', status: 'approved' },
  { title: 'Drafts', status: 'draft' },
  { title: 'Rejected', status: 'rejected' },
];

export default function ContentQueue() {
  const router = useRouter();
  const posts = useContentStore((state) => state.posts);
  const platformFilter = useContentStore((state) => state.platformFilter);
  const setPlatformFilter = useContentStore((state) => state.setPlatformFilter);

  const filteredPosts = useMemo(() => {
    if (platformFilter === 'all') return posts;
    return posts.filter((post) => post.platform === platformFilter);
  }, [posts, platformFilter]);

  const sections: QueueSection[] = useMemo(
    () =>
      SECTION_CONFIG.map(({ title, status }) => ({
        title,
        status,
        data: filteredPosts.filter((post) => post.status === status),
      })).filter((section) => section.data.length > 0),
    [filteredPosts],
  );

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
          compact
          testID={`queue-card-${item.id}`}
        />
      </View>
    ),
    [handlePostPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: QueueSection }) => (
      <View style={styles.sectionHeader} testID={`queue-section-${section.status}`}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: GeneratedPost) => item.id, []);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.filterWrapper}>
        <PlatformFilterComponent
          selected={platformFilter as DiscoverPlatformFilter}
          onSelect={handleFilterChange}
          testID="queue-platform-filter"
        />
      </View>
    ),
    [platformFilter, handleFilterChange],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer} testID="queue-empty">
        <Text style={styles.emptyText}>No posts in your queue.</Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']} testID="content-queue">
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        testID="queue-section-list"
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
    paddingBottom: spacing['3xl'],
  },
  filterWrapper: {
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.headingSm,
    color: colors.gray[700],
  },
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.gray[500],
  },
});
