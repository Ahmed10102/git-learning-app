'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QUIZ_QUESTIONS } from '@/lib/data';
import type { QuizResult } from '@/lib/types';

interface QuizProps {
  onComplete: (result: QuizResult) => void;
  existingResult?: QuizResult;
}

type QuizPhase = 'intro' | 'running' | 'finished';

export default function Quiz({ onComplete, existingResult }: QuizProps) {
  const [phase, setPhase] = useState<QuizPhase>(existingResult ? 'finished' : 'intro');
  const [name, setName] = useState(existingResult?.name || '');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(existingResult || null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const question = QUIZ_QUESTIONS[currentQ];

  const finishQuiz = useCallback((answers: number[], timeTaken: number, quizName: string) => {
    const score = answers.reduce((acc, ans, i) => {
      return acc + (ans === QUIZ_QUESTIONS[i].correctIndex ? 1 : 0);
    }, 0);

    const quizResult: QuizResult = {
      name: quizName,
      score,
      total: QUIZ_QUESTIONS.length,
      timeTaken,
      answers,
      completedAt: new Date().toISOString(),
    };

    setResult(quizResult);
    setPhase('finished');
    onComplete(quizResult);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [onComplete]);

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            const padded = [...selectedAnswers, ...Array(QUIZ_QUESTIONS.length - selectedAnswers.length).fill(-1)];
            finishQuiz(padded, timeTaken, name);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, startTime, selectedAnswers, name, finishQuiz]);

  const startQuiz = () => {
    if (!name.trim()) return;
    setPhase('running');
    setCurrentQ(0);
    setSelectedAnswers([]);
    setAnswered(false);
    setTimeLeft(20 * 60);
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
      finishQuiz(selectedAnswers, timeTaken, name);
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
  const isCorrect = answered && currentAnswer === question?.correctIndex;

  // Score display
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
            {/* Grade badge */}
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              border: `3px solid ${gradeColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 30px ${gradeColor}60`,
              background: `${gradeColor}15`,
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
              onClick={() => {
                setPhase('intro');
                setSelectedAnswers([]);
                setCurrentQ(0);
                setAnswered(false);
              }}
              className="btn-neon-cyan px-6 py-2 rounded-xl"
            >
              ↺ Retake Quiz
            </button>
            <button
              onClick={() => generateCertificate(result)}
              className="btn-neon-green px-6 py-2 rounded-xl"
            >
              🏆 Download Certificate
            </button>
          </div>
        </div>

        {/* Answers Review */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '12px', letterSpacing: '0.1em' }}>
            REVIEW YOUR ANSWERS
          </h3>
          {QUIZ_QUESTIONS.map((q, i) => {
            const userAnswer = result.answers[i];
            const correct = userAnswer === q.correctIndex;
            return (
              <div key={q.id} className="glass-card" style={{
                padding: '16px 20px',
                marginBottom: '10px',
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

  // Intro screen
  if (phase === 'intro') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card holo-card" style={{ padding: '32px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--neon-cyan)', marginBottom: '8px', letterSpacing: '0.05em' }}>
            FINAL QUIZ
          </h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '8px', lineHeight: 1.6 }}>
            20 multiple-choice questions covering everything you've learned.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '16px 0', flexWrap: 'wrap' }}>
            {[
              { icon: '⏱️', text: '20 min limit' },
              { icon: '❓', text: '20 questions' },
              { icon: '🏆', text: 'Get a certificate' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
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
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(0,245,255,0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: 'var(--text-bright)',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              outline: 'none',
              marginBottom: '16px',
            }}
          />
          <button
            onClick={startQuiz}
            disabled={!name.trim()}
            className="btn-neon-cyan"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '1rem',
              opacity: name.trim() ? 1 : 0.5,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            🚀 Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Running
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <span style={{ marginLeft: '12px', fontSize: '0.75rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', background: 'rgba(0,245,255,0.08)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0,245,255,0.2)' }}>
            {question.category}
          </span>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          color: timeLeft < 60 ? '#ff4466' : timeLeft < 300 ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
          textShadow: `0 0 10px ${timeLeft < 60 ? '#ff4466' : 'var(--neon-cyan)'}`,
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: '20px' }}>
        <div className="progress-fill" style={{ width: `${((currentQ) / QUIZ_QUESTIONS.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '16px' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-bright)', lineHeight: 1.7, fontWeight: 500 }}>
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {question.options.map((option, i) => {
          let className = 'quiz-option';
          if (answered) {
            if (i === question.correctIndex) className += ' correct';
            else if (i === currentAnswer && currentAnswer !== question.correctIndex) className += ' incorrect';
            else className += ' ';
          } else if (i === currentAnswer) {
            className += ' selected';
          }
          return (
            <button
              key={i}
              className={className}
              onClick={() => selectAnswer(i)}
              disabled={answered}
            >
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '10px', fontSize: '0.85rem' }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation + Next */}
      {answered && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div className="glass-card" style={{
            padding: '16px 20px',
            marginBottom: '16px',
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
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={nextQuestion}
            className="btn-neon-cyan"
            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem' }}
          >
            {currentQ >= QUIZ_QUESTIONS.length - 1 ? '🏁 See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
}

async function generateCertificate(result: QuizResult) {
  try {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(1, 2, 8);
    doc.rect(0, 0, w, h, 'F');

    // Outer border
    doc.setDrawColor(0, 245, 255);
    doc.setLineWidth(2);
    doc.rect(8, 8, w - 16, h - 16);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, w - 20, h - 20);

    // Corner decorations
    const corners = [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]];
    corners.forEach(([cx, cy]) => {
      doc.setDrawColor(0, 245, 255);
      doc.setLineWidth(1.5);
      doc.circle(cx, cy, 3);
    });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 245, 255);
    doc.text('GIT CYBER ACADEMY', w / 2, 28, { align: 'center' });

    doc.setFontSize(24);
    doc.setTextColor(240, 248, 255);
    doc.text('CERTIFICATE OF COMPLETION', w / 2, 48, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(150, 180, 220);
    doc.setFont('helvetica', 'normal');
    doc.text('This certifies that', w / 2, 62, { align: 'center' });

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(0, 245, 255);
    doc.text(result.name, w / 2, 82, { align: 'center' });

    // Line
    doc.setDrawColor(0, 245, 255);
    doc.setLineWidth(0.5);
    doc.line(w / 2 - 60, 87, w / 2 + 60, 87);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(150, 180, 220);
    doc.text('has successfully completed', w / 2, 98, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(240, 248, 255);
    doc.text('Git & GitHub for Absolute Beginners', w / 2, 112, { align: 'center' });

    // Score
    const pct = Math.round((result.score / result.total) * 100);
    doc.setFontSize(13);
    doc.setTextColor(0, 255, 136);
    doc.text(`Final Score: ${result.score}/${result.total} (${pct}%)`, w / 2, 128, { align: 'center' });

    // Date
    doc.setFontSize(9);
    doc.setTextColor(100, 140, 180);
    const dateStr = new Date(result.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Issued on ${dateStr}`, w / 2, h - 22, { align: 'center' });
    doc.text('git-cyber-academy.dev', w / 2, h - 16, { align: 'center' });

    doc.save(`git-certificate-${result.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  } catch (e) {
    console.error('Certificate generation failed:', e);
    alert('Certificate download failed. Try again.');
  }
}
