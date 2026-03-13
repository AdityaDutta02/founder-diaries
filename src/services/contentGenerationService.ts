import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { GenerateContentRequest, GenerateContentResponse } from '@/types/api';
import type { Platform, ContentType } from '@/types/database';

export async function requestGeneration(
  userId: string,
  diaryEntryId: string,
  platform: Platform,
  contentType: ContentType,
): Promise<GenerateContentResponse> {
  const request: GenerateContentRequest = {
    userId,
    diaryEntryId,
    platform,
    contentType,
  };

  const { data, error } = await supabase.functions.invoke<GenerateContentResponse>(
    'generate-content',
    { body: request },
  );

  if (error) {
    logger.error('requestGeneration failed', {
      diaryEntryId,
      platform,
      contentType,
      error: error.message,
    });
    throw new Error(`Content generation request failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Content generation returned no data');
  }

  logger.info('Content generation requested', { diaryEntryId, platform, contentType });
  return data;
}

export async function regeneratePost(postId: string): Promise<GenerateContentResponse> {
  const { data: post, error: fetchError } = await supabase
    .from('generated_posts')
    .select('user_id, diary_entry_id, platform, content_type')
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    logger.error('regeneratePost: could not fetch post', { postId, error: fetchError?.message });
    throw new Error(`Could not fetch post for regeneration: ${fetchError?.message ?? 'not found'}`);
  }

  if (!post.diary_entry_id) {
    throw new Error('Post has no associated diary entry and cannot be regenerated');
  }

  return requestGeneration(
    post.user_id as string,
    post.diary_entry_id as string,
    post.platform as Platform,
    post.content_type as ContentType,
  );
}
