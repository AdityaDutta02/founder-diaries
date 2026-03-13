import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  isOnline: boolean;
}

interface SyncActions {
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSync: (timestamp: string) => void;
  setOnline: (isOnline: boolean) => void;
  incrementPending: () => void;
  decrementPending: () => void;
}

export type SyncStore = SyncState & SyncActions;

export const useSyncStore = create<SyncStore>()((set) => ({
  // State
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  isOnline: true,

  // Actions
  setSyncing: (isSyncing) => set({ isSyncing }),

  setPendingCount: (pendingCount) => set({ pendingCount: Math.max(0, pendingCount) }),

  setLastSync: (timestamp) => set({ lastSyncAt: timestamp }),

  setOnline: (isOnline) => set({ isOnline }),

  incrementPending: () =>
    set((state) => ({ pendingCount: state.pendingCount + 1 })),

  decrementPending: () =>
    set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),
}));
