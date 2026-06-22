import { get, post, patch } from './api';

export type ClueLens = {
  focusWords: { phrase: string; translation: string }[];
  optionClues: {
    optionIndex: number;
    type: 'trap' | 'good';
    wordTranslations: { word: string; translation: string }[];
  }[];
};

export type BackendProblem = {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageKey?: string;
  clueLens?: ClueLens;
};

export type BackendProblemSet = {
  _id: string;
  label: string;
  problems: BackendProblem[];
};

export type AnswerResponse = {
  _id: string;
  problemId: string;
  solutionSessionId: string;
  selectedAnswer: number;
  status: 'correct' | 'wrong';
};

export async function createSolutionSession(problemSetId: string): Promise<string> {
  return post<string>('/solution-sessions', { problemSetId });
}

export async function getProblemSet(problemSetId: string): Promise<BackendProblemSet> {
  return get<BackendProblemSet>(`/problem-sets/${problemSetId}`);
}

export async function submitAnswer(
  sessionId: string,
  problemId: string,
  selectedAnswer: number,
): Promise<AnswerResponse> {
  return post<AnswerResponse>(`/solution-sessions/${sessionId}/answers`, {
    problemId,
    selectedAnswer,
  });
}

export async function completeSession(sessionId: string): Promise<void> {
  await patch<void>(`/solution-sessions/${sessionId}`, { status: 'completed' });
}
