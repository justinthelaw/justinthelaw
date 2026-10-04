# Agentic Coding Instructions

Instructions for AI coding agents operating in this repository.

## Project Overview

Next.js static site for GitHub Pages with an in-browser AI chatbot powered by
HuggingFace Transformers (WebAssembly). The site serves as a personal portfolio
with a resume viewer and an LLM-based chatbot that answers from personal context.

## Stack

| Layer | Tooling |
| --- | --- |
| Framework | Next.js 16.3, static export, pages router, patched PostCSS line |
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
| Documentation scope | Record arcade behavior, game integration, testing scope, and engineering requirements in this file; leave the root `README.md` unchanged for this feature |
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
│   ├── arcade/          # Original pixel blobs, portal, game cards, embedded player
│   └── chat/
│       ├── components/  # UI components (ChatContainer, ChatMessages, ChatInput, etc.)
│       └── hooks/       # Business logic (useAIGeneration, useChatHistory, useModelManagement)
├── config/              # Centralized settings and canonical public-profile JSON
├── pages/               # Next.js pages router (index.tsx, _app.tsx)
├── services/            # External dependencies
│   ├── ai/              # AI service layer (worker, model loader, context provider)
│   └── github/          # GitHub API integration
├── stores/              # Zustand stores (chatStore.ts)
├── types/               # TypeScript interfaces and enums (worker message types)
├── utils/               # Utilities (device detection)
└── styles/              # Global CSS (Tailwind)
tests/                   # Playwright E2E tests
games/                   # Future static browser games; copied into out/games/ at build
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
| Canonical public profile | Update facts only in `src/config/public-profile.json`; browser retrieval and Python dataset generation consume the same file |

## Code Standards

| Area | Standard |
| --- | --- |
| TypeScript | Use explicit types, `interface` for object shapes, `type` for unions and callbacks, and avoid `any` |
| React | Use functional components, extract complex logic into custom hooks, and add `data-testid` attributes for testable elements |
| All source code | Keep website and game code DRY; follow SOLID principles and the best practices of each framework and language. Prefer clear responsibilities and reusable components over speculative abstractions |
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
| Website coverage | Test website navigation, responsive layout, accessibility, animations, reduced motion, static export, and game-loading integration |
| Game source exclusion | Do not test source code inside `games/`. Website export tests may use temporary fixture files to verify copying and asset paths without testing game behavior |
| Game tooling boundary | Independent games use their own framework/language lint and type checks. Website ESLint and TypeScript exclude `games/` builds; this does not relax the DRY, SOLID, or source-quality requirements for game code |

## Arcade

The home page's top-right portal uses the shared outline Button and Tooltip
primitives. Its original blue pixel blob bobs vertically with squash and stretch;
hover or keyboard focus shows "Portal to Justin's arcade" (derived from the
configured name). Keep the AI chatbot button in the **bottom-right** corner.
Retain its existing robot silhouette, use a colored fill and stroke, and match
the social icons' visual size at each responsive breakpoint. The chat control
shows only the robot icon, with its accessible name retained. Social, chat, and
arcade controls share `responsiveIconStyles` and the Button's `responsive-icon`
size. Their square controls are 40/44/48px and icons are 28/32/36px at the
default/sm/md breakpoints. `CornerIconButton` shares the corner appearance and
mirrors top/bottom and right insets: page padding plus the social footer's
padding and border (21px at the default root font size). Align the chat control
with the social buttons themselves, rather than the outside of their container.
Normalize the robot's drawing with `viewBox="1 1 22 22"`: its visible width
fills at least 90% of the shared icon box while retaining its original 20:16
silhouette and centered placement. Do not stretch the robot to a square.

All website buttons and button-style links have concise 2-5 word action or
destination tooltips. Use the shared Button's `tooltip` and `tooltipSide` props;
disabled buttons retain native disabled semantics and use a focusable wrapper
so their tooltips remain available on hover and keyboard focus. Prompt-limit
warnings retain their touch toggle and exact trimmed character counts in a
short tooltip. Preserve accessible names independently of tooltip text.

Keep the chat modal compact: plain download consent with one Start chat action,
icon-only Send, clear and close controls, short helper text, and message roles
available to screen readers. Consent must disclose the approximate initial and
possible fallback download sizes and that chats stay in the browser. Preserve
loading progress, errors, retry, generation locking, history, and focus return.
When a profile-trim warning appears, reserve space beside the first message
so the warning icon never overlaps its text. Exercise this conditional layout
with the real website component and export styles, using a trimmed fixture
independent of the current profile's length.

Preserve the existing system sans-serif font stack and live GitHub bio fetch.
For review screenshots, verify the actual rendered font is sans-serif and use
a freshly fetched GitHub API profile response, never the fallback bio. Captures
may pause animation and stub the external resume iframe; disclose that in the PR.

`/arcade/` is a separate page with a Home link and a single scrolling column of
cards. Each card centers its preview with padding, places a short description
below it, and puts Play at the bottom right. The initial three cards say
"Coming soon" and use distinct blue, lavender, and apricot pixel characters.
All placeholders and the portal animate; reduced-motion preferences keep them
still. The sprites are original 32-pixel designs rendered with crisp SVG edges,
without OpenAI branding or copied character accessories.
The arcade navigation has only its Home control, with no top-right name label.
Cards fit the available page width with side padding and a 620px column limit.
The page wrapper must not flex-shrink: it grows with the cards and keeps 40px
of bottom padding after the last card, including at mobile widths.

