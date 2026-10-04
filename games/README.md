# Justin's arcade

The arcade is a separate page of vertically stacked game cards, each with a
preview, short description, and Play button. Play opens an available game in a
same-site iframe; Back to games returns to the cards and restores Play focus.

## Current games

No playable games are live. All three configured cards remain Coming soon with
animated pixel previews and disabled Play buttons.

| Slot | Current card | Planned work |
| --- | --- | --- |
| First | Coming soon, blue preview | [Pokémon Dungeon Reimagined](pokemon-dungeon-reimagined/plan/PLAN.md): WIP planning, paused for review; no runnable game or screenshot |
| Second | Coming soon, lavender preview | Unnamed; no game announced |
| Third | Coming soon, apricot preview | Unnamed; no game announced |

Pokémon Dungeon Reimagined targets a standalone 3D reimagining of the original
**Blue Rescue Team** adventure; Red is comparative research only, with no Red
campaign or edition selector. Its plan requires explicit
approval before implementation and a separate accepted release gate before
exposing the first card; this planning change does not authorize publication.

Two user-authorized loading-illustration candidates belong under the game's
`plan/art-candidates/` for visual review. They are planning images, not 3D runtime
art or gameplay screenshots, and do not lift the implementation hold.

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

The website adds its configured base path to local previews and iframe URLs.
Keep other cards, fonts, live GitHub bio, shared button sizes/tooltips, sprite
animations, and page margins unchanged when integrating one game.

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
