/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Mission } from '@/lib/missions';
import { MISSION_DIR, MISSION_FS_NAME } from '@/lib/missions';

// ─── Git / FS module-level singletons ────────────────────────────────────────
let _git: any = null;
let _LightningFS: any = null;
let _fsInstance: any = null;
let _fs: any = null;

async function ensureMissionLoaded() {
  if (!_git) {
    const [gitMod, FsMod] = await Promise.all([
      import('isomorphic-git'),
      import('@isomorphic-git/lightning-fs'),
    ]);
    _git = gitMod;
    _LightningFS = FsMod.default;
  }
  if (!_fsInstance) {
    _fsInstance = new _LightningFS(MISSION_FS_NAME, { wipe: false });
    _fs = _fsInstance.promises;
  }
  return { git: _git, fs: _fs };
}

async function wipeAndReinit() {
  _fsInstance = new _LightningFS(MISSION_FS_NAME, { wipe: true });
  _fs = _fsInstance.promises;
  return _fs;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  text: string;
}

interface StepState {
  completed: boolean;
  hintVisible: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────
interface MissionTerminalProps {
  mission: Mission;
  onMissionComplete: () => void;
}

export default function MissionTerminal({ mission, onMissionComplete }: MissionTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(true);
  const [stepStates, setStepStates] = useState<StepState[]>(
    mission.steps.map(() => ({ completed: false, hintVisible: false }))
  );
  const [activeStep, setActiveStep] = useState(0);
  const [allComplete, setAllComplete] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const completedCalledRef = useRef(false);

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setFullscreen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [lines]);

  // Seed on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSeeding(true);
      try {
        const { git, fs } = await ensureMissionLoaded();
        await mission.checkpointSeed(git, fs, MISSION_DIR);
        if (!cancelled) {
          setLines([
            { type: 'info', text: '╔══════════════════════════════════════════════════╗' },
            { type: 'info', text: `║  ${mission.scene}  ${mission.title.padEnd(43)}║` },
            { type: 'info', text: '╚══════════════════════════════════════════════════╝' },
            { type: 'info', text: '' },
            { type: 'info', text: '📖 ' + mission.storyContext.slice(0, 120) + (mission.storyContext.length > 120 ? '...' : '') },
            { type: 'info', text: '' },
            { type: 'info', text: `Step 1: ${mission.steps[0].instruction}` },
            { type: 'info', text: '' },
            { type: 'info', text: 'Type "help" for available commands.' },
          ]);
          setSeeding(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setLines([{ type: 'error', text: `Failed to load mission: ${e.message}` }]);
          setSeeding(false);
        }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id]);

