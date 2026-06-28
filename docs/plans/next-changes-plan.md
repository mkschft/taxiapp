# Next Changes — Product Requirements & Execution Plan

> Branch: `feat/next-changes`
> Created: 2026-06-28
> Status: **DRAFT — awaiting approval to implement** (a second large task is still being formulated and will be appended)

This file is the single source of truth for the current batch of changes. Each task has a checkbox so we can cross-check progress as work proceeds.

---

## Decisions (locked with product owner)

| # | Topic | Decision |
|---|-------|----------|
| D1 | Progress ring display | Ring shows **Mastery %** (= distinct questions answered correctly at least once / total in the category — already what the backend `completed/total` encodes). Drop the "X/Y done" subtitle; replace with **"Last practiced Nd ago"**. Arc fills by mastery %. |
| D2 | Mark / save-for-later | **Global bookmark** — persists across app restarts/sessions. Accessible from a dedicated "Saved" list any time, not just the test results screen. |
| D3 | App language default | Default **English**. Manual switch to **Suomi** in Profile. No device-locale auto-detection. |
| D4 | Finnish UI coverage | Build the **full i18n infra now**; translate the **Model Test** screen UI first. Other screens get the scaffold (keys wired) but stay English, translated incrementally later. |
| D5 | i18n scope boundary | UI **chrome only** (buttons, labels, nav, settings). **Never** translate content (questions, answers, vocabulary, explanations) — that stays as authored. |
| D6 | Progress screen stat chips | **Drop** the fake "Day streak / Accuracy / Tests done" chip row entirely. Lead with per-category **mastery counts** (real numbers, not bare %) + **auto-populated Weak areas**. Minimal/no backend. |
| D7 | Topic-quizzes content source | Per-subcategory quizzes **reuse each subcategory's existing question bank** — **no new content authored**. "Quiz" = a scored, pass/fail run with feedback deferred to the end; "Practice" = the existing immediate-feedback run. **Structural/UI only.** Lives in this same plan as R5. |
| D8 | Per-lesson / per-set progress | Backend currently tracks progress only at **`Official` + its 4 section subcategories** (+ `Vocabulary` main) — verified in `backend/convex/convex/migrations.ts` (`CATEGORY_SEEDS`) and `progress.ts`. **No lesson/vocab-set categories.** → Add **BE-3** (per-problem-set progress, keyed by `problemSetId`). FE built ready now; lesson/set rings stay **neutral (no fake %)** until BE-3 lands. Sections (4) + overall are real today. |

---

## Requirement R1 — Progress rings show Mastery %, drop "done" subtitle, add "Last practiced"

**What:** Keep a percentage **inside** the ring, but make it **Mastery %** (per D1). Remove the low-signal "X/Y done" subtitle and replace it with **"Last practiced Nd ago"** (or "Not started yet"). Arc fills by mastery %.

**Backend grounding (verified):**
- `/progress` already marks a question `completed` only when answered **correctly at least once**, so `percentage` already = mastery % — **no backend change needed for the ring**.
- The `answers` table stores `status` (correct/wrong) + `createdAt`/`updatedAt`; sessions store `startedAt`/`completedAt`/`score`. So **"last practiced" is derivable** but **not currently exposed** by `/progress` → requires a small backend addition (max `answers.updatedAt` per category, surfaced as `lastPracticedAt`).

**Where (grounded in code):**
- Ring component: `src/components/ui/ProgressRing.tsx` (renders pct text at center; `value` 0–100 drives the arc).
- Topic sections list: `src/screens/TopicSectionsScreen.tsx` (ring ~L63–70, `answered`/`pctDone` hardcoded to `0` ~L53–54, subtitle "X/Y done" ~L80).
- Topic lessons list: `src/screens/TopicLessonsScreen.tsx` (ring ~L100–107, hardcoded `0` ~L90–91, subtitle ~L113).
- Vocabulary sets list: `src/screens/VocabSetsScreen.tsx` (ring ~L66–73, hardcoded `0` ~L56–57, subtitle "X/Y learned" ~L83).
- Vocab set detail uses a **bar**, not a ring: `src/screens/VocabSetDetailScreen.tsx` (L77–83) — out of scope for the ring change, but its `seenCount` is hardcoded `0` too.

