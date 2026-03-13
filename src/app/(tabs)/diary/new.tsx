import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { useDiaryStore } from '@/stores/diaryStore';
import { useSyncStore } from '@/stores/syncStore';
import { DiaryEntryForm } from '@/components/diary/DiaryEntryForm';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import type { LocalDiaryEntry, LocalDiaryImage } from '@/stores/diaryStore';

function todayISO(): string {
  return new Date().toISOString().split('T')[0] ?? new Date().toISOString();
}

export default function NewEntryScreen() {
  const router = useRouter();
  const addEntry = useDiaryStore((state) => state.addEntry);
  const incrementPending = useSyncStore((state) => state.incrementPending);

  const [isSaving, setIsSaving] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [images, setImages] = useState<LocalDiaryImage[]>([]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleRecordAudio = useCallback(() => {
    // Navigate to audio recorder modal — to be implemented when audio-recorder modal is created
    router.push('/diary/audio-recorder' as never);
  }, [router]);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      const newImages: LocalDiaryImage[] = await Promise.all(
        result.assets.map(async (asset) => {
          const localId = Crypto.randomUUID();
          return {
            local_id: localId,
            diary_local_id: '',
            local_uri: asset.uri,
            sync_status: 'pending' as const,
            remote_id: null,
            created_at: new Date().toISOString(),
          };
        }),
      );
      setImages((prev) => [...prev, ...newImages]);
    }
  }, []);

  const handleSave = useCallback(
    async (data: {
      text_content: string | null;
      mood: string | null;
      audio_local_uri: string | null;
      images: LocalDiaryImage[];
    }) => {
      if (!data.text_content && !data.audio_local_uri && data.images.length === 0) {
        Alert.alert('Empty Entry', 'Please add some text, audio, or images before saving.');
        return;
      }

      setIsSaving(true);
      try {
        const localId = Crypto.randomUUID();
        const now = new Date().toISOString();
        const entryDate = todayISO();

        const entryImages: LocalDiaryImage[] = data.images.map((img) => ({
          ...img,
          diary_local_id: localId,
        }));

        const entry: LocalDiaryEntry = {
          local_id: localId,
          entry_date: entryDate,
          text_content: data.text_content,
          audio_local_uri: data.audio_local_uri ?? audioUri,
          mood: data.mood,
          sync_status: 'pending',
          remote_id: null,
          created_at: now,
          updated_at: now,
          images: entryImages,
        };

        addEntry(entry);
        incrementPending();
        router.back();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save entry';
        Alert.alert('Save Failed', message);
      } finally {
        setIsSaving(false);
      }
    },
    [addEntry, incrementPending, router, audioUri],
  );

  return (
    <View style={styles.container} testID="new-entry-screen">
      {/* Custom header buttons for modal */}
      <View style={styles.modalHeader}>
        <Pressable
          onPress={handleCancel}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          testID="new-entry-cancel"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Entry</Text>
        <View style={styles.headerSpacer} />
      </View>

      <DiaryEntryForm
        onSave={handleSave}
        onRecordAudio={handleRecordAudio}
        onPickImage={handlePickImage}
        isLoading={isSaving}
        audioUri={audioUri}
        images={images}
        entryDate={new Date()}
        testID="new-entry-form"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerButton: {
    paddingVertical: spacing.xs,
    minWidth: 56,
  },
  cancelText: {
    ...typography.bodyMd,
    color: colors.gray[500],
  },
  headerTitle: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  headerSpacer: {
    minWidth: 56,
  },
});
