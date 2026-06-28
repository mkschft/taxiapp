import { get } from './api';

// Per-problem-set progress, keyed by backend problemSetId. Powers the rings on
// the TopicLessons and VocabSets lists, which the category-level /progress feed
// cannot break down to (see BE-3 in docs/plans/next-changes-plan.md).
//
// total/completed/percentage are the must-haves; the rest are optional and
// mirror BE-1/BE-2 so per-lesson "last practiced" / weak areas can follow later.
export type ProblemSetProgress = {
  total: number;
  completed: number;
  percentage: number;
  lastPracticedAt?: number | null;
  wrongCount?: number;
  wrongQuestionIds?: string[];
};

export type ProblemSetProgressMap = Record<string, ProblemSetProgress>;

export async function getProblemSetProgress(): Promise<ProblemSetProgressMap> {
  return get<ProblemSetProgressMap>('/progress/problem-sets');
}
