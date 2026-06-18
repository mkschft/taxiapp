import { loadItem, saveItem } from '../store/storage';

const BASE_URL = 'https://api.taxipilot.fi';

export const AUTH_KEYS = {
  ACCESS_TOKEN: '@taxi/accessToken',
  REFRESH_TOKEN: '@taxi/refreshToken',
} as const;

export type ApiError = { message: string; statusCode: number };

async function getAccessToken(): Promise<string | null> {
  return loadItem<string | null>(AUTH_KEYS.ACCESS_TOKEN, null);
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
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
  return JSON.parse(text) as T;
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
