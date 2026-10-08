# Dungeon factual catalog authoring

This is an independently normalized, original-Blue-facing factual catalog. It
contains numbers, identities, joins and source qualifications. It does not contain
commercial implementation, scripts, dialogue, raw assembly, tile grids or assets.
The runtime export is not gameplay acceptance.

## Editing and export

The `*-NN.json` documents are the durable authoring records. Each record occupies
one line to keep changes reviewable. Families may span multiple documents; each
file must remain below 1,024 KiB. `schemas.json` is a closed schema for these
records, including exact identity membership and explicit numeric bounds.
`coverage.json` states the expected counts and consumer boundaries.

1. Change factual records only with evidence, keeping source references and
   confidence IDs. Update the corresponding closed schema when adding an identity.
2. Preserve all source indices when merging identical numerical pools. Keys are
   independent semantic/content identities, never the source pointer number.
3. Run `npm run dungeons:export`, then `npm run dungeons:check` from the tooling
   package. Exports are compact deterministic JSON; `export --check` checks bytes.
4. Run the package lint/type checks. Never import or execute game source in checks.

The exporter reads only this directory. Research caches are not build dependencies.
The manifest stores the pinned upstream commit, exact-byte source hashes and
researcher URLs. `research-*` files preserve normalized comparison evidence and
identity/coverage crosswalks, not copied upstream prose or code.

## Normalization decisions

- Generation keys and distribution keys are a 20-hex SHA-256 prefix of the original
  normalized numerical body with sorted object keys. Source indices remain in
  `sourceIndices`. IDs are permanent catalog identities; a future correction may
  retain its established ID if the correction and provenance are documented.
- Repeated item/trap distributions are deduplicated without losing source pointer
  coverage: 178 item source records become 133 identities; 148 trap source records
  become 142 identities. All 1,764 generation and 839 encounter profiles are distinct.
- `pokemon-NNN` and exact canonical form IDs come from the audited identity profile
  crosswalk. The original monster constant maps its source symbol to that profile.
  Castform 377/378/379 mean snowy/sunny/rainy respectively. Decoy remains an internal
  zero-weight lookup and has null species/form IDs.
- Item keys are independently defined `item-` plus lowercase, hyphenated original
  symbols. The exact symbol and source item index are retained. This is an identity
  crosswalk, not an item-effect implementation or generic behavior default.
- Published weights are differences between cumulative thresholds. Preserve order,
  zero rows, cumulative values, denominator 10,000 and effective draw counts using
  the adopted comparative `>=` endpoint over draws 0..9999. Category and conditional
  item distributions are separate stages. Availability is a later rejection;
  effective draw counts do not describe final spawn probabilities.
- All eight restriction Booleans are explicit. The pinned converter calls
  `get_json_bool_value` for those fields, which uses `Json.bool_value`; absent
  fields serialize false. `converterDefaultedFields` records which were omitted.
  Numeric constraints and source rule indices remain explicit. The Dojo generalized
  floor table index 52 does not select restrictions: rule index is
  `75 + floor((sourceLocalFloor - 1) / 3)`. Blue Rescue Team Maze is rule 97 / rows
  67–69 / fixed room 49; rule 96 / fixed room 48 is unused.
- `source-primary` is a source profile, not a default campaign state. Four Mt. Freeze
  alternate profiles remain separately addressable. Campaign consumers must author
  applicability predicates and fixed-room activation. The Ninetales summit scene
  is separate from Mt. Freeze's 19 exploration floors. Its `sectionId` names
  `mt-freeze-peak`, the existing source section, rather than repeating the scene
  identity. A scene's non-null section must resolve within the same dungeon;
  dungeon section/scene lists must own every child exactly once.
- Room masks 0x1 and 0x4 preserve secondary terrain and imperfections. The 28 raw
  generation parameters include signed room density and unsigned enemy density;
  Meteor Cave's 255 is not permission to spawn 255 ordinary enemies.

## Evidence boundaries

UPC corroborates 839 encounter pools' positive rows, all 136 accessible ordinary
item source pools, and 1,763 money/terrain floor joins. Zero-weight level lookup
rows, other generation fields, restrictions, traps, dungeon shop/Monster House/
buried distributions, fixed dimensions and endpoint behavior retain pinned
Red-comparative qualifications. These factual profiles are usable by reviewed
consumers; they are not Blue-cartridge proofs. No additional per-field human
approval process is implied.

Fixed records include the sentinel, boss/rescue maps, maze maps, 17 explicitly
named embedded reward rooms and unused pointers. `independent-geometry-required`
is a clear authoring contract. Rest stops and terminal clearings are not fabricated
numbered floors. Imported Rescue Team Maze opponents must come from team data;
the source placeholder encounter pool must never become an approved substitute.
