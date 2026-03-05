'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Progress, Section, QuizResult } from './types';

const STORAGE_KEY = 'git-academy-progress';

const defaultProgress: Progress = {
  completedSections: [],
};

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(defaultProgress);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const save = useCallback((p: Progress) => {
    setProgress(p);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  }, []);

  const markCompleted = useCallback((section: Section) => {
    setProgress(prev => {
      if (prev.completedSections.includes(section)) return prev;
      const next: Progress = {
        ...prev,
        completedSections: [...prev.completedSections, section],
        lastVisited: section,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const saveQuizResult = useCallback((result: QuizResult) => {
    setProgress(prev => {
      const next: Progress = { ...prev, quizResult: result };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const reset = defaultProgress;
    save(reset);
  }, [save]);

  return { progress, markCompleted, saveQuizResult, resetProgress };
}
