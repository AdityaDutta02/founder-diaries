import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { format } from 'date-fns';
import type { LocalDiaryEntry, LocalDiaryImage } from '@/stores/diaryStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoodSelector } from './MoodSelector';
import { ImageAttachment } from './ImageAttachment';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

type EntryFormData = Pick<LocalDiaryEntry, 'text_content' | 'mood' | 'audio_local_uri' | 'images'>;

interface DiaryEntryFormProps {
  initialEntry?: Partial<EntryFormData>;
  onSave: (data: EntryFormData) => void;
  onRecordAudio: () => void;
  onPickImage: () => void;
  isLoading?: boolean;
  audioUri?: string | null;
  images?: LocalDiaryImage[];
  entryDate?: Date;
  testID?: string;
}

export const DiaryEntryForm = memo(function DiaryEntryForm({
  initialEntry,
  onSave,
  onRecordAudio,
  onPickImage,
  isLoading = false,
  audioUri,
  images = [],
  entryDate,
  testID,
}: DiaryEntryFormProps) {
  const { colors } = useTheme();

  const [textContent, setTextContent] = useState<string>(
    initialEntry?.text_content ?? '',
  );
  const [mood, setMood] = useState<string | null>(initialEntry?.mood ?? null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [localImages, setLocalImages] = useState<LocalDiaryImage[]>(
    initialEntry?.images ?? images,
  );

  // Sync when parent adds new images (e.g. from image picker modal)
  useEffect(() => {
    if (images.length > localImages.length) {
      setLocalImages(images);
    }
  }, [images]);

  const displayDate = entryDate ?? new Date();
  const formattedDate = format(displayDate, 'EEEE, MMMM d, yyyy');

  const handleRemoveImage = useCallback((local_id: string) => {
    setLocalImages((prev) => prev.filter((img) => img.local_id !== local_id));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      text_content: textContent.trim() || null,
      mood,
      audio_local_uri: audioUri ?? null,
      images: localImages,
    });
  }, [onSave, textContent, mood, audioUri, localImages]);

  const toggleMoodSelector = useCallback(() => {
    setShowMoodSelector((prev) => !prev);
  }, []);

  const imageItems = localImages.map((img) => ({
    local_id: img.local_id,
    uri: img.local_uri,
  }));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: spacing.lg,
        gap: spacing.lg,
        paddingBottom: 24,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      testID={testID ?? 'diary-entry-form'}
    >
      {/* Date display */}
      <Text
        style={{ ...typography.label, color: colors.textMuted }}
        testID="form-date-label"
      >
        {formattedDate}
      </Text>

      {/* Text input */}
      <Input
        value={textContent}
        onChangeText={setTextContent}
        placeholder="What happened today?"
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        containerStyle={{ minHeight: 160 }}
        testID="diary-text-input"
      />

      {/* Section separator */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
        }}
      />

      {/* Action row */}
      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.label, color: colors.textMuted }}>
          Attachments
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              onPress={onRecordAudio}
              style={{
                width: 44,
                height: 44,
                borderRadius: borderRadius.md,
                backgroundColor: audioUri ? colors.accentLight : colors.surface2,
                borderWidth: 1,
                borderColor: audioUri ? colors.accent : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Record audio"
              testID="action-mic"
            >
              <Text style={{ fontSize: 20 }}>{'🎤'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onPickImage}
            style={{
              width: 44,
              height: 44,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Add image"
            testID="action-camera"
          >
            <Text style={{ fontSize: 20 }}>{'📷'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleMoodSelector}
            style={{
              width: 44,
              height: 44,
              borderRadius: borderRadius.md,
              backgroundColor: mood ? colors.accentLight : colors.surface2,
              borderWidth: 1,
              borderColor: mood ? colors.accent : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Select mood"
            testID="action-mood"
          >
            <Text style={{ fontSize: 20 }}>{'🙂'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio preview — native only */}
      {Platform.OS !== 'web' && audioUri ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface2,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
            gap: spacing.md,
          }}
          testID="audio-preview"
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.bodyMd, color: colors.accent, letterSpacing: 2 }}>
              {'▬▬▬▬▬▬▬▬'}
            </Text>
          </View>
          <Text style={{ ...typography.bodySm, color: colors.textMuted }}>
            Audio recorded
          </Text>
        </View>
      ) : null}

      {/* Image previews */}
      {localImages.length > 0 || imageItems.length > 0 ? (
        <ImageAttachment
          images={imageItems}
          onRemove={handleRemoveImage}
          onAdd={onPickImage}
          testID="form-image-attachment"
        />
      ) : null}

      {/* Section separator before mood */}
      {showMoodSelector || mood ? (
        <View style={{ height: 1, backgroundColor: colors.border }} />
      ) : null}

      {/* Mood section label */}
      {(showMoodSelector || mood) ? (
        <Text style={{ ...typography.label, color: colors.textMuted }}>
          Mood
        </Text>
      ) : null}

      {/* Mood selector */}
      {showMoodSelector ? (
        <MoodSelector
          selected={mood}
          onSelect={(selected) => {
            setMood(selected);
            setShowMoodSelector(false);
          }}
          testID="form-mood-selector"
        />
      ) : null}

      {/* Selected mood display */}
      {mood && !showMoodSelector ? (
        <TouchableOpacity
          onPress={toggleMoodSelector}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs }}
          accessibilityRole="button"
          accessibilityLabel={`Current mood: ${mood}. Tap to change.`}
          testID="selected-mood-display"
        >
          <Text style={{ ...typography.bodyMd, color: colors.textMuted }}>Mood: </Text>
          <Text
            style={{
              ...typography.bodyMd,
              color: colors.accent,
              fontWeight: '600',
              textTransform: 'capitalize',
            }}
          >
            {mood}
          </Text>
          <Text style={{ ...typography.bodySm, color: colors.textMuted }}>
            {' (tap to change)'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Save button */}
      <Button
        label="Save Entry"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        onPress={handleSave}
        style={{ marginTop: spacing.md }}
        testID="form-save-button"
      />
    </ScrollView>
  );
});
