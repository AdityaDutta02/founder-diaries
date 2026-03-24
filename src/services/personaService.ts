import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface UserPersona {
  id: string;
  user_id: string;
  company_name: string | null;
  job_title: string | null;
  years_experience: number | null;
  personality_traits: string[];
  communication_style: string | null;
  writing_tone: string | null;
  interests: string[];
  hobbies: string[];
  values: string[];
  life_context: Record<string, unknown>;
  founder_story: string | null;
  biggest_challenges: string[];
  proudest_wins: string[];
  content_themes: string[];
  emotional_range: string | null;
  audience_connection_style: string | null;
  confidence_score: number;
  last_analyzed_at: string | null;
  entry_count_at_last_analysis: number;
}

export interface EnrichmentAnswer {
  id: string;
  user_id: string;
  question: string;
  question_category: string | null;
  answer: string | null;
  is_answered: boolean;
  asked_at: string;
  answered_at: string | null;
}

export async function getPersona(userId: string): Promise<UserPersona | null> {
  try {
    const { data, error } = await supabase
      .from('user_persona')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('getPersona failed', { userId, error: error.message });
      return null;
    }

    return data as UserPersona;
  } catch (error) {
    logger.error('getPersona unexpected error', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getUnansweredQuestion(userId: string): Promise<EnrichmentAnswer | null> {
  try {
    const { data, error } = await supabase
      .from('persona_enrichment_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_answered', false)
      .order('asked_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned — not an error condition
        return null;
      }
      logger.error('getUnansweredQuestion failed', { userId, error: error.message });
      return null;
    }

    return data as EnrichmentAnswer;
  } catch (error) {
    logger.error('getUnansweredQuestion unexpected error', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function submitAnswer(answerId: string, answer: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('persona_enrichment_answers')
      .update({
        answer,
        is_answered: true,
        answered_at: new Date().toISOString(),
      })
      .eq('id', answerId);

    if (error) {
      logger.error('submitAnswer failed', { answerId, error: error.message });
      return;
    }

    logger.info('Enrichment answer submitted', { answerId });
  } catch (error) {
    logger.error('submitAnswer unexpected error', {
      answerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function requestNextQuestion(userId: string): Promise<EnrichmentAnswer | null> {
  try {
    const { data, error } = await supabase.functions.invoke<EnrichmentAnswer>(
      'generate-enrichment-question',
      { body: { user_id: userId } },
    );

    if (error) {
      logger.error('requestNextQuestion edge function failed', { userId, error: error.message });
      return null;
    }

    if (!data) {
      logger.warn('requestNextQuestion returned no data', { userId });
      return null;
    }

    logger.info('Enrichment question generated', { userId, questionId: data.id });
    return data;
  } catch (error) {
    logger.error('requestNextQuestion unexpected error', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
