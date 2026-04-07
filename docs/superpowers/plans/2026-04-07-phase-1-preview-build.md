# Phase 1 Preview Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a functional preview build (TestFlight + internal Play Store) with diary entry (text/audio/images), auth, offline SQLite, Supabase sync, server-driven feature flags, and PostHog analytics.

**Architecture:** Single `main` branch with a `release/preview` branch cut at the end. All unfinished tabs (Content, Discover) are hidden via a `feature_flags` Supabase table read at startup. The diary save flow is fixed to write through `useDiaryEntry.createEntry()` which handles SQLite + Zustand + sync queue atomically. Analytics use PostHog (self-hostable, zero PII policy).

**Tech Stack:** Expo SDK 55, React Native, Expo Router v4, Supabase (auth + PostgreSQL + Edge Functions), SQLite (expo-sqlite), Zustand v5, TanStack Query v5, PostHog (posthog-react-native), EAS Build (preview profile)

---

## Task 1: Jest Test Infrastructure

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `jest.setup.ts`

- [ ] **Step 1: Install test packages**

```bash
npx expo install jest-expo @testing-library/react-native @testing-library/jest-native
npm install --save-dev @types/jest
```

- [ ] **Step 2: Add jest config to package.json**

Add inside the top-level JSON object (after `"private": true`):

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterFramework": ["./jest.setup.ts"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

- [ ] **Step 3: Create jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-native/extend-expect';
```

- [ ] **Step 4: Run tests to verify setup**

```bash
npx jest --passWithNoTests
```

Expected: `Test Suites: 0 skipped, 0 total`

- [ ] **Step 5: Commit**

```bash
git add package.json jest.setup.ts
git commit -m "test: add jest-expo test infrastructure"
```

---

## Task 2: Environment Variables + Validation

**Files:**
- Modify: `src/lib/env.ts`
- Create: `.env.local` (not committed — add to .gitignore)
- Create: `.env.example`

- [ ] **Step 1: Create .env.local with your actual Supabase credentials**

```bash
# .env.local (NEVER commit this file)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your-posthog-key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_APP_ENV=development
```

Get values from: Supabase Dashboard → Project Settings → API. PostHog key from posthog.com → Project Settings.

- [ ] **Step 2: Verify .env.local is in .gitignore**

```bash
grep -n '\.env\.local' .gitignore || echo ".env.local" >> .gitignore
grep -n '\.env\b' .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 3: Create .env.example**

```bash
# .env.example — copy to .env.local and fill in values
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your-key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_APP_ENV=development
```

- [ ] **Step 4: Update src/lib/env.ts with Zod validation**

```typescript
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
```

- [ ] **Step 5: Write test for env validation**

```typescript
// __tests__/lib/env.test.ts
describe('ENV', () => {
  it('exports SUPABASE_URL and SUPABASE_ANON_KEY when env vars are set', () => {
    // The module is already loaded with test env vars from jest setup
    // This test just verifies the shape of the export
    const { ENV } = require('@/lib/env');
    expect(ENV).toHaveProperty('SUPABASE_URL');
    expect(ENV).toHaveProperty('SUPABASE_ANON_KEY');
    expect(ENV).toHaveProperty('POSTHOG_API_KEY');
    expect(ENV).toHaveProperty('APP_ENV');
  });
});
```

Add to `jest.setup.ts` (before the extend-expect import):
```typescript
// Set test env vars so env.ts doesn't throw during tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_APP_ENV = 'development';
```

- [ ] **Step 6: Run tests**

```bash
npx jest __tests__/lib/env.test.ts -v
```

Expected: `PASS __tests__/lib/env.test.ts`

- [ ] **Step 7: Commit**

```bash
git add src/lib/env.ts jest.setup.ts .env.example .gitignore
git commit -m "feat: add Zod validation to env vars, add PostHog + APP_ENV vars"
```

---

## Task 3: Feature Flags Migration

