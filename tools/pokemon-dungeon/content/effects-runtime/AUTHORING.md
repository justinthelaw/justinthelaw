# Qualified original effect facts

This authoring package covers the complete original move identity set and the
internal action/item tables. It contains independently normalized factual
operations, not commercial descriptions, copied source implementations, or game
assets. The browser catalog is a factual service; domain effect execution is a
separate responsibility.

## Inputs and authority

The `research-*.json` files preserve the complete supplied research corpus by
section. `research-manifest.json` binds their bytes to SHA-256 and records pinned
original Red and Blue-reported metadata revisions. `research-sourceArtifacts`
records upstream cache hashes and URLs. `research-evidencePolicy` and
`research-conflicts` retain evidence qualifications and source disagreements.
Original Red comparative facts are usable with that label. No instruction-level
Blue parity certification follows from identity coverage or source tracing.

Move canonical IDs are joined to the accepted species learnset identities and
system move inventory. Items preserve the dungeon catalog's 202 canonical item
IDs; the other 38 internal rows derive stable IDs from source symbols. Those rows
include sentinels, unused objects and event rewards; membership never implies
normal-play availability. Species parameters join the existing internal profile
crosswalk, preserving null species/form for internal-only bodies.

## Reproducible workflow

1. Supply the complete independently researched JSON to `normalize.py <path>`.
2. Run `npm run effects:export` from `tools/pokemon-dungeon`.
3. Run `npm run effects:check`, then the complete `npm run check`.

The normalizer also accepts a research manifest path from this directory, so the
checked-in research sections can regenerate the normalized authoring tables.
The normalizer uses no game modules. It preserves factual `source` fields such as
move-copy recipients; only research locator/evidence detail moves out of runtime
records. Closed schemas discriminate operation names and reject extra keys.
Generated JSDoc types, resource hashes and exports derive deterministically from
the normalized source. Delete stale chunks explicitly after changing boundaries;
the export checker refuses unexpected runtime files.

## Runtime boundary

All JSON resources are below 1 MiB; chunks target 400,000 bytes. Numeric source
integers retain exact values. Decimal fixed-point macro arguments are represented
as `fixed-point-source-literal` with the decimal spelling and a null converted
value, preventing the source decimal from being mistaken for an already-converted
24.8/48.16 value. Rational effect parameters retain their explicit denominators.

`sourceQualification` labels every row. Known numeric conflicts preserve selected
values and the complete conflicting evidence in authoring. Nested common rules,
guards, command consumption ordering, revival/reset state, calling moves, shop
ownership, TM payloads and context-specific item paths remain structured facts.
Strings describe audited predicates; no code evaluates these strings.

Factual support does not advertise an implemented gameplay handler. Seven internal
actions intentionally have no factual effect operation, and two reward-excluded
orb rows map to internal actions whose effect arrays remain empty. The validator preserves these exceptions and
rejects missing operation facts for every original move. Family-specific unresolved
subfields remain visible; no generic damage/heal fallback fills them.

## Reviewed completeness requirements

`contract-requirements.json` is an independently reviewed structural baseline,
not generated output. It discriminates every named contract by ID and requires
its nested fields and array lengths. Updating research input cannot weaken this
baseline: the checker compares schema equality and complete nested research
parity, and checks rejection of missing/empty required contract facts. Update the
baseline only as an explicit reviewed contract change.

`research-iqDamageTables-01.json` contains the qualified pinned Red Return and
Frustration threshold/damage facts. Parameter references resolve those tables;
source sentinels are separate from the 11 ordered comparison rows. The source
artifact URL/hash is joined to the original provenance manifest.

## T01 execution provenance (2026-10-07)

The independent recipient owner in game `src/domain/gameplay/item-effects.js`
uses the finite early item cases documented in `plan/FRIEND-AREAS.md`. Fresh
connector reads at Red pin `6bcbec4f906938c0243aa2026bcbd41b577bab85` verified
`dungeon_item_action.c` catch/sticky/Belly/Blast, `dungeon_logic.c` represented
condition/role guards, `dungeon_misc.c` front targeting, and
`move_orb_effects_1/2/5.c` sleep/resources/wake. Existing effects resources and
integrity pins remain byte-identical. This is comparative source traceability;
Blue instruction parity, full item availability, straight throw/Item Master,
wider named effect consumers and gameplay acceptance remain separate gates.
