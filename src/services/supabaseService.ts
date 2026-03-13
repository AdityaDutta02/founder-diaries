import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Profile, DiaryEntry, DiaryImage, PlatformConfig, CreatorProfile, CreatorContentSample, ContentWritingProfile, GeneratedPost, Platform, PostStatus } from '@/types/database';

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('getProfile failed', { userId, error: error.message });
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    logger.error('updateProfile failed', { userId, error: error.message });
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data as Profile;
}

// ─── Diary Entries ────────────────────────────────────────────────────────────

export async function getDiaryEntries(userId: string): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });

  if (error) {
    logger.error('getDiaryEntries failed', { userId, error: error.message });
    throw new Error(`Failed to fetch diary entries: ${error.message}`);
  }

  return (data ?? []) as DiaryEntry[];
}

export async function getDiaryEntry(id: string): Promise<DiaryEntry> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('getDiaryEntry failed', { id, error: error.message });
    throw new Error(`Failed to fetch diary entry: ${error.message}`);
  }

  return data as DiaryEntry;
}

export async function createDiaryEntry(
  entry: Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>,
): Promise<DiaryEntry> {
  const { data, error } = await supabase
    .from('diary_entries')
    .insert(entry)
    .select()
    .single();

  if (error) {
    logger.error('createDiaryEntry failed', { error: error.message });
    throw new Error(`Failed to create diary entry: ${error.message}`);
  }

  return data as DiaryEntry;
}

export async function updateDiaryEntry(
  id: string,
  updates: Partial<Omit<DiaryEntry, 'id' | 'user_id' | 'created_at'>>,
): Promise<DiaryEntry> {
  const { data, error } = await supabase
    .from('diary_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('updateDiaryEntry failed', { id, error: error.message });
    throw new Error(`Failed to update diary entry: ${error.message}`);
  }

  return data as DiaryEntry;
}

// ─── Diary Images ─────────────────────────────────────────────────────────────

export async function getDiaryImages(entryId: string): Promise<DiaryImage[]> {
  const { data, error } = await supabase
    .from('diary_images')
    .select('*')
    .eq('diary_entry_id', entryId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('getDiaryImages failed', { entryId, error: error.message });
    throw new Error(`Failed to fetch diary images: ${error.message}`);
  }

  return (data ?? []) as DiaryImage[];
}

export async function createDiaryImage(
  image: Omit<DiaryImage, 'id' | 'created_at'>,
): Promise<DiaryImage> {
  const { data, error } = await supabase
    .from('diary_images')
    .insert(image)
    .select()
    .single();

  if (error) {
    logger.error('createDiaryImage failed', { error: error.message });
    throw new Error(`Failed to create diary image: ${error.message}`);
  }

  return data as DiaryImage;
}

// ─── Platform Configs ─────────────────────────────────────────────────────────

export async function getPlatformConfigs(userId: string): Promise<PlatformConfig[]> {
  const { data, error } = await supabase
    .from('platform_configs')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    logger.error('getPlatformConfigs failed', { userId, error: error.message });
    throw new Error(`Failed to fetch platform configs: ${error.message}`);
  }

  return (data ?? []) as PlatformConfig[];
}

export async function upsertPlatformConfig(
  config: Omit<PlatformConfig, 'id' | 'created_at' | 'updated_at'>,
): Promise<PlatformConfig> {
  const { data, error } = await supabase
    .from('platform_configs')
    .upsert(
      { ...config, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,platform' },
    )
    .select()
    .single();

  if (error) {
    logger.error('upsertPlatformConfig failed', { error: error.message });
    throw new Error(`Failed to upsert platform config: ${error.message}`);
  }

  return data as PlatformConfig;
}

// ─── Creator Profiles ─────────────────────────────────────────────────────────

export async function getCreatorProfiles(
  userId: string,
  platform?: Platform,
): Promise<CreatorProfile[]> {
  let query = supabase
    .from('creator_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('relevance_score', { ascending: false });

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('getCreatorProfiles failed', { userId, error: error.message });
    throw new Error(`Failed to fetch creator profiles: ${error.message}`);
  }

  return (data ?? []) as CreatorProfile[];
}

export async function getCreatorProfile(id: string): Promise<CreatorProfile> {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('getCreatorProfile failed', { id, error: error.message });
    throw new Error(`Failed to fetch creator profile: ${error.message}`);
  }

  return data as CreatorProfile;
}

// ─── Content Samples ──────────────────────────────────────────────────────────

export async function getContentSamples(creatorId: string): Promise<CreatorContentSample[]> {
  const { data, error } = await supabase
    .from('creator_content_samples')
    .select('*')
    .eq('creator_profile_id', creatorId)
    .order('engagement_score', { ascending: false });

  if (error) {
    logger.error('getContentSamples failed', { creatorId, error: error.message });
    throw new Error(`Failed to fetch content samples: ${error.message}`);
  }

  return (data ?? []) as CreatorContentSample[];
}

// ─── Writing Profiles ─────────────────────────────────────────────────────────

export async function getWritingProfiles(userId: string): Promise<ContentWritingProfile[]> {
  const { data, error } = await supabase
    .from('content_writing_profiles')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    logger.error('getWritingProfiles failed', { userId, error: error.message });
    throw new Error(`Failed to fetch writing profiles: ${error.message}`);
  }

  return (data ?? []) as ContentWritingProfile[];
}

export async function getWritingProfile(
  userId: string,
  platform: Platform,
): Promise<ContentWritingProfile | null> {
  const { data, error } = await supabase
    .from('content_writing_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle();

  if (error) {
    logger.error('getWritingProfile failed', { userId, platform, error: error.message });
    throw new Error(`Failed to fetch writing profile: ${error.message}`);
  }

  return data as ContentWritingProfile | null;
}

// ─── Generated Posts ──────────────────────────────────────────────────────────

export interface GetPostsFilters {
  platform?: Platform;
  status?: PostStatus;
  diaryEntryId?: string;
}

export async function getGeneratedPosts(
  userId: string,
  filters?: GetPostsFilters,
): Promise<GeneratedPost[]> {
  let query = supabase
    .from('generated_posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.platform) {
    query = query.eq('platform', filters.platform);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.diaryEntryId) {
    query = query.eq('diary_entry_id', filters.diaryEntryId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('getGeneratedPosts failed', { userId, error: error.message });
    throw new Error(`Failed to fetch generated posts: ${error.message}`);
  }

  return (data ?? []) as GeneratedPost[];
}

export async function getPost(id: string): Promise<GeneratedPost> {
  const { data, error } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('getPost failed', { id, error: error.message });
    throw new Error(`Failed to fetch post: ${error.message}`);
  }

  return data as GeneratedPost;
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
): Promise<GeneratedPost> {
  const { data, error } = await supabase
    .from('generated_posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('updatePostStatus failed', { id, status, error: error.message });
    throw new Error(`Failed to update post status: ${error.message}`);
  }

  return data as GeneratedPost;
}

export async function updatePostContent(
  id: string,
  content: Partial<Pick<GeneratedPost, 'title' | 'body_text' | 'carousel_slides' | 'thread_tweets' | 'user_edits'>>,
): Promise<GeneratedPost> {
  const { data, error } = await supabase
    .from('generated_posts')
    .update({ ...content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('updatePostContent failed', { id, error: error.message });
    throw new Error(`Failed to update post content: ${error.message}`);
  }

  return data as GeneratedPost;
}
