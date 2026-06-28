# Phase 2 — Finnish completion + Quiz/Practice UX

> Branch base: `feat/next-changes` (Phase 1 R1–R6 already merged there; see `next-changes-plan.md`).
> Status: **SPEC — decisions locked, ready to execute in a fresh thread.** No feature code written in the planning thread.
> Created: 2026-06-28

Phase 1 shipped an i18n *foundation* (tab labels + Model Test + a few keys). Manual verification in Finnish exposed two gaps this phase closes:
1. **Finnish is ~10% done** — selecting Suomi leaves almost all UI in English (~250–300 hardcoded strings).
2. **Quiz/Practice discoverability** — the per-subcategory "Quiz" button is visible but the "tap row = Practice" affordance is hidden, so users don't know Practice exists.

---

## Decisions (locked)

| # | Decision |
|---|----------|
| **D-A — Bilingual content: FLIP, don't drop** | For any data field that has **both** a `_fi` and `_en` variant (section name, category name, model-test title), show the **app-language variant as primary** and the **other language as the secondary/subtitle**. EN mode: `Passenger Help & Safety` · *Matkustajan apu…*; FI mode: `Matkustajan apu…` · *Passenger Help & Safety*. Keeps the bilingual value (the product's premise) while respecting the language choice. |
| **D-B — Two pills per subcategory: Quiz (primary) + Practice (secondary)** | Replace the single hidden affordance with **two explicit, labelled pills** on each lesson row: **Quiz** (filled/primary — `Tietovisa`) and **Practice** (outline/secondary — `Harjoittele`). Remove the whole-row tap-to-Practice and the trailing chevron so there's no hidden action. Rationale: the bug is the *hidden* Practice; both modes are genuinely distinct (learn-with-feedback vs scored test — the same split Vocab already uses). Quiz stays visually dominant per the "quiz-forward" preference; Practice is kept (dropping it would lose immediate-feedback learning). |
| **D-C — Translate ALL chrome** | Every user-facing "chrome" string (headings, buttons, labels, hints, empty states, section headers, `Alert` titles/bodies) goes through i18n with full en+fi. This completes R3 across the app, not just the scaffold. |
| **D-D — Never translate true content** | Questions, answer options, vocabulary words, clue words, explanations, lesson names (English-only in data), and category descriptions stay as authored. Questions remain **Finnish-primary always** (it's the exam language) with the existing "Simple Meaning" English toggle unchanged — the D-A flip applies only to navigational **titles/labels**, never to question bodies. |
| **D-E — Finnish wording owned by the executor, guided by a glossary** | A glossary (below) fixes the recurring terms so translations are consistent. Core in-app screens get seed Finnish here; auth/onboarding/pricing/referral get translated in Phase 2b using the glossary. |
| **D-F — One learn/quiz layout app-wide (the Clue pattern)** | **`ClueWordsScreen` already implements the exact inline card we want** (icon + title + meta row + an actions row with an **outline learn button + filled Quiz button**). Adopt it as the canonical pattern for **Topic, Vocab, and Clue**. Topic's D-B converges on it. **Vocabulary is the outlier** (uses a separate `VocabSetDetail` screen) → convert it to the inline card and **remove `VocabSetDetail`**. Standardising on proven, shipped code = low risk. |

### Flagged (not a Phase-2 requirement, decide separately)
- **ProfileScreen fake stat row** (`Complete / Accuracy / Day streak`, ~L197–200) is still hardcoded `0` — same class of fake data we removed from the Progress tab. Options: remove it, or wire `Complete` to real `completion` and drop Accuracy/Day-streak (untracked). **Out of scope here; listed so it isn't mistaken for missing translation.**
- A few **lesson names are English-only** in the content (`TopicLesson.name` has no `_fi`). They'll stay English even in FI mode — a *content gap*, not a translation bug. Fixing needs Finnish lesson names authored in `content/` + rebuild.
- Hardcoded Finnish label `KYSYMYS` (Practice/TopicQuiz) becomes a key: en `QUESTION`, fi `KYSYMYS`.

---

## i18n architecture

Extend the existing `src/i18n` setup (i18next + react-i18next, already initialised, default `en`, persisted). Single `translation` namespace, nested keys by area:

```
common.*     next back previous done cancel finish save retry continue loading
nav.*        (done)
auth.*       welcome / login / signup / verify / forgot / reset
pricing.*    plans, durations, CTAs
referral.*
dashboard.*  greeting, hero, sectionHeaders, hubTiles
progress.*   (extend) headings, vocab, weakAreas
profile.*    (extend) sections, rows, examDate modal, alerts
topic.*      sections + lessons headers, "N questions", buttons (practice/quiz)
quiz.*       (done) + add practice/lesson button labels, KYSYMYS
modelTest.*  (done) + testHome.*, result.*
vocab.*      list, detail, lesson, quiz
clue.*       words, lesson, quiz
guide.*  howto.*  studyHome.*
components.* paywall, guestOverlay, authPrompt, badge (FREE/PAID/LOCKED)
```

### Bilingual-field helper (D-A)
New `src/i18n/content.ts`:
```ts
// Returns { primary, secondary } for a field that has both languages.
export function localizedPair(fi: string, en: string, lang: string) {
  return lang === 'fi'
    ? { primary: fi, secondary: en }
    : { primary: en, secondary: fi };
}
```
Apply at every render site of a `_fi/_en` title (see "Bilingual sites" below). Drive `lang` from `i18n.language` via `useTranslation()`.

---

## Bilingual content sites (apply D-A flip)

| Field | Where rendered |
|---|---|
| `TopicSection.name_fi/name_en` | DashboardScreen hero tiles; TopicSectionsScreen rows; TopicLessonsScreen header |
| `Category.name_fi/name_en` | DashboardScreen, ProgressScreen "BY OFFICIAL CATEGORY", TopicSections |
| `ModelTest.title_fi/title_en` | TestHomeScreen cards; ModelTestScreen header |

Leave as-is (content): `TopicLesson.name` (en-only), `TopicSection.description`, `Question.question.fi/en` (Finnish-primary + Simple Meaning toggle), all options/vocab/clue text.

---

## Canonical learn/quiz layout (D-B + D-F)

**Reference = `ClueWordsScreen.tsx` (L78–118).** Each unit is a bordered card:
```
[icon]  Title
        blurb / subtitle
        meta: "N words/questions"        progress tag / ring
        [ ◻ Learn-mode (outline) ]  [ ■ Quiz (filled) ]   ← actions row
```
The Quiz button renders only when authenticated (matches Clue). Apply this exact structure to all three modules:

**Topic — `TopicLessonsScreen.tsx`**
- Replace the single hidden-affordance row with the actions row:
  - **Practice** — outline, `t('topic.practice')` (`Harjoittele`) → existing `startLesson(lesson.question_ids, lesson.name)`.
  - **Quiz** — filled/primary, `t('quiz.title')` (`Tietovisa`) → existing `useStartQuiz(... 'TopicQuiz' ...)`.
- Remove whole-row `onPress` + trailing `ChevronRight`. Keep mastery ring + "Last practiced/…".
- Topic learn-mode is **Practice** (question drilling), not "Lesson" (that's Vocab's word-card mode).

**Vocab — `VocabSetsScreen.tsx` (convert; remove `VocabSetDetailScreen`)**
- Each set row becomes the canonical card with:
  - **Lesson** — outline, → `navigation.navigate('VocabLesson', { setId, index: 1 })`.
  - **Quiz** — filled, → `startQuiz('vocab/sets/'+set.id, 'VocabQuiz', { setId })`.
- Delete the `VocabSetDetail` route from `StudyStackParamList` + `StudyStack`, and the screen file. The detail screen's "tip" already exists on the VocabSets header; the category colour is on the ring. `VocabLesson` + `VocabQuiz` routes stay (reached directly from the buttons).

**Clue — `ClueWordsScreen.tsx`** — already canonical; only i18n the labels (`Lesson`→`t('vocab.lesson')`/glossary, `Quiz`→`t('quiz.title')`).

Result: identical card + two-button interaction across Topic, Vocab, Clue.

---

## String inventory (counts; full per-line lists captured in the planning thread sweep)

Translate **chrome** only. Priorities by user visibility for a paid learner.

**Phase 2a — in-app (highest priority, daily driver):**
| Screen | ~chrome strings | Finnish seed below? |
|---|---|---|
| DashboardScreen | 23 | ✅ |
| ProgressScreen | 12 | ✅ |
| ProfileScreen (+ examDate modal, alerts) | ~30 | partial |
| TopicSections / TopicLessons | ~10 | ✅ |
| PracticeScreen | 9 | ✅ |
| ResultScreen | ~16 | partial |
| TestHomeScreen | 7 | ✅ |
| ModelTestScreen | (mostly done) testHome/result remainder | — |
| VocabSets/Detail/Lesson/Quiz | ~37 | glossary |
| ClueWords/Lesson/Quiz | ~30 | glossary |
| GuideScreen / HowToScreen / StudyHomeScreen | ~30 | glossary |
| Components (Paywall, GuestOverlay, AuthPrompt, Badge) | ~13 | ✅ |

**Phase 2b — auth / onboarding / monetisation (translate with glossary):**
Welcome (14), Onboarding (11), Login (9), Signup (12), VerifyEmail (11), Forgot/Reset (18), Pricing (28), PaymentSuccess/Cancel (10), Referral (18). Validation/error messages (`*is required*`, API errors) = chrome too; translate. ~140 strings.

> Exact line numbers per string are in the sweep output; the executor re-greps each file (literals haven't moved) and replaces inline with `t('…')`.

---

## Finnish glossary (use consistently)

| English | Finnish |
|---|---|
| Practice (verb/mode) | Harjoittele / Harjoitus |
| Quiz | Tietovisa |
| Lesson | Oppitunti |
| Question(s) | Kysymys / Kysymykset |
| Answer | Vastaus |
| Correct / Wrong | Oikein / Väärin |
| Mastered | Hallittu |
| Last practiced | Viimeksi harjoiteltu |
| Overall completion | Kokonaisedistyminen |
| Progress | Edistyminen |
| Weak areas | Heikot alueet |
| Vocabulary | Sanasto |
| Clue words | Vihjesanat |
| Model test | Mallikoe |
| Pass mark | Läpäisyraja |
| You passed! / Keep studying | Läpäisit! / Jatka opiskelua |
| Review | Kertaa |
| Next / Previous / Finish | Seuraava / Edellinen / Valmis |
| Log in / Sign up / Log out | Kirjaudu / Rekisteröidy / Kirjaudu ulos |
| Create free account | Luo ilmainen tili |
| Exam | Koe / tutkinto |
| Subscription | Tilaus |

### Seed translations — core screens (examples; executor extends)
```
dashboard.greeting        Good morning            → Huomenta
dashboard.tagline         Keep going — exam day…  → Jatka samaan malliin — koepäivä lähestyy!
dashboard.readyToStart    Ready to start?         → Valmiina aloittamaan?
dashboard.readyToStartSub Pick a topic below…     → Valitse aihe alta aloittaaksesi.
dashboard.overall         Overall progress        → Kokonaisedistyminen
dashboard.topicPractice   Topic Practice          → Aiheharjoittelu
dashboard.topicSub        The core exam curriculum… → Tutkinnon ydinsisältö — harjoittele aiheittain
common.questionsCount     {{n}} questions         → {{n}} kysymystä
progress.title            My Progress             → Oma edistyminen
progress.overallCompletion Overall completion     → Kokonaisedistyminen
progress.byCategory       BY OFFICIAL CATEGORY    → VIRALLISEN KATEGORIAN MUKAAN
progress.mastered         {{c}}/{{t}} mastered    → {{c}}/{{t}} hallittu
progress.vocabulary       VOCABULARY              → SANASTO
progress.weakAreas        WEAK AREAS — NEEDS ATTENTION → HEIKOT ALUEET — VAATII HUOMIOTA
progress.noWeakAreas      No weak areas yet…      → Ei heikkoja alueita vielä. Jatka harjoittelua.
topic.practice            Practice                → Harjoittele
topic.title               Topic Practice          → Aiheharjoittelu
```

---

## Execution checklist (for the new thread)

**Setup**
- [ ] Branch `feat/i18n-completion` off `feat/next-changes`.
- [ ] Add `src/i18n/content.ts` (`localizedPair`); extend `en.json`/`fi.json` with all namespaces above.

**D-A flip**
- [ ] Apply `localizedPair` at the 3 bilingual sites (section, category, model-test titles).

**D-B + D-F canonical layout (the Clue pattern, app-wide)**
- [ ] TopicLessons: actions row — Practice (outline) + Quiz (filled); remove hidden row-tap + chevron.
- [ ] VocabSets: convert rows to the canonical card with Lesson + Quiz buttons; **remove `VocabSetDetail`** (route + stack entry + file); keep VocabLesson/VocabQuiz.
- [ ] Clue: already canonical — just i18n the button labels.
- [ ] Confirm the three modules render an identical card + two-button layout.

**D-C translate (Phase 2a then 2b)**
- [ ] In-app screens → keys (Dashboard, Progress, Profile, Topic*, Practice, Result, TestHome, ModelTest remainder, Vocab*, Clue*, Guide, HowTo, StudyHome).
- [ ] Components (Paywall, GuestOverlay, AuthPrompt, Badge, `KYSYMYS`).
- [ ] Auth/onboarding/pricing/referral + validation & `Alert` strings.

**Verify**
- [ ] `npx tsc --noEmit` clean.
- [ ] Run app, toggle Suomi, walk every screen: no stray English chrome; titles flip correctly; questions stay Finnish; two pills work.
- [ ] PR `feat/i18n-completion → feat/next-changes`; merge; final `feat/next-changes → master` when whole batch approved.

---

## Out of scope (explicit)
- ProfileScreen fake stat row (flagged above) — separate decision.
- Authoring Finnish **lesson names** (content gap) — needs `content/` work + rebuild.
- Translating question/answer/vocab **content** — never (D-D).

_Last updated: 2026-06-28 — spec authored; execution to run in a fresh thread._
