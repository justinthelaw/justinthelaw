# Blue Rescue Team location authoring inventory

`locations.json` records original Nintendo DS Blue Rescue Team identities and
source-supported structural facts for P02. It is authoring data outside the
published game tree. `authoringOnly: true`, `runtimeReady: false`, and every
record's `implementationStatus: unstarted` / `acceptanceStatus: pending` are
intentional. No location, maze, encounter, map, or unlock is implemented here.

## Exact membership

| Record kind | Records | Counting boundary |
| --- | ---: | --- |
| `dungeon` | 45 | DATA section 4 field inventory; includes both fugitive paths and four historical event dungeons |
| `dungeonSegment` | 12 | Main section plus named upper/lower section of the six multipart dungeons |
| `dojoMaze` | 22 | 17 type mazes + four preset team mazes + one separately marked Blue linked maze |
| `fixedFloor` | 50 | 24 field encounter/objective placements + five whole-floor Monster Houses + 21 standard Dojo boss placements |
| `terminalMap` | 8 | Six normalized story destinations plus unresolved Howling Forest and Pitfall Valley rescue maps |
| `restStop` | 6 | One inter-segment midpoint for each multipart dungeon |
| `supportLocation` | 10 | Seven core support identities plus three fugitive route junctions |
| `specialMode` | 1 | Off-screen Unknown Dungeon / Tag Mode |
| Total | 154 | Authoring records, not 154 dungeons or 154 verified physical maps |

All 154 records have field-specific source blockers. Supported names, counts,
and placements remain usable evidence within their stated scope; blocked
status prevents the surrounding incomplete record being mistaken for an
accepted runtime specification. The catalog has 64 provenance declarations.

The 45 field IDs are the exact DATA section 4 set. `inventoryGroup: field`
distinguishes them from Dojo, segment, scene, and mode records. Route groups
contain seven early-main, four fugitive-main, three closing-main, two fugitive
path, 25 postgame/optional, and four archived-event identities. Howling Forest
is in DATA's postgame/optional listing group; that grouping is not an unlock
restriction and does not remove its original precredits availability.

The segment pairs are:

| Field dungeon | Main segment ID | Additional segment ID |
| --- | --- | --- |
| `mt-thunder` | `mt-thunder-main` | `mt-thunder-peak` |
| `mt-blaze` | `mt-blaze-main` | `mt-blaze-peak` |
| `frosty-forest` | `frosty-forest-main` | `frosty-grotto` |
| `mt-freeze` | `mt-freeze-main` | `mt-freeze-peak` |
| `magma-cavern` | `magma-cavern-main` | `magma-cavern-pit` |
| `sky-tower` | `sky-tower-main` | `sky-tower-summit` |

An unsegmented dungeon is represented by its field record. This inventory does
not create another 39 redundant main-segment identities or claim the full
original internal map index has been recovered.

The 21 standard maze IDs use `dojo-<name>-maze`. The type names are Normal,
Fire, Water, Grass, Electric, Ice, Fighting, Ground, Flying, Psychic, Poison,
Bug, Rock, Ghost, Dragon, Dark, and Steel. The preset teams are Team Shifty,
Team Constrictor, Team Hydro, and Team Rumblerock. Their three-floor structure,
coarse unlock milestones, and B3F boss placement come from CAMPAIGN section
6.2. `dojo-rescue-team-maze` has `inventoryGroup: blue-linked-maze`; its missing
specific topology and imported-team contract remain null. A generic Dojo rule
is not used to fabricate a complete linked-maze contract.

The core support identities are Team Base, Pokémon Square, Friend Areas,
Makuhita Dojo, Whiscash Pond, Luminous Cave, and Pelipper Post Office. Friend
Areas is explicitly a location collection, not a single physical map or a
replacement for the separate individual Friend Area inventory. The eighth
support identity named by DATA, Hill of the Ancients, is counted once as a
`terminalMap` with `inventoryGroup: support-and-terminal`. Three separately
named junctions connect Mt. Blaze/Rock Path, Frosty Forest/Snow Path, and
Mt. Freeze/Snow Path. Snow Path's two return relationships mean return to the
originating junction; they do not assert a choice to travel to either one.

## Floor counts, scene identities, and maps

`reportedFloorCount` is the value supported by the cited normalized campaign
table or scoped rule. `countBasis` distinguishes exploration, numbered, and
reported totals. Every dungeon keeps `proceduralFloorCount: null`: neither an
exploration total nor an ordinary-exploration total establishes which original
Blue maps are generated rather than fixed. Magma Cavern and Sky Tower retain
the supported 24 and 33 respectively as `ordinaryExplorationFloorCount`; those
values are source counting categories, not generation rules. The other six
scoped exploration totals remain in `reportedFloorCount` with
`countBasis: exploration`. All 45 procedural counts have a field-linked source
blocker.
Known segment counts retain separate local numbering and cumulative
`globalStartOrdinal`. Fixed-floor ordinals are positions within their parents;
they are not additional floors to add to those parents' totals.

