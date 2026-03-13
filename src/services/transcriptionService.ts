import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { TranscribeRequest, TranscribeResponse } from '@/types/api';
import type { TranscriptionStatus } from '@/types/database';

export async function requestTranscription(
  diaryEntryId: string,
  audioStoragePath: string,
): Promise<TranscribeResponse> {
  const request: TranscribeRequest = { diaryEntryId, audioStoragePath };

  const { data, error } = await supabase.functions.invoke<TranscribeResponse>(
    'transcribe-audio',
    { body: request },
  );

  if (error) {
    logger.error('requestTranscription failed', {
      diaryEntryId,
      error: error.message,
    });
    throw new Error(`Transcription request failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Transcription request returned no data');
  }

  logger.info('Transcription requested', { diaryEntryId });
  return data;
}

export async function getTranscriptionStatus(
  diaryEntryId: string,
): Promise<TranscriptionStatus | null> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('transcription_status')
    .eq('id', diaryEntryId)
    .single();

  if (error) {
    logger.error('getTranscriptionStatus failed', {
      diaryEntryId,
      error: error.message,
    });
    throw new Error(`Failed to get transcription status: ${error.message}`);
  }

  return (data?.transcription_status as TranscriptionStatus | null) ?? null;
}
