# FE ↔ BE Data Sanity Check (final pre-handoff audit)

> **Goal:** Confirm exactly which data the UI renders that has **no backing endpoint / field**, validated against the live contract *and* the actual Convex data model. This is the definitive "data vs UI" gap list to hand to the backend dev.
>
> _Created 2026-06-29. Audit only — no FE/BE code changes proposed here beyond the handoff specs._

## Method (how this was validated)

1. **Typegen check.** Re-fetched the live OpenAPI spec (`https://api.taxipilot.fi/api/v1/openapi.yaml`) and diffed against the checked-in `src/lib/api-types.ts`.
   - **Result: in sync.** Identical 28 paths. The REST contract has **no drift** — every gap below is a *missing* endpoint/field, never a stale type.
2. **Backend data model** read directly from `backend/convex/convex/schema.ts` (8 tables) + NestJS controllers (the REST surface) + `progress.ts` / `migrations.ts`.
3. **FE consumption** inventoried across `src/lib/*Api.ts`, `src/hooks/*`, and all 31 screens — every backend call mapped, every hardcoded/placeholder value flagged.

## Contract surfaces (the source of truth)

- **Live REST API** (`api.taxipilot.fi`) — the real contract the app runs against. 28 endpoints: `auth/*`, `problems*`, `problem-sets*`, `solution-sessions*`, `categories*`, `progress`, `payments/*`.
- **Convex schema** — 8 tables: `users`, `passwordResetTokens`, `emailVerificationTokens`, `problems`, `categories`, `problemSets`, `solutionSessions`, `answers`, `problemTranslations`.
- ⚠️ **`BACKEND.md` is STALE / aspirational.** It describes a `/me/progress`, `/me/quiz-scores`, `/me/test-scores` sync model and a `referrals` table that the deployed backend **never implemented**. The backend instead evolved into the `problem-sets` / `solution-sessions` model. **Do not build against `BACKEND.md`'s API section.** The verified contract is this doc + `next-changes-plan.md` (§"API/data audit findings"). Referral *intent* in `BACKEND.md` is still valid; its endpoints are not.

## Data model ↔ relationships (validated)

```
users ──1:N─→ problems (ownerId)         users ──1:N─→ problemSets (ownerId)
users ──1:N─→ solutionSessions (userId)  users ──1:N─→ answers (userId)
categories ──self─→ categories (parentCategoryId; type main|sub)
problemSets ──N:1─→ categories (categoryId)
problemSets ──N:M─→ problems (problems: Id[])
solutionSessions ──N:1─→ problemSets (problemSetId)
answers ──N:1─→ solutionSessions (solutionSessionId) ──N:1─→ problems (problemId)
problemTranslations ──N:1─→ problems (problemId, locale)
```
All FK relationships the FE relies on are present and indexed (`by_user`, `by_category`, `by_problemSet_user`, `by_session_problem`, `by_user_problem`, …). **Progress is derived** from `answers` at query time (`progress.ts`), not stored — confirmed correct per BACKEND.md Part 3.

**Tables/fields the UI references that DO NOT EXIST in the schema:** no `referrals` table; `users` has **no** `referral_code`, `referred_by`, `streak`, `last_active_date`, or `language_pref`; `answers`/progress expose no `lastPracticedAt` or wrong-answer rollups. These are the gaps below.

---

## GAP LIST — UI data with no backend (the deliverable)

