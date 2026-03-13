import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';

interface ImageGenerationPreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onUseMyImage: () => void;
  testID?: string;
}

export const ImageGenerationPreview = memo(function ImageGenerationPreview({
  imageUrl,
  isLoading,
  onRegenerate,
  onUseMyImage,
  testID,
}: ImageGenerationPreviewProps) {
  return (
    <View style={styles.container} testID={testID ?? 'image-generation-preview'}>
      {isLoading ? (
        <View style={styles.skeleton} testID="image-skeleton" />
      ) : imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel="Generated post image"
          testID="generated-image"
        />
      ) : (
        <View style={styles.placeholder} testID="image-placeholder" />
      )}

      <View style={styles.actions}>
        <Button
          label="Regenerate"
          variant="ghost"
          size="sm"
          onPress={onRegenerate}
          isLoading={isLoading}
          testID="btn-regenerate"
        />
        <Button
          label="Use my image"
          variant="outline"
          size="sm"
          onPress={onUseMyImage}
          disabled={isLoading}
          testID="btn-use-my-image"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
  },
  skeleton: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[200],
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
