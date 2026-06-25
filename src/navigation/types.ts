/** One row of the model-test per-category pass-gate breakdown. */
export type ResultCategoryStat = {
  category: string;
  label: string;
  correct: number;
  total: number;
  min: number;
  passed: boolean;
};

export type AuthRedirectInfo = {
  tab: keyof AppTabParamList;
  screen: string;
  params?: Record<string, unknown>;
};

export type RootStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Signup: { redirect?: AuthRedirectInfo } | undefined;
  Login: { redirect?: AuthRedirectInfo } | undefined;
  App: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Study: undefined;
  Test: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type StudyStackParamList = {
  StudyHome: undefined;
  Guide: undefined;
  HowTo: undefined;
  VocabSets: undefined;
  VocabSetDetail: { setId: string };
  VocabLesson: { setId: string; index?: number };
  VocabQuiz: { setId: string; sessionId?: string; problemSetId?: string };
  ClueWords: undefined;
  ClueLesson: { groupId: string; index?: number };
  ClueQuiz: { groupId: string; sessionId?: string; problemSetId?: string };
  TopicSections: undefined;
  TopicLessons: { sectionId: string };
  Practice: {
    questionId: string;
    queue?: string[];
    queueIndex?: number;
    sourceLabel?: string;
    sessionId?: string;
    /** Review mode: reveal the correct answer immediately (no re-answering). */
    review?: boolean;
    /** Map of questionId -> the answer the user originally gave (for review). */
    answers?: Record<string, string>;
  };
  Result: {
    mode: 'quiz' | 'test' | 'weak';
    label: string;
    score: number;
    total: number;
    wrongIds: string[];
    timeTaken?: number;
    answers?: Record<string, string>;
    /** Per-category pass-gate breakdown (model-test mode). */
    categories?: ResultCategoryStat[];
    /** Authoritative pass flag: overall threshold AND every category minimum. */
    passed?: boolean;
  };
};

export type TestStackParamList = {
  TestHome: undefined;
  ModelTest: { testId: string; sessionId?: string; problemSetId?: string };
  Practice: {
    questionId: string;
    queue?: string[];
    queueIndex?: number;
    sourceLabel?: string;
    review?: boolean;
    answers?: Record<string, string>;
  };
  Result: {
    mode: 'quiz' | 'test' | 'weak';
    label: string;
    score: number;
    total: number;
    wrongIds: string[];
    timeTaken?: number;
    answers?: Record<string, string>;
    /** Per-category pass-gate breakdown (model-test mode). */
    categories?: ResultCategoryStat[];
    /** Authoritative pass flag: overall threshold AND every category minimum. */
    passed?: boolean;
  };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Referral: undefined;
};
