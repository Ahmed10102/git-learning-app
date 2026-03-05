'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface StudentProgress {
  id: string;
  student_name: string;
  session_id: string;
  completed_sections: string[];
  last_visited: string | null;
  last_updated: string;
}

interface QuizResult {
  id: string;
  student_name: string;
  session_id: string;
  score: number;
  total: number;
  percentage: number;
  time_taken: number;
  answers: number[];
  question_order: number[];
  completed_at: string;
}

const TOTAL_SECTIONS = 16; // history, concepts, github, 11 commands, playground, next-steps

const SECTION_LABELS: Record<string, string> = {
  history: "Git's Origin Story", concepts: 'Core Concepts', github: 'What is GitHub?',
  'git-init': 'git init', 'git-status': 'git status', 'git-add': 'git add',
  'git-commit': 'git commit', 'git-log': 'git log', 'git-branch': 'git branch',
  'git-merge': 'git merge', gitignore: '.gitignore', 'git-clone': 'git clone',
  'git-remote': 'git remote', 'git-push-pull': 'git push & pull',
  playground: 'Playground', 'next-steps': 'Next Steps',
};

function gradeLabel(pct: number) {
  if (pct >= 90) return { label: 'S', color: '#00ff88' };
  if (pct >= 80) return { label: 'A', color: '#00ff88' };
  if (pct >= 70) return { label: 'B', color: '#00f5ff' };
  if (pct >= 60) return { label: 'C', color: '#00f5ff' };
  return { label: 'F', color: '#ff4466' };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  onClose: () => void;
}

