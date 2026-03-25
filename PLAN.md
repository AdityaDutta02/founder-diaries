# Founder Diaries — Remaining Tasks

Last updated: 2026-03-14

---

## 🔴 Critical (Blocking core functionality)

### 1. Deploy Edge Functions
```bash
supabase functions deploy
```
All 9 Edge Functions are written but must be deployed before sync, content generation, transcription, or persona building will work.

### 2. Set Up Daily CRON ✅ (manual step)
- Supabase Dashboard → Edge Functions → `daily-generation-cron` → Schedule
- Cron expression: `0 6 * * *` (6am UTC daily)
- This triggers content generation for all users every morning

### 3. Create Development Build
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```
Required for:
- Audio recording (expo-av not available in Expo Go)
- Push notifications (expo-notifications removed from Expo Go SDK 53+)
- Background sync (expo-background-fetch not available in Expo Go)

---

## 🟡 High Priority (Core features incomplete)

### 4. Diary Entry Edit Screen ✅
**File:** `src/app/(tabs)/diary/edit/[localId].tsx` — created

- Edit screen pre-fills `DiaryEntryForm` with existing entry data
- Edit button in `[date].tsx` wired to `router.push`
- Saves via `useDiaryEntry.updateEntry` (SQLite + store + sync queue)
- Fixed pre-existing bug: `update_entry` sync payload was missing `entryDate`

### 5. Image Sync Implementation ✅
**File:** `src/services/syncService.ts`

- `upload_image` fully implemented: reads file, uploads to Supabase Storage, updates `diary_images` table
- Dependency check: defers (re-queues without burning retry budget) if parent entry not yet synced
- `localImageId` field added to `SyncQueuePayload`

### 6. Background Sync Registration ✅
**File:** `src/app/_layout.tsx`

- `TaskManager.defineTask('background-sync', ...)` at module level
- `BackgroundFetch.registerTaskAsync` in `useEffect`, guarded by Expo Go check
- Calls `syncPendingEntries()` on background wake

---

## 🟠 Medium Priority (Experience improvements)

### 7. Push Notification Token Registration ✅
**Files:** `src/services/notificationService.ts`, `src/stores/authStore.ts`, `supabase/migrations/20260314000001_add_expo_push_token.sql`

- `registerPushToken(userId)` exported from notificationService
- Called fire-and-forget after profile fetch on init and auth state change
- Migration adds `expo_push_token TEXT` to profiles table
- Token registration is best-effort (non-fatal on failure)
- Note: EAS projectId must be configured for token registration to work in production builds

### 8. App Icon + Splash Screen
**Files:** `assets/icon.png`, `assets/splash.png`, `app.json`

Still using default Expo assets. Replace with Founder Diaries branding before any TestFlight/Play Store submission.

### 9. CRON Timezone Handling Verification
**File:** `supabase/functions/daily-generation-cron/index.ts`

The CRON fires at 6am UTC. Verify the function correctly converts to each user's local timezone (stored in `profiles.timezone`) before generating content. Users in UTC+5:30 should get content at 6am IST, not 6am UTC.

### 10. Diary Calendar Entry Dots
**File:** `src/components/diary/DiaryCalendar.tsx`

Verify that the calendar correctly shows dots on days with entries. The `diaryStore` has a `getEntryDates()` helper — confirm it's wired into the calendar component and updating reactively when new entries are added.

---

## 🔵 Lower Priority (Polish + scale)

### 11. Unit Tests
No tests exist. Minimum coverage needed before beta:
- `src/services/syncService.ts` — queue processing logic
- `src/services/exportService.ts` — HTML generation
- `src/stores/contentStore.ts` — weekly quota calculation
- `src/utils/dateUtils.ts` — date formatting helpers

```bash
npx jest --init   # set up Jest with expo preset
```

### 12. Error Boundaries
No React error boundaries exist. A crash in any tab component brings down the whole app. Add per-tab error boundaries wrapping each tab's Stack.

### 13. Offline Banner
When `isOnline = false` in `syncStore`, show a subtle banner on the diary screen ("Saving locally — will sync when connected"). The `useNetworkStatus` hook already tracks this.

### 14. Content Queue Drag-to-Reorder
**File:** `src/app/(tabs)/content/queue.tsx`

The PRD specifies drag-to-reorder for approved posts. Currently a static SectionList. Implement with `react-native-draggable-flatlist` or Reanimated drag gestures.

### 15. Delete Account (GDPR)
**File:** `src/app/(tabs)/settings/account.tsx`

The delete account button exists in the UI but calls a `delete_user_account` Supabase RPC that hasn't been created. Need:
- SQL function `delete_user_account(user_id)` that cascades deletes all user data
- Storage bucket cleanup (audio, images)
- Auth user deletion via admin API

---

## Build & Release Checklist

- [ ] Edge Functions deployed (`supabase functions deploy`)
- [ ] Daily CRON scheduled in Supabase Dashboard
- [ ] Dev build created and tested on real device
- [ ] Audio recording tested end-to-end
- [ ] Diary sync tested (write entry → check Supabase table)
- [ ] Content generation tested (write 1+ entries → trigger cron manually → check generated_posts)
- [ ] App icon + splash screen replaced
- [ ] Push notification token registration working
- [ ] TestFlight (iOS) or Internal Testing track (Android) submission

---

## Quick Reference

| Command | Purpose |
|---|---|
| `supabase functions deploy` | Deploy all Edge Functions |
| `supabase db push` | Push pending migrations |
| `supabase secrets list` | Verify all secrets are set |
| `npx expo run:android` | Create Android dev build |
| `npx expo run:ios` | Create iOS dev build |
| `npx expo start --clear` | Start Metro with clean cache |
