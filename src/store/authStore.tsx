import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadItem, saveItem } from './storage';
import { setUnauthorizedHandler } from '../lib/api';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  expectedExamDate: string | null;
  emailVerified: boolean;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Local-first preview: the user chose "Try free preview" and is using the
   *  app without an account. Progress is stored locally but not synced until
   *  they sign up. Cleared the moment a real account is set. */
  guest: boolean;
  /** The first-run onboarding carousel has been completed. Persisted so it is
   *  shown once and skipped on every later launch. Reset on logout. */
  onboardingSeen: boolean;
  hydrated: boolean;
};

const AUTH_STORAGE_KEYS = {
  USER: '@taxi/authUser',
  ACCESS_TOKEN: '@taxi/accessToken',
  REFRESH_TOKEN: '@taxi/refreshToken',
  GUEST: '@taxi/guest',
  ONBOARDING_SEEN: '@taxi/onboardingSeen',
} as const;

const AuthContext = createContext<{
  state: AuthState;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
  enterGuest: () => Promise<void>;
  markOnboardingSeen: () => Promise<void>;
  clearAuth: () => Promise<void>;
}>({
  state: { user: null, accessToken: null, refreshToken: null, guest: false, onboardingSeen: false, hydrated: false },
  setAuth: async () => {},
  updateUser: async () => {},
  enterGuest: async () => {},
  markOnboardingSeen: async () => {},
  clearAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    guest: false,
    onboardingSeen: false,
    hydrated: false,
  });

  useEffect(() => {
    (async () => {
      const [rawUser, accessToken, refreshToken, guest, onboardingSeen] = await Promise.all([
        loadItem<AuthUser | null>(AUTH_STORAGE_KEYS.USER, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null),
        loadItem<boolean>(AUTH_STORAGE_KEYS.GUEST, false),
        loadItem<boolean>(AUTH_STORAGE_KEYS.ONBOARDING_SEEN, false),
      ]);
      // Migrate legacy users that were created before email verification existed.
      const user = rawUser ? { ...rawUser, emailVerified: rawUser.emailVerified ?? true } : null;
      setState({ user, accessToken, refreshToken, guest: !user && guest, onboardingSeen, hydrated: true });
    })();
  }, []);

  const setAuth = useCallback(async (user: AuthUser, accessToken: string, refreshToken: string) => {
    await Promise.all([
      saveItem(AUTH_STORAGE_KEYS.USER, user),
      saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      saveItem(AUTH_STORAGE_KEYS.GUEST, false), // a real account supersedes guest
    ]);
    setState(prev => ({ ...prev, user, accessToken, refreshToken, guest: false }));
  }, []);

  const updateUser = useCallback(async (patch: Partial<AuthUser>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const user = { ...prev.user, ...patch };
      saveItem(AUTH_STORAGE_KEYS.USER, user);
      return { ...prev, user };
    });
  }, []);

  const enterGuest = useCallback(async () => {
    await saveItem(AUTH_STORAGE_KEYS.GUEST, true);
    setState(prev => ({ ...prev, guest: true }));
  }, []);

  const markOnboardingSeen = useCallback(async () => {
    await saveItem(AUTH_STORAGE_KEYS.ONBOARDING_SEEN, true);
    setState(prev => ({ ...prev, onboardingSeen: true }));
  }, []);

  const clearAuth = useCallback(async () => {
    await Promise.all([
      saveItem(AUTH_STORAGE_KEYS.USER, null),
      saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null),
      saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null),
      saveItem(AUTH_STORAGE_KEYS.GUEST, false),
      saveItem(AUTH_STORAGE_KEYS.ONBOARDING_SEEN, false),
    ]);
    setState(prev => ({ ...prev, user: null, accessToken: null, refreshToken: null, guest: false, onboardingSeen: false }));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ state, setAuth, updateUser, enterGuest, markOnboardingSeen, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
