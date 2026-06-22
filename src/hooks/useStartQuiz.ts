import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_PROBLEM_SET_IDS } from '../data/backendProblemSetIds';
import { createSolutionSession } from '../lib/quizApi';
import { useAuth } from '../store/authStore';

export function useStartQuiz() {
  const { state: authState } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const startQuiz = useCallback(
    async (
      mappingKey: string,
      screen: string,
      params: Record<string, unknown>,
    ) => {
      if (!authState.user) {
        navigation.navigate(screen, params);
        return;
      }

      const problemSetId = BACKEND_PROBLEM_SET_IDS[mappingKey];
      if (!problemSetId) {
        console.warn(`No backend problem set for ${mappingKey}`);
        navigation.navigate(screen, params);
        return;
      }

      setLoading(true);
      try {
        const sessionId = await createSolutionSession(problemSetId);
        navigation.navigate(screen, { ...params, sessionId, problemSetId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start quiz';
        Alert.alert('Quiz error', message);
        navigation.navigate(screen, params);
      } finally {
        setLoading(false);
      }
    },
    [authState.user, navigation],
  );

  return { startQuiz, loading };
}