**Dependency / important finding:** These list screens currently **hardcode progress to `0`**. Only the Dashboard wires real data via `useProgress` (`src/hooks/useProgress.ts`) → `progressApi` (`src/lib/progressApi.ts`), which returns per-`mainCategory` and per-`subcategory` `{ total, completed, percentage }`. So R1 is two sub-parts:

- [ ] **R1.a** — Keep `ProgressRing` showing `value%` (mastery %); no center-label change needed. Ring stays a clean percentage. (Verify font/layout unchanged.)
- [x] **R1.b** — Wire real progress into the list screens, replacing hardcoded `0`s. *(PR1: `progressLookup.ts`, `problemSetProgressApi.ts`, `useProblemSetProgress.ts`; TopicSections real, TopicLessons/VocabSets BE-3-ready with neutral rings.)* Two data paths (see D8):
  - **TopicSections (4 rows):** real **now** via `useProgress` → match `Official` subcategory by `CAT[section.category_id].name_en` (same mapping the Dashboard uses). Ring `value` = `percentage`.
  - **TopicLessons (29) + VocabSets (11):** keyed by `problemSetId` (from `backendProblemSetIds.ts`) via a new graceful `useProblemSetProgress` hook hitting **BE-3** (`GET /progress/problem-sets`). Until BE-3 lands → empty map → **neutral ring (no %), no fake count**.
