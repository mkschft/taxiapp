# Module card: decouple "Practice" (card) from "Quiz" (button) entry points

> Branch: `feat/home-consolidation` (continues on top of the module-naming cosmetic pass).
> Status: **DRAFT — feasibility checked, awaiting decisions before implementing.**
> Created: 2026-07-17

## Problem

Today, tapping anywhere on a Home module card (`DashboardScreen.tsx:167-203`, the whole row is one `TouchableOpacity`) does one thing: `openModule(section.id)` → navigates to `TopicLessons` (the per-topic lesson list, practice-oriented).

The hand-drawn spec wants two separate entry points on the same card:
- **Tapping the card** (ring/title/meta) → still goes to the topic/lesson list, for practice.
- **A "Quiz on Module X" button underneath** → goes to a *quiz-oriented* view of the same topic list, where the user picks a topic and lands straight in that topic's quiz — skipping the practice step.

Neither destination is a single combined "quiz the whole module" session (that would be a real new feature — no such session exists today, see the prior plan/PR discussion). Both destinations are per-topic, just reached via a different framing.

## Feasibility: confirmed, no backend change needed

- `TopicQuiz` route already exists and is already scoped per-lesson: `{ lessonId, sectionId, sessionId?, problemSetId? }` (`src/navigation/types.ts:49`), registered in `src/navigation/DashboardStack.tsx:32`.
- `getTopicLessons(sectionId)` (`src/data/loaders.ts`) already returns the per-module topic list with `question_count`/`question_ids` — the same data `TopicLessonsScreen` renders today.
- Per-topic progress already flows through `BACKEND_PROBLEM_SET_IDS['topic/{category_id}/lessons/{lesson_id}']` + `useProblemSetProgress` (`TopicLessonsScreen.tsx:100-110`) — reused as-is.
- `section.order` (1–4) already exists in `topic_practice.json` — covers "Module 1/2/3/4" numbering with no new field.
- Paywall/auth gating is already screen-level (`TopicLessonsScreen.tsx:45`, `isAuthenticated && !isUnlocked('topic_practice')`) — a second entry point into a variant of this screen inherits the same gate automatically.

## Decisions needed (not locked yet — for the next thread)

| # | Question | Options |
|---|----------|---------|
| D1 | How to build the quiz-oriented topic list — new screen or a mode on the existing one? | **(a) Recommended:** reuse `TopicLessonsScreen` with a `mode?: 'practice' \| 'quiz'` route param (default `'practice'`). Same data, same paywall gate, same styling — just changes which action each topic row's CTA leads to. Low duplication. **(b)** Build a separate `TopicQuizListScreen`. More visual freedom, more duplicated list/gating code. |
| D2 | In quiz mode, do topic rows keep both Practice + Quiz buttons, or only "Take Quiz"? | Keeping both is safer (no functionality removed, just a different framing/default). Quiz-only is a cleaner "decouple" but removes a currently-available action from that path. |
| D3 | Home card layout — how does the button attach to the card? | Split the current single `TouchableOpacity` (`moduleRow`) into: (a) an inner touchable info area (ring + title + meta) → `TopicLessons` (practice), and (b) a bordered/outline button below, inside the same card container → `TopicLessons` with `mode: 'quiz'` (or the new screen per D1). Matches the sketch's bordered card + separate pill button underneath. |
| D4 | Guest/paid gating on the new button | Reuse the existing `isGuestLocked('TopicLessons', isGuest)` check for both tap targets (destination screen enforces the real gate either way) — no new gating logic needed. |
| D5 | Copy | New i18n key, e.g. `dashboard.quizOnModule`: `"Quiz on Module {{n}}"` (EN) / Finnish equivalent — add to `en/dashboard.json` + `fi/dashboard.json`, must keep EN/FI parity. |

## Implementation sketch (once D1–D5 are locked)

- `src/screens/DashboardScreen.tsx:167-203` — split the card into two tap targets as in D3; wire the new button to `navigation.navigate('TopicLessons', { sectionId, mode: 'quiz' })` (if D1a).
- `src/navigation/types.ts:48` — extend `TopicLessons: { sectionId: string }` → `{ sectionId: string; mode?: 'practice' | 'quiz' }`.
- `src/screens/TopicLessonsScreen.tsx` — read `route.params.mode`, branch each topic row's primary action per D2; adjust header copy if quiz mode should read differently (e.g. "Quiz: Passenger Assistance and Safety").
- `src/i18n/locales/{en,fi}/dashboard.json` — add the new button copy key.
- No changes to `types.ts` data shapes, `loaders.ts`, Convex schema, or `progressLookup.ts`.

## Out of scope

- Any whole-module (multi-topic combined) quiz session — still a separate, unscoped feature if ever wanted.
- Backend schema/migration changes — none required for this.
- `categories.json` / Convex category-name matching — untouched.

## Verify (once implemented)

- `npx tsc --noEmit` clean.
- EN/FI i18n key parity holds.
- Walk Home in both languages, guest/free/paid states: card tap → lesson list (practice), new button → quiz-oriented list (or straight per-topic quiz, per D1), both respect paywall gating identically to today.
- Confirm a completed topic quiz via either entry point still updates progress correctly (via `BACKEND_PROBLEM_SET_IDS` — same code path both ways, so this should be automatic, just worth a smoke check).

_Last updated: 2026-07-17._
