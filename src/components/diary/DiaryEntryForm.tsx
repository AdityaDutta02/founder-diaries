import React, { memo, useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
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
import { colors } from '@/theme/colors';
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
  const [textContent, setTextContent] = useState<string>(
    initialEntry?.text_content ?? '',
  );
  const [mood, setMood] = useState<string | null>(initialEntry?.mood ?? null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [localImages, setLocalImages] = useState<LocalDiaryImage[]>(
    initialEntry?.images ?? images,
  );

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
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      testID={testID ?? 'diary-entry-form'}
    >
      {/* Date display */}
      <Text style={styles.dateLabel} testID="form-date-label">
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
        containerStyle={styles.textInputContainer}
        testID="diary-text-input"
      />

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={onRecordAudio}
          style={[styles.actionButton, audioUri ? styles.actionButtonActive : null]}
          accessibilityRole="button"
          accessibilityLabel="Record audio"
          testID="action-mic"
        >
          <Text style={styles.actionIcon}>{'🎤'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onPickImage}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Add image"
          testID="action-camera"
        >
          <Text style={styles.actionIcon}>{'📷'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleMoodSelector}
          style={[styles.actionButton, mood ? styles.actionButtonActive : null]}
          accessibilityRole="button"
          accessibilityLabel="Select mood"
          testID="action-mood"
        >
          <Text style={styles.actionIcon}>{'🙂'}</Text>
        </TouchableOpacity>
      </View>

      {/* Audio preview */}
      {audioUri ? (
        <View style={styles.audioPreview} testID="audio-preview">
          <View style={styles.waveformPlaceholder}>
            <Text style={styles.waveformText}>{'▬▬▬▬▬▬▬▬'}</Text>
          </View>
          <Text style={styles.audioDuration}>Audio recorded</Text>
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
          style={styles.selectedMoodRow}
          accessibilityRole="button"
          accessibilityLabel={`Current mood: ${mood}. Tap to change.`}
          testID="selected-mood-display"
        >
          <Text style={styles.selectedMoodLabel}>Mood: </Text>
          <Text style={styles.selectedMoodValue}>{mood}</Text>
          <Text style={styles.changeMoodHint}> (tap to change)</Text>
        </TouchableOpacity>
      ) : null}

      {/* Save button */}
      <Button
        label="Save Entry"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        onPress={handleSave}
        style={styles.saveButton}
        testID="form-save-button"
      />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  dateLabel: {
    ...typography.headingSm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  textInputContainer: {
    minHeight: 160,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: colors.primary[100],
  },
  actionIcon: {
    fontSize: 20,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  waveformPlaceholder: {
    flex: 1,
  },
  waveformText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    letterSpacing: 2,
  },
  audioDuration: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  selectedMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  selectedMoodLabel: {
    ...typography.bodyMd,
    color: colors.gray[500],
  },
  selectedMoodValue: {
    ...typography.bodyMd,
    color: colors.primary[600],
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  changeMoodHint: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
