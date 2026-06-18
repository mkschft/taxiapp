# Backend Guide — Taxi Exam Prep App

One document for the backend developer: **why the app exists and how users use it**, then the **concrete data model, logic, and API** to build against. The app is fully functional and **local-first** today; the backend's job is to make each user's profile and progress **durable and portable across devices**, and to run referrals. It does **not** need to serve the learning content (that stays bundled in the app).

> **The frontend is the spec.** The data model below maps 1:1 to `src/store/types.ts`, and the state transitions map to `src/store/progressStore.tsx`. When in doubt, those files win.

---

# Part 1 — Product context (the "why")

## Who the user is
Someone preparing to pass **Finland's official taxi driver exam**. Critically, **most are not native Finnish speakers** — they can drive, but the exam is in Finnish and the language is the real barrier. That one fact explains nearly every design choice: everything is shown in **Finnish + English side by side**, and much of the app teaches the *language of the exam*, not just the rules. Users study in short phone sessions, often with a real exam date looming. The app's job: make studying efficient, build confidence, and remove exam-day surprises.

## A layered learning journey, not a quiz bank
The content is deliberately staged — *understand the words → learn exam strategy → practise by topic → simulate the real exam*. Four modes, four jobs:

1. **Vocabulary** — "understand the words first." Small numbered sets of the Finnish words/phrases that appear in exam questions, each with English meaning, related forms, and how it's used in the exam. The foundation.
2. **Clue Words** — "read a question strategically." The app's secret weapon: Finnish questions contain **clue words** that reliably signal right vs. wrong answers (**positive** clues point toward the correct answer; **negative** clues point away), taught with their exceptions. This is exam *technique* — a user can often reason out an unseen question.
3. **Topic Practice** — "drill one exam section at a time." Mirrors the official exam sections (passenger safety, special-needs passengers, customer service, traffic safety), each with the **real pass threshold** (e.g. 12 correct of 15).
4. **Model Tests** — "simulate the real exam." A fixed ~50-question set, a **countdown timer**, and a real **pass mark (75%)**.

## The key distinction: Practice vs. Exam behaviour
This is the most important strategic point, because it determines what a "result" means.

- **Study modes (Vocab, Clue, Topic Practice) — the app is a *teacher*.** Answers reveal immediately, with explanations and a "clue lens" that highlights hint words. Learning from a wrong answer is the point.
- **Model Tests — the app is an *examiner*.** **Answers stay hidden until the whole test is submitted.** Forward-only navigation, under a timer; only after submitting does the user see their score and a review of the questions they missed.

So the same question behaves differently by mode. For the backend, **a practice answer and a graded test attempt are conceptually different events** — one is learning, one is a score.

## What "progress" means (and why it's the product)
Progress data isn't bookkeeping — it's the emotional core:
- **Completion & accuracy** — sense of readiness.
- **Day streak** — rewards a daily habit; the intended behaviour.
- **Wrong-answer review** — revisit exactly the questions missed (in Finnish, correct answer shown). The highest-value learning loop.
- **Exam-date countdown** — turns "someday" into "11 days left"; drives daily use.

Losing progress (or a streak) is demoralising and the #1 reason study apps get abandoned. **Never lose it; carry it across devices.**

## Profile & referrals
Personalisation is intentionally light: **name**, **exam date** (drives the countdown), **interface language** (FI/EN). Referrals let a user share a personal code with friends sitting the same exam, with a mutual reward — strategic because this is a tight, word-of-mouth community. For v1, just record "who invited whom"; reward economics come later.

---

# Part 2 — Data model

There are two halves. **Only the user-state half needs a backend.**

## A. Content schema (read-only, stays bundled — reference only)
The backend never stores this; it only stores **references to these stable string IDs** (`Q001`, `set-1`, `mt1`, …). Shapes are listed so you understand what an ID points to.

```ts
ExamCategory {
  id            // "passenger_safety" | "special_needs" | "customer_service" | "traffic_safety"
  name_fi, name_en, icon, color
}

Question {
  id                              // "Q001"
  category_id                     // → ExamCategory.id
  question: { fi, en }            // bilingual question text
  options: [ { key:'A'|'B'|'C', fi, en, is_correct } ]
  correct_option: 'A'|'B'|'C'
  clue_annotations: [ { text_fi, meaning_en, clue_type:'fw'|'pcw'|'ncw', found_in[] } ]
  explanation_en, difficulty, tags[]
}

VocabSet    { id:"set-1", name, category_id, order, word_count, question_count }
VocabWord   { id:"set-1-w1", set_id, word_fi, meaning_en, forms_fi[], exam_use_en }
VocabQuiz   { id:"set-1-q1", set_id, prompt_word_fi, options[], correct_option, lesson_word_id }

ClueGroup   { id:"positive"|"negative", label, tone, blurb, order }
ClueWord    { id:"clue-positive-w1", group_id, phrase_fi, meaning_en, effect_en, exception_en }
ClueQuiz    { id:"clue-positive-q1", group_id, direction, prompt, options[], correct_option }

TopicSection { id (==category_id), name_fi, name_en, pass_correct, pass_total, order }   // e.g. 12 / 15
TopicLesson  { id, section_id, name, order, question_ids[] }                              // → Question.id[]

ModelTest    { id:"mt1", title_fi, title_en, question_ids[], time_minutes, pass_mark }    // ~50 ids, 75%
```

Rough scale: 4 categories, ~327 main questions (+ test-only questions), 11 vocab sets (~165 words / ~220 quiz Qs), 2 clue groups (~55 words), 4 topic sections (~29 lessons), several model tests.