export default function TeacherDashboard({ onClose }: Props) {
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [quizData, setQuizData] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'quiz' | 'detail'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: prog }, { data: quiz }] = await Promise.all([
        supabase.from('student_progress').select('*').order('last_updated', { ascending: false }),
        supabase.from('quiz_results').select('*').order('completed_at', { ascending: false }),
      ]);
      setProgressData(prog ?? []);
      setQuizData(quiz ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Merged student view: join by session_id
  const students = progressData.map(p => {
    const quizzes = quizData.filter(q => q.session_id === p.session_id);
    const bestQuiz = quizzes.sort((a, b) => b.percentage - a.percentage)[0] ?? null;
    return { progress: p, quiz: bestQuiz, allQuizzes: quizzes };
  });

  const avgScore = quizData.length > 0
    ? Math.round(quizData.reduce((a, b) => a + b.percentage, 0) / quizData.length)
    : 0;

  const studentsWithQuiz = quizData.filter((q, i, arr) => arr.findIndex(x => x.session_id === q.session_id) === i).length;

  // Detail view
  const detailStudent = selectedStudent
    ? students.find(s => s.progress.session_id === selectedStudent)
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: '1100px', maxHeight: '90vh',
        background: 'linear-gradient(135deg, rgba(2,6,24,0.98) 0%, rgba(4,10,32,0.98) 100%)',
        border: '1px solid rgba(0,245,255,0.35)',
        borderRadius: '16px',
        boxShadow: '0 0 60px rgba(0,245,255,0.15), 0 0 120px rgba(191,0,255,0.08)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid rgba(0,245,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,245,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--neon-cyan)', letterSpacing: '0.1em', margin: 0 }}>
                TEACHER DASHBOARD
              </h2>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Last updated: {timeAgo(lastRefresh.toISOString())} · Press ESC to close
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={fetchData}
              style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.25)', borderRadius: '8px', color: 'var(--neon-cyan)', cursor: 'pointer', padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
            >
              ↺ Refresh
            </button>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: '8px', color: '#ff4466', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 24px 0', borderBottom: '1px solid rgba(0,245,255,0.08)', display: 'flex', gap: '4px' }}>
          {(['overview', 'quiz', 'detail'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em',
              background: activeTab === tab ? 'rgba(0,245,255,0.12)' : 'transparent',
              color: activeTab === tab ? 'var(--neon-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {tab === 'overview' ? '👥 OVERVIEW' : tab === 'quiz' ? '🎯 QUIZ RESULTS' : '🔍 STUDENT DETAIL'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
              ⚡ Loading student data...
            </div>
          ) : (
            <>
              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'overview' && (
                <div>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { label: 'Total Students', value: progressData.length, color: 'var(--neon-cyan)', icon: '👥' },
                      { label: 'Completed Quiz', value: studentsWithQuiz, color: 'var(--neon-purple)', icon: '🎯' },
                      { label: 'Avg Quiz Score', value: `${avgScore}%`, color: 'var(--neon-green)', icon: '📈' },
                      { label: 'Total Attempts', value: quizData.length, color: '#ffaa00', icon: '🔄' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: `${stat.color}0a`, border: `1px solid ${stat.color}25`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{stat.icon}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: stat.color, textShadow: `0 0 12px ${stat.color}` }}>{stat.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Student table */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(0,245,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px', gap: '0', padding: '10px 16px', background: 'rgba(0,245,255,0.05)', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                      <span>STUDENT</span><span>PROGRESS</span><span>QUIZ</span><span>LAST SEEN</span><span></span>
                    </div>
                    {students.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        No students yet. Share the app with your class!
                      </div>
                    ) : (
                      students.map(({ progress: p, quiz }) => {
                        const pct = Math.round((p.completed_sections.length / TOTAL_SECTIONS) * 100);
                        const grade = quiz ? gradeLabel(quiz.percentage) : null;
                        return (
                          <div key={p.session_id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px', gap: '0', padding: '12px 16px', borderTop: '1px solid rgba(0,245,255,0.06)', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,245,255,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div>
                              <div style={{ color: 'var(--text-bright)', fontWeight: 600, fontSize: '0.9rem' }}>{p.student_name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{p.session_id.slice(0, 8)}…</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8rem', color: pct === 100 ? 'var(--neon-green)' : 'var(--neon-cyan)', marginBottom: '4px' }}>
                                {p.completed_sections.length}/{TOTAL_SECTIONS} ({pct}%)
                              </div>
                              <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--neon-green)' : 'var(--neon-cyan)', borderRadius: '2px', transition: 'width 0.4s' }} />
                              </div>
                            </div>
                            <div>
                              {grade ? (
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: grade.color, textShadow: `0 0 8px ${grade.color}` }}>
                                  {grade.label} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{Math.round(quiz!.percentage)}%</span>
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                              )}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                              {timeAgo(p.last_updated)}
                            </div>
                            <button
                              onClick={() => { setSelectedStudent(p.session_id); setActiveTab('detail'); }}
                              style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '6px', color: 'var(--neon-cyan)', cursor: 'pointer', padding: '5px 10px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}
                            >
                              Detail →
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ── QUIZ RESULTS TAB ── */}
              {activeTab === 'quiz' && (
                <div>
                  <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    {quizData.length} total attempts from {studentsWithQuiz} student{studentsWithQuiz !== 1 ? 's' : ''}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(0,245,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 1fr 1fr 1fr', padding: '10px 16px', background: 'rgba(0,245,255,0.05)', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                      <span>STUDENT</span><span>GRADE</span><span>SCORE</span><span>TIME</span><span>DATE</span>
                    </div>
                    {quizData.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        No quiz submissions yet.
                      </div>
                    ) : quizData.map(q => {
                      const grade = gradeLabel(q.percentage);
                      return (
                        <div key={q.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 1fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid rgba(0,245,255,0.06)', alignItems: 'center' }}>
                          <div style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{q.student_name}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: grade.color, textShadow: `0 0 8px ${grade.color}` }}>{grade.label}</div>
                          <div style={{ color: grade.color, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                            {q.score}/{q.total} <span style={{ color: 'var(--text-muted)' }}>({Math.round(q.percentage)}%)</span>
                          </div>
                          <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDuration(q.time_taken)}</div>
                          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{timeAgo(q.completed_at)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── DETAIL TAB ── */}
              {activeTab === 'detail' && (
                <div>
                  {!detailStudent ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Select a student from the Overview tab to see their detail.
                    </div>
                  ) : (
                    <div>
                      {/* Student header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px 20px', background: 'rgba(0,245,255,0.04)', borderRadius: '12px', border: '1px solid rgba(0,245,255,0.12)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,245,255,0.1)', border: '2px solid rgba(0,245,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                          👤
                        </div>
                        <div>
                          <div style={{ fontSize: '1.2rem', color: 'var(--text-bright)', fontWeight: 700 }}>{detailStudent.progress.student_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Session: {detailStudent.progress.session_id} · Last active: {timeAgo(detailStudent.progress.last_updated)}
                          </div>
                        </div>
                      </div>

                      {/* Progress grid */}
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--neon-cyan)', letterSpacing: '0.1em', marginBottom: '12px' }}>LESSON PROGRESS</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', marginBottom: '24px' }}>
                        {Object.entries(SECTION_LABELS).map(([id, label]) => {
                          const done = detailStudent.progress.completed_sections.includes(id);
                          return (
                            <div key={id} style={{ padding: '8px 12px', borderRadius: '8px', background: done ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${done ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.9rem' }}>{done ? '✅' : '⬜'}</span>
                              <span style={{ fontSize: '0.75rem', color: done ? 'var(--neon-green)' : 'var(--text-muted)' }}>{label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quiz attempts */}
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--neon-cyan)', letterSpacing: '0.1em', marginBottom: '12px' }}>QUIZ ATTEMPTS ({detailStudent.allQuizzes.length})</h4>
                      {detailStudent.allQuizzes.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>No quiz attempts yet.</div>
                      ) : detailStudent.allQuizzes.map((q, idx) => {
                        const grade = gradeLabel(q.percentage);
                        return (
                          <div key={q.id} style={{ padding: '16px 20px', marginBottom: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${grade.color}20` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attempt #{idx + 1} · {timeAgo(q.completed_at)}</span>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: grade.color, textShadow: `0 0 10px ${grade.color}` }}>
                                {grade.label} — {q.score}/{q.total} ({Math.round(q.percentage)}%) · {formatDuration(q.time_taken)}
                              </span>
                            </div>
                            {/* Per-question breakdown */}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {q.answers.map((ans, i) => {
                                // We store question_order so we can map back to original question
                                const correct = ans !== -1 && ans !== undefined;
                                // We don't have QUIZ_QUESTIONS here (server component), colour by score proxy
                                return (
                                  <div key={i} style={{ width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', background: ans === -1 ? 'rgba(255,255,255,0.05)' : correct ? 'rgba(0,245,255,0.1)' : 'rgba(0,245,255,0.1)', border: `1px solid rgba(0,245,255,0.2)`, color: 'var(--text-muted)' }}
                                    title={`Q${i + 1}: answered ${ans === -1 ? 'nothing' : String.fromCharCode(65 + ans)}`}
                                  >
                                    {i + 1}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
