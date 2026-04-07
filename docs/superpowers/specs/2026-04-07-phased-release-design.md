# Founder Diaries — Phased Release Design

**Date:** 2026-04-07  
**Status:** Approved  
**Author:** Aditya (via Claude Code brainstorming)

---

## 1. Goals

- Ship a Phase 1 preview build (iOS + Android) today for internal testing
- Deliver all subsequent phases as OTA updates with zero data loss
- Keep Supabase fully self-hostable with no vendor lock-in
- Ensure all user data remains confidential — never exposed to AI providers from the client
- Maintain a single codebase with no branch divergence across 11+ phases

---

## 2. Phase Plan

| Phase | Name | Delivery | Scope |
|-------|------|----------|-------|
| 1 | Diary Core | Preview build today | Auth (email + Apple + Google), text/audio/photo diary entries, SQLite offline-first, Supabase sync, mood/energy tagging, basic event analytics |
| 1.5 | RAG Pipeline | OTA (~1–2 weeks post Phase 1) | Background embedding pipeline (pgvector), writing profile builder, silent until 5+ entries, toast notification: "Your content profile is ready" |
| 2 | Web + Entry CRUD | OTA | Expo Web interface for viewing/adding/editing entries, web/mobile parity for diary CRUD |
| 3 | Creator Discovery | OTA | LinkedIn + X creator matching per user, writing profiles display, scraped creator content samples — backend already scaffolded |
| 4 | AI Content Generation | OTA | Text post generation for LinkedIn, X, Instagram; post preview + in-app editing; generation queue |
| 5 | Rich Formats | OTA | Thread generation (X), carousel generation (LinkedIn/Instagram), AI image generation for posts — bundled as one OTA |
| 6 | Notifications | OTA | Push notifications: daily entry reminder, "content is ready", posting reminders |
| 7 | Scheduling | OTA | Content calendar, schedule posts for later, manual posting with one-tap copy/share |
| 8 | Monetization + Analytics | Store update + OTA | RevenueCat subscription paywall, in-app usage analytics dashboard, engagement metrics |
| 9 | Auto-posting | Store update | Direct API publishing to X, LinkedIn, Instagram via OAuth (requires new native URL scheme handlers — full EAS build required) |

### Phase consolidation rationale

- **Threads + Carousels → Phase 5 (bundled):** Same AI pipeline and format-template infrastructure. No benefit to separating.
- **Web parity is continuous:** Expo Web renders mobile screens on web from Phase 2 onwards. No dedicated "web phase."
- **RAG as silent Phase 1.5:** Runs in background without user action. Surfaced via notification only, not a blocking UX step.
- **Monetization added as Phase 8:** First paywall gate after auto-posting value is proven in Phase 7.
- **Analytics in Phase 1:** Instrumentation must exist from day one. Retrofitting is expensive and loses early data.
- **Phase 9 requires store update:** Auto-posting OAuth deeplinks require native URL scheme handler registration — cannot be OTA.

---

## 3. Git + Build Strategy

### Branch structure

```
main                  ← active development (all phases)
  └── release/preview ← cut today, Phase 1 scope only
```

Cut `release/preview` from `main` today. Feature flags disable all non-diary tabs. Run:

```bash
eas build --profile preview --platform all
```

This produces:
- APK for Android internal testing track (Play Console)
- IPA for iOS TestFlight

All OTAs from Phase 1.5 onwards are pushed to `release/preview` via `eas update --branch preview`.

### Version naming

```
preview-v1.0.0    Phase 1 build
preview-v1.1.0    Phase 1.5 OTA (RAG)
preview-v1.2.0    Phase 2 OTA (Web)
preview-v1.3.0    Phase 3 OTA (Creator Discovery)
preview-v1.4.0    Phase 4 OTA (Content Generation)
preview-v1.5.0    Phase 5 OTA (Rich Formats)
preview-v1.6.0    Phase 6 OTA (Notifications)
preview-v1.7.0    Phase 7 OTA (Scheduling)
v2.0.0            Phase 8 Store update (Monetization)
v2.1.0            Phase 9 Store update (Auto-posting)
```

