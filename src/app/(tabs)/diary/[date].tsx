import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Image } from 'expo-image';
import type { Sound as AVSound } from 'expo-av/build/Audio/Sound';
import type { AVPlaybackStatus } from 'expo-av/build/AV';
import { useDiaryStore } from '@/stores/diaryStore';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { logger } from '@/lib/logger';

// expo-av type: the Audio namespace object from the module
type AudioModule = {
  Sound: {
    createAsync: (
      source: { uri: string },
      initialStatus?: { shouldPlay: boolean },
      onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null,
    ) => Promise<{ sound: AVSound }>;
  };
  setAudioModeAsync: (mode: { allowsRecordingIOS: boolean; playsInSilentModeIOS: boolean }) => Promise<void>;
};

let Audio: AudioModule | null = null;
try {
  // expo-av requires a dev build — gracefully handle Expo Go
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Audio = require('expo-av').Audio as AudioModule;
} catch {
  // Will be null in Expo Go; handled in handlePlayAudio
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min)}:${String(sec).padStart(2, '0')}`;
}

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
  const { colors, shadows } = useTheme();
  const getEntriesForDate = useDiaryStore((state) => state.getEntriesForDate);

  const entries = useMemo(() => {
    if (!date) return [];
    return getEntriesForDate(date);
  }, [date, getEntriesForDate]);

  const entry = entries[0] ?? null;

  const [sound, setSound] = useState<AVSound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMs, setPlaybackMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const handlePlayAudio = useCallback(async () => {
    if (!Audio) {
      Alert.alert('Dev Build Required', 'Audio playback requires a development build.');
      return;
    }

    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }

      if (!entry?.audio_local_uri) return;

      // Ensure audio mode is set for playback (not recording)
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: entry.audio_local_uri },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          setPlaybackMs(status.positionMillis);
          if (status.durationMillis) setDurationMs(status.durationMillis);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackMs(0);
          }
        },
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      logger.error('Failed to play audio entry', {
        error: err instanceof Error ? err.message : String(err),
      });
      Alert.alert('Playback Error', 'Could not play audio. Please try again.');
    }
  }, [sound, isPlaying, entry]);

  // Unload sound on unmount to free resources
  useEffect(() => {
    return () => {
      sound?.unloadAsync().catch(() => {});
    };
  }, [sound]);

  const handleEdit = useCallback(() => {
    if (entry?.local_id) {
      router.push(`/diary/edit/${entry.local_id}` as never);
    }
  }, [entry, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!entry) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.background }}
        testID="entry-detail-screen"
      >
        <HeaderBar title="Entry" showBack testID="entry-header" />
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}
          testID="entry-not-found"
        >
          <Text style={{ ...typography.bodyMd, color: colors.textMuted }}>
            Entry not found.
          </Text>
          <Pressable
            onPress={handleBack}
            style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={{ ...typography.bodyMd, color: colors.accent }}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const entryDateObj = parseISO(entry.entry_date);
  const formattedDate = format(entryDateObj, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(entry.created_at), 'h:mm a');
  const moodEmoji = entry.mood ? MOOD_EMOJI[entry.mood] : null;

  const syncBgColor =
    entry.sync_status === 'synced'
      ? colors.successLight
      : entry.sync_status === 'pending'
        ? colors.warningLight
        : colors.errorLight;

  const syncTextColor =
    entry.sync_status === 'synced'
      ? colors.success
      : entry.sync_status === 'pending'
        ? colors.warning
        : colors.error;

  const syncLabel =
    entry.sync_status === 'synced'
      ? 'Synced'
      : entry.sync_status === 'pending'
        ? 'Pending sync'
        : 'Sync failed';

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="entry-detail-screen"
    >
      <HeaderBar
        title="Entry"
        showBack
        rightAction={
          <Pressable
            onPress={handleEdit}
            style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}
            accessibilityRole="button"
            accessibilityLabel="Edit entry"
            testID="entry-edit-button"
          >
            <Text style={{ ...typography.button, color: colors.accent }}>Edit</Text>
          </Pressable>
        }
        testID="entry-header"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.lg,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date and mood */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{ ...typography.headingSm, color: colors.textPrimary }}
              testID="entry-date"
            >
              {formattedDate}
            </Text>
            <Text
              style={{ ...typography.bodySm, color: colors.textMuted }}
              testID="entry-time"
            >
              {formattedTime}
            </Text>
          </View>
          {moodEmoji ? (
            <Text style={{ fontSize: 28, marginLeft: spacing.md }} testID="entry-mood">
              {moodEmoji}
            </Text>
          ) : null}
        </View>

        {/* Text content */}
        {entry.text_content ? (
          <Text
            style={{ ...typography.bodyLg, color: colors.textPrimary }}
            testID="entry-text-content"
          >
            {entry.text_content}
          </Text>
        ) : (
          <Text style={{ ...typography.bodyMd, color: colors.textMuted, fontStyle: 'italic' }}>
            No text recorded for this entry.
          </Text>
        )}

        {/* Audio player — native only (local URIs don't work on web) */}
        {Platform.OS !== 'web' && entry.audio_local_uri ? (
          <View style={{ gap: spacing.sm }} testID="entry-audio-section">
            <Text style={{ ...typography.label, color: colors.textMuted }}>
              AUDIO
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                gap: spacing.md,
              }}
            >
              <Pressable
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handlePlayAudio}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                testID="entry-audio-play"
              >
                <Text style={{ fontSize: 16, color: colors.accentText, marginLeft: 2 }}>
                  {isPlaying ? '⏸' : '▶'}
                </Text>
              </Pressable>
              <View style={{ flex: 1, gap: 4 }}>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.accent,
                      width: durationMs > 0 ? `${(playbackMs / durationMs) * 100}%` : '0%',
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...typography.label, color: colors.textMuted }}>
                    {formatMs(playbackMs)}
                  </Text>
                  <Text style={{ ...typography.label, color: colors.textMuted }}>
                    {formatMs(durationMs)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Image gallery */}
        {entry.images.length > 0 ? (
          <View style={{ gap: spacing.sm }} testID="entry-images-section">
            <Text style={{ ...typography.label, color: colors.textMuted }}>
              PHOTOS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', gap: spacing.sm }}
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
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: borderRadius.md,
                    }}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Sync status badge */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center' }}
          testID="entry-sync-row"
        >
          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              backgroundColor: syncBgColor,
            }}
          >
            <Text style={{ ...typography.label, color: syncTextColor }}>
              {syncLabel}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit FAB */}
      <Pressable
        onPress={handleEdit}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: 88,
          right: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: borderRadius.full,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          transform: pressed ? [{ scale: 0.96 }] : [],
          ...shadows.lg,
        })}
        accessibilityRole="button"
        accessibilityLabel="Edit diary entry"
        testID="entry-edit-fab"
      >
        <Text style={{ fontSize: 20, color: colors.accentText }}>{'✏️'}</Text>
      </Pressable>
    </View>
  );
}