## B. User-state schema (this is what the backend owns)
Maps 1:1 to `src/store/types.ts` (`StorageSchema`). This is the single source of truth the backend mirrors:

```ts
UserProfile     { name, exam_date, language_pref:'fi'|'en', referral_code, referred_by }
QuestionRecord  { answered, correct, attempts, last_seen }     // keyed by question_id
VocabRecord     { seen, learned, last_seen }                   // keyed by vocab_word_id
QuizScore       { quiz_id, score, completed_at, wrong_question_ids[] }
ModelTestScore  { test_id, score, time_taken_seconds, passed, completed_at, wrong_question_ids[] }
streak: number
last_active_date: string   // ISO date
```

Suggested tables (each user owns many):

| Table | Columns | Write pattern |
|---|---|---|
| `users` | id (pk), email, password_hash, name, exam_date, language_pref, **referral_code (unique)**, referred_by, streak, last_active_date, created_at | one per user |
| `question_records` | user_id, question_id, answered, correct, attempts, last_seen — **PK (user_id, question_id)** | **upsert** |
| `vocab_records` | user_id, vocab_word_id, seen, learned, last_seen — **PK (user_id, vocab_word_id)** | **upsert** |
| `quiz_scores` | id, user_id, quiz_id, score, completed_at, wrong_question_ids (json) | **append** |
| `test_scores` | id, user_id, test_id, score, time_taken_seconds, passed, completed_at, wrong_question_ids (json) | **append** |
| `referrals` | id, referrer_user_id, referred_user_id, created_at | one per redemption |

Why the split: `*_records` track *current mastery* of an item, so re-answering **overwrites** (composite key + upsert). `*_scores` are the **append-only history** of graded attempts — this is exactly the "practice vs. exam" distinction from Part 1 made concrete.

`wrong_question_ids` powers the wrong-answer review loop — store it as JSON; no separate table needed.

---

# Part 3 — Logic the backend must mirror

The frontend reducer already defines every transition; endpoints just need to reproduce the effect:

- **Answer a question** → upsert `question_records`: `answered=true`, set `correct`, `last_seen=now`, `attempts += 1`. (`ANSWER_QUESTION`)
- **See / learn a vocab word** → upsert `vocab_records` (`seen` / `learned`). (`MARK_VOCAB_SEEN` / `MARK_VOCAB_LEARNED`)
- **Finish a vocab/clue quiz** → append a `quiz_scores` row. (`SAVE_QUIZ_SCORE`)
- **Finish a model test** → append a `test_scores` row; `passed = score >= test.pass_mark`. (`SAVE_TEST_SCORE`)
- **Streak** → on activity: if `last_active_date` was yesterday → `streak += 1`; if today → no-op; otherwise reset to 1. Update `last_active_date`.
- **Profile** → plain update of `name` / `exam_date` / `language_pref`.

**Derived stats (completion %, accuracy %) are computed by the frontend** from the records above — the backend does not store them.

---

# Part 4 — API surface (v1)

```
POST   /auth/register      → create user, generate referral_code, accept optional referred_by
POST   /auth/login         → return token
GET    /me                 → profile + full progress snapshot (used to hydrate on login)
PATCH  /me                 → update name / exam_date / language_pref
PUT    /me/progress        → bulk upsert: question_records, vocab_records, streak (idempotent sync)
POST   /me/quiz-scores     → append one QuizScore
POST   /me/test-scores     → append one ModelTestScore
DELETE /me/progress        → wipe progress (mirrors the app's "Clear progress data")
```

**Sync strategy — keep it simple, stay local-first.** The app remains usable offline. It pushes a full progress snapshot on quiz/test completion and on app-background (`PUT /me/progress`), and pulls once on login (`GET /me`). **Last-write-wins per record** using `last_seen`. No websockets, no real-time.

## Referral logic
- Generate a unique `referral_code` at registration (e.g. `TAXI` + 4 chars).
- A new user may submit a friend's code as `referred_by` → write a `referrals` row linking both users.
- The reward (free days, etc.) is a business rule — record the link now, wire it to a subscription system later. Don't over-build in v1.

---

# Part 5 — Build order (a long-running effort — plan ahead)

1. **Accounts** — `users` + `/auth/register`, `/auth/login`, `GET/PATCH /me` (profile only). Frontend gains login; profile syncs.
2. **Progress sync** — `question_records`, `vocab_records`, `quiz_scores`, `test_scores` + `PUT /me/progress` and the score endpoints. Frontend hydrates from `GET /me` on login, pushes on completion/background.
3. **Referrals** — `referrals` table + code redemption.
4. **Later / optional** — serve content (questions/vocab/clues) from the API so the question bank can update without an app release; add subscriptions/paywall and wire referral rewards.

**Stack:** a boring, well-supported choice (e.g. Node/Express or FastAPI + Postgres + JWT). The dataset is small and relational — Postgres is plenty. Avoid premature complexity (no microservices, no queues).

---

### TL;DR
The app teaches non-Finnish-speakers to pass the Finnish taxi exam through staged study modes, and treats the user's progress as the product. The backend's mission, in user terms: **never lose my progress, carry it across devices, tell studying apart from testing, remember what I got wrong, keep my streak/exam-date/language honest, and connect me to friends I refer.** Build accounts → progress sync → referrals, mirroring `src/store/types.ts` and `src/store/progressStore.tsx`. Content stays bundled.
