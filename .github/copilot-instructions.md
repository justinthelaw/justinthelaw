# Justin Law Personal Website

Next.js static site for GitHub Pages with AI chatbot (HuggingFace transformers).

## Stack

- **Next.js 15.5.5** (static export, pages router)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4.1.17**
- **Playwright 1.57.0** (E2E tests)

## Critical Constraints

- **Static export only** - no server-side features (API routes, server actions)
- **GitHub Pages** - basePath `/justinthelaw.github.io` in production
- **npm start doesn't work** - use `npx serve@latest out` after build

## Commands

- `npm run dev` - Runs the development server
- `npm run build` - Runs the Next.js build
- `npm run lint` - Runs the ESLint
- `npm run test` - Runs the E2E Playwright tests
- `npm run deploy` - Builds and deploys to GitHub Pages
- `npm run clean` - Deletes temporary build, dev, and test files

## Code Standards

- **TypeScript**: Explicit types, interfaces over types, no `any`
- **React**: Functional components, hooks, add `data-testid` for tests
- **Tailwind**: Use utilities, responsive (`sm:`, `md:`, `lg:`), group logically
- **Files**: Complex components in folders (`ComponentName/index.tsx`), simple as files

## Key Patterns

```typescript
// Props with explicit types
interface Props { title: string; onUpdate: (id: string) => void; }
const Component: React.FC<Props> = ({ title, onUpdate }) => { ... }

// Error handling
const [error, setError] = useState<string | null>(null);
try { ... } catch (err) { setError(err instanceof Error ? err.message : 'Unknown'); }
```

## Structure

```
src/
├── components/ChatBox/      # AI chatbot + utils
├── pages/                   # _app.tsx, index.tsx
└── styles/globals.css
tests/                       # Playwright specs
```

## Testing

After changes run: `npm run lint` → `npm run build` → `npm run test` → verify localhost:3000

**Expected issues**: GitHub API/HuggingFace may fail in sandboxed envs, PDF viewer CORS errors in dev, lint warning in modelLoader.ts (safe to ignore)

## Deployment

- **CI/CD**: `.github/workflows/deploy.yml` (auto-deploy on push to main)
- **E2E**: `.github/workflows/test.yml` (Chromium, Firefox, WebKit on PRs)

## Code Checklist

1. Static export compatible?
2. Types defined?
3. Responsive design?
4. Error handling?
