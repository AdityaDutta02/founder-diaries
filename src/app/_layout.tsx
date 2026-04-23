import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from '@/lib/sqlite';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { useDiaryStore } from '@/stores/diaryStore';
import { useContentStore } from '@/stores/contentStore';
import { loadPersistedTheme } from '@/stores/themeStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { setupNotificationHandler, registerPushToken } from '@/services/notificationService';
import { syncPendingEntries } from '@/services/syncService';
import { useProfileReadiness } from '@/hooks/useProfileReadiness';
import type { Profile } from '@/stores/authStore';

const BACKGROUND_SYNC_TASK = 'background-sync';

// Background fetch is native-only — TaskManager crashes on web
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const BackgroundFetch = require('expo-background-fetch') as typeof import('expo-background-fetch');

  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      await syncPendingEntries();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

// Inner component that consumes the theme context
function RootLayoutInner() {
  const { session, profile, isLoading, setSession, setProfile, setLoading } = useAuthStore();
  const { colors, isDark } = useTheme();

  // Phase 1.5: show one-time toast when content profile is ready
  useProfileReadiness();

  useEffect(() => {
    async function initApp() {
      try {
        try {
          await initDatabase();
          logger.info('Database initialized');
        } catch (err) {
          logger.error('Failed to initialize database', { error: String(err) });
        }

        try {
          const SESSION_TIMEOUT_MS = 8000;
          const sessionInit = async () => {
            const { data } = await supabase.auth.getSession();
            const currentSession = data.session;
            setSession(currentSession);

            if (currentSession?.user) {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, avatar_url, industry, niche_keywords, onboarding_completed, diary_start_date, discovery_unlocked, timezone, created_at, updated_at, expo_push_token')
                .eq('id', currentSession.user.id)
                .single();

              if (error) {
                logger.warn('Failed to fetch profile on init', { error: error.message });
              } else if (profileData) {
                setProfile(profileData as Profile);
                void registerPushToken(currentSession.user.id);
                // Hydrate stores from Supabase
                void useDiaryStore.getState().hydrateFromSupabase(currentSession.user.id);
                void useContentStore.getState().fetchPosts(currentSession.user.id);
              }
            }
          };

          await Promise.race([
            sessionInit(),
            new Promise<void>((resolve) => setTimeout(() => {
              logger.warn('Session init timed out — proceeding without profile');
              resolve();
            }, SESSION_TIMEOUT_MS)),
          ]);
        } catch (err) {
          logger.error('Failed to check session on init', { error: String(err) });
        }
      } finally {
        // Always unblock the loading spinner — even if DB or session init hangs
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
          .select('id, email, full_name, avatar_url, industry, niche_keywords, onboarding_completed, diary_start_date, discovery_unlocked, timezone, created_at, updated_at, expo_push_token')
          .eq('id', newSession.user.id)
          .single();

        if (error) {
          logger.warn('Failed to fetch profile on auth change', { error: error.message });
        } else if (profileData) {
          setProfile(profileData as Profile);
          void registerPushToken(newSession.user.id);
          void useDiaryStore.getState().hydrateFromSupabase(newSession.user.id);
          void useContentStore.getState().fetchPosts(newSession.user.id);
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

    // Session exists but profile still loading — wait, don't redirect
    if (!profile) return;

    if (!profile.onboarding_completed) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    router.replace('/(tabs)/diary');
  }, [isLoading, session, profile]);

  useEffect(() => {
    setupNotificationHandler();

    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (isExpoGo) return;

    let subscription: { remove: () => void } | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const N = require('expo-notifications') as typeof import('expo-notifications');
      subscription = N.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        if (data?.type === 'enrichment_question') {
          router.push('/(modals)/question-answer');
        }
      });
    } catch {
      // silently skip in Expo Go
    }

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (isExpoGo) {
      logger.debug('Skipping background fetch registration in Expo Go');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BackgroundFetch = require('expo-background-fetch') as typeof import('expo-background-fetch');
    BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    }).catch((err: unknown) => {
      logger.warn('Background fetch registration failed', { error: String(err) });
    });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'default' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(modals)" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

// Fonts + theme boot wrapper
function AppBoot({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        await Promise.all([
          Font.loadAsync({
            SpaceGrotesk_400Regular,
            SpaceGrotesk_500Medium,
            SpaceGrotesk_600SemiBold,
            SpaceGrotesk_700Bold,
          }),
          loadPersistedTheme(),
        ]);
      } catch (err) {
        // Font or SecureStore failure — degrade gracefully to system font
        logger.warn('Boot assets failed to load', { error: String(err) });
      } finally {
        // Always unblock the app — never hang on a spinner
        setFontsLoaded(true);
      }
    }
    void boot();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#FF6B2B" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <PostHogProvider client={posthog}>
      <GestureHandlerRootView style={styles.flex}>
        <ThemeProvider>
          <AppBoot>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <RootLayoutInner />
              </ToastProvider>
            </QueryClientProvider>
          </AppBoot>
        </ThemeProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1C1A',
  },
});