**Files:**
- Create: `supabase/migrations/20260407000001_create_feature_flags.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260407000001_create_feature_flags.sql

CREATE TABLE feature_flags (
  key                   TEXT PRIMARY KEY,
  enabled               BOOLEAN NOT NULL DEFAULT false,
  enabled_for_user_ids  UUID[] DEFAULT NULL,
  rollout_pct           INTEGER NOT NULL DEFAULT 100
                          CHECK (rollout_pct >= 0 AND rollout_pct <= 100),
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Authenticated users can read flags; only service role can write
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read feature flags"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed initial flags — all off except diary_core
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('diary_core',          true,  'Auth + diary entry CRUD + offline sync'),
  ('rag_pipeline',        false, 'Background embeddings + writing profile'),
  ('web_interface',       false, 'Expo Web entry CRUD'),
  ('creator_discovery',   false, 'Creator matching + writing profiles'),
  ('content_generation',  false, 'AI post generation'),
  ('rich_formats',        false, 'Threads + carousels + AI images'),
  ('notifications',       false, 'Push notification flows'),
  ('scheduling',          false, 'Content calendar + scheduling'),
  ('monetization',        false, 'RevenueCat paywall'),
  ('auto_posting',        false, 'Direct social API publishing');
```

- [ ] **Step 2: Run the migration against your Supabase project**

```bash
npx supabase db push --linked
```

Expected output includes: `Applying migration 20260407000001_create_feature_flags.sql`

- [ ] **Step 3: Verify in Supabase Dashboard**

Open Supabase Dashboard → Table Editor → `feature_flags`. Confirm 10 rows exist with `diary_core` enabled and all others disabled.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260407000001_create_feature_flags.sql
git commit -m "feat(db): add feature_flags table with initial Phase 1 seed"
```

---

## Task 4: useFeatureFlag Hook

**Files:**
- Create: `src/hooks/useFeatureFlag.ts`
- Create: `__tests__/hooks/useFeatureFlag.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/hooks/useFeatureFlag.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

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
      wrapper: createWrapper(),
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
      wrapper: createWrapper(),
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
      wrapper: createWrapper(),
    });

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
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/hooks/useFeatureFlag.test.ts -v
```

Expected: `FAIL` — `Cannot find module '@/hooks/useFeatureFlag'`

- [ ] **Step 3: Implement useFeatureFlag**

```typescript
// src/hooks/useFeatureFlag.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  enabled_for_user_ids: string[] | null;
  rollout_pct: number;
}

async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, enabled, enabled_for_user_ids, rollout_pct');

  if (error) {
    logger.error('Failed to fetch feature flags', { error: error.message });
    throw error;
  }

  return data ?? [];
}

