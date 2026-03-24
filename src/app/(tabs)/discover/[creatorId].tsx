import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { ContentSampleCard, PlatformBadge } from '@/components/discover';
import type { ContentSampleData } from '@/components/discover';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { CreatorProfile } from '@/types/database';

type CreatorDetail = Pick<
  CreatorProfile,
  'id' | 'creator_name' | 'creator_handle' | 'platform' | 'follower_count' | 'bio' | 'relevance_score'
>;

function formatFollowerCount(count: number | null): string {
  if (count === null) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M followers`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K followers`;
  return `${count} followers`;
}

export default function CreatorDetailScreen() {
  const { creatorId } = useLocalSearchParams<{ creatorId: string }>();
  const { colors } = useTheme();

  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [samples, setSamples] = useState<ContentSampleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!creatorId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [profileResult, samplesResult] = await Promise.all([
        supabase
          .from('creator_profiles')
          .select('id, creator_name, creator_handle, platform, follower_count, bio, relevance_score')
          .eq('id', creatorId)
          .single(),
        supabase
          .from('creator_content_samples')
          .select(
            'content_text, likes_count, comments_count, shares_count, engagement_score, posted_at',
          )
          .eq('creator_profile_id', creatorId)
          .order('engagement_score', { ascending: false })
          .limit(20),
      ]);

      if (profileResult.error) {
        logger.error('Failed to fetch creator profile', { error: profileResult.error.message });
        setError('Could not load creator profile.');
        return;
      }

      if (samplesResult.error) {
        logger.warn('Failed to fetch content samples', { error: samplesResult.error.message });
      }

      setCreator(profileResult.data as CreatorDetail);
      setSamples((samplesResult.data ?? []) as ContentSampleData[]);
    } catch (err) {
      logger.error('Unexpected error loading creator detail', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <HeaderBar title="Creator" showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !creator) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <HeaderBar title="Creator" showBack />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error ?? 'Creator not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = creator.creator_name ?? creator.creator_handle;
  const relevancePct =
    creator.relevance_score !== null
      ? `${Math.round(creator.relevance_score * 100)}% match`
      : null;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      testID="creator-detail-screen"
    >
      <HeaderBar title={displayName} showBack />

      <FlatList
        data={samples}
        keyExtractor={(_, index) => String(index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            {/* Large avatar */}
            <View
              style={[styles.avatarLarge, { backgroundColor: colors.surface2 }]}
              testID="creator-avatar-large"
            >
              <Text style={[styles.avatarInitial, { color: colors.accent }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.creatorName, { color: colors.textPrimary }]} testID="creator-detail-name">
              {displayName}
            </Text>
            <Text style={[styles.creatorHandle, { color: colors.textSecondary }]} testID="creator-detail-handle">
              @{creator.creator_handle}
            </Text>

            <View style={styles.metaRow}>
              <PlatformBadge platform={creator.platform} size="md" />
              {creator.follower_count !== null && (
                <Text style={[styles.followerCount, { color: colors.textSecondary }]} testID="creator-detail-followers">
                  {formatFollowerCount(creator.follower_count)}
                </Text>
              )}
              {relevancePct !== null && (
                <View
                  style={[styles.relevanceBadge, { backgroundColor: colors.accentLight }]}
                  testID="creator-detail-relevance"
                >
                  <Text style={[styles.relevanceText, { color: colors.accentText }]}>{relevancePct}</Text>
                </View>
              )}
            </View>

            {creator.bio ? (
              <Text style={[styles.bio, { color: colors.textSecondary }]} testID="creator-detail-bio">
                {creator.bio}
              </Text>
            ) : null}

            {samples.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Performing Posts</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState} testID="samples-empty-state">
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No content samples available yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ContentSampleCard sample={item} />
        )}
      />
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
  errorText: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
  },
  creatorName: {
    ...typography.headingLg,
  },
  creatorHandle: {
    ...typography.bodyMd,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  followerCount: {
    ...typography.bodySm,
  },
  relevanceBadge: {
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  relevanceText: {
    ...typography.bodySm,
    fontWeight: '600',
  },
  bio: {
    ...typography.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    ...typography.headingMd,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  cardSeparator: {
    height: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
  },
});
