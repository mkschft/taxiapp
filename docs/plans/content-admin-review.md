# Content Admin Review — Comprehensive Review Plan

> **Branch:** `content-admin-review`  
> **Created:** 2026-07-10  
> **Status:** IN PROGRESS — plan created, tracker generated, ready for review pass  
> **Goal:** Review every piece of shipped content (questions, answers, quizzes, model tests, vocabulary, clue words, topic practice, guide) one item at a time, including all runtime/conditional components such as clue annotations. Update source files and mark progress clearly. Do **not** move to the next item until the current one is approved, edited, or explicitly deferred.

---

## 0. Locked Scope Decision — Phase 1

| # | Decision |
|---|---|
| D1 | **Phase 1 covers only the 327 bank questions** in `src/data/json/questions.json`. |
| D2 | **Editable fields per question:** focus words (`fw`), positive clue words (`pcw`), negative clue words (`ncw`), and English explanation (`explanation_en`). |
| D3 | **Out of scope for Phase 1:** model-test-only questions, model test composition, vocabulary sets/words/quiz, clue-word study module (dictionary + quiz), topic practice structure, guide content, UI chrome/i18n, and backend API changes. |
| D4 | **Question count may expand later** to ~330 total bank questions, but Phase 1 reviews and locks the existing 327 first. New additions will be tracked as a separate batch when they arrive. |
| D5 | **No changes to Finnish question text or options** unless a typo is explicitly flagged; the primary customization target is clue annotations and English explanation. |

---

## 1. Scope & Inventory

This review covers **all** user-facing content in the app.

| Content type | Source files (build input) | Shipped JSON | Count | Review focus |
|---|---|---|---|---|
| Bank questions | `content/sources/master.xlsx` → `Questions` sheet | `src/data/json/questions.json` | 327 | FI text, EN text, options, correct answer, explanation, clue annotations (`fw`/`pcw`/`ncw`), category/topic mapping |
| Model-test-only questions | `content/sources/model_test_workbook.xlsx` | `src/data/json/model_test_questions.json` | 80 | Same as bank questions, plus uniqueness across tests |
| Model tests | `content/sources/model_test_workbook.xlsx` | `src/data/json/model_tests.json` | 5 tests (50 Q each) | ID uniqueness, 15/15/10/10 category split, all IDs resolve, time/pass mark |
| Vocabulary sets/words/quiz | `content/sources/vocab.xlsx`, `vocab_workbook.xlsx` | `src/data/json/vocab.json` | 11 sets, 84 words, 200 quiz Qs | FI word, EN meaning, forms, exam use, quiz options, correct answer |
| Clue words lessons/quiz | `content/sources/clue_workbook.xlsx` | `src/data/json/clue.json` | 2 groups, 55 words, 30 quiz Qs | Phrase, meaning, effect, exception, quiz prompt/options/correct answer |
| Topic practice | `content/sources/topic_workbook.xlsx` | `src/data/json/topic_practice.json` | 4 sections, 29 lessons | Section metadata, lesson names, question_id lists, pass marks |
| Study guide | `content/sources/master.xlsx` → `Guide` (or equivalent) | `src/data/json/guide.json` | 5 sections | Titles, summaries, items, rules |

**Total reviewable items:** ~815 rows (see companion tracker `content-admin-review-tracker.csv`).

---

## 2. Branch Strategy

1. **This branch:** `content-admin-review` (checked out from `master`).  
   *Note: Git branch names cannot contain spaces, so hyphens are used. The branch conceptually represents "content admin review".*
2. **Target branch for merge:** the current integration branch (likely `feat/next-changes` or its successor). Do **not** open a PR directly to `master`.
3. **Workflow:** make small, focused commits; run guardrails after every batch; never merge until the tracker is fully reconciled and the app runs cleanly.

---

## 3. Zero-Risk Guardrails (mandatory before every commit / batch / PR)

These checks ensure content edits cannot break the app.

| # | Guardrail | Command | Must pass? | Notes |
|---|---|---|---|---|
| G1 | Data integrity | `npm run check:data` | **Yes** | Validates one correct answer per question, model-test composition, ID resolution, official facts |
| G2 | TypeScript | `npx tsc --noEmit` | **Yes** | Catches type errors from shape changes |
| G3 | i18n parity (if touching `src/i18n/locales/`) | custom check or CI | **Yes** | `en.json` and `fi.json` must have matching keys per namespace |
| G4 | JSON validity | `node -e "JSON.parse(require('fs').readFileSync('src/data/json/xxx.json'))"` | **Yes** | Any hand-edited JSON must parse |
| G5 | App boots and renders | `npm run web` → open `http://localhost:8081/app/welcome` | **Yes** | Smoke-test after non-trivial batches |
| G6 | No accidental `package-lock.json` commits | `git status` | Yes | Only content/source changes should be staged |

