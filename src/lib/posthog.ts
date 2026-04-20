// src/lib/posthog.ts
import PostHog from 'posthog-react-native';
import { ENV } from './env';

export const posthog = new PostHog(ENV.POSTHOG_API_KEY, {
  host: ENV.POSTHOG_HOST,
  // Disable in development or when no API key is configured
  disabled: ENV.APP_ENV === 'development' || ENV.POSTHOG_API_KEY === '',
  enableSessionReplay: false,
});
