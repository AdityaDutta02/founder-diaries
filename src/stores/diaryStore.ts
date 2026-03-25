import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface LocalDiaryImage {
  local_id: string;
  diary_local_id: string;
  local_uri: string;
  sync_status: 'pending' | 'synced' | 'failed';
  remote_id: string | null;
  created_at: string;
}

export interface LocalDiaryEntry {
  local_id: string;
  entry_date: string;
  text_content: string | null;
  audio_local_uri: string | null;
  mood: string | null;
  sync_status: 'pending' | 'synced' | 'failed';
  remote_id: string | null;
  created_at: string;
  updated_at: string;
  images: LocalDiaryImage[];
}

interface DiaryState {
  entries: Map<string, LocalDiaryEntry>;
  selectedDate: string;
  currentMonth: Date;
}

interface DiaryActions {
  addEntry: (entry: LocalDiaryEntry) => void;
  updateEntry: (local_id: string, updates: Partial<LocalDiaryEntry>) => void;
  deleteEntry: (local_id: string) => void;
  setSelectedDate: (date: string) => void;
  setCurrentMonth: (month: Date) => void;
  getEntriesForDate: (date: string) => LocalDiaryEntry[];
  getEntryDates: () => Set<string>;
  getDaysWithEntries: () => number;
  hydrateFromSupabase: (userId: string) => Promise<void>;
}

export type DiaryStore = DiaryState & DiaryActions;

const todayISO = (): string => new Date().toISOString().split('T')[0] ?? new Date().toISOString();

export const useDiaryStore = create<DiaryStore>()((set, get) => ({
  // State
  entries: new Map<string, LocalDiaryEntry>(),
  selectedDate: todayISO(),
  currentMonth: new Date(),

  // Actions
  addEntry: (entry) =>
    set((state) => {
      const next = new Map(state.entries);
      next.set(entry.local_id, entry);
      return { entries: next };
    }),

  updateEntry: (local_id, updates) =>
    set((state) => {
      const existing = state.entries.get(local_id);
      if (!existing) return state;
      const next = new Map(state.entries);
      next.set(local_id, { ...existing, ...updates });
      return { entries: next };
    }),

  deleteEntry: (local_id) =>
    set((state) => {
      const next = new Map(state.entries);
      next.delete(local_id);
      return { entries: next };
    }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  setCurrentMonth: (month) => set({ currentMonth: month }),

  getEntriesForDate: (date) => {
    const { entries } = get();
    const result: LocalDiaryEntry[] = [];
    for (const entry of entries.values()) {
      if (entry.entry_date === date) {
        result.push(entry);
      }
    }
    return result;
  },

  getEntryDates: () => {
    const { entries } = get();
    const dates = new Set<string>();
    for (const entry of entries.values()) {
      dates.add(entry.entry_date);
    }
    return dates;
  },

  getDaysWithEntries: () => {
    const { entries } = get();
    const dates = new Set<string>();
    for (const entry of entries.values()) {
      dates.add(entry.entry_date);
    }
    return dates.size;
  },

  hydrateFromSupabase: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id, entry_date, text_content, transcription_text, mood, local_id, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to hydrate diary entries', { error: error.message });
        return;
      }

      const entries = new Map<string, LocalDiaryEntry>();
      for (const row of data ?? []) {
        const localId = row.local_id ?? row.id;
        entries.set(localId, {
          local_id: localId,
          entry_date: row.entry_date,
          text_content: row.text_content,
          audio_local_uri: null,
          mood: row.mood,
          sync_status: 'synced',
          remote_id: row.id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          images: [],
        });
      }
      set({ entries });
      logger.info('Diary entries hydrated from Supabase', { count: entries.size });
    } catch (err) {
      logger.error('Unexpected error hydrating diary', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
}));
