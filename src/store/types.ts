export type QuestionRecord = {
  answered: boolean;
  correct: boolean;
  attempts: number;
  last_seen: number;
};

export type VocabRecord = {
  seen: boolean;
  learned: boolean;
  last_seen: number;
};

export type QuizScore = {
  quiz_id: string;
  score: number;
  completed_at: number;
  wrong_question_ids: string[];
};

export type ModelTestScore = {
  test_id: string;
  score: number;
  time_taken_seconds: number;
  completed_at: number;
  wrong_question_ids: string[];
  passed: boolean;
};

export type UserProfile = {
  name: string;
  exam_date: string | null;
  language_pref: 'fi' | 'en';
  referral_code: string;
  referred_by: string | null;
};

export type StorageSchema = {
  profile: UserProfile;
  questions: Record<string, QuestionRecord>;
  vocab: Record<string, VocabRecord>;
  quiz_scores: QuizScore[];
  test_scores: ModelTestScore[];
  streak: number;
  last_active_date: string;
};

export const STORAGE_KEYS = {
  PROFILE: '@taxi/profile',
  QUESTIONS: '@taxi/questions',
  VOCAB: '@taxi/vocab',
  QUIZ_SCORES: '@taxi/quiz_scores',
  TEST_SCORES: '@taxi/test_scores',
  STREAK: '@taxi/streak',
  LAST_ACTIVE: '@taxi/last_active',
} as const;
