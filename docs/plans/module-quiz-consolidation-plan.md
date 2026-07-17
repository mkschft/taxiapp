# Module Quiz consolidation: one quiz per module, mock-exam layout

> Branch: TBD (new branch off `master`).
> Status: **DRAFT — pending 2 locked decisions below.**
> Created: 2026-07-17
> Supersedes the "out of scope" line in [`module-quiz-entrypoint-plan.md`](./module-quiz-entrypoint-plan.md#out-of-scope): "Any whole-module (multi-topic combined) quiz session — still a separate, unscoped feature if ever wanted." This is that feature.

## Problem

Today, "Take Quiz" on a Home module card → `TopicLessons` (mode `quiz`) → a list of that module's **lessons** (sub-categories) → tapping one starts `TopicQuiz` for just that lesson. Lesson sizes are wildly uneven (3–44 questions) and users have to pick a sub-category before they can quiz at all. User feedback: this doesn't read as "take the Module 1 quiz," it reads as a confusing extra menu. They want "Take Quiz" to drop straight into one quiz covering the whole module — same shape as Mock Exams (`TestHomeScreen` → `ModelTestScreen`), which users already found clear.

Practice mode (tap the card itself → `TopicLessons` mode `practice` → per-lesson `PracticeScreen`) is explicitly **unaffected** — this only changes the quiz entry point.

## Feasibility: confirmed — no schema or contract changes

- Session/scoring API is already problem-set-agnostic: `POST /solution-sessions`, `GET /problem-sets/:id`, `POST /solution-sessions/:id/answers`, `PATCH /solution-sessions/:id` (`src/lib/quizApi.ts`). A "module quiz" is just one more `problemSetId` — the exact same primitive already powering the 5 Model Tests and the 44 per-lesson quizzes.
- Admin `POST /problem-sets` (`taxiapp-server/src/quiz/problem-sets.controller.ts`) already accepts `{ label, problems: Id[], categoryId }` — creating one new problem set per module needs zero backend code changes, only data.
- Home's module-level progress ring is driven by `/progress` category rollups (`src/lib/progressLookup.ts` → `getSectionProgress`), **not** by any specific problem set. Introducing a new module-level problem set has no effect on it.
- `src/data/loaders.ts` already exports `getTopicSectionQuestionIds(sectionId)` — the whole module's question IDs flattened across lessons, in order. This already gives us a local/offline fallback for free (same pattern `PracticeScreen`/`TopicQuizScreen` use when there's no `problemSetId`).
- `topic_practice.json`'s 4 sections already carry **authoritative real-exam pass criteria**, not invented ones:

  | Module | Lessons | Local question pool | Real pass gate |
  |---|---|---|---|
  | 1 Passenger Safety | 6 | 91 | **12/15** |
  | 2 Special Needs | 8 | 57 | **12/15** |
  | 3 Customer Service | 9 | 87 | **7/10** |
  | 4 Traffic Safety | 6 | 88 | **7/10** |

  i.e. the real Traficom module exam is 15 or 10 questions, not an arbitrary round number. This is more accurate than the "25 questions" example in the request, and it's already in the content data at zero cost — see D1 below.

## Locked decisions — 2 to confirm, rest are defaults I'll proceed with

| # | Question | Recommendation |
|---|----------|---------|
| **D1** | Quiz length per module | **Use `pass_total` (10 or 15) instead of a flat 25** — matches the real exam format exactly, already in the data. Flagging because the request floated "25" as an example; want to confirm before building around the wrong number. |
| **D2** | Timer, like Mock Exams? | **No timer for module quizzes** (Mock Exams are explicitly "timed, exam-realistic" full-length; module quizzes are a shorter checkpoint). Everything else about the layout — nav bar, progress bar, question card, deferred-until-finish grading, footer with bookmark + Next/Finish, `ResultScreen` — matches Mock Exams 1:1. Open to flipping this if you want full parity including the clock. |
| D3 | Question composition per module quiz | Fixed/static set (curated or seeded-random-once), same as the 5 existing Model Tests — **not** re-randomized per attempt. Keeps it simple, reuses the exact pattern already proven in production. |
| D4 | Old per-lesson `TopicQuiz` route/screen | **Leave in place, unlinked** (no more "Take Quiz" path reaches it once D-below ships). Deleting it is a separate follow-up cleanup — avoids unnecessary file churn/conflict risk before the demo, per your instruction. |
| D5 | `TopicLessonsScreen`'s `mode === 'quiz'` branch | Removed — its only caller (`DashboardScreen`'s quiz pill) is being repointed straight to the new module quiz. `mode` param collapses back to practice-only. |

## Implementation

### Backend (content/ops — needs Convex admin access, which I don't have)

