import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'fd_theme_mode';

export const useThemeStore = create<ThemeState>()((set) => ({
  mode: 'system',
  setMode: (mode) => {
    set({ mode });
    void SecureStore.setItemAsync(STORAGE_KEY, mode);
  },
}));

export async function loadPersistedTheme(): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      useThemeStore.setState({ mode: stored });
    }
  } catch {
    // silently fall back to system default
  }
}
