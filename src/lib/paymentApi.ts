import { post, get } from './api';

export type PlanType = '1_day' | '7_day' | '14_day';

export async function createCheckoutSession(planType: PlanType): Promise<{ sessionId: string; url: string }> {
  return post<{ sessionId: string; url: string }>('/payments/checkout-session', { planType });
}

export async function createGuestCheckoutSession(email: string, planType: PlanType): Promise<{ sessionId: string; url: string }> {
  return post<{ sessionId: string; url: string }>('/payments/guest-checkout-session', { email, planType });
}

export async function verifySession(sessionId: string): Promise<{ isGuest: boolean; email?: string }> {
  return get<{ isGuest: boolean; email?: string }>(`/payments/session/${sessionId}`);
}
