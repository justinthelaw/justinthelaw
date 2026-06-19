# Agentic Coding Instructions

Instructions for AI coding agents operating in this repository.

## Project Overview

Next.js static site for GitHub Pages with an in-browser AI chatbot powered by
HuggingFace Transformers (WebAssembly). The site serves as a personal portfolio
with a resume viewer and an LLM-based chatbot that answers from personal context.

## Stack

| Layer | Tooling |
| --- | --- |
| Framework | Next.js 16.3 preview, static export, pages router, patched PostCSS line |
| UI | React 19 and TypeScript 6 |
| Styles | Tailwind CSS 4 |
| State | Zustand 5 |
| AI runtime | HuggingFace Transformers 4 in a browser Web Worker |
| Tests | Playwright E2E |

## Critical Constraints

| Constraint | Rule |
| --- | --- |
| Static export only | No API routes, server actions, `getServerSideProps`, or server-side features; everything runs in the browser |
| GitHub Pages | Production uses a dynamic project-site `basePath` such as `/justinthelaw`; never hardcode asset paths |
| Static preview | Run `npm run build` before `npm start` to preview `out/` at the exported base path |
| Web Worker AI | Model inference runs in `src/services/ai/worker.ts`, not on the main thread |

## Commands

| Command                                             | Purpose                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                                       | Development server                                                 |
| `npm run flight-check`                              | **Run after all changes** - cleans, lints, builds, and tests       |
| `npm run clean`                                     | Delete temporary build/dev/test artifacts                          |
| `npm run lint`                                      | ESLint                                                             |
| `npm run build`                                     | Next.js static export to `out/`                                    |
| `npm run test`                                      | Playwright E2E tests; build first outside `flight-check`           |
| `npm run deploy`                                    | Build and deploy to GitHub Pages                                   |
| `pre-commit install`                                | Install Git pre-commit hooks from `.pre-commit-config.yaml`        |
| `pre-commit run --all-files`                        | Run pre-commit-stage hooks manually                                |
| `pre-commit run --all-files --hook-stage pre-push`  | Run local lint pre-push hooks manually                             |

Pre-commit hooks cover repo hygiene at both pre-commit and pre-push: markdown,
YAML, GitHub Actions workflow lint, shell scripts, whitespace, smart quotes,
merge conflicts, private keys, and large files. The local app ESLint hook runs
at pre-push.

| Command | Stage |
| --- | --- |
| `pre-commit run --all-files` | Pre-commit-stage checks |
| `pre-commit run --all-files --hook-stage pre-push` | Pre-push checks including `app-eslint` (`npm run lint`) |

## Architecture

### Directory Structure

```text
src/
├── components/          # Feature-based UI (chat/, profile/, resume/, links/)
│   └── chat/
│       ├── components/  # UI components (ChatContainer, ChatMessages, ChatInput, etc.)
│       └── hooks/       # Business logic (useAIGeneration, useChatHistory, useModelManagement)
├── config/              # Centralized settings (site.ts, models.ts, prompts.ts)
├── pages/               # Next.js pages router (index.tsx, _app.tsx)
├── services/            # External dependencies
│   ├── ai/              # AI service layer (worker, model loader, context provider)
│   └── github/          # GitHub API integration
├── stores/              # Zustand stores (chatStore.ts)
├── types/               # TypeScript interfaces and enums (worker message types)
├── utils/               # Utilities (device detection)
└── styles/              # Global CSS (Tailwind)
tests/                   # Playwright E2E tests
```

### Key Patterns

| Pattern | Rule |
| --- | --- |
| Feature-based organization | Group by feature such as chat, profile, resume, and links, not by technical type |
| Separation of concerns | UI components render, custom hooks own business logic, services own integrations, and Zustand owns global state |
| Barrel exports | Every feature directory has an `index.ts` for clean imports |
| Typed worker messages | Use `WorkerAction` and `WorkerStatus` enums for worker communication; avoid magic strings |
| Browser-safe dtype loading | Automatic model loading uses int8 with uint8 fallback on all viewports; do not re-enable q4 by default unless ORT WASM can mount external `.onnx.data` files in browser workers |
| Reusable profile sections | Keep section IDs generic and temporally prioritized; put person- or employer-specific terms in fact text and keywords, not section IDs |

## Code Standards

| Area | Standard |
| --- | --- |
| TypeScript | Use explicit types, `interface` for object shapes, `type` for unions and callbacks, and avoid `any` |
| React | Use functional components, extract complex logic into custom hooks, and add `data-testid` attributes for testable elements |
| Tailwind | Use utility classes, responsive prefixes, and grouped related utilities |
| State | Use Zustand stores for global state, `persist` middleware for localStorage, and no direct localStorage access |
| Imports | Use the `@/` path alias, which maps to `src/` |

## Code Conventions

```typescript
// Component props - use interface, explicit return type
interface Props {
  title: string;
  onUpdate: (id: string) => void;
}
export function Component({ title, onUpdate }: Props): React.ReactElement { ... }

// Custom hooks - return object with named values
export function useFeature() {
  const { state, actions } = useStore();
  return { data, isLoading, error };
}

// Zustand store
import { create } from 'zustand';
export const useStore = create<State>((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));

// Error handling
try { ... } catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

## Testing

| Topic | Detail |
| --- | --- |
| Framework | Playwright E2E tests in `tests/` |
| Browsers | Chromium, Firefox, WebKit, Pixel 5, and iPhone 12 |
| Known issues | GitHub API and HuggingFace model loading may fail in sandboxed environments; PDF viewer may have CORS issues in dev |
| After changes | Always run `npm run flight-check` |

## CI/CD

| Workflow | Purpose |
| --- | --- |
| `.github/workflows/deploy.yml` | Auto-deploys on push to `main` |
| `.github/workflows/app.test.yml` | Runs Playwright on all browsers for PRs |

## Validation Checklist

Before completing any change, verify:

| Check | Requirement |
| --- | --- |
| Static export | No server-side features |
| Types | Explicit definitions, no `any`, interfaces for object shapes |
| Responsive design | Mobile and desktop handled |
| Errors | Fallbacks and user-facing messages present |
| Validation | `npm run flight-check` passes |

## Documentation

Update these as needed when making changes:

| Document | Update when |
| --- | --- |
| `/README.md` | Repository orientation changes |
| `/AGENTS.md` | Agent instructions change |
| `/docs/CUSTOMIZATION.md` | User-facing configuration changes |
| `/docs/diagrams.md` | Architecture, runtime flow, deployment behavior, or profile-QA pipeline changes |
| `/ml/profile-qa/README.md` | Local training, evaluation, export, or publishing commands change |

Keep docs concise and layered: README for orientation, `docs/CUSTOMIZATION.md`
for configuration, `docs/diagrams.md` for system flow, and
`ml/profile-qa/README.md` for command-level fine-tuning details. Use exact file
paths so both humans and agents can act on the instructions.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
