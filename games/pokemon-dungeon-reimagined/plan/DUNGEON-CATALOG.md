# Dungeon catalog: complete factual floor/distribution profiles

This bounded P02/P11 data package supplies immutable local lookup data for all
45 original field dungeons and 22 original Dojo mazes. It does not implement dungeon
generation, campaign progression, item effects, fixed geometry, recruitment or
playable content. Loading facts is not P02/P11/P31 or gameplay acceptance.

## Coverage

| Family | Exact coverage |
| --- | --- |
| Canonical identities | 45 field dungeons + 22 Dojo mazes, 73 sections |
| Primary numbered floors | 1,427 field exploration/boss floors + 66 maze floors |
| Separate scene | Mt. Freeze Ninetales summit; excluded from 19 exploration floors |
| Explicit variant records | Four Mt. Freeze alternate-visit floor profiles |
| Source floor provenance | All 1,767 rows: 1,497 numbered/variant records + 1 scene + 269 excluded rows |
| Generation | 1,764 profiles, each with all 28 numeric parameters |
| Encounters | All 839 source pools; 5,632 ordered rows including 1,818 zero-weight level lookups |
| Items | All 178 source pools preserved through 133 distinct numerical distributions |
| Traps | All 148 source pools preserved through 142 distinct numerical distributions |
| Item/category/trap identities | 202 item keys, 10 category keys, 20 trap keys |
| Restrictions | 98 source rule profiles, including explicit converter Boolean defaults |
| Fixed-room identities | 140 records; sentinel, boss/rescue, maze, 17 embedded rewards, unused |

All files are below 1,024 KiB. Authoring facts, source hashes and exact normalized
comparison evidence live in `tools/pokemon-dungeon/content/dungeon-runtime/`.
The deterministic export has 25 local JSON resources in `content/dungeons/`.
A generated manifest fingerprint binds the index, which binds the schema and
every shard. The loader verifies SHA-256 over bounded raw bytes before UTF-8
decoding or parsing; redirects and mixed/stale exports reject loading.
Stable dungeon, section, floor and item IDs do not reuse source pointer ordinals.
Content-based distribution keys retain every source index in a separate crosswalk.

## API and membership boundary

`content/dungeons.js` exports `loadDungeonCatalog(dependencies)`. It accepts:

| Dependency | Contract |
| --- | --- |
| `isSpeciesForm(speciesId, formId)` | Required Boolean membership validator for canonical `pokemon-NNN` / exact form IDs; e.g. `pokemon-201` + `unown-a` |
| `isItemId(itemId)` | Required Boolean membership validator for independently defined `item-*` keys |
| `fetchResource` | Optional fetch-compatible transport; default browser fetch; URLs remain exact local resources |

These validators verify cross-catalog identities. They do not attest implemented
item effects or recruitment behavior. The loader also validates its own item
identity table, every internal foreign key, exact headers/family coverage, numeric
bounds, ordered probabilities, section relations and local/cumulative floor
coverage. Dungeon child lists have complete, unique ownership, with every child
pointing back to its parent. Generation/fixed-room and restriction/source-index
joins apply to numbered floors, scenes and excluded source profiles. Unknown references reject construction. All returned records, nested
arrays and metadata are frozen; lookup maps remain private.

| Catalog method | Lookup contract |
| --- | --- |
| `getDungeon(id)` | Canonical field/Dojo identity and section/scene IDs |
| `getSection(id)` | Exact parent and ordered explicit source variants |
| `getFloor(sectionId, localFloor, variantId)` | Positive integer section-local floor; variant is mandatory |
| `getFloorById(id)` | Stable exact floor identity, without implicit campaign selection |
| `getScene(id)` | Separate terminal story scene profile |
| `getGeneration(id)` | All 28 raw parameters, layout family, decoded room flags |
| `getEncounterPool(id)` | Ordered canonical species/form or internal Decoy rows |
| `getItemPool(id)` | Two-stage category/conditional item weights |
| `getTrapPool(id)` | Ordered trap identities/weights |
| `getDistribution(kind, id)` | Kind must be `encounters`, `items` or `traps` |
| `getFixedRoom(id)` | Identity, dimensions, classification and geometry requirement |
| `getRestrictions(id)` | Explicit rule fields, defaults provenance and source rule index |
| `getItemIdentity(id)` | Exact original item symbol/index crosswalk |
| `getConfidence(id)` | Field-family source qualification |
| `dungeonIds`, `coverage` | Frozen inventory and scope/consumer metadata |

