import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { GeneratedPost } from '@/stores/contentStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { PlatformBadge } from './PlatformBadge';
import { ContentTypeIcon } from './ContentTypeIcon';

interface PostCardProps {
  post: GeneratedPost;
  onPress: () => void;
  compact?: boolean;
  testID?: string;
}

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
  const { colors } = useTheme();
  const statusLabel = STATUS_LABELS[post.status];

  const platformColor = colors.platform[post.platform];

  function getStatusColors(): { bg: string; text: string } {
    switch (post.status) {
      case 'draft':
        return { bg: colors.surface2, text: colors.textMuted };
      case 'approved':
        return { bg: colors.successLight, text: colors.success };
      case 'scheduled':
        return { bg: colors.infoLight, text: colors.info };
      case 'posted':
        return { bg: colors.surface2, text: colors.textSecondary };
      case 'rejected':
        return { bg: colors.errorLight, text: colors.error };
    }
  }

  const statusColors = getStatusColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.85 },
      ]}
      testID={testID ?? `post-card-${post.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${post.platform} ${post.content_type} post: ${post.title ?? post.body_text}`}
    >
      {/* Left platform accent stripe */}
      <View style={[styles.leftAccent, { backgroundColor: platformColor }]} />

      <View style={styles.innerContent}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <PlatformBadge platform={post.platform} size="sm" />
            <ContentTypeIcon contentType={post.content_type} />
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.bg },
            ]}
            testID={`post-status-${post.id}`}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Content row */}
        <View style={styles.contentRow}>
          <View style={styles.textContent}>
            {post.title ? (
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                numberOfLines={2}
                testID={`post-title-${post.id}`}
              >
                {post.title}
              </Text>
            ) : null}
            <Text
              style={[styles.bodyText, { color: colors.textSecondary }]}
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
            <Text
              style={[styles.metaText, { color: colors.textMuted }]}
              testID={`post-diary-ref-${post.id}`}
            >
              From diary
            </Text>
          ) : null}
          <Text
            style={[styles.metaText, { color: colors.textMuted }]}
            testID={`post-created-${post.id}`}
          >
            {formatDate(post.created_at)} · {formatTime(post.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  leftAccent: {
    width: 3,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  innerContent: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
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
    fontFamily: fontFamily.semibold,
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
  },
  bodyText: {
    ...typography.bodyMd,
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
    ...typography.caption,
  },
});
