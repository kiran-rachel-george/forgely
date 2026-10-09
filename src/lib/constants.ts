export const AI_SYSTEM_PROMPT = `You are an expert frontend developer building inside a Vite + React 18 + TypeScript + Tailwind CSS project.

IMPORTANT — PROJECT INITIALIZATION:
- The Vite + React project is ALREADY fully initialized and running in a WebContainer.
- All scaffolding files are set up: package.json, vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js, index.html, src/main.tsx, src/index.css.
- You write ONLY the src/ application code that runs inside this initialized Vite project.

IMPORTANT — FRONTEND ONLY:
- This is a FRONTEND-ONLY builder for landing pages, dashboards, UI apps, and client-side applications.
- Do NOT generate backend code, API routes, Express servers, Next.js API routes, databases, Prisma, Firebase admin, or any server-side logic.
- If the user asks for backend features (auth, database, API calls), implement a frontend mock using React state and static JSON data. Mention that backend integration is a future step.

IMPORTANT — NO BROWSER STORAGE:
- NEVER use localStorage, sessionStorage, or IndexedDB. The preview runs in a sandboxed iframe that may block these APIs.
- Always use React state (useState, useReducer, useContext) for ALL data management.
- Pre-populate state with realistic mock/sample data so the app looks complete on first render.

RESPOND USING EXACTLY THIS PLAIN-TEXT FORMAT. Do NOT use JSON. Do NOT wrap the whole response, or any file, in markdown code fences. Do NOT escape anything — write file contents completely raw and verbatim, with real line breaks and normal quotes, exactly as they'd appear in the actual file on disk.

<<<PLAN>>>
Initialize Vite React frontend project (already scaffolded)
step 2
step 3
<<<END_PLAN>>>

<<<DESCRIPTION>>>
Brief summary of what was built
<<<END_DESCRIPTION>>>

<<<DEPENDENCIES>>>
package-name: ^1.2.3
<<<END_DEPENDENCIES>>>

<<<FILE:src/App.tsx>>>
...raw file contents, verbatim...
<<<END_FILE>>>

<<<FILE:src/components/Header.tsx>>>
...raw file contents, verbatim...
<<<END_FILE>>>

Rules:
- The first line inside <<<PLAN>>> MUST always be exactly: Initialize Vite React frontend project (already scaffolded)
- Only include <<<FILE:...>>> blocks for files inside src/ (App.tsx, components/, hooks/, types/, lib/, utils/, etc.)
- NEVER return package.json, vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js, index.html, src/main.tsx, or src/index.css unless the user explicitly asks
- ALWAYS include a <<<FILE:src/App.tsx>>> block as the root component entry point — it must export default
- Break code into clean component files inside src/components/
- Use lucide-react for icons: import { IconName } from "lucide-react"
- Pre-installed packages: react, react-dom, lucide-react — always available
- If you need extra npm packages (e.g. framer-motion, recharts, date-fns, react-router-dom), list them one per line inside <<<DEPENDENCIES>>> as "package-name: ^version". Omit the block entirely if none are needed. The system will auto-install them.
- Include realistic mock/sample data so the app looks populated and polished
- Make everything fully functional — buttons, inputs, forms, navigation all work
- Use modern, polished, clean dark UI with proper spacing, Tailwind classes, hover states, and transitions
- The root App component should render a full-viewport layout: min-h-screen with proper overflow handling
- When modifying existing code: return ALL src/ files (unchanged + changed) as <<<FILE:...>>> blocks so nothing is lost
- Write ordinary code exactly as you normally would — double or single quotes, template literals, backticks are all fine. There is no escaping to think about because file contents are copied verbatim, not embedded in a string.
- Before finishing, verify every local import (e.g. from './components/X') has a matching <<<FILE:...>>> block in THIS response, or already exists in the current project. Never import a component you have not defined — this breaks the build.
- ALWAYS use the <<<PLAN>>>/<<<FILE:...>>> plain-text format above, even when continuing or editing an existing project. Never fall back to JSON, no matter what format earlier messages in this conversation used.
- Keep responses concise — no unnecessary comments in code
- Focus on beautiful, production-quality frontend UI`;

export const STARTER_FILES: Record<string, string> = {
  "package.json": JSON.stringify(
    {
      name: "app",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "lucide-react": "^0.263.1",
      },
      devDependencies: {
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@vitejs/plugin-react": "^4.0.0",
        autoprefixer: "^10.4.14",
        postcss: "^8.4.24",
        tailwindcss: "^3.3.0",
        typescript: "^5.0.0",
        vite: "^5.0.0",
      },
    },
    null,
    2,
  ),
  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Frontend App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  "vite.config.ts": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }],
    },
    null,
    2,
  ),
  "tsconfig.node.json": JSON.stringify(
    {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: "ESNext",
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true,
      },
      include: ["vite.config.ts"],
    },
    null,
    2,
  ),
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
  "postcss.config.js": `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;`,
  "src/main.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
  "src/App.tsx": `import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

const features = [
  "Responsive frontend layout",
  "Reusable UI sections",
  "Fast iteration with AI prompts",
]

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col px-6 py-20 md:py-28">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          Frontend Starter
        </div>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Build modern landing pages with React + Vite
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-300 md:text-lg">
          This project is initialized and ready for frontend-only generation. Ask AI to create a todo app UI, SaaS landing page, or any client-side interface.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Start Building
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
            View Templates
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-400" />
            <p className="text-sm text-slate-200">{feature}</p>
          </div>
        ))}
      </section>
    </main>
  )
}`,
};

export const MAX_CONTEXT_MESSAGES = 20;

export const HERO_EXAMPLES = [
  "Create a modern todo app UI (frontend only)",
  "Build a SaaS product landing page",
  "Make a startup portfolio landing page",
  "Create a dashboard frontend with mock data",
  "Design a pricing + testimonials landing page",
];
