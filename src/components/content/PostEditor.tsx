import React, { memo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { GeneratedPost } from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';

type Platform = GeneratedPost['platform'];

const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  linkedin: 3000,
  instagram: 2200,
  x: 280,
};

interface PostEditorProps {
  post: GeneratedPost;
  platform: Platform;
  onSave: (updatedText: string) => void;
  testID?: string;
}

export const PostEditor = memo(function PostEditor({
  post,
  platform,
  onSave,
  testID,
}: PostEditorProps) {
  const [text, setText] = useState(post.body_text);
  const limit = PLATFORM_CHAR_LIMITS[platform];
  const count = text.length;
  const isOverLimit = count > limit;

  return (
    <View style={styles.container} testID={testID ?? 'post-editor'}>
      <TextInput
        style={[styles.input, isOverLimit && styles.inputError]}
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        placeholderTextColor={colors.gray[400]}
        placeholder="Edit your post..."
        testID="post-editor-input"
        accessibilityLabel="Post content editor"
      />
      <View style={styles.footer}>
        <Text
          style={[styles.counter, isOverLimit && styles.counterError]}
          testID="post-editor-counter"
        >
          {count} / {limit}
        </Text>
        <Button
          label="Save"
          variant="primary"
          size="sm"
          onPress={() => onSave(text)}
          disabled={isOverLimit}
          testID="post-editor-save"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.gray[900],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  inputError: {
    borderColor: colors.error,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  counterError: {
    color: colors.error,
    fontWeight: '600',
  },
});