  const addLine = useCallback((type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { type, text }]);
  }, []);

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  // Run validator for current step and advance if passed
  const runValidation = useCallback(async (stepIdx: number) => {
    if (stepIdx >= mission.steps.length) return;
    try {
      const { git, fs } = await ensureMissionLoaded();
      const passed = await mission.steps[stepIdx].validate(git, fs, MISSION_DIR);
      if (passed) {
        setStepStates(prev => {
          const next = [...prev];
          next[stepIdx] = { ...next[stepIdx], completed: true };
          return next;
        });
        const nextStep = stepIdx + 1;
        if (nextStep < mission.steps.length) {
          setActiveStep(nextStep);
          setTimeout(() => {
            addLines([
              { type: 'success', text: `✅ Step ${stepIdx + 1} complete!` },
              { type: 'info', text: '' },
              { type: 'info', text: `Step ${nextStep + 1}: ${mission.steps[nextStep].instruction}` },
              { type: 'info', text: '' },
            ]);
          }, 50);
        } else {
          // All steps done
          setAllComplete(true);
          if (!completedCalledRef.current) {
            completedCalledRef.current = true;
            setTimeout(() => onMissionComplete(), 800);
          }
          setTimeout(() => {
            addLines([
              { type: 'success', text: `✅ Step ${stepIdx + 1} complete!` },
              { type: 'info', text: '' },
              { type: 'success', text: '🎉 MISSION COMPLETE! ' + mission.completionMessage },
            ]);
          }, 50);
        }
      }
    } catch { /* ignore validation errors silently */ }
  }, [mission, addLines, onMissionComplete]);

  const handleReset = useCallback(async () => {
    setSeeding(true);
    setLines([{ type: 'info', text: 'Resetting to checkpoint...' }]);
    setAllComplete(false);
    completedCalledRef.current = false;
    setStepStates(mission.steps.map(() => ({ completed: false, hintVisible: false })));
    setActiveStep(0);
    try {
      const { git } = await ensureMissionLoaded();
      const freshFs = await wipeAndReinit();
      await mission.checkpointSeed(git, freshFs, MISSION_DIR);
      // Update the singleton reference
      _fs = freshFs;
      setLines([
        { type: 'success', text: '✓ Checkpoint restored.' },
        { type: 'info', text: '' },
        { type: 'info', text: `Step 1: ${mission.steps[0].instruction}` },
        { type: 'info', text: '' },
      ]);
    } catch (e: any) {
      setLines([{ type: 'error', text: `Reset failed: ${e.message}` }]);
    }
    setSeeding(false);
  }, [mission]);

  const executeCommand = useCallback(async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd || seeding) return;

    addLine('input', cmd);
    setHistory(prev => [cmd, ...prev.filter(h => h !== cmd)]);
    setHistIdx(-1);
    setLoading(true);

    try {
      const { git, fs } = await ensureMissionLoaded();
      const dir = MISSION_DIR;

      // ── HELP ─────────────────────────────────────────────
      if (cmd === 'help') {
        addLines([
          { type: 'info', text: '' },
          { type: 'info', text: '📋 Available Commands:' },
          { type: 'output', text: '  git init              — Initialize repo' },
          { type: 'output', text: '  git status            — Show working tree status' },
          { type: 'output', text: '  git add <file>        — Stage a file (use "." for all)' },
          { type: 'output', text: '  git commit -m ""      — Commit staged changes' },
          { type: 'output', text: '  git log [--oneline]   — Show commit history' },
          { type: 'output', text: '  git branch            — List branches' },
          { type: 'output', text: '  git switch -c <name>  — Create & switch branch' },
          { type: 'output', text: '  git switch <name>     — Switch branch' },
          { type: 'output', text: '  git merge <name>      — Merge branch' },
          { type: 'output', text: '  git remote -v         — Show remotes' },
          { type: 'output', text: '  git remote add ...    — Add remote' },
          { type: 'output', text: '  git push / pull       — Simulated network ops' },
          { type: 'output', text: '  git clone <url>       — Simulated clone' },
          { type: 'output', text: '  touch <file>          — Create empty file' },
          { type: 'output', text: '  echo "txt" > file     — Write to file' },
          { type: 'output', text: '  echo "txt" >> file    — Append to file' },
          { type: 'output', text: '  cat <file>            — Read file' },
          { type: 'output', text: '  ls                    — List files' },
          { type: 'output', text: '  clear                 — Clear terminal' },
          { type: 'info', text: '' },
        ]);
        setLoading(false);
        return;
      }

      // ── CLEAR ────────────────────────────────────────────
      if (cmd === 'clear') {
        setLines([{ type: 'info', text: 'Terminal cleared. Type "help" for commands.' }]);
        setLoading(false);
        return;
      }

      // ── LS ───────────────────────────────────────────────
      if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'ls -l') {
        try {
          const entries = await fs.readdir(dir).catch(() => [] as string[]);
          if (entries.length === 0) {
            addLine('output', '(empty directory)');
          } else {
            entries.filter((e: string) => e !== '.git').forEach((e: string) => addLine('output', `  ${e}`));
          }
        } catch {
          addLine('output', '(no files yet)');
        }
        setLoading(false);
        return;
      }

      // ── CAT ──────────────────────────────────────────────
      if (cmd.startsWith('cat ')) {
        const filename = cmd.slice(4).trim();
        try {
          const content = await fs.readFile(`${dir}/${filename}`, { encoding: 'utf8' }) as string;
          addLine('output', content || '(empty file)');
        } catch {
          addLine('error', `cat: ${filename}: No such file or directory`);
        }
        setLoading(false);
        return;
      }

      // ── TOUCH ────────────────────────────────────────────
      if (cmd.startsWith('touch ')) {
        const filename = cmd.slice(6).trim();
        try {
          await fs.writeFile(`${dir}/${filename}`, '', { encoding: 'utf8' });
          addLine('success', `✓ Created ${filename}`);
        } catch (e: any) {
          addLine('error', `touch: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── ECHO ─────────────────────────────────────────────
      if (cmd.startsWith('echo ')) {
        // Handles: echo "text" > file, echo "text" >> file, echo text
        const appendMatch = cmd.match(/echo\s+"?([^"]*)"?\s*>>\s*(.+)/);
        const writeMatch = cmd.match(/echo\s+"?([^"]*)"?\s*>\s*(.+)/);
        if (appendMatch) {
          const content = appendMatch[1];
          const filename = appendMatch[2].trim();
          try {
            let existing = '';
            try { existing = await fs.readFile(`${dir}/${filename}`, { encoding: 'utf8' }) as string; } catch { /* new file */ }
            await fs.writeFile(`${dir}/${filename}`, existing + content + '\n', { encoding: 'utf8' });
            addLine('success', `✓ Appended to ${filename}`);
          } catch (e: any) {
            addLine('error', `echo: ${e.message}`);
          }
        } else if (writeMatch) {
          const content = writeMatch[1];
          const filename = writeMatch[2].trim();
          try {
            await fs.writeFile(`${dir}/${filename}`, content + '\n', { encoding: 'utf8' });
            addLine('success', `✓ Written to ${filename}`);
          } catch (e: any) {
            addLine('error', `echo: ${e.message}`);
          }
        } else {
          const text = cmd.replace(/^echo\s+"?/, '').replace(/"?$/, '');
          addLine('output', text);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── COMPOUND: cmd1 && cmd2 ────────────────────────────
      if (cmd.includes(' && ')) {
        const parts = cmd.split(' && ').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          // Re-run each sub-command by recursion (simplified: just set input and go)
          // We call the logic inline via direct dispatch
          await executeCommand(part);
        }
        // Don't double-validate — last sub-command already did it
        setLoading(false);
        return;
      }

      // ── GIT INIT ─────────────────────────────────────────
      if (cmd === 'git init') {
        try {
          try { await fs.mkdir(dir); } catch { /* already exists */ }
          await git.init({ fs: { promises: fs }, dir, defaultBranch: 'main' });
          addLines([
            { type: 'success', text: '✓ Initialized empty Git repository' },
            { type: 'output', text: `  Location: ${dir}/.git/` },
          ]);
        } catch (e: any) {
          addLine('error', `git init: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT STATUS ───────────────────────────────────────
      if (cmd === 'git status') {
        try {
          const branch = await git.currentBranch({ fs: { promises: fs }, dir }) || 'main';
          const statusMatrix = await git.statusMatrix({ fs: { promises: fs }, dir });
          const staged: string[] = [];
          const modified: string[] = [];
          const untracked: string[] = [];
          for (const [fp, head, workdir, stage] of statusMatrix) {
            if (head === 1 && workdir === 1 && stage === 1) continue;
            if (stage === 2 || stage === 3) staged.push(fp);
            else if (workdir === 2 && head === 0) untracked.push(fp);
            else if (workdir === 2) modified.push(fp);
            else if (head === 1 && workdir === 0) modified.push(`${fp} (deleted)`);
          }
          const out: TerminalLine[] = [{ type: 'output', text: `On branch ${branch}` }];
          if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
            const commits = await git.log({ fs: { promises: fs }, dir }).catch(() => []);
            if (commits.length > 0) out.push({ type: 'success', text: 'nothing to commit, working tree clean' });
            else { out.push({ type: 'info', text: 'No commits yet' }); }
          } else {
            if (staged.length > 0) {
              out.push({ type: 'success', text: 'Changes to be committed:' });
              staged.forEach(f => out.push({ type: 'success', text: `        new file:   ${f}` }));
            }
            if (modified.length > 0) {
              out.push({ type: 'error', text: 'Changes not staged for commit:' });
              modified.forEach(f => out.push({ type: 'error', text: `        modified:   ${f}` }));
            }
            if (untracked.length > 0) {
              out.push({ type: 'output', text: 'Untracked files:' });
              out.push({ type: 'output', text: '  (use "git add <file>..." to include in commit)' });
              untracked.forEach(f => out.push({ type: 'output', text: `        ${f}` }));
            }
          }
          addLines(out);
        } catch (e: any) {
          addLine('error', `git status: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT ADD ──────────────────────────────────────────
      if (cmd.startsWith('git add')) {
        const target = cmd.slice(8).trim();
        try {
          if (target === '.' || target === '-A' || target === '--all') {
            const statusMatrix = await git.statusMatrix({ fs: { promises: fs }, dir });
            let count = 0;
            for (const [fp, , workdir] of statusMatrix) {
              if (workdir !== 1) { await git.add({ fs: { promises: fs }, dir, filepath: fp }); count++; }
            }
            addLine('success', `✓ Staged ${count} file(s)`);
          } else if (target) {
            await git.add({ fs: { promises: fs }, dir, filepath: target });
            addLine('success', `✓ Staged: ${target}`);
          } else {
            addLine('error', 'Usage: git add <file> or git add .');
          }
        } catch (e: any) {
          addLine('error', `git add: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT COMMIT ───────────────────────────────────────
      if (cmd.startsWith('git commit')) {
        const msgMatch = cmd.match(/-m\s+"([^"]+)"|'([^']+)'/);
        if (!msgMatch) { addLine('error', 'Usage: git commit -m "Your message"'); setLoading(false); return; }
        const message = msgMatch[1] || msgMatch[2];
        try {
          const sha = await git.commit({
            fs: { promises: fs }, dir, message,
            author: { name: 'You', email: 'you@portfolio.dev' },
          });
          const branch = await git.currentBranch({ fs: { promises: fs }, dir }) || 'main';
          addLines([
            { type: 'success', text: `[${branch} ${sha.slice(0, 7)}] ${message}` },
          ]);
        } catch (e: any) {
          addLine('error', `git commit: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT LOG ──────────────────────────────────────────
      if (cmd === 'git log' || cmd === 'git log --oneline' || cmd.startsWith('git log')) {
        const oneline = cmd.includes('--oneline');
        try {
          const log = await git.log({ fs: { promises: fs }, dir });
          if (log.length === 0) { addLine('info', 'No commits yet.'); setLoading(false); await runValidation(activeStep); return; }
          const branch = await git.currentBranch({ fs: { promises: fs }, dir }) || 'main';
          if (oneline) {
            log.forEach((c: any, i: number) => {
              const label = i === 0 ? ` (HEAD -> ${branch})` : '';
              addLine('output', `${c.oid.slice(0, 7)} ${c.commit.message.trim()}${label}`);
            });
          } else {
            log.forEach((c: any, i: number) => {
              const label = i === 0 ? ` (HEAD -> ${branch})` : '';
              const date = new Date(c.commit.author.timestamp * 1000).toLocaleString();
              addLines([
                { type: 'output', text: `commit ${c.oid}${label}` },
                { type: 'output', text: `Author: ${c.commit.author.name} <${c.commit.author.email}>` },
                { type: 'output', text: `Date:   ${date}` },
                { type: 'output', text: `    ${c.commit.message.trim()}` },
                { type: 'output', text: '' },
              ]);
            });
          }
        } catch (e: any) {
          addLine('error', `git log: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT BRANCH ───────────────────────────────────────
      if (cmd === 'git branch') {
        try {
          const branches = await git.listBranches({ fs: { promises: fs }, dir });
          const current = await git.currentBranch({ fs: { promises: fs }, dir }) || 'main';
          branches.forEach((b: string) => addLine(b === current ? 'success' : 'output', `${b === current ? '* ' : '  '}${b}`));
        } catch (e: any) {
          addLine('error', `git branch: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      if (cmd.startsWith('git branch ') && !cmd.includes('-d') && !cmd.includes('--delete')) {
        const name = cmd.slice(11).trim();
        try {
          await git.branch({ fs: { promises: fs }, dir, ref: name });
          addLine('success', `✓ Created branch: ${name}`);
        } catch (e: any) {
          addLine('error', `git branch: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT SWITCH ───────────────────────────────────────
      if (cmd.startsWith('git switch ')) {
        const parts = cmd.slice(11).trim().split(/\s+/);
        const createFlag = parts.includes('-c') || parts.includes('-C');
        const branchName = parts.find((p: string) => !p.startsWith('-'))!;
        try {
          if (createFlag) {
            await git.branch({ fs: { promises: fs }, dir, ref: branchName, checkout: true });
            addLine('success', `✓ Switched to new branch '${branchName}'`);
          } else {
            await git.checkout({ fs: { promises: fs }, dir, ref: branchName });
            addLine('success', `✓ Switched to branch '${branchName}'`);
          }
        } catch (e: any) {
          addLine('error', `git switch: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT CHECKOUT ─────────────────────────────────────
      if (cmd.startsWith('git checkout ')) {
        const parts = cmd.slice(13).trim().split(/\s+/);
        const createFlag = parts.includes('-b') || parts.includes('-B');
        const branchName = parts.find((p: string) => !p.startsWith('-'))!;
        try {
          if (createFlag) {
            await git.branch({ fs: { promises: fs }, dir, ref: branchName, checkout: true });
            addLine('success', `✓ Switched to new branch '${branchName}'`);
          } else {
            await git.checkout({ fs: { promises: fs }, dir, ref: branchName });
            addLine('success', `✓ Switched to branch '${branchName}'`);
          }
        } catch (e: any) {
          addLine('error', `git checkout: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT MERGE ────────────────────────────────────────
      if (cmd.startsWith('git merge ')) {
        const branchName = cmd.slice(10).trim();
        try {
          const current = await git.currentBranch({ fs: { promises: fs }, dir }) || 'main';
          const mergeResult = await git.merge({
            fs: { promises: fs }, dir,
            ours: current, theirs: branchName,
            author: { name: 'You', email: 'you@portfolio.dev' },
            message: `Merge branch '${branchName}' into ${current}`,
          });
          if (mergeResult.alreadyMerged) addLine('info', 'Already up to date.');
          else addLines([
            { type: 'success', text: `✓ Merged '${branchName}' into ${current}` },
            { type: 'output', text: 'Fast-forward' },
          ]);
        } catch (e: any) {
          addLine('error', `git merge: ${e.message}`);
        }
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT REMOTE ───────────────────────────────────────
      if (cmd === 'git remote' || cmd === 'git remote -v') {
        addLines([
          { type: 'info', text: '(Simulated — no real network in browser)' },
          { type: 'output', text: 'origin  https://github.com/you/my-portfolio.git (fetch)' },
          { type: 'output', text: 'origin  https://github.com/you/my-portfolio.git (push)' },
        ]);
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      if (cmd.startsWith('git remote add ')) {
        addLine('success', '✓ Remote "origin" added (simulated)');
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── GIT PUSH / PULL / CLONE ──────────────────────────
      if (cmd.startsWith('git push') || cmd.startsWith('git pull') || cmd.startsWith('git clone')) {
        addLines([
          { type: 'info', text: '🌐 Network commands are simulated in this browser environment.' },
          { type: 'success', text: '✓ Simulated: operation complete!' },
        ]);
        setLoading(false);
        await runValidation(activeStep);
        return;
      }

      // ── UNKNOWN ──────────────────────────────────────────
      addLine('error', `Command not recognized: "${cmd}". Type "help" for available commands.`);
    } catch (e: any) {
      addLine('error', `Error: ${e.message}`);
    }

    setLoading(false);
  }, [seeding, addLine, addLines, runValidation, activeStep]);

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

  const toggleHint = useCallback((idx: number) => {
    setStepStates(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], hintVisible: !next[idx].hintVisible };
      return next;
    });
  }, []);

  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'var(--neon-cyan)';
      case 'error': return '#ff4466';
      case 'success': return 'var(--neon-green)';
      case 'info': return 'rgba(150,180,220,0.65)';
      default: return 'rgba(200,220,255,0.85)';
    }
  };

  // ─── Mission Complete overlay ─────────────────────────────────────────────
  if (allComplete) {
    return (
      <div className="mission-complete" style={{
        background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,5,15,0.95))',
        border: '1px solid rgba(0,255,136,0.4)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(0,255,136,0.2)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          color: 'var(--neon-green)',
          textShadow: '0 0 20px var(--neon-green)',
          marginBottom: '16px',
          letterSpacing: '0.08em',
        }}>
          MISSION COMPLETE
        </h2>
        <p style={{ color: 'var(--text-bright)', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto 24px', fontSize: '1rem' }}>
          {mission.completionMessage}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {mission.steps.map((step, i) => (
            <div key={i} style={{
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.3)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '0.75rem',
              color: 'var(--neon-green)',
              fontFamily: 'var(--font-mono)',
            }}>
              ✓ Step {i + 1}
            </div>
          ))}
        </div>
        <button
          onClick={handleReset}
          style={{
            marginTop: '24px',
            background: 'rgba(0,245,255,0.1)',
            border: '1px solid rgba(0,245,255,0.3)',
            borderRadius: '10px',
            padding: '8px 20px',
            color: 'var(--neon-cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          ↺ Replay Mission
        </button>
      </div>
    );
  }

  // ─── Main layout ──────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = fullscreen ? {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'var(--bg-deep)',
    display: 'flex',
    flexDirection: 'column',
  } : {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(0,245,255,0.2)',
    background: 'rgba(5,8,25,0.92)',
    boxShadow: '0 0 40px rgba(0,245,255,0.1)',
    minHeight: '560px',
  };

  return (
    <div style={containerStyle}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(0,245,255,0.15)',
        background: 'rgba(0,10,30,0.8)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '1.2rem' }}>{mission.scene}</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.8rem',
          color: 'var(--neon-cyan)',
          letterSpacing: '0.08em',
          flex: 1,
          minWidth: '120px',
        }}>
          {mission.title}
        </span>

        {/* Step progress dots */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {mission.steps.map((_, i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: stepStates[i]?.completed
                ? 'var(--neon-green)'
                : i === activeStep
                  ? 'var(--neon-cyan)'
                  : 'rgba(100,120,160,0.4)',
              boxShadow: stepStates[i]?.completed
                ? '0 0 6px var(--neon-green)'
                : i === activeStep
                  ? '0 0 6px var(--neon-cyan)'
                  : 'none',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={seeding}
          style={{
            background: 'rgba(255,68,102,0.1)',
            border: '1px solid rgba(255,68,102,0.35)',
            borderRadius: '6px',
            padding: '4px 12px',
            color: '#ff4466',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            cursor: seeding ? 'not-allowed' : 'pointer',
            opacity: seeding ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          ↺ Reset
        </button>

        {/* Fullscreen toggle */}
        {!isMobile && (
          <button
            onClick={() => setFullscreen(v => !v)}
            style={{
              background: 'rgba(0,245,255,0.08)',
              border: '1px solid rgba(0,245,255,0.25)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {fullscreen ? '⊡ Exit' : '⛶ Full'}
          </button>
        )}
        {fullscreen && isMobile && (
          <button
            onClick={() => setFullscreen(false)}
            style={{
              background: 'rgba(0,245,255,0.08)',
              border: '1px solid rgba(0,245,255,0.25)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Body: split pane */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: 0,
      }}>

        {/* LEFT: Steps panel */}
        <div style={{
          width: isMobile ? '100%' : '280px',
          flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid rgba(0,245,255,0.12)',
          borderBottom: isMobile ? '1px solid rgba(0,245,255,0.12)' : 'none',
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: isMobile ? '220px' : 'unset',
        }}>
          {/* Story context */}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            lineHeight: 1.6,
            padding: '10px 12px',
            background: 'rgba(0,100,200,0.07)',
            borderRadius: '8px',
            border: '1px solid rgba(0,128,255,0.15)',
            marginBottom: '4px',
          }}>
            <span style={{ color: 'rgba(0,180,255,0.8)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', display: 'block', marginBottom: '4px' }}>
              MISSION BRIEFING
            </span>
            {mission.storyContext}
          </div>

          {/* Steps */}
          {mission.steps.map((step, i) => {
            const ss = stepStates[i];
            const isActive = i === activeStep;
            const isLocked = !ss.completed && i > activeStep;

            return (
              <div
                key={i}
                className={`mission-step ${ss.completed ? 'completed' : isActive ? 'active' : 'locked'}`}
                style={{
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: ss.completed
                    ? '1px solid rgba(0,255,136,0.4)'
                    : isActive
                      ? '1px solid rgba(0,245,255,0.4)'
                      : '1px solid rgba(100,120,160,0.2)',
                  background: ss.completed
                    ? 'rgba(0,255,136,0.05)'
                    : isActive
                      ? 'rgba(0,245,255,0.06)'
                      : 'rgba(5,8,25,0.4)',
                  opacity: isLocked ? 0.45 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 0 12px rgba(0,245,255,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    border: `2px solid ${ss.completed ? 'var(--neon-green)' : isActive ? 'var(--neon-cyan)' : 'rgba(100,120,160,0.4)'}`,
                    background: ss.completed ? 'rgba(0,255,136,0.2)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', color: ss.completed ? 'var(--neon-green)' : isActive ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    flexShrink: 0,
                    marginTop: '1px',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.3s ease',
                  }}>
                    {ss.completed ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.78rem',
                      color: ss.completed ? 'var(--neon-green)' : isActive ? 'var(--text-bright)' : 'var(--text-muted)',
                      lineHeight: 1.5,
                      margin: 0,
                      fontFamily: isActive ? 'inherit' : 'inherit',
                    }}>
                      {step.instruction}
                    </p>
                    {isActive && (
                      <button
                        onClick={() => toggleHint(i)}
                        style={{
                          marginTop: '8px',
                          background: 'transparent',
                          border: '1px solid rgba(255,215,0,0.3)',
                          borderRadius: '5px',
                          padding: '2px 8px',
                          color: 'rgba(255,215,0,0.7)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                        }}
                      >
                        {ss.hintVisible ? '🙈 Hide hint' : '💡 Show hint'}
                      </button>
                    )}
                    {ss.hintVisible && isActive && (
                      <div style={{
                        marginTop: '6px',
                        background: 'rgba(255,215,0,0.06)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'rgba(255,215,0,0.85)',
                      }}>
                        $ {step.hint}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Terminal */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          minWidth: 0,
        }}>
          {/* Terminal header */}
          <div className="terminal-header" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderBottom: '1px solid rgba(0,245,255,0.1)',
            flexShrink: 0,
          }}>
            <div className="terminal-dot" style={{ background: '#ff5f57' }} />
            <div className="terminal-dot" style={{ background: '#febc2e' }} />
            <div className="terminal-dot" style={{ background: '#28c840' }} />
            <span style={{
              color: 'rgba(0,245,255,0.5)',
              fontSize: '0.72rem',
              marginLeft: '8px',
              fontFamily: 'var(--font-mono)',
            }}>
              ⚡ mission ~ {MISSION_DIR}
            </span>
            {seeding && (
              <span style={{ marginLeft: 'auto', color: 'var(--neon-cyan)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                Loading...
              </span>
            )}
          </div>

          {/* Terminal output */}
          <div
            ref={terminalBodyRef}
            className="terminal-body"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 14px',
              cursor: 'text',
            }}
            onClick={() => inputRef.current?.focus()}
          >
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '1px' }}>
                {line.type === 'input' && (
                  <span className="terminal-prompt" style={{ flexShrink: 0 }}>$</span>
                )}
                <span style={{
                  color: lineColor(line.type),
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
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
                placeholder={seeding ? 'Loading mission...' : loading ? 'Running...' : 'enter a command...'}
                disabled={loading || seeding}
                autoComplete="off"
                spellCheck={false}
                style={{ flex: 1, minWidth: 0 }}
              />
              {(loading || seeding) && (
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--neon-cyan)',
                  animation: 'neon-pulse 0.8s ease-in-out infinite',
                  flexShrink: 0,
                }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
