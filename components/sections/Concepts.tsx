'use client';

interface ConceptsProps {
  onComplete: () => void;
}

export default function Concepts({ onComplete }: ConceptsProps) {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '20px', borderColor: 'rgba(0,245,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '2.5rem' }}>🧠</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--neon-cyan)', textShadow: '0 0 20px rgba(0,245,255,0.5)', letterSpacing: '0.05em' }}>
            How Git Actually Works
          </h1>
        </div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.8, fontSize: '1rem' }}>
          Before typing a single command, let's understand the big picture. Once you get these 3 ideas, everything else just clicks.
        </p>
      </div>

      {/* Concept 1: Snapshots */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px', borderColor: 'rgba(0,255,136,0.25)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(0,255,136,0.15)',
            border: '1px solid rgba(0,255,136,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
            boxShadow: '0 0 15px rgba(0,255,136,0.2)',
          }}>📸</div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--neon-green)', marginBottom: '8px', letterSpacing: '0.05em' }}>
              CONCEPT 1: Git Takes Snapshots, Not Differences
            </h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '12px' }}>
              Old version control systems tracked the <em>difference</em> (delta) between files. "Line 5 changed from X to Y." Git is different — it takes a <strong style={{ color: 'var(--text-bright)' }}>complete snapshot</strong> of your entire project every time you save (commit).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(255,68,102,0.06)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ color: '#ff4466', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginBottom: '8px', letterSpacing: '0.1em' }}>OLD WAY (Deltas)</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  📄 v1: original<br/>
                  ↓ change: line 5<br/>
                  📄 v2: + line 5 diff<br/>
                  ↓ change: line 12<br/>
                  📄 v3: + line 12 diff<br/>
                  <br/>
                  <em>To restore v1, replay all diffs backwards...</em>
                </div>
              </div>
              <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginBottom: '8px', letterSpacing: '0.1em' }}>GIT WAY (Snapshots)</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  📸 commit1: full copy<br/>
                  📸 commit2: full copy<br/>
                  📸 commit3: full copy<br/>
                  <br/>
                  (unchanged files = just a link to save space)<br/>
                  <em>To restore any version, instantly jump there!</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Concept 2: Distributed */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px', borderColor: 'rgba(191,0,255,0.25)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(191,0,255,0.15)',
            border: '1px solid rgba(191,0,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
            boxShadow: '0 0 15px rgba(191,0,255,0.2)',
          }}>🌐</div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--neon-purple)', marginBottom: '8px', letterSpacing: '0.05em' }}>
              CONCEPT 2: Git is Distributed (Everyone Has Everything)
            </h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '12px' }}>
              In old systems, the history lived on ONE central server. If the server went down, everyone was stuck. Git is <strong style={{ color: 'var(--text-bright)' }}>distributed</strong> — every developer has a <strong style={{ color: 'var(--text-bright)' }}>complete copy</strong> of the entire history on their own machine.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '16px', background: 'rgba(191,0,255,0.05)', borderRadius: '10px', flexWrap: 'wrap' }}>
              {['👩‍💻 Alice\n(full history)', '👨‍💻 Bob\n(full history)', '🖥️ GitHub\n(full history)', '👩‍💻 Carol\n(full history)'].map((person, i) => (
                <div key={i} style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-line', background: 'rgba(191,0,255,0.08)', border: '1px solid rgba(191,0,255,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                  {person}
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px', lineHeight: 1.6 }}>
              → If GitHub goes offline, you still have everything. You can keep committing, branching, and merging locally until it comes back.
            </p>
          </div>
        </div>
      </div>

      {/* Concept 3: Three States */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px', borderColor: 'rgba(0,245,255,0.25)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(0,245,255,0.15)',
            border: '1px solid rgba(0,245,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
          }}>🔄</div>
          <div style={{ width: '100%' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--neon-cyan)', marginBottom: '8px', letterSpacing: '0.05em' }}>
              CONCEPT 3: The Three Zones — Working Dir, Stage, Repository
            </h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '16px' }}>
              Your files live in three zones before they're permanently saved. Think of it like preparing a package to ship:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                {
                  zone: '1. Working Directory',
                  emoji: '📝',
                  desc: 'Your actual files on disk. You edit freely here.',
                  analogy: 'Your desk — messy, unpacked items',
                  color: '#ff6600',
                },
                {
                  zone: 'git add ↓',
                  emoji: '→',
                  desc: '',
                  analogy: '',
                  color: 'var(--text-muted)',
                  isArrow: true,
                },
                {
                  zone: '2. Staging Area',
                  emoji: '📦',
                  desc: 'Files you\'ve chosen to include in the next commit.',
                  analogy: 'The packing box — chosen items ready to ship',
                  color: 'var(--neon-purple)',
                },
                {
                  zone: 'git commit ↓',
                  emoji: '→',
                  desc: '',
                  analogy: '',
                  color: 'var(--text-muted)',
                  isArrow: true,
                },
                {
                  zone: '3. Repository (.git)',
                  emoji: '💾',
                  desc: 'Permanent snapshot history. Never changes once committed.',
                  analogy: 'The warehouse — shipped and stored permanently',
                  color: 'var(--neon-cyan)',
                },
              ].map((z, i) => (
                z.isArrow ? (
                  <div key={i} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '0 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '0.65rem' }}>{z.zone.split('↓')[0]}</span>
                    <span style={{ fontSize: '1.2rem' }}>→</span>
                  </div>
                ) : (
                  <div key={i} style={{
                    flex: 1,
                    minWidth: '160px',
                    background: `${z.color}10`,
                    border: `1px solid ${z.color}30`,
                    borderRadius: '10px',
                    padding: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{z.emoji}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: z.color, fontWeight: 600 }}>{z.zone}</span>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '6px' }}>{z.desc}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>"{z.analogy}"</p>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={onComplete} className="btn-neon-green" style={{ padding: '10px 24px', borderRadius: '10px' }}>
        ✓ Got it! Next →
      </button>
    </div>
  );
}
