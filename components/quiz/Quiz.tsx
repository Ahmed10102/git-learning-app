'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QUIZ_QUESTIONS } from '@/lib/data';
import type { QuizResult } from '@/lib/types';
import { getSessionId } from '@/lib/supabase';

interface QuizProps {
  onComplete: (result: QuizResult) => void;
  existingResult?: QuizResult;
}

type QuizPhase = 'intro' | 'running' | 'finished';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({ onComplete, existingResult }: QuizProps) {
  const [phase, setPhase] = useState<QuizPhase>(existingResult ? 'finished' : 'intro');
  const [name, setName] = useState(existingResult?.name || '');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(existingResult || null);
  // questionOrder holds the shuffled indices into QUIZ_QUESTIONS
  const [questionOrder, setQuestionOrder] = useState<number[]>(
    existingResult?.questionOrder ?? QUIZ_QUESTIONS.map((_, i) => i)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const orderedQuestion = QUIZ_QUESTIONS[questionOrder[currentQ]];

  const finishQuiz = useCallback(async (answers: number[], timeTaken: number, quizName: string, order: number[]) => {
    const score = answers.reduce((acc, ans, i) => {
      return acc + (ans === QUIZ_QUESTIONS[order[i]].correctIndex ? 1 : 0);
    }, 0);

    const quizResult: QuizResult = {
      name: quizName,
      score,
      total: QUIZ_QUESTIONS.length,
      timeTaken,
      answers,
      questionOrder: order,
      completedAt: new Date().toISOString(),
    };

    if (intervalRef.current) clearInterval(intervalRef.current);

    // Save to Supabase via server-side API route (avoids client unmount / env var issues)
    try {
      const sessionId = getSessionId();
      const payload = {
        student_name: quizName,
        session_id: sessionId,
        score,
        total: QUIZ_QUESTIONS.length,
        time_taken: timeTaken,
        answers,
        question_order: order,
      };
      fetch('/api/save-result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(e => console.warn('Quiz save failed:', e));
    } catch (e) {
      console.warn('Quiz save failed:', e);
    }

    setResult(quizResult);
    setPhase('finished');
    onComplete(quizResult);
  }, [onComplete]);

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            const padded = [...selectedAnswers, ...Array(QUIZ_QUESTIONS.length - selectedAnswers.length).fill(-1)];
            finishQuiz(padded, timeTaken, name, questionOrder);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startQuiz = () => {
    if (!name.trim()) return;
    const order = shuffleArray(QUIZ_QUESTIONS.map((_, i) => i));
    setQuestionOrder(order);
    setPhase('running');
    setCurrentQ(0);
    setSelectedAnswers([]);
    setAnswered(false);
    setTimeLeft(40 * 60);
    setStartTime(Date.now());
  };

  const selectAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswers(prev => [...prev, idx]);
    setAnswered(true);
  };

  const nextQuestion = () => {
    if (currentQ >= QUIZ_QUESTIONS.length - 1) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      finishQuiz(selectedAnswers, timeTaken, name, questionOrder);
    } else {
      setCurrentQ(q => q + 1);
      setAnswered(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentAnswer = selectedAnswers[currentQ];
  const isCorrect = answered && currentAnswer === orderedQuestion?.correctIndex;

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (phase === 'finished' && result) {
    const pct = Math.round((result.score / result.total) * 100);
    const grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'F';
    const gradeColor = pct >= 80 ? 'var(--neon-green)' : pct >= 60 ? 'var(--neon-cyan)' : '#ff4466';
    const mins = Math.floor(result.timeTaken / 60);
    const secs = result.timeTaken % 60;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Score Header */}
        <div className="glass-card holo-card" style={{ padding: '32px', marginBottom: '20px', textAlign: 'center', borderColor: `${gradeColor}40` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '16px', letterSpacing: '0.15em' }}>
            MISSION COMPLETE — CYBER ACADEMY
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              border: `3px solid ${gradeColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 30px ${gradeColor}60`, background: `${gradeColor}15`,
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: gradeColor, textShadow: `0 0 15px ${gradeColor}` }}>
                {grade}
              </span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: gradeColor, marginBottom: '8px', textShadow: `0 0 15px ${gradeColor}` }}>
                {result.name}
              </h2>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: gradeColor }}>
                {result.score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {result.total}</span>
              </div>
              <div style={{ color: gradeColor, fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>{pct}% Correct</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { label: 'Correct', value: result.score.toString(), color: 'var(--neon-green)' },
              { label: 'Wrong', value: (result.total - result.score).toString(), color: '#ff4466' },
              { label: 'Time', value: `${mins}m ${secs}s`, color: 'var(--neon-cyan)' },
            ].map(s => (
              <div key={s.label} className="glass-panel" style={{ padding: '10px 20px', minWidth: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '1.3rem', color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setPhase('intro'); setSelectedAnswers([]); setCurrentQ(0); setAnswered(false); }}
              className="btn-neon-cyan"
              style={{ padding: '10px 24px', borderRadius: '12px' }}
            >
              ↺ Retake Quiz
            </button>
            <button
              onClick={() => generateCertificate(result)}
              className="btn-neon-green"
              style={{ padding: '10px 24px', borderRadius: '12px' }}
            >
              🏆 Download Report & Certificate
            </button>
          </div>
        </div>

        {/* Answer Review */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '12px', letterSpacing: '0.1em' }}>
            REVIEW YOUR ANSWERS
          </h3>
          {result.questionOrder.map((qIdx, i) => {
            const q = QUIZ_QUESTIONS[qIdx];
            const userAnswer = result.answers[i];
            const correct = userAnswer === q.correctIndex;
            return (
              <div key={q.id} className="glass-card" style={{
                padding: '16px 20px', marginBottom: '10px',
                borderColor: correct ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,102,0.25)',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ color: correct ? 'var(--neon-green)' : '#ff4466', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', flexShrink: 0 }}>
                    {correct ? '✓' : '✗'} Q{i + 1}.
                  </span>
                  <span style={{ color: 'var(--text-bright)', fontSize: '0.9rem', fontWeight: 500 }}>{q.question}</span>
                </div>
                {!correct && (
                  <div style={{ marginLeft: '32px', marginBottom: '6px' }}>
                    <span style={{ color: '#ff4466', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      Your answer: {userAnswer >= 0 ? q.options[userAnswer] : 'No answer (timed out)'}
                    </span>
                    <br />
                    <span style={{ color: 'var(--neon-green)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      Correct: {q.options[q.correctIndex]}
                    </span>
                  </div>
                )}
                <div style={{ marginLeft: '32px', background: 'rgba(0,128,255,0.06)', border: '1px solid rgba(0,128,255,0.15)', borderRadius: '8px', padding: '8px 12px' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5 }}>💡 {q.explanation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card holo-card" style={{ padding: '32px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--neon-cyan)', marginBottom: '8px', letterSpacing: '0.05em' }}>
            FINAL QUIZ
          </h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '8px', lineHeight: 1.6 }}>
            40 multiple-choice questions — randomised every attempt.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '16px 0', flexWrap: 'wrap' }}>
            {[{ icon: '⏱️', text: '40 min limit' }, { icon: '🔀', text: 'Random order' }, { icon: '🏆', text: 'Get a certificate' }].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.1em' }}>
            ENTER YOUR NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && startQuiz()}
            placeholder="Your name here..."
            style={{
              width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,255,0.3)',
              borderRadius: '10px', padding: '12px 16px', color: 'var(--text-bright)',
              fontFamily: 'var(--font-body)', fontSize: '1rem', outline: 'none', marginBottom: '16px',
            }}
          />
          <button
            onClick={startQuiz}
            disabled={!name.trim()}
            className="btn-neon-cyan"
            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: name.trim() ? 1 : 0.5, cursor: name.trim() ? 'pointer' : 'not-allowed' }}
          >
            🚀 Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // ── RUNNING ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <span style={{ marginLeft: '12px', fontSize: '0.75rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', background: 'rgba(0,245,255,0.08)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0,245,255,0.2)' }}>
            {orderedQuestion.category}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: timeLeft < 60 ? '#ff4466' : timeLeft < 300 ? '#ffaa00' : 'var(--neon-cyan)', textShadow: `0 0 10px ${timeLeft < 60 ? '#ff4466' : 'var(--neon-cyan)'}` }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: '20px' }}>
        <div className="progress-fill" style={{ width: `${(currentQ / QUIZ_QUESTIONS.length) * 100}%` }} />
      </div>

      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '16px' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-bright)', lineHeight: 1.7, fontWeight: 500 }}>
          {orderedQuestion.question}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {orderedQuestion.options.map((option, i) => {
          let className = 'quiz-option';
          if (answered) {
            if (i === orderedQuestion.correctIndex) className += ' correct';
            else if (i === currentAnswer && currentAnswer !== orderedQuestion.correctIndex) className += ' incorrect';
          } else if (i === currentAnswer) {
            className += ' selected';
          }
          return (
            <button key={i} className={className} onClick={() => selectAnswer(i)} disabled={answered}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '10px', fontSize: '0.85rem' }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div className="glass-card" style={{
            padding: '16px 20px', marginBottom: '16px',
            borderColor: isCorrect ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,102,0.3)',
            background: isCorrect ? 'rgba(0,255,136,0.05)' : 'rgba(255,68,102,0.05)',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{isCorrect ? '✅' : '❌'}</span>
              <div>
                <div style={{ color: isCorrect ? 'var(--neon-green)' : '#ff4466', fontWeight: 600, marginBottom: '4px' }}>
                  {isCorrect ? 'Correct!' : 'Not quite!'}
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {orderedQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
          <button onClick={nextQuestion} className="btn-neon-cyan" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem' }}>
            {currentQ >= QUIZ_QUESTIONS.length - 1 ? '🏁 See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── CERTIFICATE + REPORT ────────────────────────────────────────────────────
async function generateCertificate(result: QuizResult) {
  try {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const cx = w / 2;

    const pct = Math.round((result.score / result.total) * 100);
    const grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'F';
    const mins = Math.floor(result.timeTaken / 60);
    const secs = result.timeTaken % 60;
    const dateStr = new Date(result.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Helper: dark page background ──────────────────────────────────────────
    const darkBg = () => {
      doc.setFillColor(2, 4, 16);
      doc.rect(0, 0, w, h, 'F');
    };

    // ── Helper: draw subtle grid overlay ─────────────────────────────────────
    const drawGrid = () => {
      doc.setDrawColor(0, 40, 55);
      doc.setLineWidth(0.1);
      for (let x = 0; x <= w; x += 10) doc.line(x, 0, x, h);
      for (let y = 0; y <= h; y += 10) doc.line(0, y, w, y);
    };

    // ── Helper: truncate text to fit ─────────────────────────────────────────
    const truncate = (text: string, maxLen: number) =>
      text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 1 — REPORT SUMMARY + QUESTION BREAKDOWN
    // ════════════════════════════════════════════════════════════════════════
    darkBg();
    drawGrid();

    // Outer border
    doc.setDrawColor(0, 200, 220);
    doc.setLineWidth(1.5);
    doc.roundedRect(5, 5, w - 10, h - 10, 3, 3, 'S');
    doc.setDrawColor(191, 0, 255);
    doc.setLineWidth(0.4);
    doc.roundedRect(8, 8, w - 16, h - 16, 2, 2, 'S');

    // Title bar
    doc.setFillColor(0, 20, 35);
    doc.rect(8, 8, w - 16, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 245, 255);
    doc.text('GIT CYBER ACADEMY  —  QUIZ REPORT', cx, 18, { align: 'center' });

    // Summary row
    const sy = 32;
    const summaryItems = [
      { label: 'STUDENT', value: result.name },
      { label: 'SCORE', value: `${result.score} / ${result.total}` },
      { label: 'PERCENTAGE', value: `${pct}%` },
      { label: 'GRADE', value: grade },
      { label: 'TIME', value: `${mins}m ${secs}s` },
      { label: 'DATE', value: dateStr },
    ];
    const colW = (w - 20) / summaryItems.length;
    summaryItems.forEach((item, i) => {
      const x = 10 + i * colW + colW / 2;
      doc.setFillColor(0, 15, 25);
      doc.setDrawColor(0, 120, 140);
      doc.setLineWidth(0.3);
      doc.roundedRect(10 + i * colW, sy - 6, colW - 2, 14, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(80, 140, 160);
      doc.text(item.label, x, sy - 0.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 245, 255);
      doc.text(truncate(item.value, 20), x, sy + 5, { align: 'center' });
    });

    // Column headers for question table
    const tableTop = sy + 14;
    const colWidths = [10, 8, 75, 65, 20, 18];
    const colX = [10, 20, 28, 103, 168, 186];
    const headers = ['Q#', '✓/✗', 'Question', 'Your Answer / Correct Answer', 'Category', 'Pts'];

    doc.setFillColor(0, 30, 45);
    doc.rect(10, tableTop, w - 20, 8, 'F');
    headers.forEach((hdr, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(0, 200, 220);
      doc.text(hdr, colX[i] + colWidths[i] / 2, tableTop + 5, { align: 'center' });
    });

    // Rows — fit as many as possible on this page
    const rowH = 9;
    const maxRowsPage1 = Math.floor((h - tableTop - 20) / rowH);
    const totalQ = result.questionOrder.length;

    const drawRow = (qi: number, rowY: number) => {
      const qIdx = result.questionOrder[qi];
      const q = QUIZ_QUESTIONS[qIdx];
      const userAns = result.answers[qi];
      const correct = userAns === q.correctIndex;

      // Row bg
      doc.setFillColor(correct ? 0 : 30, correct ? 12 : 0, correct ? 0 : 0);
      doc.setGState(doc.GState({ opacity: 0.4 }));
      doc.rect(10, rowY, w - 20, rowH - 1, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));

      // Q number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(120, 160, 200);
      doc.text(`${qi + 1}`, colX[0] + colWidths[0] / 2, rowY + 5.5, { align: 'center' });

      // Tick / cross
      doc.setTextColor(correct ? 0 : 255, correct ? 200 : 60, correct ? 80 : 80);
      doc.text(correct ? '✓' : '✗', colX[1] + colWidths[1] / 2, rowY + 5.5, { align: 'center' });

      // Question text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(200, 220, 240);
      doc.text(truncate(q.question, 72), colX[2], rowY + 5.5);

      // Answer column
      if (correct) {
        doc.setTextColor(0, 200, 100);
        doc.text(truncate(q.options[userAns], 58), colX[3], rowY + 5.5);
      } else {
        const yourLabel = userAns >= 0 ? truncate(q.options[userAns], 26) : 'Timed out';
        const correctLabel = truncate(q.options[q.correctIndex], 26);
        doc.setTextColor(255, 80, 100);
        doc.text(`✗ ${yourLabel}`, colX[3], rowY + 3.5, { maxWidth: colWidths[3] });
        doc.setTextColor(0, 200, 100);
        doc.text(`✓ ${correctLabel}`, colX[3], rowY + 7.5, { maxWidth: colWidths[3] });
      }

      // Category
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 160, 200);
      doc.text(truncate(q.category, 14), colX[4] + colWidths[4] / 2, rowY + 5.5, { align: 'center' });

      // Points
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(correct ? 0 : 255, correct ? 220 : 80, correct ? 100 : 80);
      doc.text(correct ? '1' : '0', colX[5] + colWidths[5] / 2, rowY + 5.5, { align: 'center' });

      // Divider
      doc.setDrawColor(0, 40, 55);
      doc.setLineWidth(0.2);
      doc.line(10, rowY + rowH - 0.5, w - 10, rowY + rowH - 0.5);
    };

    // Draw rows for page 1
    const page1Rows = Math.min(maxRowsPage1, totalQ);
    for (let i = 0; i < page1Rows; i++) {
      drawRow(i, tableTop + 8 + i * rowH);
    }

    // ── Continue on page 2 if more questions remain ────────────────────────
    if (totalQ > page1Rows) {
      doc.addPage();
      darkBg();
      drawGrid();
      doc.setDrawColor(0, 200, 220);
      doc.setLineWidth(1.5);
      doc.roundedRect(5, 5, w - 10, h - 10, 3, 3, 'S');
      doc.setDrawColor(191, 0, 255);
      doc.setLineWidth(0.4);
      doc.roundedRect(8, 8, w - 16, h - 16, 2, 2, 'S');

      // Continuation header
      doc.setFillColor(0, 20, 35);
      doc.rect(8, 8, w - 16, 16, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 245, 255);
      doc.text('GIT CYBER ACADEMY  —  QUIZ REPORT (continued)', cx, 18, { align: 'center' });

      // Column headers again
      const p2TableTop = 28;
      doc.setFillColor(0, 30, 45);
      doc.rect(10, p2TableTop, w - 20, 8, 'F');
      headers.forEach((hdr, i) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(0, 200, 220);
        doc.text(hdr, colX[i] + colWidths[i] / 2, p2TableTop + 5, { align: 'center' });
      });

      const maxRowsPage2 = Math.floor((h - p2TableTop - 20) / rowH);
      const page2End = Math.min(page1Rows + maxRowsPage2, totalQ);
      for (let i = page1Rows; i < page2End; i++) {
        drawRow(i, p2TableTop + 8 + (i - page1Rows) * rowH);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // FINAL PAGE — CERTIFICATE
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    darkBg();

    // Subtle grid lines
    doc.setDrawColor(0, 60, 80);
    doc.setLineWidth(0.15);
    for (let x = 0; x <= w; x += 12) { doc.line(x, 0, x, h); }
    for (let y = 0; y <= h; y += 12) { doc.line(0, y, w, y); }

    // Re-darken over grid for cleaner look
    doc.setFillColor(2, 4, 16);
    doc.setGState(doc.GState({ opacity: 0.7 }));
    doc.rect(0, 0, w, h, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    // ── Outer glow border ──
    doc.setDrawColor(0, 200, 220);
    doc.setLineWidth(3);
    doc.roundedRect(6, 6, w - 12, h - 12, 4, 4, 'S');
    doc.setDrawColor(0, 245, 255);
    doc.setLineWidth(0.8);
    doc.roundedRect(9, 9, w - 18, h - 18, 3, 3, 'S');

    // Inner thin accent border
    doc.setDrawColor(191, 0, 255);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, 12, w - 24, h - 24, 2, 2, 'S');

    // ── Corner ornaments ──
    const drawCorner = (x: number, y: number, flipX: boolean, flipY: boolean) => {
      const sx = flipX ? -1 : 1;
      const sy = flipY ? -1 : 1;
      doc.setDrawColor(0, 245, 255);
      doc.setLineWidth(1.2);
      doc.circle(x, y, 2.5, 'S');
      doc.setLineWidth(0.6);
      doc.line(x, y, x + sx * 10, y);
      doc.line(x, y, x, y + sy * 10);
      doc.setDrawColor(191, 0, 255);
      doc.setLineWidth(0.4);
      doc.circle(x, y, 4.5, 'S');
    };
    drawCorner(14, 14, false, false);
    drawCorner(w - 14, 14, true, false);
    drawCorner(14, h - 14, false, true);
    drawCorner(w - 14, h - 14, true, true);

    // ── Top decorative hex badge ──
    const hexY = 26;
    doc.setDrawColor(0, 245, 255);
    doc.setLineWidth(0.8);
    doc.circle(cx, hexY, 7, 'S');
    doc.setFillColor(0, 20, 30);
    doc.circle(cx, hexY, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 245, 255);
    doc.text('⚡', cx, hexY + 2.5, { align: 'center' });

    // Horizontal divider line after badge
    doc.setDrawColor(0, 245, 255);
    doc.setLineWidth(0.5);
    doc.line(cx - 50, hexY + 10, cx + 50, hexY + 10);

    // ── Academy name ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 245, 255);
    doc.text('G I T   C Y B E R   A C A D E M Y', cx, hexY + 17, { align: 'center' });

    // ── Main title ──
    doc.setFontSize(22);
    doc.setTextColor(220, 240, 255);
    doc.text('CERTIFICATE OF COMPLETION', cx, hexY + 30, { align: 'center' });

    // Decorative underline for title
    doc.setDrawColor(191, 0, 255);
    doc.setLineWidth(0.6);
    doc.line(cx - 65, hexY + 33, cx + 65, hexY + 33);

    // ── "This certifies that" ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 160, 200);
    doc.text('This certifies that', cx, hexY + 43, { align: 'center' });

    // ── Student name ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(0, 245, 255);
    // Glow effect via layered text
    doc.setTextColor(0, 100, 120);
    doc.text(result.name, cx + 0.5, hexY + 59.5, { align: 'center' });
    doc.setTextColor(0, 245, 255);
    doc.text(result.name, cx, hexY + 59, { align: 'center' });

    // Name underline
    const nameWidth = Math.min(result.name.length * 5.5, 140);
    doc.setDrawColor(0, 245, 255);
    doc.setLineWidth(0.8);
    doc.line(cx - nameWidth / 2, hexY + 62, cx + nameWidth / 2, hexY + 62);

    // ── "has successfully completed" ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 160, 200);
    doc.text('has successfully completed', cx, hexY + 72, { align: 'center' });

    // ── Course name ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Git & GitHub for Absolute Beginners', cx, hexY + 83, { align: 'center' });

    // ── Score badge ──
    const scoreY = hexY + 100;

    // Score pill background
    doc.setFillColor(0, 30, 40);
    doc.setDrawColor(0, 255, 136);
    doc.setLineWidth(0.8);
    doc.roundedRect(cx - 55, scoreY - 7, 110, 14, 7, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 255, 136);
    doc.text(`Score: ${result.score}/${result.total}  (${pct}%)   Grade: ${grade}`, cx, scoreY + 2, { align: 'center' });

    // ── Bottom divider ──
    const bottomY = h - 28;
    doc.setDrawColor(0, 245, 255);
    doc.setLineWidth(0.4);
    doc.line(cx - 80, bottomY, cx + 80, bottomY);

    // ── Date + signature area ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 120, 160);
    doc.text(`Issued: ${dateStr}`, cx - 40, bottomY + 7, { align: 'center' });
    doc.text('git-cyber-academy.dev', cx + 40, bottomY + 7, { align: 'center' });

    // Vertical separator between date and domain
    doc.setDrawColor(40, 80, 100);
    doc.setLineWidth(0.3);
    doc.line(cx, bottomY + 3, cx, bottomY + 10);

    doc.save(`git-report-${result.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  } catch (e) {
    console.error('PDF generation failed:', e);
    alert('PDF download failed. Try again.');
  }
}
