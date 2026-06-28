import { useState, useEffect, useCallback } from 'react';
import {
  getProblemSetProgress,
  type ProblemSetProgressMap,
} from '../lib/problemSetProgressApi';

// Graceful hook for per-problem-set progress (BE-3). The endpoint may not exist
// yet on the backend — any failure (404 included) resolves to an empty map so
// rings fall back to a neutral state. Errors are intentionally swallowed and
// never surfaced; only a 401 on a known route triggers logout (handled in api.ts),
// and /progress/problem-sets is not one of those.
export function useProblemSetProgress(enabled = true) {
  const [data, setData] = useState<ProblemSetProgressMap>({});

  const fetchProgress = useCallback(async () => {
    try {
      const res = await getProblemSetProgress();
      setData(res ?? {});
    } catch {
      setData({});
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData({});
      return;
    }
    void fetchProgress();
  }, [enabled, fetchProgress]);

  return { data, refetch: fetchProgress };
}
