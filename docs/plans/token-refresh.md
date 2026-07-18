# Token refresh implementation plan

## Goal
Make the frontend API client automatically refresh the access token when it is
expired or rejected, then retry the original request without logging the user
out on a recoverable 401.

## Decisions

- **D-1: Refresh trigger** — Proactive (refresh if access token expires within
  60 s) + reactive (refresh once on 401, then retry).
- **D-2: Token storage source of truth** — Auth context owns in-memory state;
  `api.ts` reads/writes AsyncStorage directly for retries and updates the
  React context after a successful refresh.
- **D-3: Concurrency** — Single shared promise lock so concurrent 401s trigger
  only one `POST /auth/refresh` call.
- **D-4: Failure handling** — If refresh returns 401/fails, clear tokens and
  invoke the existing unauthorized handler (logout). No infinite retry loops.
- **D-5: `getMe` migration** — Move `src/lib/authApi.ts::getMe` from raw
  `fetch` to the shared `api.request()` client so it also benefits from
  automatic refresh.
- **D-6: UX** — Silent refresh; the only visible outcome is a clean logout if
  the refresh token is invalid/expired.

## Files changed

- `src/lib/api.ts` — add expiry check, refresh lock, retry logic.
- `src/store/authStore.tsx` — expose `setTokens` in context; update `getMe`
  caller after signature change.
- `src/lib/authApi.ts` — migrate `getMe` to shared client; remove manual
  `accessToken` parameter.

## Verification

- `npx tsc --noEmit` passes.
- Sign-in flow on web still works and subscription refresh is unaffected.