- [ ] **R1.c** — Remove the "X/Y done" / "X/Y learned" subtitle on Topic rows; replace with a **"Last practiced Nd ago"** line (relative time) or "Not started yet" when null. Add a small relative-time helper.
- [ ] **R1.d** — **Backend:** extend `/progress` to include `lastPracticedAt` per main category and subcategory (max `answers.updatedAt` across that category's problems). Update `progressApi.ts` `ProgressItem` type + `useProgress` consumers.
- [ ] **R1.e** — (Vocab) Decide subtitle for Vocab rows — "last practiced" only applies if vocab attempts are tracked (see OQ1). If not tracked, keep Vocab rows minimal (title + mastery ring) until vocab progress exists.

**Open question (non-blocking):** Vocab "learned" progress — does the backend `useProgress` payload include vocab sets, or only exam questions? If vocab progress isn't on the backend yet, R1.b/R1.e for VocabSets may need a separate data source or stay at the existing local value until backend support exists. **To confirm during implementation.**

---

## Requirement R2 — "Mark / Save for later" in Model Test (global bookmark)

**What:** Add a **Mark** button in the Model Test footer (next to `Next →`) so the user can flag the current question. Per D2, marks are a **persistent global bookmark** surviving app restarts, surfaced in a dedicated **Saved** list reachable any time — not only post-test.

**Where (grounded in code):**
- Runner: `src/screens/ModelTestScreen.tsx` — footer with "X/50 answered" + "Next →" (~L277–288); answers in **local state** (`answers` ~L81, `qIndex` ~L80). **No mark/flag concept exists today.**
- Option row: `src/components/question/OptionRow.tsx`.
- Results: `src/screens/ResultScreen.tsx` — already has a "review wrong answers" pattern (~L106–132) to mirror for UX.
- Nav types: `src/navigation/types.ts` (Result params ~L89–101; will add a Saved/Bookmarks route).

**Tasks:**
- [ ] **R2.a** — Create a persistent bookmark store: `src/store/savedQuestionsStore.tsx` (React Context + `useState`, mirroring `authStore`/`paywallStore` conventions) backed by `AsyncStorage` (key under existing `STORAGE_KEYS`). No backend bookmark endpoint exists, so store a **lightweight snapshot at mark time** — `{ id, text, options, correctAnswer, source/testId, markedAt }` — so the Saved list renders offline without re-fetching. (Model Test questions can come from backend problem sets; snapshotting avoids a fetch/lookup dependency.)
- [ ] **R2.b** — Add a **Mark** toggle button in the Model Test footer next to `Next →`, reflecting marked/unmarked state for the current question. Light haptic on press (per AGENTS guidelines, guard `Platform.OS !== 'web'`).
- [ ] **R2.c** — Build a **Saved** screen listing all bookmarked questions (grouped or flat), each tappable to review the question (reuse the question render path; read-only review mode like the wrong-answers review). Add unmark/remove.
- [ ] **R2.d** — Add navigation entry point to the Saved list (e.g. from Profile and/or Tests area — decide placement during impl; propose Profile row + a link on ResultScreen).
- [ ] **R2.e** — Surface marked questions on `ResultScreen` too (a "Marked for review" section mirroring wrong-answers), since the user originally framed it as "return after finishing the test."
- [ ] **R2.f** — Wrap the app with the new provider in `App.tsx` alongside existing providers.

**Open questions (non-blocking, decide in impl):**
- Backend vs local persistence — start with **AsyncStorage** (simplest, meets "persists across restarts"); revisit backend sync if cross-device is needed later.
- Bottom tab bar is visible during the test in the screenshot (web layout). Confirm whether to hide tabs during an active test — likely a separate small UX fix, noted but not in R2 scope.

---

## Requirement R3 — App language (English / Suomi), UI chrome only

**What:** Introduce an i18n layer for **UI chrome only** (D5). Add an "App language" setting in Profile (default English, manual switch — D3). Build the full infra now, translate the **Model Test** screen UI first; scaffold remaining screens for phased translation (D4).

**Where (grounded in code):**
- Libraries **already installed but unused**: `react-i18next` (^17), `i18next` (^26) in `package.json`. No provider, no translation files, no usage anywhere.
- Profile (settings home): `src/screens/ProfileScreen.tsx` — no language picker today.
- Auth user shape: `src/store/authStore.tsx` (~L14–22) — no language field.
- App root/providers + deep-link `linking`: `App.tsx`.
- Content already carries `title_fi`/`title_en` (e.g. `ModelTest` in `src/data/types.ts`) — that's **content**, separate from chrome; do not conflate.

**Tasks:**
- [ ] **R3.a** — Initialize i18n: `src/i18n/index.ts` configuring `i18next` + `react-i18next` with `en` and `fi` resource bundles, fallback `en`, and a persisted language preference (AsyncStorage under `STORAGE_KEYS`). Initialize before/within `App.tsx`.
- [ ] **R3.b** — Create translation resource files: `src/i18n/locales/en.json` and `src/i18n/locales/fi.json`. Establish a namespacing convention (e.g. `common`, `modelTest`, `nav`, `profile`). Populate **Model Test** keys fully in both `en` and `fi`; add other namespaces as keys-with-English-values placeholders (English shown until translated).
- [ ] **R3.c** — Add an "App language" setting UI in `ProfileScreen` (English / Suomi selector). Persist the choice and switch live via `i18n.changeLanguage`.
- [ ] **R3.d** — Refactor **Model Test** screen UI strings (`ModelTestScreen.tsx`, plus the new **Mark** button and footer "X/answered", "Next") to use `useTranslation()` keys. This is the visible win and overlaps with R2.b — coordinate so the Mark button is translated from the start.
- [ ] **R3.e** — Wrap app with i18n provider/init in `App.tsx`. Ensure language preference loads on startup.
- [ ] **R3.f** — (Scaffold, no full translation) wire the shared bottom-tab labels and a couple of common buttons to keys as a template for future screens. Document the pattern in this file / a short README so phased translation is mechanical.

**Boundary reminder (D5):** Only chrome. Questions, answer options, vocabulary words, explanations, and content titles remain untouched by i18n.

---

## Requirement R4 — Progress tab ("My Progress") shows real, grounded metrics

**What:** Make the Progress screen reflect real data and lead with the metrics most useful at a glance for exam readiness (per D6). Remove fake placeholders.

**Where (grounded in code — `src/screens/ProgressScreen.tsx`):**
- Overall ring + "X of Y questions practiced" — **already real** (`useProgress`, L23–25, L46–51). Keep.
- Stat chip row "Day streak / Accuracy / Tests done" — **all hardcoded `0`/`0%`** (L52–65). **Remove entirely** (D6).
- "BY OFFICIAL CATEGORY" — currently `ProgressBar` with `value={pct}` only (L72–82). Per-category `completed`/`total` counts ARE available in `useProgress` (`sub.completed`, `sub.total`) but not displayed.
- Vocabulary "X / Y words" (L86–95) — real, keep.
- Weak areas (L98–104) — **hardcoded "No weak areas yet."** Derivable now from lowest-mastery subcategories.

**Tasks:**
- [ ] **R4.a** — Remove the fake stat-chip row (Day streak / Accuracy / Tests done) and its styles.
- [ ] **R4.b** — Per-category rows: show **real counts** (e.g. "32 / 44 mastered") instead of / alongside the bare %. Keep a thin bar for visual scan, but the count is the headline. Source from `sub.completed` / `sub.total`. **(FE-only — these fields are already in the `/progress` payload, currently discarded.)**
- [ ] **R4.c** — Auto-populate **Weak areas** as **weak subcategories ranked by wrong-answer count** (per product decision). Each row: subcategory name + "**N wrong**" + a **"Practice these →"** action that launches a focused run (reuse R5's runner) over exactly those not-yet-correct questions. **Clearing is implicit:** answering them correctly raises mastery and the area drops off automatically — no manual delete. Falls back to the existing "all good" state when none qualify.
  - **Definition (coherent with existing logic):** a question is "still weak" when it's been **attempted but has no correct answer yet** (the inverse of `/progress`'s `completed`). So practicing-to-correct moves it into `completed`, raising mastery % and removing it from the weak list — one consistent model across R1/R4/R5.
  - **Backend addition (R4.c-be):** extend `/progress` (or a sibling endpoint) to return, per subcategory: `wrongCount` and `wrongQuestionIds[]` (attempted, not-yet-correct). Derivable from data `progress.ts` already iterates (it knows per-problem whether a correct answer exists). Update `progressApi.ts` `ProgressItem` type + consumers.
- [ ] **R4.d** — (Optional, reuses R1.d) show overall **"Last practiced Nd ago"** near the top once `lastPracticedAt` is exposed by the backend. Skip if not landing R1.d in this batch.
- [ ] **R4.e** — i18n: route the screen's chrome strings (headers, labels) through keys per R3 scaffold (English values for now).

**Note:** This deliberately avoids Day streak / Accuracy / Tests-done backend work (deferred). The only backend touches are the small `lastPracticedAt` (R4.d, shared with R1.d) and the weak-area `wrongCount`/`wrongQuestionIds` addition (R4.c-be). Removing the fake chips and per-category counts are frontend-only.

---

## Requirement R5 — Per-subcategory Quiz mode in Topic Practice (reuse existing questions)

**What:** Topic Practice currently only offers practice runs per subcategory (lesson). Add a **Quiz** mode per subcategory that reuses the *same* question bank but runs as a scored, pass/fail assessment with feedback held until the end (per D7). No new content. **FRONTEND-ONLY** — the quiz pipeline (`quizApi.ts`), the `useStartQuiz` resolver, and all 31 topic problem-set IDs already exist; this wires them into Topic Practice. Completing a session already feeds `/progress`.

**Where (grounded in code):**
- Hierarchy: 4 sections → 23 lessons (subcategories). Source: `src/data/json/topic_practice.json`, types in `src/data/types.ts` (`TopicSection` L138–149, `TopicLesson` L151–159 with `question_ids[]`), loaders in `src/data/loaders.ts` (L80–100).
- Current flow: `TopicSectionsScreen` → `TopicLessonsScreen` (`startLesson` → `navigation.navigate('Practice', { queue: question_ids })`) → `PracticeScreen` (generic runner, immediate feedback) → `ResultScreen`.
- **Proven quiz pattern to mirror:** `VocabSetDetailScreen` shows a **Lesson card + Quiz card**; `VocabQuizScreen` is a dedicated scored runner that loads from **backend `problemSetId` when present, else local JSON** (L67–92).
- **Backend already provisioned:** `src/data/backendProblemSetIds.ts` maps all 23 topic lessons (`topic/<section>/lessons/<lesson>` → problemSetId). Currently unused by Topic Practice.
- Section pass marks exist: `TopicSection.pass_correct` / `pass_total` (official gate) — use for quiz pass/fail when present.
- Unused `Quiz` type already declared (`types.ts` L210–216).

**Tasks:**
- [ ] **R5.a** — Add a **quiz mode** to the runner. Prefer extending `PracticeScreen` with a `mode: 'practice' | 'quiz'` param over a whole new screen: in `'quiz'` mode, suppress per-question correctness feedback, score the run, and route to `ResultScreen` with pass/fail. (Fall back to a dedicated `TopicQuizScreen` mirroring `VocabQuizScreen` only if Practice's UI can't cleanly support both.) Add the param to `navigation/types.ts`.
- [ ] **R5.b** — Subcategory entry UI: offer both **Practice** and **Quiz** per subcategory, mirroring `VocabSetDetailScreen`'s two cards. Today `TopicLessonsScreen` jumps straight into Practice — add the Quiz affordance (either inline on each lesson row or via a small lesson-detail step).
- [ ] **R5.c** — Wire the existing backend `problemSetId` (from `backendProblemSetIds.ts`) for authed users so quiz attempts are **recorded** (this is what feeds progress/mastery); fall back to local `question_ids` for guests — mirror `VocabQuizScreen`'s problemSetId-or-local branch.
- [ ] **R5.d** — Quiz results: reuse `ResultScreen`. Pass mark = subcategory `pass_correct/pass_total` when present, else a sensible default (e.g. 70%). Show pass/fail + review wrong answers (existing pattern).
- [ ] **R5.e** — Question ordering: default to the same questions, **shuffled**, for quiz (vs. fixed order for practice). Confirm whether to cap quiz length (e.g. all vs. N) during impl.
- [ ] **R5.f** — Ensure quiz completion updates progress so **R1 mastery %** and **R4** reflect it (recording via backend problem set should do this automatically — verify).
- [ ] **R5.g** — i18n the new quiz chrome (buttons/labels) per the R3 scaffold.

**Open question (non-blocking):** Quiz length/cap and shuffle policy (R5.e); pass-mark default where official gate absent (R5.d). Decide in impl.

---

## Requirement R6 — Dashboard hero: state-based & de-duplicated

**What:** The Dashboard progress hero currently shows the overall percentage **three times** (big number + bar + ring) and shows a demotivating `0%` to fresh signed-in users. Make it state-based and minimal.

**Where (grounded in code — `src/screens/DashboardScreen.tsx`):**
- Authed progress card L116–130: big `progressPct` (L120) + bar (L121–123) + `ProgressRing` (L128) — all the same `completion` value. Count text L124–126.
- Guest state already handled separately (L99–115) — **keep as-is**.
- Data: `completion`, `totalCompleted`, `totalQuestions` from `useProgress` (L57–60).

**Tasks:**
- [ ] **R6.a** — **Fresh state** (authed, `totalCompleted === 0`): replace the `0%` card with an **encouraging start card** — e.g. "Ready to start? {totalQuestions} questions across your exam topics — pick one below." No percentage. (Distinct from the existing guest card.)
- [ ] **R6.b** — **Active state** (`totalCompleted > 0`): show **ring + count only**. Keep `ProgressRing value={completion}` + "X of Y practiced"; **remove the big `progressPct` number and the bar** (and their now-unused styles). Consistent with R1/R4 rings.
- [ ] **R6.c** — Keep the `loading` placeholder handling; keep guest branch untouched.
- [ ] **R6.d** — i18n the hero chrome strings per R3 scaffold.

**Note:** Frontend-only, no backend. Label can stay "Overall progress" (it's the same mastery metric as R1/R4 — optional wording alignment).

---

## Suggested execution order

1. **R3.a–R3.b** (i18n infra + resource files) — foundational; R2/R3 button work depends on it.
2. **R2.a, R2.f** (saved store + provider wiring) — foundational for Mark.
3. **R2.b + R3.d** (Mark button + Model Test translation) together — they touch the same footer.
4. **R2.c–R2.e** (Saved screen, nav entry, results section).
5. **R3.c, R3.e** (Profile language setting + app wiring).
6. **R1.b–R1.e** (wire real progress + backend `lastPracticedAt` → rings show mastery %, "last practiced").
7. **R4.a–R4.e** (Progress tab: drop fake chips, per-category counts, auto weak-areas) — shares R1's progress data.
8. **R6.a–R6.d** (Dashboard hero: fresh-state card + ring-only active state) — shares R1/R4 progress data.
9. **R5.a–R5.g** (Topic Practice quiz mode reusing existing questions + backend problem sets) — largest, but structural; feeds R1/R4 progress.
10. **R3.f** (scaffold remaining screens).
11. Manual verification pass (iOS / web) per `/run`.

> R1, R4, R5 all consume the same `useProgress`/`/progress` data — do the progress-data wiring once and reuse.

---

## Cross-cutting notes & constraints

- Follow `AGENTS.md`: function components, `StyleSheet.create`, theme tokens (`colors/spacing/fontSize/font/radius/shadow`), single quotes, no trailing commas, `type` over `interface`, haptics on press (guarded for web), `SafeAreaView` root, Expo v56 docs.
- No test runner/linter in frontend — verification is manual via the app (`/run` / `/verify`).
- New stores follow the `authStore`/`paywallStore` Context + `useState` pattern; persistence via AsyncStorage under `STORAGE_KEYS`.
- Keep changes additive/backward-compatible where possible (e.g. `ProgressRing` default behavior unchanged).

---

## Open questions log (to resolve before/within implementation)

- [ ] OQ1 (R1.b): Does `useProgress` payload include **vocabulary** set progress, or only exam questions? Determines VocabSets data source.
- [ ] OQ2 (R2): AsyncStorage-only vs backend-synced bookmarks. Starting AsyncStorage; confirm if cross-device needed.
- [ ] OQ3 (R2/UX): Hide bottom tab bar during an active Model Test? (Separate small fix.)
- [ ] OQ4 (R1.d): Is the in-ring `X/Y` + subtitle `X/Y done` redundant — keep both or simplify subtitle?

---

## PR plan (organized, independently reviewable)

Base branch: `feat/next-changes`. Each PR is small, self-contained, and green on the **current** backend (optional BE fields degrade gracefully). Suggested split, in dependency order:

| PR | Branch | Scope | Depends on | Backend |
|----|--------|-------|-----------|---------|
| **PR1** | `feat/progress-data-wiring` | Wire `useProgress` into Topic/Vocab list screens; consume existing `subcategories[].completed/total`; replace hardcoded `0`s. Shared foundation for R1/R4/R6. | — | none |
| **PR2** | `feat/rings-mastery-and-lastpracticed` | R1: rings show mastery %; drop "X/Y done" subtitle → "Last practiced" (optional field, "Not started" fallback). | PR1 | BE-1 (optional) |
| **PR3** | `feat/dashboard-hero` | R6: fresh-state start card + ring-only active state (drop big number + bar). | PR1 | none |
| **PR4** | `feat/progress-tab` | R4: drop fake chips; per-category counts; weak-areas from `wrongCount`/`wrongQuestionIds` (optional, graceful) with "Practice these". | PR1 (+PR6 runner) | BE-2 (optional) |
| **PR5** | `feat/i18n-foundation` | R3: i18n init, en/fi resource files, Profile "App language" setting, app wiring, tab-label scaffold. | — | none |
| **PR6** | `feat/topic-quiz-mode` | R5: quiz mode in the runner + subcategory Practice/Quiz entry + wire existing problem sets + results. | PR5 (for strings) | none |
| **PR7** | `feat/model-test-mark-and-fi` | R2: persistent Saved store + Mark button + Saved screen + results section; R3.d translate Model Test screen (Mark/Next/answered) — same footer, done together. | PR5 | none |

Notes:
- PR1 is the keystone (everything progress-related builds on it); land it first.
- PR2/PR4 merge and function before BE-1/BE-2 land; when the backend ships them, no FE change needed beyond removing the fallback copy if desired.
- PRs can be reordered; PR5 before PR6/PR7 so translation keys exist when those screens are touched.
- Each PR updates the relevant checkboxes in this file.

---

## Task tracker (rollup)

- [x] R1 — Rings show Mastery %; drop "done" subtitle → "Last practiced"; wire real progress *(PR1 #6, PR2 #7)* — backend `lastPracticedAt` (BE-1) pending, FE graceful
- [x] R2 — Persistent "Mark/Save" bookmark + Saved list *(PR7 #12)*
- [x] R3 — i18n infra + App language setting + Model Test in Finnish *(PR5 #10, PR7 #12)*
- [x] R4 — Progress tab: drop fake chips; per-category mastery counts; auto weak-areas *(PR4 #9)* — weak-areas await BE-2, FE graceful
- [x] R5 — Topic Practice per-subcategory Quiz mode *(PR6 #11)*
- [x] R6 — Dashboard hero: fresh-state start card + de-duplicated ring-only progress *(PR3 #8)*

### Status: all 7 FE PRs merged into `feat/next-changes` (each tsc-clean). Pending for backend dev: **BE-1** (`lastPracticedAt`), **BE-2** (`wrongCount`/`wrongQuestionIds`), **BE-3** (`/progress/problem-sets`). All FE degrades gracefully until they land. Deferred (optional): "Marked" section on the Result screen (R2.e); incremental i18n of remaining screens (R3.f).

---

## API / data audit findings (verified against the FE↔BE contract)

The frontend API surface (`src/lib/api.ts` base `https://api.taxipilot.fi`; modules `authApi`, `progressApi`, `quizApi`, `paymentApi`) was inventoried. Key results that change the scope:

- **`/progress` already returns `subcategories[].total` and `subcategories[].completed`** — the UI currently ignores them and only uses `percentage`. → **R1 list mastery % and R4.b per-category counts are FRONTEND-ONLY** (data already in the payload).
- **The quiz pipeline is fully built and topic sets are provisioned.** `quizApi.ts` exposes `POST /solution-sessions` (→ sessionId), `GET /problem-sets/{id}` (→ `{ _id, label, problems[] }`), `POST /solution-sessions/{id}/answers` (→ `{ status: 'correct'|'wrong' }`), `PATCH /solution-sessions/{id}` (status). `useStartQuiz.ts` already resolves a local key → `problemSetId`, and **all 31 topic lessons exist in `backendProblemSetIds.ts`**. Completing a session already updates `/progress`. → **R5 is FRONTEND-ONLY wiring.**
- **No bookmarks / language / preferences endpoints exist** — consistent with our FE-only designs for R2 (local store) and R3 (UI-only i18n).
- Useful unused bits noted for later (NOT in this plan): `BackendProblem.explanation` & `imageKey` are sent but never rendered; `GET /solution-sessions` (history) exists but is uncalled (could power a future "tests done"); category `sortOrder`/`parentCategoryId` unused.

### Backend changes required (the ONLY two — hand off to backend dev)

Both are additive fields on the **existing** `GET /progress` response — no new endpoints, no breaking changes. FE consumes them as **optional** and degrades gracefully until they ship (see "FE readiness" below).

**BE-1 — `lastPracticedAt`** (powers R1 "Last practiced", optional R4.d/R6)
- Add to each `mainCategory`-level `progress` object and each `subcategories[]` entry: `lastPracticedAt: number | null` (epoch ms) = `max(answers.updatedAt)` across that category's problems for the user; `null` if none.

```jsonc
// GET /progress — augmented item (added fields marked ★)
{
  "mainCategory": { "_id": "...", "name": "Official", "type": "..." },
  "progress": { "total": 480, "completed": 12, "percentage": 3, "lastPracticedAt": 1719580800000 /* ★ number|null */ },
  "subcategories": [
    {
      "category": { "_id": "...", "name": "Seatbelt & Child Safety" },
      "total": 44, "completed": 8, "percentage": 18,
      "lastPracticedAt": 1719580800000,   // ★ number|null
      "wrongCount": 6,                       // ★ see BE-2
      "wrongQuestionIds": ["Q017","Q006"]   // ★ see BE-2
    }
  ]
}
```

**BE-2 — `wrongCount` + `wrongQuestionIds`** (powers R4.c weak areas + "Practice these")
- Add to each `subcategories[]` entry:
  - `wrongCount: number` — count of that subcategory's problems the user has **attempted but never answered correctly** (the inverse of `completed`).
  - `wrongQuestionIds: string[]` — the corresponding problem IDs (so the FE can launch a focused "practice these" run; getting them right raises `completed`/`percentage` and they drop off automatically).
- Definition aligns with the existing `completed` logic (a problem is "done" once answered correctly at least once). "Wrong/weak" = attempted, no correct answer yet.

**BE-3 — per-problem-set progress** (powers R1 rings on the **TopicLessons** (29) and **VocabSets** (11) lists — see D8)
- Backend only has categories for `Official` + 4 sections + `Vocabulary` (verified in `migrations.ts`/`progress.ts`); there are no lesson/set categories, so `/progress` cannot break down to lesson/set rows.
- Each lesson/set already corresponds to a **backend problem set** (the FE has every id in `src/data/backendProblemSetIds.ts`).
- Add an endpoint returning progress **per problem set**, keyed by `problemSetId`:

```jsonc
// GET /progress/problem-sets  → map keyed by problemSetId
{
  "jh70g16y2mqs8e716ebzm6vw9s894j2r": {   // = topic/passenger_safety/.../seatbelt-child-safety
    "total": 44, "completed": 8, "percentage": 18,
    "lastPracticedAt": 1719580800000,   // number|null (optional, mirrors BE-1)
    "wrongCount": 6,                       // optional, mirrors BE-2 (enables per-lesson weak areas later)
    "wrongQuestionIds": ["Q017","Q006"]   // optional
  }
  // ... one entry per problem set the user has touched (omit or zero-fill untouched)
}
```
- Same computation `progress.ts` already does per category, but grouped by **problem set** instead. `total`/`completed`/`percentage` are the must-haves for R1 rings; the rest is optional.
- **FE readiness:** a dedicated graceful hook calls this; **404 (endpoint not built yet) → empty map → neutral rings**, no error surfaced, no logout (only 401 triggers logout, and only on known routes).

**Deferred — NOT requested in this plan:** Day streak, Accuracy %, Tests-done counts (would need new aggregation/streak logic), and any authored quiz content. The fake chips for these are being removed (R4.a), not wired.

### FE readiness (works before the backend lands)

The FE treats BE-1/BE-2 as **optional** fields:
- `lastPracticedAt` absent/null → render "Not started yet" (or hide the line). No errors.
- `wrongCount`/`wrongQuestionIds` absent → Weak Areas stays in its existing "No weak areas yet" state; "Practice these" hidden. No errors.
- All other R1/R4/R5/R6 work uses data/endpoints that already exist, so those PRs are fully functional on the current backend.

---

_Last updated: 2026-06-28 — R1–R6 scoped, all decisions locked, FE↔BE contract audited, backend handoff (BE-1/BE-2) + 7-PR plan defined. Pre-implementation; awaiting go-ahead._
