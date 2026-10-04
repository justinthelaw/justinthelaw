# Pokémon Dungeon Reimagined: website integration and release appendix

## Scope and status

This appendix is a future implementation specification. The current requested
deliverable is an extensive plan and prerequisite repository setup, followed by
user review. Do not activate a game card, commit a gameplay screenshot, add a
game runtime, or describe future implementation tasks as shipped behavior.
Keep all three existing arcade placeholders until the reviewed plan authorizes
implementation and the playable release satisfies its readiness gates.
All three live cards, including the first card, remain unchanged in this
planning change. There is no approved game runtime, final runtime artwork, or
gameplay screenshot. Two user-authorized raster loading-illustration candidates
for D03 may be created under `art-candidates/`; they are visual-planning assets,
not 3D runtime assets or gameplay captures. Reviewing this appendix or those
candidates does not lift the planning hold or authorize
an automatic merge, release, or deployment.

The sole reference edition is the original **Pokémon Mystery Dungeon: Blue
Rescue Team**. Red Rescue Team is comparative/cross-version research only;
there is no Red campaign or edition selector, and shared findings require
Blue-specific verification.

The existing `AGENTS.md` at repository HEAD states: "Do not test source
code inside `games/`. Website export tests may use temporary fixture files to
verify copying and asset paths without testing game behavior." The applicable
[root instructions](../../../AGENTS.md), [game instructions](../AGENTS.md),
and [parent plan](PLAN.md) preserve that boundary. Syntax checks, framework lint,
independent type checks, static review, and a specifically authorized gameplay
screenshot capture are distinct from game-source tests; do not turn screenshot
capture into a hidden gameplay test suite.

Repository: `justinthelaw/justinthelaw`. All paths are relative to its root unless
identified as a served URL. Execute commands from a local checkout's root.
The root `README.md` remains unchanged for this feature.

## Work-package authority and crosswalk

[PLAN.md](PLAN.md) is authoritative for package IDs, dependencies, acceptance,
approval, and execution order. The following sections expand its instructions;
they do not create a separate implementation or release sequence. All packages
after P00 remain unapproved and not started.

| Appendix instructions | Authoritative work package |
| --- | --- |
| Preserve current placeholders; inspect paths and fixture boundaries | P00: groundwork and review hold |
| Pin local renderer/tooling, vendor notices, and dependency isolation | P04: toolchain; dependencies and decisions in PLAN govern |
| Loading, resource disposal, cache coordination, and performance budgets | P34: robustness/polish, consuming earlier presentation/persistence contracts |
| Actual gameplay screenshot and full release-candidate evidence | P35 acceptance feeds P36; any optional practice profile requires D06 approval |
| First-card data, preview, iframe paths/focus, responsive layout, inert-fixture website assertions | P36: first arcade card and website integration |
| Flight-check, contribution checks, current-head CI/Codex review, explicit publication authorization | P37: contribution review, PR delivery and deployment |

P36 requires the accepted full release candidate from P35 **and explicit
permission to expose it**. P37 depends on P36 and separately requires explicit
merge/deployment authorization. Passing checks do not grant either permission.
Every intermediate runtime-package PR remains unmerged until P37 full-scope
acceptance and explicit release approval. The existing exporter copies
`games/**`, and main deploys that tree at direct URLs; keeping Play disabled is
insufficient to prevent publication of an unfinished game. Keep runtime work
on development branches until the approved complete release is merged.

## Existing repository map

Paths below are relative to the repository root. This is the existing website
architecture recorded from current HEAD source paths; it is not evidence of a
game implementation. The repository-evidence register below links the files.

