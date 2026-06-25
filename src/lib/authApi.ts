import { patch } from './api';

export async function updateExpectedExamDate(expectedExamDate: string | null): Promise<void> {
  await patch<void>('/auth/me/expected-exam-date', { expectedExamDate });
}
