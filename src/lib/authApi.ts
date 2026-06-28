import { patch, post } from './api';
import type { AuthUser, SubscriptionInfo } from '../store/authStore';

const BASE_URL = 'https://api.taxipilot.fi';

export async function getMe(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.message ?? 'Failed to fetch user');
    err.statusCode = res.status;
    throw err;
  }
  const data = await res.json() as {
    id: string;
    email: string;
    name: string;
    expectedExamDate?: string | null;
    emailVerified?: boolean;
    subscription?: SubscriptionInfo;
  };
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    expectedExamDate: data.expectedExamDate ?? null,
    emailVerified: data.emailVerified ?? false,
    subscription: data.subscription ?? {
      planType: 'free_preview',
      planName: 'Free Preview',
      isActive: true,
      expiresAt: null,
    },
  };
}

export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  return post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/verify-email', { token });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/resend-verification', { email });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/reset-password', { token, password });
}

export async function updateExpectedExamDate(expectedExamDate: string | null): Promise<void> {
  await patch<void>('/auth/me/expected-exam-date', { expectedExamDate });
}
