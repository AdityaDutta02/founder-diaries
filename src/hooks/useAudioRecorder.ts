import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import {
  startRecording,
  stopRecording,
  playAudio,
  pauseAudio,
  getRecordingDuration,
} from '@/services/audioService';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: string;
  audioUri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playPreview: () => Promise<void>;
  discardRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState('0:00');
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartRecording = useCallback(async (): Promise<void> => {
    if (isRecording) {
      logger.warn('startRecording called while already recording');
      return;
    }

    setAudioUri(null);
    setDuration('0:00');

    await startRecording();
    setIsRecording(true);

    durationInterval.current = setInterval(async () => {
      try {
        const currentDuration = await getRecordingDuration();
        setDuration(currentDuration);
      } catch (err) {
        logger.warn('Failed to get recording duration', { error: String(err) });
      }
    }, 500);
  }, [isRecording]);

  const handleStopRecording = useCallback(async (): Promise<void> => {
    if (!isRecording) {
      logger.warn('stopRecording called while not recording');
      return;
    }

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    const uri = await stopRecording();
    setIsRecording(false);
    setAudioUri(uri);
    logger.debug('Recording stopped', { uri });
  }, [isRecording]);

  const playPreview = useCallback(async (): Promise<void> => {
    if (!audioUri) {
      logger.warn('playPreview called with no audio URI');
      return;
    }
    await playAudio(audioUri);
  }, [audioUri]);

  const discardRecording = useCallback((): void => {
    if (isRecording) {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      // Best-effort stop without throwing; we are discarding anyway.
      stopRecording().catch((err) => {
        logger.warn('Error stopping recording during discard', { error: String(err) });
      });
      setIsRecording(false);
    }
    setAudioUri(null);
    setDuration('0:00');
    pauseAudio().catch((err) => {
      logger.warn('Error pausing audio during discard', { error: String(err) });
    });
    logger.debug('Recording discarded');
  }, [isRecording]);

  return {
    isRecording,
    duration,
    audioUri,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    playPreview,
    discardRecording,
  };
}
