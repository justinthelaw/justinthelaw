# Original Rescue Team data and dependency execution plan

**Product baseline: original Nintendo DS Blue Rescue Team**, explicitly selected by Justin on 2026-10-04. Shared Red/Blue references remain useful research, but Red-only behavior does not create a second product edition or a version selector. Preserve Blue's documented cross-version unlock mechanisms where relevant; do not silently discard roster scope.

Status: planning and prerequisite research only. Product implementation is paused for user review. This document does not authorize restarting implementation. [PLAN.md](PLAN.md) governs scope, package order and shared budgets; this appendix specifies factual data requirements and source preparation.

Target: Pokémon Mystery Dungeon: Red Rescue Team and Blue Rescue Team, with explicit edition/region metadata. Rescue Team DX and the Explorers games are reference-comparison material only. Read [SYSTEMS.md](SYSTEMS.md) for execution semantics and [CAMPAIGN.md](CAMPAIGN.md) for progression. [research/roster.json](research/roster.json) is a historical source index, not an implementation contract: its early main-series-stat adaptation and 354-move proposal is superseded by this appendix. No main-series stat replacement is approved.

## 1. Non-negotiable data boundary

The deliverable eventually needs every one of the original 386 species, all original accessible dungeons and special modes, and the behavior that makes those species and locations meaningful. A 386-name encyclopedia, a color-swapped model catalog, a list of 45 dungeon labels, or a registry of nominally 354 moves does not prove completeness.

Maintain three explicit data classes:

| Class | Meaning | Permitted use |
| --- | --- | --- |
| `original-confirmed` | A fact verified for the original Red/Blue games and the selected region | Original-rules runtime and fidelity claims |
| `reference-main-series` | A Generation III main-series fact, including a correctly filtered FRLG learnset candidate | Research and cross-checking; runtime only where original PMD equivalence is verified |
| `authored-adaptation` | An intentionally new value, rule, visual, text, or compatibility behavior | Only when the approved design explicitly permits that adaptation and the game describes it accurately |

Missing original numerical data is a blocking research item. Do not convert a main-series HP stat into PMD HP using a plausible formula and then label it accurate. Do not give unsupported status moves a generic attack boost. Do not invent a recruitment percentage, body size, encounter weight, floor restriction, evolution requirement, or dungeon unlock to make a row appear complete.

Every family needs a source ledger and a coverage ledger. Each unresolved field has an issue ID, a reason it is unresolved, the source already checked, the next source or method to investigate, and the feature that remains blocked. Null means unknown or not applicable only when accompanied by a reason; it must never silently mean zero.

## 2. Exact roster and identity model

The collectible species scope is National Pokédex 001 through 386 inclusive: 151 Generation I, 100 Generation II, and 135 Generation III species. Bulbapedia confirms all three generations are obtainable in the originals. Use National Dex identity for species, not the game's internal monster index and not a PokéAPI form ID. [G1]

The original recruited-Pokémon storage capacity is 413 individuals; that is not a 413-species roster. Form handling and individual capacity require separate counters. [G19]

Required identities:

| Type / field | Example | Purpose |
| --- | --- | --- |
| `SpeciesId` / `speciesId` | `pokemon-025` | Stable string catalog key derived from National Dex number with three-digit padding |
| `dexNo` | `25` | Numeric National Dex identity, Pikachu; distinct from the string catalog key |
| `FormId` / `formId` | `unown-a` | Separate stable form key with an explicit original-form mapping; Unown retains `speciesId: 'pokemon-201'` |
| `originalMonsterIndex` | Researched original internal value | Optional source crosswalk; never assume it equals Dex number |
| `PokemonId` / `pokemonId` | Unique save-local string | One persistent individual, independent of evolution; key of its canonical Pokémon record |
| `ActorId` / `actorId` | Unique floor/session string | A live actor; can reference `pokemonId` or a wild template |
| `storyActorId` | `square-munchlax` | NPC identity; not automatically recruitable |
| `modelId` | Original authored model key | Visual asset identity; can change with form or evolution |

Persist one canonical record per `PokemonId` and references to it. Party selection and Friend Area membership refer to these individuals; a session actor has its own `ActorId` and an optional `pokemonId` reference. Do not persist divergent copies of one individual. Evolution changes `speciesId` and possibly `formId`, while preserving `pokemonId`. The exact state ownership and save layout are defined in [SYSTEMS.md](SYSTEMS.md).

### Forms, cameos and version boundaries

Unown forms must be separate form entries and recruitment-search entries, while contributing one species to the 386 count. Deoxys needs Normal, Attack, Defense and Speed forms, a normal overworld appearance, and its original per-floor form-change rule. Castform weather forms need researched type/appearance transitions tied to the original Forecast implementation. Spinda pattern variation, gender presentation, transformed Ditto and story variants must each be classified as cosmetic state, temporary combat state or separate original form; do not guess from modern PokéAPI form records. [G7, G8]

Munchlax is an original NPC cameo and is unobtainable in these games. It must not be added as collectible species 387 or as an undocumented secret recruit. Decorative statues or references to later Pokémon do not add those Pokémon to the playable roster. [G6]

The initial hero pool contains Bulbasaur, Charmander, Squirtle, Pikachu, Meowth, Psyduck, Machop, Cubone, Eevee, Chikorita, Cyndaquil, Totodile, Treecko, Torchic, Mudkip and Skitty. The partner pool contains Pikachu and the nine Kanto/Johto/Hoenn starters, subject to the original type restriction. If free selection is approved later, store it as a separate mode; do not rewrite the historical selection table. [G1]

Version data must distinguish default wild availability, evolution availability, Wonder Mail unlocks, special regional behavior and story recruitment. In the original English versions, the ordinary Red/Blue split concerns Feebas/Magikarp, Mantine/Lapras, Roselia/Aipom, Plusle/Minun and Porygon/Porygon2. The current main-game article lists Porygon2 in a note rather than its blue table. Upgrade availability makes wild-version exclusivity different from permanent species unavailability. [G1]

Required follow-up: make a Blue product availability matrix with comparative Red provenance, including Blue's sourced cross-version unlock mechanisms. Validate relevant regional differences from dedicated sources; do not infer Korean behavior from English data. D01 is resolved by the user: original Blue only, no Red/combined edition selector. Keep regional/source uncertainty explicit until resolved; it does not reopen the chosen product edition.

### Species record: minimum authoritative fields

| Field family | Required content |
| --- | --- |
| Identity | `speciesId: SpeciesId`, `dexNo`, slug, localized display name, original internal-index crosswalk, introduced generation |
| Forms | Original form IDs, persistent/recruitable/temporary flags, source-specific transitions |
| Types | Original primary/secondary types; explicit typeless handling belongs to moves, not a fake species type |
| Abilities | Original ability IDs and simultaneous-ability policy; no modern Hidden Ability slot |
| Growth | Original PMD level-1 stats, per-level stat increments or cumulative tables, EXP requirements, caps and special species exceptions |
| Movement | Ground/water/lava/air/wall traversal, restrictions, belly effects and form/ability overrides |
| Size | Original PMD body size, not physical height or a renderer bounding box |
| Recruitment | Base chance, eligibility, special scripted methods, required Friend Area and exceptions |
| Learning | Ordered original level-up moves, TM/HM compatibility, IQ-only learning, relearning and evolution inheritance rules |
| Evolution | Source and destination forms; level, IQ, item combinations, stat comparisons, random branches and simultaneous outcomes |
| Placement | Original dungeon/floor encounter records, level, weights and evolution-only routes |
| Rendering | Original model/animation definition, palette, scale and cosmetic variation; separate from gameplay size |
| Provenance | Per-family source URL/revision, evidence location, edition, extraction date, reviewer and uncertainty flags |

A main-series `base {hp,attack,defense,specialAttack,specialDefense,speed}` record is insufficient. Original PMD progression and movement speed must have their own schema. Keep main-series base stats under a clearly labeled reference namespace if retained at all; they cannot replace missing original PMD fields.

