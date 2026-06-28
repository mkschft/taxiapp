import { get } from './api';

export type ProgressItem = {
  mainCategory: {
    _id: string;
    _creationTime: number;
    name: string;
    type: string;
    sortOrder?: number;
    parentCategoryId?: string;
  };
  progress: { total: number; completed: number; percentage: number; lastPracticedAt?: number | null };
  subcategories: {
    category: {
      _id: string;
      _creationTime: number;
      name: string;
      type: string;
      sortOrder?: number;
      parentCategoryId?: string;
    };
    total: number;
    completed: number;
    percentage: number;
    // BE-1 (optional): epoch ms of the user's most recent answer in this category.
    lastPracticedAt?: number | null;
  }[];
};

export async function getUserProgress(): Promise<ProgressItem[]> {
  return get<ProgressItem[]>('/progress');
}
