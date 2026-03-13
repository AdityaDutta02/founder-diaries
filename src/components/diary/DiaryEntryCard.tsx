import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import type { LocalDiaryEntry } from '@/stores/diaryStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius, shadows } from '@/theme/spacing';

const MOOD_EMOJI: Record<string, string> = {
  energized: '⚡',
  productive: '🎯',
  neutral: '😐',
  stressed: '😰',
  frustrated: '😤',
};

const SYNC_DOT_COLOR: Record<LocalDiaryEntry['sync_status'], string> = {
  synced: colors.success,
  pending: colors.warning,
  failed: colors.error,
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
  const entryDate = new Date(entry.entry_date + 'T00:00:00');
  const formattedDate = format(entryDate, 'MMM d, yyyy');
  const formattedTime = entry.created_at
    ? format(new Date(entry.created_at), 'h:mm a')
    : '';
  const moodEmoji = entry.mood ? MOOD_EMOJI[entry.mood] : null;
  const syncColor = SYNC_DOT_COLOR[entry.sync_status];
  const hasAudio = Boolean(entry.audio_local_uri);
  const imageCount = entry.images.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Diary entry for ${formattedDate}`}
      testID={testID ?? `diary-entry-card-${entry.local_id}`}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <Text style={styles.dateText}>
          {formattedDate}
          {formattedTime ? `  ·  ${formattedTime}` : ''}
        </Text>
        {moodEmoji ? (
          <Text style={styles.moodEmoji} accessibilityLabel={`Mood: ${entry.mood ?? ''}`}>
            {moodEmoji}
          </Text>
        ) : null}
      </View>

      {/* Text preview */}
      {entry.text_content ? (
        <Text style={styles.preview} numberOfLines={2} testID="entry-preview">
          {entry.text_content}
        </Text>
      ) : (
        <Text style={styles.emptyPreview} numberOfLines={1}>
          No text recorded
        </Text>
      )}

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View style={styles.attachmentRow}>
          {hasAudio && (
            <View style={styles.attachmentBadge} testID="audio-badge">
              <Text style={styles.attachmentIcon}>{'🎤'}</Text>
            </View>
          )}
          {imageCount > 0 && (
            <View style={styles.attachmentBadge} testID="image-badge">
              <Text style={styles.attachmentIcon}>{'📷'}</Text>
              <Text style={styles.attachmentCount}>{imageCount}</Text>
            </View>
          )}
        </View>
        <View
          style={[styles.syncDot, { backgroundColor: syncColor }]}
          accessibilityLabel={`Sync status: ${entry.sync_status}`}
          testID="sync-dot"
        />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 100,
    width: '100%',
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    ...typography.label,
    color: colors.gray[500],
  },
  moodEmoji: {
    fontSize: 18,
  },
  preview: {
    ...typography.bodyMd,
    color: colors.gray[700],
    flex: 1,
  },
  emptyPreview: {
    ...typography.bodyMd,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  attachmentIcon: {
    fontSize: 12,
  },
  attachmentCount: {
    ...typography.label,
    color: colors.gray[500],
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
});
