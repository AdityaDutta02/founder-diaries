// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required'),
  EXPO_PUBLIC_POSTHOG_API_KEY: z.string().optional().default(''),
  EXPO_PUBLIC_POSTHOG_HOST: z.string().url().optional().default('https://us.i.posthog.com'),
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']).optional().default('development'),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_POSTHOG_API_KEY: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Missing or invalid environment variables:\n${issues}`);
}

export const ENV = {
  SUPABASE_URL: parsed.data.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  POSTHOG_API_KEY: parsed.data.EXPO_PUBLIC_POSTHOG_API_KEY,
  POSTHOG_HOST: parsed.data.EXPO_PUBLIC_POSTHOG_HOST,
  APP_ENV: parsed.data.EXPO_PUBLIC_APP_ENV,
} as const;
