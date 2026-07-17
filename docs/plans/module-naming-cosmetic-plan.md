# Module naming consolidation — cosmetic pass (Home dashboard)

> Branch: `feat/home-consolidation` (continuing on top of the in-flight Phase 3 WIP — the "Practise by Module" section this plan touches only exists there).
> Status: **APPROVED — implementing.**
> Created: 2026-07-17

## Problem

Modules/topics/lessons have been named inconsistently across iterations:
- The visible module titles in `topic_practice.json` ("Taking care of passenger assistance and safety", etc.) are wordier than the internal short names in `categories.json` ("Passenger Help & Safety", etc.) and than a third variant in `questions.json` (`category_en: "Passenger Help + Safety"`, `&` vs `+`).
- Sub-modules are called "lessons" in UI copy and `TopicLesson` in code, while a separate, unrelated, **unused** `Topic` type/`topics.json`/`getTopics()` already exists for per-question source tagging — a latent naming collision.

A hand-drawn spec (user-provided) gives the desired module titles and relabels sub-modules from "lessons" to "Topics".

## Decision (locked)

| # | Topic | Decision |
|---|-------|----------|
| D1 | Module titles | Update the 4 **display** titles in `topic_practice.json` (`TopicSection.name_en`) only. `categories.json` (`ExamCategory.name_en`) is **not** touched — it's the string Convex progress-matching keys off (`progressLookup.ts` ↔ `migrations.ts` seed), untouched to avoid breaking progress rings. |
| D2 | "Lessons" → "Topics" label | Cosmetic i18n-only change: `topic.sectionMeta` copy ("N questions · N lessons" → "N questions · N topics") in both `en`/`fi` namespaces. Rename the interpolation param `lessons` → `topics` at its single call site for clarity — no data/type change, `lesson_count` field name is untouched. |
| D3 | Dead `Topic` collision | Remove the unused legacy `Topic` type, `topics.json`, and `getTopics()` — confirmed zero callers anywhere in the app, and confirmed `questions.json` uses free-text `source_topic_fi`, not `topics.json` ids. Frees "Topic" as a vocabulary word with no ambiguity left in code. |
| D4 | Backend fragility | Out of scope for this pass. File a GitHub issue on `mkschft/taxiapp-server` describing the name-string coupling between `categories.json.name_en` and the Convex-seeded category name, so a future rename doesn't silently break progress tracking. No BE code change now. |

## New module titles (from spec)

| id | old `name_en` | new `name_en` | `name_fi` (unchanged) |
|---|---|---|---|
| `passenger_safety` | Taking care of passenger assistance and safety | Passenger Assistance and Safety | Matkustajien avustamisesta ja turvallisuudesta huolehtiminen |
| `special_needs` | Special needs of different passenger groups | Special Needs of Passenger | Eri matkustajaryhmien erityistarpeet |
| `customer_service` | Customer-service situations in taxi services | Customer Service | Taksipalvelujen asiakaspalvelutilanteet |
| `traffic_safety` | Factors affecting transport and traffic safety | Transport and Traffic Safety | Kuljetusten ja liikenteen turvallisuuteen vaikuttavat tekijät |

## Implementation

- `src/data/json/topic_practice.json` — update the 4 `name_en` values above.
- `src/i18n/locales/en/topic.json`, `src/i18n/locales/fi/topic.json` — `sectionMeta` wording + param rename.
- `src/screens/DashboardScreen.tsx:186` — update call site to pass `topics: section.lesson_count`.
- `src/data/types.ts` — remove `Topic` type.
- `src/data/loaders.ts` — remove `topicsRaw` import and `getTopics()`.
- Delete `src/data/json/topics.json`.
- GitHub issue on `mkschft/taxiapp-server` (not implemented here).

## Out of scope

- Any change to `categories.json`, Convex schema/migrations, or progress-matching logic.
- Renaming `TopicLesson` (internal type) — display label only changes.
- The `&` vs `+` inconsistency in `questions.json`'s `category_en` (noted, not fixed — it's a debug/unused display field, separate cleanup).

## Verify

- `npx tsc --noEmit` clean.
- Manual EN/FI key-parity check across `src/i18n/locales/{en,fi}` (no keys added/removed, only values changed).
- Confirm no remaining references to `getTopics`/`topics.json`/`Topic` type: `grep -rn "getTopics\|topics.json" src`.
- Run Expo web, view Home dashboard in EN and FI: new titles render, "N questions · N topics" copy shows, progress rings still populate (proves `categories.json` matching untouched).

_Last updated: 2026-07-17._