| Existing file | Responsibility and constraint |
| --- | --- |
| `AGENTS.md` | Repository instructions; arcade behavior, integration requirements, tooling boundaries, and plan/review status belong here. Read before subsequent implementation. |
| `src/config/arcade.ts` | Three initial placeholder records. Future first-card title, description, screenshot, and entry point require only one data-record change. |
| `src/types/arcade.ts` | `ArcadeGame` shape: `id`, `title`, `description`, `blobVariant`, optional `preview`, optional typed `/games/${string}` entry point. `BlobVariant` is blue, lavender, or apricot. |
| `src/types/index.ts` | Public type barrel; retain existing exports. |
| `src/pages/arcade.tsx` | Pages Router route, metadata, Home navigation, `getStaticProps` for card records, page sizing, and bottom padding. |
| `src/components/arcade/ArcadeCard.tsx` | Padded screenshot/blob preview, heading, description, Play action, disabled semantics, and shared action tooltip. Local preview paths receive the configured base path; HTTPS previews are also supported. |
| `src/components/arcade/ArcadeGames.tsx` | Cards/player state, iframe creation after Play, iframe focus on load, Back action, card remount, and next-animation-frame Play focus restoration. |
| `src/components/arcade/ArcadePortal.tsx` | Home-page arcade control; preserve corner placement and accessible portal label. |
| `src/components/arcade/PixelBlob.tsx` | Original pixel sprites for the portal and placeholders. |
| `src/components/arcade/PixelBlob.module.css` | Sprite animation and reduced-motion behavior. |
| `src/components/arcade/Arcade.module.css` | Arcade main override, preview box, three tint variants, and responsive iframe dimensions. |
| `src/components/arcade/index.ts` | Feature barrel. |
| `src/components/ui/button.tsx` | Shared button sizes, tooltip behavior, and accessible wrapper for disabled controls. Do not fork a game-specific website button. |
| `src/config/site.ts` | Canonical site identity, current GitHub profile settings, and derived development/production asset paths. Production project base path comes from repository configuration. |
| `src/styles/globals.css` | System sans-serif font stack and shared site appearance; preserve. |
| `src/components/profile/GitHubProfile.tsx` | Live GitHub bio fetch with existing fallback; preserve runtime fetching. |
| `next.config.mjs` | Static export, trailing slash, unoptimized image support, configured base path and asset prefix. No server-only feature may be added. |
| `scripts/export-games.mjs` | Copies the complete `games/` folder recursively to `out/games/`; missing `games/` is a no-op. It does not transpile or bundle games. |
| `scripts/serve-static-preview.mjs` | Serves `out/`, infers project base path from exported HTML, and redirects root to that path. Includes `.html`, `.js`, `.json`, `.jpg`, `.png`, and `.wasm` MIME handling. |
| `package.json` | Existing root Next/React dependency graph and commands; `postbuild` invokes game export. Preserve root dependencies unless an explicit reviewed requirement justifies changing them. |
| `package-lock.json` | Root lockfile; do not populate with speculative game dependencies. |
| `eslint.config.mjs` | Website lint with `games/**` excluded. Game code still requires its own explicit quality checks. |
| `tsconfig.json` | Website TypeScript configuration with `games` excluded. Do not import game modules into website TypeScript or tests. |
| `playwright.config.ts` | Desktop Chromium/Firefox/WebKit and mobile Chrome/Safari projects; development preview locally and static preview under CI. |
| `tests/arcade.spec.ts` | Website portal, reload, card layout, animation/reduced motion, generic fixture player, and corner icon sizing coverage. |
| `tests/buttons.spec.ts` | Shared tooltip length, keyboard/hover behavior, disabled game action, and existing chat action coverage. |
| `tests/export.spec.ts` | Exported assets, preview-server paths, direct arcade reload, and website runtime integration. |
| `tests/game-export.spec.ts` | Exporter filesystem behavior using temporary `games/sample` HTML/JS/JSON fixtures; it does not execute a game. |
| `tests/home.spec.ts` | Home/profile regression coverage; preserve existing expectations. |
| `.github/workflows/app.test.yml` | PR npm install, complete lockfile graph check, build, lint, Playwright browser install, and full website tests. |
| `.github/workflows/deploy.yml` | Main-branch Pages build/test/deploy; includes `games/**`, `public/**`, and export-script changes in path triggers. |
| `.github/workflows/lint.yml` | Contribution/workflow hygiene checks; inspect actual current workflow before changing CI. |
| `.pre-commit-config.yaml` | Hygiene, Markdown/YAML/workflow/shell checks and pre-push ESLint. The existing added-file check sets `--maxkb=1024`; PLAN section 8 expresses the limit as at most 1,024 KiB per file. |
| `.gitignore` | Ignores `out/`, `.next/`, test reports, root dependencies, and generated scratch artifacts. A future game toolchain needs deliberate nested dependency/output rules. |

Before any future Next/React edits, read the relevant installed guides under
`node_modules/next/dist/docs/`, including static exports and `basePath`.
Installed versions and local docs, rather than memory of prior Next releases,
are authoritative for repository implementation.

