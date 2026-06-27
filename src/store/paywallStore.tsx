import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useAuth, hasActivePaidPlan } from './authStore';

export type PaidFeature = 'vocabulary' | 'clue_words' | 'topic_practice' | 'model_tests';

type PaywallCtx = {
  hydrated: boolean;
  isUnlocked: (feature: PaidFeature) => boolean;
  unlock: (feature: PaidFeature) => Promise<void>;
};

const PaywallContext = createContext<PaywallCtx>({
  hydrated: false,
  isUnlocked: () => false,
  unlock: async () => {},
});

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  const isUnlocked = useCallback(
    (_feature: PaidFeature) => {
      if (state.guest) return false;
      if (!state.user) return false;
      return hasActivePaidPlan(state.user.subscription);
    },
    [state.user, state.guest],
  );

  const unlock = useCallback(async (_feature: PaidFeature) => {
    // No-op: real unlock happens via Stripe checkout, not local state
  }, []);

  const value = useMemo(
    () => ({ hydrated: state.hydrated, isUnlocked, unlock }),
    [state.hydrated, isUnlocked, unlock],
  );

  return (
    <PaywallContext.Provider value={value}>
      {children}
    </PaywallContext.Provider>
  );
}

export const usePaywall = () => useContext(PaywallContext);
