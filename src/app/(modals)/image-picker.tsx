import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ExpoImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { logger } from '@/lib/logger';

export default function ImagePickerModal() {
  const router = useRouter();
  const setPendingImageUris = useUIStore((s) => s.setPendingImageUris);

  const [selectedUris, setSelectedUris] = useState<string[]>([]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }

      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedUris((prev) => [...prev, uri]);
      }
    } catch (err) {
      logger.error('Failed to take photo', {
        error: err instanceof Error ? err.message : String(err),
      });
      Alert.alert('Error', 'Could not open camera. Please try again.');
    }
  }, []);

  const handleChooseFromGallery = useCallback(async () => {
    try {
      const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to select images.');
        return;
      }

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        setSelectedUris((prev) => {
          const combined = [...prev, ...uris];
          // Deduplicate
          return Array.from(new Set(combined));
        });
      }
    } catch (err) {
      logger.error('Failed to pick images from gallery', {
        error: err instanceof Error ? err.message : String(err),
      });
      Alert.alert('Error', 'Could not open photo library. Please try again.');
    }
  }, []);

  const handleRemoveImage = useCallback((uri: string) => {
    setSelectedUris((prev) => prev.filter((u) => u !== uri));
  }, []);

  const handleDone = useCallback(() => {
    setPendingImageUris(selectedUris);
    router.back();
  }, [selectedUris, setPendingImageUris, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} testID="image-picker-modal">
      {/* Close button */}
      <Pressable
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close image picker"
        testID="close-image-picker-button"
      >
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <Text style={styles.heading}>Add Photos</Text>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={handleTakePhoto}
          accessibilityRole="button"
          testID="take-photo-button"
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionLabel}>Take Photo</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          onPress={handleChooseFromGallery}
          accessibilityRole="button"
          testID="choose-gallery-button"
        >
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionLabel}>Choose from Gallery</Text>
        </Pressable>
      </View>

      {/* Selected images grid */}
      {selectedUris.length > 0 && (
        <View style={styles.gridSection} testID="selected-images-grid">
          <Text style={styles.sectionLabel}>
            Selected ({selectedUris.length})
          </Text>
          <FlatList
            data={selectedUris}
            keyExtractor={(uri) => uri}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            renderItem={({ item: uri }) => (
              <View style={styles.imageContainer} testID={`selected-image-${uri}`}>
                <Image
                  source={{ uri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(uri)}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                  testID={`remove-image-${uri}`}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      )}

      {/* Done button */}
      <View style={styles.footer}>
        <Button
          label={selectedUris.length > 0 ? `Done (${selectedUris.length})` : 'Done'}
          variant="primary"
          fullWidth
          onPress={handleDone}
          testID="done-button"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.gray[700],
  },
  heading: {
    ...typography.headingLg,
    color: colors.gray[900],
    textAlign: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
    ...shadows.sm,
  },
  actionCardPressed: {
    opacity: 0.8,
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  actionIcon: {
    fontSize: 36,
  },
  actionLabel: {
    ...typography.bodyMd,
    color: colors.gray[700],
    fontWeight: '500',
    textAlign: 'center',
  },
  gridSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionLabel: {
    ...typography.headingSm,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  grid: {
    gap: spacing.sm,
  },
  imageContainer: {
    flex: 1,
    margin: spacing.xs / 2,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    maxWidth: '32%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
});
