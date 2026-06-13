export type RootStackParamList = {
  Home: undefined;
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
  };
  Result: {
    mode: 'quiz' | 'test' | 'weak';
    label: string;
    score: number;
    total: number;
    wrongIds: string[];
    timeTaken?: number;
  };
};

export type TestStackParamList = {
  TestHome: undefined;
  ModelTest: { testId: string };
  Result: {
    mode: 'quiz' | 'test' | 'weak';
    label: string;
    score: number;
    total: number;
    wrongIds: string[];
    timeTaken?: number;
  };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Referral: undefined;
};
