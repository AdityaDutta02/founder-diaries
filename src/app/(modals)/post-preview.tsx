import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { useContentStore } from '@/stores/contentStore';
import type { GeneratedPost, Platform, PostStatus } from '@/types/database';
import { PlatformBadge } from '@/components/discover/PlatformBadge';

// ─── Platform-specific mocks ────────────────────────────────────────────────

interface LinkedInMockProps {
  post: GeneratedPost;
}

function LinkedInMock({ post }: LinkedInMockProps) {
  return (
    <View style={linkedInStyles.container} testID="linkedin-mock">
      {/* Profile header */}
      <View style={linkedInStyles.header}>
        <View style={linkedInStyles.avatar}>
          <Text style={linkedInStyles.avatarText}>FD</Text>
        </View>
        <View style={linkedInStyles.headerInfo}>
          <Text style={linkedInStyles.authorName}>Founder Diaries</Text>
          <Text style={linkedInStyles.authorMeta}>Founder • 1st+</Text>
          <Text style={linkedInStyles.timestamp}>Just now • 🌐</Text>
        </View>
      </View>

      {/* Post text */}
      <Text style={linkedInStyles.postText}>{post.body_text}</Text>

      {/* Image if available */}
      {post.generated_image_url ? (
        <Image
          source={{ uri: post.generated_image_url }}
          style={linkedInStyles.image}
          resizeMode="cover"
          testID="linkedin-image"
        />
      ) : null}

      {/* Reaction bar */}
      <View style={linkedInStyles.reactionBar}>
        <Text style={linkedInStyles.reactions}>👍 ❤️ 💡</Text>
        <Text style={linkedInStyles.reactionCount}>Be the first to react</Text>
      </View>

      <View style={linkedInStyles.actionBar}>
        {['Like', 'Comment', 'Repost', 'Send'].map((action) => (
          <Text key={action} style={linkedInStyles.actionButton}>
            {action}
          </Text>
        ))}
      </View>
    </View>
  );
}

const linkedInStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.platform.linkedin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    ...typography.headingSm,
    color: colors.gray[900],
    fontSize: 15,
  },
  authorMeta: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  timestamp: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
  postText: {
    ...typography.bodyMd,
    color: colors.gray[900],
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    lineHeight: 22,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: colors.gray[100],
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  reactions: {
    fontSize: 14,
  },
  reactionCount: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    ...typography.bodySm,
    color: colors.gray[500],
    fontWeight: '600',
  },
});

// ─── Instagram Mock ──────────────────────────────────────────────────────────

interface InstagramMockProps {
  post: GeneratedPost;
}

function InstagramMock({ post }: InstagramMockProps) {
  return (
    <View style={instagramStyles.container} testID="instagram-mock">
      {/* Profile header */}
      <View style={instagramStyles.header}>
        <View style={instagramStyles.avatarRing}>
          <View style={instagramStyles.avatar}>
            <Text style={instagramStyles.avatarText}>FD</Text>
          </View>
        </View>
        <Text style={instagramStyles.username}>founder_diaries</Text>
        <Text style={instagramStyles.moreIcon}>···</Text>
      </View>

      {/* Image placeholder or actual image */}
      <View style={instagramStyles.imagePlaceholder} testID="instagram-image-area">
        {post.generated_image_url ? (
          <Image
            source={{ uri: post.generated_image_url }}
            style={instagramStyles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={instagramStyles.imagePlaceholderText}>📸</Text>
        )}
      </View>

      {/* Action icons */}
      <View style={instagramStyles.actions}>
        <View style={instagramStyles.actionsLeft}>
          <Text style={instagramStyles.actionIcon}>🤍</Text>
          <Text style={instagramStyles.actionIcon}>💬</Text>
          <Text style={instagramStyles.actionIcon}>↗</Text>
        </View>
        <Text style={instagramStyles.actionIcon}>🔖</Text>
      </View>

      {/* Caption */}
      <View style={instagramStyles.caption}>
        <Text style={instagramStyles.captionAuthor}>founder_diaries</Text>
        <Text style={instagramStyles.captionText} numberOfLines={3}>
          {' '}{post.body_text}
        </Text>
      </View>
    </View>
  );
}

const instagramStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.platform.instagram,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.platform.instagram,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  username: {
    ...typography.headingSm,
    color: colors.gray[900],
    fontSize: 14,
    flex: 1,
  },
  moreIcon: {
    fontSize: 18,
    color: colors.gray[900],
    letterSpacing: 1,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  image: {
    width: '100%',
    height: 300,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionIcon: {
    fontSize: 24,
  },
  caption: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
  },
  captionAuthor: {
    ...typography.headingSm,
    color: colors.gray[900],
    fontSize: 14,
  },
  captionText: {
    ...typography.bodyMd,
    color: colors.gray[700],
    flex: 1,
    flexWrap: 'wrap',
  },
});

