'use client';

interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 0 40px' }}>
      {/* Main Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        {/* Animated badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0,245,255,0.08)',
          border: '1px solid rgba(0,245,255,0.25)',
          borderRadius: '30px',
          padding: '6px 18px',
          marginBottom: '28px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--neon-cyan)',
          boxShadow: '0 0 20px rgba(0,245,255,0.15)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', animation: 'neon-pulse 2s ease-in-out infinite', display: 'inline-block' }} />
          CYBER ACADEMY — LIVE GIT IN YOUR BROWSER
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 6vw, 3.8rem)',
          lineHeight: 1.1,
          marginBottom: '20px',
          letterSpacing: '-0.01em',
        }}>
          <span className="gradient-text-cyber">Git & GitHub</span>
          <br />
          <span style={{ color: 'var(--text-bright)', fontSize: '0.75em' }}>for Absolute Beginners</span>
        </h1>

        <p style={{
          color: 'var(--text-dim)',
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          lineHeight: 1.7,
          maxWidth: '580px',
          margin: '0 auto 32px',
        }}>
          The most immersive way to learn Git — ever. Run real Git commands in your browser, explore interactive lessons, and earn a certificate. No installation needed.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onStart}
            className="btn-neon-cyan"
            style={{ padding: '14px 32px', borderRadius: '14px', fontSize: '1rem', fontWeight: 600 }}
          >
            ⚡ Start Learning Now
          </button>
          <button
            onClick={() => document.getElementById('playground-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-neon-purple"
            style={{ padding: '14px 32px', borderRadius: '14px', fontSize: '1rem' }}
          >
            ▶ Try Playground
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {[
          {
            icon: '⚡',
            title: 'Real Git in Browser',
            desc: 'Powered by isomorphic-git + LightningFS. Real commands, real commits, real branches.',
            color: 'var(--neon-cyan)',
          },
          {
            icon: '🎓',
            title: '11 Full Lessons',
            desc: 'Every essential command from git init to git push, with analogies and examples.',
            color: 'var(--neon-purple)',
          },
          {
            icon: '🎯',
            title: '20-Question Quiz',
            desc: 'Test your knowledge with a timed quiz and earn a downloadable certificate.',
            color: 'var(--neon-green)',
          },
          {
            icon: '🚀',
            title: 'Zero Experience Needed',
            desc: 'Written for total beginners. No jargon, just clear explanations and real examples.',
            color: 'var(--neon-pink)',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="glass-card"
            style={{
              padding: '20px',
              borderColor: `${card.color}25`,
              background: `linear-gradient(135deg, ${card.color}08, rgba(5,8,25,0.8))`,
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{card.icon}</div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              color: card.color,
              marginBottom: '6px',
              letterSpacing: '0.05em',
              textShadow: `0 0 10px ${card.color}`,
            }}>
              {card.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* What you'll learn */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          color: 'var(--neon-cyan)',
          marginBottom: '16px',
          letterSpacing: '0.1em',
        }}>
          WHAT YOU'LL MASTER
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {[
            '📖 The origin story of Git',
            '🧠 How Git actually works',
            '🐙 Git vs GitHub explained',
            '🚀 git init — start a repo',
            '🔍 git status — see changes',
            '📦 git add — stage files',
            '💾 git commit — save snapshots',
            '📜 git log — view history',
            '🌿 git branch — parallel work',
            '🔀 git merge — combine work',
            '🙈 .gitignore — exclude files',
            '📥 git clone — download repos',
            '🌐 git remote — connect to GitHub',
            '⬆️ git push & pull — sync work',
          ].map(item => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(0,245,255,0.04)',
                color: 'var(--text-dim)',
                fontSize: '0.82rem',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
