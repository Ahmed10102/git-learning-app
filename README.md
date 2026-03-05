# Git & GitHub for Absolute Beginners — Cyber Academy

The most immersive way to learn Git — ever. Run real Git commands in your browser, explore interactive lessons, and earn a certificate. No installation needed.

## Features

- **Real Git in the browser** — powered by [isomorphic-git](https://isomorphic-git.org/) + [LightningFS](https://github.com/isomorphic-git/lightning-fs) (IndexedDB). Every command actually executes.
- **11 command lessons** — `git init`, `git status`, `git add`, `git commit`, `git log`, `git branch`, `git merge`, `.gitignore`, `git clone`, `git remote`, `git push & pull`
- **Interactive playground** — type any Git command and see real output
- **Copy-to-clipboard** on every code block
- **"Try it" buttons** that load commands directly into the playground
- **20-question timed quiz** with per-question feedback and score review
- **PDF certificate download** via jsPDF — enter your name, ace the quiz, download proof
- **Progress tracking** — mark lessons as learned, persisted via localStorage
- **Mobile-responsive** — hamburger menu on small screens, full sidebar on desktop
- **Neon glassmorphism design** — matrix background, neon glow, Orbitron/JetBrains Mono fonts

## Tech Stack

| Tool | Version |
|------|---------|
| Next.js | 16.1.6 (App Router, Turbopack) |
| TypeScript | 5.x (strict) |
| Tailwind CSS | 4.x |
| isomorphic-git | latest |
| @isomorphic-git/lightning-fs | latest |
| jsPDF | latest |
| Framer Motion | latest |
| Lucide React | latest |

## Getting Started

```bash
# Enter the project directory
cd git-learning-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
git-learning-app/
├── app/
│   ├── globals.css        # Neon glassmorphism design system
│   ├── layout.tsx         # Root layout with Google Fonts
│   └── page.tsx           # Main app shell, routing, state
├── components/
│   ├── playground/
│   │   └── GitPlayground.tsx   # Real Git terminal (isomorphic-git)
│   ├── quiz/
│   │   └── Quiz.tsx            # 20-question quiz + PDF certificate
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── History.tsx         # Git origin story timeline
│   │   ├── Concepts.tsx        # Core Git concepts
│   │   ├── GitHubSection.tsx   # Git vs GitHub
│   │   └── NextSteps.tsx       # First GitHub repo guide
│   └── ui/
│       ├── MatrixBackground.tsx
│       ├── CopyButton.tsx
│       ├── CodeBlock.tsx
│       ├── Sidebar.tsx
│       └── CommandLesson.tsx
├── lib/
│   ├── data.ts            # All lesson content + 20 quiz questions
│   ├── types.ts           # TypeScript types
│   └── useProgress.ts     # localStorage progress hook
└── next.config.ts         # Turbopack config
```

## Notes

- The playground uses IndexedDB (via LightningFS) — data persists across page reloads in the same browser
- `GitPlayground.tsx` uses `// @ts-nocheck` due to missing TypeScript types in `@isomorphic-git/lightning-fs`
- Heavy components (`GitPlayground`, `Quiz`) are dynamically imported (`next/dynamic`) for optimal bundle splitting
