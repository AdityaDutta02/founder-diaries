import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import type { Recording } from 'expo-av/build/Audio';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { logger } from '@/lib/logger';

type RecorderState = 'idle' | 'recording' | 'preview';

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function AudioRecorderModal() {
  const router = useRouter();
  const setPendingAudioUri = useUIStore((s) => s.setPendingAudioUri);

  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const recordingRef = useRef<Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimRef.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnimRef.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecorderState('recording');
      startTimer();
      startPulse();
    } catch (err) {
      logger.error('Failed to start recording', {
        error: err instanceof Error ? err.message : String(err),
      });
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, [startTimer, startPulse]);

  const handleStopRecording = useCallback(async () => {
    stopTimer();
    stopPulse();

    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setAudioUri(uri);
        setRecorderState('preview');
      } else {
        logger.warn('Recording URI is null after stopping');
        setRecorderState('idle');
      }
    } catch (err) {
      logger.error('Failed to stop recording', {
        error: err instanceof Error ? err.message : String(err),
      });
      setRecorderState('idle');
    }
  }, [stopTimer, stopPulse]);

  const handlePlayPause = useCallback(async () => {
    if (!audioUri) return;

    try {
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      logger.error('Failed to play recording', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [audioUri, isPlaying]);

  const handleDiscard = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (err) {
      logger.warn('Error unloading sound on discard', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    setAudioUri(null);
    setElapsedSeconds(0);
    setIsPlaying(false);
    setRecorderState('idle');
  }, []);

  const handleSave = useCallback(() => {
    if (!audioUri) return;
    setPendingAudioUri(audioUri);
    router.back();
  }, [audioUri, setPendingAudioUri, router]);

  const handleClose = useCallback(async () => {
    stopTimer();
    stopPulse();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Swallow — we're closing
      }
      recordingRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // Swallow — we're closing
      }
      soundRef.current = null;
    }
    router.back();
  }, [stopTimer, stopPulse, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopPulse();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [stopTimer, stopPulse]);

  return (
    <SafeAreaView style={styles.safeArea} testID="audio-recorder-modal">
      {/* Close button */}
      <Pressable
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close recorder"
        testID="close-recorder-button"
      >
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.heading}>Record your thoughts</Text>

        {/* Waveform placeholder */}
        <View style={styles.waveformContainer} testID="waveform-placeholder">
          {Array.from({ length: 24 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                recorderState === 'recording' && { height: Math.random() * 40 + 10 },
              ]}
            />
          ))}
        </View>

        {/* Timer */}
        <Text style={styles.timer} testID="recorder-timer">
          {formatTimer(elapsedSeconds)}
        </Text>

        {/* Record button */}
        {recorderState !== 'preview' && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[
                styles.recordButton,
                recorderState === 'recording' && styles.recordButtonActive,
              ]}
              onPress={
                recorderState === 'idle' ? handleStartRecording : handleStopRecording
              }
              accessibilityRole="button"
              accessibilityLabel={recorderState === 'idle' ? 'Start recording' : 'Stop recording'}
              testID="record-button"
            >
              <View
                style={[
                  styles.recordButtonInner,
                  recorderState === 'recording' && styles.recordButtonInnerStop,
                ]}
              />
            </Pressable>
          </Animated.View>
        )}

        {/* Preview controls */}
        {recorderState === 'preview' && (
          <View style={styles.previewControls} testID="preview-controls">
            <Pressable
              style={styles.playButton}
              onPress={handlePlayPause}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              testID="play-pause-button"
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
            </Pressable>

            <View style={styles.previewActions}>
              <Button
                label="Discard"
                variant="outline"
                size="md"
                onPress={handleDiscard}
                testID="discard-button"
              />
              <Button
                label="Save"
                variant="primary"
                size="md"
                onPress={handleSave}
                testID="save-recording-button"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  closeButton: {
    position: 'absolute',
    top: spacing['3xl'],
    left: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  closeIcon: {
    fontSize: 20,
    color: colors.gray[700],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
  heading: {
    ...typography.headingLg,
    color: colors.gray[900],
    textAlign: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 60,
    width: '100%',
    justifyContent: 'center',
  },
  waveBar: {
    width: 4,
    height: 20,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
  },
  timer: {
    ...typography.headingXl,
    color: colors.gray[900],
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: colors.error,
  },
  recordButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  recordButtonInnerStop: {
    borderRadius: 4,
  },
  previewControls: {
    alignItems: 'center',
    gap: spacing.xl,
    width: '100%',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
