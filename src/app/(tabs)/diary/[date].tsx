import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Image } from 'expo-image';
import { useDiaryStore } from '@/stores/diaryStore';
import { HeaderBar } from '@/components/layout/HeaderBar';
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

export default function EntryDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const getEntriesForDate = useDiaryStore((state) => state.getEntriesForDate);

  const entries = useMemo(() => {
    if (!date) return [];
    return getEntriesForDate(date);
  }, [date, getEntriesForDate]);

  const entry = entries[0] ?? null;

  const handleEdit = useCallback(() => {
    // Navigate to edit screen (to be implemented)
    // router.push(`/diary/edit/${entry?.local_id}`);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!entry) {
    return (
      <View style={styles.container} testID="entry-detail-screen">
        <HeaderBar title="Entry" showBack testID="entry-header" />
        <View style={styles.emptyState} testID="entry-not-found">
          <Text style={styles.emptyText}>Entry not found.</Text>
          <Pressable
            onPress={handleBack}
            style={styles.backLink}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const entryDateObj = parseISO(entry.entry_date);
  const formattedDate = format(entryDateObj, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(entry.created_at), 'h:mm a');
  const moodEmoji = entry.mood ? MOOD_EMOJI[entry.mood] : null;

  return (
    <View style={styles.container} testID="entry-detail-screen">
      <HeaderBar
        title="Entry"
        showBack
        rightAction={
          <Pressable
            onPress={handleEdit}
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel="Edit entry"
            testID="entry-edit-button"
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        }
        testID="entry-header"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date and mood */}
        <View style={styles.metaRow}>
          <View style={styles.dateMeta}>
            <Text style={styles.dateText} testID="entry-date">
              {formattedDate}
            </Text>
            <Text style={styles.timeText} testID="entry-time">
              {formattedTime}
            </Text>
          </View>
          {moodEmoji ? (
            <Text style={styles.moodEmoji} testID="entry-mood">
              {moodEmoji}
            </Text>
          ) : null}
        </View>

        {/* Text content */}
        {entry.text_content ? (
          <Text style={styles.textContent} testID="entry-text-content">
            {entry.text_content}
          </Text>
        ) : (
          <Text style={styles.emptyContent}>No text recorded for this entry.</Text>
        )}

        {/* Audio player */}
        {entry.audio_local_uri ? (
          <View style={styles.audioSection} testID="entry-audio-section">
            <Text style={styles.sectionTitle}>Audio</Text>
            <View style={styles.audioPlayer}>
              <Pressable
                style={styles.playButton}
                accessibilityRole="button"
                accessibilityLabel="Play audio"
                testID="entry-audio-play"
              >
                <Text style={styles.playIcon}>{'▶'}</Text>
              </Pressable>
              <View style={styles.waveformPlaceholder}>
                <Text style={styles.waveformText}>{'▬▬▬▬▬▬▬▬▬▬▬▬'}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Image gallery */}
        {entry.images.length > 0 ? (
          <View style={styles.imagesSection} testID="entry-images-section">
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScroll}
            >
              {entry.images.map((image) => (
                <Pressable
                  key={image.local_id}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="View image"
                  testID={`entry-image-${image.local_id}`}
                >
                  <Image
                    source={{ uri: image.local_uri }}
                    style={styles.imageThumb}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Sync status badge */}
        <View style={styles.syncRow} testID="entry-sync-row">
          <View
            style={[
              styles.syncBadge,
              entry.sync_status === 'synced' && styles.syncBadgeSynced,
              entry.sync_status === 'pending' && styles.syncBadgePending,
              entry.sync_status === 'failed' && styles.syncBadgeFailed,
            ]}
          >
            <Text style={styles.syncText}>
              {entry.sync_status === 'synced'
                ? 'Synced'
                : entry.sync_status === 'pending'
                  ? 'Pending sync'
                  : 'Sync failed'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateMeta: {
    flex: 1,
    gap: 2,
  },
  dateText: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  timeText: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  moodEmoji: {
    fontSize: 28,
    marginLeft: spacing.md,
  },
  textContent: {
    ...typography.bodyLg,
    color: colors.gray[700],
    lineHeight: 26,
  },
  emptyContent: {
    ...typography.bodyMd,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...typography.headingSm,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  audioSection: {
    gap: spacing.xs,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: colors.white,
    marginLeft: 2,
  },
  waveformPlaceholder: {
    flex: 1,
  },
  waveformText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    letterSpacing: 2,
  },
  imagesSection: {
    gap: spacing.xs,
  },
  imagesScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageThumb: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[200],
  },
  syncBadgeSynced: {
    backgroundColor: '#D1FAE5',
  },
  syncBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  syncBadgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  syncText: {
    ...typography.label,
    color: colors.gray[700],
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.gray[500],
  },
  backLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backLinkText: {
    ...typography.bodyMd,
    color: colors.primary[500],
  },
});
