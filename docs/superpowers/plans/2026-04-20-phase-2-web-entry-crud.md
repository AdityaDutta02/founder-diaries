# Phase 2: Web + Entry CRUD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the Expo Web platform so users can view, create, and edit diary entries from a browser with full mobile parity (minus audio/camera).

**Architecture:** Platform-detect at the storage layer: on native use SQLite + SecureStore; on web use Supabase-direct + localStorage. The existing Zustand stores and React components render unchanged via React Native Web. Audio recording and image capture are gracefully hidden on web; text entry and image URL display work everywhere.

**Tech Stack:** Expo SDK 55 (web bundler: Metro), React Native Web, Supabase (direct CRUD on web), localStorage (auth persistence on web), Expo Router v4 (web-compatible file routing)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/storage.ts` | NEW - Platform-aware key-value storage (SecureStore on native, localStorage on web) |
| `src/lib/supabase.ts` | MODIFY - Use new storage adapter |
| `src/lib/sqlite.ts` | MODIFY - No-op on web platform |
| `src/lib/platform.ts` | NEW - Platform detection helpers |
| `src/hooks/useDiaryEntry.ts` | MODIFY - On web, write directly to Supabase instead of SQLite + sync queue |
| `src/app/_layout.tsx` | MODIFY - Skip SQLite init + background fetch on web |
| `src/app/(tabs)/diary/new.tsx` | MODIFY - Hide audio recorder button on web |
| `src/components/diary/DiaryEntryCard.tsx` | MODIFY - Hide audio player on web if no audio URL |
| `app.json` | MODIFY - Add web output config |
| `package.json` | MODIFY - Add `web` script |
| `__tests__/lib/storage.test.ts` | NEW - Test storage adapter |

---

## Task 1: Platform Detection Utility

**Files:**
- Create: `src/lib/platform.ts`

- [ ] **Step 1: Create platform utility**

```typescript
// src/lib/platform.ts
import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/platform.ts
git commit -m "feat(web): add platform detection utility"
```

---

## Task 2: Platform-Aware Storage Adapter

**Files:**
- Create: `src/lib/storage.ts`
- Create: `__tests__/lib/storage.test.ts`
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/storage.test.ts
import { storageAdapter } from '@/lib/storage';

describe('storageAdapter', () => {
  it('stores and retrieves a value', async () => {
    await storageAdapter.setItem('test-key', 'test-value');
    const result = await storageAdapter.getItem('test-key');
    expect(result).toBe('test-value');
  });

  it('returns null for missing key', async () => {
    const result = await storageAdapter.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('removes a value', async () => {
    await storageAdapter.setItem('remove-key', 'value');
    await storageAdapter.removeItem('remove-key');
    const result = await storageAdapter.getItem('remove-key');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/lib/storage.test.ts --forceExit -v
```

Expected: `FAIL` — `Cannot find module '@/lib/storage'`

- [ ] **Step 3: Implement storage adapter**

```typescript
// src/lib/storage.ts
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  return {
    getItem: (key) => SecureStore.getItemAsync(sanitizeKey(key)),
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/storage.test.ts --forceExit -v
```

Expected: `PASS` — 3 tests passing

- [ ] **Step 5: Update supabase.ts to use new adapter**

Replace the entire `src/lib/supabase.ts`:

```typescript
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { storageAdapter } from './storage';
import { ENV } from './env';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
```

- [ ] **Step 6: Run all tests**

```bash
npx jest --forceExit
```

Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/lib/storage.ts __tests__/lib/storage.test.ts src/lib/supabase.ts
git commit -m "feat(web): platform-aware storage adapter, replace SecureStore in supabase client"
```

---

## Task 3: SQLite Web Guard

**Files:**
- Modify: `src/lib/sqlite.ts`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Add web guard to sqlite.ts**

Add platform check at the top of `initDatabase` and `getDatabase`:

```typescript
// src/lib/sqlite.ts — add at top of file
import { Platform } from 'react-native';

// ... existing imports ...

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    logger.debug('SQLite not available on web - using Supabase direct');
    return;
  }
  // ... rest of existing implementation unchanged ...
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (Platform.OS === 'web') {
    throw new Error('SQLite is not available on web platform. Use Supabase directly.');
  }
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
}
```

- [ ] **Step 2: Update _layout.tsx to skip native-only init on web**

In `src/app/_layout.tsx`, wrap the background fetch registration and SQLite-dependent code:

Find the `useEffect` that registers `BackgroundFetch` and wrap the body:

```typescript
useEffect(() => {
  if (Platform.OS === 'web') return; // skip on web
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  if (isExpoGo) {
    logger.debug('Skipping background fetch registration in Expo Go');
    return;
  }
  // ... existing BackgroundFetch.registerTaskAsync code ...
}, []);
```

Also add `import { Platform } from 'react-native';` to the imports if not present.

- [ ] **Step 3: Run tsc**

```bash
npx tsc --noEmit
```

Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/sqlite.ts src/app/_layout.tsx
git commit -m "feat(web): guard SQLite and background fetch for web platform"
```