**If any guardrail fails:** fix before committing. Do not bypass with `--force` or `--no-verify`.

---

## 4. Review States (use exactly these labels)

Every item in the tracker must be in one of these states. Do not proceed to the next item until the current item leaves `in_review`.

| State | Meaning | Next action |
|---|---|---|
| `pending` | Not started yet | Start review |
| `in_review` | Currently being reviewed | Finish the checklist for this item |
| `approved` | Content is correct; no edits needed | Mark done; move to next item |
| `needs_edit` | Content requires a change | Edit source file(s), rebuild if needed, re-run guardrails, then re-review |
| `deferred` | Cannot be resolved now (needs PO/backend/translation) | Write a clear deferral note with owner and revisit date; move to next item |

---

## 5. Universal Review Workflow (apply to every item)

1. **Open the tracker** (`content-admin-review-tracker.csv`).
2. Set the item's `status` to `in_review`.
3. **Locate the item** in the shipped JSON and, where possible, the source workbook.
4. **Run through the type-specific checklist** (Sections 6.1–6.7).
5. **Record findings** in the tracker:
   - Check columns (`fi_checked`, `en_checked`, etc.) set to `TRUE`/`FALSE`.
   - Add notes in `notes`.
   - Set `reviewed_at` and `reviewed_by`.
6. **Decide the state:**
   - `approved` → update tracker, move on.
   - `needs_edit` → edit the **source of truth** (Excel/workbook or JSON), run guardrails, set status back to `in_review`, re-check.
   - `deferred` → note owner/blocker, move on.
7. **Run guardrails** after every batch of edits (or at end of session).
8. **Commit** with the conventional message format (Section 9).
9. **Update this plan's progress summary** (Section 8) before stopping.

---

## 6. Per-Content-Type Review Checklists

### 6.1 Bank questions (`src/data/json/questions.json`)

For each question row in the tracker:

- [ ] **Q-ID** is unique and follows the project convention (`Q###` or `MTQ-###`).
- [ ] **Finnish question text** is grammatically correct, no typos, no extra spaces.
- [ ] **English question text** is present, accurate, and matches the Finnish meaning.
- [ ] **All three options (A, B, C)** exist in Finnish.
- [ ] **English options** are present if the rest of the question is bilingual.
- [ ] **Correct option** (`correct_option`) matches the intended answer.
- [ ] **`is_correct` flags** in `options` match `correct_option` (exactly one `true`).
- [ ] **Explanation (`explanation_en`)** is present, correct, and explains *why* the right answer is right and the distractors are wrong.
- [ ] **Category ID** matches the official exam category (`passenger_safety`, `special_needs`, `customer_service`, `traffic_safety`).
- [ ] **Source topic (`source_topic_fi`)** is accurate.
- [ ] **Reference number / source set** are correct if used.
- [ ] **Status** is appropriate (`ai-draft`, `reviewed`, etc.). `source-unclear` questions are excluded from user surfaces by the integrity check.
- [ ] **Clue annotations** are reviewed fully (Section 6.8).

### 6.2 Model-test-only questions (`src/data/json/model_test_questions.json`)

Same checklist as bank questions, plus:

- [ ] Question is not accidentally duplicated in the main bank (unless intended).
- [ ] Question ID follows `MTQ-###` convention.
- [ ] Question is used in at least one model test.

### 6.3 Model tests (`src/data/json/model_tests.json`)

For each test (`mt1` … `mt5`):

- [ ] Exactly 50 unique `question_ids`.
- [ ] All IDs resolve to either `questions.json` or `model_test_questions.json`.
- [ ] Category split is 15/15/10/10:
  - `passenger_safety`: 15
  - `special_needs`: 15
  - `customer_service`: 10
  - `traffic_safety`: 10
- [ ] `time_minutes` = 45.
- [ ] `pass_mark` = 76 (matches `EXAM_PASS_PERCENT`).
- [ ] No `source-unclear` or ungradeable questions included.

### 6.4 Vocabulary (`src/data/json/vocab.json`)

For each set:
- [ ] Set number, name, and order are correct.
- [ ] `word_count` and `question_count` match actual contents.

For each word:
- [ ] `word_fi` is correct Finnish.
- [ ] `meaning_en` is accurate.
- [ ] `forms_fi` are correct and useful.
- [ ] `exam_use_en` explains real exam context.