## Authoritative paths and export contract

| Purpose | Required path |
| --- | --- |
| Future game directory | `games/pokemon-dungeon-reimagined/` |
| Future repository runtime entry point | `games/pokemon-dungeon-reimagined/index.html` |
| Future arcade data `entryPoint` | `/games/pokemon-dungeon-reimagined/index.html` |
| Exported runtime entry point | `out/games/pokemon-dungeon-reimagined/index.html` |
| Future screenshot source file | `public/arcade/pokemon-dungeon-reimagined.jpg` |
| Future arcade data `preview.src` | `/arcade/pokemon-dungeon-reimagined.jpg` |
| Exported screenshot | `out/arcade/pokemon-dungeon-reimagined.jpg` |
| Static arcade page | `out/arcade/index.html` |
| GitHub Pages iframe URL | `${configuredBasePath}/games/pokemon-dungeon-reimagined/index.html` |
| GitHub Pages screenshot URL | `${configuredBasePath}/arcade/pokemon-dungeon-reimagined.jpg` |

Do not hardcode `/justinthelaw` inside the game, card, player, or test fixtures.
The current configured production path happens to be `/justinthelaw`, while
development uses an empty path. Website navigation receives its prefix through
Next links; image and iframe paths explicitly receive `DERIVED_CONFIG.basePath`.
The base path is a build-time setting. Rebuild when repository/site configuration
changes; runtime rewriting of bundled Next base-path settings is insufficient.

Game HTML, imports, data, textures, and audio must resolve relative to its own
directory. Use `./...` imports and module-relative asset resolution when a
resource belongs to a module. Root-absolute `/assets/...` or `/games/...` runtime
requests would break deployment beneath a project path. The game must also
load when visited directly at its exported entry point without the portfolio.

The user explicitly permitted a folder in place of the initial single-HTML
constraint. Do not compress the planned game into an unmaintainable monolithic
HTML file to honor a superseded restriction.

## Eventual website change set

Under P36, after P35 acceptance and explicit permission to expose the game,
change only the first record in `src/config/arcade.ts`:

- `id`: `pokemon-dungeon-reimagined`.
- `title`: `Pokémon Dungeon Reimagined`.
- `description`: a short, accurate description of the delivered experience,
  for example "Explore a 3D reimagining of Pokémon rescue adventures with
  turn-based battles and a partner by your side." Validate this against actual
  completed behavior; do not imply the entire original game is complete.
- `blobVariant`: retain `blue` so the existing preview tint remains compatible.
- `preview.src`: `/arcade/pokemon-dungeon-reimagined.jpg`.
- `preview.alt`: `Pikachu facing Groudon in a lava cavern in Pokémon Dungeon Reimagined`.
- `entryPoint`: `/games/pokemon-dungeon-reimagined/index.html`.

Leave the second and third records unchanged: distinct lavender/apricot sprites,
Coming soon titles/descriptions, no entry point, and disabled Play actions.
Preserve the portal animation and reduced-motion treatment, font stack, live
GitHub bio, website button sizes, concise tooltips, shared icon scale, Home
navigation, iframe player behavior, and page/card spacing. Do not add a
top-right name label on the arcade page.

No website component rewrite is required merely to enable the first game.
Changes to player loading/failure UI should be scoped as separate reviewed
tasks with website fixture coverage and the same focus-restoration contract.

## Website acceptance matrix

