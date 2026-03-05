'use client';

import CopyButton from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  showPrompt?: boolean;
  output?: string;
  onTryIt?: (cmd: string) => void;
}

export default function CodeBlock({ code, language = 'bash', showPrompt = true, output, onTryIt }: CodeBlockProps) {
  const lines = code.split('\n');

  return (
    <div className="terminal my-3">
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: '#ff5f57' }} />
        <div className="terminal-dot" style={{ background: '#febc2e' }} />
        <div className="terminal-dot" style={{ background: '#28c840' }} />
        <span style={{ color: 'rgba(0,245,255,0.5)', fontSize: '0.75rem', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
          {language === 'bash' ? '~ bash' : language}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onTryIt && (
            <button
              onClick={() => onTryIt(code)}
              className="btn-neon-green px-2 py-0.5 rounded text-xs"
            >
              ▶ Try it
            </button>
          )}
          <CopyButton text={code} />
        </div>
      </div>
      <div className="terminal-body">
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
            {showPrompt && language === 'bash' && !line.startsWith('#') && line.trim() !== '' && (
              <span className="terminal-prompt" style={{ marginRight: '8px', userSelect: 'none', flexShrink: 0 }}>$</span>
            )}
            {line.startsWith('#') ? (
              <span style={{ color: 'rgba(150,180,220,0.5)', fontStyle: 'italic' }}>{line}</span>
            ) : (
              <span className="terminal-command">{line}</span>
            )}
          </div>
        ))}
        {output && (
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(0,245,255,0.1)', paddingTop: '8px' }}>
            <span className="terminal-output">{output}</span>
          </div>
        )}
      </div>
    </div>
  );
}
