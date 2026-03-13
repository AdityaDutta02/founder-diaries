import { Audio } from 'expo-av';
import { logger } from '@/lib/logger';

/**
 * Returns the duration of an audio file at the given URI in seconds.
 */
export async function getAudioDuration(uri: string): Promise<number> {
  let sound: Audio.Sound | null = null;
  try {
    const { sound: loadedSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false },
    );
    sound = loadedSound;

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) {
      throw new Error('Audio failed to load for duration check');
    }

    const durationMs = status.durationMillis ?? 0;
    return durationMs / 1000;
  } catch (err) {
    logger.error('getAudioDuration failed', { uri, error: String(err) });
    throw new Error(`Could not determine audio duration: ${String(err)}`);
  } finally {
    if (sound) {
      await sound.unloadAsync().catch((unloadErr) => {
        logger.warn('Failed to unload audio after duration check', { error: String(unloadErr) });
      });
    }
  }
}

/**
 * Formats a duration in milliseconds as "MM:SS".
 * Examples: 5000 → "0:05", 272000 → "4:32"
 */
export function formatRecordingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
