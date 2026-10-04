# Justin's arcade

- The arcade has vertically stacked cards with a preview, short description,
  and Play button.
- Play opens an available game in a same-site iframe; Back to games restores
  the cards and Play focus.

## Current games

- No playable games are live.
- All three configured cards remain Coming soon with animated pixel previews
  and disabled Play buttons.

| Slot | Current card | Planned work |
| --- | --- | --- |
| First | Coming soon, blue preview | [Pokémon Dungeon Reimagined](pokemon-dungeon-reimagined/plan/PLAN.md): WIP planning; decisions approved; awaiting separate implementation start; no runnable game or gameplay screenshot |
| Second | Coming soon, lavender preview | Unnamed; no game announced |
| Third | Coming soon, apricot preview | Unnamed; no game announced |

## Pokémon Dungeon decisions

- Baseline: original **Blue Rescue Team**; Red is comparative research only,
  with no Red campaign or edition selector.
- On **2026-10-04**, the user approved all recommendations except the design
  recommendation, selecting **B**; implementation, merge, and deployment remain
  held until their separate authorizations.

| Decision | Approved choice |
| --- | --- |
| D03 | Bold cel-shaded 3D; [candidate B](pokemon-dungeon-reimagined/plan/art-candidates/b-cel-shaded-cavern.webp) is the selected future loading background |
| D04 | Browser rescue codes/files and Blue extra-mode/event equivalents; original cartridge interoperability is not a completion gate; claim it only where sourced and verified |
| D05 | Human play and visual review allowed; no automated game-source tests |
| D06 | No separate Groudon practice; retain the campaign encounter and campaign capture |
| D08 | JavaScript ES modules, JSDoc, and strict independent static type checks |

- Generated loading illustrations are raster planning assets, not 3D models or
  gameplay screenshots; candidate A remains an archived comparison.
- Actual 3D quality review and P36–P37 full-scope acceptance remain required;
  selected loading art does not replace the arcade's real gameplay preview.

## Static game layout

- Put a future game's entry HTML and browser resources in `games/<game-id>/`.
- Use local relative URLs for modules, data, models, textures, and audio so
  resources work beneath the GitHub Pages project base path.
- `npm run build` exports the website, then copies the entire `games/` tree to
  `out/games/`; it does not compile game source.
- Keep Pokémon Dungeon authoring packages, dependencies, scripts, and caches in
  repository-relative `tools/pokemon-dungeon/`, outside the copied game tree.
  Git-ignored files inside `games/` would still be copied.
- The future entry point is `games/pokemon-dungeon-reimagined/index.html`;
  no entry point is included during the planning hold.
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
   checks, current-head CI, and Codex review; obtain explicit merge/deployment
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
| [Card](../src/components/arcade/ArcadeCard.tsx) / [player](../src/components/arcade/ArcadeGames.tsx) | Preview, action tooltips, embedded loading, and focus restoration |
| [Exporter](../scripts/export-games.mjs) / [preview server](../scripts/serve-static-preview.mjs) | Static directory copying and base-path preview |
| [Arcade tests](../tests/arcade.spec.ts) / [export fixtures](../tests/game-export.spec.ts) | Website behavior and fixture-only copy checks |
| [Root instructions](../AGENTS.md) / [game instructions](pokemon-dungeon-reimagined/AGENTS.md) | Planning hold, quality requirements, and source-test exclusions |
