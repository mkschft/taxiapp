import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import type {
  StorageSchema, QuestionRecord, VocabRecord, QuizScore, ModelTestScore, UserProfile,
} from './types';
import { STORAGE_KEYS } from './types';
import { loadItem, saveItem } from './storage';

// ── Default state ─────────────────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  name: '',
  exam_date: null,
  language_pref: 'en',
  referral_code: 'TAXI' + Math.random().toString(36).substring(2, 6).toUpperCase(),
  referred_by: null,
};

const INITIAL_STATE: StorageSchema & { hydrated: boolean } = {
  hydrated: false,
  profile: DEFAULT_PROFILE,
  questions: {},
  vocab: {},
  quiz_scores: [],
  test_scores: [],
  streak: 0,
  last_active_date: '',
};

// ── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'HYDRATE'; payload: Partial<StorageSchema> }
  | { type: 'ANSWER_QUESTION'; id: string; correct: boolean }
  | { type: 'MARK_VOCAB_SEEN'; id: string }
  | { type: 'MARK_VOCAB_LEARNED'; id: string }
  | { type: 'SAVE_QUIZ_SCORE'; score: QuizScore }
  | { type: 'SAVE_TEST_SCORE'; score: ModelTestScore }
  | { type: 'UPDATE_PROFILE'; profile: Partial<UserProfile> }
  | { type: 'UPDATE_STREAK' };

function reducer(
  state: StorageSchema & { hydrated: boolean },
  action: Action,
): StorageSchema & { hydrated: boolean } {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };

    case 'ANSWER_QUESTION': {
      const prev = state.questions[action.id];
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.id]: {
            answered: true,
            correct: action.correct,
            attempts: (prev?.attempts ?? 0) + 1,
            last_seen: Date.now(),
          },
        },
      };
    }

    case 'MARK_VOCAB_SEEN': {
      const prev = state.vocab[action.id];
      if (prev?.seen) return state;
      return {
        ...state,
        vocab: {
          ...state.vocab,
          [action.id]: { ...prev, seen: true, learned: prev?.learned ?? false, last_seen: Date.now() },
        },
      };
    }

    case 'MARK_VOCAB_LEARNED':
      return {
        ...state,
        vocab: {
          ...state.vocab,
          [action.id]: { seen: true, learned: true, last_seen: Date.now() },
        },
      };

    case 'SAVE_QUIZ_SCORE':
      return { ...state, quiz_scores: [...state.quiz_scores, action.score] };

    case 'SAVE_TEST_SCORE':
      return { ...state, test_scores: [...state.test_scores, action.score] };

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } };

    case 'UPDATE_STREAK': {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (state.last_active_date === today) return state;
      const newStreak = state.last_active_date === yesterday ? state.streak + 1 : 1;
      return { ...state, streak: newStreak, last_active_date: today };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const ProgressContext = createContext<{
  state: StorageSchema & { hydrated: boolean };
  dispatch: React.Dispatch<Action>;
}>({ state: INITIAL_STATE, dispatch: () => {} });

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate on mount
  useEffect(() => {
    (async () => {
      const [profile, questions, vocab, quizScores, testScores, streak, lastActive] =
        await Promise.all([
          loadItem<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
          loadItem<Record<string, QuestionRecord>>(STORAGE_KEYS.QUESTIONS, {}),
          loadItem<Record<string, VocabRecord>>(STORAGE_KEYS.VOCAB, {}),
          loadItem<QuizScore[]>(STORAGE_KEYS.QUIZ_SCORES, []),
          loadItem<ModelTestScore[]>(STORAGE_KEYS.TEST_SCORES, []),
          loadItem<number>(STORAGE_KEYS.STREAK, 0),
          loadItem<string>(STORAGE_KEYS.LAST_ACTIVE, ''),
        ]);
      dispatch({
        type: 'HYDRATE',
        payload: {
          profile,
          questions,
          vocab,
          quiz_scores: quizScores,
          test_scores: testScores,
          streak,
          last_active_date: lastActive,
        },
      });
    })();
  }, []);

  // Persist on state changes (debounced 300ms)
  useEffect(() => {
    if (!state.hydrated) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveItem(STORAGE_KEYS.PROFILE, state.profile);
      saveItem(STORAGE_KEYS.QUESTIONS, state.questions);
      saveItem(STORAGE_KEYS.VOCAB, state.vocab);
      saveItem(STORAGE_KEYS.QUIZ_SCORES, state.quiz_scores);
      saveItem(STORAGE_KEYS.TEST_SCORES, state.test_scores);
      saveItem(STORAGE_KEYS.STREAK, state.streak);
      saveItem(STORAGE_KEYS.LAST_ACTIVE, state.last_active_date);
    }, 300);
  }, [state]);

  return (
    <ProgressContext.Provider value={{ state, dispatch }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);

// ── Derived selectors ─────────────────────────────────────────────────────────
export function useQuestionStats(totalQuestions: number) {
  const { state } = useProgress();
  const answered = Object.values(state.questions).filter(q => q.answered).length;
  const correct = Object.values(state.questions).filter(q => q.correct).length;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const completion = Math.round((answered / totalQuestions) * 100);
  return { answered, correct, accuracy, completion };
}

export function useWeakQuestionIds() {
  const { state } = useProgress();
  return Object.entries(state.questions)
    .filter(([, r]) => r.answered && !r.correct)
    .map(([id]) => id);
}

export function useCategoryProgress(categoryQuestions: Record<string, string[]>) {
  const { state } = useProgress();
  return Object.entries(categoryQuestions).map(([catId, qIds]) => {
    const answered = qIds.filter(id => state.questions[id]?.answered).length;
    const correct = qIds.filter(id => state.questions[id]?.correct).length;
    return {
      catId,
      answered,
      correct,
      total: qIds.length,
      pct: qIds.length > 0 ? Math.round((correct / qIds.length) * 100) : 0,
    };
  });
}
