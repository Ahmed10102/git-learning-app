'use client';

interface GitHubSectionProps {
  onComplete: () => void;
}

export default function GitHubSection({ onComplete }: GitHubSectionProps) {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '20px', borderColor: 'rgba(255,0,170,0.3)', background: 'linear-gradient(135deg, rgba(255,0,170,0.06), rgba(5,8,25,0.9))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '2.5rem' }}>🐙</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--neon-pink)', textShadow: '0 0 20px rgba(255,0,170,0.5)', letterSpacing: '0.05em' }}>
            What is GitHub?
          </h1>
        </div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.8, fontSize: '1rem' }}>
          One of the most common confusions for beginners: <strong style={{ color: 'var(--text-bright)' }}>Git ≠ GitHub.</strong> They're related, but very different things.
        </p>
      </div>

      {/* The Difference */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', borderColor: 'rgba(0,245,255,0.25)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>🛠️</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '8px', letterSpacing: '0.05em' }}>GIT</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '10px' }}>
            A <strong style={{ color: 'var(--text-bright)' }}>tool</strong> (software) that runs on your computer. It tracks changes, manages branches, takes snapshots.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {['Works completely offline', 'Runs on your machine', 'Free and open source', 'Created by Linus Torvalds'].map(item => (
              <li key={item} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '3px 0', display: 'flex', gap: '6px' }}>
                <span style={{ color: 'var(--neon-cyan)' }}>▸</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card" style={{ padding: '20px', borderColor: 'rgba(255,0,170,0.25)', background: 'rgba(255,0,170,0.04)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>🌐</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--neon-pink)', marginBottom: '8px', letterSpacing: '0.05em' }}>GITHUB</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '10px' }}>
            A <strong style={{ color: 'var(--text-bright)' }}>website</strong> that hosts Git repositories online. Plus tons of extra collaboration features.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {['Stores your repo in the cloud', 'Shows your code to the world', 'Owned by Microsoft (2018)', 'Has 100M+ developers'].map(item => (
              <li key={item} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '3px 0', display: 'flex', gap: '6px' }}>
                <span style={{ color: 'var(--neon-pink)' }}>▸</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Analogy */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '20px', borderColor: 'rgba(255,215,0,0.2)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            <strong style={{ color: 'rgba(255,215,0,0.9)' }}>The perfect analogy:</strong> Git is like Microsoft Word (the software on your computer), and GitHub is like Google Drive (the cloud storage you upload your files to). You can use Word without Google Drive. But together? Powerful.
          </p>
        </div>
      </div>

      {/* GitHub Features */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--neon-pink)', marginBottom: '12px', letterSpacing: '0.1em' }}>
        WHAT GITHUB ADDS
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          {
            icon: '🔄',
            title: 'Pull Requests',
            desc: 'Propose changes for review before merging. The core of team collaboration.',
            color: 'var(--neon-green)',
          },
          {
            icon: '🐛',
            title: 'Issues',
            desc: 'Track bugs, feature requests, and tasks. Like a public to-do list for your project.',
            color: 'var(--neon-cyan)',
          },
          {
            icon: '⚡',
            title: 'GitHub Actions',
            desc: 'Automate tests, deployments, and more whenever you push code.',
            color: 'var(--neon-purple)',
          },
          {
            icon: '🌐',
            title: 'GitHub Pages',
            desc: 'Host a website for free directly from your repository. Your portfolio lives here!',
            color: 'var(--neon-pink)',
          },
          {
            icon: '👥',
            title: 'Forks & Stars',
            desc: 'Fork = copy someone\'s project to your account. Star = bookmark a cool repo.',
            color: '#ff6600',
          },
          {
            icon: '📊',
            title: 'Insights',
            desc: 'See who\'s contributing, how often, and what the most active parts of your code are.',
            color: 'rgba(255,215,0,0.8)',
          },
        ].map(feature => (
          <div key={feature.title} className="glass-panel" style={{ padding: '16px', borderColor: `${feature.color}20` }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{feature.icon}</div>
            <h4 style={{ color: feature.color, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '6px' }}>{feature.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Pull Request explanation */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '20px', borderColor: 'rgba(0,255,136,0.2)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--neon-green)', marginBottom: '10px', letterSpacing: '0.05em' }}>
          🔄 PULL REQUESTS EXPLAINED (THE MOST IMPORTANT CONCEPT IN TEAMWORK)
        </h3>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '12px' }}>
          Imagine you're working on a team project. You add a new feature on your own branch. Before merging it into the main branch, you want your teammates to review it first. That's a Pull Request.
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          {[
            { text: 'Create branch', color: 'var(--neon-cyan)' },
            { text: '→', color: 'var(--text-muted)' },
            { text: 'Make changes + commits', color: 'var(--neon-purple)' },
            { text: '→', color: 'var(--text-muted)' },
            { text: 'Open Pull Request', color: 'var(--neon-pink)' },
            { text: '→', color: 'var(--text-muted)' },
            { text: 'Team reviews & comments', color: '#ff6600' },
            { text: '→', color: 'var(--text-muted)' },
            { text: 'Approved & Merged! ✓', color: 'var(--neon-green)' },
          ].map((step, i) => (
            <span key={i} style={{ color: step.color, padding: step.text === '→' ? '0' : '3px 10px', borderRadius: '4px', background: step.text === '→' ? 'transparent' : `${step.color}10`, border: step.text === '→' ? 'none' : `1px solid ${step.color}25` }}>
              {step.text}
            </span>
          ))}
        </div>
      </div>

      {/* Alternatives */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', borderColor: 'rgba(150,180,220,0.15)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>OTHER GIT HOSTING PLATFORMS</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { name: 'GitLab', desc: 'Popular for private repos & enterprise' },
            { name: 'Bitbucket', desc: 'Popular in corporate environments (Atlassian)' },
            { name: 'Azure DevOps', desc: 'Microsoft\'s enterprise platform' },
          ].map(p => (
            <div key={p.name} style={{ background: 'rgba(150,180,220,0.05)', border: '1px solid rgba(150,180,220,0.1)', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ color: 'var(--text-bright)', fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>GitHub is the most popular by far. Start there — the skills transfer everywhere.</p>
      </div>

      <button onClick={onComplete} className="btn-neon-green" style={{ padding: '10px 24px', borderRadius: '10px' }}>
        ✓ Got it! Start Learning Commands →
      </button>
    </div>
  );
}
