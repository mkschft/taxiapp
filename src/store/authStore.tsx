import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { loadItem, saveItem } from './storage';
import { setTokenRefreshHandler, setUnauthorizedHandler } from '../lib/api';
import { getMe } from '../lib/authApi';

export type SubscriptionInfo = {
  planType: string;
  planName: string;
  isActive: boolean;
  expiresAt: number | null;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  expectedExamDate: string | null;
  emailVerified: boolean;
  role?: 'user' | 'admin';
  subscription: SubscriptionInfo;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** The first-run onboarding carousel has been completed. Persisted so it is
   *  shown once and skipped on every later launch. Reset on logout. */
  onboardingSeen: boolean;
  hydrated: boolean;
};

const AUTH_STORAGE_KEYS = {
  USER: '@taxi/authUser',
  ACCESS_TOKEN: '@taxi/accessToken',
  REFRESH_TOKEN: '@taxi/refreshToken',
  ONBOARDING_SEEN: '@taxi/onboardingSeen',
} as const;

export function hasActivePaidPlan(subscription: SubscriptionInfo): boolean {
  if (subscription.planType === 'free_preview') return false;
  if (!subscription.isActive) return false;
  if (subscription.expiresAt && subscription.expiresAt <= Date.now()) return false;
  return true;
}

// Plan types that unlock everything (all modules, all mock exams). Kept as a
// literal list rather than "anything that isn't free_preview/day pass" so a
// future partial tier doesn't silently become full-access.
const FULL_ACCESS_PLAN_TYPES = ['7_day', '14_day'];
// The single-day pass: mock exams (a fixed subset) + vocab/clue only — see
// paywallStore for what it does and doesn't unlock.
const DAY_PASS_PLAN_TYPES = ['1_day'];

export function hasFullAccessPlan(subscription: SubscriptionInfo): boolean {
  return hasActivePaidPlan(subscription) && FULL_ACCESS_PLAN_TYPES.includes(subscription.planType);
}

export function hasDayPassPlan(subscription: SubscriptionInfo): boolean {
  return hasActivePaidPlan(subscription) && DAY_PASS_PLAN_TYPES.includes(subscription.planType);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getRemainingDays(subscription: SubscriptionInfo): number {
  if (!hasActivePaidPlan(subscription)) return 0;
  if (!subscription.expiresAt) return 0;
  return Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / MS_PER_DAY));
}

const AuthContext = createContext<{
  state: AuthState;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
  markOnboardingSeen: () => Promise<void>;
  completeReturningUserAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}>({
  state: { user: null, accessToken: null, refreshToken: null, onboardingSeen: false, hydrated: false },
  setAuth: async () => {},
  setTokens: async () => {},
  updateUser: async () => {},
  markOnboardingSeen: async () => {},
  completeReturningUserAuth: async () => {},
  clearAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    onboardingSeen: false,
    hydrated: false,
  });

  useEffect(() => {
    (async () => {
      const [rawUser, accessToken, refreshToken, onboardingSeen] = await Promise.all([
        loadItem<AuthUser | null>(AUTH_STORAGE_KEYS.USER, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null),
        loadItem<boolean>(AUTH_STORAGE_KEYS.ONBOARDING_SEEN, false),
      ]);
      // Migrate legacy users that were created before email verification existed.
      const user = rawUser ? { ...rawUser, emailVerified: rawUser.emailVerified ?? true } : null;
      setState({ user, accessToken, refreshToken, onboardingSeen, hydrated: true });
    })();
  }, []);

  const setAuth = useCallback(async (user: AuthUser, accessToken: string, refreshToken: string) => {
    void saveItem(AUTH_STORAGE_KEYS.USER, user);
    void saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    void saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    setState(prev => ({ ...prev, user, accessToken, refreshToken }));
  }, []);

  const setTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    void saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    void saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    setState(prev => ({ ...prev, accessToken, refreshToken }));
  }, []);

  const updateUser = useCallback(async (patch: Partial<AuthUser>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const user = { ...prev.user, ...patch };
      void saveItem(AUTH_STORAGE_KEYS.USER, user);
      return { ...prev, user };
    });
  }, []);

  const markOnboardingSeen = useCallback(async () => {
    void saveItem(AUTH_STORAGE_KEYS.ONBOARDING_SEEN, true);
    setState(prev => ({ ...prev, onboardingSeen: true }));
  }, []);

  const completeReturningUserAuth = useCallback(async (user: AuthUser, accessToken: string, refreshToken: string) => {
    void saveItem(AUTH_STORAGE_KEYS.USER, user);
    void saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    void saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    void saveItem(AUTH_STORAGE_KEYS.ONBOARDING_SEEN, true);
    setState(prev => ({ ...prev, user, accessToken, refreshToken, onboardingSeen: true }));
  }, []);

  const clearAuth = useCallback(async () => {
    void saveItem(AUTH_STORAGE_KEYS.USER, null);
    void saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null);
    void saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null);
    void saveItem(AUTH_STORAGE_KEYS.ONBOARDING_SEEN, false);
    setState(prev => ({ ...prev, user: null, accessToken: null, refreshToken: null, onboardingSeen: false }));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth();
    });
    setTokenRefreshHandler((accessToken, refreshToken) => {
      void setTokens(accessToken, refreshToken);
    });
    return () => {
      setUnauthorizedHandler(null);
      setTokenRefreshHandler(null);
    };
  }, [clearAuth, setTokens]);

  // Global subscription refresh: on mount + when app returns to foreground
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const token = state.accessToken;
      if (!token) return;
      try {
        const user = await getMe();
        if (!cancelled) {
          setState(prev => {
            if (!prev.user) return prev;
            const nextUser = { ...prev.user, ...user };
            void saveItem(AUTH_STORAGE_KEYS.USER, nextUser);
            return { ...prev, user: nextUser };
          });
        }
      } catch {
        // ignore — auth state stays as-is
      }
    }

    refresh();

    const sub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        void refresh();
      }
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [state.accessToken]);

  const value = useMemo(() => ({
    state,
    setAuth,
    setTokens,
    updateUser,
    markOnboardingSeen,
    completeReturningUserAuth,
    clearAuth,
  }), [state, setAuth, setTokens, updateUser, markOnboardingSeen, completeReturningUserAuth, clearAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
