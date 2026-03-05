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
  allDiskFiles: string[]; // every file on disk (including untracked)
  lastCommand?: string;
}

// Each open tab in the editor
interface EditorTab {
  filename: string;
  content: string;
  savedContent: string; // what's currently on disk
  isNew: boolean;
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
  allDiskFiles: [],
};

// module-level singletons
let git: any = null;
let LightningFS: any = null;
let fs: any = null;
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

// ── Minimal syntax-token colorizer (no external dep) ──────────────────────
function tokenizeLine(line: string, ext: string): Array<{ text: string; color: string }> {
  const plain = 'rgba(200,230,255,0.88)';
  const kw = '#c792ea';
  const str = '#c3e88d';
  const comment = 'rgba(150,180,220,0.4)';
  const num = '#f78c6c';
  const tag = '#f07178';
  const attr = '#ffcb6b';
  const punct = 'rgba(200,230,255,0.45)';

  if (ext === 'html' || ext === 'htm' || ext === 'xml' || ext === 'svg') {
    // very simple HTML tokenizer
    const tokens: Array<{ text: string; color: string }> = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '<') {
        const end = line.indexOf('>', i);
        if (end === -1) { tokens.push({ text: line.slice(i), color: tag }); break; }
        const raw = line.slice(i, end + 1);
        tokens.push({ text: raw, color: tag });
        i = end + 1;
      } else if (line[i] === '"') {
        const end = line.indexOf('"', i + 1);
        if (end === -1) { tokens.push({ text: line.slice(i), color: str }); break; }
        tokens.push({ text: line.slice(i, end + 1), color: str });
        i = end + 1;
      } else {
        let j = i + 1;
        while (j < line.length && line[j] !== '<' && line[j] !== '"') j++;
        tokens.push({ text: line.slice(i, j), color: plain });
        i = j;
      }
    }
    return tokens.length ? tokens : [{ text: line, color: plain }];
  }

  if (ext === 'css' || ext === 'scss' || ext === 'less') {
    if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('//')) return [{ text: line, color: comment }];
    if (line.includes(':')) {
      const idx = line.indexOf(':');
      return [
        { text: line.slice(0, idx + 1), color: attr },
        { text: line.slice(idx + 1), color: str },
      ];
    }
    if (line.trimStart().startsWith('{') || line.trimStart().startsWith('}')) return [{ text: line, color: punct }];
    return [{ text: line, color: tag }];
  }

  if (ext === 'json') {
    if (line.trimStart().startsWith('"')) {
      const colon = line.indexOf('":');
      if (colon !== -1) {
        return [
          { text: line.slice(0, colon + 2), color: attr },
          { text: line.slice(colon + 2), color: str },
        ];
      }
      return [{ text: line, color: str }];
    }
    if (/^\s*(true|false|null)/.test(line)) return [{ text: line, color: kw }];
    if (/^\s*-?\d/.test(line)) return [{ text: line, color: num }];
    return [{ text: line, color: plain }];
  }

  // JS/TS/JSX/TSX/generic
  if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) return [{ text: line, color: comment }];
  const keywords = /\b(const|let|var|function|class|import|export|from|default|return|if|else|for|while|do|switch|case|break|continue|new|typeof|instanceof|async|await|try|catch|finally|throw|this|super|extends|interface|type|enum|implements|public|private|protected|static|readonly|null|undefined|true|false|void|of|in|yield|as|is)\b/g;
  const parts: Array<{ text: string; color: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = keywords.exec(line)) !== null) {
    if (m.index > last) parts.push({ text: line.slice(last, m.index), color: plain });
    parts.push({ text: m[0], color: kw });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last), color: plain });
  return parts.length ? parts : [{ text: line, color: plain }];
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

  // ── Multi-tab editor state ────────────────────────────────────────────
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  // Inline rename state: filename being renamed → current rename input value
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // Expand editor to full width (hide explorer column)
  const [editorExpanded, setEditorExpanded] = useState(false);
  // Context menu for file in explorer
  const [ctxMenu, setCtxMenu] = useState<{ file: string; x: number; y: number } | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived: the active tab object
  const activeTabData = tabs.find(t => t.filename === activeTab) ?? null;
  const isDirty = activeTabData ? activeTabData.content !== activeTabData.savedContent : false;

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

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => setCtxMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [ctxMenu]);

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingFile) setTimeout(() => renameInputRef.current?.focus(), 30);
  }, [renamingFile]);

  const refreshStatus = useCallback(async () => {
    if (!state.initialized) return;
    try {
      const { git: g, fs: f } = await ensureGitLoaded();

      let branch = 'main';
      try {
        branch = await g.currentBranch({ fs: { promises: f }, dir: DIR }) || 'main';
      } catch { /* ignore */ }

      let branches: string[] = ['main'];
      try {
        branches = await g.listBranches({ fs: { promises: f }, dir: DIR });
      } catch { /* ignore */ }

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

      let files: FileTree = {};
      try {
        const allFiles = await g.listFiles({ fs: { promises: f }, dir: DIR });
        allFiles.forEach(f => { files[f] = ''; });
      } catch { /* ignore */ }

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

      let allDiskFiles: string[] = [];
      try {
        const entries = await f.readdir(DIR);
        allDiskFiles = entries.filter((e: string) => e !== '.git');
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
        allDiskFiles,
      }));

      // Refresh content of any open tabs that changed on disk
      setTabs(prevTabs =>
        prevTabs.map(tab => {
          // We'll do the actual disk read async below; for now just keep them
          return tab;
        })
      );
    } catch (e) {
      console.error('refresh status error', e);
    }
  }, [state.initialized]);

  // ── Open/focus a file tab ────────────────────────────────────────────
  const openFile = useCallback(async (filename: string) => {
    try {
      const { fs: f } = await ensureGitLoaded();
      const content = await f.readFile(`${DIR}/${filename}`, { encoding: 'utf8' }) as string;
      setTabs(prev => {
        const exists = prev.find(t => t.filename === filename);
        if (exists) {
          // Refresh saved content in case it changed on disk
          return prev.map(t => t.filename === filename ? { ...t, savedContent: content } : t);
        }
        return [...prev, { filename, content, savedContent: content, isNew: false }];
      });
      setActiveTab(filename);
      setTimeout(() => editorRef.current?.focus(), 50);
    } catch {
      setTabs(prev => {
        if (prev.find(t => t.filename === filename)) return prev;
        return [...prev, { filename, content: '', savedContent: '', isNew: false }];
      });
      setActiveTab(filename);
    }
  }, []);

  // ── Close a tab ──────────────────────────────────────────────────────
  const closeTab = useCallback((filename: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTabs(prev => {
      const newTabs = prev.filter(t => t.filename !== filename);
      return newTabs;
    });
    setActiveTab(prev => {
      if (prev !== filename) return prev;
      const remaining = tabs.filter(t => t.filename !== filename);
      return remaining.length > 0 ? remaining[remaining.length - 1].filename : null;
    });
  }, [tabs]);

  // ── Save the active tab ──────────────────────────────────────────────
  const saveActiveTab = useCallback(async () => {
    if (!activeTabData) return;
    try {
      const { fs: f } = await ensureGitLoaded();
      await f.writeFile(`${DIR}/${activeTabData.filename}`, activeTabData.content, { encoding: 'utf8' });
      setTabs(prev => prev.map(t =>
        t.filename === activeTabData.filename ? { ...t, savedContent: t.content } : t
      ));
      addLine('success', `✓ Saved ${activeTabData.filename}`);
      await refreshStatus();
    } catch (e: any) {
      addLine('error', `Failed to save: ${e.message}`);
    }
  }, [activeTabData, addLine, refreshStatus]);

  // ── Create a new file ────────────────────────────────────────────────
  const createNewFile = useCallback(async (filename: string) => {
    if (!filename.trim()) return;
    try {
      const { fs: f } = await ensureGitLoaded();
      await f.writeFile(`${DIR}/${filename.trim()}`, '', { encoding: 'utf8' });
      addLine('success', `✓ Created ${filename.trim()}`);
      setShowNewFileForm(false);
      setNewFileName('');
      await refreshStatus();
      // Open the new file in a tab
      const tab: EditorTab = { filename: filename.trim(), content: '', savedContent: '', isNew: true };
      setTabs(prev => {
        if (prev.find(t => t.filename === tab.filename)) return prev;
        return [...prev, tab];
      });
      setActiveTab(tab.filename);
      setTimeout(() => editorRef.current?.focus(), 50);
    } catch (e: any) {
      addLine('error', `Failed to create file: ${e.message}`);
    }
  }, [addLine, refreshStatus]);

  // ── Delete a file ────────────────────────────────────────────────────
  const deleteFile = useCallback(async (filename: string) => {
    try {
      const { git: g, fs: f } = await ensureGitLoaded();
      // If tracked, use git rm; otherwise just unlink
      const isTracked = Object.keys(state.files).includes(filename);
      if (isTracked) {
        try {
          await g.remove({ fs: { promises: f }, dir: DIR, filepath: filename });
        } catch { /* ignore — we'll unlink anyway */ }
      }
      await f.unlink(`${DIR}/${filename}`);
      addLine('success', `✓ Deleted ${filename}`);
      // Close tab if open
      closeTab(filename);
      await refreshStatus();
    } catch (e: any) {
      addLine('error', `Failed to delete: ${e.message}`);
    }
  }, [state.files, addLine, closeTab, refreshStatus]);

  // ── Rename a file ────────────────────────────────────────────────────
  const commitRename = useCallback(async (oldName: string, newName: string) => {
    setRenamingFile(null);
    if (!newName.trim() || newName.trim() === oldName) return;
    const trimmed = newName.trim();
    try {
      const { fs: f } = await ensureGitLoaded();
      const content = await f.readFile(`${DIR}/${oldName}`, { encoding: 'utf8' }) as string;
      await f.writeFile(`${DIR}/${trimmed}`, content, { encoding: 'utf8' });
      await f.unlink(`${DIR}/${oldName}`);
      addLine('success', `✓ Renamed ${oldName} → ${trimmed}`);
      // Update tabs
      setTabs(prev => prev.map(t =>
        t.filename === oldName ? { ...t, filename: trimmed } : t
      ));
      setActiveTab(prev => prev === oldName ? trimmed : prev);
      await refreshStatus();
    } catch (e: any) {
      addLine('error', `Failed to rename: ${e.message}`);
    }
  }, [addLine, refreshStatus]);

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
          { type: 'output', text: '  git restore <f>   — Discard workdir changes' },
          { type: 'output', text: '  git rm <file>     — Remove tracked file' },
          { type: 'output', text: '  touch <file>      — Create a file' },
          { type: 'output', text: '  echo "txt" > file — Write to file' },
          { type: 'output', text: '  cat <file>        — Read file contents' },
          { type: 'output', text: '  rm <file>         — Delete a file' },
          { type: 'output', text: '  mv <src> <dst>    — Rename / move a file' },
          { type: 'output', text: '  ls                — List files' },
          { type: 'output', text: '  clear             — Clear terminal' },
          { type: 'output', text: '  reset             — Reset entire playground' },
          { type: 'info', text: '' },
          { type: 'info', text: '📝 FILE EDITOR: Click any file in the panel →' },
          { type: 'info', text: '   double-click filename to rename it.' },
          { type: 'info', text: '   right-click for delete / stage / unstage.' },
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
        const newFs = new LightningFS!('git-playground', { wipe: true });
        fsInstance = newFs;
        fs = newFs.promises;
        setState(INITIAL_STATE);
        setTabs([]);
        setActiveTab(null);
        setShowNewFileForm(false);
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

      // ── RM ────────────────────────────────────────────────
      if (cmd.startsWith('rm ') && !cmd.startsWith('rm -')) {
        const filename = cmd.slice(3).trim();
        try {
          await f.unlink(`${DIR}/${filename}`);
          addLine('success', `✓ Removed ${filename}`);
          closeTab(filename);
          await refreshStatus();
        } catch {
          addLine('error', `rm: ${filename}: No such file or directory`);
        }
        setLoading(false);
        return;
      }

      // ── MV ────────────────────────────────────────────────
      if (cmd.startsWith('mv ')) {
        const parts = cmd.slice(3).trim().split(/\s+/);
        if (parts.length < 2) {
          addLine('error', 'Usage: mv <source> <destination>');
          setLoading(false);
          return;
        }
        const [src, dst] = parts;
        try {
          const content = await f.readFile(`${DIR}/${src}`, { encoding: 'utf8' }) as string;
          await f.writeFile(`${DIR}/${dst}`, content, { encoding: 'utf8' });
          await f.unlink(`${DIR}/${src}`);
          addLine('success', `✓ Renamed ${src} → ${dst}`);
          setTabs(prev => prev.map(t => t.filename === src ? { ...t, filename: dst } : t));
          setActiveTab(prev => prev === src ? dst : prev);
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `mv: ${e.message}`);
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
            // Refresh tab if open
            setTabs(prev => prev.map(t =>
              t.filename === filename
                ? { ...t, content: content + '\n', savedContent: content + '\n' }
                : t
            ));
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
          try { await f.mkdir(DIR); } catch { /* already exists */ }
          await g.init({ fs: { promises: f }, dir: DIR, defaultBranch: 'main' });
          addLines([
            { type: 'success', text: '✓ Initialized empty Git repository' },
            { type: 'output', text: `  Location: ${DIR}/.git/` },
            { type: 'info', text: '' },
            { type: 'info', text: '💡 Try: click "+ New File" in the panel to create files!' },
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
            if (head === 1 && workdir === 1 && stage === 1) continue;
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
              staged.forEach(fi => outputLines.push({ type: 'success', text: `        modified:   ${fi}` }));
            }
            if (modified.length > 0) {
              outputLines.push({ type: 'error', text: '' });
              outputLines.push({ type: 'error', text: 'Changes not staged for commit:' });
              modified.forEach(fi => outputLines.push({ type: 'error', text: `        modified:   ${fi}` }));
            }
            if (untracked.length > 0) {
              outputLines.push({ type: 'output', text: '' });
              outputLines.push({ type: 'output', text: 'Untracked files:' });
              outputLines.push({ type: 'output', text: '  (use "git add <file>..." to include in commit)' });
              untracked.forEach(fi => outputLines.push({ type: 'output', text: `        ${fi}` }));
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

      // ── GIT RESTORE ───────────────────────────────────────
      if (cmd.startsWith('git restore')) {
        const parts = cmd.slice(12).trim().split(/\s+/);
        const staged = parts.includes('--staged') || parts.includes('-S');
        const file = parts.find(p => !p.startsWith('-'));
        if (!file) {
          addLine('error', 'Usage: git restore <file>  OR  git restore --staged <file>');
          setLoading(false);
          return;
        }
        try {
          if (staged) {
            await g.resetIndex({ fs: { promises: f }, dir: DIR, filepath: file });
            addLine('success', `✓ Unstaged: ${file}`);
          } else {
            await g.checkout({ fs: { promises: f }, dir: DIR, filepaths: [file] });
            addLine('success', `✓ Restored: ${file}`);
            // Refresh tab
            try {
              const content = await f.readFile(`${DIR}/${file}`, { encoding: 'utf8' }) as string;
              setTabs(prev => prev.map(t =>
                t.filename === file ? { ...t, content, savedContent: content } : t
              ));
            } catch { /* ignore */ }
          }
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git restore: ${e.message}`);
        }
        setLoading(false);
        return;
      }

      // ── GIT RM ────────────────────────────────────────────
      if (cmd.startsWith('git rm')) {
        const parts = cmd.slice(7).trim().split(/\s+/);
        const cached = parts.includes('--cached');
        const file = parts.find(p => !p.startsWith('-'));
        if (!file) {
          addLine('error', 'Usage: git rm <file>  OR  git rm --cached <file>');
          setLoading(false);
          return;
        }
        try {
          await g.remove({ fs: { promises: f }, dir: DIR, filepath: file });
          if (!cached) {
            await f.unlink(`${DIR}/${file}`);
            closeTab(file);
            addLine('success', `✓ Removed ${file} from repo and disk`);
          } else {
            addLine('success', `✓ Untracked ${file} (file kept on disk)`);
          }
          await refreshStatus();
        } catch (e: any) {
          addLine('error', `git rm: ${e.message}`);
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

      // ── GIT PUSH / PULL / CLONE ───────────────────────────
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
  }, [state, addLine, addLines, refreshStatus, closeTab]);

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

  // All files to display in the explorer
  const allFiles = Array.from(new Set([
    ...state.allDiskFiles,
    ...Object.keys(state.files),
    ...state.untracked,
  ])).sort();

  const getFileStatus = (filename: string): 'staged' | 'modified' | 'untracked' | 'clean' => {
    if (state.staged.includes(filename)) return 'staged';
    if (state.modified.includes(filename)) return 'modified';
    if (state.untracked.includes(filename)) return 'untracked';
    return 'clean';
  };

  const fileStatusColor = {
    staged: 'var(--neon-green)',
    modified: '#febc2e',
    untracked: 'rgba(200,220,255,0.5)',
    clean: 'var(--text-dim)',
  };
  const fileStatusLabel = { staged: 'S', modified: 'M', untracked: 'U', clean: '' };

  // File extension for tokenizer
  const activeExt = activeTab ? activeTab.split('.').pop()?.toLowerCase() ?? '' : '';

  // ── Context menu actions ─────────────────────────────────────────────
  const ctxActions = ctxMenu ? [
    {
      label: '📝 Open / Edit',
      action: () => { openFile(ctxMenu.file); setCtxMenu(null); },
    },
    {
      label: '✏️ Rename',
      action: () => {
        setRenamingFile(ctxMenu.file);
        setRenameValue(ctxMenu.file);
        setCtxMenu(null);
      },
    },
    state.staged.includes(ctxMenu.file)
      ? {
          label: '↩ Unstage (git restore --staged)',
          action: () => { executeCommand(`git restore --staged ${ctxMenu.file}`); setCtxMenu(null); },
        }
      : {
          label: '➕ Stage (git add)',
          action: () => { executeCommand(`git add ${ctxMenu.file}`); setCtxMenu(null); },
        },
    {
      label: '🗑 Delete file',
      action: () => { deleteFile(ctxMenu.file); setCtxMenu(null); },
      danger: true,
    },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Context menu */}
      {ctxMenu && (
        <div
          style={{
            position: 'fixed',
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 9999,
            background: 'rgba(10,14,28,0.97)',
            border: '1px solid rgba(0,245,255,0.25)',
            borderRadius: '6px',
            padding: '4px 0',
            minWidth: '200px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {ctxActions.map((a, i) => (
            <button
              key={i}
              onClick={a.action}
              style={{
                display: 'block',
                width: '100%',
                padding: '7px 14px',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: (a as any).danger ? '#ff4466' : 'rgba(200,230,255,0.85)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,245,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

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

      <div style={{ display: 'grid', gridTemplateColumns: editorExpanded ? '1fr' : '1fr 300px', gap: '16px' }}>
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

        {/* ── RIGHT PANEL (file explorer + editor) ──────────── */}
        {!editorExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* FILE EXPLORER */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', flex: tabs.length > 0 ? '0 0 auto' : '1' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px',
                borderBottom: '1px solid rgba(0,245,255,0.1)',
              }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                  📁 FILES
                </span>
                {state.initialized && (
                  <button
                    onClick={() => { setShowNewFileForm(v => !v); setNewFileName(''); }}
                    style={{
                      background: showNewFileForm ? 'rgba(0,245,255,0.15)' : 'rgba(0,245,255,0.05)',
                      border: '1px solid rgba(0,245,255,0.3)',
                      color: 'var(--neon-cyan)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {showNewFileForm ? '✕ Cancel' : '+ New File'}
                  </button>
                )}
              </div>

              {/* New file form */}
              {showNewFileForm && (
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(0,245,255,0.1)',
                  background: 'rgba(0,245,255,0.04)',
                  display: 'flex', gap: '6px', alignItems: 'center',
                }}>
                  <input
                    autoFocus
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') createNewFile(newFileName);
                      if (e.key === 'Escape') { setShowNewFileForm(false); setNewFileName(''); }
                    }}
                    placeholder="filename.ext"
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(0,245,255,0.3)',
                      borderRadius: '4px',
                      color: 'var(--neon-cyan)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => createNewFile(newFileName)}
                    style={{
                      background: 'rgba(0,245,255,0.15)',
                      border: '1px solid rgba(0,245,255,0.4)',
                      color: 'var(--neon-cyan)',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Create
                  </button>
                </div>
              )}

              {/* File list */}
              <div style={{ maxHeight: tabs.length > 0 ? '130px' : '200px', overflowY: 'auto' }}>
                {!state.initialized ? (
                  <div style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                    Run git init to start
                  </div>
                ) : allFiles.length === 0 ? (
                  <div style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                    No files yet.<br />Click + New File above.
                  </div>
                ) : (
                  allFiles.map(filename => {
                    const status = getFileStatus(filename);
                    const isOpen = tabs.some(t => t.filename === filename);
                    const isActive = activeTab === filename;
                    const isRenaming = renamingFile === filename;

                    return (
                      <div
                        key={filename}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '5px 12px',
                          background: isActive ? 'rgba(0,245,255,0.08)' : isOpen ? 'rgba(0,245,255,0.03)' : 'transparent',
                          borderLeft: isActive ? '2px solid var(--neon-cyan)' : isOpen ? '2px solid rgba(0,245,255,0.3)' : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onClick={() => !isRenaming && openFile(filename)}
                        onDoubleClick={() => { setRenamingFile(filename); setRenameValue(filename); }}
                        onContextMenu={e => { e.preventDefault(); setCtxMenu({ file: filename, x: e.clientX, y: e.clientY }); }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = isOpen ? 'rgba(0,245,255,0.03)' : 'transparent'; }}
                      >
                        <span style={{ fontSize: '0.72rem', flexShrink: 0 }}>📄</span>
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => {
                              e.stopPropagation();
                              if (e.key === 'Enter') commitRename(filename, renameValue);
                              if (e.key === 'Escape') setRenamingFile(null);
                            }}
                            onBlur={() => commitRename(filename, renameValue)}
                            style={{
                              flex: 1,
                              background: 'rgba(0,0,0,0.5)',
                              border: '1px solid rgba(0,245,255,0.5)',
                              borderRadius: '3px',
                              color: 'var(--neon-cyan)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.72rem',
                              padding: '1px 5px',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <span style={{
                            flex: 1,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.74rem',
                            color: isActive ? 'var(--neon-cyan)' : fileStatusColor[status],
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                            title="Click to open • Double-click to rename • Right-click for more"
                          >
                            {filename}
                          </span>
                        )}
                        {!isRenaming && fileStatusLabel[status] && (
                          <span style={{
                            fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                            color: fileStatusColor[status], fontWeight: 700, opacity: 0.9, flexShrink: 0,
                          }}>
                            {fileStatusLabel[status]}
                          </span>
                        )}
                        {!isRenaming && (
                          <button
                            title="Delete file"
                            onClick={e => { e.stopPropagation(); deleteFile(filename); }}
                            style={{
                              background: 'transparent', border: 'none',
                              color: 'rgba(255,68,102,0)', cursor: 'pointer',
                              fontSize: '0.65rem', padding: '0 2px', flexShrink: 0,
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ff4466')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,68,102,0)')}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Legend */}
              {state.initialized && allFiles.length > 0 && (
                <div style={{
                  display: 'flex', gap: '10px', padding: '5px 12px',
                  borderTop: '1px solid rgba(0,245,255,0.08)',
                  fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                }}>
                  <span><span style={{ color: 'var(--neon-green)' }}>S</span> staged</span>
                  <span><span style={{ color: '#febc2e' }}>M</span> modified</span>
                  <span><span style={{ color: 'rgba(200,220,255,0.5)' }}>U</span> untracked</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.6 }}>dbl-click=rename</span>
                </div>
              )}
            </div>

            {/* ── MULTI-TAB FILE EDITOR ────────────────────── */}
            {tabs.length > 0 && (
              <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Tab bar */}
                <div style={{
                  display: 'flex',
                  overflowX: 'auto',
                  borderBottom: '1px solid rgba(191,0,255,0.2)',
                  background: 'rgba(191,0,255,0.04)',
                  scrollbarWidth: 'none',
                }}>
                  {tabs.map(tab => {
                    const tabDirty = tab.content !== tab.savedContent;
                    const isActive = activeTab === tab.filename;
                    return (
                      <div
                        key={tab.filename}
                        onClick={() => { setActiveTab(tab.filename); setTimeout(() => editorRef.current?.focus(), 30); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          borderRight: '1px solid rgba(191,0,255,0.15)',
                          borderBottom: isActive ? '2px solid var(--neon-purple)' : '2px solid transparent',
                          background: isActive ? 'rgba(191,0,255,0.1)' : 'transparent',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transition: 'background 0.12s',
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                          color: isActive ? 'var(--neon-purple)' : 'var(--text-dim)',
                          maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {tab.filename}
                        </span>
                        {tabDirty && (
                          <span style={{ color: '#febc2e', fontSize: '0.75rem', lineHeight: 1 }} title="Unsaved">●</span>
                        )}
                        <button
                          title="Close tab"
                          onClick={e => closeTab(tab.filename, e)}
                          style={{
                            background: 'transparent', border: 'none',
                            color: 'rgba(200,230,255,0.3)',
                            cursor: 'pointer', fontSize: '0.65rem', padding: '0 1px',
                            lineHeight: 1,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ff4466')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,230,255,0.3)')}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  {/* Expand button */}
                  <button
                    title="Expand editor to full width"
                    onClick={() => setEditorExpanded(true)}
                    style={{
                      marginLeft: 'auto',
                      background: 'transparent', border: 'none',
                      color: 'rgba(0,245,255,0.4)',
                      cursor: 'pointer', padding: '6px 10px',
                      fontSize: '0.7rem', flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,245,255,0.4)')}
                  >
                    ⤢
                  </button>
                </div>

                {/* Editor body */}
                {activeTabData && (
                  <>
                    {/* Line-numbered editor */}
                    <div style={{ flex: 1, display: 'flex', minHeight: '200px', overflow: 'hidden' }}>
                      {/* Line numbers gutter */}
                      <div style={{
                        background: 'rgba(0,0,0,0.25)',
                        borderRight: '1px solid rgba(191,0,255,0.1)',
                        padding: '10px 0',
                        userSelect: 'none',
                        minWidth: '36px',
                        overflowY: 'hidden',
                        textAlign: 'right',
                      }}>
                        {(activeTabData.content + '\n').split('\n').slice(0, -1).map((_, lineIdx) => (
                          <div key={lineIdx} style={{
                            height: '1.6em',
                            lineHeight: '1.6em',
                            paddingRight: '8px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.72rem',
                            color: 'rgba(150,170,210,0.3)',
                          }}>
                            {lineIdx + 1}
                          </div>
                        ))}
                      </div>

                      {/* Tokenized overlay + hidden textarea trick */}
                      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {/* Syntax-highlighted backdrop (aria-hidden) */}
                        <div
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            padding: '10px 12px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            lineHeight: '1.6em',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowY: 'auto',
                            pointerEvents: 'none',
                            color: 'transparent', // base invisible
                          }}
                        >
                          {activeTabData.content.split('\n').map((line, li) => (
                            <div key={li} style={{ height: '1.6em', overflow: 'hidden' }}>
                              {tokenizeLine(line, activeExt).map((tok, ti) => (
                                <span key={ti} style={{ color: tok.color }}>{tok.text}</span>
                              ))}
                              {'\n'}
                            </div>
                          ))}
                        </div>

                        {/* Actual textarea (transparent text, caret visible) */}
                        <textarea
                          ref={editorRef}
                          value={activeTabData.content}
                          onChange={e => {
                            const val = e.target.value;
                            setTabs(prev => prev.map(t =>
                              t.filename === activeTab ? { ...t, content: val } : t
                            ));
                          }}
                          onKeyDown={e => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                              e.preventDefault();
                              saveActiveTab();
                            }
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const start = e.currentTarget.selectionStart;
                              const end = e.currentTarget.selectionEnd;
                              const val = activeTabData.content;
                              const newVal = val.substring(0, start) + '  ' + val.substring(end);
                              setTabs(prev => prev.map(t =>
                                t.filename === activeTab ? { ...t, content: newVal } : t
                              ));
                              setTimeout(() => {
                                if (editorRef.current) {
                                  editorRef.current.selectionStart = start + 2;
                                  editorRef.current.selectionEnd = start + 2;
                                }
                              }, 0);
                            }
                          }}
                          placeholder={`// ${activeTabData.filename}\n// Start typing...`}
                          spellCheck={false}
                          style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            width: '100%', height: '100%',
                            resize: 'none',
                            background: 'rgba(0,0,0,0.3)',
                            border: 'none',
                            color: 'rgba(200,230,255,0.88)',
                            caretColor: 'var(--neon-cyan)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            lineHeight: '1.6em',
                            padding: '10px 12px',
                            outline: 'none',
                            overflowY: 'auto',
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer bar */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '4px 10px',
                      borderTop: '1px solid rgba(191,0,255,0.12)',
                      background: 'rgba(0,0,0,0.2)',
                      fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                    }}>
                      <span style={{ color: activeExt ? 'rgba(0,245,255,0.45)' : 'var(--text-muted)' }}>
                        {activeExt ? activeExt.toUpperCase() : 'TXT'}
                      </span>
                      <span>
                        {(activeTabData.content.split('\n').length)} lines
                      </span>
                      <span>Ctrl+S save</span>
                      <span>Tab=2sp</span>
                      {isDirty && (
                        <button
                          onClick={saveActiveTab}
                          style={{
                            marginLeft: 'auto',
                            background: 'rgba(0,245,255,0.1)',
                            border: '1px solid rgba(0,245,255,0.35)',
                            color: 'var(--neon-cyan)',
                            borderRadius: '3px',
                            padding: '1px 8px',
                            fontSize: '0.6rem',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          ✓ Save
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Commit Graph (when no tabs open) */}
            {tabs.length === 0 && (
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
            )}

            {/* Branches panel */}
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
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                      color: b === state.currentBranch ? 'var(--neon-green)' : 'var(--text-dim)',
                    }}>
                      {b === state.currentBranch ? '* ' : '  '}{b}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EXPANDED EDITOR (full-width mode) ──────────────── */}
        {editorExpanded && tabs.length > 0 && (
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex', overflowX: 'auto',
              borderBottom: '1px solid rgba(191,0,255,0.2)',
              background: 'rgba(191,0,255,0.04)',
              scrollbarWidth: 'none',
            }}>
              {tabs.map(tab => {
                const tabDirty = tab.content !== tab.savedContent;
                const isActive = activeTab === tab.filename;
                return (
                  <div
                    key={tab.filename}
                    onClick={() => { setActiveTab(tab.filename); setTimeout(() => editorRef.current?.focus(), 30); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px',
                      cursor: 'pointer',
                      borderRight: '1px solid rgba(191,0,255,0.15)',
                      borderBottom: isActive ? '2px solid var(--neon-purple)' : '2px solid transparent',
                      background: isActive ? 'rgba(191,0,255,0.12)' : 'transparent',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: isActive ? 'var(--neon-purple)' : 'var(--text-dim)' }}>
                      {tab.filename}
                    </span>
                    {tabDirty && <span style={{ color: '#febc2e', fontSize: '0.8rem' }}>●</span>}
                    <button
                      onClick={e => closeTab(tab.filename, e)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(200,230,255,0.3)', cursor: 'pointer', fontSize: '0.7rem', padding: '0 2px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ff4466')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,230,255,0.3)')}
                    >✕</button>
                  </div>
                );
              })}
              {/* Collapse button */}
              <button
                title="Collapse editor"
                onClick={() => setEditorExpanded(false)}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent', border: 'none',
                  color: 'rgba(0,245,255,0.4)',
                  cursor: 'pointer', padding: '7px 12px',
                  fontSize: '0.75rem', flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,245,255,0.4)')}
              >
                ⤡ Collapse
              </button>
            </div>

            {activeTabData && (
              <>
                <div style={{ flex: 1, display: 'flex', minHeight: '300px', overflow: 'hidden' }}>
                  {/* Gutter */}
                  <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    borderRight: '1px solid rgba(191,0,255,0.1)',
                    padding: '10px 0',
                    userSelect: 'none',
                    minWidth: '42px',
                    textAlign: 'right',
                  }}>
                    {(activeTabData.content + '\n').split('\n').slice(0, -1).map((_, lineIdx) => (
                      <div key={lineIdx} style={{
                        height: '1.6em', lineHeight: '1.6em', paddingRight: '10px',
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                        color: 'rgba(150,170,210,0.3)',
                      }}>
                        {lineIdx + 1}
                      </div>
                    ))}
                  </div>

                  {/* Code area */}
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        padding: '10px 14px',
                        fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: '1.6em',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        overflowY: 'auto', pointerEvents: 'none', color: 'transparent',
                      }}
                    >
                      {activeTabData.content.split('\n').map((line, li) => (
                        <div key={li} style={{ height: '1.6em', overflow: 'hidden' }}>
                          {tokenizeLine(line, activeExt).map((tok, ti) => (
                            <span key={ti} style={{ color: tok.color }}>{tok.text}</span>
                          ))}
                          {'\n'}
                        </div>
                      ))}
                    </div>
                    <textarea
                      ref={editorRef}
                      value={activeTabData.content}
                      onChange={e => {
                        const val = e.target.value;
                        setTabs(prev => prev.map(t =>
                          t.filename === activeTab ? { ...t, content: val } : t
                        ));
                      }}
                      onKeyDown={e => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveActiveTab(); }
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const start = e.currentTarget.selectionStart;
                          const end = e.currentTarget.selectionEnd;
                          const val = activeTabData.content;
                          const newVal = val.substring(0, start) + '  ' + val.substring(end);
                          setTabs(prev => prev.map(t =>
                            t.filename === activeTab ? { ...t, content: newVal } : t
                          ));
                          setTimeout(() => {
                            if (editorRef.current) {
                              editorRef.current.selectionStart = start + 2;
                              editorRef.current.selectionEnd = start + 2;
                            }
                          }, 0);
                        }
                      }}
                      spellCheck={false}
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        width: '100%', height: '100%',
                        resize: 'none', background: 'rgba(0,0,0,0.3)', border: 'none',
                        color: 'rgba(200,230,255,0.88)', caretColor: 'var(--neon-cyan)',
                        fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: '1.6em',
                        padding: '10px 14px', outline: 'none', overflowY: 'auto',
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '5px 12px',
                  borderTop: '1px solid rgba(191,0,255,0.12)',
                  background: 'rgba(0,0,0,0.2)',
                  fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                }}>
                  <span style={{ color: activeExt ? 'rgba(0,245,255,0.5)' : 'var(--text-muted)' }}>
                    {activeExt ? activeExt.toUpperCase() : 'TXT'}
                  </span>
                  <span>{activeTabData.content.split('\n').length} lines</span>
                  <span>Ctrl+S save</span>
                  <span>Tab=2sp</span>
                  {isDirty && (
                    <button
                      onClick={saveActiveTab}
                      style={{
                        marginLeft: 'auto',
                        background: 'rgba(0,245,255,0.1)',
                        border: '1px solid rgba(0,245,255,0.35)',
                        color: 'var(--neon-cyan)',
                        borderRadius: '3px', padding: '2px 10px',
                        fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ✓ Save
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
