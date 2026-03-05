'use client';

interface NextStepsProps {
  onComplete: () => void;
}

export default function NextSteps({ onComplete }: NextStepsProps) {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="glass-card holo-card" style={{ padding: '28px 32px', marginBottom: '20px', borderColor: 'rgba(0,245,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '2.5rem' }}>🗺️</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--neon-cyan)', letterSpacing: '0.05em' }}>
            What's Next?
          </h1>
        </div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.8 }}>
          You've learned all the essential Git and GitHub commands! Here's your step-by-step guide to creating your very first real GitHub repository.
        </p>
      </div>

      {/* Create First Repo Guide */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', borderColor: 'rgba(0,255,136,0.2)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--neon-green)', marginBottom: '16px', letterSpacing: '0.1em' }}>
          🚀 CREATE YOUR FIRST REAL GITHUB REPOSITORY
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            {
              step: '1',
              title: 'Create a GitHub Account',
              content: 'Go to github.com and sign up for a free account. Choose a professional username — it becomes part of your developer identity!',
              code: null,
              color: 'var(--neon-cyan)',
            },
            {
              step: '2',
              title: 'Install Git on Your Computer',
              content: 'Download Git from git-scm.com. Run the installer. Open your terminal and verify:',
              code: 'git --version',
              color: 'var(--neon-purple)',
            },
            {
              step: '3',
              title: 'Configure Git with Your Identity',
              content: 'Tell Git who you are (this appears in your commits):',
              code: 'git config --global user.name "Your Name"\ngit config --global user.email "your@email.com"',
              color: 'var(--neon-pink)',
            },
            {
              step: '4',
              title: 'Create a New Repo on GitHub',
              content: 'Click the "+" button on GitHub → "New repository". Give it a name, choose public or private, click "Create repository".',
              code: null,
              color: 'var(--neon-green)',
            },
            {
              step: '5',
              title: 'Create a Local Project & Connect It',
              content: 'On your computer, create a project folder and initialize Git:',
              code: 'mkdir my-first-project\ncd my-first-project\ngit init\necho "# My First Project" > README.md\ngit add .\ngit commit -m "Initial commit"\ngit branch -M main\ngit remote add origin https://github.com/YOURUSERNAME/REPONAME.git\ngit push -u origin main',
              color: 'var(--neon-cyan)',
            },
            {
              step: '6',
              title: 'Refresh GitHub — Your Code is Live!',
              content: 'Visit your GitHub repo page. Your README.md is now displayed! Your code is on the internet. You\'re a real developer. 🎉',
              code: null,
              color: 'rgba(255,215,0,0.9)',
            },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '14px',
              padding: '16px',
              background: `${step.color}06`,
              border: `1px solid ${step.color}20`,
              borderRadius: '10px',
            }}>
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                background: `${step.color}20`,
                border: `2px solid ${step.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                color: step.color,
                flexShrink: 0,
                boxShadow: `0 0 10px ${step.color}40`,
              }}>
                {step.step}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: step.color, marginBottom: '6px' }}>
                  {step.title}
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: step.code ? '10px' : '0' }}>
                  {step.content}
                </p>
                {step.code && (
                  <div className="terminal" style={{ marginTop: '8px' }}>
                    <div className="terminal-body" style={{ padding: '10px 14px' }}>
                      {step.code.split('\n').map((line, j) => (
                        <div key={j} style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
                          <span className="terminal-prompt" style={{ flexShrink: 0 }}>$</span>
                          <span className="terminal-command" style={{ fontSize: '0.82rem' }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', borderColor: 'rgba(191,0,255,0.2)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--neon-purple)', marginBottom: '16px', letterSpacing: '0.1em' }}>
          📚 LEVEL UP — NEXT RESOURCES
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {[
            { name: 'GitHub Docs', url: 'docs.github.com', desc: 'The official documentation. Extremely well-written.', color: 'var(--neon-green)' },
            { name: 'Pro Git Book', url: 'git-scm.com/book', desc: 'The free, official Git book. Goes deep on everything.', color: 'var(--neon-cyan)' },
            { name: 'GitHub Learning Lab', url: 'github.com/apps/github-learning-lab', desc: 'Interactive courses right inside GitHub repos.', color: 'var(--neon-purple)' },
            { name: 'Oh My Git!', url: 'ohmygit.org', desc: 'A fun game that teaches Git visually. Great for reinforcement.', color: 'var(--neon-pink)' },
            { name: 'Atlassian Git Tutorials', url: 'atlassian.com/git', desc: 'Beautiful visual diagrams for every Git concept.', color: '#ff6600' },
            { name: 'Git Immersion', url: 'gitimmersion.com', desc: 'Guided tour through Git fundamentals step by step.', color: 'rgba(255,215,0,0.8)' },
          ].map(r => (
            <div key={r.name} style={{ padding: '14px', background: `${r.color}06`, border: `1px solid ${r.color}20`, borderRadius: '10px' }}>
              <div style={{ color: r.color, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '4px' }}>{r.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>{r.url}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Encouragement */}
      <div className="glass-card holo-card" style={{ padding: '28px', textAlign: 'center', borderColor: 'rgba(0,245,255,0.3)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏆</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--neon-cyan)', marginBottom: '10px', letterSpacing: '0.05em' }}>
          You Did It!
        </h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.8, maxWidth: '500px', margin: '0 auto 16px', fontSize: '1rem' }}>
          You now know more about Git than most people who call themselves developers. The only thing left is to use it every single day on real projects. That's how it becomes second nature.
        </p>
        <p style={{ color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '20px' }}>
          "The best way to learn Git is to use Git."
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-neon-cyan"
            style={{ padding: '12px 24px', borderRadius: '12px' }}
            onClick={() => {
              const quizBtn = document.querySelector('[data-section="quiz"]') as HTMLElement;
              quizBtn?.click();
            }}
          >
            🎯 Take the Final Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
