import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
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
  const displayName = creator.creator_name ?? creator.creator_handle;
  const followerText = formatFollowerCount(creator.follower_count);
  const relevancePct =
    creator.relevance_score !== null
      ? `${Math.round(creator.relevance_score * 100)}%`
      : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(creator.id)}
      accessibilityRole="button"
      accessibilityLabel={`View ${displayName}'s profile`}
      testID={testID ?? `creator-card-${creator.id}`}
    >
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar} testID="creator-avatar">
            <Text style={styles.avatarInitial}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.platformBadgeOverlay}>
            <PlatformBadge platform={creator.platform} size="sm" />
          </View>
        </View>

        {/* Center info */}
        <View style={styles.centerInfo}>
          <Text style={styles.name} numberOfLines={1} testID="creator-name">
            {displayName}
          </Text>
          <Text style={styles.handle} numberOfLines={1} testID="creator-handle">
            @{creator.creator_handle}
            {followerText ? (
              <Text style={styles.followers}>{`  •  ${followerText}`}</Text>
            ) : null}
          </Text>
        </View>

        {/* Relevance badge */}
        {relevancePct !== null && (
          <View style={styles.relevanceBadge} testID="creator-relevance">
            <Text style={styles.relevanceText}>{relevancePct}</Text>
          </View>
        )}
      </View>

      {/* Bio */}
      {creator.bio ? (
        <Text style={styles.bio} numberOfLines={1} testID="creator-bio">
          {creator.bio}
        </Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.85,
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
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.headingSm,
    color: colors.primary[600],
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
    color: colors.gray[900],
  },
  handle: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  followers: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
  relevanceBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  relevanceText: {
    ...typography.bodySm,
    color: colors.primary[600],
    fontWeight: '600',
  },
  bio: {
    ...typography.bodyMd,
    color: colors.gray[500],
  },
});
