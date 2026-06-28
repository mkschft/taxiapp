# TaxiPilot — Project Overview (Claude working notes)

> Local-only, gitignored. Snapshot date: **2026-06-27**. Maintained by Claude as the
> holistic map of the project before final launch changes.

## Product

Finnish taxi-driver exam prep app ("TaxiPilot", domain **taxipilot.fi**). Content is
bundled/local-first (questions, vocabulary, clue words, exam guide, 5 model tests);
the backend owns durable user state (profile, progress, quiz/test scores, referrals,
auth).

## Repository layout (under `~/Developer/taxi-app/`)

| Folder | GitHub repo | Role | Status |
| --- | --- | --- | --- |
| `mkschft-taxiapp/taxiapp` | `mkschft/taxiapp` | **Active frontend** (Expo / RN, iOS+Android+web) | Current. HEAD `90e826f` |
| `taxiapp` | `mkschft/taxiapp` | OLD frontend clone | **Obsolete — deleted 2026-06-27.** Strict ancestor of the active one |
| `taxiapp-server` | `mkschft/taxiapp-server` | **Backend** (NestJS + Convex) | Current. HEAD `e445c26` on `main` |
| `site` | `mkschft/taxipilot-web` | Marketing/landing + guide site | Separate deploy |

The backend is also wired into the frontend as a **git submodule** at
`backend/convex` (url `mkschft/taxiapp-server`), pinned to `e445c26`.

### Why the old `taxiapp` was redundant
Verified: old HEAD `152a6d3` is a **direct linear ancestor** of active HEAD `90e826f`
(active = old + 20 commits, no divergence). Content/question data identical except the
added `src/data/backendProblemSetIds.ts`. Only unique artifacts in the old folder were
two gitignored audit docs, now preserved into the active repo (see below).

## Frontend (Expo / React Native)

- Targets iOS, Android, web. Expo SDK 56. `App.tsx` deep-linking; tabs: Study / Test /
  Progress / Profile.
- Auth state: `src/store/authStore.tsx` (Context + useState). Paywall:
  `src/store/paywallStore.tsx`. Local `progressStore` was **removed** — progress is now
  backend-persisted.
- API client: `src/lib/api.ts` → **`BASE_URL = https://api.taxipilot.fi`**. Access/refresh
  tokens in storage (`@taxi/accessToken`, `@taxi/refreshToken`), auto-refresh + 401 handler.
- Backend-wired modules: `authApi`, `quizApi`, `progressApi`, `jwt`, `access.ts`,
  `useProgress`, `useStartQuiz`, `backendProblemSetIds.ts`.

### What the last 20 frontend commits added (over the old clone)
- **Auth + onboarding flow**: Welcome → onboarding → guest gating; `RequireAuth` /
  `GuestGate` / `AuthPrompt` replaced the old `AuthGate`.
- **Email verification + password reset** screens (`VerifyEmailScreen`,
  `ForgotPasswordScreen`, `ResetPasswordScreen`); login allowed pre-verification with
  auto-verify from email links.
- **Backend wiring** of quizzes, model tests, and progress to real problem sets
  (`quiz_problem_sets.csv`, `scripts/seed_quizzes.py`).
- Login required for Study/Test/Progress/Profile tabs.
- Several auth navigation race/loading-spinner fixes.

## Backend (`taxiapp-server`: NestJS 11 + Convex)

- JWT auth (register/login/refresh/forgot/reset), Convex client module, Swagger at `/api`,
  Jest unit + e2e (60% coverage threshold).
- Email via **Resend** (`RESEND_API_KEY`, `FROM_EMAIL`); gracefully skips when unconfigured.
- Env: `CONVEX_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`,
  `FRONTEND_URL=https://taxipilot.fi`, `PORT`. CORS allows `taxipilot.fi`.
- CI deploy: `.github/workflows/deploy.yml`. PM2 `ecosystem.config.js`, infra templates in `infra/`.

### Major backend work since `cb9cbea` (latest pull → `e445c26`, ~5.2k LOC)
- **Quiz system**: `convex/` + `src/quiz/` — categories, problem sets, problems,
  problem translations (FI/EN), Clue Lens, answers, solution sessions, progress; full
  controllers + DTOs + specs.
- **Auth hardening**: admin role + `admin.guard`, `verified-user.guard`, email
  verification + password reset via Resend, `expectedExamDate` profile field + PATCH,
  return `user` object in login/register responses (frontend relies on this — no extra
  `/auth/me` round-trip).
- Migrations incl. backfill of problem-set categories.

### Key API endpoints (v1)
`POST /auth/{register,login,refresh,forgot-password,reset-password}`,
`GET|PATCH /me`, `PUT|DELETE /me/progress`, `POST /me/{quiz-scores,test-scores}`,
plus quiz/category/problem/solution-session controllers under `src/quiz/`.

## Launch-relevant open items
- **`EXAM_ACCURACY_AUDIT.md`** (preserved here, gitignored): flags **6 critical/high
  factual errors** in the Exam Guide (pass mark, time limit, fee, provider, licence
  prerequisites). Verdict was "NOT launch-ready" until fixed — **verify these are fixed
  before launch.**
- **`MTQ_CATEGORY_REVIEW.md`** (preserved here, gitignored): practice questions whose
  official-topic categorization needs a human eye.
- `src/lib/constants.ts` still has placeholder `CDN_BASE_URL = https://cdn.example.com`
  — confirm whether a real CDN is needed.

## Conventions
See `AGENTS.md` (frontend) and `taxiapp-server/AGENTS.md` (backend). No frontend test/lint
runner; backend has Jest + eslint + prettier. Use theme tokens, single quotes, function
components, `SafeAreaView` roots.