### Evolution facts already established

The original IQ thresholds are 100 for Eevee's Espeon/Umbreon routes, 150 for Golbat, Togepi and Chansey, and 200 for Pichu, Cleffa, Igglybuff and Azurill. Eevee additionally needs the corresponding Sun or Lunar Ribbon. Trading is replaced by Link Cable usage; Feebas uses a Beauty Scarf. [G9, G10]

Schema must support multiple required items, including the Link Cable plus King's Rock, Metal Coat, Dragon Scale, Upgrade, Deep Sea Tooth or Deep Sea Scale where applicable. Do not reduce a two-item route to `item:'link-cable'`. Research and preserve original display spellings separately from stable kebab-case IDs. Tyrogue comparisons, Wurmple branching and Nincada/Shedinja require explicit condition operators; a generic `{id,level}` cannot express them.

Missing: complete edition-specific evolution matrix, exact item consumption, postgame unlock, inherited stat/move behavior, failed-evolution handling, and any original-specific deviation. Those are release blockers for the relevant routes.

## 3. Complete data-family work breakdown

Each row below is an independently assignable research/authoring unit. Output factual data plus an evidence ledger, not implementation code, until plan approval.

| Family | Required registry and relationships | Current readiness | Completion evidence |
| --- | --- | --- | --- |
| Species identity | All 386 IDs/names/generation; form crosswalk | Pinned factual seed available | Exact 001–386 ledger; no gaps/duplicates/later species |
| Types and matchups | Original types; offensive matrix; PMD multipliers; dual-type combination; immunity exceptions | Historical type source available; PMD formulas need systems research | Each pair and override tied to original source |
| PMD stats | Per-level HP/Atk/Def/SpAtk/SpDef, EXP, caps, growth and special cases | Missing authoritative full corpus | Complete tables or equivalent sourced formula with rounding and level boundaries |
| Body size and movement | Original body-size units and terrain permissions | Partial facts only | Complete 386/form mapping; no derivation from main-series height |
| Abilities | Original IDs, holders, trigger conditions, order, modifiers, disabled/suppressed cases | General rules confirmed; complete effect corpus missing | Every used ability has original semantics and an execution specification |
| Moves | Names, IDs/crosswalk, PMD numerical data, targeting, effects and learning | Main-series seed downloaded; PMD corpus missing | Every original usable move and system action accounted for |
| Move acquisition | Level-up, IQ conditions, TMs/HMs, Gulpin relearning, linked-move changes | FRLG candidates for 385 defaults; exceptions unresolved | Original learning record for every species/form and acquisition route |
| Statuses and stat stages | Timers, stacking, overwrite groups, cure events, floor reset, movement interactions | Missing full corpus | No generic replacement of a named original status |
| IQ | Skills, thresholds, mutually exclusive groups, AI effects, Gummi relationship | Sources located; full table not authored | Complete original skill and Gummi matrices |
| Items | Obtainable IDs, category, use/throw/hold effects, stacking, price, shop/loot locations, persistence | Original index source located | Item manifest distinguishes usable/unused/internal/region-specific |
| TMs/HMs/orbs | Original availability, compatibility, used-TM handling, entry requirements, orb restrictions | Main-game differences identified | Every original machine/orb has correct mechanics and source |
| Traps and terrain | Original trap IDs, visibility, triggering, ownership, effect, removal; special tiles | Original trap table located | RB-column inclusion matrix and per-trap effect specification |
| Recruitment | Species rate, level bonus, Friend Bow, body/party cap, finishing blow, range, story/boss exceptions | General source located | Sourced formula and full exceptions table |
| Friend Areas | Area IDs/names/cost/unlocks/capacity/species associations; story grants | Not authored | Every obtainable species has a valid accommodation/recruitment route |
| Dungeon identity | All fields, sections, Dojo mazes and Blue special modes | Name inventory confirmed below | Explicit counting convention and no DX-only locations |
| Dungeon floors | Original counts, segments, floor direction, rest stops, fixed layouts, exits | Full exact corpus missing here | Per-floor canonical index and source mapping |
| Floor populations | Encounters, levels, weights, recruitment, shops, monster houses, item/trap tables | Missing full corpus | No generic biome encounter pools standing in for original tables |
| Dungeon rules | Entry items/HMs, party restrictions, level/IQ reset, money/items, rescue/escape, weather | Missing full corpus | Every dungeon has explicit rules, including defaults sourced once |
| Missions | Rescue/escort/delivery/find jobs, difficulty, acceptance limits, destinations, rewards, failure | Systems/campaign research required | All original mission kinds have full state transitions |
| Wonder Mail | Character sets, regional length, payload fields, validation/checksum, replay policy, unlocks | Format lengths confirmed; codec missing | Documented native compatibility or approved clearly separate browser format |
| Friend Rescue | SOS/A-OK/Thank-You correspondence, save state, mission floor, rewards, restrictions | High-level source located; codec/state details missing | End-to-end specification without pretending WebRTC emulates DS wireless |
| Story and town | Trigger graph, services, prices, ranks, statues, unique recruits, rescue-base stages | Campaign/systems agents own | Every milestone and service maps to explicit flags and records |
| Audio and visual assets | Original authored models, motion, biomes, UI, particles, synthesized audio | Design work only | Provenance, model coverage and measured budget ledger; no ripped assets |

### Moves: no 354-row shortcut

There are 354 Generation I–III core-series moves to inventory as a starting universe. Original PMD also has Wide Slash and Vacuum-Cut, which are typeless PMD-exclusive moves. Basic attacks, thrown-item actions, trap effects and internal actions need a separate system-action namespace. Do not assign a PMD-only move a colliding later-generation PokéAPI number. Prefer stable slugs with optional `coreMoveId` and separately researched `originalMoveIndex`. [G11, G12]

The compact effect enumeration `damage/heal/sleep/poison/burn/paralyze/freeze/boost/protect/confuse` is not enough. The approved future schema should describe an ordered effect program or reference a named, independently specified handler. It must express healing/draining, recoil, crash damage, fixed damage, variable power, multi-hit distributions, charge/recharge, accuracy exceptions, room-wide effects, line projectiles, corner rules, stat changes, weather, terrain changes, trap creation/removal, displacement, item transfer, transformation, copying moves, PP manipulation, ability suppression, linked moves, targeting allies, ally protection and failures.

Required numerical fields include original PMD power, PP, accuracy checks, critical behavior, hit count, secondary-effect chance, distance, wall blocking, line piercing, corner rules, scope, target relation, duration and floor persistence. Some systems have more than one accuracy-related parameter; preserve original meaning rather than collapsing everything into a single percentage before research.

A concrete evidence check: the original PMD Tackle table lists power 7, PP 22, accuracy 95%, and a front-enemy target without corner cutting. Copying a main-series Tackle row would produce the wrong power and PP even if its name, type and learnset looked plausible. [G13]

FRLG level-up equivalence is a starting rule with exceptions, not proof that every main-series move field carries over. The downloaded default-form FRLG table contains 385 of the 386 species. Deoxys Normal has no default FRLG row because those games use form-specific Deoxys records; the snapshot contains distinct Attack/Defense FRLG learnsets and a Normal Ruby/Sapphire learnset. Do not silently use Normal's Ruby/Sapphire list, merge all three, or arbitrarily choose Attack. Resolve the original PMD Normal/form-dependent learning behavior from an original-specific source and record that resolution.

IQ-gated learning also requires a condition schema. Bulbapedia identifies original high-IQ special learning for Venusaur, Charizard, Blastoise and Pichu. Do not add these only as ordinary level-up entries. [G9]

### Abilities

The originals allow both of a species' two abilities to apply; there are no Hidden Abilities. Main-series ability names can seed identity research, but effects differ in PMD. An engine that chooses one random main-series ability is wrong for this target. [G14]

