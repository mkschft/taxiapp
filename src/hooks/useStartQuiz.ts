import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_PROBLEM_SET_IDS } from '../data/backendProblemSetIds';
import { createSolutionSession } from '../lib/quizApi';
import { useAuth } from '../store/authStore';

export function useStartQuiz() {
  const { state: authState } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback(
    async (
      mappingKey: string,
      screen: string,
      params: Record<string, unknown>,
    ) => {
      if (!authState.user) {
        // Callers must render an AuthPrompt for unauthenticated users.
        return;
      }

      const problemSetId = BACKEND_PROBLEM_SET_IDS[mappingKey];
      if (!problemSetId) {
        console.warn(`No backend problem set for ${mappingKey}`);
        navigation.navigate(screen, params);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const sessionId = await createSolutionSession(problemSetId);
        navigation.navigate(screen, { ...params, sessionId, problemSetId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start quiz';
        setError(message);
        navigation.navigate(screen, params);
      } finally {
        setLoading(false);
      }
    },
    [authState.user, navigation],
  );

  const clearError = useCallback(() => setError(null), []);

  return { startQuiz, loading, error, clearError };
}
