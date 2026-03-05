'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MatrixBackground from '@/components/ui/MatrixBackground';
import Sidebar from '@/components/ui/Sidebar';
import CommandLesson from '@/components/ui/CommandLesson';
import Hero from '@/components/sections/Hero';
import History from '@/components/sections/History';
import Concepts from '@/components/sections/Concepts';
import GitHubSection from '@/components/sections/GitHubSection';
import NextSteps from '@/components/sections/NextSteps';
import { COMMANDS } from '@/lib/data';
import { useProgress } from '@/lib/useProgress';
import type { Section } from '@/lib/types';

// Heavy components loaded dynamically (bundle optimization per vercel-react-best-practices)
const GitPlayground = dynamic(
  () => import('@/components/playground/GitPlayground'),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>⚡ Loading Git Engine...</div>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(0,245,255,0.2)',
          borderTop: '3px solid var(--neon-cyan)',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin-slow 1s linear infinite',
        }} />
      </div>
    ),
  }
);

const Quiz = dynamic(
  () => import('@/components/quiz/Quiz'),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>⏳ Loading Quiz...</div>
      </div>
    ),
  }
);

const COMMAND_SECTIONS: Section[] = [
  'git-init', 'git-status', 'git-add', 'git-commit', 'git-log',
  'git-branch', 'git-merge', 'gitignore', 'git-clone', 'git-remote', 'git-push-pull'
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('hero');
  const [playgroundCmd, setPlaygroundCmd] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { progress, markCompleted, saveQuizResult } = useProgress();

  const handleNavigate = useCallback((section: Section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTryInPlayground = useCallback((cmd: string) => {
    setPlaygroundCmd(cmd);
    setActiveSection('playground');
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCommandComplete = useCallback((section: Section) => {
    markCompleted(section);
    const idx = COMMAND_SECTIONS.indexOf(section);
    if (idx >= 0 && idx < COMMAND_SECTIONS.length - 1) {
      setTimeout(() => handleNavigate(COMMAND_SECTIONS[idx + 1]), 400);
    } else if (section === 'git-push-pull') {
      setTimeout(() => handleNavigate('playground'), 400);
    }
  }, [markCompleted, handleNavigate]);

  const renderContent = () => {
    switch (activeSection) {
      case 'hero':
        return <Hero onStart={() => handleNavigate('history')} onPlayground={() => handleNavigate('playground')} />;

      case 'history':
        return (
          <History
            onComplete={() => {
              markCompleted('history');
              handleNavigate('concepts');
            }}
          />
        );

      case 'concepts':
        return (
          <Concepts
            onComplete={() => {
              markCompleted('concepts');
              handleNavigate('github');
            }}
          />
        );

      case 'github':
        return (
          <GitHubSection
            onComplete={() => {
              markCompleted('github');
              handleNavigate('git-init');
            }}
          />
        );

      case 'playground':
        return (
          <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
            <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '20px', borderColor: 'rgba(0,245,255,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2rem' }}>⚡</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', color: 'var(--neon-cyan)', letterSpacing: '0.05em' }}>
                  Live Git Playground
                </h1>
              </div>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Real Git running in your browser — powered by isomorphic-git + LightningFS (IndexedDB). Type commands, create files, make commits, create branches. It all really works!
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                {['git init', 'touch README.md', 'git add .', 'git commit -m "msg"', 'git branch', 'git log --oneline'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => setPlaygroundCmd(cmd)}
                    className="btn-neon-cyan"
                    style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem' }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
            <GitPlayground key={playgroundCmd} initialCommand={playgroundCmd} />
          </div>
        );

      case 'quiz':
        return (
          <div style={{ paddingBottom: '40px' }}>
            <div className="glass-card" style={{ padding: '20px 28px', borderColor: 'rgba(0,245,255,0.3)', maxWidth: '700px', margin: '0 auto 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>🎯</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', color: 'var(--neon-cyan)', letterSpacing: '0.05em' }}>
                  Final Quiz — 20 Questions
                </h1>
              </div>
            </div>
            <Quiz
              onComplete={(result) => {
                saveQuizResult(result);
                markCompleted('quiz');
              }}
              existingResult={progress.quizResult}
            />
          </div>
        );

      case 'next-steps':
        return (
          <NextSteps
            onComplete={() => markCompleted('next-steps')}
          />
        );

      default:
        if (COMMAND_SECTIONS.includes(activeSection)) {
          const command = COMMANDS.find(c => c.id === activeSection);
          if (!command) return null;
          return (
            <CommandLesson
              command={command}
              onComplete={() => handleCommandComplete(activeSection)}
              onTryInPlayground={handleTryInPlayground}
              isCompleted={progress.completedSections.includes(activeSection)}
            />
          );
        }
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Animated matrix background */}
      <MatrixBackground />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,100,200,0.12) 0%, transparent 70%)',
          'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(191,0,255,0.06) 0%, transparent 60%)',
          'radial-gradient(ellipse 40% 30% at 10% 60%, rgba(0,245,255,0.04) 0%, transparent 50%)',
        ].join(', '),
      }} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 45,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar navigation */}
      <div
        className={`sidebar-wrapper${sidebarOpen ? ' sidebar-open' : ''}`}
      >
        <Sidebar
          activeSection={activeSection}
          onNavigate={handleNavigate}
          progress={progress}
        />
      </div>

      {/* Main content area */}
      <main
        id="main-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1,
          height: '100vh',
        }}
      >
        {/* Sticky top bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(3,5,16,0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,245,255,0.08)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Hamburger — visible on mobile only via CSS class */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="hamburger-btn"
              aria-label="Toggle navigation"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,245,255,0.25)',
                borderRadius: '6px',
                color: 'var(--neon-cyan)',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '1.1rem',
                lineHeight: 1,
              }}
            >
              ☰
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>~/git-academy</span>
            <span style={{ color: 'rgba(0,245,255,0.3)', fontFamily: 'var(--font-mono)' }}>/</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--neon-cyan)', textShadow: '0 0 8px rgba(0,245,255,0.5)' }}>
              {activeSection}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleNavigate('playground')}
              className="btn-neon-cyan"
              style={{ padding: '5px 14px', borderRadius: '8px' }}
            >
              ⚡ Playground
            </button>
            <button
              onClick={() => handleNavigate('quiz')}
              className="btn-neon-purple"
              style={{ padding: '5px 14px', borderRadius: '8px' }}
              data-section="quiz"
            >
              🎯 Quiz
            </button>
          </div>
        </div>

        {/* Section content */}
        <div style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
