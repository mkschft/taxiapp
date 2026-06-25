// Guest access policy — distinct from the paid/paywall layer.
//
// A guest (no account, entered via Welcome → "Continue as guest") may browse
// only the orientation surfaces: "How to use the app" and the "Exam Guide".
// Everything else is locked behind sign-up. Signed-in users are governed by the
// paywall layer (see store/paywallStore), not this.
//
// Keyed by the route name used in navigation (StudyStack / RootStack screens).
export const GUEST_SCREENS = ['HowTo', 'Guide'] as const;

export function isGuestLocked(screen: string, isGuest: boolean): boolean {
  return isGuest && !GUEST_SCREENS.includes(screen as (typeof GUEST_SCREENS)[number]);
}
