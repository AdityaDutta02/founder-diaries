import { Platform } from 'react-native';

interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

function sanitizeKey(key: string): string {
  return btoa(key).replace(/[^A-Za-z0-9._-]/g, '_');
}

function createNativeAdapter(): StorageAdapter {
  // Lazy require to avoid web bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any -- runtime optional module
  const SecureStore = require('expo-secure-store') as any;
  return {
    getItem: async (key) => (await SecureStore.getItemAsync(sanitizeKey(key))) ?? null,
    setItem: (key, value) => SecureStore.setItemAsync(sanitizeKey(key), value),
    removeItem: (key) => SecureStore.deleteItemAsync(sanitizeKey(key)),
  };
}

function createWebAdapter(): StorageAdapter {
  return {
    getItem: async (key) => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(sanitizeKey(key));
    },
    setItem: async (key, value) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(sanitizeKey(key), value);
    },
    removeItem: async (key) => {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(sanitizeKey(key));
    },
  };
}

export const storageAdapter: StorageAdapter =
  Platform.OS === 'web' ? createWebAdapter() : createNativeAdapter();
