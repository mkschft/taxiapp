import { loadItem, saveItem } from '../store/storage';
import { decodeJwtPayload } from './jwt';

const BASE_URL = 'https://api.taxipilot.fi';

export const AUTH_KEYS = {
  ACCESS_TOKEN: '@taxi/accessToken',
  REFRESH_TOKEN: '@taxi/refreshToken',
} as const;

export type ApiError = { message: string; statusCode: number };

type UnauthorizedHandler = () => void;
type TokenRefreshHandler = (accessToken: string, refreshToken: string) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let tokenRefreshHandler: TokenRefreshHandler | null = null;
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function setTokenRefreshHandler(handler: TokenRefreshHandler | null): void {
  tokenRefreshHandler = handler;
}

const AUTH_PATHS_WITHOUT_UNAUTHORIZED_HANDLER = new Set([
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

const REFRESH_BUFFER_MS = 60_000;

async function getAccessToken(): Promise<string | null> {
  return loadItem<string | null>(AUTH_KEYS.ACCESS_TOKEN, null);
}

async function getRefreshToken(): Promise<string | null> {
  return loadItem<string | null>(AUTH_KEYS.REFRESH_TOKEN, null);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    saveItem(AUTH_KEYS.ACCESS_TOKEN, accessToken),
    saveItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    saveItem(AUTH_KEYS.ACCESS_TOKEN, null),
    saveItem(AUTH_KEYS.REFRESH_TOKEN, null),
  ]);
}

function isTokenExpiringSoon(token: string | null, bufferMs: number = REFRESH_BUFFER_MS): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 - Date.now() <= bufferMs;
}

async function performRefresh(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.message ?? 'Failed to refresh tokens');
    err.statusCode = res.status;
    throw err;
  }

  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  await setTokens(data.accessToken, data.refreshToken);
  tokenRefreshHandler?.(data.accessToken, data.refreshToken);
  return data;
}

async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, retrying: boolean = false): Promise<T> {
  let token = await getAccessToken();

  if (token && isTokenExpiringSoon(token) && !retrying && !AUTH_PATHS_WITHOUT_UNAUTHORIZED_HANDLER.has(path)) {
    try {
      const refreshed = await refreshAccessToken();
      token = refreshed.accessToken;
    } catch {
      // Keep the existing token and let the request proceed. If the server
      // rejects it, the 401 handler below will attempt one reactive refresh.
    }
  }

  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 && !retrying && !AUTH_PATHS_WITHOUT_UNAUTHORIZED_HANDLER.has(path)) {
      try {
        await refreshAccessToken();
        return request<T>(path, options, true);
      } catch {
        // Refresh failed — clear auth below.
      }
    }

    if (res.status === 401 && !AUTH_PATHS_WITHOUT_UNAUTHORIZED_HANDLER.has(path) && unauthorizedHandler) {
      unauthorizedHandler();
    }

    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? JSON.stringify(body);
    } catch {}
    const err: ApiError = { message, statusCode: res.status };
    throw err;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}