| Concern | Required observable result |
| --- | --- |
| First card | Exact game title; short description; actual screenshot with accurate alt; enabled Play. |
| Other cards | Exactly two Coming soon headings, two distinct pixel previews, and two disabled Play buttons. |
| No preload | No game iframe and no request into any `/games/` path before explicit Play activation, including after card render, keyboard focus, tooltip appearance, and screenshot completion. |
| Activation | Keyboard Enter and pointer/touch Play activation replace the card region with the embedded player without leaving `/arcade/`. |
| Iframe path | `src` includes the configured website base path once, followed by the authoritative entry point. |
| Iframe focus | Website document active element becomes the loaded iframe; avoid a focus race between card removal and load completion. |
| Back action | Removes iframe, remounts all cards, and restores focus to the matching newly mounted Play button. |
| Tooltip | Play reports `Play game`; Back reports `Back to games`; Home reports `Back to home`; unavailable actions report `Coming soon`. Disabled wrappers remain keyboard-focusable without enabling native disabled buttons. |
| Screenshot path | Rendered image `src` receives the same configured prefix as the iframe; image decodes with positive natural width. |
| Card geometry | One centered scrolling column, maximum width 620px, preview padding, description below preview, Play at bottom right. |
| Narrow screens | No horizontal overflow, minimum side padding, no card clipping, and at least 32px visibly measured bottom clearance after scrolling to the final card (40px configured page padding). |
| Player geometry | Existing frame fills available width, uses 75svh with a 320px minimum, and retains border/radius. Game input adapts inside those bounds. |
| Animation | Portal and two remaining sprites animate under normal motion; all remain still under reduced-motion preference. |
| Home regressions | Existing font/bio behavior and shared 40/44/48px controls with 28/32/36px icons remain unchanged. |
| Direct/reload path | Exported `/arcade/` loads and reloads beneath the project path; Home returns to configured root. |

## Future website tests: fixture isolation is mandatory

Every website test that can activate a game must install a route before any
navigation or activation. Fulfill `**/games/**` with inert HTML containing a
known marker. No script, image, module import, simulation, renderer, or data
source from the real game may run during the website suite. A catch-all route
in affected suites protects against accidentally activating a real card; a
test-specific route registered later can record paths and return its marker.
Keep interception active for the entire test, including reloads, Back, card
remounts, repeat Play, Home navigation, and the final navigation/cleanup. Do not
unroute after the first fixture load. Fixtures must contain no script, module,
image, font, fetch, or CSS URL that requests actual game assets. Any unexpected
game subresource must be blocked or fulfilled inertly and recorded as a website
integration failure; it must never fall through to the actual runtime.

Keep the existing generic configured-player test with a mocked
`**/_next/data/**/arcade.json` response and `/games/fixture/index.html` fixture.
It exercises configurable integration independently of the actual card.
Add a separate actual-configured-card test; this must use the real website
configuration while replacing only the requested iframe document with inert
HTML. Importing actual game modules into tests is prohibited.

Recommended future test names and assertions:

1. `should lay out one playable game and two padded placeholders in one scrollable column`:
   verify three articles, first exact title, two Coming soon headings, two
   distinct sprite labels, real screenshot alt/src/decoded dimensions, enabled
   first Play, disabled remaining Play actions, centered padded previews,
   bottom-right Play position, no horizontal overflow, side padding, and final
   bottom clearance. Derive expected URL prefix from the current arcade URL.
2. `should bob the portal and both remaining pixel blobs`:
   retain portal motion assertion; expect two card sprite bodies and running
   animations; observe changing vertical position.
3. `should keep portal and card characters still with reduced motion`:
   retain reduced-motion assertions for the portal and both remaining sprites;
   explicitly assert two sprites to avoid a vacuous zero-animation result.
4. `should load the configured game only after Play and restore focus after Back`:
   record all `/games/` requests; assert none and zero iframes before Play;
   focus the enabled actual game action and verify its tooltip; press Enter;
   assert exact base-path iframe `src`, fixture marker content, iframe focus,
   one entry-point request, unchanged arcade URL, iframe removal after Back,
   restored Play focus, three remounted cards, and two disabled placeholders.
   Recheck that the request list did not grow after Back; preserve fixture
   interception through any final Home/reload navigation. If repeat Play is
   exercised, the second frame must also receive inert fixture HTML.
5. `arcade navigation, playable game, and unavailable games explain their actions`:
   reuse concise-tooltip helper for Home, enabled actual-game Play, and a
   disabled placeholder wrapper. Preserve the helper's 2–5 word bound and
   independent accessible names. Do not click into actual game content.
6. `should reload the exported arcade and load its configured game through the base path`:
   start existing static preview server; directly visit/reload `/arcade/`;
   check three cards/two placeholders and decoded screenshot at the exported
   prefix; assert no game request; activate Play; assert fixture marker and
   exact prefixed entry point; Back removes frame and restores Play focus.
   No assertion requires loading real game assets or running the game. Keep
   routes installed through the preview server's teardown and final navigation.

The export fixture tests in `tests/game-export.spec.ts` already cover copying
HTML, relative JS, nested JSON assets, and an absent `games/` folder. Extend
them only with temporary fixture trees when export rules change, for example
new asset extensions, filtering, or stale-file cleanup. Reading fixture text
and verifying its copy is permitted; executing actual game source is not.