export function useFeatureFlag(key: string): boolean {
  const { data } = useQuery<FeatureFlag[], Error>({
    queryKey: ['feature_flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Fail closed: if query hasn't resolved or errored, default to false
  if (!data) return false;

  const flag = data.find((f) => f.key === key);
  if (!flag) return false;

  return flag.enabled;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/hooks/useFeatureFlag.test.ts -v
```

Expected: `PASS` — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFeatureFlag.ts __tests__/hooks/useFeatureFlag.test.ts
git commit -m "feat: add useFeatureFlag hook with fail-closed behavior"
```

---

## Task 5: Gate Content + Discover Tabs

**Files:**
- Modify: `src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Update tab layout to gate non-diary tabs**

Replace the entire contents of `src/app/(tabs)/_layout.tsx`:

```typescript
// src/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import FloatingTabBar from '@/components/layout/FloatingTabBar';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function TabsLayout() {
  const contentEnabled = useFeatureFlag('content_generation');
  const discoverEnabled = useFeatureFlag('creator_discovery');

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="diary"    options={{ title: 'Diary' }} />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Content',
          href: contentEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          href: discoverEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Start the app and verify only Diary + Settings tabs appear**

```bash
npx expo start --ios
```

Expected: Floating tab bar shows only Diary and Settings tabs. Content and Discover are hidden.

- [ ] **Step 3: Commit**

```bash
git add src/app/(tabs)/_layout.tsx
git commit -m "feat: gate Content and Discover tabs behind feature flags"
```

---

## Task 6: Fix Diary Save — Extend useDiaryEntry for Images

**Files:**
- Modify: `src/hooks/useDiaryEntry.ts`
- Create: `__tests__/hooks/useDiaryEntry.test.ts`

The bug: `new.tsx` calls `addEntry()` (Zustand only) which skips SQLite and the sync queue. The fix: extend `useDiaryEntry.createEntry()` to accept images, then update `new.tsx` to call it.

- [ ] **Step 1: Write failing tests for image handling in createEntry**

```typescript
// __tests__/hooks/useDiaryEntry.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';

// Mock SQLite
const mockRunAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/sqlite', () => ({
  getDatabase: () => ({ runAsync: mockRunAsync }),
}));

// Mock sync service
jest.mock('@/services/syncService', () => ({
  addToSyncQueue: jest.fn().mockResolvedValue(undefined),
}));

// Mock crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
}));

// Mock auth store — authenticated user
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { session: { user: { id: string } } | null }) => unknown) =>
    selector({ session: { user: { id: 'user-123' } } }),
}));

// Mock diary store — minimal
jest.mock('@/stores/diaryStore', () => ({
  useDiaryStore: (selector: (s: unknown) => unknown) =>
    selector({
      selectedDate: '2026-04-07',
      getEntriesForDate: () => [],
      getEntryDates: () => new Set(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
      entries: new Map(),
    }),
}));

describe('useDiaryEntry.createEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes entry to SQLite', async () => {
    const { result } = renderHook(() => useDiaryEntry());

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-04-07',
        text_content: 'Today I shipped the MVP',
        mood: 'Shipped It',
      });
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO diary_entries'),
      expect.arrayContaining(['test-uuid-1234', '2026-04-07', 'Today I shipped the MVP']),
    );
  });

  it('writes images to SQLite when provided', async () => {
    const { result } = renderHook(() => useDiaryEntry());

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-04-07',
        text_content: 'Entry with image',
        images: [
          { local_id: 'img-1', local_uri: 'file:///path/to/image.jpg' },
        ],
      });
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO diary_images'),
      expect.arrayContaining(['img-1', 'test-uuid-1234', 'file:///path/to/image.jpg']),
    );
  });

  it('adds upload_image to sync queue for each image', async () => {
    const { addToSyncQueue } = require('@/services/syncService');
    const { result } = renderHook(() => useDiaryEntry());

    await act(async () => {
      await result.current.createEntry({
        entry_date: '2026-04-07',
        text_content: 'Entry with image',
        images: [
          { local_id: 'img-1', local_uri: 'file:///path/to/image.jpg' },
        ],
      });
    });

    expect(addToSyncQueue).toHaveBeenCalledWith('upload_image', expect.objectContaining({
      imageLocalUri: 'file:///path/to/image.jpg',
      localImageId: 'img-1',
    }));
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/hooks/useDiaryEntry.test.ts -v
```

Expected: `FAIL` — type errors or "images is not a valid property"

- [ ] **Step 3: Update useDiaryEntry.ts to accept and persist images**

Replace the full file content:

```typescript
// src/hooks/useDiaryEntry.ts
import { useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/lib/sqlite';
import { logger } from '@/lib/logger';
import { useDiaryStore, type LocalDiaryEntry, type LocalDiaryImage } from '@/stores/diaryStore';
import { addToSyncQueue } from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';

export interface ImageInput {
  local_id: string;
  local_uri: string;
}

export interface CreateEntryData {
  entry_date: string;
  text_content?: string;
  audio_local_uri?: string;
  mood?: string;
  images?: ImageInput[];
}

export interface UpdateEntryData {
  text_content?: string;
  audio_local_uri?: string;
  mood?: string;
}

export interface UseDiaryEntryReturn {
  entries: LocalDiaryEntry[];
  allEntryDates: Set<string>;
  createEntry: (data: CreateEntryData) => Promise<LocalDiaryEntry>;
  updateEntry: (id: string, data: UpdateEntryData) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export function useDiaryEntry(): UseDiaryEntryReturn {
  const {
    selectedDate,
    getEntriesForDate,
    getEntryDates,
    addEntry,
    updateEntry: storeUpdate,
    deleteEntry: storeDelete,
  } = useDiaryStore();

  const { session } = useAuthStore();

  const entries = getEntriesForDate(selectedDate);
  const allEntryDates = getEntryDates();

  const createEntry = useCallback(
    async (data: CreateEntryData): Promise<LocalDiaryEntry> => {
      const localId = Crypto.randomUUID();
      const now = new Date().toISOString();
      const userId = session?.user.id;

      const localImages: LocalDiaryImage[] = (data.images ?? []).map((img) => ({
        local_id: img.local_id,
        diary_local_id: localId,
        local_uri: img.local_uri,
        sync_status: 'pending' as const,
        remote_id: null,
        created_at: now,
      }));

      const newEntry: LocalDiaryEntry = {
        local_id: localId,
        entry_date: data.entry_date,
        text_content: data.text_content ?? null,
        audio_local_uri: data.audio_local_uri ?? null,
        mood: data.mood ?? null,
        sync_status: 'pending',
        remote_id: null,
        created_at: now,
        updated_at: now,
        images: localImages,
      };

      const db = getDatabase();

      // 1. Write entry to SQLite
      await db.runAsync(
        `INSERT INTO diary_entries
           (local_id, entry_date, text_content, audio_local_uri, mood, sync_status, remote_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, ?)`,
        [
          localId,
          data.entry_date,
          data.text_content ?? null,
          data.audio_local_uri ?? null,
          data.mood ?? null,
          now,
          now,
        ],
      );

      // 2. Write images to SQLite
      for (const img of localImages) {
        await db.runAsync(
          `INSERT INTO diary_images
             (local_id, diary_local_id, local_uri, sync_status, remote_id, created_at)
           VALUES (?, ?, ?, 'pending', NULL, ?)`,
          [img.local_id, localId, img.local_uri, now],
        );
      }

      // 3. Update Zustand store
      addEntry(newEntry);

      // 4. Add entry to sync queue
      await addToSyncQueue('create_entry', {
        localId,
        entryDate: data.entry_date,
        textContent: data.text_content ?? '',
        userId,
      });

      // 5. Add each image to sync queue
      for (const img of localImages) {
        await addToSyncQueue('upload_image', {
          imageLocalUri: img.local_uri,
          localImageId: img.local_id,
          entryId: localId,
          userId,
        });
      }

      logger.info('Diary entry created', {
        localId,
        imageCount: localImages.length,
      });
      return newEntry;
    },
    [addEntry, session],
  );

  const updateEntry = useCallback(
    async (id: string, data: UpdateEntryData): Promise<void> => {
      const now = new Date().toISOString();

      const db = getDatabase();
      await db.runAsync(
        `UPDATE diary_entries
         SET text_content = COALESCE(?, text_content),
             audio_local_uri = COALESCE(?, audio_local_uri),
             mood = COALESCE(?, mood),
             sync_status = 'pending',
             updated_at = ?
         WHERE local_id = ?`,
        [
          data.text_content ?? null,
          data.audio_local_uri ?? null,
          data.mood ?? null,
          now,
          id,
        ],
      );

      storeUpdate(id, { ...data, sync_status: 'pending', updated_at: now });

      const entryDate = useDiaryStore.getState().entries.get(id)?.entry_date;

      await addToSyncQueue('update_entry', {
        localId: id,
        entryDate,
        textContent: data.text_content,
        userId: session?.user.id,
      });

      logger.info('Diary entry updated', { id });
    },
    [storeUpdate, session],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      const db = getDatabase();
      await db.runAsync(`DELETE FROM diary_entries WHERE local_id = ?`, [id]);
      storeDelete(id);
      logger.info('Diary entry deleted', { id });
    },
    [storeDelete],
  );

  return { entries, allEntryDates, createEntry, updateEntry, deleteEntry };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/hooks/useDiaryEntry.test.ts -v
```

Expected: `PASS` — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDiaryEntry.ts __tests__/hooks/useDiaryEntry.test.ts
git commit -m "feat: extend useDiaryEntry.createEntry to persist images to SQLite + sync queue"
```

---

## Task 7: Fix New Entry Screen to Use useDiaryEntry Hook

**Files:**
- Modify: `src/app/(tabs)/diary/new.tsx`

The current `handleSave` builds a `LocalDiaryEntry` manually and calls `addEntry` (Zustand-only). It must call `useDiaryEntry.createEntry()` instead, which handles SQLite + sync queue atomically.

- [ ] **Step 1: Replace handleSave and imports in new.tsx**

Find the import block at the top of `src/app/(tabs)/diary/new.tsx` and replace:

```typescript
import { useDiaryStore } from '@/stores/diaryStore';
import { useSyncStore } from '@/stores/syncStore';
```

with:

```typescript
import { useDiaryEntry } from '@/hooks/useDiaryEntry';
```

Also remove the `LocalDiaryEntry` and `LocalDiaryImage` type imports — they are no longer used directly.

The updated import block becomes:

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { format } from 'date-fns';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';
import { useUIStore } from '@/stores/uiStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
```

- [ ] **Step 2: Replace the component internals**

Find these lines in `NewEntryScreen`:

```typescript
const addEntry = useDiaryStore((state) => state.addEntry);
const incrementPending = useSyncStore((state) => state.incrementPending);
```

Replace with:

```typescript
const { createEntry } = useDiaryEntry();
```

- [ ] **Step 3: Replace handleSave**

Find the `handleSave` callback and replace it:

```typescript
const handleSave = useCallback(async () => {
  if (!hasContent || isSaving) return;

  setIsSaving(true);
  try {
    const imageInputs = images.map((img) => ({
      local_id: img.local_id,
      local_uri: img.local_uri,
    }));

    await createEntry({
      entry_date: todayISO(),
      text_content: text.trim() || undefined,
      audio_local_uri: audioUri ?? undefined,
      mood: mood ?? undefined,
      images: imageInputs,
    });

    router.back();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save entry';
    Alert.alert('Save Failed', message);
  } finally {
    setIsSaving(false);
  }
}, [hasContent, isSaving, text, mood, audioUri, images, createEntry, router]);
```

- [ ] **Step 4: Remove the images state initialiser that referenced LocalDiaryImage type**

The `images` state was typed as `LocalDiaryImage[]`. Change it to a plain array of `{ local_id: string; local_uri: string }`:

Find:
```typescript
const [images, setImages] = useState<LocalDiaryImage[]>([]);
```

Replace with:
```typescript
const [images, setImages] = useState<Array<{ local_id: string; local_uri: string }>>([]);
```

Find the `useEffect` that maps `pendingImageUris` to `LocalDiaryImage[]`:
```typescript
const newImages: LocalDiaryImage[] = pendingImageUris.map((uri) => ({
  local_id: Crypto.randomUUID(),
  diary_local_id: '',
  local_uri: uri,
  sync_status: 'pending' as const,
  remote_id: null,
  created_at: new Date().toISOString(),
}));
```

Replace with:
```typescript
const newImages = pendingImageUris.map((uri) => ({
  local_id: Crypto.randomUUID(),
  local_uri: uri,
}));
```

- [ ] **Step 5: Start the app and manually test the full entry save flow**

```bash
npx expo start --ios
```

Test checklist:
- [ ] Sign in succeeds
- [ ] Tap "New Entry"
- [ ] Type text → tap Save → entry appears in diary list
- [ ] Open app again → entry still there (SQLite persisted)
- [ ] Record audio → tap Save → audio chip appears, entry saves
- [ ] Add photo → tap Save → entry saves with image

- [ ] **Step 6: Commit**

```bash
git add src/app/(tabs)/diary/new.tsx
git commit -m "fix: diary new entry save now persists to SQLite + sync queue via useDiaryEntry"
```

---

## Task 8: PostHog Analytics Setup

**Files:**
- Create: `src/lib/posthog.ts`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Install PostHog**

```bash
npx expo install posthog-react-native
```

- [ ] **Step 2: Create the PostHog client**

```typescript
// src/lib/posthog.ts
import PostHog from 'posthog-react-native';
import { ENV } from './env';

export const posthog = new PostHog(ENV.POSTHOG_API_KEY, {
  host: ENV.POSTHOG_HOST,
  // Disable in development to avoid polluting analytics
  disabled: ENV.APP_ENV === 'development' || ENV.POSTHOG_API_KEY === '',
  // Capture session replays (opt-in, off by default)
  enableSessionReplay: false,
});
```

- [ ] **Step 3: Add PostHogProvider to root layout**

In `src/app/_layout.tsx`, add the PostHog import at the top of the imports:

```typescript
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';
```

Wrap the return of `RootLayout` to add `PostHogProvider`. Find:

```typescript
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider>
```

Replace with:

```typescript
export default function RootLayout() {
  return (
    <PostHogProvider client={posthog}>
      <GestureHandlerRootView style={styles.flex}>
        <ThemeProvider>
```

And close the tag at the end of the return:

```typescript
        </ThemeProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}
```

- [ ] **Step 4: Verify PostHog initialises without errors**

```bash
npx expo start --ios
```

Expected: App starts normally. Check Metro logs for any PostHog errors. No crash.

- [ ] **Step 5: Commit**

```bash
git add src/lib/posthog.ts src/app/_layout.tsx
git commit -m "feat: add PostHog analytics provider to root layout"
```

---

## Task 9: Add Core Analytics Events

**Files:**
- Modify: `src/app/(auth)/sign-in.tsx`
- Modify: `src/app/(auth)/sign-up.tsx`
- Modify: `src/hooks/useDiaryEntry.ts`

Events to track:
- `user_signed_in` — on successful sign in
- `user_signed_up` — on successful sign up  
- `diary_entry_created` — on entry save (no content, only metadata)

- [ ] **Step 1: Add sign_in event to sign-in.tsx**

In `src/app/(auth)/sign-in.tsx`, add the import:

```typescript
import { usePostHog } from 'posthog-react-native';
```

At the top of `SignInScreen`, add:

```typescript
const posthog = usePostHog();
```

After `setSession(data.session)` succeeds (inside `handleSignIn`), add:

```typescript
posthog.capture('user_signed_in', { method: 'email' });
```

- [ ] **Step 2: Add sign_up event to sign-up.tsx**

In `src/app/(auth)/sign-up.tsx`, add:

```typescript
import { usePostHog } from 'posthog-react-native';
```

At the top of `SignUpScreen`:

```typescript
const posthog = usePostHog();
```

After successful sign-up (after `setSession` is called), add:

```typescript
posthog.capture('user_signed_up', { method: 'email' });
```

- [ ] **Step 3: Add diary_entry_created event in useDiaryEntry**

In `src/hooks/useDiaryEntry.ts`, add at the top:

```typescript
import { usePostHog } from 'posthog-react-native';
```

Inside `useDiaryEntry()`, add:

```typescript
const posthog = usePostHog();
```

At the end of `createEntry`, just before `return newEntry`, add:

```typescript
posthog.capture('diary_entry_created', {
  has_text: Boolean(data.text_content),
  has_audio: Boolean(data.audio_local_uri),
  image_count: localImages.length,
  mood: data.mood ?? null,
  // NEVER log entry content — PII policy
});
```

- [ ] **Step 4: Run full test suite**

```bash
npx jest --passWithNoTests
```

Expected: All tests pass. The tests for `useDiaryEntry` may need PostHog mocked — add to mock setup:

```typescript
// In __tests__/hooks/useDiaryEntry.test.ts, add to the mock list:
jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({ capture: jest.fn() }),
}));
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(auth)/sign-in.tsx src/app/(auth)/sign-up.tsx src/hooks/useDiaryEntry.ts
git commit -m "feat: add PostHog events for sign_in, sign_up, diary_entry_created"
```

---

## Task 10: Backup Edge Function Stub

**Files:**
- Create: `supabase/functions/backup-trigger/index.ts`

This is a stub for Phase 1 — the CI pipeline requires it to exist but the real pg_dump logic is added in Phase 1.5.

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/backup-trigger/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface BackupRequest {
  triggered_by: string;
  phase: string;
}

interface BackupResponse {
  status: 'success' | 'skipped';
  message: string;
  triggered_by: string;
  phase: string;
  timestamp: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json() as BackupRequest;

  // Stub: Phase 1 backup is a no-op — real pg_dump logic added in Phase 1.5
  const response: BackupResponse = {
    status: 'skipped',
    message: 'Backup stub — Phase 1.5 will implement full pg_dump to Storage',
    triggered_by: body.triggered_by ?? 'unknown',
    phase: body.phase ?? 'unknown',
    timestamp: new Date().toISOString(),
  };

  console.log('[backup-trigger] Called', {
    triggered_by: response.triggered_by,
    phase: response.phase,
  });

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy the edge function**

```bash
npx supabase functions deploy backup-trigger --linked
```

Expected: `Deployed backup-trigger`

- [ ] **Step 3: Verify it responds**

```bash
curl -X POST \
  https://your-project-id.supabase.co/functions/v1/backup-trigger \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"triggered_by": "manual", "phase": "1"}'
```

Expected response:
```json
{"status":"skipped","message":"Backup stub — Phase 1.5 will implement full pg_dump to Storage",...}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/backup-trigger/index.ts
git commit -m "feat(edge): add backup-trigger edge function stub for CI pipeline"
```

---

## Task 11: Set EAS Environment Variables + Cut release/preview Branch

**Files:**
- Modify: `eas.json` (add env block to preview profile)

- [ ] **Step 1: Add environment variables to EAS dashboard**

Go to: https://expo.dev → Your project → Environment Variables

Add these for the **preview** environment:
```
EXPO_PUBLIC_SUPABASE_URL       = https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY  = your-anon-key
EXPO_PUBLIC_POSTHOG_API_KEY    = phc_your-key
EXPO_PUBLIC_POSTHOG_HOST       = https://us.i.posthog.com
EXPO_PUBLIC_APP_ENV            = preview
```

- [ ] **Step 2: Update eas.json to reference env in preview profile**

Replace the `"preview"` block in `eas.json`:

```json
"preview": {
  "distribution": "internal",
  "env": {
    "EXPO_PUBLIC_APP_ENV": "preview"
  }
}
```

- [ ] **Step 3: Cut the release/preview branch**

```bash
git checkout -b release/preview
git push -u origin release/preview
```

- [ ] **Step 4: Tag the Phase 1 build point**

```bash
git tag preview-v1.0.0
git push origin preview-v1.0.0
```

- [ ] **Step 5: Commit eas.json**

```bash
git add eas.json
git commit -m "ci: add APP_ENV to EAS preview build profile"
```

---

## Task 12: Run EAS Preview Build

- [ ] **Step 1: Verify EAS CLI is installed and logged in**

```bash
eas whoami
```

Expected: Your Expo account username. If not logged in: `eas login`

- [ ] **Step 2: Build for both platforms**

```bash
eas build --profile preview --platform all
```

Expected: Build queued for iOS + Android. EAS returns two build URLs.

- [ ] **Step 3: Monitor build progress**

```bash
eas build:list --limit 2
```

Builds take 10–20 minutes. Monitor at https://expo.dev → Builds.

- [ ] **Step 4: Distribute**

Once builds complete:

**iOS (TestFlight):**
```bash
eas submit --platform ios --latest
```
Then in App Store Connect → TestFlight → Add internal testers.

**Android (Play Console internal testing):**
```bash
eas submit --platform android --latest
```
Then in Play Console → Internal testing → Add testers.

- [ ] **Step 5: Verify on device**

On a physical iOS/Android device with the TestFlight/Play app:
- [ ] Install the preview build
- [ ] Sign up with a new account
- [ ] Complete onboarding
- [ ] Create a text diary entry → verify it appears in list
- [ ] Kill and reopen app → verify entry persists
- [ ] Only Diary + Settings tabs visible

- [ ] **Step 6: Final commit on release/preview**

```bash
git checkout release/preview
git log --oneline -5  # confirm all tasks landed
git push origin release/preview
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Auth + diary entry (text/audio/photos) | Task 7 (fix save), underlying hooks already built |
| SQLite offline-first | Task 6 (createEntry writes to SQLite) |
| Supabase sync | Task 6 (sync queue), syncService already implemented |
| Feature flags table + hook | Tasks 3, 4 |
| Gate Content + Discover tabs | Task 5 |
| PostHog analytics | Tasks 8, 9 |
| Pre-OTA backup edge function | Task 10 |
| release/preview branch | Task 11 |
| EAS preview build | Task 12 |
| Env validation (Zod) | Task 2 |

**No gaps found.** All spec sections map to tasks.

**Type consistency check:**
- `ImageInput` (Task 6) matches usage in `new.tsx` (Task 7) ✅
- `ENV.POSTHOG_API_KEY` (Task 2) matches usage in `posthog.ts` (Task 8) ✅
- `useFeatureFlag('content_generation')` (Task 5) matches seed key in migration (Task 3) ✅
