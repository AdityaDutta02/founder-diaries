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
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { logger } from '@/lib/logger';

export default function ImagePickerModal() {
  const { colors } = useTheme();
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="image-picker-modal"
    >
      {/* Modal header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={handleClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close image picker"
          testID="close-image-picker-button"
        >
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[typography.headingSm, { color: colors.textPrimary }]}>Add Photos</Text>
        <Pressable
          onPress={handleDone}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Done"
          testID="done-header-button"
        >
          <Text
            style={[
              typography.bodyMd,
              {
                color:
                  selectedUris.length > 0 ? colors.accent : colors.textMuted,
                fontWeight: '600',
              },
            ]}
          >
            Done{selectedUris.length > 0 ? ` (${selectedUris.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* Action buttons */}
      <View style={[styles.actionButtons, { paddingHorizontal: spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: pressed ? colors.surfacePressed : colors.surface,
              borderColor: pressed ? colors.accent : colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
          onPress={handleTakePhoto}
          accessibilityRole="button"
          testID="take-photo-button"
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={[typography.bodyMd, { color: colors.textSecondary, textAlign: 'center' }]}>
            Take Photo
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: pressed ? colors.surfacePressed : colors.surface,
              borderColor: pressed ? colors.accent : colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
          onPress={handleChooseFromGallery}
          accessibilityRole="button"
          testID="choose-gallery-button"
        >
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={[typography.bodyMd, { color: colors.textSecondary, textAlign: 'center' }]}>
            Choose from Gallery
          </Text>
        </Pressable>
      </View>

      {/* Selected images grid */}
      {selectedUris.length > 0 && (
        <View style={styles.gridSection} testID="selected-images-grid">
          <Text
            style={[
              typography.headingSm,
              { color: colors.textPrimary, marginBottom: spacing.md },
            ]}
          >
            Selected ({selectedUris.length})
          </Text>
          <FlatList
            data={selectedUris}
            keyExtractor={(uri) => uri}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            renderItem={({ item: uri }) => (
              <View
                style={[
                  styles.imageContainer,
                  { borderRadius: borderRadius.md, borderColor: colors.border },
                ]}
                testID={`selected-image-${uri}`}
              >
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
                  <Text style={[styles.removeIcon, { color: colors.white }]}>✕</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      )}

      {/* Footer done button */}
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  actionCard: {
    flex: 1,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  actionIcon: {
    fontSize: 36,
  },
  gridSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  grid: {
    gap: spacing.sm,
  },
  imageContainer: {
    flex: 1,
    margin: spacing.xs / 2,
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
    maxWidth: '32%',
    borderWidth: 1,
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
