import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { GeneratedPost } from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { PlatformBadge } from './PlatformBadge';
import { ContentTypeIcon } from './ContentTypeIcon';

interface PostCardProps {
  post: GeneratedPost;
  onPress: () => void;
  compact?: boolean;
  testID?: string;
}

const STATUS_COLORS: Record<GeneratedPost['status'], string> = {
  draft: colors.warning,
  approved: colors.success,
  scheduled: colors.info,
  posted: colors.gray[500],
  rejected: colors.error,
};

const STATUS_LABELS: Record<GeneratedPost['status'], string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  posted: 'Posted',
  rejected: 'Rejected',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const PostCard = memo(function PostCard({
  post,
  onPress,
  compact = false,
  testID,
}: PostCardProps) {
  const statusColor = STATUS_COLORS[post.status];
  const statusLabel = STATUS_LABELS[post.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={testID ?? `post-card-${post.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${post.platform} ${post.content_type} post: ${post.title ?? post.body_text}`}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <PlatformBadge platform={post.platform} size="sm" />
          <ContentTypeIcon contentType={post.content_type} />
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}
          testID={`post-status-${post.id}`}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Content row */}
      <View style={styles.contentRow}>
        <View style={styles.textContent}>
          {post.title ? (
            <Text style={styles.title} numberOfLines={2} testID={`post-title-${post.id}`}>
              {post.title}
            </Text>
          ) : null}
          <Text
            style={styles.bodyText}
            numberOfLines={3}
            testID={`post-body-${post.id}`}
          >
            {post.body_text}
          </Text>
        </View>

        {!compact && post.generated_image_url ? (
          <Image
            source={{ uri: post.generated_image_url }}
            style={styles.thumbnail}
            contentFit="cover"
            accessibilityLabel="Generated post image"
            testID={`post-image-${post.id}`}
          />
        ) : null}
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        {post.diary_entry_id ? (
          <Text style={styles.metaText} testID={`post-diary-ref-${post.id}`}>
            From diary
          </Text>
        ) : null}
        <Text style={styles.metaText} testID={`post-created-${post.id}`}>
          {formatDate(post.created_at)} · {formatTime(post.created_at)}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  pressed: {
    opacity: 0.95,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.label,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  textContent: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  bodyText: {
    ...typography.bodyMd,
    color: colors.gray[500],
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
});
