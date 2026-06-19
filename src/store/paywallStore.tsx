import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadItem, saveItem } from './storage';

// ── Mock paywall (pre-Stripe) ────────────────────────────────────────────────
// Paid features are locked until "unlocked". Real billing (Stripe) isn't wired
// yet, so the Paywall screen offers a "Skip for now" link that unlocks the
// feature locally — this lets us user-test the free→paid flow end to end.
// When Stripe lands, replace `unlock` with a real entitlement check; the screen
// gates stay the same.

export type PaidFeature = 'vocabulary' | 'clue_words' | 'topic_practice' | 'model_tests';

const STORAGE_KEY = '@taxi/unlockedFeatures';

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
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadItem<Record<string, boolean>>(STORAGE_KEY, {});
      setUnlocked(stored ?? {});
      setHydrated(true);
    })();
  }, []);

  const unlock = useCallback(async (feature: PaidFeature) => {
    setUnlocked(prev => {
      const next = { ...prev, [feature]: true };
      void saveItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isUnlocked = useCallback((feature: PaidFeature) => !!unlocked[feature], [unlocked]);

  return (
    <PaywallContext.Provider value={{ hydrated, isUnlocked, unlock }}>
      {children}
    </PaywallContext.Provider>
  );
}

export const usePaywall = () => useContext(PaywallContext);