The eight terminal IDs are `tiny-woods-caterpie-clearing`,
`thunderwave-cave-magnemite-clearing`, `silent-chasm-rescue-clearing`,
`hill-of-the-ancients`, `mt-freeze-ninetales-summit`, `murky-cave-judgment`,
`howling-forest-smeargle-rescue`, and `pitfall-valley-latias-rescue`. The first
six preserve the plan's normalized separation from exploration counts; this
is not proof of the original on-screen labels or exact transition boundaries.
Except Hill of the Ancients, their names are explicitly authoring descriptions.
Howling and Pitfall retain a null `countRelation`; a reported 15 or 25 does not
resolve their scene-versus-traversal split.

`fixedFloor` reserves a source-supported numbered encounter, objective, or
fixed-content floor. It does not assert that its entire geometry is known to
be fixed. Each row therefore retains null `fixedLayout`, `mapGeometry`, and
`revisitBehavior`. Medicham's floor-20 rescue is an objective inside the full
Wish Cave expedition; it neither proves a fixed layout nor grants the 99-floor
clear. Celebi's floor-99 entry is automatic recruitment, not a boss encounter.
Mew has no fabricated floor-99 boss map. Magma Cavern Pit2 is a numbered event
placement, not an extra terminal clearing; Groudon is Pit3, and Rayquaza is
Sky Tower Summit9. The 21 standard Dojo boss rows preserve the supported B3F
label while their map behavior remains blocked.

`fixedFloorInventoryComplete: false` on every field dungeon preserves the
remaining work: full fixed-room/treasure inventories, per-floor populations,
restrictions, generation parameters, and complete first/repeat transitions.
This bounded inventory does not claim all fixed item chambers or every scene
in the full story graph has been enumerated.

## Traceability and schema conventions

Every record has a stable `id`, human-readable `name`, explicit `recordKind`,
`provenanceIds`, owning `implementationPackage`, `assetPackage: P32`,
implementation/acceptance/source status, and field-linked `blockerIds`. Shared definitions live in
`blockerDefinitions`; distinct field sets keep distinct definition IDs, while
`issueId` preserves the upstream research issue. A null
means an explicit unknown identified by a blocker; it never silently means
zero, no restriction, an empty layout, or an absent unlock. Empty relationships
mean no structural relationships were authored for that record, not proof
that none exist in the original game.

`parentId` identifies the containing authoring entity. `relationships` contains
`{type, targetId}` edges using `hasSegment`, `hasRestStop`, `afterSegment`,
`beforeSegment`, `routeEntry`, `detourEntry`, `returnsToOriginatingJunction`,
`hasTerminalMap`, `hasNumberedMap`, and `containsMaze`. All targets are location
IDs in this catalog. Source-rule identifiers stay separate in `sourceRuleIds`;
they refer to actual `rules[].id` values in the v1 evidence register.

`provenanceSources` maps IDs to repository-relative `document` paths and exact
`locator` values. `section:` locators identify Markdown headings, `record:`
locators identify the DATA source-table IDs, and RFC 6901 `/sources/...` or `/rules` locators identify
research JSON properties. Existing `G2`, `G4`, `G5`, and `campaign:*` source
identities are retained. Local `PLAN-*` IDs identify the normalized planning
tables or versioned evidence register; those documents retain their original
source URLs and evidence limitations. A URL is traceability, not new retrieval
or proof of an exact original mechanic.

The counts and scene blockers were checked against both `blue-rules-v1.json`
and the additive `blue-rules-v2.json`. V2 preserves unresolved terminal labels,
controls, geometry, and revisit rules; it does not promote the Howling
fourteen-plus-one lead or the unscoped Pitfall report into exact Blue fields.
`CAMPAIGN-GAP-02`, `P01-CAMPAIGN-TERMINAL-LABELS`, and the dedicated Howling and
Pitfall blockers therefore remain. Murky Cave's complete unlock also retains
`CAMPAIGN-GAP-03`; the required/optional role of Stormy Sea and exact dialogue
timing have not been resolved by this authoring pass.

All exact executable unlock predicates remain null. Coarse Dojo milestone
labels describe the source table only. Unknown Dungeon is explicitly
`navigableDungeon: false`; its Tag Mode rewards, regional/language matching,
Trozei interaction, and browser adaptation remain blocked. The four event
dungeons retain historical-access scope and an unresolved browser unlock
specification. D04 permits equivalents, but it does not supply their designs
or establish cartridge interoperability. No DX Fairy Maze, Illusory Grotto,
timed-ticket Dojo, DX unlock, or DX floor total is imported.

## Bounded verification

Static authoring checks parsed the JSON, checked unique IDs, reconciled the
45 field identities and 21-plus-one maze split, checked relationship and
parent targets, checked declared provenance membership, and confirmed that
every explicit null has a field-linked blocker. Source-data review checked
floor totals, split-segment arithmetic, known numbered encounter positions,
and the v1/v2 terminal limitations. No game module was imported or executed;
no automated game tests, gameplay observation, commit, or publication occurred.
