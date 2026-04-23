import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Recording } from 'expo-av/build/Audio';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- expo-av types vary between builds
let Audio: any = null;
try {
  // expo-av requires a dev build — gracefully handle Expo Go
  Audio = require('expo-av').Audio;
} catch {
  // null in Expo Go; handled gracefully
}

import { useTheme } from '@/theme/ThemeContext';
import { fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { useUIStore } from '@/stores/uiStore';
import { logger } from '@/lib/logger';
import { styles } from './audio-recorder.styles';

type RecorderState = 'recording' | 'paused' | 'preview';

const BAR_COUNT = 28;
const BAR_MAX = 52;
const BAR_MIN = 4;

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function AudioRecorderModal() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const SHEET_HEIGHT = windowHeight * 0.62;
  const setPendingAudioUri = useUIStore((s) => s.setPendingAudioUri);

  const [recorderState, setRecorderState] = useState<RecorderState>('recording');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMs, setPlaybackMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const recordingRef = useRef<Recording | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const soundRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const barHeights = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(BAR_MIN)),
  ).current;

  // ─── Wave animation ────────────────────────────────────────────────────────

  const startWave = useCallback(() => {
    const anims = barHeights.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: BAR_MIN + Math.random() * (BAR_MAX - BAR_MIN),
            duration: 220 + (i % 9) * 60,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: BAR_MIN + Math.random() * (BAR_MAX - BAR_MIN) * 0.5,
            duration: 180 + (i % 7) * 50,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    waveAnimRef.current = Animated.parallel(anims);
    waveAnimRef.current.start();
  }, [barHeights]);

  const stopWave = useCallback(() => {
    waveAnimRef.current?.stop();
    barHeights.forEach((val, i) =>
      Animated.timing(val, {
        toValue: BAR_MIN + Math.sin(i * 0.6) * (BAR_MAX * 0.35 - BAR_MIN),
        duration: 300,
        useNativeDriver: false,
      }).start(),
    );
  }, [barHeights]);

  // ─── Timer ─────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Cleanup timer and wave on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); }
      waveAnimRef.current?.stop();
    };
  }, []);

  // ─── Recording ─────────────────────────────────────────────────────────────

  const handleStartRecording = useCallback(async () => {
    if (!Audio) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { router.dismiss(); return; }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecorderState('recording');
      startTimer();
      startWave();
    } catch (err) {
      logger.error('Failed to start recording', {
        error: err instanceof Error ? err.message : String(err),
      });
      router.dismiss();
    }
  }, [startTimer, startWave, router]);

  const handlePause = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.pauseAsync();
      stopTimer();
      stopWave();
      setRecorderState('paused');
    } catch (err) {
      logger.error('Failed to pause', { error: err instanceof Error ? err.message : String(err) });
    }
  }, [stopTimer, stopWave]);

  const handleResume = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.startAsync();
      startTimer();
      startWave();
      setRecorderState('recording');
    } catch (err) {
      logger.error('Failed to resume', { error: err instanceof Error ? err.message : String(err) });
    }
  }, [startTimer, startWave]);

  const handleStop = useCallback(async () => {
    stopTimer();
    stopWave();
    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      // Switch audio mode from recording → playback so sound routes through speaker
      await Audio?.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri) { setAudioUri(uri); setRecorderState('preview'); }
      else { router.dismiss(); }
    } catch (err) {
      logger.error('Failed to stop recording', {
        error: err instanceof Error ? err.message : String(err),
      });
      router.dismiss();
    }
  }, [stopTimer, stopWave, router]);

  // ─── Playback ──────────────────────────────────────────────────────────────

  const handlePlayPause = useCallback(async () => {
    if (!audioUri || !Audio) return;
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          (status: { isLoaded: boolean; positionMillis: number; durationMillis?: number; didJustFinish?: boolean }) => {
            if (!status.isLoaded) return;
            setPlaybackMs(status.positionMillis);
            if (status.durationMillis) setDurationMs(status.durationMillis);
            if (status.didJustFinish) setIsPlaying(false);
          },
        );
        soundRef.current = sound;
        setIsPlaying(true);
      } else if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      logger.error('Playback error', { error: err instanceof Error ? err.message : String(err) });
    }
  }, [audioUri, isPlaying]);

  const handleSeek = useCallback(
    async (deltaMs: number) => {
      if (!soundRef.current) return;
      try {
        const target = Math.max(0, Math.min(durationMs, playbackMs + deltaMs));
        await soundRef.current.setPositionAsync(target);
        setPlaybackMs(target);
      } catch (err) {
        logger.warn('Seek error', { error: err instanceof Error ? err.message : String(err) });
      }
    },
    [playbackMs, durationMs],
  );

  const handleDiscard = useCallback(async () => {
    try { await soundRef.current?.unloadAsync(); } catch { /* swallow */ }
    soundRef.current = null;
    router.dismiss();
  }, [router]);

  const handleUseRecording = useCallback(() => {
    if (!audioUri) return;
    setPendingAudioUri(audioUri);
    router.dismiss();
  }, [audioUri, setPendingAudioUri, router]);

  const handleClose = useCallback(async () => {
    stopTimer();
    stopWave();
    try { await recordingRef.current?.stopAndUnloadAsync(); } catch { /* swallow */ }
    try { await soundRef.current?.unloadAsync(); } catch { /* swallow */ }
    recordingRef.current = null;
    soundRef.current = null;
    router.dismiss();
  }, [stopTimer, stopWave, router]);

  // Auto-start on mount
  useEffect(() => {
    void handleStartRecording();
    return () => {
      stopTimer();
      waveAnimRef.current?.stop();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived values ────────────────────────────────────────────────────────

  const timerDisplay = recorderState === 'preview'
    ? formatTimer(Math.floor(playbackMs / 1000))
    : formatTimer(elapsedSeconds);

  const totalDisplay = formatTimer(
    recorderState === 'preview' ? Math.floor(durationMs / 1000) : elapsedSeconds,
  );

  const isActiveRecording = recorderState === 'recording';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container} testID="audio-recorder-modal">
      {/* Dimmed overlay — tap to dismiss */}
      <Pressable style={styles.overlay} onPress={() => void handleClose()} />

      {/* Half-sheet */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            height: SHEET_HEIGHT,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />

        {/* Waveform */}
        <View style={styles.waveformRow} testID="waveform">
          {barHeights.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: anim,
                  backgroundColor: isActiveRecording ? colors.accent : colors.textMuted,
                  opacity: isActiveRecording ? 1 : 0.6,
                },
              ]}
            />
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          <Text style={[styles.timer, { color: colors.textPrimary }]} testID="recorder-timer">
            {timerDisplay}
          </Text>
          {recorderState === 'preview' && (
            <Text style={[styles.timerTotal, { color: colors.textMuted }]}>
              {` / ${totalDisplay}`}
            </Text>
          )}
        </View>

        {/* Controls: recording / paused */}
        {recorderState !== 'preview' ? (
          <View style={styles.recordingControls}>
            <Pressable
              onPress={isActiveRecording ? () => void handlePause() : () => void handleResume()}
              style={[styles.sideControlBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={isActiveRecording ? 'Pause recording' : 'Resume recording'}
              testID="pause-resume-btn"
            >
              <Text style={[styles.sideControlIcon, { color: colors.textPrimary }]}>
                {isActiveRecording ? '⏸' : '▶'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void handleStop()}
              style={styles.stopBtn}
              accessibilityRole="button"
              accessibilityLabel="Stop recording"
              testID="stop-btn"
            >
              <View style={[styles.stopInner, { backgroundColor: colors.white }]} />
            </Pressable>

            <Pressable
              onPress={() => void handleClose()}
              style={[styles.sideControlBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel recording"
              testID="cancel-btn"
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          /* Controls: preview */
          <View style={styles.previewSection} testID="preview-controls">
            <View style={styles.playbackRow}>
              <Pressable
                onPress={() => void handleSeek(-15_000)}
                style={styles.seekBtn}
                accessibilityRole="button"
                accessibilityLabel="Rewind 15 seconds"
                testID="rewind-btn"
              >
                <Text style={[styles.seekIcon, { color: colors.textSecondary }]}>{'⏪'}</Text>
                <Text style={[styles.seekLabel, { color: colors.textMuted }]}>15s</Text>
              </Pressable>

              <Pressable
                onPress={() => void handlePlayPause()}
                style={[styles.playBtn, { backgroundColor: colors.accent }]}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                testID="play-pause-btn"
              >
                <Text style={[styles.playBtnIcon, { color: colors.accentText }]}>
                  {isPlaying ? '⏸' : '▶'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handleSeek(15_000)}
                style={styles.seekBtn}
                accessibilityRole="button"
                accessibilityLabel="Forward 15 seconds"
                testID="forward-btn"
              >
                <Text style={[styles.seekIcon, { color: colors.textSecondary }]}>{'⏩'}</Text>
                <Text style={[styles.seekLabel, { color: colors.textMuted }]}>15s</Text>
              </Pressable>
            </View>

            <View style={styles.previewActions}>
              <Pressable
                onPress={() => void handleDiscard()}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface2, opacity: pressed ? 0.7 : 1 },
                ]}
                accessibilityRole="button"
                testID="discard-btn"
              >
                <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Discard</Text>
              </Pressable>

              <Pressable
                onPress={handleUseRecording}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
                ]}
                accessibilityRole="button"
                testID="use-recording-btn"
              >
                <Text style={[styles.actionBtnText, { color: colors.accentText, fontFamily: fontFamily.semibold }]}>
                  Use Recording
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
