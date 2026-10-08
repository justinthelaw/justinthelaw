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
| External UI fixtures | Browser UI specs import `test` from `tests/fixtures.ts` so resume, avatar and default profile requests are deterministic. Explicit profile-response tests override those routes. This does not replace the fresh live profile required for review screenshots |
| Game source exclusion | Do not test source code inside `games/`. Website export tests may use temporary fixture files to verify copying and asset paths without testing game behavior |
| Game tooling boundary | Independent games use their own framework/language lint and type checks. Website ESLint and TypeScript exclude `games/` builds; this does not relax the DRY, SOLID, or source-quality requirements for game code |
| Pokémon static checks | `tools/pokemon-dungeon/` has its own pinned package and `npm run check`; root lint/types exclude it. `game-static.yml` parses/types source, validates authoring inventories/coverage and asset files without executing game modules. Content/art authoring and the disposable art preview stay outside `games/` |

## Arcade

The home page's top-right portal uses the shared outline Button and Tooltip
primitives. Its decorative 🕹️ glyph uses the shared 28/32/36px icon box and
matching responsive font sizes;
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
below it, and puts Play at the bottom right. The first card launches the
Pokémon development shell and clearly states that its campaign is unavailable.
Its picture is the existing P06 3D art study, not a gameplay capture. The other
two cards say "Coming soon" with lavender and apricot pixel characters.
Placeholders animate; reduced-motion preferences keep them still.
The sprites are original 32-pixel designs rendered with crisp SVG edges,
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
in a viewport-filling modal with a safe-area Back to games control and keyboard
focus restoration. Cards stay mounted behind the modal. Without an entry
point, Play is disabled. The configured GitHub Pages base path is prepended to
the iframe URL.

`GameControls` and `useGameControls` belong to the website. Touch controls emit
standard keydown/keyup events to the same-origin iframe: arrows (including
two-key diagonals), A/Z, B/X, Start/Enter, Select/Shift and Menu/Escape.
Desktop input uses native iframe focus. Controls default to visible for touch
devices, remain manually toggleable, use targets of at least 44px, and release
held keys on interruption, hiding, navigation and disposal. The bridge does
not implement missing game simulation; tests use inert key-recording fixtures.
Typing surfaces normally suppress every overlay key. A focused editable text
input can explicitly opt into overlay A/Start only with
`data-game-controls-confirm="submit"`; movement, B, Select/Menu, readonly fields,
other typing surfaces and host-page typing retain protection. The game owns
submission, validation and scene guards; the bridge only emits the bounded key
pair to the captured input recipient. Website fixture tests cover this contract
without importing or executing game source.

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

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pokémon Dungeon Reimagined execution and release gates

The first game lives under `games/pokemon-dungeon-reimagined/`; the user
permitted a game folder instead of the original single-HTML limit. Planning
PR #387 was merged on 2026-10-04. Later that day, Justin instructed:
"Continue the @Codex implementation of the Pokemon Blue Rescue Team game in
justinthelaw/justinthelaw. You probably have uncommitted changes, so start from
there." This is the separate implementation-start authorization. Resume the
first incomplete dependency-ready package recorded in `plan/PROGRESS.md`.
Source-evidence gates and the P06/P10 visual reviews still apply. Arcade
full-game release still requires P36/P37 acceptance. On 2026-10-05, Justin
explicitly authorized the first-card development launcher, joystick and modal
controls in a new PR after merging #390, then instructed autonomous planning
and implementation and waived external Codex review. This overrides the older
placeholder hold for that scoped launcher; it does not certify a playable
campaign or authorize merging the new PR.

The latest 2026-10-05 visual instruction rejects the primitive rigid-mesh
character candidates and supersedes the earlier inferred P06 acceptance. Use
faithful directional pixel characters in a textured, illuminated real 3D world,
following the user-supplied EthrA reference. All character/device acceptance remains open. P02-A
authoring inventories are not runtime catalogs, and P07-A ID/snapshot/RNG
primitives do not complete the campaign state, save system or playable game.
See `games/pokemon-dungeon-reimagined/plan/STATE-FOUNDATION.md` for the reviewed
bounded interface; do not
consume unresolved original mechanics through an invented default.

On **2026-10-04**, the user approved all recommended decisions except D03,
selecting **B: bold cel-shaded 3D**. D03 below reflects the newer 2026-10-05 pixel direction; the other choices
remain binding. Do not repeat resolved decision questions. The later start instruction authorizes
implementation; it does not authorize merge, deployment or arcade activation.

| Decision | Binding selection |
| --- | --- |
| D03 | Directional pixel characters in textured real 3D environments, per the latest EthrA reference. Faithful silhouettes/proportions/markings are mandatory. Historical B illustration and rejected rigid models are evidence only; new pixel candidates need review. |
| D04 | Browser rescue codes/file exchange and equivalents for Blue's extra modes/events; preserve content/progression. Original cartridge interoperability is not a completion gate; claim compatibility only where sourced and demonstrably verified. |
| D05 | Human play and visual review are allowed after implementation; automated tests importing/executing game source remain prohibited. |
| D06 | No separate Groudon practice mode; use the original campaign route and campaign gameplay capture. |
| D08 | JavaScript ES modules with JSDoc and strict independent static type checks; authoring tools remain outside `games/`. |

