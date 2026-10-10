# Justin's arcade

## Current games

| Slot | Game | Scope |
| --- | --- | --- |
| First | Pokémon Mystery Dungeon: Blue Rescue Team | Original DS opening through Tiny Woods and Caterpie's rescue; browser adaptation in development on PR #397 |
| Second | Coming soon | Unnamed; no game announced |
| Third | Coming soon | Unnamed; no game announced |

- Play opens a viewport-filling same-origin iframe; Back to games restores
  focus to the card's Play button.
- The latest 2026-10-10 instruction replaces the historical 3D/full-campaign
  target. Follow [the opening plan](pokemon-dungeon-reimagined/plan/BLUE-OPENING.md).
- The new runtime uses two 256 × 192 Canvas 2D screens, an isolated save journal,
  local native Rescue Team images/UI, an authored score, source-derived menu
  effects and sourced game rules.
- Exact audiovisual, script and cartridge-behavior parity remains unverified.
  Selected pixel comparisons and static checks do not establish exact replication.
- PR #392 and the #396 startup repair were previously merged. PR #397 remains
  a development branch; this task authorizes commits, not merge or deployment.

## Player controls

| Action | Keyboard |
| --- | --- |
| Move | Arrow keys; two arrows or numpad for diagonals |
| Confirm / regular attack | Z or A |
| Cancel / menu | X or B; Enter or Escape also opens the menu |
| Run | Hold X/B with a direction |
| Face without moving | Hold C/Y with a direction |
| Map | Shift |
| Wait | Space, or A+B |
| Set move | Q + Z/A |
| Diagonal-only movement | Hold R with directions |

- The website's touch overlay sends standard keyboard events to the iframe.
- The direct game also has optional touch controls with 44px minimum targets.
- Interrupted, cancelled and released controls cannot continue taking turns.
- Name fields explicitly opt into overlay confirmation; typing remains protected.

## Static game distribution

- Browser resources live in `games/<game-id>/` and use local relative URLs.
- `npm run build` exports the website, then runs `scripts/export-games.mjs`.
- Games with `distribution.json` export only the declared local files. Games
  without a manifest retain complete-directory copying.
- Blue's distribution is generated from its actual module closure and scoped
  resources by `tools/pokemon-dungeon/scripts/export-blue-distribution.mjs`.
- Retained historical campaign source, art studies, vendor files and plans are
  not part of the selected opening distribution.
- Authoring tools, dependencies, caches and captured review evidence stay in
  `tools/pokemon-dungeon/`, outside the game's exported resources.
- Older campaign saves are left untouched. The opening uses a distinct key and
  alternating verified checkpoints; no automatic migration or reset occurs.

## Validation

- Game checks parse, lint, type-check and inspect factual/asset resources without
  importing or executing game source. D05 prohibits automated playthroughs.
- User-directed manual browser gameplay and visual inspection are separate
  evidence and must be recorded accurately.
- Website integration tests intercept game responses with inert fixtures before
  navigation. Export tests copy temporary fixture trees without running a game.
- Run the independent authoring checks, website flight check, contribution hooks,
  and applicable exact-commit CI. Report environment blockers rather than
  weakening tests or bypassing package security policy.

## Repository references

| Reference | Purpose |
| --- | --- |
| [Opening plan](pokemon-dungeon-reimagined/plan/BLUE-OPENING.md) | Current scope, authority and acceptance |
| [Progress](pokemon-dungeon-reimagined/plan/PROGRESS.md) | Implementation and verification evidence |
| [Arcade configuration](../src/config/arcade.ts) | Card, preview and game entry point |
| [Player](../src/components/arcade/GamePlayer.tsx) | Iframe, touch controls and focus restoration |
| [Exporter](../scripts/export-games.mjs) | Safe scoped static distribution |
| [Website fixtures](../tests/game-controls.spec.ts) | Input integration without game execution |
