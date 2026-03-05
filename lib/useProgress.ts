'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Progress, Section, QuizResult } from './types';
import { supabase, getSessionId } from './supabase';

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

  const syncProgressToSupabase = useCallback(async (p: Progress, studentName?: string) => {
    try {
      const sessionId = getSessionId();
      const name = studentName || p.quizResult?.name || 'Anonymous';
      await supabase.from('student_progress').upsert({
        session_id: sessionId,
        student_name: name,
        completed_sections: p.completedSections,
        last_visited: p.lastVisited ?? null,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'session_id' });
    } catch (e) {
      console.warn('Supabase progress sync failed (offline?):', e);
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
      // Sync asynchronously
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