For each ability, specify trigger event, eligible owner, affected targets, geographic scope, activation probability, numerical operation, rounding, interaction with other abilities, status/terrain prerequisites, and visual/log announcement. Cover weather setters/suppression, elemental absorption/immunity, low-HP boosts, movement/turn effects, status immunity/cures, contact effects, item effects, PP effects and form-changing abilities. Resolve whether unused Cacophony/internal values belong only in the source crosswalk. Never expose an unused ability as a normal selectable perk without an approved adaptation.

### Items, machines, traps and status coverage

Start item identity from the original item-index page, not PokéAPI's present-day item catalog. Classify each row as ordinary obtainable, special-mode obtainable, region/version-dependent, story-only, internal/unused or unknown. Record the rule that establishes the classification. [G15]

Required item families include straight and arcing projectiles; seeds and berries; food and Belly capacity; Gummis and IQ; drinks/stat enhancers; held bands, scarves, ribbons, belts and glasses; orbs; TMs and HMs; used TMs; keys; evolution items; music-box components and completed Music Box; Wish Stone; wings and story key items; money; rare wireless rewards. Item instances additionally carry quantity, sticky state, ownership/shop price, held-by references, and any charges or special state.

Preserve item-use context: eating, throwing, holding, using from inventory, passing to an ally, using in town, entering a dungeon, or handing over at evolution. A shared item ID does not imply one effect in every context. Do not add DX's Evolution Crystals, wands, rare qualities, looplets or emeras.

The RB trap column includes the original effects for Chestnut, Explosion, Grimy, Gust, Mud, Pitfall, Poison, Pokémon, PP-Zero, Seal, Selfdestruct, Slow, Slumber, Spiked Tile, Spin, Sticky, Summon, Trip and Warp traps. Verify the final complete list and original internal IDs directly from that column before freezing it. Wonder Tiles, stairs, warp exits, rescue spots, shop carpet and terrain are separate categories, even if stored near traps internally. Later Apple/Hunger/Random/Grudge/Stealth Rock/Toxic Spikes entries must not creep into the original set. [G16]

Do not use the broad modern trap prose without checking edition qualifiers. Store visibility to leader versus party, owner/faction, which movement methods trigger it, activation chance, repeatability, prevention, destruction, and floor-direction restrictions. Resolve inconsistencies between prose and in-game-description summaries with stronger original evidence; never choose whichever is easier to implement.

## 4. Dungeon and special-mode inventory

Counting convention: 45 named traversable field dungeons, including the two fugitive paths and four Wonder Mail dungeons; summit/pit/grotto sections are grouped under parent dungeons. The Dojo and Blue wireless feature are counted separately. This is a name inventory, not a completed floor or encounter dataset. [G2, G3]

| Group | Names |
| --- | --- |
| Main story, early | Tiny Woods; Thunderwave Cave; Mt. Steel; Sinister Woods; Silent Chasm; Mt. Thunder; Great Canyon |
| Main story, fugitive arc | Lapis Cave; Mt. Blaze; Frosty Forest; Mt. Freeze |
| Main story, closing arc | Uproar Forest; Magma Cavern; Sky Tower |
| Fugitive paths | Rock Path; Snow Path |
| Postgame and optional, 1 | Howling Forest; Stormy Sea; Silver Trench; Meteor Cave; Fiery Field; Lightning Field; Northwind Field; Mt. Faraway |
| Postgame and optional, 2 | Western Cave; Northern Range; Pitfall Valley; Buried Relic; Wish Cave; Murky Cave; Desert Region; Southern Cavern |
| Postgame and optional, 3 | Wyvern Hill; Solar Cave; Darknight Relic; Grand Sea; Waterfall Pond; Unown Relic; Joyous Tower; Far-Off Sea; Purity Forest |
| Wonder Mail | Oddity Cave; Remains Island; Marvelous Sea; Fantasy Strait |

Required explicit segments include Mt. Thunder Peak, Mt. Blaze Peak, Frosty Grotto, Mt. Freeze Peak, Magma Cavern Pit and Sky Tower Summit. A floor number in a local segment and a cumulative dungeon ordinal are separate fields. Boss arenas and rest floors must say whether they count toward each displayed total.

Makuhita Dojo has 17 type mazes: Normal, Fire, Water, Grass, Electric, Ice, Fighting, Ground, Flying, Psychic, Poison, Bug, Rock, Ghost, Dragon, Dark and Steel. Four team mazes add Team Shifty, Team Constrictor, Team Hydro and Team Rumblerock, for 21 standard mazes. Blue adds the Rescue Team Maze using a transferred Red team. Do not add DX's Fairy Maze or its timed-ticket training rules. [G4]

Unknown Dungeon is Blue's off-screen wireless Tag Mode. It is not a missing navigable cave map. Its rewards, language/region matching and Trozei interaction need a separate feature specification. D04 approves browser-local team export/import as an adaptation; it must not be presented as a DS wireless implementation or verified cartridge interoperability. [G5]

Supporting locations require records too: Team Base, Pokémon Square, Friend Areas, Makuhita Dojo, Whiscash Pond, Luminous Cave, Hill of the Ancients and Pelipper Post Office. Illusory Grotto is DX-only and excluded.

For every field dungeon and maze, the future author must fill: stable ID; original name/spelling; version/region; entry unlock expression; one-time and repeat-visit differences; floor direction; sections and local floor ranges; total procedural floors; fixed maps/arenas; rest stops; starting level; restored level after exit; IQ/item/money reset rules; initial party count and body-size limits; mandatory HM/item/party requirements; recruitment rules; floor hazards/weather; permitted friend rescue and escape; NPC/escort requirements; boss definition; first-clear and repeat-clear rewards; unique recruitment; spawn/item/trap/shop/monster-house tables; source and coverage status.

Blockers currently remaining: a source-complete set of exact floor counts and segmentation, every per-floor encounter and weight table, every dungeon-specific restriction, version-dependent encounters, all fixed item chambers, all boss statistics, and full unlock prerequisites. The name inventory must not be promoted into `DUNGEONS` runtime objects with invented default residents or easy floor counts.

### Rescue codes and version features

Original non-Japanese Wonder Mail uses 24 characters in two rows of 12; Japanese Wonder Mail uses 17 characters and is incompatible. Job acceptance must also respect locked dungeons, except the four special unlock cases. [G17]

Before promising native code compatibility, research the character ordering, regional alphabets, bit layout, checksum/validation, payload fields, dungeon/floor encoding, species/form encoding, mission kind, reward encoding, allowed ranges and already-redeemed policy. Keep Wonder Mail mission codes distinct from SOS, A-OK and Thank-You rescue mail. No page located in this research establishes the whole codec.

Friend Rescue also needs a state contract: defeated run snapshot, allowed exploration while waiting, eligibility and rescue floor, rescue spot behavior, rescue completion, optional reward/Thank-You sequence, restoration point and cancellation. If using a new browser JSON exchange rather than native codes, add an explicit format name and schema version; do not label an arbitrary token as an original Wonder Mail password. [G18]

Blue's Rescue Team Maze import and Unknown Dungeon/Trozei mode are distinct from friend rescue and mission sharing. Decide their user-facing treatment in the approved scope. Omitting them is a scope exception that must appear in the coverage ledger, not an invisible implementation shortcut.

## 5. Pinned source provenance and licensing

### PokéAPI factual reference seed

Repository: `https://github.com/PokeAPI/pokeapi`.

Pinned commit observed and downloaded: `bc92d3b6029ef1abe9e7ad424c400b338f3c11fe`.

The original research used a temporary local snapshot. That cache is historical, is not committed, and is not required to read this plan or work from a fresh clone. After approval, reproduce needed source files from the pinned URLs below into a new staging directory outside the published game. Appendix B records the exact raw byte sizes and SHA-256 hashes; do not silently replace a mismatching input with the latest upstream version.

