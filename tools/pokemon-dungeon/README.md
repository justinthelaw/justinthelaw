# Blue Rescue Team opening tools

Authoring and static checks for `games/pokemon-dungeon-reimagined/`, from the
opening through Tiny Woods and Caterpie's reunion. Later campaign/3D tooling
is retired.

## Commands

In this directory, use the repository's pinned Node 24/npm and install with
`npm ci --ignore-scripts`.

| Command | Purpose |
| --- | --- |
| `npm run check` | Lint, strict source types, facts, reproducible selected exports |
| `npm run lint` | Static JS syntax, lint, local runtime imports |
| `npm run typecheck` | Strict game-source JSDoc types |
| `npm run blue:export` | Regenerate characters, opening facts, native art, audio, distribution manifest |
| `npm run blue:check` | Compare exports; validate facts, provenance, geometry, budgets |

Checks never import/execute game source, run native game code, or automate play.
Manual browser/visual/audio review is separate; website tests use inert fixtures.

## Inputs and Outputs

| Path | Contents and constraints |
| --- | --- |
| `content/blue-source.json` | 16 heroes, opening actors/moves, three Tiny Woods floors, donor hashes and qualifications; full growth/learnsets retained because failed rescues preserve experience |
| `content/blue-onboarding/` | Personality algorithm, questions/results, partner choices and source ledger; four playable documents export to game `content/onboarding/` |
| `content/blue-wild-spawns.json`, `content/blue-secondary-gates.json`, `content/rule-runtime/type-matchups.json` | Independent rule facts |
| `art/blue/` | Pinned image/data inputs, offline archives, reconstruction tools, pixel evidence; attribution is not a reuse license |
| `art/pixel/raster.mjs` | Shared raster writer |
| `audio/blue-original-effects.json` | Authored gameplay/UI effects |
| `audio/blue-menu-effects.json`, `audio/blue-battle-effects.json` | Source-derived short PSG effects |
| `audio/blue-pcm-effects.json` | Sample/control facts; offline exporter uses Node built-ins. Red PCM is comparative; global reverb, browser mixing and exact Blue playback remain qualified |
| `scripts/`, `reference/blue-*.md` | Selected exporters/checkers, source decisions, fidelity gaps |
| `.work/` | Ignored packets, frozen builds and review evidence; excluded from runtime and CI requirements |

There is no background music. `distribution.json` defines the exact local,
relative-URL runtime closure, capped at 3 MiB with separate encoded/decoded
native-image and effect-bank bounds.

## Review and Recovery

See the [scope](../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md),
[manual/static evidence](../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md),
and [factual checks](reference/blue-facts.md). Red evidence needs Blue
corroboration; static checks cannot establish exact DS behavior, timing, audio,
or visual identity.

Pre-pruning code: `882cdd14c25b7d79445a637f3dcd97d2c92f0c35`. The pruning ledger
records per-file hashes and macOS Trash restore paths. Pruning neither read nor
deleted existing browser saves.
