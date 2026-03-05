// Types for the Git learning app
export type Section =
  | 'hero'
  | 'history'
  | 'concepts'
  | 'github'
  | 'git-init'
  | 'git-status'
  | 'git-add'
  | 'git-commit'
  | 'git-log'
  | 'git-branch'
  | 'git-merge'
  | 'gitignore'
  | 'git-clone'
  | 'git-remote'
  | 'git-push-pull'
  | 'playground'
  | 'quiz'
  | 'next-steps';

export interface CommandInfo {
  id: Section;
  title: string;
  emoji: string;
  color: 'cyan' | 'purple' | 'green' | 'pink' | 'orange';
  syntax: string;
  description: string;
  analogy: string;
  why: string;
  examples: Array<{
    scenario: string;
    command: string;
    output?: string;
    explanation: string;
  }>;
  tips: string[];
  tryItCommand?: string;
}

export interface CommitNode {
  hash: string;
  message: string;
  branch: string;
  parent?: string;
  timestamp: number;
  author: string;
}

export interface GitPlaygroundState {
  commits: CommitNode[];
  currentBranch: string;
  branches: string[];
  files: Record<string, string>;
  staged: string[];
  modified: string[];
  untracked: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface QuizResult {
  name: string;
  score: number;
  total: number;
  timeTaken: number;
  answers: number[];
  completedAt: string;
}

export interface Progress {
  completedSections: Section[];
  quizResult?: QuizResult;
  lastVisited?: Section;
}
