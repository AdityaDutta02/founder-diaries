import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useFeatureFlag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when flag is enabled', async () => {
    const { supabase } = require('@/lib/supabase');
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ key: 'diary_core', enabled: true, enabled_for_user_ids: null, rollout_pct: 100 }],
        error: null,
      }),
    });

    const { result } = renderHook(() => useFeatureFlag('diary_core'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false when flag is disabled', async () => {
    const { supabase } = require('@/lib/supabase');
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ key: 'content_generation', enabled: false, enabled_for_user_ids: null, rollout_pct: 100 }],
        error: null,
      }),
    });

    const { result } = renderHook(() => useFeatureFlag('content_generation'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('fails closed (returns false) when Supabase errors', async () => {
    const { supabase } = require('@/lib/supabase');
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      }),
    });

    const { result } = renderHook(() => useFeatureFlag('diary_core'), {
      wrapper: makeWrapper(),
    });

    // On error, TanStack Query throws — hook should return false (not crash)
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('returns false for unknown flag key', async () => {
    const { supabase } = require('@/lib/supabase');
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ key: 'diary_core', enabled: true, enabled_for_user_ids: null, rollout_pct: 100 }],
        error: null,
      }),
    });

    const { result } = renderHook(() => useFeatureFlag('nonexistent_flag'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
