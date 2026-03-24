import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { parseISO } from 'date-fns';
import { useDiaryStore, type LocalDiaryImage } from '@/stores/diaryStore';
import { useUIStore } from '@/stores/uiStore';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';
import { DiaryEntryForm } from '@/components/diary/DiaryEntryForm';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function EditEntryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { localId } = useLocalSearchParams<{ localId: string }>();
  const id = Array.isArray(localId) ? localId[0] : localId;

  const entry = useDiaryStore((state) => (id ? state.entries.get(id) : undefined));
  const { updateEntry } = useDiaryEntry();

  const pendingAudioUri = useUIStore((state) => state.pendingAudioUri);
  const setPendingAudioUri = useUIStore((state) => state.setPendingAudioUri);
  const pendingImageUris = useUIStore((state) => state.pendingImageUris);
  const setPendingImageUris = useUIStore((state) => state.setPendingImageUris);

  const [isSaving, setIsSaving] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(entry?.audio_local_uri ?? null);
  const [images, setImages] = useState<LocalDiaryImage[]>(entry?.images ?? []);

  // Pick up audio URI saved by the recorder modal
  useEffect(() => {
    if (pendingAudioUri !== null) {
      setAudioUri(pendingAudioUri);
      setPendingAudioUri(null);
    }
  }, [pendingAudioUri, setPendingAudioUri]);

  // Pick up image URIs saved by the image picker modal
  useEffect(() => {
    if (pendingImageUris.length > 0) {
      const newImages: LocalDiaryImage[] = pendingImageUris.map((uri) => ({
        local_id: Crypto.randomUUID(),
        diary_local_id: id ?? '',
        local_uri: uri,
        sync_status: 'pending' as const,
        remote_id: null,
        created_at: new Date().toISOString(),
      }));
      setImages((prev) => [...prev, ...newImages]);
      setPendingImageUris([]);
    }
  }, [pendingImageUris, setPendingImageUris, id]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleRecordAudio = useCallback(() => {
    router.push('/(modals)/audio-recorder' as never);
  }, [router]);

  const handlePickImage = useCallback(() => {
    router.push('/(modals)/image-picker' as never);
  }, [router]);

  const handleSave = useCallback(
    async (data: {
      text_content: string | null;
      mood: string | null;
      audio_local_uri: string | null;
      images: LocalDiaryImage[];
    }) => {
      if (!id) return;

      setIsSaving(true);
      try {
        await updateEntry(id, {
          text_content: data.text_content ?? undefined,
          audio_local_uri: data.audio_local_uri ?? undefined,
          mood: data.mood ?? undefined,
        });
        router.back();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save entry';
        Alert.alert('Save Failed', message);
      } finally {
        setIsSaving(false);
      }
    },
    [updateEntry, id, router],
  );

  const ModalHeader = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Pressable
        onPress={handleCancel}
        style={{ paddingVertical: spacing.xs, minWidth: 56 }}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        testID="edit-entry-cancel"
      >
        <Text style={{ ...typography.button, color: colors.textSecondary }}>
          Cancel
        </Text>
      </Pressable>
      <Text style={{ ...typography.headingMd, color: colors.textPrimary }}>
        Edit Entry
      </Text>
      <View style={{ minWidth: 56 }} />
    </View>
  );

  if (!entry || !id) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.background }}
        testID="edit-entry-screen"
      >
        {ModalHeader}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ ...typography.bodyMd, color: colors.textMuted }}>
            Entry not found.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="edit-entry-screen"
    >
      {ModalHeader}

      <DiaryEntryForm
        initialEntry={{
          text_content: entry.text_content,
          mood: entry.mood,
          audio_local_uri: audioUri ?? entry.audio_local_uri,
          images,
        }}
        onSave={handleSave}
        onRecordAudio={handleRecordAudio}
        onPickImage={handlePickImage}
        isLoading={isSaving}
        audioUri={audioUri ?? entry.audio_local_uri}
        images={images}
        entryDate={parseISO(entry.entry_date)}
        testID="edit-entry-form"
      />
    </View>
  );
}