---

## Task 4: Web-Aware Diary Entry Creation

**Files:**
- Modify: `src/hooks/useDiaryEntry.ts`

- [ ] **Step 1: Read existing useDiaryEntry.ts**

Read the file to understand current implementation.

- [ ] **Step 2: Add web path that writes directly to Supabase**

The hook currently writes to SQLite + sync queue. On web, skip SQLite and write directly to Supabase:

```typescript
// At top of file, add:
import { Platform } from 'react-native';

// Inside createEntry function, before the SQLite write:
if (Platform.OS === 'web') {
  // On web: write directly to Supabase (no SQLite, no sync queue)
  const { data, error } = await supabase.functions.invoke('sync-diary', {
    body: {
      entries: [{
        localId: localId,
        entryDate: entryDate,
        textContent: textContent,
        ...(imageStoragePaths?.length ? { imageStoragePaths } : {}),
      }],
    },
  });

  if (error) {
    logger.error('Web diary entry creation failed', { error: error.message });
    throw error;
  }

  // Add to Zustand store
  const entry: LocalDiaryEntry = {
    local_id: localId,
    entry_date: entryDate,
    text_content: textContent,
    audio_local_uri: null,
    mood: mood ?? null,
    sync_status: 'synced',
    remote_id: data?.synced?.[0]?.remoteId ?? null,
    created_at: now,
    updated_at: now,
    images: [],
  };
  addEntry(entry);
  logger.info('Diary entry created (web)', { localId, imageCount: 0 });
  return;
}

// ... existing native SQLite code continues below ...
```

- [ ] **Step 3: Run tests**

```bash
npx jest --forceExit
```

Expected: All tests still pass (tests run in jsdom which reports Platform.OS as different from 'web' in RN context)

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDiaryEntry.ts
git commit -m "feat(web): diary entry creation writes directly to Supabase on web"
```

---

## Task 5: Web-Aware Diary Hydration

**Files:**
- Modify: `src/stores/diaryStore.ts`

- [ ] **Step 1: Ensure hydrateFromSupabase works on web**

The existing `hydrateFromSupabase` already reads from Supabase directly — no SQLite dependency. Verify it's called on web too.

Check `src/app/_layout.tsx` or the diary tab layout to confirm hydration happens regardless of platform. If it only hydrates from SQLite on startup, add a web-specific hydration call.

- [ ] **Step 2: Add hydrateFromSQLite guard**

If there's a `hydrateFromSQLite` function or SQLite read on mount, wrap it:

```typescript
if (Platform.OS !== 'web') {
  // hydrate from local SQLite
  await hydrateFromSQLite();
}
// Always hydrate from Supabase (primary source on web, sync source on native)
await hydrateFromSupabase(userId);
```

- [ ] **Step 3: Run tsc and tests**

```bash
npx tsc --noEmit && npx jest --forceExit
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/diaryStore.ts
git commit -m "feat(web): ensure diary hydration works without SQLite on web"
```

---

## Task 6: Hide Native-Only UI on Web

**Files:**
- Modify: `src/app/(tabs)/diary/new.tsx`
- Modify: `src/app/(tabs)/diary/[date].tsx`

- [ ] **Step 1: Hide audio recorder button on web in new.tsx**

```typescript
import { Platform } from 'react-native';

// Wrap the audio recorder button:
{Platform.OS !== 'web' && (
  <Pressable onPress={showAudioRecorder} ...>
    {/* existing audio button content */}
  </Pressable>
)}
```

- [ ] **Step 2: Hide audio playback UI on web in [date].tsx**

The entry detail screen shows an audio player if `entry.audio_local_uri` exists. On web, local URIs don't work. Hide the audio section:

```typescript
import { Platform } from 'react-native';

// Wrap audio player section:
{Platform.OS !== 'web' && entry.audio_local_uri && (
  // existing audio player UI
)}
```

- [ ] **Step 3: Run tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(tabs\)/diary/new.tsx src/app/\(tabs\)/diary/\[date\].tsx
git commit -m "feat(web): hide audio recorder and playback on web platform"
```

---

## Task 7: Web Build Configuration

**Files:**
- Modify: `package.json`
- Modify: `app.json`

