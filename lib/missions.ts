/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
/**
 * Mission definitions for the guided course.
 *
 * Narrative: You're building a personal portfolio website from scratch.
 * Each lesson picks up exactly where the previous one left off in the
 * same LightningFS namespace ("mission-portfolio").
 *
 * Each mission has:
 *  - storyContext  : the narrative framing shown to the user
 *  - checkpointSeed: async fn that writes the MINIMUM required repo state
 *                    so the user can attempt the steps. Called on "Reset".
 *  - steps         : ordered list of things the user must do
 *    - instruction : what to do (shown in the panel)
 *    - hint        : the exact command to suggest (revealed on demand)
 *    - validate    : async (git, fs, dir) => boolean
 *                    returns true when the user has achieved the goal
 */

export const MISSION_DIR = '/portfolio';
export const MISSION_FS_NAME = 'mission-portfolio';

export interface MissionStep {
  instruction: string;
  hint: string;
  validate: (git: any, fs: any, dir: string) => Promise<boolean>;
}

export interface Mission {
  id: string;
  title: string;
  storyContext: string;
  scene: string; // emoji scene-setter
  checkpointSeed: (git: any, fs: any, dir: string) => Promise<void>;
  steps: MissionStep[];
  completionMessage: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
async function ensureDir(fs: any, dir: string) {
  try { await fs.mkdir(dir); } catch { /* already exists */ }
}

async function writeFile(fs: any, path: string, content: string) {
  await fs.writeFile(path, content, { encoding: 'utf8' });
}

async function fileExists(fs: any, path: string): Promise<boolean> {
  try { await fs.stat(path); return true; } catch { return false; }
}

async function readFile(fs: any, path: string): Promise<string> {
  try { return await fs.readFile(path, { encoding: 'utf8' }) as string; } catch { return ''; }
}

async function commitExists(git: any, fs: any, dir: string): Promise<boolean> {
  try {
    const log = await git.log({ fs: { promises: fs }, dir });
    return log.length > 0;
  } catch { return false; }
}

async function getCommitCount(git: any, fs: any, dir: string): Promise<number> {
  try {
    const log = await git.log({ fs: { promises: fs }, dir });
    return log.length;
  } catch { return 0; }
}

async function isStaged(git: any, fs: any, dir: string, filepath: string): Promise<boolean> {
  try {
    const matrix = await git.statusMatrix({ fs: { promises: fs }, dir });
    for (const [fp, , , stage] of matrix) {
      if (fp === filepath && (stage === 2 || stage === 3)) return true;
    }
    // also check if any file is staged
    if (filepath === '*') {
      for (const [, , , stage] of matrix) {
        if (stage === 2 || stage === 3) return true;
      }
    }
    return false;
  } catch { return false; }
}

async function branchExists(git: any, fs: any, dir: string, name: string): Promise<boolean> {
  try {
    const branches = await git.listBranches({ fs: { promises: fs }, dir });
    return branches.includes(name);
  } catch { return false; }
}

async function getCurrentBranch(git: any, fs: any, dir: string): Promise<string> {
  try {
    return await git.currentBranch({ fs: { promises: fs }, dir }) || 'main';
  } catch { return 'main'; }
}

// Standard author used in all seeded commits
const AUTHOR = { name: 'You', email: 'you@portfolio.dev' };

// ─── CHECKPOINT SEEDS ────────────────────────────────────────────────────────
// Each seed builds on top of the previous. They are CUMULATIVE — seed for
// lesson 5 includes everything from lessons 1-4 so "Reset" always works.

async function seedLesson1(git: any, fs: any, dir: string) {
  // Lesson 1 (git init): just an empty directory — nothing seeded
  await ensureDir(fs, dir);
}

async function seedLesson2(git: any, fs: any, dir: string) {
  // Lesson 2 (git status): repo initialized + untracked files
  await ensureDir(fs, dir);
  await git.init({ fs: { promises: fs }, dir, defaultBranch: 'main' });
  await writeFile(fs, `${dir}/index.html`,
    `<!DOCTYPE html>\n<html>\n<head><title>My Portfolio</title></head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`);
  await writeFile(fs, `${dir}/style.css`,
    `body { font-family: sans-serif; background: #111; color: #fff; }`);
}

async function seedLesson3(git: any, fs: any, dir: string) {
  // Lesson 3 (git add): same as lesson 2 — user needs to stage files
  await seedLesson2(git, fs, dir);
}

async function seedLesson4(git: any, fs: any, dir: string) {
  // Lesson 4 (git commit): repo init + files staged, ready to commit
  await seedLesson2(git, fs, dir);
  await git.add({ fs: { promises: fs }, dir, filepath: 'index.html' });
  await git.add({ fs: { promises: fs }, dir, filepath: 'style.css' });
}

async function seedLesson5(git: any, fs: any, dir: string) {
  // Lesson 5 (git log): repo with 2 prior commits + a new change to commit
  await seedLesson2(git, fs, dir);
  // commit 1
  await git.add({ fs: { promises: fs }, dir, filepath: 'index.html' });
  await git.add({ fs: { promises: fs }, dir, filepath: 'style.css' });
  await git.commit({ fs: { promises: fs }, dir, message: 'Initial portfolio setup', author: AUTHOR });
  // commit 2 – add about section
  await writeFile(fs, `${dir}/index.html`,
    `<!DOCTYPE html>\n<html>\n<head><title>My Portfolio</title></head>\n<body>\n  <h1>Hello World</h1>\n  <section id="about"><h2>About Me</h2><p>I build things.</p></section>\n</body>\n</html>`);
  await git.add({ fs: { promises: fs }, dir, filepath: 'index.html' });
  await git.commit({ fs: { promises: fs }, dir, message: 'Add About section', author: AUTHOR });
  // unstaged change for user to commit
  await writeFile(fs, `${dir}/index.html`,
    `<!DOCTYPE html>\n<html>\n<head><title>My Portfolio</title></head>\n<body>\n  <h1>Hello World</h1>\n  <section id="about"><h2>About Me</h2><p>I build things.</p></section>\n  <footer>© 2025</footer>\n</body>\n</html>`);
  await writeFile(fs, `${dir}/contact.html`,
    `<!DOCTYPE html>\n<html><body><h1>Contact</h1><p>email@example.com</p></body></html>`);
}

async function seedLesson6(git: any, fs: any, dir: string) {
  // Lesson 6 (git branch): 3 commits on main, ready to branch
  await seedLesson2(git, fs, dir);
  await git.add({ fs: { promises: fs }, dir, filepath: 'index.html' });
  await git.add({ fs: { promises: fs }, dir, filepath: 'style.css' });
  await git.commit({ fs: { promises: fs }, dir, message: 'Initial portfolio setup', author: AUTHOR });
  await writeFile(fs, `${dir}/index.html`,
    `<!DOCTYPE html>\n<html>\n<head><title>My Portfolio</title></head>\n<body>\n  <h1>Hello World</h1>\n  <section id="about"><h2>About Me</h2><p>I build things.</p></section>\n  <footer>© 2025</footer>\n</body>\n</html>`);
  await git.add({ fs: { promises: fs }, dir, filepath: 'index.html' });
  await git.commit({ fs: { promises: fs }, dir, message: 'Add About section and footer', author: AUTHOR });
  await writeFile(fs, `${dir}/contact.html`,
    `<!DOCTYPE html>\n<html><body><h1>Contact</h1><p>email@example.com</p></body></html>`);
  await git.add({ fs: { promises: fs }, dir, filepath: 'contact.html' });
  await git.commit({ fs: { promises: fs }, dir, message: 'Add contact page', author: AUTHOR });
}

async function seedLesson7(git: any, fs: any, dir: string) {
  // Lesson 7 (git merge): main with 3 commits, feature/dark-mode branch with 1 commit
  await seedLesson6(git, fs, dir);
  // create feature branch with dark mode commit
  await git.branch({ fs: { promises: fs }, dir, ref: 'feature/dark-mode', checkout: true });
  await writeFile(fs, `${dir}/style.css`,
    `body { font-family: sans-serif; background: #111; color: #fff; }\n.dark { background: #000; color: #0f0; }`);
  await git.add({ fs: { promises: fs }, dir, filepath: 'style.css' });
  await git.commit({ fs: { promises: fs }, dir, message: 'Add dark mode styles', author: AUTHOR });
  // switch back to main
  await git.checkout({ fs: { promises: fs }, dir, ref: 'main' });
}

async function seedLesson8(git: any, fs: any, dir: string) {
  // Lesson 8 (.gitignore): repo with 3 commits + untracked secrets/junk
  await seedLesson6(git, fs, dir);
  await writeFile(fs, `${dir}/.env`, `API_KEY=supersecret123\nDB_PASSWORD=hunter2`);
  await writeFile(fs, `${dir}/error.log`, `[ERROR] Something went wrong`);
  await writeFile(fs, `${dir}/node_modules`, `(pretend this is a huge folder)`);
}

async function seedLesson9(git: any, fs: any, dir: string) {
  // Lesson 9 (git clone): same as lesson 6 — conceptual, can't truly clone
  await seedLesson6(git, fs, dir);
}

async function seedLesson10(git: any, fs: any, dir: string) {
  // Lesson 10 (git remote): same as lesson 6
  await seedLesson6(git, fs, dir);
}

async function seedLesson11(git: any, fs: any, dir: string) {
  // Lesson 11 (git push/pull): repo with commits + simulated remote set
  await seedLesson6(git, fs, dir);
}

// ─── MISSIONS ─────────────────────────────────────────────────────────────────

export const MISSIONS: Record<string, Mission> = {

  'git-init': {
    id: 'git-init',
    title: 'Mission 1: Launch Your Portfolio Project',
    scene: '🚀',
    storyContext:
      "You just landed your first dev job. Your manager says: \"Create a portfolio site and put it under version control today.\" You open your terminal and stare at an empty folder called `my-portfolio`. Time to bring Git into the picture.",
    checkpointSeed: seedLesson1,
    steps: [
      {
        instruction: 'Initialize a new Git repository in the current folder.',
        hint: 'git init',
        validate: async (git, fs, dir) => {
          try {
            await git.resolveRef({ fs: { promises: fs }, dir, ref: 'HEAD' });
            return true;
          } catch {
            // HEAD exists but no commits yet is still a valid init
            try {
              await fs.stat(`${dir}/.git`);
              return true;
            } catch { return false; }
          }
        },
      },
      {
        instruction: 'Create your first file: `index.html` (the homepage of your portfolio).',
        hint: 'touch index.html',
        validate: async (_git, fs, dir) => fileExists(fs, `${dir}/index.html`),
      },
      {
        instruction: 'Run `git status` to confirm Git sees your new file.',
        hint: 'git status',
        validate: async (git, fs, dir) => {
          try {
            const matrix = await git.statusMatrix({ fs: { promises: fs }, dir });
            return matrix.some(([fp]) => fp === 'index.html');
          } catch { return false; }
        },
      },
    ],
    completionMessage: "Your portfolio project is now under version control. Git is watching every change from this moment on.",
  },

  'git-status': {
    id: 'git-status',
    title: 'Mission 2: Survey the Battlefield',
    scene: '🔍',
    storyContext:
      "You've been coding all morning. You added a stylesheet, tweaked the HTML, and created a new `about.html` page. Now you need to know: what exactly changed? Before committing anything, a good developer always checks the status.",
    checkpointSeed: seedLesson2,
    steps: [
      {
        instruction: 'Run `git status` to see all untracked and modified files.',
        hint: 'git status',
        validate: async (git, fs, dir) => {
          try {
            await git.statusMatrix({ fs: { promises: fs }, dir });
            return true; // they ran something that hit the repo
          } catch { return false; }
        },
      },
      {
        instruction: 'Add some content to `index.html` using the echo command, then check status again.',
        hint: 'echo "<h1>My Portfolio</h1>" > index.html',
        validate: async (_git, fs, dir) => {
          const content = await readFile(fs, `${dir}/index.html`);
          return content.length > 5;
        },
      },
      {
        instruction: 'Run `git status` one more time — notice how Git shows the file as modified.',
        hint: 'git status',
        validate: async (git, fs, dir) => {
          try {
            const matrix = await git.statusMatrix({ fs: { promises: fs }, dir });
            // any untracked or modified file means status was meaningful
            return matrix.length > 0;
          } catch { return false; }
        },
      },
    ],
    completionMessage: "You can now read your repo's dashboard like a pro. Always check status before staging!",
  },

  'git-add': {
    id: 'git-add',
    title: 'Mission 3: Pack the Box',
    scene: '📦',
    storyContext:
      "Your portfolio folder now has `index.html` and `style.css`. Both are untracked — Git knows they exist but isn't watching them yet. It's time to pack them into the staging box before you ship the commit.",
    checkpointSeed: seedLesson3,
    steps: [
      {
        instruction: 'Stage `index.html` specifically (practice single-file staging).',
        hint: 'git add index.html',
        validate: async (git, fs, dir) => isStaged(git, fs, dir, 'index.html'),
      },
      {
        instruction: 'Now stage everything else at once with `git add .`',
        hint: 'git add .',
        validate: async (git, fs, dir) => isStaged(git, fs, dir, 'style.css'),
      },
      {
        instruction: 'Run `git status` to confirm both files are now in the staging area (green).',
        hint: 'git status',
        validate: async (git, fs, dir) => {
          try {
            const matrix = await git.statusMatrix({ fs: { promises: fs }, dir });
            // both index.html and style.css should be staged
            const staged = matrix.filter(([, , , s]) => s === 2 || s === 3).map(([fp]) => fp);
            return staged.includes('index.html') && staged.includes('style.css');
          } catch { return false; }
        },
      },
    ],
    completionMessage: "Both files are staged. The box is packed — ready to seal with a commit!",
  },

  'git-commit': {
    id: 'git-commit',
    title: 'Mission 4: Save the Game',
    scene: '💾',
    storyContext:
      "Your files are staged and waiting. This is the moment — you're about to create your first permanent checkpoint in the portfolio's history. Once committed, this snapshot is yours forever.",
    checkpointSeed: seedLesson4,
    steps: [
      {
        instruction: 'Create your first commit with a meaningful message describing what you built.',
        hint: 'git commit -m "Initial portfolio: homepage and styles"',
        validate: async (git, fs, dir) => commitExists(git, fs, dir),
      },
      {
        instruction: 'Make a small change — add your name to `index.html`.',
        hint: 'echo "<p>By Alex</p>" >> index.html',
        validate: async (_git, fs, dir) => {
          const content = await readFile(fs, `${dir}/index.html`);
          return content.length > 10;
        },
      },
      {
        instruction: 'Stage the change and commit it with a second descriptive message.',
        hint: 'git add . && git commit -m "Add author name to homepage"',
        validate: async (git, fs, dir) => {
          const count = await getCommitCount(git, fs, dir);
          return count >= 2;
        },
      },
    ],
    completionMessage: "Two commits saved! Your project now has a real history. You can always come back to either of these snapshots.",
  },

  'git-log': {
    id: 'git-log',
    title: 'Mission 5: Read the Project Diary',
    scene: '📜',
    storyContext:
      "Your portfolio has grown — there are already 2 commits on record and you've just made some new changes. Before doing anything else, you want to review the project's story and then add the latest chapter.",
    checkpointSeed: seedLesson5,
    steps: [
      {
        instruction: 'View the full commit history with `git log`.',
        hint: 'git log',
        validate: async (git, fs, dir) => {
          const count = await getCommitCount(git, fs, dir);
          return count >= 2;
        },
      },
      {
        instruction: 'View the compact one-line history with `git log --oneline`.',
        hint: 'git log --oneline',
        validate: async (git, fs, dir) => {
          const count = await getCommitCount(git, fs, dir);
          return count >= 2; // they interacted with git log
        },
      },
      {
        instruction: 'Stage and commit the footer change that was made earlier.',
        hint: 'git add . && git commit -m "Add footer and contact page"',
        validate: async (git, fs, dir) => {
          const count = await getCommitCount(git, fs, dir);
          return count >= 3;
        },
      },
    ],
    completionMessage: "You can now navigate your project's entire history. Every commit tells a story — and you're the author.",
  },

  'git-branch': {
    id: 'git-branch',
    title: 'Mission 6: Work in Parallel',
    scene: '🌿',
    storyContext:
      "Your portfolio is live and looking good on `main`. But a client wants a dark mode version — and you don't want to break the live site while experimenting. Time to branch off and work in isolation.",
    checkpointSeed: seedLesson6,
    steps: [
      {
        instruction: 'List all current branches to see what exists.',
        hint: 'git branch',
        validate: async (git, fs, dir) => {
          try {
            await git.listBranches({ fs: { promises: fs }, dir });
            return true;
          } catch { return false; }
        },
      },
      {
        instruction: 'Create and switch to a new branch called `feature/dark-mode`.',
        hint: 'git switch -c feature/dark-mode',
        validate: async (git, fs, dir) => {
          const branch = await getCurrentBranch(git, fs, dir);
          return branch === 'feature/dark-mode';
        },
      },
      {
        instruction: 'Make a change to `style.css` to add dark mode styles, then commit it.',
        hint: 'echo ".dark { background:#000; color:#0f0; }" >> style.css && git add . && git commit -m "Add dark mode styles"',
        validate: async (git, fs, dir) => {
          const branch = await getCurrentBranch(git, fs, dir);
          if (branch !== 'feature/dark-mode') return false;
          const count = await getCommitCount(git, fs, dir);
          return count >= 4; // at least one new commit on this branch
        },
      },
    ],
    completionMessage: "Your dark mode feature lives safely on its own branch. main is untouched — exactly as it should be.",
  },

  'git-merge': {
    id: 'git-merge',
    title: 'Mission 7: Bring It All Together',
    scene: '🔀',
    storyContext:
      "The dark mode feature is done and tested on the `feature/dark-mode` branch. Your client approved it. Now it's time to merge it back into `main` so the live portfolio gets the update.",
    checkpointSeed: seedLesson7,
    steps: [
      {
        instruction: 'Switch back to `main` — you must be on the receiving branch to merge.',
        hint: 'git switch main',
        validate: async (git, fs, dir) => {
          const branch = await getCurrentBranch(git, fs, dir);
          return branch === 'main';
        },
      },
      {
        instruction: 'Merge `feature/dark-mode` into `main`.',
        hint: 'git merge feature/dark-mode',
        validate: async (git, fs, dir) => {
          // After merge, main should have the dark mode commit
          try {
            const log = await git.log({ fs: { promises: fs }, dir });
            return log.some(c => c.commit.message.toLowerCase().includes('dark'));
          } catch { return false; }
        },
      },
      {
        instruction: 'Run `git log --oneline` to verify the merge commit appears in history.',
        hint: 'git log --oneline',
        validate: async (git, fs, dir) => {
          const count = await getCommitCount(git, fs, dir);
          return count >= 4;
        },
      },
    ],
    completionMessage: "The dark mode feature is now part of main. This is exactly how teams collaborate — work in branches, merge when ready.",
  },

  'gitignore': {
    id: 'gitignore',
    title: 'Mission 8: Keep Secrets Secret',
    scene: '🙈',
    storyContext:
      "You accidentally ran `npm install` and now your folder has a `node_modules` directory, a `.env` file with API keys, and some `error.log` files. These should NEVER go into Git. Let's fix that before you accidentally commit your secrets.",
    checkpointSeed: seedLesson8,
    steps: [
      {
        instruction: 'Run `git status` — notice the sensitive files Git wants to track.',
        hint: 'git status',
        validate: async (git, fs, dir) => {
          try {
            const matrix = await git.statusMatrix({ fs: { promises: fs }, dir });
            return matrix.length > 0;
          } catch { return false; }
        },
      },
      {
        instruction: 'Create a `.gitignore` file that ignores `.env`, `*.log`, and `node_modules`.',
        hint: 'echo ".env\n*.log\nnode_modules/" > .gitignore',
        validate: async (_git, fs, dir) => {
          const content = await readFile(fs, `${dir}/.gitignore`);
          return content.includes('.env') || content.includes('*.log');
        },
      },
      {
        instruction: 'Stage and commit the `.gitignore` file.',
        hint: 'git add .gitignore && git commit -m "Add .gitignore to protect secrets"',
        validate: async (git, fs, dir) => {
          try {
            const log = await git.log({ fs: { promises: fs }, dir });
            return log.some(c =>
              c.commit.message.toLowerCase().includes('ignore') ||
              c.commit.message.toLowerCase().includes('.gitignore')
            );
          } catch { return false; }
        },
      },
    ],
    completionMessage: "Your secrets are safe. .gitignore is one of the most important files in any real project.",
  },

  'git-clone': {
    id: 'git-clone',
    title: 'Mission 9: Download a Project',
    scene: '📥',
    storyContext:
      "A colleague shared a starter template for portfolios on GitHub. Instead of downloading a ZIP and losing all the history, you want to clone the full repository. In this simulation, we'll clone our own portfolio into a second location.",
    checkpointSeed: seedLesson9,
    steps: [
      {
        instruction: 'Run `git log --oneline` to review what commits your portfolio currently has.',
        hint: 'git log --oneline',
        validate: async (git, fs, dir) => {
          const count = await getCommitCount(git, fs, dir);
          return count >= 3;
        },
      },
      {
        instruction: 'In a real scenario you\'d run: `git clone https://github.com/user/repo.git`. Simulate it by typing the command (it\'s a browser — the network call is mocked).',
        hint: 'git clone https://github.com/example/portfolio-template.git',
        validate: async (_git, _fs, _dir) => true, // simulated — always pass
      },
      {
        instruction: 'After cloning, a developer always checks what branches exist. Run `git branch`.',
        hint: 'git branch',
        validate: async (git, fs, dir) => {
          try {
            await git.listBranches({ fs: { promises: fs }, dir });
            return true;
          } catch { return false; }
        },
      },
    ],
    completionMessage: "You know how to clone a full project — history, branches, and all. This is how open-source collaboration starts.",
  },

  'git-remote': {
    id: 'git-remote',
    title: 'Mission 10: Connect to GitHub',
    scene: '🌐',
    storyContext:
      "Your portfolio is brilliant but it only exists on your computer. Time to connect it to GitHub so the world can see it — and so you have an online backup. You need to tell Git where your remote home is.",
    checkpointSeed: seedLesson10,
    steps: [
      {
        instruction: 'Check if any remotes are currently configured.',
        hint: 'git remote -v',
        validate: async (_git, _fs, _dir) => true, // always passes — informational step
      },
      {
        instruction: 'Add a remote called `origin` pointing to your GitHub repo URL.',
        hint: 'git remote add origin https://github.com/you/my-portfolio.git',
        validate: async (_git, _fs, _dir) => true, // simulated
      },
      {
        instruction: 'Verify the remote was added by running `git remote -v` again.',
        hint: 'git remote -v',
        validate: async (_git, _fs, _dir) => true, // simulated
      },
    ],
    completionMessage: "Your local repo is now linked to GitHub. 'origin' is the bridge between your computer and the cloud.",
  },

  'git-push-pull': {
    id: 'git-push-pull',
    title: 'Mission 11: Go Live!',
    scene: '⬆️',
    storyContext:
      "Everything is ready. Your portfolio has commits, branches, a .gitignore, and a remote set up. This is the final step — pushing your code to GitHub so it's live, backed up, and shareable.",
    checkpointSeed: seedLesson11,
    steps: [
      {
        instruction: 'Make a final polishing commit — add a README to your portfolio.',
        hint: 'echo "# My Portfolio" > README.md && git add . && git commit -m "Add README"',
        validate: async (git, fs, dir) => {
          try {
            const [log, hasReadme] = await Promise.all([
              git.log({ fs: { promises: fs }, dir }),
              fileExists(fs, `${dir}/README.md`),
            ]);
            return hasReadme || log.some((c: any) => c.commit.message.toLowerCase().includes('readme'));
          } catch { return false; }
        },
      },
      {
        instruction: 'Push your commits to GitHub with `git push origin main`. (Simulated in the browser — no real network call.)',
        hint: 'git push origin main',
        validate: async (_git, _fs, _dir) => true, // simulated
      },
      {
        instruction: 'Simulate a teammate update: run `git pull origin main` to fetch any new changes.',
        hint: 'git pull origin main',
        validate: async (_git, _fs, _dir) => true, // simulated
      },
    ],
    completionMessage: "🎉 You did it! Your portfolio is live on GitHub. You've completed the full Git workflow: init → add → commit → branch → merge → push. You're a Git developer now.",
  },
};
