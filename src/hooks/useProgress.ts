import { useState, useEffect, useCallback } from 'react';
import { getUserProgress, type ProgressItem } from '../lib/progressApi';

export type ProgressState = {
  data: ProgressItem[] | null;
  loading: boolean;
  error: string | null;
};

export function useProgress(enabled = true) {
  const [state, setState] = useState<ProgressState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchProgress = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getUserProgress();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load progress';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    void fetchProgress();
  }, [enabled, fetchProgress]);

  return { ...state, refetch: fetchProgress };
}
