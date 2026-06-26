import { get } from './api';
import type { components } from './api-types';

export type ProgressResponse = components['schemas']['ProgressResponseDto'];

export async function getUserProgress(): Promise<ProgressResponse[]> {
  return get<ProgressResponse[]>('/progress');
}
