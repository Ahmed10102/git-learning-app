import type { CommandInfo, QuizQuestion } from './types';

export const COMMANDS: CommandInfo[] = [
  {
    id: 'git-init',
    title: 'git init',
    emoji: '🚀',
    color: 'cyan',
    syntax: 'git init',
    description: 'Creates a brand-new Git repository in your current folder.',
    analogy: 'Think of it like setting up a brand new diary for your project. Before git init, Git has no idea your folder exists. After it, Git starts watching every change!',
    why: 'You run this once at the start of every new project. It creates a hidden .git folder that stores all the magic — your history, branches, settings, everything.',
    examples: [
      {
        scenario: 'Starting a new website project',
        command: 'mkdir my-website\ncd my-website\ngit init',
        output: 'Initialized empty Git repository in /my-website/.git/',
        explanation: 'You make a new folder, step inside it, and tell Git to start tracking it. Done!'
      },
      {
        scenario: 'Turning an existing project into a Git repo',
        command: 'cd my-old-project\ngit init',
        output: 'Initialized empty Git repository in /my-old-project/.git/',
        explanation: 'Even if you already have files, git init works. Git will start tracking changes from now on.'
      }
    ],
    tips: [
      'Only run git init once per project',
      'You\'ll see a hidden .git folder appear — don\'t delete it!',
      'git init doesn\'t upload anything — it\'s purely local'
    ],
    tryItCommand: 'git init'
  },
  {
    id: 'git-status',
    title: 'git status',
    emoji: '🔍',
    color: 'green',
    syntax: 'git status',
    description: 'Shows you what\'s happening in your repo right now.',
    analogy: 'Like asking "What\'s changed since I last saved?" It\'s your go-to check-up command. Developers run it constantly — it\'s like glancing at your dashboard.',
    why: 'Before you save your work (commit), you want to know: What files changed? What did I add? What did I forget? git status answers all of this instantly.',
    examples: [
      {
        scenario: 'After editing a file',
        command: 'git status',
        output: 'On branch main\nChanges not staged for commit:\n  modified:   index.html\n\nno changes added to commit',
        explanation: 'Git tells you index.html was changed but not yet saved (staged). Time to git add it!'
      },
      {
        scenario: 'After creating a new file',
        command: 'git status',
        output: 'On branch main\nUntracked files:\n  style.css\n\nnothing added to commit but untracked files present',
        explanation: 'Git sees style.css but isn\'t tracking it yet. It\'s "untracked" — use git add to include it.'
      }
    ],
    tips: [
      'Run git status before every commit — make it a habit!',
      'Green = staged (ready to commit), Red = not staged yet',
      'It never changes anything — it\'s safe to run anytime'
    ],
    tryItCommand: 'git status'
  },
  {
    id: 'git-add',
    title: 'git add',
    emoji: '📦',
    color: 'purple',
    syntax: 'git add <filename>\ngit add .',
    description: 'Stages files — tells Git "include this in my next save."',
    analogy: 'Imagine packing a box to ship. git add puts items INTO the box. You can carefully choose which items go in, or toss everything in with git add . The actual shipping (commit) happens later.',
    why: 'Git gives you control over exactly what goes into each save. Maybe you changed 5 files but only want to save 2. git add lets you pick and choose.',
    examples: [
      {
        scenario: 'Stage one specific file',
        command: 'git add index.html',
        output: '(no output = success)',
        explanation: 'Only index.html is staged. Your other changed files are ignored for this commit.'
      },
      {
        scenario: 'Stage everything at once',
        command: 'git add .',
        output: '(stages all changed/new files in current directory)',
        explanation: 'The . means "everything here." Super handy when you want to save all your changes at once.'
      }
    ],
    tips: [
      'git add . is the most common — it adds everything',
      'Use git status after git add to verify what\'s staged',
      'You can un-stage with: git restore --staged <file>'
    ],
    tryItCommand: 'git add .'
  },
  {
    id: 'git-commit',
    title: 'git commit',
    emoji: '💾',
    color: 'pink',
    syntax: 'git commit -m "Your message here"',
    description: 'Saves a permanent snapshot of your staged changes.',
    analogy: 'Like hitting "Save Game" in a video game. Each commit is a checkpoint you can always go back to. The -m flag lets you write a short note about what you changed.',
    why: 'This is THE core action in Git. Every commit creates a safe checkpoint. Good commit messages are like a journal — they tell the story of your project over time.',
    examples: [
      {
        scenario: 'After building a feature',
        command: 'git commit -m "Add login button to homepage"',
        output: '[main 3a7f2c1] Add login button to homepage\n 1 file changed, 5 insertions(+)',
        explanation: 'Git saves a snapshot and gives it a unique ID (3a7f2c1). That message describes what you did.'
      },
      {
        scenario: 'Fixing a bug',
        command: 'git commit -m "Fix typo in contact form email field"',
        output: '[main 8d1e9a3] Fix typo in contact form email field\n 1 file changed, 1 insertion(+), 1 deletion(-)',
        explanation: 'Clear, specific messages help future-you understand what happened without reading the code.'
      }
    ],
    tips: [
      'Write messages in the present tense: "Add feature" not "Added feature"',
      'Be specific! "Fix bug" is bad. "Fix crash when user logs out" is great.',
      'You must git add first — commit only saves staged changes'
    ],
    tryItCommand: 'git commit -m "My first commit!"'
  },
  {
    id: 'git-log',
    title: 'git log',
    emoji: '📜',
    color: 'orange',
    syntax: 'git log\ngit log --oneline',
    description: 'Shows the full history of all commits in your repo.',
    analogy: 'Like reading your project\'s diary from newest to oldest. Every save (commit) you\'ve ever made appears here, with who made it, when, and why.',
    why: 'You\'ll use git log to understand what happened, find a specific change, or figure out when a bug was introduced. It\'s your project\'s complete timeline.',
    examples: [
      {
        scenario: 'View full commit history',
        command: 'git log',
        output: 'commit 8d1e9a3...\nAuthor: You <you@email.com>\nDate:   Mon Jan 1\n\n    Fix typo in form\n\ncommit 3a7f2c1...\nDate:   Sun Dec 31\n\n    Add login button',
        explanation: 'Shows each commit with full details. Press Q to quit when done reading.'
      },
      {
        scenario: 'Quick overview in one line per commit',
        command: 'git log --oneline',
        output: '8d1e9a3 Fix typo in form\n3a7f2c1 Add login button\na1b2c3d Initial commit',
        explanation: 'Much cleaner! Each commit is one line: short ID + your message. Great for a quick overview.'
      }
    ],
    tips: [
      'git log --oneline is your best friend for quick history',
      'Press Q to exit the log view',
      'Add --graph to see a visual branch diagram in your terminal'
    ],
    tryItCommand: 'git log --oneline'
  },
  {
    id: 'git-branch',
    title: 'git branch',
    emoji: '🌿',
    color: 'green',
    syntax: 'git branch\ngit branch <name>\ngit switch <name>\ngit switch -c <name>',
    description: 'Creates, lists, or switches between parallel versions of your project.',
    analogy: 'Like working on a photocopy of your project instead of the original. You can experiment, break things, try new ideas — the original stays untouched. When your copy is ready, you merge it back.',
    why: 'Branches let you work on new features without risking your working code. This is HUGE for teamwork — everyone works on their own branch, then merges when ready.',
    examples: [
      {
        scenario: 'Create and switch to a new feature branch',
        command: 'git switch -c add-dark-mode',
        output: "Switched to a new branch 'add-dark-mode'",
        explanation: 'Now you\'re on a separate copy. Any commits you make won\'t affect main until you merge.'
      },
      {
        scenario: 'See all branches',
        command: 'git branch',
        output: '* add-dark-mode\n  main',
        explanation: 'The * shows your current branch. You can switch back to main with: git switch main'
      }
    ],
    tips: [
      'Your main branch is usually called "main" (was "master" in older repos)',
      'Branch names should be descriptive: feature/login, bugfix/header-crash',
      'git switch -c creates AND switches in one step (the c = create)'
    ],
    tryItCommand: 'git branch'
  },
  {
    id: 'git-merge',
    title: 'git merge',
    emoji: '🔀',
    color: 'purple',
    syntax: 'git merge <branch-name>',
    description: 'Combines the changes from one branch into your current branch.',
    analogy: 'Like stapling your photocopy\'s edits back into the original document. All the work you did in isolation now joins the main project.',
    why: 'When your feature branch is done and tested, you merge it into main. This is how teams bring work together without overwriting each other.',
    examples: [
      {
        scenario: 'Merge a feature branch into main',
        command: 'git switch main\ngit merge add-dark-mode',
        output: "Updating 3a7f2c1..8d1e9a3\nFast-forward\n dark-mode.css | 45 +++++++++",
        explanation: 'You switch to main, then pull in all commits from add-dark-mode. The feature is now in main!'
      },
      {
        scenario: 'Merge triggers a conflict',
        command: 'git merge feature-branch',
        output: 'Auto-merging index.html\nCONFLICT: Merge conflict in index.html\nAutomatic merge failed; fix conflicts',
        explanation: 'Two branches changed the same line differently. Git needs your help to decide which version to keep. Open the file, look for <<<< markers, and choose!'
      }
    ],
    tips: [
      'Always switch to the RECEIVING branch first (usually main)',
      'Conflicts aren\'t scary — they\'re just Git asking for your input',
      'After fixing conflicts: git add <file> then git commit'
    ],
    tryItCommand: 'git merge'
  },
  {
    id: 'gitignore',
    title: '.gitignore',
    emoji: '🙈',
    color: 'cyan',
    syntax: 'echo "node_modules/" > .gitignore',
    description: 'A special file that tells Git which files to completely ignore.',
    analogy: 'Like a "Do Not Disturb" sign for certain files. Log files, passwords, giant folders like node_modules — they don\'t belong in your repo. .gitignore keeps them out.',
    why: 'Some files should NEVER be committed: API keys and passwords (security!), node_modules/ (too big, re-downloadable), .env files (personal settings), OS files like .DS_Store.',
    examples: [
      {
        scenario: 'Ignore node_modules and .env',
        command: '# Contents of .gitignore file:\nnode_modules/\n.env\n*.log\n.DS_Store',
        explanation: 'Each line is a pattern. node_modules/ ignores the whole folder. *.log ignores ALL .log files. Simple!'
      },
      {
        scenario: 'Check if a file is being ignored',
        command: 'git check-ignore -v secret.env',
        output: '.gitignore:2:.env  secret.env',
        explanation: 'This tells you exactly which .gitignore rule is blocking the file. Super useful for debugging!'
      }
    ],
    tips: [
      'Create .gitignore at the ROOT of your project',
      'GitHub has templates for every language/framework — use them!',
      'Already tracked a file? Use: git rm --cached <file> to un-track it'
    ],
    tryItCommand: 'cat .gitignore'
  },
  {
    id: 'git-clone',
    title: 'git clone',
    emoji: '📥',
    color: 'pink',
    syntax: 'git clone <url>',
    description: 'Downloads a complete copy of a remote repository to your computer.',
    analogy: 'Like downloading a full project from the internet — not just the files, but the ENTIRE history, all branches, all commits. Everything. One command and you have the whole thing.',
    why: 'You\'ll clone constantly: copying open-source projects to study, getting your team\'s codebase on a new computer, or starting from a template someone else built.',
    examples: [
      {
        scenario: 'Clone a project from GitHub',
        command: 'git clone https://github.com/facebook/react.git',
        output: "Cloning into 'react'...\nremote: Counting objects: 100%\nReceiving objects: 100%",
        explanation: 'Creates a "react" folder with the entire React source code and its full history. Amazing!'
      },
      {
        scenario: 'Clone into a specific folder name',
        command: 'git clone https://github.com/user/project.git my-app',
        output: "Cloning into 'my-app'...",
        explanation: 'The extra "my-app" argument changes the folder name. Handy for keeping things organized.'
      }
    ],
    tips: [
      'Clone automatically sets up the remote connection for you',
      'HTTPS cloning works everywhere — SSH is faster once set up',
      'After cloning, run npm install (or equivalent) to restore dependencies'
    ],
    tryItCommand: 'git clone'
  },
  {
    id: 'git-remote',
    title: 'git remote',
    emoji: '🌐',
    color: 'green',
    syntax: 'git remote -v\ngit remote add origin <url>',
    description: 'Manages connections to remote repositories (like GitHub).',
    analogy: 'Like saving a contact in your phone. "origin" is just a nickname for a URL. Instead of typing https://github.com/you/project every time, you just say "origin".',
    why: 'Before you can push or pull, Git needs to know WHERE to send/get code. git remote connects your local repo to its online home on GitHub.',
    examples: [
      {
        scenario: 'Connect local repo to GitHub for the first time',
        command: 'git remote add origin https://github.com/you/project.git',
        explanation: 'Adds a remote nicknamed "origin" pointing to your GitHub repo. Now push/pull will work.'
      },
      {
        scenario: 'Check your current remotes',
        command: 'git remote -v',
        output: 'origin  https://github.com/you/project.git (fetch)\norigin  https://github.com/you/project.git (push)',
        explanation: 'Shows all remotes. You see origin listed twice — once for downloading (fetch) and once for uploading (push).'
      }
    ],
    tips: [
      '"origin" is just a convention — you can name remotes anything',
      'Most projects only have one remote (origin)',
      'git clone sets up origin automatically — you only need git remote add for new repos'
    ],
    tryItCommand: 'git remote -v'
  },
  {
    id: 'git-push-pull',
    title: 'git push & pull',
    emoji: '⬆️',
    color: 'cyan',
    syntax: 'git push origin main\ngit pull origin main',
    description: 'Upload your commits to GitHub (push) or download new commits from GitHub (pull).',
    analogy: 'push = upload your changes to the cloud. pull = download updates your teammates made. Like syncing a cloud folder, but you control exactly when it happens.',
    why: 'Push shares your work with the world (or your team). Pull gets the latest changes so you\'re not working on outdated code. These two are how collaboration actually happens.',
    examples: [
      {
        scenario: 'Upload your local commits to GitHub',
        command: 'git push origin main',
        output: 'Enumerating objects: 5\nCounting objects: 100%\nTo https://github.com/you/project.git\n  3a7f2c1..8d1e9a3  main -> main',
        explanation: 'Your commits are now on GitHub! Others can see and download them. The first time, add -u: git push -u origin main'
      },
      {
        scenario: 'Download changes your teammate pushed',
        command: 'git pull origin main',
        output: "Updating 3a7f2c1..8d1e9a3\nFast-forward\n README.md | 3 +++",
        explanation: 'Git downloads their commits and merges them into your local branch. You\'re now up to date!'
      }
    ],
    tips: [
      'Always pull before you push to avoid conflicts',
      'git push -u origin main (the -u saves the remote+branch so next time just git push works)',
      'If push is rejected, someone else pushed first — pull first, then push again'
    ],
    tryItCommand: 'git push'
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Who created Git and in what year?',
    options: ['Bill Gates in 2000', 'Linus Torvalds in 2005', 'Mark Zuckerberg in 2008', 'Jeff Bezos in 2003'],
    correctIndex: 1,
    explanation: 'Git was created by Linus Torvalds in 2005, the same person who created the Linux kernel. He built it after the free license for BitKeeper was revoked.',
    category: 'History'
  },
  {
    id: 2,
    question: 'What does "git init" do?',
    options: ['Uploads your project to GitHub', 'Creates a new Git repository in your folder', 'Downloads a project from the internet', 'Shows your commit history'],
    correctIndex: 1,
    explanation: 'git init initializes a new Git repository in your current directory by creating a hidden .git folder. You only need to run it once per project.',
    category: 'Commands'
  },
  {
    id: 3,
    question: 'What is the correct order to save changes in Git?',
    options: ['commit → add → push', 'push → commit → add', 'add → commit → push', 'init → push → commit'],
    correctIndex: 2,
    explanation: 'The correct workflow is: git add (stage changes) → git commit (save snapshot) → git push (upload to remote). Think: pack the box, seal it, then ship it!',
    category: 'Workflow'
  },
  {
    id: 4,
    question: 'What does "git add ." do?',
    options: ['Adds only one file', 'Stages all changed files in the current directory', 'Creates a new branch', 'Commits your changes'],
    correctIndex: 1,
    explanation: 'The . means "everything here." git add . stages ALL modified and new files in your current directory and subdirectories. It\'s the most common way to stage changes.',
    category: 'Commands'
  },
  {
    id: 5,
    question: 'What is a "commit" in Git?',
    options: ['A way to delete files', 'A permanent snapshot of your staged changes', 'A connection to GitHub', 'A type of branch'],
    correctIndex: 1,
    explanation: 'A commit is like a save point in a video game. It creates a permanent, named snapshot of your staged changes that you can always return to.',
    category: 'Concepts'
  },
  {
    id: 6,
    question: 'What is the difference between Git and GitHub?',
    options: ['They are exactly the same thing', 'Git is the tool; GitHub is a website that hosts Git repos online', 'GitHub is older than Git', 'Git only works on Windows'],
    correctIndex: 1,
    explanation: 'Git is the version control software that runs locally on your computer. GitHub is a cloud platform that hosts Git repositories online and adds collaboration features like Pull Requests.',
    category: 'Concepts'
  },
  {
    id: 7,
    question: 'What does "git status" show you?',
    options: ['Your internet connection speed', 'What files have changed and whether they are staged', 'A list of all branches', 'Your GitHub account info'],
    correctIndex: 1,
    explanation: 'git status is your go-to dashboard command. It shows what files you\'ve modified, what\'s staged (ready to commit), and what\'s untracked (not yet in Git).',
    category: 'Commands'
  },
  {
    id: 8,
    question: 'What is a Git branch?',
    options: ['A backup of your entire computer', 'A parallel version of your project for safe experimentation', 'A type of commit message', 'The folder where Git stores files'],
    correctIndex: 1,
    explanation: 'A branch is like a parallel copy of your project. You can make changes, experiment, and break things without affecting the main branch. When ready, you merge it back.',
    category: 'Concepts'
  },
  {
    id: 9,
    question: 'Which command downloads a repository from GitHub to your computer?',
    options: ['git pull', 'git fetch', 'git clone', 'git download'],
    correctIndex: 2,
    explanation: 'git clone copies the entire repository (all files, all history, all branches) from a remote URL to your computer. git pull only downloads new changes to an existing repo.',
    category: 'Commands'
  },
  {
    id: 10,
    question: 'What should you put in a .gitignore file?',
    options: ['Your best commit messages', 'Files you want Git to never track (passwords, logs, node_modules)', 'The names of your branches', 'Your GitHub username'],
    correctIndex: 1,
    explanation: '.gitignore tells Git which files to completely ignore. Classic examples: node_modules/ (too large), .env (contains secrets), *.log (unnecessary logs), .DS_Store (Mac system files).',
    category: 'Concepts'
  },
  {
    id: 11,
    question: 'What does "git push origin main" do?',
    options: ['Downloads changes from GitHub', 'Deletes the main branch', 'Uploads your local commits to GitHub', 'Creates a new branch called main'],
    correctIndex: 2,
    explanation: 'git push uploads (pushes) your local commits to the remote repository (origin) on the main branch. This is how your work gets shared with others.',
    category: 'Commands'
  },
  {
    id: 12,
    question: 'What does "git pull" do?',
    options: ['Uploads your local changes', 'Downloads and merges remote changes into your local branch', 'Creates a merge conflict', 'Deletes remote branches'],
    correctIndex: 1,
    explanation: 'git pull fetches new commits from the remote repository AND merges them into your current local branch. It\'s essentially git fetch + git merge in one step.',
    category: 'Commands'
  },
  {
    id: 13,
    question: 'Which command shows you your commit history?',
    options: ['git history', 'git log', 'git commits', 'git show'],
    correctIndex: 1,
    explanation: 'git log shows the full commit history. Use git log --oneline for a compact one-line-per-commit view. It\'s your project\'s timeline.',
    category: 'Commands'
  },
  {
    id: 14,
    question: 'How do you create AND switch to a new branch in one command?',
    options: ['git branch new-branch', 'git checkout new-branch', 'git switch -c new-branch', 'git create new-branch'],
    correctIndex: 2,
    explanation: 'git switch -c new-branch creates the branch (-c = create) and immediately switches to it. The older syntax is git checkout -b new-branch — both work!',
    category: 'Commands'
  },
  {
    id: 15,
    question: 'What is a "merge conflict"?',
    options: ['When Git runs out of storage space', 'When two branches changed the same part of a file differently', 'When you forget to add files before committing', 'When the internet connection drops during a push'],
    correctIndex: 1,
    explanation: 'A merge conflict happens when two branches modified the same line(s) in a file. Git can\'t decide which version to keep, so it asks you to manually choose by editing the conflict markers.',
    category: 'Concepts'
  },
  {
    id: 16,
    question: 'What is a Pull Request (PR) on GitHub?',
    options: ['A way to download files', 'A request to merge your branch\'s changes into another branch, with discussion', 'A git pull command with extra steps', 'A way to delete a repository'],
    correctIndex: 1,
    explanation: 'A Pull Request is a GitHub feature that lets you propose merging your branch into another. It creates a discussion thread where teammates can review your code, leave comments, and approve or request changes before the merge.',
    category: 'GitHub'
  },
  {
    id: 17,
    question: 'What does "origin" mean in Git commands?',
    options: ['The original commit', 'The default nickname for your remote repository', 'The first file you ever committed', 'A special branch name'],
    correctIndex: 1,
    explanation: '"origin" is just the default nickname (alias) for your remote repository URL. Instead of typing the full URL each time, Git lets you say "origin." You can change it, but everyone uses origin by convention.',
    category: 'Concepts'
  },
  {
    id: 18,
    question: 'What does "git remote -v" show?',
    options: ['Your Git version number', 'All remote connections and their URLs', 'Verbose commit history', 'Validation errors'],
    correctIndex: 1,
    explanation: 'git remote -v lists all remote connections configured for your repository, showing both their nickname (like "origin") and their full URL for both fetch and push operations.',
    category: 'Commands'
  },
  {
    id: 19,
    question: 'How does Git store changes — as deltas or snapshots?',
    options: ['Only deltas (differences between files)', 'Only snapshots of the entire codebase', 'Snapshots of the full state, with links to unchanged files for efficiency', 'Random binary data'],
    correctIndex: 2,
    explanation: 'Git stores complete snapshots of your project at each commit. For efficiency, unchanged files are linked to their previous version rather than stored again. This is different from older VCS systems that only store the differences (deltas).',
    category: 'Concepts'
  },
  {
    id: 20,
    question: 'What is the BEST commit message for fixing a button color?',
    options: ['fix', 'stuff', 'Fix primary button color to match brand guidelines (#3a7f2c1)', 'changes'],
    correctIndex: 2,
    explanation: 'Good commit messages are specific and describe WHAT and WHY. "fix" tells you nothing. The detailed message tells you exactly what was fixed and even references a ticket number. Future-you will thank present-you!',
    category: 'Best Practices'
  }
];

