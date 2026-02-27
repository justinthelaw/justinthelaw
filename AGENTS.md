# Agentic Coding Instructions

Instructions for AI coding agents operating in this repository.

## Project Overview

Next.js static site for GitHub Pages with an in-browser AI chatbot powered by HuggingFace Transformers (WebAssembly). The site serves as a personal portfolio with a resume viewer and an LLM-based chatbot fine-tuned on resume data.

## Stack

- **Next.js 16** (static export, pages router)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4**
- **Zustand 5** (state management)
- **HuggingFace Transformers 3** (in-browser inference via Web Worker)
- **Playwright** (E2E testing)

## Critical Constraints

- **Static export only** - no API routes, server actions, `getServerSideProps`, or any server-side features. Everything runs in the browser.
- **GitHub Pages** - production uses a dynamic `basePath` (`/justinthelaw.github.io`). Never hardcode asset paths.
- **`npm start` does not work** - use `npx serve@latest out` after `npm run build` to preview the production build locally.
- **Web Worker AI** - model inference runs in a Web Worker (`src/services/ai/worker.ts`), not on the main thread.

## Commands

| Command                          | Purpose                                                            |
| -------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                    | Development server (with optional Docker for OTEL tracing)         |
| `npm run flight-check`           | **Run after all changes** - cleans, lints, builds, and tests       |
| `npm run clean`                  | Delete temporary build/dev/test artifacts                          |
| `npm run lint`                   | ESLint                                                             |
| `npm run build`                  | Next.js static export to `out/`                                    |
| `npm run test`                   | Playwright E2E tests (Chromium, Firefox, WebKit, mobile viewports) |
| `npm run deploy`                 | Build and deploy to GitHub Pages                                   |
| `cd pipeline && make eval-smoke` | Deterministic smoke evaluation for ONNX fine-tuned models          |
| `cd pipeline && make eval-full`  | Full threshold-gated evaluation suite for ONNX fine-tuned models   |

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
│   ├── ai/              # AI service layer (worker, model loader, context provider, tracing)
│   └── github/          # GitHub API integration
├── stores/              # Zustand stores (chatStore.ts, modelStore.ts)
├── types/               # TypeScript interfaces and enums (worker message types)
├── utils/               # Utilities (device detection)
└── styles/              # Global CSS (Tailwind)
tests/                   # Playwright E2E tests
pipeline/                # Python ML fine-tuning pipeline (separate from the Next.js app)
```

### Key Patterns

- **Feature-based organization** - group by feature (chat, profile, resume), not by technical type.
- **Separation of concerns** - UI components handle rendering only; business logic lives in custom hooks; external integrations go in services; global state goes in Zustand stores.
- **Barrel exports** - every feature directory has an `index.ts` for clean imports.
- **Typed worker messages** - use `WorkerAction`/`WorkerStatus` enums for worker communication. No magic strings.
- **Model fallback** - SMARTER (fine-tuned) fails gracefully to DUMBER (generic), then to error state.
- **Device-aware** - mobile uses q4 quantization, desktop uses fp32. Detection is based on `window.innerWidth < 1024`.

## Code Standards

- **TypeScript**: Explicit types everywhere. Use `interface` over `type`. Never use `any`.
- **React**: Functional components only. Extract complex logic into custom hooks. Add `data-testid` attributes for testable elements.
- **Tailwind**: Use utility classes. Apply responsive prefixes (`sm:`, `md:`, `lg:`). Group related utilities logically.
- **State**: Use Zustand stores for global state. Use `persist` middleware for localStorage. Never access localStorage directly.
- **Imports**: Use the `@/` path alias (maps to `src/`).

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

- **Framework**: Playwright E2E tests in `tests/`.
- **Browsers**: Chromium, Firefox, WebKit + mobile viewports (Pixel 5, iPhone 12).
- **Known issues**: GitHub API and HuggingFace model loading may fail in sandboxed environments. PDF viewer may have CORS issues in dev.
- **After changes**: Always run `npm run flight-check`.

## CI/CD

- **Deploy**: `.github/workflows/deploy.yml` - auto-deploys on push to `main`.
- **Test**: `.github/workflows/test.yml` - runs Playwright on all browsers for PRs.
- **Pipeline Eval**: `.github/workflows/pipeline.test.yml` - runs pipeline lint/type checks for `pipeline/**` PR changes and runs smoke eval when ONNX + dataset artifacts are available.

## Validation Checklist

Before completing any change, verify:

1. Static export compatible? (no server-side features)
2. Types explicitly defined? (no `any`, interfaces used)
3. Responsive design handled? (mobile + desktop)
4. Error handling present? (fallbacks, user-facing messages)
5. `npm run flight-check` passes?

## Documentation

Update these as needed when making changes:

1. `/README.md`
2. `/AGENTS.md` (this file)
3. `/docs/CUSTOMIZATION.md`
