# Blue opening authoring

This package owns offline inputs and static checks for
[`games/pokemon-dungeon-reimagined/`](../../games/pokemon-dungeon-reimagined/AGENTS.md).
The scope ends after Tiny Woods and Caterpie's rescue; campaign/3D tooling is retired.

## Commands

Use the repository's pinned Node/npm and install here with `npm ci --ignore-scripts`.

| Command | Purpose |
| --- | --- |
| `npm run check` | Lint, strict JSDoc types, facts and reproducible selected exports |
| `npm run lint` | Syntax, lint and local runtime import closure |
| `npm run typecheck` | Strict game-source JSDoc types |
| `npm run blue:export` | Regenerate selected facts, characters, native art, effects and distribution |
| `npm run blue:check` | Compare exports; validate provenance, geometry and budgets |

Checks parse source; they never import/execute game or native modules or automate
play. Manual browser/audio observations and website inert-fixture tests are separate.

## Ownership

| Path | Responsibility |
| --- | --- |
| `content/blue-source.json` | Selected records and retired donor hashes; full hero growth/learnsets support retries |
| `content/blue-onboarding/` | Algorithm, questions, results, partners and source ledger; four playable exports |
| `content/blue-wild-spawns.json`, `blue-secondary-gates.json`, `rule-runtime/` | Independent rule evidence |
| `art/blue/` | Pinned image/data archives, reconstruction and pixel proofs |
| `art/pixel/raster.mjs` | Shared offline raster writer |
| `audio/` | Authored effects and qualified source-derived PSG/PCM records |
| `scripts/` | Exporters and static admission checks |
| `reference/` | Source decisions, implementation boundaries and fidelity gaps |
| `.work/` | Ignored historical packets and previews; not a CI/runtime dependency |

Preserve URLs, hashes, attribution and uncertainty. Red evidence needs Blue
corroboration. Public artwork is not a reuse license; include no ROM.
Background music is intentionally absent. Keep the 3 MiB distribution cap,
per-image limits and 4 MiB decoded battle-effect bound.

Do not clear browser saves during cleanup. Retired code is recoverable at
`882cdd14c25b7d79445a637f3dcd97d2c92f0c35`; the
[pruning record](../../games/pokemon-dungeon-reimagined/plan/BLUE-PRUNING.md)
distinguishes tracked history from machine-local Trash ledgers.