### 🔴 BE-1 — `lastPracticedAt` (additive field)
- **UI:** "Last practiced …" subtitle on category/section rings (Dashboard, Progress).
- **Now:** `progress.getUserProgress` returns only `{ total, completed, percentage }`. FE field optional → renders "Not started yet" / hidden (`src/lib/time.ts:3`, `progressApi.ts:25`).
- **Build:** add `lastPracticedAt: number | null` (epoch ms = `max(answers.updatedAt)` for that category's problems) to each `progress` object and each `subcategories[]` entry on `GET /progress`.
- **Breaking?** No — additive. FE degrades gracefully.

### 🔴 BE-2 — `wrongCount` + `wrongQuestionIds` (additive fields)
- **UI:** "Weak areas" + "Practice these" on `ProgressScreen` (`:48-63`) — currently always "all good" because data never arrives.
- **Now:** not computed.
- **Build:** on each `subcategories[]` entry of `GET /progress`: `wrongCount: number` (problems attempted but never answered correctly = inverse of `completed`) and `wrongQuestionIds: string[]`. Reuses existing `completed` logic in `progress.ts`.
- **Breaking?** No — additive, FE optional.

### 🔴 BE-3 — `GET /progress/problem-sets` (NEW endpoint)
- **UI:** per-lesson rings on `TopicLessonsScreen` (29) + per-set rings on `VocabSetsScreen` (11). FE **already calls this** via `useProblemSetProgress` / `problemSetProgressApi.ts`.
- **Now:** endpoint **does not exist** → 404 → hook swallows it → neutral rings (no fake %). No error, no logout (only 401 logs out).
- **Build:** return a map keyed by `problemSetId`: `{ total, completed, percentage, lastPracticedAt?, wrongCount?, wrongQuestionIds? }`. Same per-category computation `progress.ts` already does, grouped by **problem set** instead. `total/completed/percentage` are the must-haves. All 50 problem-set IDs already exist FE-side in `src/data/backendProblemSetIds.ts`.
- **Breaking?** No — purely new; FE is already wired and degrading.

### 🔴 REF — Referrals (WHOLE FEATURE MISSING)
- **UI:** `ReferralScreen` shows `friendsJoined = 0`, `daysEarned = 0` — hardcoded zeros (`:38`), comment defers to backend. Share-a-code flow has nothing behind it.
- **Now:** no `referrals` table; `users` lacks `referral_code` / `referred_by`; no referral endpoints anywhere in the 28-path surface.
- **Build (v1, minimal — record links only, rewards later):**
  - `users`: add `referralCode` (unique, generated at register, e.g. `TAXI`+4) and `referredBy?`.
  - `referrals` table: `{ referrerUserId, referredUserId, createdAt }`.
  - `POST /auth/register`: generate `referralCode`, accept optional `referredBy` → write a `referrals` row.
  - `GET /auth/me` (or a small `/me/referrals`): return `referralCode` + `friendsJoined` count so the screen shows real numbers.
- **Breaking?** Additive; FE swaps hardcoded zeros for the response once live.

---

## Intentionally local — NOT backend gaps (documented so they're not "found" again)

| Item | Where | Decision |
|---|---|---|
| Saved / bookmarked questions | `savedQuestionsStore`, `SavedQuestionsScreen` | Local-only by design (no bookmarks endpoint; audit D-confirmed). |
| UI language (FI/EN) | i18n | UI-chrome only, not persisted server-side (per AGENTS i18n rules). |
| Day-streak / accuracy / tests-done chips | Dashboard | Deferred; fake chips **removed** (R4.a), not wired. Needs streak/aggregation logic if ever wanted. |
| User **name** update | Profile | No `PATCH` for name; set at register only. Only `expected-exam-date` is mutable today. Flag if name-edit is desired → needs `PATCH /auth/me`. |
| Model-test pass/category-minimum grading | `examStructure.gradeExam()` | FE-computed from answers; attempts persist via `solution-sessions`. Correct per BACKEND.md Part 3. |

## Hygiene note (low priority)
- `npm run typegen` double-nests Convex types: `src/convex/_generated/_generated/…` exists from a repeated `cp -r`. Harmless but worth cleaning in `scripts/typegen-convex.sh` (copy contents, not the dir).

---

## Backend handoff checklist
- [ ] **BE-1** `lastPracticedAt` on `/progress` (category + subcategory).
- [ ] **BE-2** `wrongCount` + `wrongQuestionIds` on `/progress` subcategories.
- [ ] **BE-3** new `GET /progress/problem-sets` keyed map.
- [ ] **REF** `referralCode`/`referredBy` on `users` + `referrals` table + register wiring + count on `/auth/me`.
- [ ] (Optional) `PATCH /auth/me` for name, if name-editing is wanted.

## FE-side follow-ups (after BE lands — no change needed before)
- BE-1/BE-2: remove the "Not started" / "all good" fallback copy if desired (already functional).
- BE-3: nothing — rings light up automatically once the endpoint returns 200.
- REF: replace hardcoded zeros in `ReferralScreen.tsx:38` with the `/auth/me` referral fields.

## Validation before calling this done
- `npx tsc --noEmit` clean (no contract type changed, so should already pass).
- After BE ships each item: run Expo web, log in as a non-guest, walk Dashboard → Progress → Topic lessons → Vocab sets → Referral, confirm rings/last-practiced/weak-areas/referral counts populate. Check both EN and Suomi.