1. New one-time script, `taxiapp-server/scripts/seed-module-quiz-problem-sets.ts` (mirrors the existing `scripts/seed-vocab.ts` pattern):
   - For each of the 4 categories, resolve its lessons' existing problem sets (already listed in `BACKEND_PROBLEM_SET_IDS['topic/{category}/lessons/{lessonId}']` on the frontend) via `GET /problem-sets/:id`, union their `problems: Id[]` to get that module's full backend problem pool (should land at ~91/57/87/88, matching the local counts above).
   - Pick `pass_total` (10 or 15) of them — spread across lessons for topic coverage rather than clustering.
   - `POST /problem-sets` with `{ label: "Module N Quiz", problems, categoryId }`.
   - Print the 4 resulting `problemSetId`s.
2. Paste those 4 IDs into `src/data/backendProblemSetIds.ts` under a new key per module: `topic/{category_id}/module-quiz`.

I can write step 1's script now, but actually running it needs whoever holds the admin-authenticated API credentials against the live Convex deployment — that's not something I should do unattended. Frontend work below does **not** block on this: it ships fully functional today against the local fallback (`getTopicSectionQuestionIds`), and picks up backend-tracked sessions/progress automatically the moment the IDs land in `backendProblemSetIds.ts` — zero frontend code changes needed at that point.

### Frontend

3. New screen `src/screens/ModuleQuizScreen.tsx` — copy `ModelTestScreen`'s layout (nav bar with quit-confirm, progress bar, question card w/ `QuestionImage`/`QuestionTariff`, options, footer with bookmark + answered-count + Next/Finish) minus the timer (D2), sourced from `getTopicSection(sectionId)` / `getTopicSectionQuestionIds(sectionId)` instead of `getModelTestById`. Finishes into the existing `ResultScreen` exactly like Model Tests do (`mode: 'quiz'`, `label`, `score`, `total`, `wrongIds`, `answers`) — no `ResultScreen` changes needed, it's already generic.
4. Route: add `ModuleQuiz: { sectionId: string; sessionId?: string; problemSetId?: string }` to `DashboardStackParamList` (`src/navigation/types.ts`), register `<Stack.Screen name="ModuleQuiz" component={RequireAuth(ModuleQuizScreen, 'Dashboard')} />` in `DashboardStack.tsx`.
5. `DashboardScreen.tsx`: the module card's quiz pill (`onPress={() => openModule(section.id, 'quiz')}`) changes to call `startQuiz('topic/{category}/module-quiz', 'ModuleQuiz', { sectionId: section.id })` directly (same `useStartQuiz` hook already used by `TestHomeScreen`/`TopicLessonsScreen` — handles the "no backend ID yet → fall through to local params" case automatically per its existing implementation).
6. `TopicLessonsScreen.tsx`: drop the `mode === 'quiz'` branch and `goToQuiz` (D5) — screen becomes practice-only, `mode` param removed from its route type.
7. i18n: new minimal namespace or reuse — propose reusing `modelTest.json`'s keys directly (mark/marked/next/finish/answered/question/quit*/submit* all apply unchanged) plus 2–3 module-quiz-specific strings (title fallback, empty state) added to a small `moduleQuiz.json` in en/fi. No renames of existing keys.

### Out of scope (per your ask)

- `PracticeScreen`, `VocabQuizScreen`, `ClueQuizScreen` — untouched.
- Any backend schema/Convex migration — none required.
- Deleting the now-orphaned `TopicQuiz` screen/route — deferred (D4).

## Effort / risk

- Frontend: medium — mostly adapting `ModelTestScreen`'s proven, already-demo-tested layout; one new screen, one route, one dashboard onPress change, one screen simplification. `tsc --noEmit` + i18n parity are the existing CI gates, both cheap to keep green.
- Backend: small script, but needs someone with Convex admin credentials to actually run it — flagging as a blocking dependency for the *backend-tracked* version. The local-fallback version works today with zero backend involvement, which is enough to demo the new flow; backend session/progress tracking can land right after without touching frontend code again.
- No risk to Practice, Vocabulary, Clue Words, or Mock Exams — all separate code paths, none modified.

## Verify (once implemented)

- `npx tsc --noEmit` clean, EN/FI key parity holds.
- Walk Home → "Take Quiz" for all 4 modules (guest/free/paid states respect the existing `topic_practice` paywall gate, inherited via `RequireAuth`/`isUnlocked` same as today) → straight into a `pass_total`-question quiz, no lesson-picker step.
- Confirm Practice (tap-the-card path) is untouched — still goes to `TopicLessons` mode practice → per-lesson `PracticeScreen`.
- Once backend IDs land: confirm a completed module quiz submits answers/completes the session and doesn't regress the Home progress ring (should be automatic — ring reads `/progress`, not this problem set).

_Last updated: 2026-07-17._