Read date: 2026-10-04. Data source directory: `data/v2/csv/`. Exact source URL pattern: `https://raw.githubusercontent.com/PokeAPI/pokeapi/bc92d3b6029ef1abe9e7ad424c400b338f3c11fe/data/v2/csv/<filename>`.

Historically inspected CSV files: `pokemon_species.csv`, `pokemon_species_names.csv`, `pokemon.csv`, `pokemon_types.csv`, `pokemon_types_past.csv`, `pokemon_stats.csv`, `pokemon_stats_past.csv`, `pokemon_moves.csv`, `moves.csv`, `move_names.csv`, `move_changelog.csv`, `types.csv`, `pokemon_evolution.csv`, `pokemon_habitats.csv`, `pokemon_shapes.csv`, `pokemon_colors.csv`, `items.csv`, `item_names.csv`, `version_groups.csv`, `move_meta.csv`, `move_meta_ailments.csv`, `move_effect_prose.csv`, `move_meta_stat_changes.csv`.

The snapshot is a reference corpus, not an approved runtime dataset. `pokemon_moves.csv` is roughly 10.7 MB and includes later games/forms; do not ship it directly. `move_effect_prose.csv` is reference text only and should not become copied player-facing descriptions. Ability holder/history, type-efficacy and original PMD-specific tables have not been downloaded/authored as a complete dataset.

PokéAPI documents main-series provenance and historical fields. Its BSD-3-Clause repository license is pinned at `https://raw.githubusercontent.com/PokeAPI/pokeapi/bc92d3b6029ef1abe9e7ad424c400b338f3c11fe/LICENSE.md` (the historical local copy was named `POKEAPI-LICENSE.txt`). Preserve the exact copyright, conditions, disclaimer and non-endorsement requirement for redistributed data/code covered by it. The license does not grant ownership of Pokémon trademarks or Nintendo artwork. Avoid assuming a third-party sprite repository inherits the API code license. [T1, T2, T3]

For portable roster review, Appendix A is the complete checked-in identity evidence. Reproducing it later needs only `pokemon_species.csv` and `pokemon_species_names.csv`: select species IDs 1 through 386, join English names with `local_language_id=9`, preserve numeric order, and derive `SpeciesId` as `pokemon-` plus the three-digit `dexNo`. Confirm the resulting set is exactly 1–386 and inspect the exceptional display spellings separately. No 10.7 MB learnset download is needed to review that ledger, and it makes no claim about PMD numerical completeness.

Historical types use rows valid through the listed generation. Apply a generation interval lookup: a Generation I-only Magnemite type row does not override Generation III Steel typing, whereas a type value ending in Generation V may be the correct pre-Fairy value. Stat history is per changed stat, not necessarily a complete replacement six-stat row. Main-series historical stat reconstruction is useful for reference but remains insufficient for PMD growth.

FRLG is `version_group_id=7` in this snapshot, and level-up is `pokemon_move_method_id=1`; resolve these from the matching CSV rather than assuming they never change. Preserve level and ordering. The current evolution table has version-group and form-condition fields, and modern defaults may conflict with Generation III methods. Inspect the pinned schema before writing a generator.

### Bulbapedia and decompilation boundary

Bulbapedia is the requested game-reference source. Extract limited factual records and write original explanations. Keep edition/revision/evidence locations. Do not bulk copy prose, tables, original game dialogue, artwork or music. The current copyright page could not be fetched successfully during this research; do not claim an independently verified permissive content license. An accessible page is not by itself a redistribution license.

`pret/pmd-red` is an original-game decompilation, and its build metadata points to `monster_data.json`, `learnset_data.json`, dungeon, move and item data. Its root did not establish a permissive license in this research. Treat it as a potential fact-verification source only after reviewing source provenance and project licensing, not as a library to copy into the browser game. Do not distribute ROM bytes or extracted Nintendo visual/audio/script assets. [T4]

For numerical facts unavailable in Bulbapedia, the next researcher must identify a reliable source and document whether it is primary recovered data, a community transcription or inference. Conflicts remain open until resolved. Do not pressure a smaller model to invent an answer because the generation step expects a number.

### Future generation pipeline, after approval

1. Freeze target edition/region, source commits and per-page revisions.
2. Create a source manifest containing URLs, retrieved dates, hashes, license paths and family-level purpose.
3. Download to a staging directory outside the product. Reject incomplete files and unexpected schema changes explicitly.
4. Extract a neutral factual intermediate representation. Keep source IDs separate from runtime IDs.
5. Apply historical filters and original-game corrections with an individually sourced override ledger. An override records why it exists; no silent hard-coded fixups.
6. Produce an unresolved-data report. Stop compilation of an affected release feature when required original fields remain unknown.
7. Have a separate reviewer compare the extracted rows, exceptional cases and source intervals. This is document/data review, not a game-source test.
8. Compile approved records into local ES-module data files with stable ordering and deterministic formatting. Partition each added file to stay at or below 1,024 KiB and keep initial-scene loading within PLAN's 8 MiB encoded budget. Keep source provenance and coverage manifests beside them.
9. Produce a diff summary: counts added/removed, changed facts, source revisions, and affected mechanics. Never update source snapshots implicitly during a normal website build.
10. Preserve original-generation data in its own versioned catalog. A future adaptation or DX mode must have a different ruleset ID and explicit overrides.

## 6. Exact engine/dependency recommendation

The user superseded the single-HTML constraint with a static game folder. Recommend local ES modules under `games/pokemon-dungeon-reimagined/`, copied by the existing export pipeline. No server route, CDN, remote font, remote texture, remote model, telemetry service or runtime data API is required.

Three.js candidate already inspected: npm package `three@0.186.1`, MIT license. Package URL: `https://registry.npmjs.org/three/-/three-0.186.1.tgz`.

Package integrity: `sha512-blFeqb49wRCSGUGj7gtpfnSGHy2lwDk94RhUmS1c/hTby70kvChbWpkJ4Pm1390LqzzvTmzgXKHPEafJwCb8jA==`.

Downloaded tarball SHA-256: `8cd068708ea44f2c73c944b1cead2ba2f0d5c15c8fc194e5700f4e4f4a033fe7`.

Exact runtime package files for this route are `package/build/three.module.js` and `package/build/three.core.js`. The former statically imports/re-exports from `./three.core.js`; static inspection found no module imports in the latter. Preserve that relative dependency. Package license is `package/LICENSE`. Do not ship just `three.module.js`, and do not assume this package contains `three.module.min.js`: the attempted read established that it does not.

Raw sizes observed: `three.module.js` 662,772 bytes; `three.core.js` 1,458,113 bytes. Before the planning hold, these were independently minified with temporary `@esbuild/linux-x64@0.28.2`, `--minify --format=esm --legal-comments=inline`, producing approximately 367.4 KiB and 380.5 KiB. The unminified core exceeds the repository's 1,024 KiB per-added-file limit and must remain outside the commit. No bundling or game execution occurred. Preserve the exact MIT license beside future output and include visible credits. Appendix B records the raw package-file hashes. This candidate must receive P04 static integration review after approval; research does not prove rendering compatibility.

Build-only minifier provenance: `https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.28.2.tgz`, integrity `sha512-4xTZr1FUmSoQW4XIWmit3tzQrUTZM+N3P0XV8xROKYF50XfI7xeO90+1bZvNwxIufQ9hDQVRJH5YhgPVF8A/HQ==`. This is a temporary tool, not a runtime dependency or a root-repository package addition. Prefer an approved reproducible vendoring command/script later, with pinned versions and hashes. Do not alter root `package.json`/lockfiles for a standalone game dependency without a separate reason.

