# Module card: decouple "Practice" (card) from "Quiz" (button) entry points

> Branch: `feat/home-consolidation` (continues on top of the module-naming cosmetic pass).
> Status: **IMPLEMENTED.**
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

## Decisions (locked)

| # | Question | Locked answer |
|---|----------|---------|
| D1 | New screen or a mode on the existing one? | **(a)** Reused `TopicLessonsScreen` with a `mode?: 'practice' \| 'quiz'` route param (default `'practice'`). No new screen. |
| D2 | Do topic rows keep both Practice + Quiz buttons? | **No — one action per mode.** Practice and quiz now each live on their own screen instance: `mode: 'practice'` rows are a single tap → straight into Practice; `mode: 'quiz'` rows are a single tap → straight into that topic's quiz (`startQuiz`). The old dual Practice/Quiz button pair per lesson is gone — it was redundant once Home offered a dedicated quiz entry point. |
| D3 | Home card layout | Split `DashboardScreen`'s single `moduleRow` `TouchableOpacity` into a card (`moduleCard`) containing: an inner `moduleInfo` touchable (ring + title + meta) → `TopicLessons` practice mode, and a bordered `quizButton` below → `TopicLessons` quiz mode, labelled via `dashboard.quizOnModule`. |
| D4 | Guest/paid gating on the new button | Reused `isGuestLocked('TopicLessons', isGuest)` for both tap targets via a shared `openModule(sectionId, mode?)` helper. |
| D5 | Copy | Added `dashboard.quizOnModule`: EN `"Quiz on Module {{n}}"`, FI `"Tentti: Moduuli {{n}}"` to `en/dashboard.json` + `fi/dashboard.json`. Parity verified. |
| D6 | `TopicLessonsScreen` header text | Prefix with the module number, matching the Home quiz button's numbering: `topic.moduleHeader` — EN `"Module {{n}} | {{name}}"`, FI `"Moduuli {{n}} | {{name}}"` — using `section.order`. Replaces the bare module name in both practice and quiz mode. |

## Implementation (done)

- `src/navigation/types.ts:48` — `TopicLessons: { sectionId: string }` → `{ sectionId: string; mode?: 'practice' | 'quiz' }`.
- `src/screens/DashboardScreen.tsx` — `openModule` now takes an optional `mode`; module rows split into `moduleCard` (info touchable + `quizButton`), styles renamed `moduleRow` → `moduleCard`/`moduleInfo` + new `quizButton`/`quizButtonText`.
- `src/screens/TopicLessonsScreen.tsx` — reads `route.params.mode` (default `'practice'`); in quiz mode the header title becomes `"{section} · {quiz.title}"`. Every lesson row is now a single `Pressable` card (chevron affordance) whose tap goes to Practice or straight into that topic's quiz depending on `mode` — the old two-button-per-row layout (and its now-unused `actions`/`btn*` styles, `BookOpen`/`ClipboardCheck` icons) was removed.
- `src/i18n/locales/{en,fi}/dashboard.json` — added `quizOnModule` key.
- `src/i18n/locales/{en,fi}/topic.json` — added `moduleHeader` key (`"Module {{n}} | {{name}}"` / `"Moduuli {{n}} | {{name}}"`); removed the now-unused `practice` key (was only used by the removed per-lesson Practice button).
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
