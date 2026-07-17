# Phase 3 — Home consolidation (merge Dashboard + Study, inline modules)

> Branch: `feat/home-consolidation` (off `master`).
> Status: **DRAFT — awaiting approval to implement.**
> Created: 2026-07-17
> Supersedes: `phase2b-dashboard-simplification-plan.md`'s "Out of scope" note ("Reworking the Study/Tests tabs (the dashboard intentionally overlaps as the home hub...)") — that decision is reversed here.

## Problem

Phase 2b deliberately kept `DashboardScreen` and `StudyHomeScreen` as two hubs pointing at the same destinations (Topic Practice, Vocabulary, Clue Words, Model Tests / How To, Exam Guide). In practice this reads as duplication: a user lands on Dashboard, sees a learning-modes list, taps "Study" in the tab bar, and sees a near-identical list again. Getting to the most exam-relevant unit — the 4 official exam modules — costs two hops (Dashboard/Study → `TopicSections` → category).

## Decision (locked)

| # | Topic | Decision |
|---|-------|----------|
| D1 | Tab structure | Drop the **Study** tab. Bottom tabs become **Home · Test · Progress · Profile** (4, down from 5). `DashboardScreen` becomes the single home hub and absorbs all of `StudyHomeScreen`'s destinations. |
| D2 | Module surfacing | The 4 exam categories (`categories.json` — Passenger Help & Safety, Special Needs, Customer Service, Transport & Traffic Safety) render **inline on Home** as their own section ("Practise by Module"), not buried inside a generic "Topic Practice" card. This removes the `TopicSections` screen as a navigation stop — its list becomes part of Home. |
| D3 | Module density | **Collapsed rows, expand on tap.** Each module row shows progress ring + title + `N topics · N questions` meta (same data `TopicSectionsScreen` shows today). Tapping navigates to `TopicLessons` for that category — reusing the existing screen unchanged as the "expanded" state. No new screen. |
| D4 | Quiz entry point | "Quiz on Module X" is **not** a Home-level CTA — it stays where it already lives, inside `TopicLessonsScreen` (per-category lesson list + quiz CTA), reached one tap from Home instead of two. Tapping it still goes straight to the existing `TopicQuizScreen`, unchanged. |
| D5 | Vocabulary / Clue Words | Promoted to their own Home section ("Learn Important Words"), as compact cards — same data (`getVocabSets`, `getClueGroups`) and same destinations (`VocabSets`, `ClueWords`) as today, just moved from `StudyHomeScreen` onto Home. |
| D6 | Reference links | `Guide` and `HowTo` stay as lightweight text links at the bottom of Home — unchanged from today's Dashboard `LINKS` section. |
| D7 | Paywall / guest gating | **No monetization behavior change.** Reuse `usePaywall`/`isGuestLocked` exactly as `TopicSectionsScreen` and `DashboardScreen` do today — same per-row `Badge` (`locked`/`paid`), same `Paywall` gate before entering a module's lesson list. |
| D8 | Progress card | Keep Dashboard's existing progress card (guest CTA / fresh-start card / overall % ring) unchanged at the top of Home. |
| D9 | Test tab | Stays separate and unchanged — Model Tests (`TestHome`/`ModelTest`) are full timed exam simulations with cross-category pass gates, a different mode from "practice this module," and should stay visually and navigationally distinct. |

## Backend/contract grounding

No backend or contract change required. Every data point Home needs already flows through existing endpoints/loaders that `DashboardScreen`, `StudyHomeScreen`, and `TopicSectionsScreen` already call:
- `/categories` → `getCategories()` (module list, already used by `TopicSectionsScreen`).
- `/vocab/sets`, admin clue-groups data → `getVocabSets()`, `getClueGroups()` (already used by both hubs).
- `/progress` → `useProgress()` (already used by `DashboardScreen` + `TopicSectionsScreen` for per-category rings).
- Pass-mark fields (`pass_correct`/`pass_total`) already consumed by `TopicQuizScreen` — untouched.

This is a navigation/composition change only.

## Implementation (grounded in code)

- `src/navigation/types.ts` — `AppTabParamList`: remove `Study`. Whatever screens `StudyStackParamList` owned (`VocabSets`, `VocabLesson`, `VocabQuiz`, `ClueWords`, `ClueLesson`, `ClueQuiz`, `TopicLessons`, `TopicQuiz`, `Guide`, `HowTo`, `Practice`, `Result`) move into a stack backing the Home tab (rename `StudyStack` → keep as the Home tab's stack, with `DashboardScreen` as its initial route instead of a separate `StudyHome`/`Dashboard` split). Drop `TopicSections` route entirely (folded into Home).
- `src/navigation/AppTabs.tsx` — remove the `Study` tab registration; point `Dashboard` tab's component at the stack (was `DashboardScreen` directly, becomes a stack navigator like `StudyStack` is today).
- `src/screens/DashboardScreen.tsx` — restructure `CORE`/`LINKS` into three sections: Vocabulary+Clue Words cards, inline 4-module list (port row rendering + progress ring + paywall gate from `TopicSectionsScreen.tsx`), Guide/HowTo links. Pull in `usePaywall`, `getTopicSections`, `getSectionProgress`, `localizedPair` (currently only in `TopicSectionsScreen.tsx`).
- `src/screens/StudyHomeScreen.tsx` — delete (fully absorbed).
- `src/screens/TopicSectionsScreen.tsx` — delete (fully absorbed into Home's module section).
- `src/screens/TopicLessonsScreen.tsx` — unchanged, but its back-navigation / breadcrumb target changes from `TopicSections` to `Dashboard`.
- Every screen that does `navigation.navigate('Study', { screen: X, params })` (`DashboardScreen.tsx` links today via `openHub`, plus any deep-link config in `App.tsx`) — re-point the stack name from `Study` to whatever the Home tab's stack is renamed to.
- `src/i18n/locales/{en,fi}/dashboard.json` and `studyHome.json` — merge `studyHome.*` keys into `dashboard.*` namespace (or keep `studyHome.json` as the section-copy source consumed from `DashboardScreen`); keep EN/FI parity — CI i18n-parity check must stay green.

## Out of scope

- Any change to `TopicQuizScreen`, `ModelTestScreen`, `Progress`/`Profile` tabs, or the paywall's business logic (only its call site moves).
- Per-lesson/per-set progress backend work (still gated on BE-3, per `next-changes-plan.md` D8 — unaffected by this restructure).

## Verify

- `npx tsc --noEmit` clean.
- Walk Home (guest, free signed-in, paid signed-in) on Expo web: module rows render with correct progress/paywall state, tapping a module opens its lesson list, "Quiz on Module X" still launches `TopicQuizScreen` correctly, Vocabulary/Clue Words/Guide/HowTo all still resolve.
- Confirm bottom tab bar shows 4 tabs, no dangling `Study` references (`grep -rn "'Study'" src/`).
- i18n parity check (en/fi key sets match) still passes.

_Last updated: 2026-07-17._
