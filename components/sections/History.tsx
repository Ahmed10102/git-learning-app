'use client';

interface HistoryProps {
  onComplete: () => void;
}

export default function History({ onComplete }: HistoryProps) {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '20px', borderColor: 'rgba(191,0,255,0.3)', background: 'linear-gradient(135deg, rgba(191,0,255,0.08), rgba(5,8,25,0.9))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '2.5rem' }}>📖</span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--neon-purple)', textShadow: '0 0 20px rgba(191,0,255,0.5)', letterSpacing: '0.05em' }}>
              The Origin Story
            </h1>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>Why does Git exist?</p>
          </div>
        </div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.8, fontSize: '1rem' }}>
          Before Git, developers had a serious problem: how do you track changes to code when multiple people work on the same project? Imagine editing a 10,000-line file, and your teammate edits the same file at the same time. Chaos!
        </p>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: '24px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, var(--neon-purple), var(--neon-cyan))', opacity: 0.4 }} />

        {[
          {
            year: '~2000s',
            icon: '💿',
            title: 'The Old Days: BitKeeper',
            color: 'var(--neon-purple)',
            content: `The Linux kernel — the engine inside billions of computers — needed version control. The team used a tool called BitKeeper. It worked... but it was a closed, commercial product.
            
Think of it like using a rental car to run your business. It works, but someone else owns it.`,
          },
          {
            year: '2005',
            icon: '⚡',
            title: 'The Breaking Point',
            color: 'var(--neon-cyan)',
            content: `In 2005, BitKeeper's company revoked free access to the Linux community. The community was stuck.

Linus Torvalds — the creator of Linux — was frustrated. He looked at every alternative: CVS, Subversion, Perforce... None were fast enough or distributed enough.

So he did what any legendary programmer does: he built something better himself.`,
          },
          {
            year: 'April 2005',
            icon: '🚀',
            title: 'Git is Born',
            color: 'var(--neon-green)',
            content: `Linus built the first version of Git in just 10 days. TEN DAYS.

His goals were clear:
• Speed — faster than everything else
• Distributed — every developer has the full history
• Strong data integrity — you can't secretly change history
• Support for non-linear development (branches!)

The name "Git" is British slang for an unpleasant person. Linus has a sense of humor.`,
          },
          {
            year: 'Today',
            icon: '🌍',
            title: 'Git Runs the World',
            color: 'var(--neon-pink)',
            content: `Today, Git is used by over 100 million developers worldwide. It powers:
• The Linux kernel itself
• Windows, macOS, Android
• Every major website and app you use
• NASA's spacecraft software
• Medical device firmware

It's not just popular — it's the standard. Learning Git is as fundamental as learning to type.`,
          },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '0', marginBottom: '20px' }}>
            {/* Timeline node */}
            <div style={{ width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '4px' }}>
              <div style={{
                width: '38px', height: '38px',
                borderRadius: '50%',
                background: `${item.color}20`,
                border: `2px solid ${item.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
                boxShadow: `0 0 15px ${item.color}50`,
                zIndex: 1,
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
            </div>
            
            <div className="glass-card" style={{ flex: 1, padding: '18px 22px', borderColor: `${item.color}25`, marginLeft: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: item.color, background: `${item.color}15`, padding: '2px 10px', borderRadius: '12px', border: `1px solid ${item.color}30` }}>
                  {item.year}
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: item.color, letterSpacing: '0.05em', textShadow: `0 0 8px ${item.color}60` }}>
                  {item.title}
                </h3>
              </div>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                {item.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Fun fact */}
      <div className="glass-card" style={{ padding: '20px 24px', borderColor: 'rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.04)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>🤯</span>
          <div>
            <div style={{ color: 'rgba(255,215,0,0.8)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '6px', letterSpacing: '0.1em' }}>MIND-BLOWING FACT</div>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              The Linux kernel has over <strong style={{ color: 'var(--text-bright)' }}>1,000 contributors</strong> in a typical week. Git lets all of them work simultaneously on the same massive codebase without stepping on each other's toes. That's the superpower you're about to learn.
            </p>
          </div>
        </div>
      </div>

      <button onClick={onComplete} className="btn-neon-green" style={{ padding: '10px 24px', borderRadius: '10px' }}>
        ✓ Got it! Next →
      </button>
    </div>
  );
}
