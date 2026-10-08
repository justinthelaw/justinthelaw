# Task 1 report — normalized campaign progression catalog

Status: DONE. No files staged and no commit created; awaiting controller index
grant. No child agents, game-source imports/execution, engine/UI/state-schema,
package, bootstrap, existing catalog or shared progress edits.

## Files and interface

- `tools/pokemon-dungeon/content/campaign-runtime/`: eight factual documents,
  shared closed `schema.json`, authoring-only source reference, normalization and
  schema/type authoring scripts, and authoring documentation.
- `tools/pokemon-dungeon/scripts/export-campaign.mjs`: deterministic fixed-resource
  export and `--check`; pins manifest SHA-256 in the integrity module.
- `tools/pokemon-dungeon/scripts/check-campaign.mjs`: independent tools-only Ajv,
  source-reference, nested identity/ordering/coverage and export validation.
- `games/pokemon-dungeon-reimagined/content/campaign/`: ten bounded JSON resources
  (schema, eight factual documents, manifest).
- `content/campaign.js`, `campaign-types.js`, `campaign-integrity.js`: typed immutable
  loader, generated readonly document contracts and pinned manifest hash.
- `plan/CAMPAIGN-CATALOG.md`: exact API, semantics, identity strategy and consumer
  responsibilities. New IDs are documented as campaign-catalog-v1 definitions.

`loadCampaignCatalog(dependencies, {signal}?)` requires reviewed-catalog membership
adapters for species/forms, dungeons, dungeon/section pairs, fixed rooms, items and
Friend Areas. It fetches only named local resources, bounds streamed bytes below
1 MiB, validates the hard-pinned manifest and resource digests, exact headers,
closed nested schema, all referenced IDs, predicate cycles and sourced counts,
then deeply freezes the records. Cancellation aborts pending work. `dispose()`
clears indexes and makes every getter reject. No predicate evaluator or domain
mutation is supplied.

The returned catalog exposes `getModel`, `getContracts`, `getPredicate`,
`getTransition`, `getTransitionsForHook`, `getRoute`, `getRouteBySourceIndex`,
`getRoutes`, `getReturn`, `getBoss`, `getBosses`, `getRecruitment`,
`getRecruitmentRules`, `getRematch`, `getRematches`, `getIdentity`, `getIdentities`,
`getCallback`, `getSource`, `getEvidence`, `getRemainingCapabilities`, `dispose`,
and explicit false execution/staging/Blue-parity capabilities.

## Coverage and implementation decisions

- 1,011 closed predicates, 586 ordered transitions; exactly six main reward-count
  gates and 21 conjunctive postgame rules.
- 83 distinct native script-dungeon route identities with source procedural and
  rescue namespaces, canonical dungeon/section/variant joins and authored ground
  destination/scene responsibilities.
- 41 referenced return handlers normalized to 488 finite decision records. These
  are factual entry-state conditions and ordered actions, not commercial command
  arrays, labels, PCs or a runtime copy of the 1,483-script research graph. The
  authoring transformation rejects loops/unsupported operations and later reads
  of an already-assigned scenario; read-only callback queries are memoized by the
  future dispatcher. All native route return hooks are present.
- 26 boss dispatches, 18 recruit-flag requirements, 14 rematch presence/level
  records. Current roster ownership is distinct from persistent completion flags.
- Wish/Gengar talk-day progression, map-specific town arbitration, exceptional
  Regi/Jirachi/Celebi/Eon contracts, exact counter/reset/flag lifecycle, return-map
  exceptions, scenario assignment achievements and ambient refresh responsibilities.
- 410 authored identity definitions, 20 mandatory callback responsibilities,
  64 pinned original Red source fingerprints. Every runtime JSON is under 1 MiB;
  the largest is the schema, approximately 403 KiB.

The six reward thresholds are 2/3/2/3/4/2. Each eligible reward increments once
(after reward creation succeeds), not each day/outing. MAIN pair changes reset
CLEAR_COUNT, same-pair assignments preserve it, and the explicit initialization
hook resets it. Gengar requires Stormy Sea completion AND Medicham rescue.
Inventory scopes and current-owned-species checks remain explicit predicates.

Source spot-checks corrected research-summary extraction/normalization mistakes:

1. Native route0 is TINY_WOODS, not SCRIPT_DUNGEON_COUNT.
2. Square's Buried population is selected before EVENT_LOCAL is cleared. That
   population alone does not retain the Munchlax suppression bit; composed groups
   after the reset do. Early Square branches also retain their main-stage guard.
3. Freeze escort failure preserves its current step; Murky attempts raise the
   state to54,4 before outcome routing. No invented Freeze attempt increment.
4. Regi setup writes pending flags and clears both scopes through Unset;
   corresponding-Part pickup writes persistent state. Jirachi faint writes
   CUTSCENE_FLAG_JIRACHI_COMPLETE pending, not an invented Wish-Cave flag.
5. Raw menu opcodes3/4/6/7 are separate from callback IDs invoked through opcode59.
   Callback11 is a read-only CountJobsinDungeon query for the underlying route.
6. Ground previous-map and array-derived scalar projections now identify exact
   source variables/array indexes/reductions, not a collapsed namespace.

Native script76/procedural96 remains an explicitly excluded source slot with a
bounded exchange capability. It is not silently promoted into an invented extra
Blue Dojo maze. Script77 joins the reviewed Rescue Team Maze, and wrapper81 uses
DUNGEON_ENTER_INDEX while wrappers80/82 remain separate.

## Validation

Passed on the final owned files:

```text
node tools/pokemon-dungeon/scripts/export-campaign.mjs --check
Campaign export verified: 10 bounded resources; no game execution.

node tools/pokemon-dungeon/scripts/check-campaign.mjs
Campaign facts checked: 1011 closed predicates, 586 ordered transitions,
6 job gates, 21 unlock rules, 83 routes, 26 boss dispatches and 18 recruitment
flags. Nested Ajv schemas, source references, hashes and catalog joins verified.

Scoped ESLint using tools/pokemon-dungeon/eslint.config.mjs:
5 authored JavaScript/tool files passed.

Scoped TypeScript createProgram (allowJs/checkJs/strict/noEmit,
ES2022 + DOM, bundler resolution):
3 campaign JavaScript files passed; parsed only, no execution.

git diff --check: passed.
Owned new files independently checked for final newline/trailing whitespace.
```

The general check-types/check-source commands were attempted during concurrent
work. They reported unrelated current edits in domain generation/state and roster
art (generation RandomWords typing, TurnContinuation fields, unused generation/
art bindings). The campaign-only checks passed after fixing its own globalThis
crypto lint reference. No unrelated files were changed to suppress those results.
The controller should rerun the full package after sibling work settles. Root
flight-check and contribution/package wiring remain controller integration work.

## Consumer boundaries

Later owners must supply transactional campaign mutation, once-only grants/day
acknowledgments, authored dialogue/staging, required recruitment/inventory/job/
entry/menu callbacks, town RNG and population application, expedition settlement,
and source-ground-map adjustment. Missing callbacks block the affected operation;
there is no generic success or unlock-all fallback. Existing entry/reset/floor
catalogs remain authoritative and were not reimplemented.

Blue displayed labels, approved D04 exchange adapters and fresh authored scene
presentation remain bounded capability work. The catalog does not claim a
playable campaign, instruction-level Blue parity, a completed main/postgame
playthrough, visual acceptance, or any full-game completion gate.
