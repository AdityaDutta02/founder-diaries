import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import type { Platform } from '@/types/database';
import { PlatformBadge } from './PlatformBadge';

export interface CreatorCardData {
  id: string;
  creator_name: string | null;
  creator_handle: string;
  platform: Platform;
  follower_count: number | null;
  bio: string | null;
  relevance_score: number | null;
}

interface CreatorCardProps {
  creator: CreatorCardData;
  onPress: (id: string) => void;
  testID?: string;
}

function formatFollowerCount(count: number | null): string {
  if (count === null) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K`;
  return String(count);
}

export const CreatorCard = memo(function CreatorCard({
  creator,
  onPress,
  testID,
}: CreatorCardProps) {
  const { colors } = useTheme();
  const displayName = creator.creator_name ?? creator.creator_handle;
  const followerText = formatFollowerCount(creator.follower_count);
  const relevancePct =
    creator.relevance_score !== null
      ? `${Math.round(creator.relevance_score * 100)}%`
      : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => onPress(creator.id)}
      accessibilityRole="button"
      accessibilityLabel={`View ${displayName}'s profile`}
      testID={testID ?? `creator-card-${creator.id}`}
    >
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[styles.avatar, { backgroundColor: colors.surface2 }]}
            testID="creator-avatar"
          >
            <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.platformBadgeOverlay}>
            <PlatformBadge platform={creator.platform} size="sm" />
          </View>
        </View>

        {/* Center info */}
        <View style={styles.centerInfo}>
          <Text
            style={[styles.name, { color: colors.textPrimary }]}
            numberOfLines={1}
            testID="creator-name"
          >
            {displayName}
          </Text>
          <Text
            style={[styles.handle, { color: colors.textSecondary }]}
            numberOfLines={1}
            testID="creator-handle"
          >
            @{creator.creator_handle}
            {followerText ? (
              <Text style={[styles.followers, { color: colors.textMuted }]}>
                {`  \u2022  ${followerText}`}
              </Text>
            ) : null}
          </Text>
        </View>

        {/* Relevance badge */}
        {relevancePct !== null && (
          <View
            style={[styles.relevanceBadge, { backgroundColor: colors.accentLight }]}
            testID="creator-relevance"
          >
            <Text style={[styles.relevanceText, { color: colors.accent }]}>
              {relevancePct}
            </Text>
          </View>
        )}
      </View>

      {/* Bio */}
      {creator.bio ? (
        <Text
          style={[styles.bio, { color: colors.textSecondary }]}
          numberOfLines={2}
          testID="creator-bio"
        >
          {creator.bio}
        </Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.headingSm,
  },
  platformBadgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  centerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.headingSm,
  },
  handle: {
    ...typography.bodySm,
  },
  followers: {
    ...typography.bodySm,
  },
  relevanceBadge: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  relevanceText: {
    ...typography.bodySm,
  },
  bio: {
    ...typography.bodySm,
  },
});
