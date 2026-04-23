import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { useContentStore } from '@/stores/contentStore';
import type { GeneratedPost, Platform, PostStatus } from '@/types/database';
import { PlatformBadge } from '@/components/discover/PlatformBadge';

// ─── LinkedIn Mock ───────────────────────────────────────────────────────────

interface LinkedInMockProps {
  post: GeneratedPost;
}

function LinkedInMock({ post }: LinkedInMockProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        linkedInStyles.container,
        { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderColor: colors.border },
      ]}
      testID="linkedin-mock"
    >
      {/* Profile header */}
      <View style={linkedInStyles.header}>
        <View style={[linkedInStyles.avatar, { backgroundColor: colors.platform.linkedin }]}>
          <Text style={[linkedInStyles.avatarText, { color: colors.white }]}>FD</Text>
        </View>
        <View style={linkedInStyles.headerInfo}>
          <Text style={[typography.headingSm, { color: colors.textPrimary, fontSize: 15 }]}>
            Founder Diaries
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            Founder • 1st+
          </Text>
          <Text style={[typography.bodySm, { color: colors.textMuted }]}>
            Just now • 🌐
          </Text>
        </View>
      </View>

      {/* Post text */}
      <Text
        style={[
          typography.bodyMd,
          { color: colors.textPrimary, paddingHorizontal: spacing.md, paddingBottom: spacing.md, lineHeight: 22 },
        ]}
      >
        {post.body_text}
      </Text>

      {/* Image if available */}
      {post.generated_image_url ? (
        <Image
          source={{ uri: post.generated_image_url }}
          style={[linkedInStyles.image, { backgroundColor: colors.surface2 }]}
          resizeMode="cover"
          testID="linkedin-image"
        />
      ) : null}

      {/* Reaction bar */}
      <View
        style={[linkedInStyles.reactionBar, { borderTopColor: colors.border }]}
      >
        <Text style={linkedInStyles.reactions}>👍 ❤️ 💡</Text>
        <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
          Be the first to react
        </Text>
      </View>

      <View style={[linkedInStyles.actionBar, { borderTopColor: colors.border }]}>
        {['Like', 'Comment', 'Repost', 'Send'].map((action) => (
          <Text
            key={action}
            style={[typography.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.semibold }]}
          >
            {action}
          </Text>
        ))}
      </View>
    </View>
  );
}

const linkedInStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 220,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reactions: {
    fontSize: 14,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

// ─── Instagram Mock ──────────────────────────────────────────────────────────

interface InstagramMockProps {
  post: GeneratedPost;
}

function InstagramMock({ post }: InstagramMockProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        instagramStyles.container,
        { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderColor: colors.border },
      ]}
      testID="instagram-mock"
    >
      {/* Profile header */}
      <View style={instagramStyles.header}>
        <View
          style={[
            instagramStyles.avatarRing,
            { borderColor: colors.platform.instagram },
          ]}
        >
          <View style={[instagramStyles.avatar, { backgroundColor: colors.platform.instagram }]}>
            <Text style={[instagramStyles.avatarText, { color: colors.white }]}>FD</Text>
          </View>
        </View>
        <Text
          style={[
            typography.headingSm,
            { color: colors.textPrimary, fontSize: 14, flex: 1 },
          ]}
        >
          founder_diaries
        </Text>
        <Text style={[instagramStyles.moreIcon, { color: colors.textPrimary }]}>···</Text>
      </View>

      {/* Image placeholder or actual image */}
      <View
        style={[instagramStyles.imagePlaceholder, { backgroundColor: colors.surface2 }]}
        testID="instagram-image-area"
      >
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
        <Text
          style={[
            typography.headingSm,
            { color: colors.textPrimary, fontSize: 14 },
          ]}
        >
          founder_diaries
        </Text>
        <Text
          style={[typography.bodyMd, { color: colors.textSecondary, flex: 1, flexWrap: 'wrap' }]}
          numberOfLines={3}
        >
          {' '}{post.body_text}
        </Text>
      </View>
    </View>
  );
}

const instagramStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
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
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 12,
  },
  moreIcon: {
    fontSize: 18,
    letterSpacing: 1,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
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
});

// ─── X (Twitter) Mock ────────────────────────────────────────────────────────

interface XMockProps {
  post: GeneratedPost;
}

