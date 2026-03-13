import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      testID={testID ?? 'image-attachment'}
    >
      {images.map((image) => (
        <View key={image.local_id} style={styles.thumbnailContainer} testID={`image-thumbnail-${image.local_id}`}>
          <Image
            source={{ uri: image.uri }}
            style={styles.thumbnail}
            contentFit="cover"
            accessibilityLabel="Attached image"
          />
          <Pressable
            onPress={() => onRemove(image.local_id)}
            style={styles.removeButton}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Remove image"
            testID={`image-remove-${image.local_id}`}
          >
            <Text style={styles.removeIcon}>{'×'}</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={onAdd}
        style={styles.addButton}
        accessibilityRole="button"
        accessibilityLabel="Add image"
        testID="image-add-button"
      >
        <Text style={styles.addIcon}>{'+'}</Text>
      </Pressable>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  removeButton: {
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
  },
  removeIcon: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  addIcon: {
    ...typography.headingMd,
    color: colors.gray[500],
  },
});
