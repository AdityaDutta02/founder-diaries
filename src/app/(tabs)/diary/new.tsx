import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { format } from 'date-fns';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';
import { useUIStore, type ToastVariant } from '@/stores/uiStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

const MOODS: { emoji: string; label: string }[] = [
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🔥', label: 'Fired Up' },
  { emoji: '💡', label: 'Breakthrough' },
  { emoji: '😊', label: 'Good Day' },
  { emoji: '😓', label: 'Tough Day' },
  { emoji: '🚀', label: 'Shipped It' },
];

function todayISO(): string {
  return new Date().toISOString().split('T')[0] ?? new Date().toISOString();
}

export default function NewEntryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { createEntry } = useDiaryEntry();
  const pendingAudioUri = useUIStore((state) => state.pendingAudioUri);
  const setPendingAudioUri = useUIStore((state) => state.setPendingAudioUri);
  const pendingImageUris = useUIStore((state) => state.pendingImageUris);
  const setPendingImageUris = useUIStore((state) => state.setPendingImageUris);
  const showToast = useUIStore((state) => state.showToast);

  const [text, setText] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ local_id: string; local_uri: string }>>([]);

  const entryDateTime = format(new Date(), "MMM d, yyyy · h:mm a");
  const hasContent = text.trim().length > 0 || audioUri !== null || images.length > 0;
  const attachmentCount = (audioUri ? 1 : 0) + images.length;

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
      const newImages = pendingImageUris.map((uri) => ({
        local_id: Crypto.randomUUID(),
        local_uri: uri,
      }));
      setImages((prev) => [...prev, ...newImages]);
      setPendingImageUris([]);
    }
  }, [pendingImageUris, setPendingImageUris]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleRecordAudio = useCallback(() => {
    router.push('/(modals)/audio-recorder' as never);
  }, [router]);

  const handlePickImage = useCallback(() => {
    router.push('/(modals)/image-picker' as never);
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!hasContent || isSaving) return;

    setIsSaving(true);
    try {
      await createEntry({
        entry_date: todayISO(),
        text_content: text.trim() || undefined,
        audio_local_uri: audioUri ?? undefined,
        mood: mood ?? undefined,
        images,
      });
      showToast('Entry Saved', 'success' as ToastVariant);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save entry';
      Alert.alert('Save Failed', message);
    } finally {
      setIsSaving(false);
    }
  }, [hasContent, isSaving, text, mood, audioUri, images, createEntry, router]);

  const toggleMood = useCallback((label: string) => {
    setMood((prev) => (prev === label ? null : label));
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
      testID="new-entry-screen"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Modal header: Cancel | New Entry | Save */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={handleCancel}
            style={styles.headerBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            testID="new-entry-cancel"
          >
            <Text style={[styles.headerBtnText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            New Entry
          </Text>

          <Pressable
            onPress={handleSave}
            disabled={!hasContent || isSaving}
            style={styles.headerBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save entry"
            accessibilityState={{ disabled: !hasContent }}
            testID="new-entry-save"
          >
            <Text
              style={[
                styles.headerBtnText,
                styles.headerSaveText,
                { color: hasContent && !isSaving ? colors.accent : colors.textMuted },
              ]}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        {/* Tappable date/time */}
        <Pressable
          style={styles.dateRow}
          accessibilityRole="button"
          accessibilityLabel="Entry date and time"
          testID="new-entry-datetime"
        >
          <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
            {entryDateTime}
          </Text>
        </Pressable>

        {/* Primary text area — maximum space */}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="What happened today?"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          autoFocus
          style={[
            styles.textArea,
            { color: colors.textPrimary },
          ]}
          testID="new-entry-text-input"
        />

        {/* Audio chip (shown when audio is attached) */}
        {audioUri !== null && (
          <View
            style={[
              styles.audioChip,
              { backgroundColor: colors.accentLight, borderColor: colors.warmBorder },
            ]}
            testID="new-entry-audio-chip"
          >
            <Text style={styles.audioChipIcon}>{'🎤'}</Text>
            <Text style={[styles.audioChipText, { color: colors.accent }]}>
              Audio recorded
            </Text>
          </View>
        )}

        {/* Mood pills — horizontal scroll */}
        <View style={[styles.moodRow, { borderTopColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodScrollContent}
            testID="mood-scroll"
          >
            {MOODS.map(({ emoji, label }) => {
              const isSelected = mood === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleMood(label)}
                  style={[
                    styles.moodPill,
                    {
                      backgroundColor: isSelected ? colors.accentLight : colors.surface2,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isSelected }}
                  testID={`mood-pill-${label}`}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: isSelected ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom toolbar: 🎤 📷 + attachment count */}
        <View
          style={[
            styles.toolbar,
            { borderTopColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Pressable
            onPress={handleRecordAudio}
            style={({ pressed }) => [
              styles.toolbarBtn,
              {
                backgroundColor: audioUri ? colors.accentLight : colors.surface2,
                borderColor: audioUri ? colors.accent : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Record audio"
            testID="toolbar-mic"
          >
            <Text style={styles.toolbarIcon}>{'🎤'}</Text>
          </Pressable>

          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.toolbarBtn,
              {
                backgroundColor: images.length > 0 ? colors.accentLight : colors.surface2,
                borderColor: images.length > 0 ? colors.accent : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            testID="toolbar-camera"
          >
            <Text style={styles.toolbarIcon}>{'📷'}</Text>
          </Pressable>

          {attachmentCount > 0 && (
            <View
              style={[styles.attachmentBadge, { backgroundColor: colors.accent }]}
              testID="attachment-count-badge"
            >
              <Text style={[styles.attachmentBadgeText, { color: colors.accentText }]}>
                {attachmentCount}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: {
    minWidth: 60,
    paddingVertical: spacing.xs,
  },
  headerBtnText: {
    ...typography.button,
  },
  headerSaveText: {
    fontFamily: fontFamily.semibold,
    textAlign: 'right',
  },
  headerTitle: {
    ...typography.headingMd,
    textAlign: 'center',
  },
  dateRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  dateLabel: {
    ...typography.bodyMd,
  },
  textArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: fontFamily.regular,
  },
  audioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  audioChipIcon: {
    fontSize: 14,
  },
  audioChipText: {
    ...typography.bodySm,
    fontFamily: fontFamily.medium,
  },
  moodRow: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  moodScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    ...typography.bodyMd,
    fontFamily: fontFamily.medium,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  toolbarBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarIcon: {
    fontSize: 20,
  },
  attachmentBadge: {
    marginLeft: spacing.xs,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  attachmentBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    lineHeight: 14,
  },
});
