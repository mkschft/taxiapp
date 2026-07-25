# Web Desktop Responsive Layout

> Branch: `39-add-desktop-ui` (current).
> Status: **LOCKED — approved for implementation.**
> Created: 2026-07-25

## Problem

On desktop web the app renders inside a centered **430px "phone shell"** (`App.tsx` → `webShell`), floating on a gray backdrop. There is zero responsive infrastructure: no `useWindowDimensions`, no breakpoints, no wide-content container. Every screen is a single mobile column with a 76px bottom tab bar. Desktop users get a phone screenshot, not an app.

## Target design (locked decisions)

**Breakpoints** (width-based via `useWindowDimensions`, so iPads benefit automatically):

| # | Decision |
|---|----------|
| D-A | **`< 768px` — Compact:** current mobile layout, bottom tabs. Untouched. |
| D-B | **768–1023px — Tablet:** 72px **icon-only rail** (tooltips on web hover) + top navbar. Bottom tab bar hidden. |
| D-C | **≥1024px — Desktop:** 260px **full sidebar** + top navbar. Bottom tab bar hidden. |
| D-D | **Desktop sidebar:** brand mark on top → main nav (Study, Mock Exams, Progress, Profile — same icons/labels/routes as tabs) → "More" section (Exam Guide, How to Use, Saved Questions) → bottom: user card (avatar initials, name, plan badge → Profile) or guest "Sign in" CTA. |
| D-E | **Top navbar (tablet + desktop, 64px):** left = current section title; right = EN/FI segmented language toggle (reuses `setAppLanguage`) + "Upgrade" chip for free users (→ Pricing). User identity stays in the sidebar — no duplication. |
| D-F | **Content container:** all tab content centers in `maxWidth: 1120` with 32px horizontal padding. Per-screen variants via prop: reading-heavy screens 880px. |
| D-G | **Quiz/exam screens (Practice, ModelTest):** two-column split on ≥1024 — left column (~55%): progress track, question card, explanation; right column (~45%): action buttons, options list, Next/Finish. Below 1024: unchanged single column. |
| D-H | **Dashboard:** 2-column card grid (modules + vocab/clue cards) inside 1120px; progress hero card stays full-width. |
| D-I | **`App` flow goes full-viewport responsive.** Only the `App` (tabs) flow uses the sidebar/rail + top-navbar shell. |
| D-J | **Same navigators, same URLs.** Sidebar dispatches to the existing tab navigator; linking config untouched. `ScreenHeader` stays as the in-content page bar; on desktop it drops its border/background to read as an inline page title. |
| D-K | **Auth/payment root routes** (Welcome, Onboarding, Login, Signup, VerifyEmail, ForgotPassword, ResetPassword, Pricing, PaymentSuccess, PaymentCancel) are **no longer locked to the 430px phone shell** on ≥768px. `WebRootFrame` renders them full-viewport, and each screen uses `GuestShell` for its desktop layout. |
| D-L | **`GuestShell` desktop layouts:** split-screen brand panel + white content card for Welcome/Onboarding/auth forms; centered white card for status pages (VerifyEmail, PaymentSuccess, PaymentCancel); full-width centered container for Pricing. |
| D-M | **Guest chrome:** brand mark + app name + language toggle visible on every guest desktop screen; no upgrade chip (guests have no subscription state here). |

## Implementation (grounded in code)

**New files**
- `src/theme/breakpoints.ts` — `BREAKPOINTS = { tablet: 768, desktop: 1024 } as const` + `useBreakpoint()` → `{ isCompact, isTablet, isDesktop, width }` via `useWindowDimensions`.
- `src/components/web/AppShell.tsx` — row layout: `<SidebarNav/>` (full or collapsed by breakpoint) + column(`<TopNavbar/>` + content). Receives active route state + root-stack `navigation` from `AppTabs`; pulls user/plan from `useAuth()`. Only rendered when `!isCompact`.
- `src/components/web/SidebarNav.tsx` — full (260px) + collapsed (72px) variants; brand, main items, more items, user card/guest CTA.
- `src/components/web/TopNavbar.tsx` — section title + language toggle + upgrade chip.
- `src/components/web/LanguageToggle.tsx` — EN/FI segmented control (reuses `setAppLanguage`).
- `src/components/web/ContentContainer.tsx` — max-width wrapper for screens.
- `src/components/web/WebRootFrame.tsx` — wraps `RootNavigator`; tracks current root route via `NavigationContainer onStateChange`. Renders the 430px phone shell for non-`App` routes **only on compact web viewports**, full width for `App` and for guest routes on ≥768px.
- `src/components/web/GuestShell.tsx` — desktop layout wrapper for guest/auth/payment screens. Split-screen brand panel + content card, or centered card variant; compact passthrough.

**Modified files**
- `App.tsx` — remove unconditional `webShell`; use `WebRootFrame`.
- `src/navigation/AppTabs.tsx` — wrap `Tab.Navigator` with `AppShell`; hide tab bar at ≥768 via `tabBar: (props) => isCompact ? <BottomTabBar {...props}/> : null`; track active tab + nested route via `screenListeners={{ state }}` and feed `AppShell`.
- `src/screens/DashboardScreen.tsx` — `isDesktop` → cards in flex-wrap 2-col row.
- `src/screens/PracticeScreen.tsx`, `ModelTestScreen.tsx` — `isDesktop` → two-column row layout; reuse existing fragments in left/right groups.
- List/settings screens (`VocabSets`, `ClueWords`, `TopicLessons`, `TestHome`, `Progress`, `Profile`, `Result`, `SavedQuestions`, `Guide`, `HowTo`, `Referral`) — mechanical wrap of main content in `<ContentContainer maxWidth={880}>`. Guest/auth/payment screens now wrapped in `<GuestShell>` with per-screen variant/maxWidth.
- `src/screens/PricingScreen.tsx` — replace `Platform.OS === 'web'` row logic with `isCompact` breakpoint so the plan grid responds to viewport width; keep centered full-width layout on desktop.
- `src/components/ui/ScreenHeader.tsx` — on `isDesktop`: transparent bg, no bottom border.
- `src/i18n/locales/{en,fi}/nav.json` — add `guide`, `howToUse`, `savedQuestions`. `src/i18n/locales/{en,fi}/common.json` — add `appName`, `upgrade`. EN/FI parity maintained.

**Guardrails**
- Zero native impact below 768px; no navigator/route/linking changes; no backend/contract changes.
- Web-only hover uses `onHoverIn/Out` guarded by `Platform.OS === 'web'`.

## Out of scope

- Sticky option column, question-map sidebar in exams, any content/copy changes, dark mode, marketing-grade landing redesign beyond the split-shell card layout.

## Verify

1. `npx tsc --noEmit` clean; EN/FI key parity holds.
2. Expo web walk at **1440 / 1280 / 834 / 390px** widths: sidebar↔rail↔tabs transitions, deep screens render correctly.
3. Two-column quiz: answer → explanation → Next flow works in both layouts.
4. Sidebar active states correct including Profile-stack secondary pages; URLs unchanged.
5. Auth flow still centered at 430px; payment success/cancel unaffected.
6. Suomi spot-check of new chrome.

_Last updated: 2026-07-25._
