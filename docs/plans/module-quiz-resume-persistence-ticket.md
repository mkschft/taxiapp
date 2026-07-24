# Ticket: real cross-device quiz resume (backend)

> Status: proposed, not started.
> Created: 2026-07-19.
> Related: [`module-quiz-consolidation-plan.md`](./module-quiz-consolidation-plan.md) (the seeding blocker below was already flagged there).

## Use case

A user is partway through a quiz — some questions answered, some not — and leaves before finishing (closes the tab, force-quits the app, switches devices, loses signal). Today, if they come back, the app has no memory of that attempt: it looks exactly like they never started. They lose their answers and have to redo the whole quiz from question 1.

What we want instead: if a user comes back to a quiz they were partway through, they land back on the same question, with their previous answers still selected, and can keep going. This should work even if they come back on a different device or after reinstalling the app — not just "same browser tab, didn't clear its storage."

A basic version of this (same device/browser only, via local storage) shipped 2026-07-19 for Module Quiz specifically. It's a stopgap — it doesn't survive a reinstall, a different device, or a cleared browser. This ticket is about the real version.

## Why this is smaller than it sounds

There's already a session/answer data model on the backend (`solution-sessions` — session status, per-answer records, a way to fetch a session's answers back) built for the Mock Exam feature. It was designed with exactly this resume use case in mind but the mobile app never finished wiring up to use it that way — today it only writes all the answers at the very end, in one batch, when the user hits Finish. If they never hit Finish, none of it was ever saved.

So this likely isn't "design a new persistence system" — it's "make the app save each answer as the user picks it (not just at the end), and make it check for a previous unfinished attempt when a quiz is opened." Whoever picks this up should look at how Mock Exam already talks to the backend for session data — Module Quiz should be able to follow the same shape once it's wired up.

## Known blocker: Module Quiz has no backend-tracked questions yet

Separately (unrelated to the resume mechanism itself): Module Quiz currently pulls its questions from a local bundled copy on the phone, not from the backend, because the module-level question sets were never created server-side (this needs someone with backend/Convex admin access to run a one-time seeding step — flagged back in the consolidation plan linked above, still open). Mock Exam already has this — its quizzes are backend-tracked. Module Quiz resume can't be backend-tracked until this seeding happens; it's a prerequisite, not part of the resume work itself.

## Suggested scope for whoever picks this up

- Decide how a user should discover "you have an unfinished attempt" — silently resume, or ask first? (worth a quick product call, not assumed here)
- Decide what happens to an old unfinished attempt that's never resumed — does it expire, get abandoned automatically, stay open forever?
- Implementation approach (what to fetch when, when to write each answer, etc.) is left to the developer picking this up — the backend building blocks for sessions/answers already exist, so start by reading how Mock Exam and Module Quiz currently create/submit to a quiz session before designing new API surface.

## Out of scope

- The local/same-device stopgap already shipped for Module Quiz (2026-07-19) — this ticket is about replacing/backing it with real cross-device resume, not re-doing that work.
- Mock Exam's "quit exam" dialog still says progress will be lost — same underlying issue, not touched by the 2026-07-19 fix (that only covered Module Quiz). Worth a decision on whether Mock Exam gets the same treatment now or waits for this ticket.