Run all five website browser projects at the eventual release gate. Keep
responsive checks at 320, 375, 640, 768, and 1440px where the existing corner
control test already exercises tier boundaries. The test suite should verify
the website frame and navigation with fixtures, rather than gameplay rendering
or turn mechanics. Preserve existing home/chat/model tests.

## Screenshot capture rules for the later implementation phase

Capture the delivered runtime itself, preferably the authorized Groudon
encounter: Pikachu visibly faces Groudon in a lava cavern. Do not substitute
generated promotional artwork, copied original-game artwork, a stock image,
or a mock rendered outside the real runtime. Keep the image alt truthful to
the captured view. If the required scene is not implemented, stop card
activation and report that gap rather than publishing a fabricated preview.
This is future P36 work using the P35-accepted release candidate. No screenshot
or ready scene exists in the planning change. Use normal rendering; any scene,
pose, UI, or camera preparation must be disclosed. Optional practice staging
cannot bypass the full release-candidate dependency or D06 approval.

Use a reproducible internal screenshot scene/state only if the reviewed game
design permits it. Such a capture should initialize a legitimate renderable
state and disclose a staged scene; it must not become an assertion-driven game
test or expose a normal player-facing debug shortcut. Record the build/revision,
capture dimensions, renderer/device settings, chosen scene, and any staging.
Use a landscape crop suitable for the existing 640×360 image declaration,
preserve the subjects, and verify readability in the existing padded preview.
Optimize JPEG size to fit contribution checks without degrading the scene.

Review website screenshots separately: verify rendered sans-serif fonts and
fetch a fresh GitHub API profile response instead of capturing fallback bio.
It is acceptable to pause site animations or stub the external resume iframe
for a stable review image; disclose those capture adjustments in the PR.
Do not change production bio logic to manufacture a screenshot.

## Dependency footprint and runtime/source separation

Preserve the existing root Next/React/package-lock graph. The game must not
cause the home page or arcade list to download or initialize its 3D engine.
Do not import the renderer through website components; the iframe is the
runtime boundary and exists only after Play. Initial arcade network activity
may include the screenshot and normal website bundles, but no game modules.

For the proposed Three.js renderer, the eventual plan should choose and pin a
specific compatible release, vendor only the required browser runtime files,
retain its license, record provenance/integrity and included upstream paths,
and use local relative imports. Do not depend on runtime CDNs, remote import
maps, `npm` paths, or internet fetches for gameplay assets. Include a clear
third-party inventory for engine, factual datasets, and all other dependencies.
Review redistribution terms and preserve notices before committing them.

Keep browser-safe code, content, vendor runtime, generated original assets,
and entry HTML in the exportable game directory alongside its AGENTS and
`plan/` documentation. The parent `games/README.md` is the arcade/catalog guide;
these Markdown/research files are copied but never requested by the runtime. Do not put `node_modules`,
test fixtures, build caches, tooling packages, unlicensed source dumps, or
private credentials there: the current exporter copies the entire `games/`
tree, even when Git ignores those files. PLAN.md selects repository-relative
`tools/pokemon-dungeon/` for authoring package/lockfile, lint/type/schema configs,
preparation scripts, installed dependencies and caches. Keep the direct-browser
ES-module runtime in `games/pokemon-dungeon-reimagined/`; write only reviewed
runtime outputs and project documentation there. No exporter redesign is required for this split.

Use the dedicated tooling package and pinned lockfile with reproducible commands. Website lint/type exclusions are deliberate
and remain in force; add explicit game lint/type/syntax commands in its own
quality plan rather than expanding website tests to the game. Document the
resolved runtime payload size, vendor size, number of startup requests, and
expected browser memory budget when those artifacts exist. The current
1,024 KiB pre-push file bound may require a modular runtime distribution or a
separately reviewed repository policy; do not waive it casually or add a
large dependency before its footprint is understood.

The [parent plan, section 8](PLAN.md) owns the proposed performance and asset
budgets. They are targets, not measured results or existing artifacts:

