import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useAuth, hasFullAccessPlan, hasDayPassPlan } from './authStore';

// Pricing tiers (see docs/plans/pricing-tiers-2026-07.md):
// - Free (signed up, no active plan): 1 lesson per module (the first) + all of
//   Vocabulary/Clue Words.
// - Day Pass (1_day): a fixed 2 mock exams + all of Vocabulary/Clue Words. No
//   extra module practice beyond the free lesson.
// - Week/Two-Week Pass (7_day/14_day): everything.
export const FREE_LESSON_INDEX = 0;
const DAY_PASS_MODEL_TEST_IDS = ['mt1', 'mt2'];

type PaywallCtx = {
  hydrated: boolean;
  /** Full access to every module's practice + every mock exam. */
  hasFullAccess: () => boolean;
  /** Whether a given lesson (by its position in its module's list) is free to open. */
  isLessonUnlocked: (lessonIndex: number) => boolean;
  /** Whether a given mock exam is free to open. */
  isMockTestUnlocked: (testId: string) => boolean;
};

const PaywallContext = createContext<PaywallCtx>({
  hydrated: false,
  hasFullAccess: () => false,
  isLessonUnlocked: (lessonIndex) => lessonIndex === FREE_LESSON_INDEX,
  isMockTestUnlocked: () => false,
});

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  const hasFullAccess = useCallback(() => {
    if (!state.user) return false;
    return hasFullAccessPlan(state.user.subscription);
  }, [state.user]);

  const isLessonUnlocked = useCallback(
    (lessonIndex: number) => hasFullAccess() || lessonIndex === FREE_LESSON_INDEX,
    [hasFullAccess],
  );

  const isMockTestUnlocked = useCallback(
    (testId: string) => {
      if (hasFullAccess()) return true;
      if (!state.user) return false;
      return hasDayPassPlan(state.user.subscription) && DAY_PASS_MODEL_TEST_IDS.includes(testId);
    },
    [hasFullAccess, state.user],
  );

  const value = useMemo(
    () => ({ hydrated: state.hydrated, hasFullAccess, isLessonUnlocked, isMockTestUnlocked }),
    [state.hydrated, hasFullAccess, isLessonUnlocked, isMockTestUnlocked],
  );

  return (
    <PaywallContext.Provider value={value}>
      {children}
    </PaywallContext.Provider>
  );
}

export const usePaywall = () => useContext(PaywallContext);