- [ ] **Step 1: Add web script to package.json**

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "build:web": "npx expo export --platform web",
  "test": "jest",
  "lint": "expo lint"
}
```

- [ ] **Step 2: Verify app.json web config**

The web config already exists:
```json
"web": {
  "favicon": "./assets/favicon.png",
  "bundler": "metro"
}
```

Add output directory for web exports:
```json
"web": {
  "favicon": "./assets/favicon.png",
  "bundler": "metro",
  "output": "single"
}
```

- [ ] **Step 3: Test web build starts**

```bash
npx expo start --web --no-dev
```

Expected: Metro bundler starts, web page opens at localhost:8081

- [ ] **Step 4: Commit**

```bash
git add package.json app.json
git commit -m "feat(web): add web build scripts and config"
```

---

## Task 8: Web Entry Editing

**Files:**
- Modify: `src/app/(tabs)/diary/edit/[localId].tsx`

- [ ] **Step 1: Read existing edit screen**

Read `src/app/(tabs)/diary/edit/[localId].tsx` to understand the current edit flow.

- [ ] **Step 2: Add web-aware save logic**

The edit screen likely writes to SQLite. Add web path that updates Supabase directly:

```typescript
import { Platform } from 'react-native';

// In the save/update handler:
if (Platform.OS === 'web') {
  // Update directly in Supabase
  const { error } = await supabase
    .from('diary_entries')
    .update({
      text_content: editedText,
      mood: selectedMood,
      updated_at: new Date().toISOString(),
    })
    .eq('local_id', localId)
    .eq('user_id', session.user.id);

  if (error) {
    logger.error('Web diary entry update failed', { error: error.message });
    showToast('Failed to save changes', 'error');
    return;
  }

  // Update Zustand store
  updateEntry(localId, {
    text_content: editedText,
    mood: selectedMood,
    updated_at: new Date().toISOString(),
  });
  showToast('Entry updated', 'success');
  router.back();
  return;
}

// ... existing native SQLite update code ...
```

- [ ] **Step 3: Hide audio-related edit controls on web**

If the edit screen has audio-related buttons, wrap them with `Platform.OS !== 'web'`.

- [ ] **Step 4: Run tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(tabs\)/diary/edit/\[localId\].tsx
git commit -m "feat(web): diary entry editing writes directly to Supabase on web"
```

---

## Task 9: Web Entry Deletion

**Files:**
- Modify: `src/app/(tabs)/diary/[date].tsx` (if delete button exists here)
- Or: `src/app/(tabs)/diary/edit/[localId].tsx`

- [ ] **Step 1: Find where deletion is handled**

Search for `deleteEntry` usage in diary screens.

- [ ] **Step 2: Add web-aware delete logic**

```typescript
if (Platform.OS === 'web') {
  const { error } = await supabase
    .from('diary_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('local_id', localId)
    .eq('user_id', session.user.id);

  if (error) {
    logger.error('Web diary entry deletion failed', { error: error.message });
    showToast('Failed to delete entry', 'error');
    return;
  }

  deleteEntry(localId);
  showToast('Entry deleted', 'success');
  router.back();
  return;
}
```

- [ ] **Step 3: Run tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add <modified files>
git commit -m "feat(web): diary entry deletion via Supabase on web"
```

---

## Task 10: Verify Web Renders End-to-End

- [ ] **Step 1: Start web dev server**

```bash
npx expo start --web
```

- [ ] **Step 2: Manual verification checklist**

Navigate through these flows in the browser:

1. Sign-in page renders, can enter email/password
2. After auth, diary index shows entries (fetched from Supabase)
3. Calendar week strip renders and is clickable
4. "+" button navigates to new entry screen
5. Can type text and save (no audio button visible)
6. Toast shows "Entry Saved"
7. Entry appears in list
8. Clicking entry shows detail view
9. Can edit entry text and save
10. Settings pages render
11. Content/Discover show "Coming Soon"

- [ ] **Step 3: Fix any rendering issues found**

Address any web-specific rendering problems (e.g., missing styles, gesture handler issues).

- [ ] **Step 4: Run full test suite**

```bash
npx tsc --noEmit && npx jest --forceExit
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix(web): address rendering issues from end-to-end verification"
```

---

## Task 11: Enable web_interface Feature Flag

**Files:**
- Create: `supabase/migrations/20260420000002_enable_web_interface_flag.sql`

- [ ] **Step 1: Create migration**

```sql
-- Phase 2: Enable web interface feature flag
UPDATE feature_flags SET enabled = true WHERE key = 'web_interface';
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260420000002_enable_web_interface_flag.sql
git commit -m "feat(web): enable web_interface feature flag"
```

---

## Task 12: Web Export Build + Deploy Setup

- [ ] **Step 1: Export static web build**

```bash
npx expo export --platform web
```

This creates a `dist/` directory with the static web bundle.

- [ ] **Step 2: Add dist/ to .gitignore**

```bash
echo "dist/" >> .gitignore
```

- [ ] **Step 3: Verify build output**

```bash
npx serve dist/
```

Open localhost:3000 and verify the app loads.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add dist/ to gitignore for web export builds"
```