| File | Responsibility |
| --- | --- |
| `src/config/arcade.ts` | Card data (`id`, `title`, `description`, `blobVariant`, optional `preview`, optional `entryPoint`) |
| `src/types/arcade.ts` | Shared game and blob variant types |
| `src/components/arcade/` | Reusable sprites, portal, cards, and embedded game player |
| `src/pages/arcade.tsx` | Page layout, metadata, and card configuration passed as build-time static props |
| `scripts/export-games.mjs` | Copy complete browser game builds and assets into the static export |

To add a game later, put its static browser build in `games/my-game/`, including
`index.html`, JavaScript, CSS, and assets. Use relative asset URLs inside the
game. `npm run build` runs the export script after Next.js and copies the whole
`games/` folder into `out/games/`; an absent folder is a no-op. Game-only changes
also trigger the Pages deployment workflow.

Set the card's `entryPoint` to `/games/my-game/index.html` and update its title
and description. Play loads the entire game in an iframe **inside this website**,
with a Back to games control and keyboard focus restoration. Without an entry
point, Play is disabled. The configured GitHub Pages base path is prepended to
the iframe URL.

For a screenshot or GIF, set
`preview: { src: "/arcade/my-game.gif", alt: "Description of the game" }` and put
the file in `public/arcade/`. Local preview paths receive the configured base
path; absolute HTTPS image URLs also work. Omit `preview` to retain the animated
blob. Static export uses `trailingSlash: true` so the arcade lives at
`out/arcade/index.html` and supports direct visits and reloads on GitHub Pages.

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
| `/docs/DIAGRAMS.md` | Architecture, runtime flow, deployment behavior, or profile-QA pipeline changes |
| `/ml/profile-qa/README.md` | Local training, evaluation, export, or publishing commands change |

Keep docs concise and layered: README for orientation, `docs/CUSTOMIZATION.md`
for configuration, `docs/DIAGRAMS.md` for system flow, and
`ml/profile-qa/README.md` for command-level fine-tuning details. Use exact file
paths so both humans and agents can act on the instructions.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Pokémon Dungeon Reimagined planning hold

The first game is planned under `games/pokemon-dungeon-reimagined/`. The user
explicitly permitted a game folder instead of the original single-HTML limit.
On 2026-10-04 the user requested an extensive implementation plan and only
prerequisite repository setup, then a stop for their review. **Do not resume
product implementation, wire the arcade card, merge, or deploy this game until
the user reviews this groundwork and authorizes the next stage.** Earlier
instructions to continue until the whole game is implemented are superseded
by this planning hold. Approval to merge an earlier website PR does not
approve merging this planning PR.

The user separately authorized two candidate raster loading illustrations for
D03 visual planning. Store them under
`games/pokemon-dungeon-reimagined/plan/art-candidates/` and label them as planning
illustrations, not 3D runtime assets, approved final art, or gameplay screenshots.
This limited visual-planning authorization does not lift the runtime or arcade
integration hold.

Read [the handoff plan](games/pokemon-dungeon-reimagined/plan/PLAN.md), then the nested
[game instructions](games/pokemon-dungeon-reimagined/AGENTS.md). The plan routes
smaller implementation models to one bounded task and its supporting appendix
at a time. Record future decisions and progress in the linked ledger. Keep
requirements current in these AGENTS files; the root README.md remains outside
this work's scope. Keep the complete plan inside the game's `plan/` directory.
Maintain [games/README.md](games/README.md) as the concise arcade guide and live/WIP
game catalog, using sections, tables and bullets with paragraphs of at most
2-3 sentences.

The reference edition is the original **Pokémon Mystery Dungeon: Blue Rescue
Team**; its campaign and postgame are the third-person 3D target. Red Rescue
Team may inform comparative or cross-version research only: do not implement
a Red campaign or edition selector, and verify shared findings against Blue.
Research findings are not a completeness claim.
Maintain explicit fidelity and asset-coverage inventories; never treat a list
of dungeon names, generic creatures, or abbreviated story summaries as a
finished recreation. All runtime resources must eventually be local static
assets with relative URLs under the existing Pages base path.

Keep all intermediate runtime-package PRs unmerged until P37, after full-scope
acceptance and explicit release/merge/deployment approval. The exporter copies
`games/**` and main deploys it at directly accessible URLs, so a disabled arcade
card does not prevent an unfinished runtime from being published. Runtime work
must remain on development branches until that release gate.

The existing website testing boundary still applies: no tests execute or
import game source. Website player/export tests use inert fixture HTML and
temporary fixture files. Independent game syntax, lint, type, schema checks,
code review, and user-directed visual capture are separate from gameplay tests.
Do not add automated game tests. The plan proposes manual play and visual
acceptance after implementation; that proposal is part of the user's review.
A future standalone-game persistence adapter may use localStorage/IndexedDB
behind one validated interface; the website retains its Zustand convention.

For the Blue game, require emulator-style semi-transparent controls across the
lower half of the viewport, with accessible touch/keyboard handling. Follow the
[asset pipeline](games/pokemon-dungeon-reimagined/plan/ASSET-PIPELINE.md) for consistent
master prompts, reference assets, uniform sheets, verified cropping and provenance.
Raster sheets support 2D assets; they do not replace the separate 3D rig/model work.