Fresh-clone reproduction belongs to P04 after approval: retrieve the exact Three archive, verify its recorded integrity and SHA-256, extract the two listed build files and license to a temporary staging directory, and verify Appendix B hashes. Retrieve and verify the pinned Linux x64 minifier for that platform; another authoring platform needs an explicitly recorded platform package and integrity for the same selected esbuild version. Minify each module independently with the options above so `./three.core.js` remains a local import. Record exact output sizes and hashes, retain notices, inspect imports statically, and keep every added file at or below 1,024 KiB. A new approved engine version requires a new provenance record; the recorded research candidate must not update implicitly. No parked or temporary files are input dependencies of this process.

Three's current WebGLRenderer requires WebGL2; WebGL1 support ended at r163. Decide the minimum browser/device support honestly. Renderer initialization and context-loss failures need a useful recovery/status interface. GitHub Pages supports the proposed static files, and the game's relative paths must continue to work under the portfolio's project base path and iframe. [T5, T6, T7]

### Original asset strategy and proposed budgets

The shared limits below match [PLAN.md](PLAN.md); they are design targets, not measured results or guarantees. [RENDERING.md](RENDERING.md) owns device profiles and visual production details. Any proposed adjustment must update the shared plan before implementation; a smaller appendix-specific target never relaxes the shared limits.

| Budget | Proposed initial limit | Review condition |
| --- | --- | --- |
| Each added file | At most 1,024 KiB | Existing hook constraint; optimize or partition, including data and vendor files |
| Entire published game | At most 300 MiB | Includes all local runtime code, data, audio and visual assets |
| First interactive scene transfer | At most 8 MiB encoded | Includes its engine, core data, UI and initial scene/party assets; defer other content |
| Active scene encoded assets | At most 24 MiB | Demand-load and release assets; account for resident and GPU memory separately |
| Local engine payload | Under 1 MiB uncompressed across the two minified modules | Explain any added addons/decoders before increasing it |
| Core factual runtime data | Target 1–2 MiB uncompressed in multiple files, each at most 1,024 KiB | Normalize references and load relevant partitions; preserve complete factual coverage |
| Frame pacing | 30 fps mobile; 60 fps on an agreed midrange desktop | RENDERING owns draw-call, triangle, pixel-ratio, shadow and animation profiles |
| On-screen input | Minimum 44 CSS px touch target | Reflow controls; preserve zoom, focus and reduced motion |
| Visual resource ownership | Authored local assets, shared caches, bounded effects and explicit disposal | Count decoded/GPU memory separately from encoded transfer; avoid resource leaks |

A 386-entry visual manifest must identify a recognizable silhouette and distinctive features for each species. Reusable limbs, eyes, horns and body primitives are acceptable building blocks; a different hue on the same generic animal is not a finished species model. Maintain per-species model review status, form support, materials, scale, idle/walk/attack/hurt/faint animation states, and camera readability. Use separate visual scale and PMD body size.

Terrain should retain deterministic gameplay geometry while using a separate cosmetic random stream. Batch/instance repeated tiles. Reuse and dispose GPU resources intentionally. Keep simulation turns independent of frame time. Render only as needed during turn animations and stop unnecessary work when hidden. MDN's WebGL guidance supports bounded memory, batching and smaller back buffers; the numerical limits above are project recommendations. [T8]

DOM controls should remain semantic and keyboard accessible, with visible focus, readable status, live-region event summaries, touch targets around 44–48 CSS pixels, and reduced-motion behavior. WCAG's AA minimum target-size criterion is 24 CSS pixels with exceptions; the larger target is a comfort recommendation. Include explicit mute, motion and effects controls. Do not make color the only type/status signal. [T9, T10]

Persistence needs a versioned local save schema, bounded import parsing, a unique namespace, graceful storage failures and manual export/import. `localStorage` behavior for downloaded `file:` pages is undefined and origin-specific storage is not a portable backup. This supports the folder-and-static-host route but does not replace a deliberate save migration plan. [T11]

## 7. Static quality and review gates: no game tests

The user prohibits game-source tests. Do not add tests, run unit tests, execute game modules in a test harness, or hide such execution inside a data-validation command. Website tests must substitute fixture iframe HTML and never load the real game. Syntax/lint/static source inspection and separately requested visual captures remain the available product checks; coordinate any later runtime visual validation with the user's explicit scope.

For this planning stage, the allowed evidence is source research, source-file inventory, schema review, factual count inspection and document review. No product implementation or rendering is necessary.

After approval, use this manual/static acceptance matrix:

| Gate | Evidence to inspect | Failure action |
| --- | --- | --- |
| Scope | Approved edition, region, mode and adaptation ledger | Return for a concrete scope decision; do not assume DX behavior |
| Species | 386-record roster ledger, forms separated, every ID mapped | Fix source mapping before authoring consumers |
| Acquisition | Every species/form has a reachable recruit/evolve/story route | Mark catalog incomplete; no completion claim |
| Learning | Original ordered learnsets and exceptions, IQ/TM rules | Block affected species learning rather than infer |
| Mechanics data | Source-backed PMD stats/moves/abilities/items/traps | Do not compile unknown required fields as default values |
| Dungeons | 45-field-name inventory plus segments/Dojo/Blue features | Reconcile counting and edition differences |
| Floor coverage | Every displayed floor range resolves to content/rules/source | Block incomplete dungeon selection in a release |
| Cross-references | Human/static review of stable IDs and referential maps | Repair IDs, never substitute the first catalog entry |
| Licensing | Exact notices, source manifest, no unattributed copied assets | Remove or replace uncertain redistributed content |
| Static dependencies | Every import/asset reference is relative and exists | Fix offline packaging; no runtime CDN fallback |
| File hygiene | Syntax review, permitted lint, whitespace and size limits | Correct owned files only; preserve parallel work |
| Claims | Coverage ledger matches what is shipped | Rewrite claims or complete missing content |

Suggested review slices for a smaller model: ten to twenty species at a time; one move family at a time; one dungeon or five-floor block at a time; one item category at a time. Each task includes exact input sources, output schema, known exceptions and a hard rule to report missing facts. Require source comparisons for the first, last and unusual entries in each slice. A second reviewer checks historical filtering and exceptions independently.

Do not accept 'all rows present' as behavior evidence. A complete-looking row with guessed semantics is still incomplete. Static checking cannot establish playability, save recovery, performance or full mechanical equivalence; keep those claims unmade until the separately authorized validation strategy supports them.

## 8. Explicit unresolved blockers and execution order

| ID | Blocker | Next action | Feature blocked |
| --- | --- | --- | --- |
| DATA-01 | No complete authoritative PMD level/stat/EXP tables | Locate original-specific corpus and record each table/form's provenance | Faithful stats, leveling, reset dungeons |
| DATA-02 | No complete PMD move numerical/effect registry | Inventory all core/exclusive moves from original-specific pages; resolve effect/target fields | Faithful combat and move learning |
| DATA-03 | Deoxys learning/form exception unresolved | Compare original-specific learned moves and per-floor form behavior | Deoxys completion claim |
| DATA-04 | Ability corpus and per-species original abilities incomplete | Build original holder/effect matrix and trigger-order specification | Faithful passive mechanics |
| DATA-05 | Recruitment/body-size/Friend-Area matrix incomplete | Join original eligibility/rates/areas/size; record special routes | All-species obtainability |
| DATA-06 | Full original evolution conditions incomplete | Verify multi-item/IQ/stat/random/simultaneous routes | All-species evolution |
| DATA-07 | Exact floor/encounter/item/trap corpus incomplete | Resolve dungeon-by-dungeon sections and original floor tables | Complete original campaign/world |
| DATA-08 | Original item/terrain/status behavior corpus incomplete | Author each registry with edition qualifiers and effect semantics | Complete item and hazard mechanics |
| DATA-09 | Browser exchange specification incomplete; native codecs unverified | Specify the D04-approved versioned browser code/file format. Research original formats/checksums/regions only before any optional interoperability claim | Browser exchange; any claimed native compatibility |
| DATA-10 | Blue hardware feature content/equivalent mapping incomplete | Inventory original behavior and specify the D04-approved import/share, off-screen and archived-event equivalents; no content omission is approved | Complete Blue browser adaptation |
| DATA-11 | Redistribution permissions for any PMD recovered corpus unverified | Review exact source license and distinguish facts from copied implementation/assets | Shipping recovered files |
| DATA-12 | Per-species original visual design coverage absent | Apply approved B `style-b-v1` and develop a reviewed 386-species/form model manifest; retain actual asset-quality gates | Recognizable complete visual roster |