export const NAV_SECTIONS = [
  { id: 'hero', label: 'Home', icon: '🏠' },
  { id: 'history', label: 'Git\'s Origin Story', icon: '📖' },
  { id: 'concepts', label: 'Core Concepts', icon: '🧠' },
  { id: 'github', label: 'What is GitHub?', icon: '🐙' },
  { id: 'git-init', label: 'git init', icon: '🚀' },
  { id: 'git-status', label: 'git status', icon: '🔍' },
  { id: 'git-add', label: 'git add', icon: '📦' },
  { id: 'git-commit', label: 'git commit', icon: '💾' },
  { id: 'git-log', label: 'git log', icon: '📜' },
  { id: 'git-branch', label: 'git branch', icon: '🌿' },
  { id: 'git-merge', label: 'git merge', icon: '🔀' },
  { id: 'gitignore', label: '.gitignore', icon: '🙈' },
  { id: 'git-clone', label: 'git clone', icon: '📥' },
  { id: 'git-remote', label: 'git remote', icon: '🌐' },
  { id: 'git-push-pull', label: 'git push & pull', icon: '⬆️' },
  { id: 'playground', label: 'Live Playground', icon: '⚡' },
  { id: 'quiz', label: 'Final Quiz', icon: '🎯' },
  { id: 'next-steps', label: 'Next Steps', icon: '🗺️' },
] as const;
