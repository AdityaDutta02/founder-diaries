import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

let activeRecording: Audio.Recording | null = null;
let activeSound: Audio.Sound | null = null;

export async function startRecording(): Promise<void> {
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) {
    throw new Error('Microphone permission was denied');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
  activeRecording = recording;
  logger.info('Audio recording started');
}

export async function stopRecording(): Promise<string> {
  if (!activeRecording) {
    throw new Error('No active recording to stop');
  }

  await activeRecording.stopAndUnloadAsync();
  const uri = activeRecording.getURI();
  activeRecording = null;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  if (!uri) {
    throw new Error('Recording completed but URI is null');
  }

  logger.info('Audio recording stopped', { uri });
  return uri;
}

export type PlaybackStatusCallback = (status: {
  positionMillis: number;
  durationMillis: number | undefined;
  didJustFinish: boolean;
  isPlaying: boolean;
}) => void;

export async function playAudio(
  uri: string,
  onStatus?: PlaybackStatusCallback,
): Promise<Audio.Sound> {
  if (activeSound) {
    await activeSound.unloadAsync();
    activeSound = null;
  }

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true },
    (status) => {
      if (!status.isLoaded) return;
      onStatus?.({
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis,
        didJustFinish: status.didJustFinish ?? false,
        isPlaying: status.isPlaying,
      });
    },
  );
  activeSound = sound;
  logger.debug('Audio playback started', { uri });
  return sound;
}

export async function pauseAudio(): Promise<void> {
  if (!activeSound) {
    logger.warn('pauseAudio called with no active sound');
    return;
  }
  await activeSound.pauseAsync();
  logger.debug('Audio playback paused');
}

export async function getRecordingDuration(): Promise<string> {
  if (!activeRecording) {
    return '0:00';
  }

  const status = await activeRecording.getStatusAsync();
  if (!status.isRecording) {
    return '0:00';
  }

  const ms = status.durationMillis ?? 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

export async function uploadAudio(
  localUri: string,
  userId: string,
  entryId: string,
): Promise<string> {
  const filename = `${userId}/${entryId}_${Date.now()}.m4a`;
  const storagePath = `diary-audio/${filename}`;

  const file = new File(localUri);
  if (!file.exists) {
    throw new Error(`Audio file not found at URI: ${localUri}`);
  }

  const base64Content = await file.base64();
  const binaryData = Uint8Array.from(atob(base64Content), (char) => char.charCodeAt(0));

  const { error } = await supabase.storage
    .from('diary-audio')
    .upload(filename, binaryData, {
      contentType: 'audio/mp4',
      upsert: false,
    });

  if (error) {
    logger.error('Audio upload failed', { localUri, error: error.message });
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  logger.info('Audio uploaded to storage', { storagePath });
  return storagePath;
}
