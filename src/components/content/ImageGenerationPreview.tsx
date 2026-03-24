import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
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
  const { colors } = useTheme();

  return (
    <View style={styles.container} testID={testID ?? 'image-generation-preview'}>
      {isLoading ? (
        <View
          style={[styles.skeleton, { backgroundColor: colors.surface2 }]}
          testID="image-skeleton"
        />
      ) : imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel="Generated post image"
          testID="generated-image"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          testID="image-placeholder"
        >
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            No image generated yet
          </Text>
        </View>
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
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  placeholderText: {
    ...typography.bodySm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
