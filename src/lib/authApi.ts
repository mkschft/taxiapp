import { get, patch, post } from './api';
import type { AuthUser, SubscriptionInfo } from '../store/authStore';

export async function getMe(): Promise<AuthUser> {
  const data = await get<{
    id: string;
    email: string;
    name: string;
    expectedExamDate?: string | null;
    emailVerified?: boolean;
    subscription?: SubscriptionInfo;
  }>('/auth/me');

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

export async function completeGuestSignup(
  email: string,
  password: string,
  name: string,
): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
  const data = await post<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      expectedExamDate?: string | null;
      emailVerified?: boolean;
      subscription?: SubscriptionInfo;
    };
  }>('/auth/complete-guest-signup', { email, password, name });

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      expectedExamDate: data.user.expectedExamDate ?? null,
      emailVerified: data.user.emailVerified ?? false,
      subscription: data.user.subscription ?? {
        planType: 'free_preview',
        planName: 'Free Preview',
        isActive: true,
        expiresAt: null,
      },
    },
  };
}
