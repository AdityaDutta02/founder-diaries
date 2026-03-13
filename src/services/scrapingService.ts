import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { ScrapeCreatorsRequest, ScrapeCreatorsResponse } from '@/types/api';
import type { Platform } from '@/types/database';

const SCRAPE_COOLDOWN_HOURS = 24;

export async function requestScraping(
  userId: string,
  platforms: Platform[],
  nicheKeywords: string[],
  industry: string,
): Promise<ScrapeCreatorsResponse> {
  const canProceed = await canScrape(userId);
  if (!canProceed) {
    throw new Error(
      `Scraping is only allowed once every ${String(SCRAPE_COOLDOWN_HOURS)} hours. Please try again later.`,
    );
  }

  const request: ScrapeCreatorsRequest = { userId, platforms, nicheKeywords, industry };

  const { data, error } = await supabase.functions.invoke<ScrapeCreatorsResponse>(
    'scrape-creators',
    { body: request },
  );

  if (error) {
    logger.error('requestScraping failed', { userId, error: error.message });
    throw new Error(`Scraping request failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Scraping request returned no data');
  }

  logger.info('Scraping requested', { userId, platforms, creatorsScraped: data.creatorsScraped });
  return data;
}

export async function canScrape(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('scraped_at')
    .eq('user_id', userId)
    .order('scraped_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.warn('canScrape check failed — allowing scrape', { userId, error: error.message });
    return true;
  }

  if (!data?.scraped_at) {
    return true;
  }

  const lastScraped = new Date(data.scraped_at as string);
  const hoursSinceScrape =
    (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60);

  return hoursSinceScrape >= SCRAPE_COOLDOWN_HOURS;
}
