# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptMage is a client-side React prompt engineering editor. Users create, edit, and manage prompts as markdown with hierarchical section navigation. All data persists in browser localStorage with no backend.

## Commands

- **Dev server:** `npm run dev` (Vite with HMR)
- **Production build:** `npm run build` (runs `update_config_for_build.js` then `vite build`, output in `dist/`)
- **Lint:** `npm run lint`
- **Preview build:** `npm run preview`
- **No test suite is configured.**

## Architecture

### Data Model

Prompts are stored as markdown text but internally converted to a **tree structure** (nested headers/sections) via `src/utils/treeUtils.js`. This tree powers the table of contents, breadcrumb navigation, and section-level editing. Key functions: `markdownToTree`, `treeToMarkdown`, and various tree traversal/mutation utilities.
Whenever the data model is changed, backward compatibility has to be observed.

### State Management

`src/hooks/usePromptLibrary.js` is the central state hook managing the prompt library. It handles CRUD operations, localStorage persistence, and data migration from older formats. There is no external state management library.

### Component Hierarchy

`App.jsx` → `Prompt.jsx` (main orchestrator) which composes:

- **Library.jsx** — left sidebar for prompt selection, search, rename, delete
- **MDEditor** (`@uiw/react-md-editor`) — center markdown editor
- **TableOfContent.jsx** / **Breadcrumbs.jsx** — tree-based navigation
- **PromptStatistics.jsx** — token/content metrics (right sidebar)
- **ReplaceMenu.jsx** — find/replace

### Key Libraries

- `@uiw/react-md-editor` — markdown editing
- `motion` — animations
- `uuid` — unique IDs for tree nodes

## Tech Stack

- React 19 with Vite 6, Tailwind CSS v4 (via `@tailwindcss/postcss`), ESLint 8
- ES modules throughout (`"type": "module"`)
- Build script (`update_config_for_build.js`) syncs version from package.json and stamps build date into `.env`

## Constraints

- Desktop-only layout (mobile shows a warning)
- localStorage-only persistence (no server, no sync)
