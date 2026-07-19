# Real pricing & subscriptions — backend ticket

> Status: frontend done, backend not started.
> Created: 2026-07-19.

## Context

Pricing so far has been a draft/prototype (a paywall that was actually disabled in the app, and 3 subscription tiers that were all identical "full access," just different durations/prices). We're now moving to the **real, permanent pricing model**. This ticket is what's left to make it actually work end to end, including real money moving through Stripe.

The frontend (mobile app) has already been rebuilt for the new model and is live in the codebase. This ticket is entirely about the backend catching up to it.

## The 4 tiers (the actual product logic)

1. **Free** — included the moment someone signs up, no time limit. Gets: **1 topic in each of the 4 exam modules** (not all topics — just one per module, so people get a taste of every category) + **all of Vocabulary and Clue Words** (those two are fully free for everyone, always).
2. **Day Pass — €5** — **2 mock exams** + full Vocabulary/Clue Words. Expires after **1 day**. This is a narrow "test your readiness" product, not a cheap version of everything — it does *not* include extra module practice beyond the 1 free topic.
3. **Week Pass — €50** — full access to everything (all modules, all topics, all 5 mock exams). Expires after **7 days**.
4. **Two-Week Pass — €100** — same full access as the Week Pass, just **14 days** instead of 7.

Someone can buy a bigger plan while a smaller one is still running (e.g. bought the Day Pass this morning, wants the Week Pass this afternoon) — that should be allowed, not blocked.

## What already exists on the backend (don't rebuild this)

- Plans live in a database table (`plans` — see `taxiapp-server/convex/plans.ts`) with a Stripe price ID, price, and how many days it lasts. Checkout goes through Stripe (`payment.service.ts`) and a webhook activates the subscription when payment completes.
- There's already a full session/answers system (`solution-sessions`) that mock exams use — no need to touch that.

## What's missing / needs building

### 1. Stripe products & prices
The old plan rows point at empty/placeholder Stripe price IDs. Someone with Stripe dashboard access needs to create 3 real prices (Day Pass €5, Week Pass €50, Two-Week Pass €100) and wire the IDs into the `plans` table. **Flagging this early because it's the one item that needs a human with Stripe account access, not just code.**

### 2. New plan data
Replace the current 3 plan rows (`3_day` €40, `7_day` €70, `14_day` €120 — all identical "full access") with:
- `free_preview` — already exists, just needs its *meaning* updated (see tier 1 above).
- `1_day` — new, €5, 1 day.
- `7_day` — keep the key, change price to €50 (still 7 days).
- `14_day` — keep the key, change price to €100 (still 14 days).
- Drop `3_day` — no longer offered.

The frontend already sends/expects exactly these plan-type strings (`free_preview`, `1_day`, `7_day`, `14_day`), so please keep them as-is rather than renaming.

### 3. Actual feature-level entitlement (the real gap)
Today, "has a paid plan" is the only check that exists anywhere — it's all-or-nothing. Now we need three different entitlement shapes:
- **Free**: 1 specific topic per module unlocked, rest locked.
- **Day Pass**: 2 specific mock exams unlocked, no extra module topics.
- **Week/Two-Week Pass**: everything unlocked.

The frontend currently enforces this on its own (it knows which topic/lesson is the "free" one per module, and which 2 mock exams the Day Pass unlocks) — but that's just UI-level gating, not real protection. If someone bypasses the app and calls the API directly, nothing stops them from pulling paid content today. Whoever picks this up should decide whether/how to enforce this server-side (probably in the same places that already check `planType === 'free_preview'` today, e.g. `quiz.service.ts`), and should coordinate with whoever owns the frontend on **which exact topic/mock-exam IDs count as "free"/"day pass"** so both sides agree (frontend currently hardcodes: first topic in each module, and mock exams `mt1`+`mt2` for the Day Pass — happy to change either if backend wants different ones).

### 4. Allow buying a bigger plan while a smaller one is active
Right now the backend rejects any checkout attempt if the user already has *any* active paid plan (`payment.service.ts`, `createCheckoutSession` — throws a conflict). That needs to change to only block re-buying the exact same plan, not a different (bigger) one.

### 5. Expiry behavior
Already works today (a plan's access just stops when `expiresAt` passes) — no change needed here, just confirming it should carry over as-is.

## Suggested order

1. Get Stripe prices created (the one item needing dashboard access — start this first since it can happen in parallel with everything else).
2. Update the `plans` table to the new 4 rows.
3. Relax the "already has a plan" checkout block to allow upgrades.
4. Decide + implement real server-side entitlement checks (topic-level, mock-exam-level) instead of the current all-or-nothing check.

Items 1–3 are small and mechanical. Item 4 is the real design/implementation work — the AI or engineer picking this up should read `quiz.service.ts` and `solution-sessions.controller.ts` to see how today's binary free/paid check is wired in, then extend that same pattern rather than building something new.
