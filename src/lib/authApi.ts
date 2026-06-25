import { patch } from './api';
import type { AuthUser } from '../store/authStore';

const BASE_URL = 'https://api.taxipilot.fi';

export async function getMe(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json() as {
    id: string;
    email: string;
    name: string;
    expectedExamDate?: string | null;
  };
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    expectedExamDate: data.expectedExamDate ?? null,
  };
}

export async function updateExpectedExamDate(expectedExamDate: string | null): Promise<void> {
  await patch<void>('/auth/me/expected-exam-date', { expectedExamDate });
}
