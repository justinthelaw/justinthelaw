# Qualified effect catalog

`content/effects.js` exposes immutable factual data for P02/P13-P15. It does not
mutate campaign state, choose random results, simulate status ticks or implement
move/item handlers. Complete factual identity coverage does not make the campaign
playable or certify instruction-level Blue parity.

## Coverage and identity

| Family | Count | Meaning |
| --- | ---: | --- |
| Original moves | 356 | Exact canonical inventory IDs, including Wide Slash and Vacuum-Cut |
| Internal actions | 413 | Contiguous source IDs 0-412; includes sentinels and unused actions |
| Internal items | 240 | Contiguous source IDs 0-239; membership is separate from obtainability |
| Operation families | 266 | Explicit structured factual operations and unresolved subfields |
| Grouped statuses | 66 | Mutually exclusive group/value identities and behavior |
| Auxiliary statuses | 4 | Grudge, Muzzled, Perish Song and Terrified; separate state contracts |
| Timers | 60 | Raw bounds, source callers/adjustments and explicit tick-hook evidence |
| Target geometries/categories | 10 / 8 | Original range and relation codes |
| Common rules/guards | 18 / 12 | Ordered impact/use/throw gates and scoped immunities |
| Body/terrain facts | 424 / 4 | Internal body crosswalk and 76-entry tileset tables |
| Numeric parameter records | 208 | Exact integers and explicitly unconverted fixed-point literals |
| Context/lifecycle contracts | 22 | Calling moves, revival, transfer, items, shops and timing corrections |
| Availability routes/treasures | 178 / 20 | Pool contexts and duplicate-aware fixed treasure definitions |
| Source conflicts | 22 | Selected facts and conflicting reports, with full authoring provenance |

Seventy-two deduplicated auxiliary operation records index floor/weather/terrain,
trap, Belly and related operations independently from grouped actor statuses.
They describe facts, not handler implementation coverage.

## API

Call `loadEffectCatalog({isMoveId,isItemId,isSpeciesForm,fetchResource?,signal?})`.
All three membership callbacks are required. The item membership service must
recognize all 240 explicit identities; it must not use an obtainability predicate.
`fetchResource` defaults to native fetch and receives only local relative resource
URLs plus the cancellation signal.

| Method | Argument | Result |
| --- | --- | --- |
| `getMove` | Canonical move ID | Typed move with canonical `id` and internal `actionId` |
| `getAction` | Internal integer 0-412 | Full typed action; nullable canonical `moveId` |
| `getItem` / `getItemByInternalId` | Canonical item ID / integer 0-239 | Use, held, throw, consumption and availability facts |
| `getStatus` / `getAuxiliaryStatus` | Status ID | Grouped / independent condition contract |
| `getTimer` / `getFamily` | Timer ID / `family-NNN` | Timer or operation-family fact |
| `getGeometry` / `getCategory` | `geometry-N` / `category-N` | Range/target relation facts |
| `getRule` / `getGuard` / `getContract` | Exact named ID | Structured scoped facts |
| `getTerrain` / `getSpeciesParameters` | Table name / `body-NNN` | Terrain or internal species/body parameters |
| `getParameter` | Original numeric symbol | Exact integer/array or unconverted literal |
| `getAvailabilityRoute` / `getTreasure` | `pool-NNN` / `treasure-NNN` | Route evidence / fixed treasure |
| `getConflict` / `getAuxiliaryEffect` | Listed record ID | Selected disagreement / deduplicated operation |
| `getFact` | Family, record ID | Generic immutable factual record |
| `dispose` | None | Abort reads and invalidate every accessor |

`ids` exposes frozen ordered identity arrays for every family. All returned
records, nested arrays, views and capability objects are recursively immutable.
Unknown IDs reject; absent facts never fall back to another move or generic
operation. Cancellation before/during loading rejects and aborts sibling reads;
cancellation after loading invalidates accessors. Disposal is idempotent.

