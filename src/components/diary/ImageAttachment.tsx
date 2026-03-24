import React, { memo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

interface DiaryImage {
  local_id: string;
  uri: string;
}

interface ImageAttachmentProps {
  images: DiaryImage[];
  onRemove: (local_id: string) => void;
  onAdd: () => void;
  testID?: string;
}

export const ImageAttachment = memo(function ImageAttachment({
  images,
  onRemove,
  onAdd,
  testID,
}: ImageAttachmentProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs }}
      testID={testID ?? 'image-attachment'}
    >
      {images.map((image) => (
        <View
          key={image.local_id}
          style={{ position: 'relative', width: 64, height: 64 }}
          testID={`image-thumbnail-${image.local_id}`}
        >
          <Image
            source={{ uri: image.uri }}
            style={{ width: 64, height: 64, borderRadius: borderRadius.md }}
            contentFit="cover"
            accessibilityLabel="Attached image"
          />
          <Pressable
            onPress={() => onRemove(image.local_id)}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: borderRadius.full,
              backgroundColor: colors.error,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Remove image"
            testID={`image-remove-${image.local_id}`}
          >
            <Text style={{ color: colors.white, fontSize: 16, lineHeight: 20, fontWeight: '700', marginTop: -2 }}>
              {'×'}
            </Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={onAdd}
        style={{
          width: 64,
          height: 64,
          borderRadius: borderRadius.md,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: colors.border,
          borderStyle: 'dashed',
        }}
        accessibilityRole="button"
        accessibilityLabel="Add image"
        testID="image-add-button"
      >
        <Text style={[typography.headingMd, { color: colors.textMuted }]}>{'+'}</Text>
      </Pressable>
    </ScrollView>
  );
});
