import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { ENV } from './env';

// expo-secure-store keys must be <= 255 chars and contain only [A-Za-z0-9._-]
// Supabase uses keys like "sb-<project>-auth-token" which may contain colons,
// so we base64-encode the key to ensure compatibility.
function sanitizeKey(key: string): string {
  return btoa(key).replace(/[^A-Za-z0-9._-]/g, '_');
}

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(sanitizeKey(key));
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(sanitizeKey(key), value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(sanitizeKey(key));
  },
};

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
