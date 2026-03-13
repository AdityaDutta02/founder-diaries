import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { getProfile } from '@/services/supabaseService';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/stores/authStore';

export interface UseAuthReturn {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const {
    session,
    profile,
    isLoading,
    isAuthenticated,
    setSession,
    setProfile,
    signOut: storeSignOut,
  } = useAuthStore();

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        logger.error('signIn failed', { error: error.message });
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error('Sign in succeeded but no session was returned');
      }

      setSession(data.session);

      if (data.user) {
        try {
          const fetchedProfile = await getProfile(data.user.id);
          setProfile(fetchedProfile as unknown as Profile);
        } catch (profileErr) {
          logger.warn('Could not fetch profile after sign in', { error: String(profileErr) });
        }
      }
    },
    [setSession, setProfile],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<void> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) {
        logger.error('signUp failed', { error: error.message });
        throw new Error(error.message);
      }

      if (data.session) {
        setSession(data.session);
      }

      if (data.user) {
        try {
          const fetchedProfile = await getProfile(data.user.id);
          setProfile(fetchedProfile as unknown as Profile);
        } catch (profileErr) {
          // Profile may not exist yet if created asynchronously by a trigger.
          logger.debug('Profile not ready after sign up', { error: String(profileErr) });
        }
      }
    },
    [setSession, setProfile],
  );

  const signOut = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('signOut failed', { error: error.message });
      throw new Error(error.message);
    }
    storeSignOut();
    logger.info('User signed out');
  }, [storeSignOut]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!session?.user) {
      logger.warn('refreshProfile called with no active session');
      return;
    }

    try {
      const fetchedProfile = await getProfile(session.user.id);
      setProfile(fetchedProfile as unknown as Profile);
      logger.debug('Profile refreshed');
    } catch (err) {
      logger.error('refreshProfile failed', { error: String(err) });
      throw err;
    }
  }, [session, setProfile]);

  return {
    session,
    profile,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}