No unknown/out-of-range ID falls back to Tiny Woods. `source-primary` names a
source variant, not an approved first-visit or repeat-visit campaign predicate.
Consumers must choose the variant explicitly using their separately authored
campaign contract. Section-local numbers, cumulative ordinals and display
prefix/number/suffix/direction are distinct fields. Rest stops are separate map
identities, not numbered floors. The Ninetales scene retains `mt-freeze-peak` in `sectionId` as its
source-section relationship; it has no local floor number
or cumulative ordinal and does not become a fifth exploration floor in that
section. Any non-null scene section must resolve and belong to the same dungeon. The source-generalized Dojo table index 52 is
separate from restriction indices 75–97. Rescue Team Maze is rule 97 / source rows
67–69 / fixed room 49; unused Rescue Team 2 is rule 96 / fixed room 48.

## Distribution semantics and source confidence

Every weighted row retains `publishedWeight`, `cumulativeWeight`, `order` and
`effectiveDrawCount`. `selectionThreshold` preserves zero for nonrandom/zero-weight
rows; `cumulativeWeight` is the running mathematical sum. Denominator is 10,000. The adopted comparative endpoint
uses the first positive cumulative threshold greater than or equal to an integer
draw 0..9999; consequently the first positive bucket can gain one draw and the
last lose one. These effective draw counts precede availability rejection; they
are not final spawned-population probabilities. This catalog supplies no sampler.

Blue exclusives remain in their original order. Opposite-version locked candidates
are rejected after drawing, without renormalization. Mew's named
`initial-mew-eligibility` predicate is distinct from ordinary arrival, which excludes
Mew. Zero-weight rows supply nonrandom levels; internal Decoy has no canonical
species/form and cannot become a recruitable species. Imported Rescue Team Maze
uses `populationRoute: imported-team-data`; its source placeholder pool cannot
replace imported actor identities/stats.

The source baseline is
[pret/pmd-red at 6bcbec4f](https://github.com/pret/pmd-red/tree/6bcbec4f906938c0243aa2026bcbd41b577bab85).
The [UPC original encounter tables](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-pokemon-found-in-dungeons.html)
corroborate all 839 encounter pools' positive rows.
[UPC item chances](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-item-chances.html)
corroborate all 136 accessible ordinary-floor source pools.
[UPC floor data](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-dungeon-floor-data.html)
provides 1,763 money/terrain joins with zero mismatches. These are joint-original
researcher sources, not a build-hash proof of Blue's cartridge data.

Other generation fields, zero-weight level lookups, restrictions, traps, dungeon
shop/Monster House/buried distributions, fixed dimensions and endpoint behavior
retain explicit Red-comparative qualifications. They are usable qualified facts
for the browser reimagining. Source runtime algorithms remain separate reviewed
consumers; the catalog does not import or distribute their implementation.

The pinned converter inspection resolves all eight omitted Boolean defaults to
false and records which fields used that default. Signed room density and unsigned
enemy density remain distinct. Meteor Cave's raw 255 is a special factual byte,
not a universal population count. Pool membership also does not establish item
obtainability: Excavate/Spin Slash TMs occur in source shop pool 83 at Buried Relic
26/36, where the profile has zero shop chance. The availability consumer must
respect that disabled route.

## Remaining authored consumers

Campaign predicates and conditional fixed-room activation, independent room/map
geometry with barrier/actor/return-path invariants, imported-team payload rules,
generation/navigation, effects and spawn eligibility remain separate work.
Blue endpoint equivalence remains qualified. No tile grid, substitute enemy team,
generic spawn default or fabricated rest/terminal floor is included.

## Static verification

The tooling package commands are `npm run dungeons:export` and
`npm run dungeons:check`; the latter is part of `npm run check`. The checker reads
JSON only, validates closed schemas, all foreign keys/source-index coverage,
probability arithmetic, species/form ownership, Blue gates, Mew/Decoy roles,
maze/fixed-room/rule joins, exact floor/scene/variant totals, source comparison
counts, file sizes and byte-for-byte export freshness. Independent lint and strict
JSDoc type checks cover the runtime module. No checker imports or executes game
source, and no automated gameplay test was added.
