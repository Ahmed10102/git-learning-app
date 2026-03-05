'use client';

import { NAV_SECTIONS } from '@/lib/data';
import type { Section, Progress } from '@/lib/types';

interface SidebarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  progress: Progress;
}

const COMMAND_SECTIONS = ['git-init','git-status','git-add','git-commit','git-log','git-branch','git-merge','gitignore','git-clone','git-remote','git-push-pull'];

export default function Sidebar({ activeSection, onNavigate, progress }: SidebarProps) {
  const completedSet = new Set(progress.completedSections);
  const commandCount = COMMAND_SECTIONS.filter(s => completedSet.has(s as Section)).length;
  const totalProgress = Math.round((progress.completedSections.length / NAV_SECTIONS.length) * 100);

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      background: 'rgba(3, 5, 16, 0.92)',
      borderRight: '1px solid rgba(0,245,255,0.1)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(191,0,255,0.2))',
            border: '1px solid rgba(0,245,255,0.4)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 15px rgba(0,245,255,0.3)',
            flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-cyan)', letterSpacing: '0.1em', textShadow: '0 0 8px var(--neon-cyan)' }}>
              GIT ACADEMY
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              CYBER EDITION
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PROGRESS</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>{totalProgress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${totalProgress}%` }} />
        </div>
        {commandCount > 0 && (
          <div style={{ marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {commandCount}/{COMMAND_SECTIONS.length} commands learned
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px', flex: 1 }}>
        {/* Sections */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{ padding: '8px 10px 4px', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            LEARN
          </div>
          {NAV_SECTIONS.slice(0, 4).map(s => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id as Section)}
              className={`sidebar-item ${activeSection === s.id ? 'active' : ''} ${completedSet.has(s.id as Section) ? 'completed' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{s.icon}</span>
              <span>{s.label}</span>
              {completedSet.has(s.id as Section) && (
                <span className="check-mark" style={{ marginLeft: 'auto', color: 'var(--neon-green)', fontSize: '0.8rem', opacity: 0.8 }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Commands */}
        <div style={{ marginBottom: '4px', marginTop: '8px' }}>
          <div style={{ padding: '8px 10px 4px', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            COMMANDS
          </div>
          {NAV_SECTIONS.slice(4, 15).map(s => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id as Section)}
              className={`sidebar-item ${activeSection === s.id ? 'active' : ''} ${completedSet.has(s.id as Section) ? 'completed' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
            >
              <span style={{ fontSize: '12px', flexShrink: 0 }}>{s.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.label}</span>
              {completedSet.has(s.id as Section) && (
                <span className="check-mark" style={{ marginLeft: 'auto', color: 'var(--neon-green)', fontSize: '0.8rem', opacity: 0.8 }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Practice & Quiz */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ padding: '8px 10px 4px', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            PRACTICE
          </div>
          {NAV_SECTIONS.slice(15).map(s => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id as Section)}
              className={`sidebar-item ${activeSection === s.id ? 'active' : ''} ${completedSet.has(s.id as Section) ? 'completed' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{s.icon}</span>
              <span>{s.label}</span>
              {completedSet.has(s.id as Section) && (
                <span className="check-mark" style={{ marginLeft: 'auto', color: 'var(--neon-green)', fontSize: '0.8rem', opacity: 0.8 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,245,255,0.08)', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
        Git & GitHub Cyber Academy
      </div>
    </aside>
  );
}
