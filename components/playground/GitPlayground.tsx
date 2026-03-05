/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CommitNode {
  hash: string;
  shortHash: string;
  message: string;
  branch: string;
  timestamp: number;
  parentHash?: string;
}

interface FileTree {
  [name: string]: string | null; // null = directory
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  text: string;
  timestamp?: number;
}

interface PlaygroundState {
  initialized: boolean;
  currentBranch: string;
  branches: string[];
  commits: CommitNode[];
  files: FileTree;
  staged: string[];
  modified: string[];
  untracked: string[];
  lastCommand?: string;
}

const INITIAL_STATE: PlaygroundState = {
  initialized: false,
  currentBranch: 'main',
  branches: ['main'],
  commits: [],
  files: {},
  staged: [],
  modified: [],
  untracked: [],
};

// We need to use dynamic import for isomorphic-git due to ESM/CJS issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let git: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LightningFS: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fs: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fsInstance: any = null;

const DIR = '/repo';

async function ensureGitLoaded() {
  if (!git) {
    const [gitMod, FsMod] = await Promise.all([
      import('isomorphic-git'),
      import('@isomorphic-git/lightning-fs'),
    ]);
    git = gitMod;
    LightningFS = FsMod.default;
  }
  if (!fsInstance) {
    fsInstance = new LightningFS!('git-playground', { wipe: false });
    fs = fsInstance.promises;
  }
  return { git: git!, fs: fs! };
}

