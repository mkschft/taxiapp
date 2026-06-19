import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadItem, saveItem } from './storage';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Local-first preview: the user chose "Try free preview" and is using the
   *  app without an account. Progress is stored locally but not synced until
   *  they sign up. Cleared the moment a real account is set. */
  guest: boolean;
  hydrated: boolean;
};

const AUTH_STORAGE_KEYS = {
  USER: '@taxi/authUser',
  ACCESS_TOKEN: '@taxi/accessToken',
  REFRESH_TOKEN: '@taxi/refreshToken',
  GUEST: '@taxi/guest',
} as const;

const AuthContext = createContext<{
  state: AuthState;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  enterGuest: () => Promise<void>;
  clearAuth: () => Promise<void>;
}>({
  state: { user: null, accessToken: null, refreshToken: null, guest: false, hydrated: false },
  setAuth: async () => {},
  enterGuest: async () => {},
  clearAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    guest: false,
    hydrated: false,
  });

  useEffect(() => {
    (async () => {
      const [user, accessToken, refreshToken, guest] = await Promise.all([
        loadItem<AuthUser | null>(AUTH_STORAGE_KEYS.USER, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null),
        loadItem<boolean>(AUTH_STORAGE_KEYS.GUEST, false),
      ]);
      setState({ user, accessToken, refreshToken, guest: !user && guest, hydrated: true });
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

  const enterGuest = useCallback(async () => {
    await saveItem(AUTH_STORAGE_KEYS.GUEST, true);
    setState(prev => ({ ...prev, guest: true }));
  }, []);

  const clearAuth = useCallback(async () => {
    await Promise.all([
      saveItem(AUTH_STORAGE_KEYS.USER, null),
      saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null),
      saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null),
      saveItem(AUTH_STORAGE_KEYS.GUEST, false),
    ]);
    setState(prev => ({ ...prev, user: null, accessToken: null, refreshToken: null, guest: false }));
  }, []);

  return (
    <AuthContext.Provider value={{ state, setAuth, enterGuest, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
