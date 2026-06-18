// ── Official Traficom taxi-driver exam structure ────────────────────────────
// The real exam is 50 questions split across the 4 official subject areas, with
// a per-area minimum AND an overall pass mark of 38/50. Falling below the
// minimum in ANY single area fails the whole exam, even with 38+ correct total.
// Source: Traficom regulation TRAFICOM/523956/03.04.03.00/2019 (see
// EXAM_ACCURACY_AUDIT.md). Model tests mirror this 1:1.

export type CategoryId =
  | 'passenger_safety'
  | 'special_needs'
  | 'customer_service'
  | 'traffic_safety';

export const EXAM_CATEGORY_ORDER: CategoryId[] = [
  'passenger_safety',
  'special_needs',
  'customer_service',
  'traffic_safety',
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  passenger_safety: 'Passenger Help & Safety',
  special_needs: 'Special Passenger Needs',
  customer_service: 'Customer Service',
  traffic_safety: 'Transport & Traffic Safety',
};

export const EXAM_STRUCTURE: Record<CategoryId, { count: number; min: number }> = {
  passenger_safety: { count: 15, min: 12 },
  special_needs: { count: 15, min: 12 },
  customer_service: { count: 10, min: 7 },
  traffic_safety: { count: 10, min: 7 },
};

export const EXAM_TOTAL = 50;
export const EXAM_OVERALL_MIN = 38; // 76%

export type CategoryResult = {
  category: CategoryId;
  label: string;
  correct: number;
  total: number;
  min: number;
  passed: boolean;
};

export type ExamResult = {
  score: number;
  total: number;
  overallMin: number;
  overallPassed: boolean; // reached the overall 38/50 threshold
  categories: CategoryResult[];
  failedCategories: CategoryId[]; // areas below their minimum
  passed: boolean; // overall AND every category minimum met
};

/**
 * Minimum correct answers required in a category, scaled from the official
 * ratio if a test's category count differs from the official split (defensive —
 * model tests are asserted to be exactly 15/15/10/10 at build time).
 */
function minFor(category: CategoryId, total: number): number {
  const official = EXAM_STRUCTURE[category];
  if (total === official.count) return official.min;
  if (total <= 0) return 0;
  return Math.ceil((official.min / official.count) * total);
}

/**
 * Grade an exam against the real per-category gates. `perCategory` maps a
 * category_id to how many were correct and how many were asked in that area.
 */
export function gradeExam(
  perCategory: Partial<Record<CategoryId, { correct: number; total: number }>>,
): ExamResult {
  let score = 0;
  let total = 0;
  const categories: CategoryResult[] = [];
  const failedCategories: CategoryId[] = [];

  for (const category of EXAM_CATEGORY_ORDER) {
    const c = perCategory[category] ?? { correct: 0, total: 0 };
    const min = minFor(category, c.total);
    const passed = c.correct >= min;
    score += c.correct;
    total += c.total;
    categories.push({
      category,
      label: CATEGORY_LABEL[category],
      correct: c.correct,
      total: c.total,
      min,
      passed,
    });
    if (!passed) failedCategories.push(category);
  }

  const overallPassed = score >= Math.min(EXAM_OVERALL_MIN, total);
  return {
    score,
    total,
    overallMin: EXAM_OVERALL_MIN,
    overallPassed,
    categories,
    failedCategories,
    passed: overallPassed && failedCategories.length === 0,
  };
}
