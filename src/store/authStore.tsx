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
  hydrated: boolean;
};

const AUTH_STORAGE_KEYS = {
  USER: '@taxi/authUser',
  ACCESS_TOKEN: '@taxi/accessToken',
  REFRESH_TOKEN: '@taxi/refreshToken',
} as const;

const AuthContext = createContext<{
  state: AuthState;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}>({
  state: { user: null, accessToken: null, refreshToken: null, hydrated: false },
  setAuth: async () => {},
  clearAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    hydrated: false,
  });

  useEffect(() => {
    (async () => {
      const [user, accessToken, refreshToken] = await Promise.all([
        loadItem<AuthUser | null>(AUTH_STORAGE_KEYS.USER, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null),
        loadItem<string | null>(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null),
      ]);
      setState({ user, accessToken, refreshToken, hydrated: true });
    })();
  }, []);

  const setAuth = useCallback(async (user: AuthUser, accessToken: string, refreshToken: string) => {
    await Promise.all([
      saveItem(AUTH_STORAGE_KEYS.USER, user),
      saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
    setState(prev => ({ ...prev, user, accessToken, refreshToken }));
  }, []);

  const clearAuth = useCallback(async () => {
    await Promise.all([
      saveItem(AUTH_STORAGE_KEYS.USER, null),
      saveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, null),
      saveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null),
    ]);
    setState(prev => ({ ...prev, user: null, accessToken: null, refreshToken: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ state, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
