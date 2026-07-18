# Vocabulary & Clue Words: match the Module practice/quiz structure, rename "set" → "group"

> Branch: `feat/home-consolidation` (follows `module-quiz-entrypoint-plan.md`, same branch).
> Status: **IMPLEMENTED.**
> Created: 2026-07-17

## Problem

`module-quiz-entrypoint-plan.md` gave Topic Practice modules a consistent structure: a Home card split into a practice tap-target + a "Quiz on Module N" button, landing on a topic list where every row is one tap into the mode the screen was opened for.

Vocabulary and Clue Words still use the older pattern: a single Home row (no split), landing on a set/group list where every row has **two** buttons ("Lesson" outlined + "Quiz" filled). This is inconsistent with Modules and, per the hand-drawn spec, should be unified.

Separately, Vocabulary's copy calls its groupings "sets" ("SET 1", "11 practice sets") while Clue Words already calls its groupings "groups" — and the Home card meta for *both* already reads "N groups" (`dashboard.vocabulary.sub`/`dashboard.clueWords.sub`). "Set" should be retired from user-facing copy in favor of "group" everywhere.

## Decisions (locked)

| # | Question | Locked answer |
|---|----------|---------|
| D-A | Rename scope | **Copy-only.** Only i18n strings and on-screen labels change from "Set" to "Group". `VocabSet.set_no`, `set-N` ids, and backend progress keys (`vocab/sets/set-N`) are untouched — no `content/build_vocab.py` or Convex changes. |
| D-B | Screen mode param | Both `VocabSets` and `ClueWords` gain `mode?: 'practice' \| 'quiz'` (default `'practice'`), mirroring `TopicLessons`. No new screens. |
| D-C | Per-row buttons | **Removed.** Each set/group row becomes a single `Pressable` card — `mode: 'practice'` taps go straight into the lesson (`VocabLesson`/`ClueLesson`, same as today's "Lesson" button); `mode: 'quiz'` taps go straight into that set/group's quiz via `useStartQuiz` (same call the old "Quiz" button made). |
| D-D | Home card layout | `WORDS` cards in `DashboardScreen.tsx` split into `moduleCard`-style: inner `moduleInfo` touchable (icon + title + meta) → practice mode, plus a bordered `quizButton` below, copy **"Take Quiz"** (`dashboard.takeQuiz`, not module-numbered — vocab/clue have no "Module N" framing) → quiz mode. Styling reuses the existing `moduleCard`/`moduleInfo`/`quizButton` styles (renamed generically, see Implementation). No progress ring added (D-E, home-card-ring decision: recommended no). |
| D-E | Home card ring | **No ring.** Card visual stays icon-chip + title + meta; only the split + button changes. Clue Words has no live per-group progress today (`seen` hardcoded `0`), so a ring would be fake — out of scope to wire that up here. |
| D-F | Per-row kicker | Each set/group row gets a small kicker above its title, matching `TopicLessonsScreen`'s `topic.lessonHeader` pattern: `vocab.groupHeader` → `"Group {{n}} | {{count}} words"`, `clue.groupHeader` → `"Group {{n}} | {{count}} words"`. Replaces the old `vocab.setLabel` pill (`"SET {{n}}"`) which sat above the title with no count; Clue Words gets numbering for the first time (it had none). |
| D-G | i18n key names | Existing key **names** are kept (`setsCaption`, `setLabel`, `setNotFound`, `backToSet`, `paywallPerkSets`, etc.) — only their string **values** change "set"→"group". `setLabel` becomes dead (superseded by `groupHeader`) and is removed. Avoids a large, low-value rename diff across call sites. |

## Implementation (done)

- `src/navigation/types.ts` — `VocabSets: undefined` → `{ mode?: 'practice' | 'quiz' }`; `ClueWords: undefined` → `{ mode?: 'practice' | 'quiz' }`.
- `src/screens/VocabSetsScreen.tsx` — reads `route.params?.mode` (default `'practice'`); each set row is now one `Pressable` (kicker + title + word count + chevron, no dual buttons); tap routes to `VocabLesson` (practice) or `startQuiz` (quiz, same mapping key `vocab/sets/set-${set.set_no}`) depending on mode.
- `src/screens/ClueWordsScreen.tsx` — same shape: `route.params?.mode`, single `Pressable` per group, tap routes to `ClueLesson` (practice) or `startQuiz('clue/{groupId}', 'ClueQuiz', {groupId})` (quiz).
- `src/screens/DashboardScreen.tsx` — `WORDS` row rendering replaced with the same split-card structure as `SECTIONS` (Modules): `moduleInfo` touchable → `openScreen(screen, 'practice')`, `quizButton` → `openScreen(screen, 'quiz')`, where `openScreen` now forwards an optional `mode` param to `VocabSets`/`ClueWords`.
- `src/i18n/locales/{en,fi}/vocab.json` — "set"→"group" in all string values (`setsCaption`, `lessonHeader`, `lessonEmpty`, `quizNavTitle`, `resultHeader`, `quizEmpty`, `backToSet`, `setNotFound`, `paywallPerkSets`); `setLabel` removed, `groupHeader` added.
- `src/i18n/locales/{en,fi}/clue.json` — `groupHeader` added (new numbering, didn't exist before).
- `src/i18n/locales/{en,fi}/dashboard.json` — `takeQuiz` key added (generic "Take Quiz" / "Tee tentti", reused by both Vocabulary and Clue Words cards).

## Out of scope

- Wiring live per-group progress for Clue Words (currently hardcoded `seen: 0`, no `ProgressRing`) — pre-existing gap, unrelated to this restructuring.
- Any data/backend rename (`set_no`, `set-N` ids, `vocab/sets/set-N` backend keys) — D-A.
- A combined "quiz across all sets/groups" session — same out-of-scope rationale as `module-quiz-entrypoint-plan.md`'s whole-module quiz.

## Verify

- `npx tsc --noEmit` clean.
- EN/FI i18n key parity holds for `vocab.json`, `clue.json`, `dashboard.json`.
- Walk Home in both languages: Vocabulary/Clue Words card tap → group list (practice, single tap per row into lesson); "Take Quiz" button → group list (quiz, single tap per row straight into that group's quiz).
- Confirm paywall/guest gating unchanged (still screen-level `isUnlocked('vocabulary')`/`isUnlocked('clue_words')`).

_Last updated: 2026-07-17._
