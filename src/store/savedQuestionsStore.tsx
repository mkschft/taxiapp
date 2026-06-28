import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { loadItem, saveItem } from './storage';

const STORAGE_KEY = '@taxi/savedQuestions';

// A lightweight snapshot taken at mark time so the Saved list renders offline
// without re-fetching (there is no backend bookmark endpoint). Persisted to
// AsyncStorage so marks survive app restarts — a global bookmark.
export type SavedQuestion = {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correctKey: string;
  source?: string;
  markedAt: number;
};

type SavedContextValue = {
  saved: SavedQuestion[];
  isSaved: (id: string) => boolean;
  toggle: (q: Omit<SavedQuestion, 'markedAt'>) => void;
  remove: (id: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedQuestionsProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedQuestion[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void loadItem<SavedQuestion[]>(STORAGE_KEY, []).then(items => {
      setSaved(Array.isArray(items) ? items : []);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) void saveItem(STORAGE_KEY, saved);
  }, [saved, hydrated]);

  const isSaved = useCallback((id: string) => saved.some(s => s.id === id), [saved]);

  const toggle = useCallback((q: Omit<SavedQuestion, 'markedAt'>) => {
    setSaved(prev =>
      prev.some(s => s.id === q.id)
        ? prev.filter(s => s.id !== q.id)
        : [{ ...q, markedAt: Date.now() }, ...prev],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setSaved(prev => prev.filter(s => s.id !== id));
  }, []);

  const value = useMemo(() => ({ saved, isSaved, toggle, remove }), [saved, isSaved, toggle, remove]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSavedQuestions(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSavedQuestions must be used within SavedQuestionsProvider');
  return ctx;
}