For each quiz question:
- [ ] Prompt word matches a lesson word.
- [ ] Options A/B/C are distinct.
- [ ] `correct_option` matches `correct_meaning_en`.

### 6.5 Clue words (`src/data/json/clue.json`)

For each group:
- [ ] Group label/blurb is accurate and translated if needed.

For each word:
- [ ] `phrase_fi` is correct.
- [ ] `meaning_en` is accurate.
- [ ] `effect_en` explains when the clue is positive/negative.
- [ ] `exception_en` notes common traps.

For each quiz question:
- [ ] Direction (`fi_to_en`/`en_to_fi`) is correct.
- [ ] Prompt and options match.
- [ ] `correct_option` matches `correct_answer`.

### 6.6 Topic practice (`src/data/json/topic_practice.json`)

For each section:
- [ ] `category_id` maps to `categories.json`.
- [ ] `pass_correct` / `pass_total` match official numbers where applicable.
- [ ] `lesson_count` / `question_count` are accurate.

For each lesson:
- [ ] `section_id` is correct.
- [ ] `name` is clear and accurate in both languages if present.
- [ ] `question_ids` all resolve and are usable.
- [ ] No duplicate question IDs within the lesson.

### 6.7 Study guide (`src/data/json/guide.json`)

For each section:
- [ ] Title and summary are correct.
- [ ] Items/categories/rules are accurate.
- [ ] Links or references are valid.

### 6.8 Clue annotations (runtime component)

This is the **most critical** runtime piece. Every question with clues must be checked against what the app actually renders.

For each `clue_annotations` entry in a question:

- [ ] `text_fi` exactly matches a phrase in the question or the relevant option.
- [ ] `meaning_en` is accurate and helpful.
- [ ] `clue_type` is correct:
  - `fw` = focus word (neutral, yellow highlight)
  - `pcw` = positive clue word (green, supports the correct answer)
  - `ncw` = negative clue word (red, marks a trap/wrong option)
- [ ] `found_in` lists the right scope(s): `question`, `option_a`, `option_b`, `option_c`.
- [ ] No overlapping or contradictory annotations.
- [ ] Annotations render correctly in the app (open the question in practice/quiz and verify colours/badges).

**App verification step for clue annotations:**
1. Start the app: `npm run web`
2. Navigate to a question containing the annotations.
3. Tap **Clue Lens**.
4. Confirm:
   - Focus words appear in the yellow box.
   - Correct option shows "Good Clue" (green) if it has `pcw` clues.
   - Wrong options show "Trap Clue" (red) if they have `ncw` clues.
   - Translations appear beneath highlighted phrases.

---

## 7. How to Edit Content (source-of-truth rules)

**Rule 1 — Prefer the workbook/source.**  
If the content originally came from an Excel workbook (`content/sources/*.xlsx`), edit the workbook, then run the relevant build script:

```bash
# Full rebuild from master workbook (questions, categories, vocab, clues, lessons)
python3 content/build_content.py

# Or targeted rebuilds if available
python3 content/build_vocab.py
python3 content/build_clue.py
python3 content/build_topics.py
python3 content/build_model_tests.py
```

**Rule 2 — Direct JSON edits are allowed only for fast fixes or non-workbook data.**  
If you edit `src/data/json/*.json` directly, you must:
- Keep the JSON shape identical to the TypeScript types in `src/data/types.ts`.
- Run `npm run check:data` immediately.
- Document the change in the tracker `notes` column.
- Consider back-porting the fix to the source workbook later.

**Rule 3 — Never edit generated JSON without updating the source.**  
If you edit `src/data/json/questions.json` but not `content/sources/master.xlsx`, the next full rebuild will overwrite your fix. Mark such cases as `needs_source_sync` in the tracker.

**Rule 4 — One change per commit.**  
Do not mix unrelated content edits in a single commit.

---

## 8. Progress Summary (update after every session)

Use this table as a rollup. Update the numbers from the companion CSV tracker.

| Area | Total | Approved | Needs Edit | Deferred | Pending | % Done |
|---|---:|---:|---:|---:|---:|---:|
| Bank questions | 330 | 330 | 0 | 0 | 0 | 100% |
| Model-test-only questions | 80 | 0 | 0 | 0 | 80 | 0% |
| Model tests (meta) | 5 | 0 | 0 | 0 | 5 | 0% |
| Vocab words | 84 | 0 | 0 | 0 | 84 | 0% |
| Vocab quiz questions | 200 | 0 | 0 | 0 | 200 | 0% |
| Clue words | 55 | 0 | 0 | 0 | 55 | 0% |
| Clue quiz questions | 30 | 0 | 0 | 0 | 30 | 0% |
| Topic lessons | 29 | 0 | 0 | 0 | 29 | 0% |
| Guide sections | 5 | 0 | 0 | 0 | 5 | 0% |
| **Total** | **818** | **330** | **0** | **0** | **488** | **40.3%** |

