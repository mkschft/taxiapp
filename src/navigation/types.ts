export type RootStackParamList = {
  Home: undefined;
  Signup: undefined;
  Login: undefined;
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
  VocabQuiz: { setId: string };
  ClueWords: undefined;
  ClueLesson: { groupId: string; index?: number };
  ClueQuiz: { groupId: string };
  TopicSections: undefined;
  TopicLessons: { sectionId: string };
  Practice: {
    questionId: string;
    queue?: string[];
    queueIndex?: number;
    sourceLabel?: string;
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
  };
};

export type TestStackParamList = {
  TestHome: undefined;
  ModelTest: { testId: string };
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
  };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Referral: undefined;
};
