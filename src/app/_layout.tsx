import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from '@/lib/sqlite';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import type { Profile } from '@/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function RootLayoutInner() {
  const { session, profile, isLoading, setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    async function initApp() {
      try {
        await initDatabase();
        logger.info('Database initialized');
      } catch (err) {
        logger.error('Failed to initialize database', { error: String(err) });
      }

      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        setSession(currentSession);

        if (currentSession?.user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (error) {
            logger.warn('Failed to fetch profile on init', { error: error.message });
          } else if (profileData) {
            setProfile(profileData as Profile);
          }
        }
      } catch (err) {
        logger.error('Failed to check session on init', { error: String(err) });
      } finally {
        setLoading(false);
      }
    }

    void initApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.debug('Auth state changed', { event });
      setSession(newSession);

      if (newSession?.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single();

        if (error) {
          logger.warn('Failed to fetch profile on auth change', { error: error.message });
        } else if (profileData) {
          setProfile(profileData as Profile);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setLoading]);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (profile && !profile.onboarding_completed) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    if (profile?.onboarding_completed) {
      router.replace('/(tabs)');
    }
  }, [isLoading, session, profile]);

  if (isLoading) {
    return (
      <View style={styles.loading} testID="root-loading">
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootLayoutInner />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});
