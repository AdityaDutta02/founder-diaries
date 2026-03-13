import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContentStore } from '@/stores/contentStore';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { PlatformBadge } from '@/components/content/PlatformBadge';
import { ContentTypeIcon } from '@/components/content/ContentTypeIcon';
import { ImageGenerationPreview } from '@/components/content/ImageGenerationPreview';
import { CarouselPreview } from '@/components/content/CarouselPreview';
import { ThreadPreview } from '@/components/content/ThreadPreview';
import { PostEditor } from '@/components/content/PostEditor';
import { PostActionBar } from '@/components/content/PostActionBar';

const STATUS_COLORS: Record<string, string> = {
  draft: colors.warning,
  approved: colors.success,
  scheduled: colors.info,
  posted: colors.gray[500],
  rejected: colors.error,
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  posted: 'Posted',
  rejected: 'Rejected',
};

function formatDiaryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PostDetail() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = useContentStore((state) =>
    state.posts.find((p) => p.id === postId),
  );
  const updatePost = useContentStore((state) => state.updatePost);

  const [isEditMode, setIsEditMode] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const statusColor = post ? STATUS_COLORS[post.status] : colors.gray[400];
  const statusLabel = post ? STATUS_LABELS[post.status] : '';

  const handleApprove = useCallback(async () => {
    if (!post) return;
    const { error } = await supabase
      .from('generated_posts')
      .update({ status: 'approved' })
      .eq('id', post.id);
    if (error) {
      Alert.alert('Error', 'Failed to approve post. Please try again.');
      return;
    }
    updatePost(post.id, { status: 'approved' });
  }, [post, updatePost]);

  const handleReject = useCallback(async () => {
    if (!post) return;
    const { error } = await supabase
      .from('generated_posts')
      .update({ status: 'rejected' })
      .eq('id', post.id);
    if (error) {
      Alert.alert('Error', 'Failed to reject post. Please try again.');
      return;
    }
    updatePost(post.id, { status: 'rejected' });
  }, [post, updatePost]);

  const handleEdit = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleSaveEdit = useCallback(
    async (updatedText: string) => {
      if (!post) return;
      const { error } = await supabase
        .from('generated_posts')
        .update({ body_text: updatedText, user_edits: updatedText })
        .eq('id', post.id);
      if (error) {
        Alert.alert('Error', 'Failed to save changes. Please try again.');
        return;
      }
      updatePost(post.id, { body_text: updatedText, user_edits: updatedText });
      setIsEditMode(false);
    },
    [post, updatePost],
  );

  const handleRegenerate = useCallback(async () => {
    setImageLoading(true);
    // Image regeneration would be handled by a backend function call
    // For now we just toggle the loading state as a placeholder
    setTimeout(() => setImageLoading(false), 1500);
  }, []);

  const handleUseMyImage = useCallback(() => {
    // Navigation to image picker modal is handled separately
    // when modal screens are implemented

  }, [router]);

  const contentArea = useMemo(() => {
    if (!post) return null;
    if (isEditMode && post.content_type === 'post') {
      return (
        <PostEditor
          post={post}
          platform={post.platform}
          onSave={handleSaveEdit}
        />
      );
    }
    if (post.content_type === 'carousel' && post.carousel_slides) {
      return <CarouselPreview slides={post.carousel_slides} />;
    }
    if (post.content_type === 'thread' && post.thread_tweets) {
      return <ThreadPreview tweets={post.thread_tweets} />;
    }
    return (
      <View style={styles.bodyContainer} testID="post-body-text">
        <Text style={styles.bodyText}>{post.body_text}</Text>
        <Text style={styles.charCount} testID="char-count">
          {post.body_text.length} chars
        </Text>
      </View>
    );
  }, [post, isEditMode, handleSaveEdit]);

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Post not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']} testID="post-detail">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Platform + type + status row */}
        <View style={styles.metaRow}>
          <PlatformBadge platform={post.platform} />
          <ContentTypeIcon contentType={post.content_type} />
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}
            testID="post-status"
          >
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Title */}
        {post.title ? (
          <Text style={styles.title} testID="post-title">
            {post.title}
          </Text>
        ) : null}

        {/* Image preview */}
        {(post.generated_image_url || post.content_type === 'post') ? (
          <ImageGenerationPreview
            imageUrl={post.generated_image_url}
            isLoading={imageLoading}
            onRegenerate={handleRegenerate}
            onUseMyImage={handleUseMyImage}
          />
        ) : null}

        {/* Content area */}
        {contentArea}

        {/* Diary reference */}
        {post.diary_entry_id ? (
          <Text style={styles.diaryRef} testID="diary-ref">
            From diary: {formatDiaryDate(post.created_at)}
          </Text>
        ) : null}
      </ScrollView>

      <PostActionBar
        status={post.status}
        onApprove={handleApprove}
        onEdit={handleEdit}
        onReject={handleReject}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 9999,
  },
  statusText: {
    ...typography.label,
    fontWeight: '600',
  },
  title: {
    ...typography.headingLg,
    color: colors.gray[900],
  },
  bodyContainer: {
    gap: spacing.xs,
  },
  bodyText: {
    ...typography.bodyLg,
    color: colors.gray[900],
    lineHeight: 26,
  },
  charCount: {
    ...typography.bodySm,
    color: colors.gray[400],
    textAlign: 'right',
  },
  diaryRef: {
    ...typography.bodyMd,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
  notFound: {
    ...typography.bodyLg,
    color: colors.gray[500],
    textAlign: 'center',
    padding: spacing['3xl'],
  },
});
