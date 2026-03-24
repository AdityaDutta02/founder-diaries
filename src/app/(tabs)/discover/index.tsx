import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import {
  CreatorCard,
  DiscoverLockedView,
  DiscoverVoiceTab,
  PlatformFilter,
} from '@/components/discover';
import type { CreatorCardData, DiscoverPlatformFilter, WritingProfile } from '@/components/discover';
import { useAuthStore } from '@/stores/authStore';
import { useDiaryStore } from '@/stores/diaryStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Platform } from '@/types/database';

const PLATFORM_SECTIONS: { platform: Platform; label: string }[] = [
  { platform: 'linkedin', label: 'LinkedIn Creators' },
  { platform: 'instagram', label: 'Instagram Creators' },
  { platform: 'x', label: 'X Creators' },
];

interface CreatorsByPlatform {
  linkedin: CreatorCardData[];
  instagram: CreatorCardData[];
  x: CreatorCardData[];
}

type DiscoverTab = 'creators' | 'voice';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const getDaysWithEntries = useDiaryStore((s) => s.getDaysWithEntries);

  const [activeTab, setActiveTab] = useState<DiscoverTab>('creators');
  const [platformFilter, setPlatformFilter] = useState<DiscoverPlatformFilter>('all');
  const [creators, setCreators] = useState<CreatorsByPlatform>({
    linkedin: [],
    instagram: [],
    x: [],
  });
  const [writingProfiles, setWritingProfiles] = useState<WritingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const discoveryUnlocked = profile?.discovery_unlocked ?? false;
  const completedDays = Math.min(getDaysWithEntries(), 7);
  const mountedRef = useRef(true);

  const fetchCreators = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('id, creator_name, creator_handle, platform, follower_count, bio, relevance_score')
        .order('relevance_score', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        logger.error('Failed to fetch creator profiles', { error: error.message });
        return;
      }

      const grouped: CreatorsByPlatform = { linkedin: [], instagram: [], x: [] };
      for (const item of data ?? []) {
        const p = item.platform as Platform;
        if (p in grouped) grouped[p].push(item as CreatorCardData);
      }
      setCreators(grouped);
    } catch (err) {
      if (!mountedRef.current) return;
      logger.error('Unexpected error fetching creators', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const fetchWritingProfiles = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('writing_profiles')
        .select('id, platform, tone, hook_style, typical_length, example_hooks')
        .eq('user_id', profile.id);

      if (!mountedRef.current) return;

      if (error) {
        logger.warn('Failed to fetch writing profiles', { error: error.message });
        return;
      }
      setWritingProfiles((data ?? []) as WritingProfile[]);
    } catch (err) {
      if (!mountedRef.current) return;
      logger.error('Unexpected error fetching writing profiles', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [profile?.id]);

  useEffect(() => {
    if (discoveryUnlocked) {
      void fetchCreators();
      void fetchWritingProfiles();
    }
    return () => { mountedRef.current = false; };
  }, [discoveryUnlocked, fetchCreators, fetchWritingProfiles]);

  const handleCreatorPress = useCallback(
    (id: string) => router.push(`/discover/${id}`),
    [router],
  );

  const handleGoToDiary = useCallback(
    () => router.push('/(tabs)/diary'),
    [router],
  );

  // ─── Locked ───────────────────────────────────────────────────────────────
  if (!discoveryUnlocked) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={['top']}
        testID="discover-locked-screen"
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textMuted }]}>Discover</Text>
        </View>
        <DiscoverLockedView
          completedDays={completedDays}
          onGoToDiary={handleGoToDiary}
        />
      </SafeAreaView>
    );
  }

  // ─── Unlocked ─────────────────────────────────────────────────────────────
  const visibleSections =
    platformFilter === 'all'
      ? PLATFORM_SECTIONS
      : PLATFORM_SECTIONS.filter((s) => s.platform === platformFilter);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
      testID="discover-screen"
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Discover</Text>
        <Pressable
          onPress={() => void fetchCreators(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Refresh creators"
          testID="discover-refresh-btn"
        >
          <Text style={[styles.refreshIcon, { color: colors.textSecondary }]}>{'↻'}</Text>
        </Pressable>
      </View>

      {/* Segment control */}
      <View style={[styles.segmentBar, { borderBottomColor: colors.border }]}>
        {(['creators', 'voice'] as DiscoverTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'creators' ? 'Creators' : 'Your Voice';
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.segmentBtn,
                isActive && [styles.segmentBtnActive, { borderBottomColor: colors.accent }],
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              testID={`segment-${tab}`}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: isActive ? colors.accent : colors.textMuted },
                  isActive && { fontFamily: fontFamily.semiBold },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Creators tab */}
      {activeTab === 'creators' && (
        <FlatList
          data={visibleSections}
          keyExtractor={(item) => item.platform}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void fetchCreators(true)}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <PlatformFilter selected={platformFilter} onSelect={setPlatformFilter} />
            </View>
          }
          renderItem={({ item: section }) => {
            const sectionCreators = creators[section.platform];
            return (
              <View style={styles.section} testID={`section-${section.platform}`}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {section.label}
                </Text>
                {isLoading ? (
                  <ActivityIndicator color={colors.accent} style={styles.sectionLoader} />
                ) : sectionCreators.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      No creators found yet.
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={sectionCreators}
                    keyExtractor={(c) => c.id}
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
      )}

      {/* Your Voice tab */}
      {activeTab === 'voice' && <DiscoverVoiceTab profiles={writingProfiles} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  refreshIcon: {
    fontSize: 22,
  },
  segmentBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentBtnActive: {
    borderBottomWidth: 2,
  },
  segmentLabel: {
    ...typography.bodyMd,
  },
  listHeader: {
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.headingMd,
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
  },
  cardSeparator: {
    height: spacing.sm,
  },
});