Execution order after user review: approve scope and factual schemas; resolve source/licensing blockers; complete species/forms/type and dungeon identity ledgers; complete PMD stat/move/ability registries; complete item/trap/status/IQ registries; complete recruitment/evolution/Friend Areas; complete dungeon floors and campaign joins; resolve mail/version modes; independently review source coverage; only then generate runtime data and integrate consumer modules. Rendering design and the local dependency preparation can proceed in parallel after approval because they do not justify guessing missing gameplay facts.

The first vertical slice should prove the approved architecture using verified Tiny Woods/Thunderwave facts and a small accurately modeled starter/partner set. It is a development milestone, not a substitute deliverable for the requested full game. Final scope still requires the full approved coverage ledger.

### Work-package crosswalk

The P packages in [PLAN.md](PLAN.md) determine scheduling and ownership. `DATA-xx` identifiers above are factual blockers, not a second competing execution sequence. The decision IDs D01–D08 belong to PLAN; do not reuse them for data tasks. Asset production is assigned to P03/P06/P32 and detailed in RENDERING rather than creating separate A-numbered tasks here.

| Data/asset work | Owning PLAN packages | Relevant blockers / evidence |
| --- | --- | --- |
| Edition, licensing, source freeze, ID schema and coverage ledgers | P01–P02; canonical state in P07 | DATA-01–DATA-11; Appendix A identity evidence; source manifest |
| Engine source pinning, static tooling and vendor reproduction | P03–P04 | Section 6 and Appendix B; all files within the hook limit |
| Verified combat stats, moves, learning and abilities | P13–P14; whole catalog audit P33 | DATA-01–DATA-04; original numerical/effect corpus |
| Items, statuses, traps, weather and reset-rule data | P15–P16 | DATA-01, DATA-07–DATA-08; original item and dungeon rule records |
| Recruitment, movement/body size, Friend Areas, evolution and IQ | P17 | DATA-05–DATA-06; every species' obtainability route |
| Onboarding, town, missions, native/browser mail and version features | P19–P22, P31 | DATA-09–DATA-10; approved D01/D04 decisions |
| Dungeon floors, populations, rewards and campaign joins | P11, P23–P31 | DATA-07; CAMPAIGN records plus per-floor source coverage |
| Visual provenance, approved style and all creature/form assets | P03, P06, P32 | DATA-12; RENDERING asset manifest and shared budgets |
| Complete source/interaction audit, performance and manual evidence | P33–P35 | All blockers resolved or explicit scope decisions recorded; no unapproved missing rows |

## 9. Historical research and portable handoff

The review branch contains this appendix, its embedded 386-species ledger and [research/roster.json](research/roster.json). The raw CSV corpus, downloaded dependency archives/modules and temporary minifier were research-cache material. They are not prerequisites for reviewing this branch and must not be copied wholesale into the game or repository. Section 5 and Appendix B make the pinned factual seed reproducible; section 6 records dependency reproduction after approval.

Before the planning hold, four vendor files were briefly created under the proposed game folder: `vendor/three.module.js`, `vendor/three.core.js`, `vendor/LICENSE.three.txt`, and `vendor/VERSION.txt`. They have been parked outside this review branch and are excluded from its implementation state. No generated `species.js`, `moves.js` or data generator was produced by this research task; it made no root dependency/lockfile change or commit. No game tests or game execution occurred. A future executor starts from the committed plan and pinned inputs, not those historical files.

## 10. Sources

All links below were consulted on 2026-10-04 unless the linked source itself displays another modification date. These are evidence links, not an instruction to overwrite the approved source snapshot during a later build.

