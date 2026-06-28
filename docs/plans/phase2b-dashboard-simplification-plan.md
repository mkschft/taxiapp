# Phase 2b — Dashboard simplification (learning-modes home)

> Branch: `feat/ui-polish` (off `feat/next-changes`).
> Status: **DONE — implemented & previewed live; approved.**
> Created: 2026-06-28

## Problem

The old dashboard mixed **two different axes** in one view:
- **Exam categories** (Passenger Help, Special Needs, Customer Service, Transport Safety) — *what* the questions are about. Shown as 4 hero tiles.
- **Learning modes** (Topic Practice, Vocabulary, Clue Words, Model Tests) — *how* you study. Shown as a separate "More" list.

Surfacing both forces the user to reason about two systems at once, and the 4 category tiles duplicated what `TopicSections` (Study → Topic Practice) already shows with per-category progress.

## Decision (locked)

**The dashboard surfaces only learning modes — one consistent axis.** Exam categories live one level down, inside Topic Practice (`TopicSections`), where per-category progress already lives. Answer one question on the home screen: *"how do you want to study?"*

### Layout (locked)
- **Full-width rows**, not a horizontal tile grid — rows are the app-wide pattern (`StudyHomeScreen`, all lesson/set cards). Reuse `IconChip + title + subtitle + Badge`.
- Core rows (in order): **Topic Practice · Vocabulary · Clue Words · Model Tests**.
  - Topic Practice → `Study/TopicSections` (the 4 categories w/ progress).
  - Model Tests → `Test/TestHome` (cross-stack).
- **Exam Guide** and **How to use** demoted to lightweight text links below the rows.
- Keep the greeting + the progress card (guest card / fresh-start card / overall-progress ring), unchanged.
- No per-row metric on the dashboard: the overall % lives in the progress card; per-category % lives in `TopicSections`. Avoids fake/empty numbers for modules whose per-module progress isn't tracked yet (BE-3 pending).

### Copy
- Section header: **"Start practising"** (`dashboard.studyTitle`; fi `Aloita harjoittelu`).
- **English "Model Tests" → "Mock Exams"** (decided 2026-06-29, executed on `feat/ui-polish`). English-only branding rename across `nav`, `testHome`, `dashboard`, `howto`, `modelTest`, `auth`, `pricing`, `studyHome`. Verb-form `Start test` → `Start exam`; `modelTest` dialogs → `Quit/Submit exam?`. Finnish unchanged (already `koe`/`mallikoe`). Incidental in-sentence "test" words left as-is.

## Implementation

- `src/screens/DashboardScreen.tsx` — removed the category-tile hero + the two-axis "More" list; render a single `CORE` list of learning modes as full-width rows, plus `LINKS` (Exam Guide, How to use). Dropped now-unused `localizedPair`/`CategoryIcon`/category-section helpers.
- `src/i18n/locales/{en,fi}/dashboard.json` — added `studyTitle`. All other keys reused; EN/FI parity kept.

## Out of scope
- Per-module progress on Vocab/Clue (needs backend tracking — BE-3).
- Reworking the Study/Tests tabs (the dashboard intentionally overlaps as the home hub with progress context + cross-stack launch).

## Verify
- `npx tsc --noEmit` clean.
- Previewed live on Expo web (guest state): rows render, badges/links correct.

_Last updated: 2026-06-28._