Keep both generated raster illustrations under
`games/pokemon-dungeon-reimagined/plan/art-candidates/` with their provenance.
B was formerly selected; both are retained historical references pending a new loading-art review. Neither
is a 3D runtime model or a gameplay screenshot, and neither may replace the
arcade's eventual real campaign capture.

Read [the handoff plan](games/pokemon-dungeon-reimagined/plan/PLAN.md), then the nested
[game instructions](games/pokemon-dungeon-reimagined/AGENTS.md). The plan routes
smaller implementation models to one bounded task and its supporting appendix
at a time. Record future decisions and progress in the linked ledger. Keep
requirements current in these AGENTS files; the root README.md remains outside
this work's scope. Keep the complete plan inside the game's `plan/` directory.
Maintain [games/README.md](games/README.md) as the concise arcade guide and live/WIP
game catalog, using headings, tables and lists; omit prose paragraphs. A section may use
2–3 front-matter sentences only when absolutely necessary; none are needed now.

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
Do not add automated game tests. The user approved manual play and visual
acceptance after implementation on 2026-10-04 and subsequently authorized
implementation. Record actual manual evidence separately from static review.
A future standalone-game persistence adapter may use localStorage/IndexedDB
behind one validated interface; the website retains its Zustand convention.

For the Blue game, require emulator-style semi-transparent controls across the
lower half of the viewport, with accessible touch/keyboard handling. Follow the
[asset pipeline](games/pokemon-dungeon-reimagined/plan/ASSET-PIPELINE.md) for consistent
master prompts, reference assets, uniform sheets, verified cropping and provenance.
Directional RGBA atlases now supply character animation on depth-tested billboards
in actual 3D environments. Follow `tools/pokemon-dungeon/art/pixel/CONTRACT.md`;
retain historical GLB validation separately. Do not pixelate unchanged rejected
models, retry blocked ImageGen requests, or substitute paid API generation.

Shared early recipient item effects and catching now route self ingestion and
player Gravelerock impact through one owner. V17 admits only actual nonself
Sleep Seed provenance over frozen v16. Broader trajectory modifiers and Item
Master remain separate gates; all admitted inventories/learned slots remain intact.

Finite Pokémon item throws use the existing command/turn transaction and inventory
panel. All424 native capability positions have a separate parser-only source
projection with419 exact profile joins; do not add guessed defaults or modify
frozen species/effects resources. See the game plan/THROWING.md for T02 scope,
legacy Gravelerock compatibility and remaining Item Master gates. Stun Seed now
has development use/throw activation over its reviewed v18
Petrified lifecycle and accepted v19 bounded continuation. Heal/Quick Seeds
share real recipient ingestion/impact without a new save revision: Heal clears
owned admitted classes/slow/seals with cache-only speed refresh; Quick samples
before cap/full-array checks and uses the turn raise/attack-unlock owner. See
game plan/HEAL-QUICK-SEEDS.md, STUN-SEED.md and TURN-CONTINUATION.md. Preserve
the frozen v20 chapter-work bridge in game plan/CHAPTER-FIVE-WORK.md. Its v21
successor in plan/STEEL-MEANIES.md independently owns original-pair ordinary
Steel1–8/fixed9, the complete station batch/50-point endpoint and actual outside
Meanies/Pelipper op6 through MAIN5,7. Preserve Steel postings and Magnemite
selection; unrestricted later work stays held for real Bronze escorts/rewards. Preserve
every earlier
envelope boundary, live Leech link and Water Sport counter. Continuation checkpoints
commit only the first completed opportunity, flush recipient or empty-completion
phase; special leader after-work must yield before selecting its counterpart.
Keep schema.js and historical pins frozen, exact original-envelope validation,
all128 wild slots and co-located trap/money admission. New effects, propagation,
entry policies or tile event patterns must revise the documented4096-event burst
proof. Scoped counted tile notices deliberately change transient notification
multiplicity; canonical pickups remain intact. One owned browser-frame pump
resumes the exact saved PC; no player mutation may interleave. The accepted
continuation review covers saved cursors and stale load, replacement and menu
callbacks; future changes require scoped review. Human latency/device/save-
interruption and broader acceptance remain
separate full-release gates.

The bounded Bronze generation/reward prerequisite is recorded in
`games/pokemon-dungeon-reimagined/plan/BRONZE-JOBS.md`. Its exact v22 schema/policy
adds prospective source metadata and station prefix/mission-area ownership while
preserving original v2–v21 envelopes and every historical source pin. MAIN5,7
outing/refresh remains held for genuine escort guest/second-work lifecycle;
static source/type/admission checks do not establish gameplay or full-game gates.