export default function GitPlayground({ initialCommand }: { initialCommand?: string }) {
  const [state, setState] = useState<PlaygroundState>(INITIAL_STATE);
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', text: '╔══════════════════════════════════════════════════╗' },
    { type: 'info', text: '║  ⚡ Git Cyber Playground — Real Git in Browser  ║' },
    { type: 'info', text: '╚══════════════════════════════════════════════════╝' },
    { type: 'info', text: '' },
    { type: 'info', text: 'Type "git init" to initialize your repository.' },
    { type: 'info', text: 'Type "help" to see all available commands.' },
    { type: 'info', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = useCallback((type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { type, text }]);
  }, []);

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (initialCommand && initialCommand.trim()) {
      setInput(initialCommand.trim());
      inputRef.current?.focus();
    }
  }, [initialCommand]);

  const refreshStatus = useCallback(async () => {
    if (!state.initialized) return;
    try {
      const { git: g, fs: f } = await ensureGitLoaded();
      
      // Get current branch
      let branch = 'main';
      try {
        branch = await g.currentBranch({ fs: { promises: f }, dir: DIR }) || 'main';
      } catch { /* ignore */ }

      // List branches
      let branches: string[] = ['main'];
      try {
        branches = await g.listBranches({ fs: { promises: f }, dir: DIR });
      } catch { /* ignore */ }

      // Get log
      let commits: CommitNode[] = [];
      try {
        const log = await g.log({ fs: { promises: f }, dir: DIR });
        commits = log.map(c => ({
          hash: c.oid,
          shortHash: c.oid.slice(0, 7),
          message: c.commit.message.trim(),
          branch: branch,
          timestamp: c.commit.author.timestamp,
          parentHash: c.commit.parent[0],
        }));
      } catch { /* ignore */ }

      // List files in repo
      let files: FileTree = {};
      try {
        const allFiles = await g.listFiles({ fs: { promises: f }, dir: DIR });
        allFiles.forEach(f => { files[f] = ''; });
      } catch { /* ignore */ }

      // Status
      let staged: string[] = [];
      let modified: string[] = [];
      let untracked: string[] = [];
      try {
        const statusMatrix = await g.statusMatrix({ fs: { promises: f }, dir: DIR });
        for (const [filepath, head, workdir, stage] of statusMatrix) {
          if (stage === 2) staged.push(filepath);
          if (workdir === 2 && stage === 0) modified.push(filepath);
          if (head === 0 && workdir === 2 && stage === 0) untracked.push(filepath);
        }
      } catch { /* ignore */ }

      setState(prev => ({
        ...prev,
        currentBranch: branch,
        branches,
        commits,
        files,
        staged,
        modified,
        untracked,
      }));
    } catch (e) {
      console.error('refresh status error', e);
    }
  }, [state.initialized]);

  const executeCommand = useCallback(async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    addLine('input', cmd);
    setHistory(prev => [cmd, ...prev.filter(h => h !== cmd)]);
    setHistIdx(-1);
    setLoading(true);

    try {
      const { git: g, fs: f } = await ensureGitLoaded();

      // ── HELP ──────────────────────────────────────────────
      if (cmd === 'help') {
        addLines([
          { type: 'info', text: '' },
          { type: 'info', text: '📋 Available Commands:' },
          { type: 'output', text: '  git init          — Initialize repo' },
          { type: 'output', text: '  git status        — Show working tree status' },
          { type: 'output', text: '  git add <file>    — Stage a file (use "." for all)' },
          { type: 'output', text: '  git commit -m ""  — Commit staged changes' },
          { type: 'output', text: '  git log           — Show commit history' },
          { type: 'output', text: '  git log --oneline — Compact commit history' },
          { type: 'output', text: '  git branch        — List branches' },
          { type: 'output', text: '  git branch <name> — Create new branch' },
          { type: 'output', text: '  git switch <name> — Switch branch' },
          { type: 'output', text: '  git switch -c <n> — Create & switch branch' },
          { type: 'output', text: '  git merge <name>  — Merge branch' },
          { type: 'output', text: '  git diff          — Show unstaged changes' },
          { type: 'output', text: '  touch <file>      — Create a file' },
          { type: 'output', text: '  echo "txt" > file — Write to file' },
          { type: 'output', text: '  cat <file>        — Read file contents' },
          { type: 'output', text: '  ls                — List files' },
          { type: 'output', text: '  clear             — Clear terminal' },
          { type: 'output', text: '  reset             — Reset entire playground' },
          { type: 'info', text: '' },
        ]);
        setLoading(false);
        return;
      }

      // ── CLEAR ─────────────────────────────────────────────
      if (cmd === 'clear') {
        setLines([{ type: 'info', text: 'Terminal cleared. Type "help" for commands.' }]);
        setLoading(false);
        return;
      }

      // ── RESET ─────────────────────────────────────────────
      if (cmd === 'reset') {
        // Wipe and reinit
        const newFs = new LightningFS!('git-playground', { wipe: true });
        fsInstance = newFs;
        fs = newFs.promises;
        setState(INITIAL_STATE);
        setLines([
          { type: 'success', text: '✓ Playground reset! All data cleared.' },
          { type: 'info', text: 'Type "git init" to start fresh.' },
        ]);
        setLoading(false);
        return;
      }

      // ── LS ────────────────────────────────────────────────
      if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'ls -l') {
        try {
          const entries = await f.readdir(DIR).catch(() => [] as string[]);
          if (entries.length === 0) {
            addLine('output', '(empty directory)');
          } else {
            entries
              .filter(e => e !== '.git')
              .forEach(e => addLine('output', `  ${e}`));
          }
        } catch {
          addLine('output', '(no files yet — run git init first)');
        }
        setLoading(false);
        return;
      }

      // ── CAT ───────────────────────────────────────────────
      if (cmd.startsWith('cat ')) {
        const filename = cmd.slice(4).trim();
        try {
          const content = await f.readFile(`${DIR}/${filename}`, { encoding: 'utf8' }) as string;
          addLine('output', content || '(empty file)');
        } catch {
          addLine('error', `cat: ${filename}: No such file or directory`);
        }
        setLoading(false);
        return;
      }

      // ── TOUCH ─────────────────────────────────────────────
      if (cmd.startsWith('touch ')) {
        const filename = cmd.slice(6).trim();
        if (!state.initialized) {
          addLine('error', 'Error: No git repository. Run "git init" first.');
          setLoading(false);
          return;
        }
        try {
          await f.writeFile(`${DIR}/${filename}`, '', { encoding: 'utf8' });
          addLine('success', `✓ Created ${filename}`);
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `touch: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── ECHO ──────────────────────────────────────────────
      if (cmd.startsWith('echo ')) {
        const match = cmd.match(/echo\s+"?([^"]*)"?\s*>\s*(.+)/);
        if (match) {
          const content = match[1];
          const filename = match[2].trim();
          if (!state.initialized) {
            addLine('error', 'Error: No git repository. Run "git init" first.');
            setLoading(false);
            return;
          }
          try {
            await f.writeFile(`${DIR}/${filename}`, content + '\n', { encoding: 'utf8' });
            addLine('success', `✓ Written to ${filename}`);
            await refreshStatus();
          } catch (e: any) {
            addLine('error', `echo: ${e.message}`);
          }
        } else {
          const text = cmd.replace(/^echo\s+"?/, '').replace(/"?$/, '');
          addLine('output', text);
        }
        setLoading(false);
        return;
      }

      // ── GIT INIT ──────────────────────────────────────────
      if (cmd === 'git init') {
        try {
          // ensure dir exists
          try { await f.mkdir(DIR); } catch { /* already exists */ }
          await g.init({ fs: { promises: f }, dir: DIR, defaultBranch: 'main' });
          addLines([
            { type: 'success', text: '✓ Initialized empty Git repository' },
            { type: 'output', text: `  Location: ${DIR}/.git/` },
            { type: 'info', text: '' },
            { type: 'info', text: "💡 You're ready! Try: touch README.md" },
          ]);
          setState(prev => ({
            ...prev,
            initialized: true,
            currentBranch: 'main',
            branches: ['main'],
          }));
        } catch (e: any) {
          addLine('error', `git init: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // All other git commands require init
      if (!state.initialized && cmd.startsWith('git ')) {
        addLine('error', 'Error: Not a git repository. Run "git init" first.');
        setLoading(false);
        return;
      }

      // ── GIT STATUS ────────────────────────────────────────
      if (cmd === 'git status') {
        try {
          const branch = await g.currentBranch({ fs: { promises: f }, dir: DIR }) || 'main';
          const statusMatrix = await g.statusMatrix({ fs: { promises: f }, dir: DIR });
          
          const staged: string[] = [];
          const modified: string[] = [];
          const untracked: string[] = [];

          for (const [filepath, head, workdir, stage] of statusMatrix) {
            if (head === 1 && workdir === 1 && stage === 1) continue; // unchanged
            if (stage === 2 || stage === 3) staged.push(filepath);
            else if (workdir === 2 && stage === 0) untracked.push(filepath);
            else if (workdir === 2) modified.push(filepath);
            else if (head === 1 && workdir === 0) modified.push(`${filepath} (deleted)`);
          }

          const outputLines: TerminalLine[] = [
            { type: 'output', text: `On branch ${branch}` },
          ];

          if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
            const commits = await g.log({ fs: { promises: f }, dir: DIR }).catch(() => []);
            if (commits.length > 0) {
              outputLines.push({ type: 'success', text: 'nothing to commit, working tree clean' });
            } else {
              outputLines.push({ type: 'info', text: 'No commits yet' });
              outputLines.push({ type: 'info', text: 'nothing to commit (create/copy files and use "git add" to track)' });
            }
          } else {
            if (staged.length > 0) {
              outputLines.push({ type: 'success', text: '' });
              outputLines.push({ type: 'success', text: 'Changes to be committed:' });
              outputLines.push({ type: 'success', text: '  (use "git restore --staged <file>..." to unstage)' });
              staged.forEach(f => outputLines.push({ type: 'success', text: `        modified:   ${f}` }));
            }
            if (modified.length > 0) {
              outputLines.push({ type: 'error', text: '' });
              outputLines.push({ type: 'error', text: 'Changes not staged for commit:' });
              modified.forEach(f => outputLines.push({ type: 'error', text: `        modified:   ${f}` }));
            }
            if (untracked.length > 0) {
              outputLines.push({ type: 'output', text: '' });
              outputLines.push({ type: 'output', text: 'Untracked files:' });
              outputLines.push({ type: 'output', text: '  (use "git add <file>..." to include in commit)' });
              untracked.forEach(f => outputLines.push({ type: 'output', text: `        ${f}` }));
            }
          }

          addLines(outputLines);
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git status: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT ADD ───────────────────────────────────────────
      if (cmd.startsWith('git add')) {
        const target = cmd.slice(8).trim();
        try {
          if (target === '.' || target === '-A' || target === '--all') {
            const statusMatrix = await g.statusMatrix({ fs: { promises: f }, dir: DIR });
            let count = 0;
            for (const [filepath, head, workdir] of statusMatrix) {
              if (workdir !== 1) {
                await g.add({ fs: { promises: f }, dir: DIR, filepath });
                count++;
              }
            }
            addLine('success', `✓ Staged ${count} file(s)`);
          } else if (target) {
            await g.add({ fs: { promises: f }, dir: DIR, filepath: target });
            addLine('success', `✓ Staged: ${target}`);
          } else {
            addLine('error', 'Usage: git add <file> or git add .');
          }
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git add: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT COMMIT ────────────────────────────────────────
      if (cmd.startsWith('git commit')) {
        const msgMatch = cmd.match(/-m\s+"([^"]+)"|'([^']+)'/);
        if (!msgMatch) {
          addLine('error', 'Usage: git commit -m "Your message here"');
          setLoading(false);
          return;
        }
        const message = msgMatch[1] || msgMatch[2];
        try {
          const sha = await g.commit({
            fs: { promises: f },
            dir: DIR,
            message,
            author: { name: 'You', email: 'you@gitacademy.dev' },
          });
          addLines([
            { type: 'success', text: `[${(await g.currentBranch({ fs: { promises: f }, dir: DIR })) || 'main'} ${sha.slice(0, 7)}] ${message}` },
            { type: 'output', text: '  1 commit saved' },
          ]);
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git commit: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT LOG ───────────────────────────────────────────
      if (cmd === 'git log' || cmd === 'git log --oneline' || cmd.startsWith('git log')) {
        const oneline = cmd.includes('--oneline');
        try {
          const log = await g.log({ fs: { promises: f }, dir: DIR });
          if (log.length === 0) {
            addLine('info', 'No commits yet. Make your first commit!');
            setLoading(false);
            return;
          }
          const branch = await g.currentBranch({ fs: { promises: f }, dir: DIR }) || 'main';
          if (oneline) {
            log.forEach((c, i) => {
              const label = i === 0 ? ` (HEAD -> ${branch})` : '';
              addLine('output', `${c.oid.slice(0, 7)} ${c.commit.message.trim()}${label}`);
            });
          } else {
            log.forEach((c, i) => {
              const label = i === 0 ? ` (HEAD -> ${branch})` : '';
              const date = new Date(c.commit.author.timestamp * 1000).toLocaleString();
              addLines([
                { type: 'output', text: `commit ${c.oid}${label}` },
                { type: 'output', text: `Author: ${c.commit.author.name} <${c.commit.author.email}>` },
                { type: 'output', text: `Date:   ${date}` },
                { type: 'output', text: `\n    ${c.commit.message.trim()}\n` },
              ]);
            });
          }
        } catch (e: any) {
          addLine('error', `git log: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT BRANCH ────────────────────────────────────────
      if (cmd === 'git branch') {
        try {
          const branches = await g.listBranches({ fs: { promises: f }, dir: DIR });
          const current = await g.currentBranch({ fs: { promises: f }, dir: DIR }) || 'main';
          branches.forEach(b => {
            addLine(b === current ? 'success' : 'output', `${b === current ? '* ' : '  '}${b}`);
          });
        } catch (e: any) {
          addLine('error', `git branch: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      if (cmd.startsWith('git branch ') && !cmd.includes('--delete') && !cmd.includes('-d')) {
        const name = cmd.slice(11).trim();
        try {
          await g.branch({ fs: { promises: f }, dir: DIR, ref: name });
          addLine('success', `✓ Created branch: ${name}`);
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git branch: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT SWITCH ────────────────────────────────────────
      if (cmd.startsWith('git switch ')) {
        const parts = cmd.slice(11).trim().split(/\s+/);
        const createFlag = parts.includes('-c') || parts.includes('-C');
        const branchName = parts.find(p => !p.startsWith('-'))!;
        try {
          if (createFlag) {
            await g.branch({ fs: { promises: f }, dir: DIR, ref: branchName, checkout: true });
            addLine('success', `✓ Switched to new branch '${branchName}'`);
          } else {
            await g.checkout({ fs: { promises: f }, dir: DIR, ref: branchName });
            addLine('success', `✓ Switched to branch '${branchName}'`);
          }
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git switch: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT CHECKOUT ──────────────────────────────────────
      if (cmd.startsWith('git checkout ')) {
        const parts = cmd.slice(13).trim().split(/\s+/);
        const createFlag = parts.includes('-b') || parts.includes('-B');
        const branchName = parts.find(p => !p.startsWith('-'))!;
        try {
          if (createFlag) {
            await g.branch({ fs: { promises: f }, dir: DIR, ref: branchName, checkout: true });
            addLine('success', `✓ Switched to new branch '${branchName}'`);
          } else {
            await g.checkout({ fs: { promises: f }, dir: DIR, ref: branchName });
            addLine('success', `✓ Switched to branch '${branchName}'`);
          }
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git checkout: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT MERGE ─────────────────────────────────────────
      if (cmd.startsWith('git merge ')) {
        const branchName = cmd.slice(10).trim();
        try {
          const current = await g.currentBranch({ fs: { promises: f }, dir: DIR }) || 'main';
          const mergeResult = await g.merge({
            fs: { promises: f },
            dir: DIR,
            ours: current,
            theirs: branchName,
            author: { name: 'You', email: 'you@gitacademy.dev' },
            message: `Merge branch '${branchName}' into ${current}`,
          });
          if (mergeResult.alreadyMerged) {
            addLine('info', `Already up to date.`);
          } else {
            addLines([
              { type: 'success', text: `✓ Merged branch '${branchName}' into ${current}` },
              { type: 'output', text: `Fast-forward` },
            ]);
          }
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git merge: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT DIFF ──────────────────────────────────────────
      if (cmd === 'git diff') {
        try {
          const statusMatrix = await g.statusMatrix({ fs: { promises: f }, dir: DIR });
          let hasChanges = false;
          for (const [filepath, head, workdir, stage] of statusMatrix) {
            if (workdir === 2 && stage !== 2) {
              hasChanges = true;
              addLine('output', `diff --git a/${filepath} b/${filepath}`);
              addLine('output', `--- a/${filepath}`);
              addLine('output', `+++ b/${filepath}`);
              const content = await f.readFile(`${DIR}/${filepath}`, { encoding: 'utf8' }) as string;
              content.split('\n').forEach(line => {
                if (line) addLine('success', `+${line}`);
              });
            }
          }
          if (!hasChanges) addLine('info', '(no changes to show)');
        } catch (e: any) {
          addLine('error', `git diff: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT REMOTE ────────────────────────────────────────
      if (cmd === 'git remote -v' || cmd === 'git remote') {
        addLines([
          { type: 'info', text: '(This is a browser-based playground — no real remote connections)' },
          { type: 'output', text: 'origin  https://github.com/you/my-project.git (fetch)' },
          { type: 'output', text: 'origin  https://github.com/you/my-project.git (push)' },
        ]);
        setLoading(false);
        return;
      }

      // ── GIT PUSH / PULL ───────────────────────────────────
      if (cmd.startsWith('git push') || cmd.startsWith('git pull') || cmd.startsWith('git clone')) {
        addLines([
          { type: 'info', text: '🌐 Network commands are simulated in this browser playground.' },
          { type: 'output', text: 'In a real terminal, this would connect to GitHub and sync your changes.' },
          { type: 'success', text: '✓ Simulated: Changes "pushed" to remote!' },
        ]);
        setLoading(false);
        return;
      }

      // ── UNKNOWN ───────────────────────────────────────────
      addLine('error', `Command not recognized: "${cmd}". Type "help" for available commands.`);
    } catch (e: any) {
      addLine('error', `Error: ${e.message}`);
    }

    setLoading(false);
  }, [state, addLine, addLines, refreshStatus]);

  // Handle initial command prop
  useEffect(() => {
    if (initialCommand && initialCommand.trim() && state.initialized) {
      // Don't auto-run, just pre-fill
    }
  }, [initialCommand, state.initialized]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      setInput('');
      if (cmd) executeCommand(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(newIdx);
      setInput(history[newIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(histIdx - 1, -1);
      setHistIdx(newIdx);
      setInput(newIdx === -1 ? '' : history[newIdx] || '');
    }
  }, [input, histIdx, history, executeCommand]);

  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'var(--neon-cyan)';
      case 'error': return '#ff4466';
      case 'success': return 'var(--neon-green)';
      case 'info': return 'rgba(150,180,220,0.6)';
      default: return 'rgba(200,220,255,0.8)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Status Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {[
          { label: 'BRANCH', value: state.initialized ? state.currentBranch : '—', color: 'var(--neon-cyan)' },
          { label: 'COMMITS', value: state.commits.length.toString(), color: 'var(--neon-green)' },
          { label: 'STAGED', value: state.staged.length.toString(), color: 'var(--neon-purple)' },
          { label: 'MODIFIED', value: state.modified.length.toString(), color: 'var(--neon-pink)' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '1.2rem', color: stat.color, fontFamily: 'var(--font-display)', textShadow: `0 0 10px ${stat.color}` }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        {/* Terminal */}
        <div className="terminal" style={{ minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
          <div className="terminal-header">
            <div className="terminal-dot" style={{ background: '#ff5f57' }} />
            <div className="terminal-dot" style={{ background: '#febc2e' }} />
            <div className="terminal-dot" style={{ background: '#28c840' }} />
            <span style={{ color: 'rgba(0,245,255,0.5)', fontSize: '0.75rem', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
              ⚡ git-playground ~ /repo
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setHintVisible(v => !v)}
                className="btn-neon-cyan px-2 py-0.5 rounded text-xs"
              >
                💡 Hints
              </button>
              <button
                onClick={() => executeCommand('reset')}
                style={{ background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.3)', color: '#ff4466', borderRadius: '4px', padding: '2px 10px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Hints */}
          {hintVisible && (
            <div style={{ background: 'rgba(0,100,200,0.08)', borderBottom: '1px solid rgba(0,128,255,0.2)', padding: '10px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(0,128,255,0.9)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>💡 QUICK START WORKFLOW:</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(200,220,255,0.7)', fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
                {['git init', 'touch README.md', 'echo "Hello Git!" > README.md', 'git add .', 'git status', 'git commit -m "Initial commit"', 'git log --oneline'].map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--neon-green)' }}>$</span>
                    <button
                      onClick={() => { setInput(c); inputRef.current?.focus(); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textAlign: 'left', padding: 0 }}
                    >
                      {c}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          <div
            ref={terminalBodyRef}
            className="terminal-body"
            style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}
            onClick={() => inputRef.current?.focus()}
          >
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '1px' }}>
                {line.type === 'input' && (
                  <span className="terminal-prompt" style={{ flexShrink: 0 }}>$</span>
                )}
                <span style={{ color: lineColor(line.type), fontFamily: 'var(--font-mono)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {line.text}
                </span>
              </div>
            ))}
            {/* Input line */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
              <span className="terminal-prompt" style={{ flexShrink: 0 }}>$</span>
              <input
                ref={inputRef}
                className="terminal-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={loading ? 'Running...' : 'type a git command...'}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
              {loading && (
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--neon-cyan)',
                  animation: 'neon-pulse 0.8s ease-in-out infinite',
                  flexShrink: 0,
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Right panel: Commit Graph + File Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Commit Graph */}
          <div className="glass-panel" style={{ padding: '14px', flex: 1 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '10px', letterSpacing: '0.1em' }}>
              📊 COMMIT GRAPH
            </div>
            {state.commits.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '20px 0' }}>
                No commits yet.<br />Run git init & commit!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {state.commits.slice(0, 8).map((commit, i) => (
                  <div key={commit.hash} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '16px', flexShrink: 0 }}>
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        border: `2px solid ${i === 0 ? 'var(--neon-cyan)' : 'var(--neon-purple)'}`,
                        background: i === 0 ? 'rgba(0,245,255,0.2)' : 'rgba(191,0,255,0.1)',
                        boxShadow: `0 0 8px ${i === 0 ? 'var(--neon-cyan)' : 'var(--neon-purple)'}`,
                        flexShrink: 0,
                      }} />
                      {i < state.commits.length - 1 && (
                        <div style={{ width: '2px', height: '16px', background: 'rgba(0,245,255,0.2)', marginTop: '2px' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--neon-cyan)', marginBottom: '1px' }}>
                        {commit.shortHash} {i === 0 ? '← HEAD' : ''}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {commit.message}
                      </div>
                    </div>
                  </div>
                ))}
                {state.commits.length > 8 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0', fontFamily: 'var(--font-mono)' }}>
                    +{state.commits.length - 8} more commits
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Branches */}
          {state.branches.length > 0 && (
            <div className="glass-panel" style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.1em' }}>
                🌿 BRANCHES
              </div>
              {state.branches.map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: b === state.currentBranch ? 'var(--neon-green)' : 'var(--text-muted)',
                    boxShadow: b === state.currentBranch ? '0 0 6px var(--neon-green)' : 'none',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: b === state.currentBranch ? 'var(--neon-green)' : 'var(--text-dim)',
                  }}>
                    {b === state.currentBranch ? '* ' : '  '}{b}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {Object.keys(state.files).length > 0 && (
            <div className="glass-panel" style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--neon-purple)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.1em' }}>
                📁 TRACKED FILES
              </div>
              {Object.keys(state.files).slice(0, 8).map(f => (
                <div key={f} style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', padding: '2px 0' }}>
                  📄 {f}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