### OTA delivery pipeline (GitHub Actions)

Every push to `release/preview` runs this pipeline in order:

```
1. Trigger backup edge function → pg_dump to Supabase Storage
2. Verify backup (row count comparison vs. previous backup)
3. If verification fails → STOP. OTA does not publish.
4. eas update --branch preview
5. Flip feature flag in Supabase for newly enabled phase
6. Send notification (Slack/email) with EAS update URL
```

Step 3 is a hard gate. No backup = no OTA, no exceptions.

---

## 4. Feature Gate System

### Schema

```sql
CREATE TABLE feature_flags (
  key                TEXT PRIMARY KEY,
  enabled            BOOLEAN NOT NULL DEFAULT false,
  enabled_for_user_ids UUID[] DEFAULT NULL, -- null = all users
  rollout_pct        INTEGER DEFAULT 100,   -- 0–100% of users
  description        TEXT
);
```

### Initial rows (Phase 1 build)

| key | enabled | description |
|-----|---------|-------------|
| diary_core | true | Auth + diary entry CRUD + offline sync |
| rag_pipeline | false | Background embeddings + writing profile |
| web_interface | false | Expo Web entry CRUD |
| creator_discovery | false | Creator matching + writing profiles |
| content_generation | false | AI post generation |
| rich_formats | false | Threads + carousels + AI images |
| notifications | false | Push notification flows |
| scheduling | false | Content calendar + scheduling |
| monetization | false | RevenueCat paywall |
| auto_posting | false | Direct social API publishing |

### App-side hook

```typescript
// src/hooks/useFeatureFlag.ts
// Fetches from feature_flags table via TanStack Query
// Cached with staleTime: 5 minutes
// Refetched on app foreground
// Returns false if query fails (fail closed, not open)
```

Rolling back any phase = set `enabled = false` in Supabase. Effective on next app foreground. No new build required.

---

## 5. Data Safety — No Data Loss

### Offline-first contract

```
User writes → SQLite immediately (zero network dependency)
            → added to sync queue
            → background sync to Supabase
            → conflict resolution: last-write-wins on updated_at
```

Device SQLite is a complete copy of that user's data. Supabase going down cannot cause data loss.

### Soft deletes everywhere

No hard deletes until a user explicitly requests account deletion (GDPR). All records use `deleted_at TIMESTAMPTZ`. Sync replays are always safe.

### Schema migration rules (enforced for all phases)

Every migration until Phase 9 must be additive only:

| Allowed | Blocked |
|---------|---------|
| Add nullable columns | Drop columns |
| Add columns with defaults | Rename columns |
| Add new tables | Change column types destructively |
| Add indexes | Remove NOT NULL constraints from existing data |

Deprecated columns are prefixed `_deprecated_` and removed only in the Phase 9 store update after a full backfill audit.

This guarantees an app running Phase 1 code can safely read/write the Phase 7 schema.

### Pre-OTA backup spec

Edge function: `supabase/functions/backup-trigger/index.ts`

```
Input:  { triggered_by: "ci", phase: "1.5" }
Output: { 
  backup_path: "backups/YYYY-MM-DD-HH-MM-SS.dump",
  row_counts: { diary_entries: N, profiles: N, ... },
  status: "success" | "failed"
}
```

- Backup stored in private `backups` Supabase Storage bucket
- Retention: 30 days rolling
- CI compares `row_counts` to previous backup manifest; alerts on unexpected decrease in any table

---

## 6. Supabase Portability

### Service abstraction

All database access routes through `src/services/supabaseService.ts`. Switching to self-hosted requires only:
1. Update `SUPABASE_URL` env var
2. Update `SUPABASE_ANON_KEY` env var

Zero app code changes.

