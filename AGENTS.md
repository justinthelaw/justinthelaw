# Agentic Coding Instructions

## Scope and Stack

Static Next.js portfolio for GitHub Pages, with a resume viewer, browser-local
Hugging Face chatbot, and arcade. Uses the pages router, React 19, TypeScript 6,
Tailwind 4, Zustand 5, Transformers 4 in a Web Worker, and Playwright.
See `package.json` for exact versions and the patched PostCSS line.

The Pokémon scope is the original DS opening through Tiny Woods and Caterpie's
rescue. PR #397 was merged; its former branch is not an ongoing task. Follow
[the game's instructions](games/pokemon-dungeon-reimagined/AGENTS.md) and
[Blue opening plan](games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md), not
retired 3D/full-campaign requirements. Preserve saves and evidence; later
campaign resources stay outside the distribution. Code volume does not establish
asset or behavior parity.

## Critical Constraints

- Static export only: no API routes, server actions, `getServerSideProps`, or
  other server-side features.
- Derive production asset URLs from the configured GitHub Pages `basePath`;
  never hardcode `/justinthelaw`. Build before previewing `out/` with `npm start`.
- Run inference in `src/services/ai/worker.ts`, never on the main thread.
- Keep README for orientation, configuration in `docs/CUSTOMIZATION.md`,
  architecture/flow in `docs/DIAGRAMS.md`, and engineering constraints here.
- Use signed commits. Merging, deploying, and issue/PR metadata changes need
  explicit authorization. Preserve unrelated work.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run flight-check` | **Required after changes:** clean, lint, build, test |
| `npm run clean` | Remove temporary build/dev/test artifacts |
| `npm run lint` | Website ESLint |
| `npm run build` | Static export to `out/`, including selected games |
| `npm run test` | Playwright; build first outside `flight-check` |
| `npm run deploy` | Build and deploy to GitHub Pages |
| `pre-commit install` | Install configured hooks |
| `pre-commit run --all-files` | Pre-commit checks |
| `pre-commit run --all-files --hook-stage pre-push` | Pre-push checks, including app lint |

Hooks cover Markdown, YAML, workflows, shell scripts, whitespace, smart quotes,
merge conflicts, private keys, and large files. See
[Contributing](docs/CONTRIBUTING.md) for toolchain and review requirements.

## Architecture and Standards

| Location | Responsibility |
| --- | --- |
| `src/components/` | Feature-based UI: chat, profile, resume, links, arcade |
| `src/components/chat/components/`, `hooks/` | Chat rendering and business logic |
| `src/config/` | Settings and canonical `public-profile.json` |
| `src/pages/` | Pages-router entry points |
| `src/services/ai/`, `github/` | Worker/model/context services and GitHub integration |
| `src/stores/`, `types/`, `utils/`, `styles/` | Zustand state, types, utilities, global Tailwind styles |
| `tests/` | Website Playwright tests |
| `games/` | Independent browser games exported to `out/games/` |

- Group UI by feature with `index.ts` barrel exports. Components render; hooks
  own business logic, services own integrations, and Zustand owns global state.
- Keep website and game source DRY and SOLID, with clear responsibilities and
  reusable components rather than speculative abstractions.
- TypeScript: explicit types/return types, `interface` for object shapes, `type`
  for unions/callbacks, no `any`. Use functional React components, custom hooks
  for complex logic, named hook return values, and testable `data-testid`s.
- Use grouped Tailwind utilities/responsive prefixes and `@/` imports (`src/`).
  Use Zustand `persist` for localStorage; never access it directly. Present
  errors with fallbacks, narrowing unknown exceptions via `instanceof Error`.
- Use `WorkerAction`/`WorkerStatus` enums, not magic strings. Automatic model
  loading uses `int8` then `uint8` on all viewports. Do not default to `q4`
  unless ORT WASM can mount external `.onnx.data` files in browser workers.
- Change profile facts only in `src/config/public-profile.json`, shared by
  browser retrieval and Python dataset generation. Keep section IDs generic
  and temporally prioritized; put person/employer terms in facts and keywords.

## Testing and Review

- Always run `npm run flight-check`. Verify static-only output, explicit types,
  mobile/desktop behavior, error handling, navigation, accessibility, animations,
  reduced motion, and game-loading integration.
- Playwright covers Chromium, Firefox, WebKit, Pixel 5, and iPhone 12. GitHub and
  Hugging Face may fail in sandboxes; the PDF viewer may have dev CORS issues.
- UI specs import `test` from `tests/fixtures.ts` for deterministic resume,
  avatar, and profile requests. Profile-response tests override those routes.
  Review screenshots still require a freshly fetched live GitHub profile.
- Do not test source inside `games/`, execute game modules, or automate
  playthroughs. Website tests use inert fixtures, including temporary export
  files for copying/path checks. Manual browser play is allowed.
- Games own framework/language lint and types; root ESLint/TypeScript exclude
  their builds without relaxing source quality. The pinned isolated
  `tools/pokemon-dungeon/` package runs `npm run check`; `game-static.yml`
  validates source, types, inventories, coverage and assets without execution.
  Authoring and disposable art previews stay outside `games/`.

## Arcade and Chat UI

### Shared Controls

- Keep the arcade portal top-right and the icon-only chatbot bottom-right.
  Use shared Button/Tooltip primitives, `responsiveIconStyles`, and Button's
  `responsive-icon` size: 40/44/48px controls and 28/32/36px icons at default/sm/md.
  The decorative 🕹️ uses matching font sizes; its tooltip derives
  "Portal to Justin's arcade" from the configured name.
- `CornerIconButton` mirrors top/bottom/right insets: page padding plus social
  footer padding/border (21px at default root font size). Align chat with the
  social buttons, not their container. Keep the colored robot fill/stroke and
  original centered 20:16 silhouette; `viewBox="1 1 22 22"` fills at least 90%
  of the icon width without square stretching.
- All buttons/button-style links use concise 2–5 word action/destination
  tooltips through `tooltip`/`tooltipSide`. Preserve independent accessible
  names, native disabled semantics, and focusable disabled-button wrappers.
  Prompt-limit tooltips retain touch toggle and exact trimmed character counts.
- Keep chat compact: plain download consent, one Start chat action, icon-only
  Send/clear/close, short help, and screen-reader message roles. Disclose initial
  and fallback download sizes and browser-local chats. Preserve progress,
  errors/retry, generation locking, history, and focus return.
- Reserve space beside the first message for profile-trim warnings. Test this
  with the real component/export styles and a trimmed fixture independent of
  current profile length.
- Preserve the system sans-serif font stack and live GitHub bio fetch. Review
  captures must verify the rendered font and use a fresh API response, never
  fallback bio. Disclose paused animation or stubbed resume iframes in the PR.

### Cards and Export

`/arcade/` has only a Home navigation control (no top-right name), a single
scrolling card column up to 620px wide, side padding, and a non-shrinking wrapper
with 40px bottom padding even on mobile. Center padded previews, put short text
below, and Play bottom-right. The first card describes the selected Pokémon
opening and uses a native Tiny Woods capture, uncropped at 4:3 with crisp scaling.
Lavender/apricot placeholders say "Coming soon". Original 32-pixel SVG blobs
animate unless reduced motion is preferred; no OpenAI branding or copied
character accessories.

| File | Responsibility |
| --- | --- |
| `src/config/arcade.ts` | Card `id`, `title`, `description`, `blobVariant`, optional `preview`/`entryPoint` |
| `src/types/arcade.ts` | Game/blob types |
| `src/components/arcade/` | Sprites, portal, cards, player and controls |
| `src/pages/arcade.tsx` | Layout, metadata, build-time static card props |
| `scripts/export-games.mjs` | Browser-build export |

Add games as `games/my-game/index.html` plus JS/CSS/assets with relative URLs.
`distribution.json` declares the exported files; absent manifests use the full
folder. An absent `games/` is a no-op. Game-only changes trigger Pages deployment.
Set the card's `entryPoint` to `/games/my-game/index.html`; missing entry points
disable Play. The iframe gets the configured base path and opens inside a
viewport-filling modal with safe-area Back to games and focus restoration.
Cards remain mounted behind it.

For previews, add an image/GIF in `public/arcade/` and configure
`preview: { src: "/arcade/my-game.gif", alt: "Description of the game" }`.
Local paths receive the base path; absolute HTTPS URLs work. Omit `preview` for
the blob. Keep `trailingSlash: true` so direct `/arcade/` visits/reloads resolve
to `out/arcade/index.html`.

### Input Boundary

`GameControls`/`useGameControls` are website code. They emit same-origin iframe
keydown/keyup pairs for arrows (including diagonals), A/Z, B/X, Start/Enter,
Select/Shift, and Menu/Escape. Desktop keys use native iframe focus. The overlay
defaults on for touch, remains toggleable, uses targets ≥44px, and releases held
keys on interruption, hiding, navigation, or disposal. It supplies no simulation;
website tests use inert key-recording fixtures.

Typing surfaces suppress overlay keys. Only focused editable inputs with
`data-game-controls-confirm="submit"` may opt into A/Start; movement, B,
Select/Menu, readonly fields, other typing surfaces and host typing stay
protected. The game owns submission, validation, and scene guards; the bridge
only sends the bounded pair to the captured recipient.

Restore the exact captured iframe document before delivery. Enter/Space actions
wait for host key release; interruption, navigation, or recipient changes cancel
them. A release in the current child clears host ownership without replaying a
cancelled action. Initial loads preserve deliberate overlay focus; subsequent
loads preserve host focus so held activation cannot leak to a replacement game.

## CI and Documentation

- `.github/workflows/deploy.yml`: deploys `main`; `app.test.yml`: PR Playwright.
- Update affected orientation (`README.md`), instructions (`AGENTS.md`),
  configuration (`docs/CUSTOMIZATION.md`), flow (`docs/DIAGRAMS.md`), and
  command-level training docs (`ml/profile-qa/README.md`). Keep them concise,
  layered, and explicit about file paths.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