// ─── X (Twitter) Mock ────────────────────────────────────────────────────────

interface XMockProps {
  post: GeneratedPost;
}

function XMock({ post }: XMockProps) {
  return (
    <View style={xStyles.container} testID="x-mock">
      <View style={xStyles.header}>
        <View style={xStyles.avatar}>
          <Text style={xStyles.avatarText}>FD</Text>
        </View>
        <View style={xStyles.headerInfo}>
          <View style={xStyles.nameRow}>
            <Text style={xStyles.displayName}>Founder Diaries</Text>
            <Text style={xStyles.handle}>@founder_diaries</Text>
          </View>
        </View>
        <Text style={xStyles.xLogo}>✖</Text>
      </View>

      <Text style={xStyles.tweetText}>{post.body_text}</Text>

      {post.generated_image_url ? (
        <Image
          source={{ uri: post.generated_image_url }}
          style={xStyles.image}
          resizeMode="cover"
          testID="x-image"
        />
      ) : null}

      <Text style={xStyles.timestamp}>Just now · Twitter for iPhone</Text>

      <View style={xStyles.stats}>
        <Text style={xStyles.statText}>0 Reposts</Text>
        <Text style={xStyles.statText}>0 Quotes</Text>
        <Text style={xStyles.statText}>0 Likes</Text>
      </View>

      <View style={xStyles.actions}>
        {['💬', '🔁', '❤️', '↗️'].map((icon) => (
          <Text key={icon} style={xStyles.actionIcon}>
            {icon}
          </Text>
        ))}
      </View>
    </View>
  );
}

const xStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.md,
    overflow: 'hidden',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.platform.x,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  displayName: {
    ...typography.headingSm,
    color: colors.gray[900],
    fontSize: 15,
  },
  handle: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  xLogo: {
    fontSize: 18,
    color: colors.gray[900],
    fontWeight: '700',
  },
  tweetText: {
    ...typography.bodyMd,
    color: colors.gray[900],
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginBottom: spacing.sm,
  },
  timestamp: {
    ...typography.bodySm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  statText: {
    ...typography.bodySm,
    color: colors.gray[700],
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
  },
});

// ─── Status badge color map ──────────────────────────────────────────────────

const STATUS_BADGE_STYLES: Record<PostStatus, { backgroundColor: string }> = {
  draft: { backgroundColor: colors.gray[400] },
  approved: { backgroundColor: colors.success },
  scheduled: { backgroundColor: colors.info },
  posted: { backgroundColor: colors.primary[500] },
  rejected: { backgroundColor: colors.error },
};

// ─── Main Modal ──────────────────────────────────────────────────────────────

type PlatformLabel = Record<Platform, string>;

const PLATFORM_LABELS: PlatformLabel = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X (Twitter)',
};

export default function PostPreviewModal() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const posts = useContentStore((s) => s.posts);

  const post = useMemo(() => posts.find((p) => p.id === postId) ?? null, [posts, postId]);

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea} testID="post-preview-modal">
        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
          testID="close-preview-button"
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Post not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} testID="post-preview-modal">
      {/* Close button */}
      <Pressable
        style={styles.closeButton}
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close preview"
        testID="close-preview-button"
      >
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleRow}>
          <PlatformBadge platform={post.platform} size="md" />
          <Text style={styles.title}>{PLATFORM_LABELS[post.platform]} Preview</Text>
        </View>

        {/* Platform-specific mock */}
        {post.platform === 'linkedin' && <LinkedInMock post={post} />}
        {post.platform === 'instagram' && <InstagramMock post={post} />}
        {post.platform === 'x' && <XMock post={post} />}

        {/* Meta info */}
        <View style={styles.metaCard} testID="post-meta-card">
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <View style={[styles.statusBadge, STATUS_BADGE_STYLES[post.status]]}>
              <Text style={styles.statusText}>{post.status}</Text>
            </View>
          </View>
          {post.content_type && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={styles.metaValue}>{post.content_type}</Text>
            </View>
          )}
          {post.scheduled_for && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Scheduled</Text>
              <Text style={styles.metaValue}>
                {new Date(post.scheduled_for).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  closeButton: {
    position: 'absolute',
    top: spacing['3xl'],
    left: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  closeIcon: {
    fontSize: 20,
    color: colors.gray[700],
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.headingMd,
    color: colors.gray[900],
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...typography.bodyMd,
    color: colors.gray[400],
  },
  metaCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    ...typography.bodySm,
    color: colors.gray[500],
    fontWeight: '500',
  },
  metaValue: {
    ...typography.bodySm,
    color: colors.gray[700],
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  statusText: {
    ...typography.bodySm,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