`capabilities` distinguishes supported factual catalog access and qualified
original rules from `blueInstructionParity: false` and
`domainHandlersImplemented: false`. These latter flags do not disable access to
independently supported original comparative facts. A domain consumer must check
its own handler coverage and the particular unresolved field it needs.

## Validation and provenance

A generated SHA-256 anchor binds the exact manifest bytes. The manifest binds
schemas, exact ordered keys, counts and every bounded local JSON resource. The
loader verifies bytes before parsing, exact headers, closed operation and contract-ID-discriminated schemas,
foreign keys, move/action joins and required external identity membership. Its
stream reader rejects a resource reaching 1 MiB.

The independent authoring validator uses JSON Schema, exact original move
membership, contiguous internal identities, source numeric/effect/branch parity,
operation references, timers, probabilities, rational denominators, complete nested
contract-to-research parity, fixed contract requirements, species/form
joins, research hashes and deterministic export equality. It imports only
authoring scripts, never game modules. Generated runtime files and JSDoc types
must match exports byte-for-byte. `npm run check` includes `effects:check`.

Full source URLs, pinned revisions, hashes, disagreements and source explanations
remain under `tools/pokemon-dungeon/content/effects-runtime/`. Runtime factual
strings are declarative predicates and descriptions; no interpreter executes
research text as code.

## Consumer obligations and remaining subfields

The selected original Red comparative rules are labeled throughout. Blue binary
parity remains separately unverified. Authoring evidence identifies six numeric
corrections across five moves and preserves all 22 source disagreements.

Seven internal actions have empty operation arrays: Watching 356, placeholders
358/359/404/411, Possess 402 and Item Toss 408. These are not original learned move
gaps. Reward-excluded orb rows 216/220 map to actions 402/408, whose effect arrays remain empty. Disabled shop
contexts for Excavate/Spin Slash remain explicitly zero-chance; internal pool
references do not make them available. Figures retain event-delivery paths,
conversion items retain origin payloads, and fixed treasure duplication remains
separate from random rewards.

Specific unresolved family subfields include forced-movement collision and fixed
room boundaries, Rest expiry sequencing, remaining cure-helper edge fields,
item-removal guard details, explosion interruption order, terrain status removal,
Pay Day eligibility/amount, wall eligibility, Transform helper details, Transfer
version-specific pool joins, Nature Power callback distinctions, role-change side
effects, Sketch expedition retention, Baton Pass copied fields, item-gathering
shop/terrain edges, and random-warp distribution. Exact entries remain on each
family record; some older notes overlap newer scoped contracts, so consumers
must resolve the named field using its newer contract rather than infer a broad
unsupported-system flag.

Timers belong to named scheduler hooks: Perish Song, Bide and Enraged decrement at
actor end; Muzzled/Terrified and most group timers decrement at actor beginning;
Mud/Water Sport use the weather hook. These are not global player turns. Reviver
Seed applies the explicit reset and PP-refill sequence before permanent faint;
Grudge triggers only after revival fails. Hidden Power, Transfer and calling move
contracts retain their own lifecycle and selection distributions.

The independently reviewed `contract-requirements.json` is a persistent structural
baseline for all 22 named contracts. Normalization does not infer or weaken these
requirements from new input. Each contract ID selects its own required nested
facts and nonempty sequences/tables; generated Contract types preserve that ID
union. The static gate also compares every complete contract with its pinned
research section and probes rejection of emptied facts, missing required fields
and empty required top-level sequences.

Return and Frustration expose qualified `gReturnDmgData` and
`gFrustrationDmgData` parameter records: 11 ordered strict-upper-bound rows, a
separate end sentinel and the source fallback. Their `amount.parameterRef` is
validated against parameter membership. Reviver Seed's `revival-state-contract`
uses canonical `contractRef: "reviver-seed"`; generic unnormalized string `ref`
and `table` fields reject in both static and runtime relationship checks.
