import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import type { LocalDiaryEntry } from '@/stores/diaryStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

const MOOD_EMOJI: Record<string, string> = {
  energized: '⚡',
  productive: '🎯',
  neutral: '😐',
  stressed: '😰',
  frustrated: '😤',
};

interface DiaryEntryCardProps {
  entry: LocalDiaryEntry;
  onPress: () => void;
  testID?: string;
}

export const DiaryEntryCard = memo(function DiaryEntryCard({
  entry,
  onPress,
  testID,
}: DiaryEntryCardProps) {
  const { colors } = useTheme();

  const formattedTime = entry.created_at
    ? format(new Date(entry.created_at), 'h:mm a')
    : '';
  const moodEmoji = entry.mood ? MOOD_EMOJI[entry.mood] : null;
  const hasAttachment = Boolean(entry.audio_local_uri) || entry.images.length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Diary entry at ${formattedTime}`}
      testID={testID ?? `diary-entry-card-${entry.local_id}`}
    >
      {/* Top row: time + mood emoji, status indicators top-right */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          {formattedTime ? (
            <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
              {formattedTime}
            </Text>
          ) : null}
          {moodEmoji ? (
            <Text
              style={styles.moodEmoji}
              accessibilityLabel={`Mood: ${entry.mood ?? ''}`}
            >
              {moodEmoji}
            </Text>
          ) : null}
        </View>
        <View style={styles.topRight}>
          {entry.sync_status === 'failed' ? (
            <Text
              style={[styles.syncIcon, { color: colors.error }]}
              accessibilityLabel="Sync failed"
              testID="sync-failed-icon"
            >
              {'☁✗'}
            </Text>
          ) : entry.sync_status === 'pending' ? (
            <Text
              style={[styles.syncIcon, { color: colors.textMuted }]}
              accessibilityLabel="Sync pending"
              testID="sync-pending-icon"
            >
              {'☁'}
            </Text>
          ) : null}
          {hasAttachment ? (
            <Text
              style={[styles.attachmentIcon, { color: colors.textMuted }]}
              testID="attachment-icon"
            >
              {'📎'}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Text preview */}
      {entry.text_content ? (
        <Text
          style={[styles.previewText, { color: colors.textPrimary }]}
          numberOfLines={3}
          testID="entry-preview"
        >
          {entry.text_content}
        </Text>
      ) : (
        <Text
          style={[styles.previewText, { color: colors.textMuted, fontStyle: 'italic' }]}
          numberOfLines={1}
        >
          No text recorded
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeLabel: {
    ...typography.label,
  },
  moodEmoji: {
    fontSize: 16,
  },
  syncIcon: {
    fontSize: 13,
  },
  attachmentIcon: {
    fontSize: 14,
  },
  previewText: {
    ...typography.bodyMd,
  },
});
