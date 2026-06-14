# Frontend ↔ Backend Integration — Handover

Connect the Expo app (`taxiapp`, web on Vercel) to the API (`taxiapp-server`, NestJS + Convex).
This is the **contract + sequence**, not a detailed spec. Stripe is the last phase.

---

## 1. Where each side is today

**Frontend** — works fully **offline**. All progress in local AsyncStorage. No login, no API calls.
Paid features (Clue Words, Topic Practice, Model Tests) are flagged but **not gated** — the
`isFeatureUnlocked()` stub always returns `true`.

**Backend** — auth is **already built**: register / login / refresh / forgot+reset password / `GET /auth/me`
(JWT). Convex has a `users` table only. **No progress storage and no payments yet.**

So the gap is: wire the app to auth, sync progress to the server, add a real "premium" flag, then Stripe.

---

## 2. The contract — what the UI needs from the API

### Auth (exists ✅)
| Method | Endpoint | Returns |
|---|---|---|
| POST | `/auth/register` | `accessToken`, `refreshToken` |
| POST | `/auth/login` | `accessToken`, `refreshToken` |
| POST | `/auth/refresh` | new tokens |
| GET  | `/auth/me` | user — **extend to include `isPremium`** |

### Progress sync (new)
| Method | Endpoint | Body / Returns |
|---|---|---|
| GET | `/me/progress` | `{ questions: [...], testScores: [...] }` |
| PUT | `/me/progress` | upsert the user's progress (used for the one-time local→server merge on first login, and ongoing saves) |

### Billing (new — Phase 4, Stripe)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/billing/checkout` | create a Stripe Checkout session, return its URL |
| POST | `/webhooks/stripe` | Stripe calls this → flip `isPremium` in DB (the real unlock) |

---

## 3. Data the backend stores (Convex schema additions)

```
users:        + stripeCustomerId, + subscriptionStatus, + isPremium   (extend existing table)

progress:     userId, questionId, correct, seenAt            (index by userId)
testScores:   userId, testId, score, total, timeTakenSeconds,
              wrongQuestionIds, completedAt                   (index by userId)
```

Shapes match what the app already tracks locally (see `src/data/types.ts` → `QuestionProgress`, `TestScore`).

---

## 4. Sequence (each phase is shippable on its own)

- **Phase 0 — Agree this contract.** Lock endpoint names + field shapes. ← we are here
- **Phase 1 — Auth wiring (FE).** Login/Register screens, token storage, API client, hit `/auth/me`.
  Backend endpoints already exist, so this is frontend-only.
- **Phase 2 — Progress sync.** BE adds `progress`/`testScores` tables + `GET/PUT /me/progress`.
  FE: on first login, push local progress once (merge), then read/write through the API.
- **Phase 3 — Entitlement gate.** `isPremium` on `/auth/me`; replace the `isFeatureUnlocked()` stub
  with a real check; gate the three paid screens.
- **Phase 4 — Stripe.** Add the two billing endpoints + a simple upgrade button. Unlock driven by the webhook.

UI is fully functional after Phase 3. Phase 4 only turns the gate into a paid one.

---

## 5. Before we can actually charge money (check these early)

- **Web vs native.** Stripe is fine for the **web** app. If we ship to the **App Store / Google Play**,
  digital subscriptions must use Apple/Google in-app purchase (that's what RevenueCat is for) — Stripe
  isn't allowed there. **Decide this first**, it changes Phase 4.
- **Stripe account** verified + bank account for payouts.
- **Pricing decided** — subscription vs one-time, amount, currency (EUR), any free-trial / referral days.
- **EU VAT on digital goods** — needs handling (Stripe Tax, or a merchant-of-record like Paddle/RevenueCat).
  Relevant since customers are in Finland/EU.
- **Legal pages** — Terms, Privacy Policy, Refund policy (Stripe requires these; the app needs them too).
- **Transactional email** — `forgot-password` returns a token but **no email is sent yet**; password reset
  needs an email provider (e.g. Resend/Postmark).
- **Referral** — currently UI-only (hardcoded "2 friends joined"). If it grants free days, it needs
  server-side tracking. Decide whether it's in v1.
- **GDPR basics** — account deletion + data export, since we'll store email + accounts.

---

## 6. Open questions for the backend devs

1. Confirm `taxiapp-server` is the backend for this app, and its deployed base URL (dev + prod).
2. OK to extend `/auth/me` with `isPremium`, or prefer a separate `/me/entitlement`?
3. Token lifetimes + where the app should store the refresh token (we'll use secure storage).
4. Is the password-reset email sender planned, or does the FE handle the token UX for now?