function XMock({ post }: XMockProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        xStyles.container,
        { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderColor: colors.border },
      ]}
      testID="x-mock"
    >
      <View style={xStyles.header}>
        <View style={[xStyles.avatar, { backgroundColor: colors.platform.x }]}>
          <Text style={[xStyles.avatarText, { color: colors.white }]}>FD</Text>
        </View>
        <View style={xStyles.headerInfo}>
          <View style={xStyles.nameRow}>
            <Text style={[typography.headingSm, { color: colors.textPrimary, fontSize: 15 }]}>
              Founder Diaries
            </Text>
            <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
              @founder_diaries
            </Text>
          </View>
        </View>
        <Text
          style={[xStyles.xLogo, { color: colors.textPrimary }]}
        >
          ✖
        </Text>
      </View>

      <Text
        style={[
          typography.bodyMd,
          { color: colors.textPrimary, lineHeight: 22, marginBottom: spacing.sm },
        ]}
      >
        {post.body_text}
      </Text>

      {post.generated_image_url ? (
        <Image
          source={{ uri: post.generated_image_url }}
          style={[
            xStyles.image,
            { backgroundColor: colors.surface2, borderRadius: borderRadius.md },
          ]}
          resizeMode="cover"
          testID="x-image"
        />
      ) : null}

      <Text
        style={[typography.bodySm, { color: colors.textMuted, marginBottom: spacing.sm }]}
      >
        Just now · Twitter for iPhone
      </Text>

      <View style={[xStyles.stats, { borderTopColor: colors.border }]}>
        <Text style={[typography.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
          0 Reposts
        </Text>
        <Text style={[typography.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
          0 Quotes
        </Text>
        <Text style={[typography.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
          0 Likes
        </Text>
      </View>

      <View style={[xStyles.actions, { borderTopColor: colors.border }]}>
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
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
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
  xLogo: {
    fontSize: 18,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
  },
});

// ─── Status badge color map ──────────────────────────────────────────────────

type StatusColors = Record<PostStatus, string>;

function useStatusBgColors(): StatusColors {
  const { colors } = useTheme();
  return {
    draft: colors.textMuted,
    approved: colors.success,
    scheduled: colors.info,
    posted: colors.accent,
    rejected: colors.error,
  };
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

type PlatformLabel = Record<Platform, string>;

const PLATFORM_LABELS: PlatformLabel = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X (Twitter)',
};

export default function PostPreviewModal() {
  const { colors } = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const posts = useContentStore((s) => s.posts);
  const statusBgColors = useStatusBgColors();

  const post = useMemo(() => posts.find((p) => p.id === postId) ?? null, [posts, postId]);

  if (!post) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        testID="post-preview-modal"
      >
        <Pressable
          style={styles.closeButton}
          onPress={() => router.dismiss()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
          testID="close-preview-button"
        >
          <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
        </Pressable>
        <View style={styles.notFound}>
          <Text style={[typography.bodyMd, { color: colors.textMuted }]}>
            Post not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="post-preview-modal"
    >
      {/* Modal header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => router.dismiss()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
          testID="close-preview-button"
        >
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>Close</Text>
        </Pressable>
        <Text style={[typography.headingSm, { color: colors.textPrimary }]}>
          {PLATFORM_LABELS[post.platform]} Preview
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <PlatformBadge platform={post.platform} size="md" />
          <Text style={[typography.headingMd, { color: colors.textPrimary }]}>
            {PLATFORM_LABELS[post.platform]} Preview
          </Text>
        </View>

        {/* Platform-specific mock */}
        {post.platform === 'linkedin' && <LinkedInMock post={post} />}
        {post.platform === 'instagram' && <InstagramMock post={post} />}
        {post.platform === 'x' && <XMock post={post} />}

        {/* Meta info */}
        <View
          style={[
            styles.metaCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
          testID="post-meta-card"
        >
          <View style={styles.metaRow}>
            <Text style={[typography.bodySm, { color: colors.textMuted, fontFamily: fontFamily.medium }]}>
              Status
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusBgColors[post.status],
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.white, fontFamily: fontFamily.semibold, textTransform: 'capitalize' },
                ]}
              >
                {post.status}
              </Text>
            </View>
          </View>
          {post.content_type && (
            <View style={styles.metaRow}>
              <Text style={[typography.bodySm, { color: colors.textMuted, fontFamily: fontFamily.medium }]}>
                Type
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
                {post.content_type}
              </Text>
            </View>
          )}
          {post.scheduled_for && (
            <View style={styles.metaRow}>
              <Text style={[typography.bodySm, { color: colors.textMuted, fontFamily: fontFamily.medium }]}>
                Scheduled
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 60,
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
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCard: {
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
});
