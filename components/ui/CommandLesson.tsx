'use client';

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import type { CommandInfo } from '@/lib/types';
import { MISSIONS } from '@/lib/missions';
import CodeBlock from './CodeBlock';
import CopyButton from './CopyButton';

// Dynamic import — MissionTerminal uses browser-only APIs (LightningFS)
const MissionTerminal = lazy(() => import('@/components/mission/MissionTerminal'));

const COLOR_MAP = {
  cyan: { text: 'var(--neon-cyan)', border: 'rgba(0,245,255,0.3)', bg: 'rgba(0,245,255,0.08)', glow: 'rgba(0,245,255,0.2)' },
  purple: { text: 'var(--neon-purple)', border: 'rgba(191,0,255,0.3)', bg: 'rgba(191,0,255,0.08)', glow: 'rgba(191,0,255,0.2)' },
  green: { text: 'var(--neon-green)', border: 'rgba(0,255,136,0.3)', bg: 'rgba(0,255,136,0.08)', glow: 'rgba(0,255,136,0.2)' },
  pink: { text: 'var(--neon-pink)', border: 'rgba(255,0,170,0.3)', bg: 'rgba(255,0,170,0.08)', glow: 'rgba(255,0,170,0.2)' },
  orange: { text: 'var(--neon-orange)', border: 'rgba(255,102,0,0.3)', bg: 'rgba(255,102,0,0.08)', glow: 'rgba(255,102,0,0.2)' },
};

interface CommandLessonProps {
  command: CommandInfo;
  onComplete: () => void;
  onTryInPlayground: (cmd: string) => void;
  isCompleted: boolean;
}

export default function CommandLesson({ command, onComplete, onTryInPlayground, isCompleted }: CommandLessonProps) {
  const colors = COLOR_MAP[command.color];
  const ref = useRef<HTMLDivElement>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const mission = MISSIONS[command.id] ?? null;

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [command.id]);

  // Close mission panel when lesson changes
  useEffect(() => {
    setMissionOpen(false);
  }, [command.id]);

  return (
    <div ref={ref} style={{ maxWidth: '860px', margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <div className="glass-card" style={{
        padding: '28px 32px',
        marginBottom: '20px',
        borderColor: colors.border,
        boxShadow: `0 0 40px ${colors.glow}, var(--glass-shadow)`,
        background: `linear-gradient(135deg, ${colors.bg}, rgba(5,8,25,0.85))`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>{command.emoji}</span>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                color: colors.text,
                textShadow: `0 0 20px ${colors.text}`,
                letterSpacing: '0.05em',
              }}>
                {command.title}
              </h1>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '600px' }}>
              {command.description}
            </p>
          </div>

          {isCompleted && (
            <div style={{
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.4)',
              borderRadius: '12px',
              padding: '8px 16px',
              color: 'var(--neon-green)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 0 15px rgba(0,255,136,0.2)',
              flexShrink: 0,
            }}>
              <span>✓</span> Completed!
            </div>
          )}
        </div>

        {/* Syntax */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.1em' }}>SYNTAX</div>
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            color: colors.text,
            fontSize: '1rem',
            boxShadow: `0 0 15px ${colors.glow}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{command.syntax}</pre>
            <CopyButton text={command.syntax} />
          </div>
        </div>
      </div>

      {/* Analogy */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '16px', borderColor: 'rgba(255,215,0,0.2)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,215,0,0.7)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.1em' }}>REAL-WORLD ANALOGY</div>
            <p style={{ color: 'var(--text-bright)', lineHeight: 1.7, fontSize: '0.95rem' }}>{command.analogy}</p>
          </div>
        </div>
      </div>

      {/* Why */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '20px', borderColor: 'rgba(0,128,255,0.2)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🎯</span>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(0,128,255,0.8)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.1em' }}>WHY YOU USE IT</div>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, fontSize: '0.95rem' }}>{command.why}</p>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--neon-cyan)', marginBottom: '12px', letterSpacing: '0.1em' }}>
          REAL-WORLD EXAMPLES
        </h2>
        {command.examples.map((ex, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px 24px', marginBottom: '12px', borderColor: 'rgba(0,245,255,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{
                background: `linear-gradient(135deg, ${colors.bg}, transparent)`,
                border: `1px solid ${colors.border}`,
                borderRadius: '20px',
                padding: '2px 12px',
                fontSize: '0.75rem',
                color: colors.text,
                fontFamily: 'var(--font-mono)',
              }}>
                Example {i + 1}
              </span>
              <span style={{ color: 'var(--text-bright)', fontWeight: 600, fontSize: '0.9rem' }}>{ex.scenario}</span>
            </div>

            <CodeBlock
              code={ex.command}
              output={ex.output}
              onTryIt={() => onTryInPlayground(ex.command.split('\n')[ex.command.split('\n').length - 1])}
            />

            <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.6, marginTop: '8px', paddingLeft: '4px' }}>
              → {ex.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '20px', borderColor: 'rgba(0,255,136,0.15)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', marginBottom: '10px', letterSpacing: '0.1em' }}>
          💬 PRO TIPS
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {command.tips.map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--neon-green)', flexShrink: 0 }}>▸</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Try it & Complete buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {command.tryItCommand && (
          <button
            onClick={() => onTryInPlayground(command.tryItCommand!)}
            className="btn-neon-purple"
            style={{ padding: '10px 20px', borderRadius: '10px' }}
          >
            ⚡ Try in Playground
          </button>
        )}
        {!isCompleted && (
          <button
            onClick={onComplete}
            className="btn-neon-green"
            style={{ padding: '10px 20px', borderRadius: '10px' }}
          >
            ✓ Mark as Learned
          </button>
        )}
        {mission && !missionOpen && (
          <button
            onClick={() => setMissionOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'rgba(191,0,255,0.12)',
              border: '1px solid rgba(191,0,255,0.45)',
              color: 'var(--neon-purple)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(191,0,255,0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            🎯 Start Mission
          </button>
        )}
      </div>

      {/* Mission Terminal */}
      {mission && missionOpen && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              color: 'var(--neon-purple)',
              letterSpacing: '0.08em',
              margin: 0,
            }}>
              {mission.scene} GUIDED MISSION
            </h2>
            <button
              onClick={() => setMissionOpen(false)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(150,180,220,0.2)',
                borderRadius: '6px',
                padding: '3px 10px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
          <Suspense fallback={
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              background: 'rgba(5,8,25,0.7)',
              borderRadius: '12px',
              border: '1px solid rgba(0,245,255,0.15)',
            }}>
              Loading mission environment...
            </div>
          }>
            <MissionTerminal
              mission={mission}
              onMissionComplete={() => {
                if (!isCompleted) onComplete();
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