### Schema constraints

- PostgreSQL-only features in core schema
- `pgvector` for RAG embeddings (available in self-hosted Supabase)
- No Supabase-specific stored procedures in app logic
- Storage uses S3-compatible API (self-hosted uses MinIO — same interface)

### Migration path to self-hosted

```bash
# 1. Export from Supabase Cloud
supabase db dump --linked > full_backup.sql
supabase storage download --bucket diary-images ./storage-export/

# 2. Spin up self-hosted
docker compose up  # standard Supabase self-hosting

# 3. Import
psql $SELF_HOSTED_DB_URL < full_backup.sql

# 4. Update two CI/CD env vars
SUPABASE_URL=https://your-instance.example.com
SUPABASE_ANON_KEY=<new-key>
```

No app store resubmission needed — URL change ships as an OTA update.

---

## 7. AI Data Confidentiality

### The rule

**AI providers never receive raw user data from the client.** The app sends only resource IDs. Edge functions fetch content server-side and call AI APIs. No API keys exist in the app bundle.

### Controls by provider

| Provider | Data path | Retention | Control |
|----------|-----------|-----------|---------|
| Anthropic (Claude) | Edge function → Anthropic API | Zero training retention on paid tier | Confirm opt-out in Anthropic dashboard |
| Groq (Whisper) | Edge function → Groq API (audio bytes) | Not retained after processing | Audio sent server-side only |
| OpenRouter | Edge function → OpenRouter → provider | Set `X-Data-Privacy: true` header | Routes to zero-retention providers |
| Future self-hosted (Ollama) | Edge function → local Llama/Qwen | Never leaves your infrastructure | Drop-in swap at edge function level only |

### PII logging rule

Edge function logs must never contain entry content. Allowed log fields:

```typescript
logger.info({ entry_id, user_id, phase, status, duration_ms })
// NEVER: { entry_id, user_id, content: entry.text }
```

### Storage encryption

All Supabase Storage buckets (`diary-audio`, `diary-images`, `generated-images`) are:
- Private (RLS-gated, no public URLs)
- Encrypted at rest (Supabase default, AES-256)
- Accessed via signed URLs with 1-hour expiry

---

## 8. Phase 1 Build Checklist (Today)

Before running `eas build`:

- [ ] Cut `release/preview` branch from `main`
- [ ] Create `feature_flags` table in Supabase with initial rows
- [ ] Add `useFeatureFlag` hook and gate non-diary tabs
- [ ] Verify Supabase project is connected (`.env` has `SUPABASE_URL` + `SUPABASE_ANON_KEY`)
- [ ] Verify auth flow works (email sign-up → session → diary screen)
- [ ] Verify diary entry CRUD works (create, list, edit, delete)
- [ ] Verify audio recording + transcription works (or gate behind flag if broken)
- [ ] Verify SQLite sync queue processes correctly
- [ ] Set up `backup-trigger` edge function skeleton (can be stubbed for Phase 1)
- [ ] Configure EAS `preview` build profile (already in `eas.json`)
- [ ] Set `APP_ENV=preview` env var in EAS dashboard
- [ ] Run `eas build --profile preview --platform all`
- [ ] Submit IPA to TestFlight, APK to Play Console internal track

---

## 9. Open Questions (Resolve Before Phase 2)

1. **RevenueCat vs. custom subscription**: RevenueCat is the fastest path for Phase 8. Confirm if there's a reason to build custom.
2. **Auto-posting API access**: X API (Paid tier required), LinkedIn API (partner approval needed), Instagram Graph API (business account required). Start applications now — these take weeks.
3. **Ollama self-hosting timeline**: If AI confidentiality becomes a hard requirement before Phase 4, Ollama on a VPS is 1-day work. Confirm priority.
4. **Analytics provider**: Basic instrumentation in Phase 1 — Posthog (self-hostable) or Mixpanel? Posthog recommended for portability parity with Supabase.