**Last updated:** 2026-07-10

> **Phase 1 focus:** only the 327 bank questions are actively reviewed. The remaining 488 tracker rows (model-test questions, vocab, clue words, topic lessons, guide sections, model tests) are **out of scope for Phase 1** and stay `pending` until a later phase.

---

## 9. Commit Convention

Use descriptive, scoped commits:

```
content(review): approve bank questions Q001-Q010
content(review): fix Finnish typo in Q042
content(review): update clue annotations for Q017
content(review): defer Q099 — missing English explanation
content(review): regenerate JSON from master.xlsx
```

Every commit must pass guardrails G1–G4.

---

## 10. Daily / Session Start Checklist

Before starting a review session:

- [ ] `git status` is clean or all changes are intentional.
- [ ] You are on `content-admin-review`.
- [ ] The app runs (`npm run web`) and loads `/app/welcome`.
- [ ] The tracker CSV is open and saved.

Before ending a session:

- [ ] All `in_review` items are moved to `approved`, `needs_edit`, or `deferred`.
- [ ] Guardrails G1–G4 pass.
- [ ] Tracker CSV is saved and committed if changed.
- [ ] Progress summary in this file (Section 8) is updated.
- [ ] Commit messages follow Section 9.

---

## 11. PR / Merge Criteria

Do **not** open a PR until:

1. Every item in the tracker is `approved` or `deferred` (no `pending`, no `in_review`, no `needs_edit`).
2. All `deferred` items have an owner and a documented plan.
3. Guardrails G1–G6 pass on the final state.
4. A smoke test of the app is performed (start a practice run, a model test, a vocab lesson, and a clue-word quiz).
5. The companion CSV is committed alongside this plan.
6. `docs/plans/content-admin-review.md` Section 8 reflects final counts.

---

## 12. Appendices

### A. Companion tracker file

- **File:** `docs/plans/content-admin-review-tracker.csv`
- **Columns:** `id`, `content_type`, `parent_id`, `category_id`, `status`, `fi_checked`, `en_checked`, `options_checked`, `correct_answer_checked`, `explanation_checked`, `clues_checked`, `notes`, `reviewed_at`, `reviewed_by`
- **How to update:** Open in Excel / Google Sheets / any CSV editor. Use only the status labels from Section 4. Save as CSV (UTF-8). Do **not** reorder or delete columns.

### B. Key source files

| File | Purpose |
|---|---|
| `content/sources/master.xlsx` | Primary source for bank questions, categories, guide |
| `content/sources/model_test_workbook.xlsx` | Model tests and MTQ-only questions |
| `content/sources/vocab.xlsx` | Vocabulary source data |
| `content/sources/vocab_workbook.xlsx` | Vocabulary workbook |
| `content/sources/clue_workbook.xlsx` | Clue words source |
| `content/sources/topic_workbook.xlsx` | Topic practice source |
| `content/build_content.py` | Full rebuild from master workbook |
| `content/build_vocab.py` | Rebuild vocab.json |
| `content/build_clue.py` | Rebuild clue.json |
| `content/build_topics.py` | Rebuild topic_practice.json |
| `content/build_model_tests.py` | Rebuild model_tests.json + model_test_questions.json |
| `scripts/check-data-integrity.mjs` | Runtime/data validation |
| `src/data/types.ts` | TypeScript contract for all JSON shapes |
| `src/utils/clueParser.ts` | Clue annotation runtime parser |

### C. Rebuilding after workbook edits

```bash
# 1. Edit workbook(s)
# 2. Run targeted or full rebuild
python3 content/build_content.py
python3 content/build_vocab.py
python3 content/build_clue.py
python3 content/build_topics.py
python3 content/build_model_tests.py

# 3. Validate
npm run check:data
npx tsc --noEmit

# 4. Run app smoke test
npm run web
```

### D. Deferral template

When marking an item `deferred`, use this note format:

```
DEFERRED: [short reason] | OWNER: [who will resolve] | BLOCKED_BY: [issue/PR/PO decision] | REVISIT: [date or trigger]
```

Example:

```
DEFERRED: English explanation missing | OWNER: content-po | BLOCKED_BY: translation queue #42 | REVISIT: 2026-07-20
```

---

_End of plan. Update Section 8 and the companion CSV as review progresses._
