import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  industry: string | null;
  niche_keywords: string[];
  onboarding_completed: boolean;
  diary_start_date: string | null;
  discovery_unlocked: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
  expo_push_token: string | null;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => void;
  setLoading: (isLoading: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set) => ({
  // State
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  setSession: (session) =>
    set({
      session,
      isAuthenticated: session !== null,
    }),

  setProfile: (profile) => set({ profile }),

  signOut: () =>
    set({
      session: null,
      profile: null,
      isAuthenticated: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
