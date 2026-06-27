import { post, get } from './api';

export type PlanType = '3_day' | '7_day' | '14_day';

export async function createCheckoutSession(planType: PlanType): Promise<{ sessionId: string; url: string }> {
  return post<{ sessionId: string; url: string }>('/payments/checkout-session', { planType });
}

export async function verifySession(sessionId: string): Promise<void> {
  await get<void>(`/payments/session/${sessionId}`);
}