| Proposed budget | Limit | Integration implication |
| --- | --- | --- |
| First interactive scene encoded transfer | At most 8 MiB | Defer unrelated roster, world, and dungeon assets until needed. |
| Active scene encoded assets | At most 24 MiB | Reuse assets and quality profiles; encoded size is not decoded GPU/RAM use. |
| Entire published game | At most 300 MiB | Inventory the whole runtime and keep the entire Pages site within reviewed host constraints. |
| Existing added-file hook | At most 1,024 KiB per file | Optimize or partition assets/vendor files; preserve `--maxkb=1024`. |

Do not replace these with separate appendix targets. Record actual measurements
at P34/P35 and carry them into P36/P37 release evidence; seek review before
changing a proposed budget. No engine bundle or assets are installed in P00.

## Future loading, failures, caching, and browser lifecycle

These are planned tasks, not existing guarantees of the current iframe player.
The current player creates/focuses an iframe and provides Back; it does not
yet offer a runtime handshake, an explicit load-timeout state, or game asset
failure reporting. A frame `load` event alone cannot prove the game initialized,
and an iframe displaying an HTML 404 can still emit `load`.

- Define a small optional same-origin readiness/error message contract if the
  delivered runtime needs it. Scope it to the active frame/window and expected
  origin, reject unrelated messages, and keep game-internal diagnostics out of
  the player-facing site UI. Website tests can emit fixture messages without
  executing game source.
- Decide whether loading/failure status belongs inside the game, the website
  player, or both. Keep Back usable throughout; make Retry a deliberate action
  and preserve focus when it rebuilds the frame. Represent loading/error text
  accessibly and avoid indefinite spinners without a recoverable action.
- Handle missing modules/data, malformed asset responses, WebGL unavailable,
  context loss, and denied/unavailable audio initialization as runtime failure
  cases in the eventual game design. Do not add source tests to simulate them;
  use static review and approved manual review, while website status behavior
  is verified with inert fixtures.
- Keep runtime startup modest: load essential UI/engine/content first and
  defer dungeon-specific assets until needed. Do not fetch game resources from
  the home page, placeholder cards, hover, or keyboard focus. Freeze/pause
  simulation/audio appropriately when hidden, and release renderer/audio/event
  listeners when the iframe is destroyed by Back.
- Use versioned or content-hashed bulky assets when a build step exists; keep
  the public entry-point path stable. Coordinate cache keys/content manifests
  so new HTML cannot import an incompatible cached data/renderer version.
  Avoid a service worker in the initial plan unless offline behavior has a
  separately reviewed invalidation/update design. GitHub Pages hosting does
  not grant application control over arbitrary HTTP cache headers.
- Keep save schema versioning independent of asset versions. Review migration,
  unavailable/quota-limited storage, recovery, and cross-build compatibility in
  the game persistence plan; do not couple save handling to website Zustand.
- Account for Mobile Safari/Chrome viewport changes, orientation, focus/touch
  behavior, muted audio until user gesture, and a usable non-fullscreen frame.
  Avoid relying on autoplay permission as proof that browser audio is unlocked.

## Release gates after reviewed implementation

This checklist expands P36/P37; it does not authorize their execution or
supersede PLAN's dependencies. Steps 1–3 and the integration/export assertions
in steps 4/6 feed P36; contribution/CI/review/publication steps 4–10 feed P37.
The current work ends at P00 review with all public placeholders unchanged.

1. Confirm plan approval and mark explicitly delivered versus deferred game
   scope before enabling the card. Confirm content/assets/provenance inventories
   and quality commands are complete. No unfinished game is presented as an
   exact complete recreation of the original Blue Rescue Team.
2. Inspect the actual runtime/export tree, entry paths, local imports, licenses,
   and browser-safe module extensions. Run agreed syntax/lint/type checks
   without adding or executing game-source tests.
3. Produce the authorized real-game screenshot and verify its truthful card
   preview; verify relevant manual browser observations separately from tests.
4. Run `npm run flight-check` after all website/config/asset changes. This
   cleans, lints, builds, and runs the complete website suite. Make sure routes
   intercept real game entry requests before invoking it.
5. Run contribution checks: `pre-commit run --all-files` and
   `pre-commit run --all-files --hook-stage pre-push`. Verify no generated
   dependency/build trees or oversized unreviewed vendor files enter the diff.
6. Inspect the final diff and static output; verify `out/arcade/index.html`,
   `out/games/pokemon-dungeon-reimagined/index.html`, screenshot, and local
   module/data assets. Record artifact sizes and disclose any deferred behavior.
