# Unselected Sinister floor cache precursor

This package is authorized by FULL-GAME-GOAL, FULL-GAME-EXECUTION and the
source-closed Sinister cache research. It adds new files only at accepted
`7e415a8142febb110bc55c945c397ac776027663`. It does not select a gameplay policy.
Comparative native source is `pret/pmd-red` at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`. The existing catalog retains its
field-level Blue/Red qualifications; this does not establish Blue binary parity.

## Responsibility and interface

`prepareSinisterFloorCache(input, draw)` requires a bounded exact detached input:

- `owner`: actual `sessionId`, generated `mapId`, actual `floorId`, the actual
  `generationTransactionId`, and its `createdRevision`. The caller must prove
  these against its real generation transaction; scalar spelling is not admission.
- `source`: exact generated commit, qualification, native source pins and qualified
  catalog pins. These identify audited facts, not newly computed source history.
- `rows`: the actual complete ordered native/catalog rows for this floor,
  including Kecleon90 and internal Decoy1. No positive-weight filter is permitted.
- `random`: the actual caller-owned prospective browser Dungeon draw stream.
- `draw`: explicitly supplied `escortDungeonRandomInteger`; no implicit stream,
  seed, fallback sampler, modulo/rejection mapping or historical draw repair.

The helper returns detached immutable prepared rows, natural stats, complete
ordered duplicate-preserving candidates, four move facts (null for MOVE_NOTHING),
full base PP, source metadata, owner and preparation before/after stream receipts.
The first four candidates fill slots without drawing. Every later candidate
consumes exactly one cap4 draw and replaces the sampled slot. Decoy has an empty
dummy learnset and pre-cache Blowback368/PP17 fallback, without a draw. That
fallback must not be reused for native cache misses, which have a distinct rule.
Returned rows are the nonzero pre-cache prefix. This helper does not allocate
the64 native cache entries/sentinel tail or compute deterministic EXP rankings.

Native cache13 order is Ekans, Gengar, Medicham, Kecleon, Decoy. Fixed actor
allocation order is Medicham, Gengar, Ekans. Cache order does not direct allocation.
8F and9F share one catalog pool, but each actual new floor requires its own cache
generation owner. The prepared rows do not allocate actors or mutable PP slots.

Native `sub_806AED8` scans cached rows until species0, matching
`SpeciesId(cachedSpecies)` and requested level. A hit spends **no move RNG**,
copies chosen move IDs/natural stats and initializes independently mutable move
objects with full native PP, enabled/exists flags, zero ginseng/flags2 and cleared
struggle flags. A miss appends at the first free row; a full64 cache samples an
uncached result. Neither miss path applies the pre-cache Blowback fallback.

`run_dungeon.c:240–346` resets floor-loop spawn ownership and reconstructs the
cache before `GenerateFloor`. A fresh floor/new expedition invalidates the prior
browser generation. The native `r6` quicksave restore path also reaches that
cache construction; the inspected dungeon serializer restores actual actors and
moves but does not serialize the cache array. This is not proof of exact reboot
or global RNG history, persisted native cache identity, or Blue suspend parity.
The future browser successor must authenticate a real prospective generation,
reuse its admitted chosen rows for spawns, and avoid rerolling during canonical
validation or deserialization. It must never invent cache/seed history for old
saves. These lifetime/admission responsibilities are not implemented here.

One native DungeonRandInt maps to one browser xoshiro transition using upper16
scale-to-cap arithmetic. This is an explicit browser adaptation, not native LCG
sequence, preseed, shared-global-stream or Blue parity. Preparation only consumes
replacement draws; it neither moves nor skips any current live draw.

## Remaining caller responsibilities

The later successor independently owns actual generation transaction admission,
prospective stream selection/commit, cache lifetime/hit/miss/full capacity, native
SpeciesId matching, general Hidden Power, initial and refreshed AI, sleep,
placement/scan/respawn, empty held-container and distinct full-PP actor slots.
The full cache's empty tail/append capacity and deterministic EXP ranking table
also belong to that later cache lifecycle/consumer owner.
Natural wild metadata is factual preparation, not current actor construction.
No old save is defaulted into a cache and no earlier draw receipt is fabricated.
Route, fixed trio, scripts, effects, save schema and lifecycle remain separate.

## Verification and execution ledger

Owned files: this contract, source exporter, independent parser/source audit,
authored facts and the pure gameplay preparation helper. Package registry,
existing modules and frozen contracts remain unchanged.

D05 and STATE-FOUNDATION override the TDD skill's game execution requirement.
Verification is a source-only red/green parser/data audit, Acorn local-import
inspection, pinned lint, strict JSDoc/no-emit types and actual pinned source bytes.
The helper and native code are never imported, evaluated, compiled or run.
Independent parent review is required before port/publication. Static success
does not establish gameplay, save, visual, device or complete campaign acceptance.

Checkpoint ledger: source/data/AST audit and export equality passed, as did
pinned Node24.19.0/npm12.2.0 lint, strict no-emit types and the115-dependency/
14-predecessor/2-manifest original-save preservation audit. The initial source
audit failed because the new facts file did not yet exist. No game/native code
was imported/evaluated, no native compilation or game tests/browser occurred.
The external checkpoint report records exact immutable SHA/tree/source pins and
commands; parent independent review remains pending before port/publication.
