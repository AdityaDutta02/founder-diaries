import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

type ContentType = 'post' | 'carousel' | 'thread' | 'reel_caption';

interface ContentTypeIconProps {
  contentType: ContentType;
  testID?: string;
}

const CONTENT_TYPE_CONFIG: Record<ContentType, { emoji: string; label: string }> = {
  post: { emoji: '📄', label: 'Post' },
  carousel: { emoji: '📑', label: 'Carousel' },
  thread: { emoji: '🔗', label: 'Thread' },
  reel_caption: { emoji: '🎬', label: 'Reel' },
};

export const ContentTypeIcon = memo(function ContentTypeIcon({
  contentType,
  testID,
}: ContentTypeIconProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];

  return (
    <View
      style={styles.container}
      testID={testID ?? `content-type-icon-${contentType}`}
      accessibilityLabel={`Content type: ${config.label}`}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
});
