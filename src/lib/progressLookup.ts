import type { ProgressItem } from './progressApi';

// Shared helpers over the /progress payload so every screen derives progress the
// same way. The backend only tracks the `Official` main category + its 4 section
// subcategories (+ `Vocabulary`), so section-level and overall figures are real;
// per-lesson / per-set figures come from useProblemSetProgress (BE-3) instead.

export type CategoryProgress = { completed: number; total: number; percentage: number };

const empty: CategoryProgress = { completed: 0, total: 0, percentage: 0 };

export function getOverallProgress(progress: ProgressItem[] | null): CategoryProgress {
  if (!progress || progress.length === 0) return empty;
  const completed = progress.reduce((sum, item) => sum + item.progress.completed, 0);
  const total = progress.reduce((sum, item) => sum + item.progress.total, 0);
  return { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

// Match an `Official` subcategory by its English category name (the same mapping
// the Dashboard hero uses). Returns null when the feed has no entry for it yet.
export function getSectionProgress(
  progress: ProgressItem[] | null,
  categoryNameEn: string,
): CategoryProgress | null {
  const official = progress?.find(item => item.mainCategory.name === 'Official');
  const sub = official?.subcategories.find(s => s.category.name === categoryNameEn);
  if (!sub) return null;
  return { completed: sub.completed, total: sub.total, percentage: sub.percentage };
}
