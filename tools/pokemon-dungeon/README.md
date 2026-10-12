# Blue Rescue Team opening tools

This package authors and statically checks the browser game from its opening
through Tiny Woods and Caterpie's reunion. The runtime lives in
`games/pokemon-dungeon-reimagined/`; later campaign code and 3D tooling are retired.

## Commands

Use the repository's pinned Node 24 and npm versions. Install this isolated
package with `npm ci --ignore-scripts`.

| Command | Purpose |
| --- | --- |
| `npm run check` | Lint, strict game-source types, factual checks and reproducible selected exports |
| `npm run lint` | Static JavaScript syntax, lint and local runtime imports |
| `npm run typecheck` | Strict JSDoc types for the scoped game source |
| `npm run blue:export` | Regenerate character data, opening facts, native art, audio and the distribution manifest |
| `npm run blue:check` | Compare all selected exports and validate their facts, provenance, geometry and budgets |

No check imports or executes game source, runs native game code, or performs an
automated playthrough. Manual browser play and visual/audio review are separate.
Website tests use inert game fixtures.

## Inputs and outputs

- `content/blue-source.json` retains selected factual records for the 16 heroes,
  opening actors, moves and three Tiny Woods floors. Original donor hashes and
  per-record qualifications remain as provenance. Full growth and learnsets are
  retained because failed rescues preserve experience.
- `content/blue-onboarding/` owns the personality algorithm, questions, results,
  partner choices and their source ledger. The four playable documents export
  into the game's `content/onboarding/` directory.
- `content/blue-wild-spawns.json`, `content/blue-secondary-gates.json` and
  `content/rule-runtime/type-matchups.json` retain small independent rule facts.
- `art/blue/` holds pinned native image/data inputs, offline source archives,
  reconstruction tools and pixel evidence. `art/pixel/raster.mjs` is the sole
  shared raster writer. Source attribution does not assert a reuse license.
- `audio/blue-original-effects.json` owns the authored gameplay/UI effects.
  `audio/blue-menu-effects.json` and `audio/blue-battle-effects.json` own the
  source-derived short PSG effects. `audio/blue-pcm-effects.json` owns the selected
  sample/control facts; their offline exporter uses Node
  built-ins. Red PCM is comparative, with global reverb, browser mixing and
  exact Blue playback still qualified. The opening contains no background music.
- `scripts/` contains only the selected exporters and static checkers.
  `reference/blue-*.md` records source decisions and remaining fidelity gaps.
- `.work/` holds ignored review packets, frozen browser builds and release
  evidence. It is not copied into the game or required by CI.

`distribution.json` is the exact runtime module/resource closure. The selected
export stays under 3 MiB; native images and effect banks also have independent
encoded and decoded bounds. All runtime URLs remain local and relative.

## Review and recovery

Read the [current scope](../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md),
[manual/static evidence](../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md)
and [factual validation notes](reference/blue-facts.md). Comparative Red evidence
is qualified unless directly corroborated for Blue. Static checks alone do not
establish exact Nintendo DS behavior, timing, audio or visual identity.

The pre-pruning implementation is recoverable at Git commit
`882cdd14c25b7d79445a637f3dcd97d2c92f0c35`. Retired local files were moved to macOS
Trash with per-file hashes and restore paths recorded in the pruning ledger.
Existing browser saves were neither read for pruning nor deleted.