7. Create/update the PR description around the final resulting behavior and
   actual validation, including staged screenshot adjustments. Leave root
   README unchanged and update AGENTS with final integration requirements.
8. Wait for current-commit PR CI results, including complete-lockfile graph,
   build/lint, contribution jobs, and all website browser projects. Passing
   runs for an earlier commit are insufficient after additional changes.
9. Obtain Codex review against the current revision, resolve actionable
   findings, require a positive current-head completion signal, and rerun checks
   affected by fixes. Do not mark ready while review findings, failing CI, or
   unverified deployment-path issues remain.
10. Keep publishing/merging within user authorization. The current plan-only
    request stops for review before game implementation, activation, deployment,
    or any claim that those future steps are complete.
    Intermediate runtime-package PRs must remain unmerged until P37 full-scope
    acceptance and explicit release approval; disabled-card state cannot gate
    directly accessible exported runtime URLs.

Useful narrow future commands, after a real export and screenshot exist:

```bash
npx eslint src/config/arcade.ts tests/arcade.spec.ts tests/buttons.spec.ts tests/export.spec.ts
npx tsc --noEmit
npx playwright test tests/arcade.spec.ts tests/buttons.spec.ts tests/export.spec.ts --project=chromium
npx playwright test tests/game-export.spec.ts --project=chromium
git diff --check
```

These narrow checks support iteration; they do not replace the full website
flight-check, current-commit CI, contribution checks, and Codex review gate.

## Repository evidence register

The website source links below substantiate existing behavior from the
repository's current HEAD. The final row identifies governing planning
documents, which add requirements rather than runtime behavior. Inspect the
exact revision before implementation; new behavior is governed by PLAN and
must not be inferred from this register.
External game-rule or hosting research is outside this appendix's source scope.

| Fact family | Current repository sources |
| --- | --- |
| Three Coming soon cards and optional entry/preview types | [arcade configuration](../../../src/config/arcade.ts), [arcade types](../../../src/types/arcade.ts) |
| Preview prefix, shared tooltip, enabled/disabled Play | [ArcadeCard](../../../src/components/arcade/ArcadeCard.tsx), [shared Button](../../../src/components/ui/button.tsx) |
| Delayed iframe creation, load focus, Back/remount focus | [ArcadeGames](../../../src/components/arcade/ArcadeGames.tsx) |
| Card width, page padding, preview and iframe dimensions | [arcade page](../../../src/pages/arcade.tsx), [arcade CSS](../../../src/components/arcade/Arcade.module.css) |
| Portal/sprite animation and motion preferences | [portal](../../../src/components/arcade/ArcadePortal.tsx), [sprite](../../../src/components/arcade/PixelBlob.tsx), [sprite CSS](../../../src/components/arcade/PixelBlob.module.css) |
| Base path, static export, image handling, fonts and bio | [site config](../../../src/config/site.ts), [Next config](../../../next.config.mjs), [global CSS](../../../src/styles/globals.css), [GitHub profile](../../../src/components/profile/GitHubProfile.tsx) |
| Runtime directory copy and static preview URL/MIME handling | [game exporter](../../../scripts/export-games.mjs), [preview server](../../../scripts/serve-static-preview.mjs), [root commands](../../../package.json) |
| Website/game tooling boundary | [ESLint config](../../../eslint.config.mjs), [TypeScript config](../../../tsconfig.json), [root AGENTS](../../../AGENTS.md) |
| Existing fixture player, tooltip/layout assertions, export fixtures | [arcade tests](../../../tests/arcade.spec.ts), [button tests](../../../tests/buttons.spec.ts), [export tests](../../../tests/export.spec.ts), [game-copy fixture tests](../../../tests/game-export.spec.ts) |
| Browser matrix and current CI/deploy workflow gates | [Playwright config](../../../playwright.config.ts), [PR tests](../../../.github/workflows/app.test.yml), [Pages deploy](../../../.github/workflows/deploy.yml), [lint workflow](../../../.github/workflows/lint.yml) |
| Hygiene hooks, 1,024 KiB file constraint, output exclusions | [pre-commit config](../../../.pre-commit-config.yaml), [gitignore](../../../.gitignore) |
| Planning hold, future packages, performance targets and authorization | [PLAN](PLAN.md), [game AGENTS](../AGENTS.md) |
