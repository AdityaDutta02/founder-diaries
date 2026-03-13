import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { GenerateImageRequest, GenerateImageResponse } from '@/types/api';

export async function requestImageGeneration(
  postId: string,
  imagePrompt: string,
  aspectRatio: GenerateImageRequest['aspectRatio'],
): Promise<GenerateImageResponse> {
  const request: GenerateImageRequest = { postId, imagePrompt, aspectRatio };

  const { data, error } = await supabase.functions.invoke<GenerateImageResponse>(
    'generate-image',
    { body: request },
  );

  if (error) {
    logger.error('requestImageGeneration failed', {
      postId,
      error: error.message,
    });
    throw new Error(`Image generation request failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Image generation returned no data');
  }

  logger.info('Image generation requested', { postId, aspectRatio });
  return data;
}
