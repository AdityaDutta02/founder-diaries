import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCreatorDiscovery } from '@/hooks/useCreatorDiscovery';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui';
import {
  CreatorCard,
  DiscoverLockedView,
  PlatformFilter,
} from '@/components/discover';
import type { DiscoverPlatformFilter } from '@/components/discover';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const DISCOVERY_REQUIRED_DAYS = 7;

export default function DiscoverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const profile = useAuthStore((s) => s.profile);
  const discoveryEnabled = useFeatureFlag('creator_discovery');

  const [platformFilter, setPlatformFilter] = useState<DiscoverPlatformFilter>('all');
  const [isScraping, setIsScraping] = useState(false);

  const {
    creators,
    diaryDaysCount,
    isLoading,
    triggerScrapeAndAnalyze,
    refreshProfiles,
  } = useCreatorDiscovery(platformFilter);

  const discoveryUnlocked = profile?.discovery_unlocked ?? false;
  const isUnlocked = discoveryUnlocked || diaryDaysCount >= DISCOVERY_REQUIRED_DAYS;

  const handleScrape = useCallback(async () => {
    setIsScraping(true);
    try {
      await triggerScrapeAndAnalyze();
      toast.show('Creator discovery updated!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.show(message, 'error');
    } finally {
      setIsScraping(false);
    }
  }, [triggerScrapeAndAnalyze, toast]);

  const handleCreatorPress = useCallback(
    (id: string) => {
      router.push(`/(tabs)/discover/${id}`);
    },
    [router],
  );

  const handleGoToDiary = useCallback(() => {
    router.push('/(tabs)/diary');
  }, [router]);

  // Feature flag off — show coming soon
  if (!discoveryEnabled) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={['top']}
        testID="discover-screen"
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Discover</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emoji}>{'🔍'}</Text>
          <Text style={[styles.comingSoonTitle, { color: colors.textPrimary }]}>
            Coming Soon
          </Text>
          <Text style={[styles.comingSoonSub, { color: colors.textSecondary }]}>
            Discover creators in your niche and learn from their content style.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Discovery not yet unlocked — show locked view
  if (!isUnlocked) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={['top']}
        testID="discover-screen"
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Discover</Text>
        </View>
        <DiscoverLockedView
          completedDays={diaryDaysCount}
          onGoToDiary={handleGoToDiary}
        />
      </SafeAreaView>
    );
  }

  // Full discover screen
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
      testID="discover-screen"
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Discover</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(tabs)/discover/profiles')}
              accessibilityRole="button"
              accessibilityLabel="View writing profiles"
              testID="view-profiles-btn"
            >
              <Text style={[styles.headerLink, { color: colors.accent }]}>Profiles</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <FlatList
        data={creators}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onRefresh={refreshProfiles}
        refreshing={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <PlatformFilter
              selected={platformFilter}
              onSelect={setPlatformFilter}
            />
            <Pressable
              onPress={handleScrape}
              disabled={isScraping}
              style={({ pressed }) => [
                styles.scrapeBtn,
                {
                  backgroundColor: colors.accent,
                  opacity: pressed || isScraping ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Find new creators"
              testID="scrape-btn"
            >
              {isScraping ? (
                <ActivityIndicator size="small" color={colors.accentText} />
              ) : (
                <Text style={[styles.scrapeBtnText, { color: colors.accentText }]}>
                  Find Creators
                </Text>
              )}
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered} testID="discover-loading">
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <View style={styles.emptyState} testID="discover-empty">
              <Text style={styles.emptyEmoji}>{'🔍'}</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No creators found yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Tap "Find Creators" to discover people in your niche.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <CreatorCard
            creator={item}
            onPress={handleCreatorPress}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerLink: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  comingSoonTitle: {
    ...typography.headingLg,
    textAlign: 'center',
  },
  comingSoonSub: {
    ...typography.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  listHeader: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  scrapeBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrapeBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  separator: {
    height: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headingMd,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
});
