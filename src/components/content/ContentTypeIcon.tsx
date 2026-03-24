import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
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
  const { colors } = useTheme();
  const config = CONTENT_TYPE_CONFIG[contentType];

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
      testID={testID ?? `content-type-icon-${contentType}`}
      accessibilityLabel={`Content type: ${config.label}`}
    >
      <Text style={{ fontSize: 13 }}>{config.emoji}</Text>
      <Text style={[typography.bodySm, { color: colors.textSecondary }]}>{config.label}</Text>
    </View>
  );
});
