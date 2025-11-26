# Justin Law Personal Website

Next.js static site for GitHub Pages with AI chatbot (HuggingFace transformers).

## Stack

- **Next.js 15.5.5** (static export, pages router)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4.1.17**
- **Playwright 1.57.0** (E2E tests)
- **Zustand 5.0.2** (state management)

## Critical Constraints

- **Static export only** - no server-side features (API routes, server actions)
- **GitHub Pages** - basePath `/justinthelaw.github.io` in production
- **npm start doesn't work** - use `npx serve@latest out` after build

## Commands

- `npm run dev` - Runs the development server
- `npm run deploy` - Builds and deploys to GitHub Pages
- `npm run flight-check` - This runs all the sub-commands below
  - `npm run clean` - Deletes temporary build, dev, and test files
  - `npm run lint` - Runs the ESLint
  - `npm run build` - Runs the Next.js build
  - `npm run test` - Runs the E2E Playwright tests

## Code Standards

- **TypeScript**: Explicit types, interfaces over types, no `any`
- **React**: Functional components, custom hooks for logic, add `data-testid` for tests
- **Tailwind**: Use utilities, responsive (`sm:`, `md:`, `lg:`), group logically
- **State**: Zustand stores for global state, avoid localStorage directly
- **Architecture**: Component-based organization, separate concerns (UI/logic/services)

## Key Patterns

```typescript
// Props with explicit types
interface Props { title: string; onUpdate: (id: string) => void; }
export function Component({ title, onUpdate }: Props): React.ReactElement { ... }

// Custom hooks for business logic
export function useFeature() {
  const { state, actions } = useStore();
  // ... logic
  return { data, isLoading, error };
}

// Zustand store
import { create } from 'zustand';
export const useStore = create<State>((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));

// Error handling
const [error, setError] = useState<string | null>(null);
try { ... } catch (err) { setError(err instanceof Error ? err.message : 'Unknown'); }
```

## Architecture Principles

1. **Feature-based organization** - group by feature (chat, profile, resume), not by technical type
2. **Separation of concerns** - UI components, business logic (hooks/services), state (stores), config separate
3. **Custom hooks** - extract complex logic from components into reusable hooks
4. **Service layer** - isolate external dependencies (AI worker, GitHub API) behind clean interfaces
5. **Typed worker messages** - use enums for worker communication instead of magic strings
6. **Zustand for state** - global state in stores, avoid localStorage/module-level state
7. **Barrel exports** - index.ts files for clean imports

## Testing

After changes run: `npm run flight-check`

**Expected issues**: GitHub API and HuggingFace may fail in sandboxed envs, PDF viewer CORS errors in dev

**Test structure**: Uses playwright, testing chat and homepage components against mobile and desktop baselines

## Deployment

- **CI/CD**: `.github/workflows/deploy.yml` (auto-deploy on push to main)
- **E2E**: `.github/workflows/test.yml` (Chromium, Firefox, WebKit on PRs)

## Code Checklist

1. Static export compatible?
2. Types defined?
3. Responsive design?
4. Error handling?

## Documentation

Update documentation in the following areas as necessary:

1. /README.md
2. /.github/copilot-instructions.md
3. /docs/CUSTOMIZATION.md
