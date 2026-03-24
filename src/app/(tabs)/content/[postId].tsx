import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useContentStore } from '@/stores/contentStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import * as contentGenerationService from '@/services/contentGenerationService';
import { useToast } from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { fontFamily, typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { PlatformBadge } from '@/components/content/PlatformBadge';
import { ContentTypeIcon } from '@/components/content/ContentTypeIcon';
import { ImageGenerationPreview } from '@/components/content/ImageGenerationPreview';
import { CarouselPreview } from '@/components/content/CarouselPreview';
import { ThreadPreview } from '@/components/content/ThreadPreview';
import { PostActionBar } from '@/components/content/PostActionBar';

const CHAR_LIMITS: Record<string, number> = {
  linkedin: 3000,
  instagram: 2200,
  x: 280,
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  carousel: 'Carousel',
  thread: 'Thread',
  reel_caption: 'Reel',
};

function formatDiaryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) ?? []).filter(
    (tag, i, arr) => arr.indexOf(tag) === i,
  );
}

export default function PostDetail() {
  const { colors } = useTheme();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = useContentStore((s) => s.posts.find((p) => p.id === postId));
  const updatePost = useContentStore((s) => s.updatePost);
  const queryClient = useQueryClient();
  const toast = useToast();
  const pendingImageUris = useUIStore((s) => s.pendingImageUris);
  const setPendingImageUris = useUIStore((s) => s.setPendingImageUris);

  const [editText, setEditText] = useState(post?.body_text ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const textInputRef = useRef<TextInput>(null);

  // Sync editText if post loads/changes externally
  useEffect(() => {
    if (post && !isEditing) setEditText(post.body_text);
  }, [post?.body_text, isEditing]);

  // Apply pending image from picker
  useEffect(() => {
    if (pendingImageUris.length === 0 || !postId) return;
    const uri = pendingImageUris[0];
    async function applyImage() {
      const { error } = await supabase
        .from('generated_posts')
        .update({ generated_image_url: uri })
        .eq('id', postId);
      if (error) {
        toast.show('Failed to update image.', 'error');
      } else {
        await queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.show('Image updated', 'success');
      }
      setPendingImageUris([]);
    }
    void applyImage();
  }, [pendingImageUris, postId, queryClient, setPendingImageUris, toast]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveEdit = useCallback(async () => {
    if (!post || isSaving) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('generated_posts')
        .update({ body_text: editText, user_edits: editText })
        .eq('id', post.id);
      if (error) { Alert.alert('Error', 'Failed to save changes.'); return; }
      updatePost(post.id, { body_text: editText, user_edits: editText });
      setIsEditing(false);
      textInputRef.current?.blur();
    } finally {
      setIsSaving(false);
    }
  }, [post, editText, isSaving, updatePost]);

  const handleCancelEdit = useCallback(() => {
    if (post) setEditText(post.body_text);
    setIsEditing(false);
    textInputRef.current?.blur();
  }, [post]);

  const handleRemoveHashtag = useCallback((tag: string) => {
    const updated = editText.replace(new RegExp(`\\s*${tag}`, 'g'), '').trim();
    setEditText(updated);
    setIsEditing(true);
  }, [editText]);

  const handleApprove = useCallback(async () => {
    if (!post) return;
    const { error } = await supabase
      .from('generated_posts')
      .update({ status: 'approved' })
      .eq('id', post.id);
    if (error) { Alert.alert('Error', 'Failed to approve post.'); return; }
    updatePost(post.id, { status: 'approved' });
  }, [post, updatePost]);

  const handleReject = useCallback(async () => {
    if (!post) return;
    const { error } = await supabase
      .from('generated_posts')
      .update({ status: 'rejected' })
      .eq('id', post.id);
    if (error) { Alert.alert('Error', 'Failed to reject post.'); return; }
    updatePost(post.id, { status: 'rejected' });
  }, [post, updatePost]);

  const handleRegenerate = useCallback(async () => {
    if (!postId) return;
    setIsRegenerating(true);
    try {
      await contentGenerationService.regeneratePost(postId);
      await queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.show('Post regenerated', 'success');
    } catch {
      toast.show('Failed to regenerate post.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  }, [postId, queryClient, toast]);

  const handleUseMyImage = useCallback(() => {
    router.push('/(modals)/image-picker' as never);
  }, []);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const charLimit = post ? (CHAR_LIMITS[post.platform] ?? 3000) : 3000;
  const charCount = editText.length;
  const charOverLimit = charCount > charLimit;
  const hashtags = useMemo(() => extractHashtags(editText), [editText]);

  // ─── Not found ─────────────────────────────────────────────────────────────

  if (!post) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>
          Post not found.
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
      testID="post-detail"
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="back-btn"
          style={styles.backBtn}
        >
          <Text style={[styles.backIcon, { color: colors.textSecondary }]}>{'←'}</Text>
        </Pressable>
        <View style={styles.headerMeta}>
          <PlatformBadge platform={post.platform} />
          <ContentTypeIcon contentType={post.content_type} />
          <Text style={[styles.contentTypeLabel, { color: colors.textMuted }]}>
            {CONTENT_TYPE_LABELS[post.content_type] ?? 'Post'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image / Carousel / Thread */}
        {post.content_type === 'carousel' && post.carousel_slides ? (
          <CarouselPreview slides={post.carousel_slides} />
        ) : post.content_type === 'thread' && post.thread_tweets ? (
          <ThreadPreview tweets={post.thread_tweets} />
        ) : (
          <ImageGenerationPreview
            imageUrl={post.generated_image_url}
            isLoading={isRegenerating}
            onRegenerate={handleRegenerate}
            onUseMyImage={handleUseMyImage}
          />
        )}

        {/* Editable text area */}
        <View
          style={[
            styles.textCard,
            {
              backgroundColor: colors.surface,
              borderColor: isEditing ? colors.accent : colors.border,
            },
          ]}
          testID="post-body-text"
        >
          <TextInput
            ref={textInputRef}
            value={editText}
            onChangeText={(v) => { setEditText(v); setIsEditing(true); }}
            onFocus={() => setIsEditing(true)}
            multiline
            textAlignVertical="top"
            style={[styles.textInput, { color: colors.textPrimary }]}
            placeholderTextColor={colors.textMuted}
            testID="post-text-input"
          />
          {/* Char count */}
          <Text
            style={[
              styles.charCount,
              { color: charOverLimit ? colors.error : colors.textMuted },
            ]}
            testID="char-count"
          >
            {charCount.toLocaleString()} / {charLimit.toLocaleString()}
          </Text>
        </View>

        {/* Hashtag chips */}
        {hashtags.length > 0 && (
          <View style={styles.hashtagRow} testID="hashtag-chips">
            {hashtags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => handleRemoveHashtag(tag)}
                style={[
                  styles.hashtagChip,
                  { backgroundColor: colors.accentLight, borderColor: colors.warmBorder },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${tag}`}
                testID={`hashtag-${tag}`}
              >
                <Text style={[styles.hashtagText, { color: colors.accent }]}>{tag}</Text>
                <Text style={[styles.hashtagRemove, { color: colors.accent }]}>{'×'}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Source reference */}
        {post.diary_entry_id ? (
          <Pressable
            style={[styles.sourceRef, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
            testID="source-ref"
          >
            <Text style={styles.sourceEmoji}>{'📔'}</Text>
            <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
              Based on your diary entry from {formatDiaryDate(post.created_at)}
            </Text>
            <Text style={[styles.sourceChevron, { color: colors.textMuted }]}>{'›'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Bottom bar: edit Save/Cancel or action bar */}
      {isEditing ? (
        <View style={[styles.saveBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleCancelEdit}
            style={styles.cancelEditBtn}
            accessibilityRole="button"
            testID="cancel-edit-btn"
          >
            <Text style={[styles.cancelEditText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => void handleSaveEdit()}
            disabled={isSaving}
            style={[styles.saveEditBtn, { backgroundColor: colors.accent, opacity: isSaving ? 0.7 : 1 }]}
            accessibilityRole="button"
            testID="save-edit-btn"
          >
            <Text style={[styles.saveEditText, { color: colors.accentText }]}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <PostActionBar
          status={post.status}
          onApprove={handleApprove}
          onReject={handleReject}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  notFound: { ...typography.bodyLg, textAlign: 'center', padding: spacing['3xl'] },
  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  headerMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  contentTypeLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  headerSpacer: { minWidth: 44 },
  // ─── Scroll ───────────────────────────────────────────────────────────────
  scrollView: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  // ─── Text card ────────────────────────────────────────────────────────────
  textCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
  },
  textInput: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
  },
  charCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
  // ─── Hashtags ─────────────────────────────────────────────────────────────
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  hashtagText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  hashtagRemove: {
    fontSize: 16,
    lineHeight: 18,
    marginTop: -1,
  },
  // ─── Source reference ─────────────────────────────────────────────────────
  sourceRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sourceEmoji: { fontSize: 16 },
  sourceText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  sourceChevron: {
    fontSize: 18,
    lineHeight: 22,
  },
  // ─── Save bar ─────────────────────────────────────────────────────────────
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  cancelEditBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
  },
  saveEditBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEditText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
});
