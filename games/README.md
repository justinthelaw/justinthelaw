# Justin's arcade

- The arcade has vertically stacked cards with a preview, short description,
  and Play button.
- Play opens a page-filling modal with a same-site iframe; Back to games
  restores focus to the mounted Play button.

## Current games

- No complete accepted game is released.
- The first card opens the development checkpoint. PR #392 implements the
  opening through town services, ordinary jobs and the Mt. Steel rescue; full campaign and human acceptance
  remain open. See its progress ledger for the published checkpoint.
- The other two cards retain animated pixel previews and disabled Play buttons.

| Slot | Current card | Planned work |
| --- | --- | --- |
| First | Pokemon Mystery Dungeon Blue Rescue Team - Reimagined; P06 art-study picture | [Development plan](pokemon-dungeon-reimagined/plan/PLAN.md): bounded opening, town services and ordinary jobs and Mt. Steel through MAIN(5,0) on PR #392; [progress and verification](pokemon-dungeon-reimagined/plan/PROGRESS.md); full campaign and gameplay/visual acceptance pending |
| Second | Coming soon, lavender preview | Unnamed; no game announced |
| Third | Coming soon, apricot preview | Unnamed; no game announced |

## Pokémon Dungeon decisions

- Baseline: original **Blue Rescue Team**; Red is comparative research only,
  with no Red campaign or edition selector.
- On **2026-10-04**, the user approved all recommendations except the design
  recommendation, selecting **B**; later that day they authorized implementation.
- On **2026-10-05**, the user authorized this development launcher in a new PR,
  autonomous implementation and skipping external Codex review.
- Package evidence, visual reviews and full-game release acceptance remain open;
  the launcher PR #391 is merged; full-game PR #392 remains unmerged.

| Decision | Approved choice |
| --- | --- |
| D03 | Directional pixel characters in textured real 3D spaces; supersedes the historical cel-shaded candidate selection |
| D04 | Browser rescue codes/files and Blue extra-mode/event equivalents; original cartridge interoperability is not a completion gate; claim it only where sourced and verified |
| D05 | Human play and visual review allowed; no automated game-source tests |
| D06 | No separate Groudon practice; retain the campaign encounter and campaign capture |
| D08 | JavaScript ES modules, JSDoc, and strict independent static type checks |

- Generated loading illustrations are raster planning assets, not 3D models or
  gameplay screenshots; candidate A remains an archived comparison.
- Actual 3D quality review and P36–P37 full-scope acceptance remain required;
  selected loading art does not replace the arcade's real gameplay preview.

## Player controls

- Desktop keyboard input goes to the iframe after it loads.
- Mobile devices show semitransparent controls with targets of at least 44px;
  Show/Hide controls switches the overlay manually.
- The website sends keyboard events; the game must implement their behavior.
  The development game consumes these controls for its bounded opening route.

| Emulator control | Keyboard key |
| --- | --- |
| D-pad | Arrows; diagonals hold two arrows |
| A / B | Z / X |
| Start / Select / Menu | Enter / Shift / Escape |

- Held keys release on cancellation, blur, hidden page, hidden controls,
  frame reload and player disposal.

## Static game layout

- Put a future game's entry HTML and browser resources in `games/<game-id>/`.
- Use local relative URLs for modules, data, models, textures, and audio so
  resources work beneath the GitHub Pages project base path.
- `npm run build` exports the website, then copies the entire `games/` tree to
  `out/games/`; it does not compile game source.
- Keep Pokémon Dungeon authoring packages, dependencies, scripts, and caches in
  repository-relative `tools/pokemon-dungeon/`, outside the copied game tree.
  Git-ignored files inside `games/` would still be copied.
- The development entry point is `games/pokemon-dungeon-reimagined/index.html`;
  the development branch implements the bounded route described above; the full
  campaign is incomplete and has no human acceptance evidence.
- Keep intermediate runtime-package PRs unmerged until P37 full-scope acceptance
  and explicit release approval: main deploys `games/**` at direct URLs even
  when the arcade card is disabled.

## Add a game after approval

1. Complete and review its static runtime, local resources, provenance, and
   game-specific readiness requirements.
2. Capture an actual gameplay preview in `public/arcade/` and update its record
   in [arcade configuration](../src/config/arcade.ts) with title, description,
   `preview`, and `/games/<game-id>/index.html` entry point.
3. Verify preview loading, enabled Play, no preload, prefixed iframe URL,
   keyboard focus, Back, and responsive spacing with website fixtures.
4. Run required static checks, website `npm run flight-check`, contribution
   checks, current-head CI, and applicable review; obtain explicit merge/deployment
   authorization. Pokémon Dungeon's detailed gates are P36–P37 in its plan.

- The website adds its configured base path to local previews and iframe URLs.
- Preserve other cards, fonts, live GitHub bio, shared button sizes/tooltips,
  sprite animations, and page margins when integrating one game.

## Validation boundary

- Do not add tests that import or execute game source, or automated playthroughs.
- Website integration tests replace game responses with inert HTML before
  navigation and keep interception active through Back, reload, and cleanup.
- Export tests may copy temporary fixture trees without running game code.
- Independent game syntax, lint, type, schema, license, and size checks are
  permitted; authoring tools stay outside `games/`.

## Repository references

| Reference | Purpose |
| --- | --- |
| [Arcade page](../src/pages/arcade.tsx) | Route, Home navigation, card configuration, and page padding |
| [Card](../src/components/arcade/ArcadeCard.tsx) / [player](../src/components/arcade/GamePlayer.tsx) / [controls](../src/components/arcade/GameControls.tsx) | Preview, full-page dialog, keyboard/touch bridge and focus restoration |
| [Exporter](../scripts/export-games.mjs) / [preview server](../scripts/serve-static-preview.mjs) | Static directory copying and base-path preview |
| [Arcade tests](../tests/arcade.spec.ts) / [controls fixtures](../tests/game-controls.spec.ts) / [export fixtures](../tests/game-export.spec.ts) | Website behavior and fixture-only checks |
| [Root instructions](../AGENTS.md) / [game instructions](pokemon-dungeon-reimagined/AGENTS.md) | Execution/release gates, quality requirements, and source-test exclusions |
