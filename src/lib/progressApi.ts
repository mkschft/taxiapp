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
  progress: { total: number; completed: number; percentage: number };
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
  }[];
};

export async function getUserProgress(): Promise<ProgressItem[]> {
  return get<ProgressItem[]>('/progress');
}
