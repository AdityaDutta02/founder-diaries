// src/lib/posthog.ts
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';
import { ENV } from './env';

// On web, PostHog can't find expo-file-system or async-storage.
// Provide a simple localStorage-based storage for web.
const webStorage = Platform.OS === 'web'
  ? {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, value: string) => { window.localStorage.setItem(key, value); },
    }
  : undefined;

export const posthog = new PostHog(ENV.POSTHOG_API_KEY, {
  host: ENV.POSTHOG_HOST,
  // Disable in development or when no API key is configured
  disabled: ENV.APP_ENV === 'development' || ENV.POSTHOG_API_KEY === '',
  enableSessionReplay: false,
  ...(webStorage && { customStorage: webStorage }),
});