| ID | Source | Use |
| --- | --- | --- |
| G1 | [Original Red/Blue overview](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team) | Roster, starter/partner pool, learnset rule and version distinctions |
| G2 | [Tiny Woods, original sections and location navigation](https://bulbapedia.bulbagarden.net/wiki/Tiny_Woods) | Complete field-name navigation; excludes marked DX-only location |
| G3 | [Original walkthrough](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team) | Story and postgame grouping/segments |
| G4 | [Makuhita Dojo](https://bulbapedia.bulbagarden.net/wiki/Makuhita_Dojo) | Original maze set and Blue-only import |
| G5 | [Unknown Dungeon](https://bulbapedia.bulbagarden.net/wiki/Unknown_Dungeon_(Mystery_Dungeon)) | Off-screen Blue wireless feature |
| G6 | [Munchlax](https://bulbapedia.bulbagarden.net/wiki/Munchlax_(Pok%C3%A9mon)) | Original NPC-only status |
| G7 | [Unown Relic](https://bulbapedia.bulbagarden.net/wiki/Unown_Relic) | Form-specific recruitment/search |
| G8 | [Deoxys](https://bulbapedia.bulbagarden.net/wiki/Deoxys_(Pok%C3%A9mon)) | Original form changes and form effects |
| G9 | [IQ](https://bulbapedia.bulbagarden.net/wiki/IQ) | Evolution thresholds and IQ-gated learning |
| G10 | [Evolution in Mystery Dungeon](https://bulbapedia.bulbagarden.net/wiki/Evolution_(Mystery_Dungeon)) | Replacement evolution requirements |
| G11 | [Wide Slash](https://bulbapedia.bulbagarden.net/wiki/Wide_Slash_(move)) | PMD-exclusive typeless move |
| G12 | [Vacuum-Cut](https://bulbapedia.bulbagarden.net/wiki/Vacuum-Cut_(move)) | PMD-exclusive typeless move |
| G13 | [Tackle](https://bulbapedia.bulbagarden.net/wiki/Tackle_(move)) | Original PMD numerical distinction |
| G14 | [Ability, Mystery Dungeon section](https://bulbapedia.bulbagarden.net/wiki/Ability) | Simultaneous abilities and no Hidden Abilities |
| G15 | [Original item indices](https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_in_Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team) | Original item identity starting point |
| G16 | [Dungeon tiles/traps](https://bulbapedia.bulbagarden.net/wiki/Trap_(Mystery_Dungeon)) | RB trap availability and terrain distinctions |
| G17 | [Wonder Mail](https://bulbapedia.bulbagarden.net/wiki/Wonder_Mail) | Original regional code lengths and mission gating |
| G18 | [Friend Rescue](https://bulbapedia.bulbagarden.net/wiki/Friend_Rescue) | Rescue feature/state research starting point |
| G19 | [Recruitment](https://bulbapedia.bulbagarden.net/wiki/Recruitment) | Original recruited-individual capacity and recruitment research |
| T1 | [PokéAPI repository](https://github.com/PokeAPI/pokeapi) and [pinned data directory](https://github.com/PokeAPI/pokeapi/tree/bc92d3b6029ef1abe9e7ad424c400b338f3c11fe/data/v2/csv) | Structured factual reference corpus |
| T2 | [PokéAPI docs](https://pokeapi.co/docs/v2) and [about/provenance](https://pokeapi.co/about) | Historical fields and main-series scope |
| T3 | [Pinned PokéAPI license](https://github.com/PokeAPI/pokeapi/blob/bc92d3b6029ef1abe9e7ad424c400b338f3c11fe/LICENSE.md) | BSD-3-Clause notice |
| T4 | [pret/pmd-red](https://github.com/pret/pmd-red) and [data build metadata](https://github.com/pret/pmd-red/blob/master/data_monster.mk) | Potential factual reference; redistribution not approved |
| T5 | [Three WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html) | WebGL2 requirement |
| T6 | [Three license](https://github.com/mrdoob/three.js/blob/dev/LICENSE) and exact downloaded package license | MIT notice |
| T7 | [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Static hosting model |
| T8 | [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | Memory/batching/back-buffer principles |
| T9 | [W3C target-size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Accessibility baseline |
| T10 | [MDN reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | Motion preference |
| T11 | [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) | Persistence limitations |
| T12 | [esbuild API](https://esbuild.github.io/api/) | Temporary minification process |

## Appendix A. Exact 386-species identity ledger

The following identity ledger is checked-in review evidence derived from the pinned PokéAPI names/species CSV files. It is not a generated runtime dataset, and reviewing it requires no external cache or dataset download. Each numeric `dexNo` maps directly to `SpeciesId` `pokemon-NNN` (for example, 025 maps to `pokemon-025`); forms remain separate. Preserve original localized display spellings in a separate mapping when they differ from this source.

| Dex | Species | Dex | Species | Dex | Species |
| ---: | --- | ---: | --- | ---: | --- |
| 001 | Bulbasaur | 002 | Ivysaur | 003 | Venusaur |
| 004 | Charmander | 005 | Charmeleon | 006 | Charizard |
| 007 | Squirtle | 008 | Wartortle | 009 | Blastoise |
| 010 | Caterpie | 011 | Metapod | 012 | Butterfree |
| 013 | Weedle | 014 | Kakuna | 015 | Beedrill |
| 016 | Pidgey | 017 | Pidgeotto | 018 | Pidgeot |
| 019 | Rattata | 020 | Raticate | 021 | Spearow |
| 022 | Fearow | 023 | Ekans | 024 | Arbok |
| 025 | Pikachu | 026 | Raichu | 027 | Sandshrew |
| 028 | Sandslash | 029 | Nidoran♀ | 030 | Nidorina |
| 031 | Nidoqueen | 032 | Nidoran♂ | 033 | Nidorino |
| 034 | Nidoking | 035 | Clefairy | 036 | Clefable |
| 037 | Vulpix | 038 | Ninetales | 039 | Jigglypuff |
| 040 | Wigglytuff | 041 | Zubat | 042 | Golbat |
| 043 | Oddish | 044 | Gloom | 045 | Vileplume |
| 046 | Paras | 047 | Parasect | 048 | Venonat |
| 049 | Venomoth | 050 | Diglett | 051 | Dugtrio |
| 052 | Meowth | 053 | Persian | 054 | Psyduck |
| 055 | Golduck | 056 | Mankey | 057 | Primeape |
| 058 | Growlithe | 059 | Arcanine | 060 | Poliwag |
| 061 | Poliwhirl | 062 | Poliwrath | 063 | Abra |
| 064 | Kadabra | 065 | Alakazam | 066 | Machop |
| 067 | Machoke | 068 | Machamp | 069 | Bellsprout |
| 070 | Weepinbell | 071 | Victreebel | 072 | Tentacool |
| 073 | Tentacruel | 074 | Geodude | 075 | Graveler |
| 076 | Golem | 077 | Ponyta | 078 | Rapidash |
| 079 | Slowpoke | 080 | Slowbro | 081 | Magnemite |
| 082 | Magneton | 083 | Farfetch'd | 084 | Doduo |
| 085 | Dodrio | 086 | Seel | 087 | Dewgong |
| 088 | Grimer | 089 | Muk | 090 | Shellder |
| 091 | Cloyster | 092 | Gastly | 093 | Haunter |
| 094 | Gengar | 095 | Onix | 096 | Drowzee |
| 097 | Hypno | 098 | Krabby | 099 | Kingler |
| 100 | Voltorb | 101 | Electrode | 102 | Exeggcute |
| 103 | Exeggutor | 104 | Cubone | 105 | Marowak |
| 106 | Hitmonlee | 107 | Hitmonchan | 108 | Lickitung |
| 109 | Koffing | 110 | Weezing | 111 | Rhyhorn |
| 112 | Rhydon | 113 | Chansey | 114 | Tangela |
| 115 | Kangaskhan | 116 | Horsea | 117 | Seadra |
| 118 | Goldeen | 119 | Seaking | 120 | Staryu |
| 121 | Starmie | 122 | Mr. Mime | 123 | Scyther |
| 124 | Jynx | 125 | Electabuzz | 126 | Magmar |
| 127 | Pinsir | 128 | Tauros | 129 | Magikarp |
| 130 | Gyarados | 131 | Lapras | 132 | Ditto |
| 133 | Eevee | 134 | Vaporeon | 135 | Jolteon |
| 136 | Flareon | 137 | Porygon | 138 | Omanyte |
| 139 | Omastar | 140 | Kabuto | 141 | Kabutops |
| 142 | Aerodactyl | 143 | Snorlax | 144 | Articuno |
| 145 | Zapdos | 146 | Moltres | 147 | Dratini |
| 148 | Dragonair | 149 | Dragonite | 150 | Mewtwo |
| 151 | Mew | 152 | Chikorita | 153 | Bayleef |
| 154 | Meganium | 155 | Cyndaquil | 156 | Quilava |
| 157 | Typhlosion | 158 | Totodile | 159 | Croconaw |
| 160 | Feraligatr | 161 | Sentret | 162 | Furret |
| 163 | Hoothoot | 164 | Noctowl | 165 | Ledyba |
| 166 | Ledian | 167 | Spinarak | 168 | Ariados |
| 169 | Crobat | 170 | Chinchou | 171 | Lanturn |
| 172 | Pichu | 173 | Cleffa | 174 | Igglybuff |
| 175 | Togepi | 176 | Togetic | 177 | Natu |
| 178 | Xatu | 179 | Mareep | 180 | Flaaffy |
| 181 | Ampharos | 182 | Bellossom | 183 | Marill |
| 184 | Azumarill | 185 | Sudowoodo | 186 | Politoed |
| 187 | Hoppip | 188 | Skiploom | 189 | Jumpluff |
| 190 | Aipom | 191 | Sunkern | 192 | Sunflora |
| 193 | Yanma | 194 | Wooper | 195 | Quagsire |
| 196 | Espeon | 197 | Umbreon | 198 | Murkrow |
| 199 | Slowking | 200 | Misdreavus | 201 | Unown |
| 202 | Wobbuffet | 203 | Girafarig | 204 | Pineco |
| 205 | Forretress | 206 | Dunsparce | 207 | Gligar |
| 208 | Steelix | 209 | Snubbull | 210 | Granbull |
| 211 | Qwilfish | 212 | Scizor | 213 | Shuckle |
| 214 | Heracross | 215 | Sneasel | 216 | Teddiursa |
| 217 | Ursaring | 218 | Slugma | 219 | Magcargo |
| 220 | Swinub | 221 | Piloswine | 222 | Corsola |
| 223 | Remoraid | 224 | Octillery | 225 | Delibird |
| 226 | Mantine | 227 | Skarmory | 228 | Houndour |
| 229 | Houndoom | 230 | Kingdra | 231 | Phanpy |
| 232 | Donphan | 233 | Porygon2 | 234 | Stantler |
| 235 | Smeargle | 236 | Tyrogue | 237 | Hitmontop |
| 238 | Smoochum | 239 | Elekid | 240 | Magby |
| 241 | Miltank | 242 | Blissey | 243 | Raikou |
| 244 | Entei | 245 | Suicune | 246 | Larvitar |
| 247 | Pupitar | 248 | Tyranitar | 249 | Lugia |
| 250 | Ho-Oh | 251 | Celebi | 252 | Treecko |
| 253 | Grovyle | 254 | Sceptile | 255 | Torchic |
| 256 | Combusken | 257 | Blaziken | 258 | Mudkip |
| 259 | Marshtomp | 260 | Swampert | 261 | Poochyena |
| 262 | Mightyena | 263 | Zigzagoon | 264 | Linoone |
| 265 | Wurmple | 266 | Silcoon | 267 | Beautifly |
| 268 | Cascoon | 269 | Dustox | 270 | Lotad |
| 271 | Lombre | 272 | Ludicolo | 273 | Seedot |
| 274 | Nuzleaf | 275 | Shiftry | 276 | Taillow |
| 277 | Swellow | 278 | Wingull | 279 | Pelipper |
| 280 | Ralts | 281 | Kirlia | 282 | Gardevoir |
| 283 | Surskit | 284 | Masquerain | 285 | Shroomish |
| 286 | Breloom | 287 | Slakoth | 288 | Vigoroth |
| 289 | Slaking | 290 | Nincada | 291 | Ninjask |
| 292 | Shedinja | 293 | Whismur | 294 | Loudred |
| 295 | Exploud | 296 | Makuhita | 297 | Hariyama |
| 298 | Azurill | 299 | Nosepass | 300 | Skitty |
| 301 | Delcatty | 302 | Sableye | 303 | Mawile |
| 304 | Aron | 305 | Lairon | 306 | Aggron |
| 307 | Meditite | 308 | Medicham | 309 | Electrike |
| 310 | Manectric | 311 | Plusle | 312 | Minun |
| 313 | Volbeat | 314 | Illumise | 315 | Roselia |
| 316 | Gulpin | 317 | Swalot | 318 | Carvanha |
| 319 | Sharpedo | 320 | Wailmer | 321 | Wailord |
| 322 | Numel | 323 | Camerupt | 324 | Torkoal |
| 325 | Spoink | 326 | Grumpig | 327 | Spinda |
| 328 | Trapinch | 329 | Vibrava | 330 | Flygon |
| 331 | Cacnea | 332 | Cacturne | 333 | Swablu |
| 334 | Altaria | 335 | Zangoose | 336 | Seviper |
| 337 | Lunatone | 338 | Solrock | 339 | Barboach |
| 340 | Whiscash | 341 | Corphish | 342 | Crawdaunt |
| 343 | Baltoy | 344 | Claydol | 345 | Lileep |
| 346 | Cradily | 347 | Anorith | 348 | Armaldo |
| 349 | Feebas | 350 | Milotic | 351 | Castform |
| 352 | Kecleon | 353 | Shuppet | 354 | Banette |
| 355 | Duskull | 356 | Dusclops | 357 | Tropius |
| 358 | Chimecho | 359 | Absol | 360 | Wynaut |
| 361 | Snorunt | 362 | Glalie | 363 | Spheal |
| 364 | Sealeo | 365 | Walrein | 366 | Clamperl |
| 367 | Huntail | 368 | Gorebyss | 369 | Relicanth |
| 370 | Luvdisc | 371 | Bagon | 372 | Shelgon |
| 373 | Salamence | 374 | Beldum | 375 | Metang |
| 376 | Metagross | 377 | Regirock | 378 | Regice |
| 379 | Registeel | 380 | Latias | 381 | Latios |
| 382 | Kyogre | 383 | Groudon | 384 | Rayquaza |
| 385 | Jirachi | 386 | Deoxys | | |

## Appendix B. Portable pinned-input verification ledger

These hashes describe raw source bytes inspected during prerequisite research, not generated runtime output. CSV URLs use the exact pinned pattern in section 5. The license row names the upstream `LICENSE.md`; its historical local filename was `POKEAPI-LICENSE.txt`. Download only the sources needed for an approved package, outside the published game. The large learnset CSV must remain staging material and is not part of this review branch.

| PokéAPI source filename | Bytes | SHA-256 |
| --- | ---: | --- |
| `pokemon_species.csv` | 56,884 | `e66e2eeb25fd3836b0ebab6bf87bbf01960aa3c0555e2bac495fa8393c5e0c45` |
| `pokemon_species_names.csv` | 404,502 | `820cde17074cdb1c2b0595c997fb8f998e773bd5da3bb525dec85703c86c5fd9` |
| `pokemon.csv` | 47,082 | `16c81c33188b0eac403aa2f759fcbe9e42c611f722d263f5b5a6a5bff9f8ce6b` |
| `pokemon_types.csv` | 19,058 | `f1fc4bfd657a034ea3bf6972423b10276424aa068577b304a78a08996425ba05` |
| `pokemon_types_past.csv` | 428 | `02553c38e3871f99c7ed809b944066fea3f42ef6bccd4daba19274aca01fbff0` |
| `pokemon_stats.csv` | 94,392 | `fa2c44263a3706468682fefc3e0b3c4f5487fe9febed7d4ebcd6939c34b16aa8` |
| `pokemon_stats_past.csv` | 3,046 | `0a074d9581369c1df13d8d4f4015fd7215b896c5dfb58107f3b529f7156950d2` |
| `pokemon_moves.csv` | 10,733,699 | `22a807cef26891eeac0d0c900bd363e66baf421f7ee795bc7bc3e718f23b939e` |
| `moves.csv` | 42,322 | `8aafd37bf78f19471495c05b201545180f50f0a08a2a2a844d69f9837dd39ac9` |
| `move_names.csv` | 202,670 | `99e23ee38ea53d1473474d463b87651deac3cd4928750f8186feae66da45c147` |
| `move_changelog.csv` | 3,475 | `86c1511f6a0e29dcc5a885c5b8f125ffd502afbec9f69c7f2b85a3e0e8b001f8` |
| `types.csv` | 321 | `37f039c8d722f47d51ba1c5c5ecf9b7007235b1a9a1af2827645c777b70307c8` |
| `pokemon_evolution.csv` | 37,836 | `e78be51c8805551fffccd5551a556e752e4a76ff1b52482b53b409dd3882e1dd` |
| `pokemon_habitats.csv` | 104 | `30f6c3a82a1aa32be1280fcf4a8c138b1cdaf421399cbf9c0dd1a6aa2673b5df` |
| `pokemon_shapes.csv` | 146 | `acf1c6079fb3601ad1badae83c966ce6a5cf500e75e128415248772825d9b8cd` |
| `pokemon_colors.csv` | 92 | `02f0753b509eacc92eb7896e932f3e873d86697de6449491ecebb278b1e60c1a` |
| `items.csv` | 59,564 | `f08cd6dc30b447cb91cbe9232c79052e8521f32f6105bb1489b5bfabf4ca3241` |
| `item_names.csv` | 498,386 | `e286953dda52ceddb72c85079641f965bde6eab6fed2a576e292dce053a1af67` |
| `version_groups.csv` | 726 | `28da8d89d8eb4966941f81a9e62b3990510ed4d76dd774158246551a8e7707a7` |
| `move_meta.csv` | 20,555 | `93b92d5bddf4fc1536ca0a647c20453bf92e6389010f33ca6fc4c5e9c54363be` |
| `move_meta_ailments.csv` | 271 | `4c6e3ce3afe276478a45730de3d15f65496f646ce927c3e374b32295fbe24ed4` |
| `move_effect_prose.csv` | 253,898 | `f6d9bf0d28433a010a8b8b6a0a14d1ef72fbfcb997717f71b0e34483b7ee9697` |
| `move_meta_stat_changes.csv` | 2,091 | `489edd9ee45ea7e60c99c5a860c4c0957b337af21f8ae9bf03dd121fd548d5ab` |
| `LICENSE.md` | 1,621 | `1c04595dc662981c20956ae4251dfa7b62b475c345eddf98bc9b904cb2373f2c` |

The Three rows below are members of the exact `three@0.186.1` archive whose URL, integrity and archive SHA-256 are recorded in section 6. Preserve package-relative paths during extraction; future minified output needs its own recorded hashes.

| Three archive member | Bytes | SHA-256 |
| --- | ---: | --- |
| `package/build/three.module.js` | 662,772 | `9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea` |
| `package/build/three.core.js` | 1,458,113 | `9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6` |
| `package/LICENSE` | 1,081 | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |
