'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Progress, Section, QuizResult } from './types';
import { getSessionId } from './supabase';

const STORAGE_KEY = 'git-academy-progress';

const defaultProgress: Progress = {
  completedSections: [],
};

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(defaultProgress);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProgress(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((p: Progress) => {
    setProgress(p);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  }, []);

  // Use fetch with keepalive so the request survives component unmount / page navigation
  const syncProgressToSupabase = useCallback((p: Progress, studentName?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const sessionId = getSessionId();
      const name = studentName || p.quizResult?.name || 'Anonymous';
      fetch('/api/save-progress', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_name: name,
          completed_sections: p.completedSections,
          last_visited: p.lastVisited ?? null,
          last_updated: new Date().toISOString(),
        }),
      }).catch(e => console.warn('Progress sync failed:', e));
    } catch (e) {
      console.warn('Progress sync failed (offline?):', e);
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
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      syncProgressToSupabase(next);
      return next;
    });
  }, [syncProgressToSupabase]);

  const saveQuizResult = useCallback((result: QuizResult) => {
    setProgress(prev => {
      const next: Progress = { ...prev, quizResult: result };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      syncProgressToSupabase(next, result.name);
      return next;
    });
  }, [syncProgressToSupabase]);

  const resetProgress = useCallback(() => {
    save(defaultProgress);
  }, [save]);

  return { progress, markCompleted, saveQuizResult, resetProgress };
}

