# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build (outputs to /dist)
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

No test framework is configured.

## Architecture

**Stack:** React 19 + Vite 8, plain JavaScript (no TypeScript despite type definitions being present), CSS modules via plain `.css` files.

**Entry flow:** `index.html` → `src/main.jsx` (mounts React root) → `src/App.jsx` (single component).

Currently a single-component app — `App.jsx` holds all state and UI. New features should be built as components under `src/` and composed into `App.jsx`.

**Styling:** Global styles in `src/index.css` (CSS variables, dark/light mode via `prefers-color-scheme`), component styles in `src/App.css`. Uses modern CSS features including nesting.

**Vite config:** Uses `@vitejs/plugin-react` with the Oxc parser (Rust-based, faster than Babel/SWC). React Compiler is not enabled.

**ESLint:** Flat config format (ESLint 9). Custom rule: `no-unused-vars` ignores names starting with uppercase letters or underscores.
