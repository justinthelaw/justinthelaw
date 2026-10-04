# Research register and unresolved fidelity work

**Status:** research groundwork, not a complete executable specification or a claim that every original value is known. Read [PLAN.md](PLAN.md) for authority, scope and the stop-for-review instruction.

## What has been researched

The record covers the user-supplied Wikipedia overview and original Red/Blue walkthrough, chapter and dungeon pages, original Nintendo manuals, mechanics-specific pages, roster/forms/evolution, optional/version/Dojo modes, data provenance and primary browser/hosting documentation. The linked appendices synthesize this into implementable work packages; the JSON snapshots retain the detailed research context.

| Research snapshot | Main use | Authority limits |
| --- | --- | --- |
| [campaign.json](research/campaign.json) | Story sequence, floor/scene conventions, branch prerequisites, optional dungeons | Exact triggers and numerical tables still have named gaps |
| [systems.json](research/systems.json) | Manual controls, tactical mechanics, original constants, service and progression inventory | Does not contain the full original damage/growth/effect corpus |
| [roster.json](research/roster.json) | Species/modes inventory, source availability, data and browser feasibility | Earlier main-series adaptation suggestions are superseded by DATA.md |

The primary original manual links are retained even where a readable mirror was used. A mirror is not a separate independent corroboration. The source register records source identity; a successful retrieval is not proof that every interpretation is correct.

## Confidence and traceability rules

- **Original confirmed:** edition-specific evidence directly supports the exact field; cite source ID and location.
- **Corroborated:** two genuinely independent sources/observations agree; preserve edition and region.
- **Reference only:** main-series or modern data can seed identity or research, not silently supply PMD behavior.
- **Unresolved:** record the precise question, disagreement, affected task and release gate; do not invent values.
- **Approved adaptation:** record the user's decision, impact and disclosure; never re-label it original-confirmed.

Only specific sources may resolve original data. A broad walkthrough's narrative cannot override a detailed dungeon counter without examining whether it counts a terminal scene. A correct Gen III type/learnset does not establish PMD stats, PP, power, targeting or encounter weights. Source code and art licenses must be reviewed separately from the factual value being described.

## Highest-priority gaps before faithful implementation

| Gap family | Detail | Owner and next action |
| --- | --- | --- |
| Original numerical corpus | PMD level/stat/EXP tables, damage rounding, PP/power/accuracy, original abilities, recruit rates, body size, IQ/Friend Areas | DATA-01 through DATA-08 in [DATA.md](DATA.md); P01/P02 before consumers |
| Floor and scene semantics | Direct original-page counts versus walkthrough clearings; fixed floors, rest stops and boss inclusion | CAMPAIGN unresolved register; preserve normalized scene/floor distinction |
| Trigger timing | Number and type of completed jobs/day changes, NPC priority and specific postgame conjunctions | Campaign scene ledger; document direct original evidence before freezing gates |
| Deoxys/forms | FRLG default learnset gap, original per-floor forms and learning semantics | DATA-03; do not choose a convenient modern form |
| Legacy mail and modes | Exact codecs/checksums/regions, Blue wireless/off-screen modes, reproducible historic events | DATA-09/DATA-10 and D01/D04 user decisions |
| Visual production | Full roster/forms/clips and complete environments do not exist | D03/P03/P06/P32; obtain visual acceptance before scaling |
| User acceptance boundary | Manual play/visual review with automated game tests excluded | D05; preserve the current no-game-tests rule |

The detailed appendices retain additional concrete questions; this summary does not replace them. Resolving a gap requires updating its record, the affected content specification and coverage evidence together.

## Durable source register

Consulted 2026-10-04. Links are evidence references, not permission to scrape/copy entire prose, scripts or artwork. Research-local IDs in each JSON snapshot remain useful; ephemeral browser tool IDs have been removed.

| Source IDs | Source | Use |
| --- | --- | --- |
| campaign:base | [Source](https://bulbapedia.bulbagarden.net/wiki/Team_Base) | Edition-specific research reference |
| campaign:buried | [Source](https://bulbapedia.bulbagarden.net/wiki/Buried_Relic) | Edition-specific research reference |
| campaign:c1 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_1) | Edition-specific research reference |
| campaign:c10 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_10) | Edition-specific research reference |
| campaign:c11 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_11) | Edition-specific research reference |
| campaign:c2 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_2) | Edition-specific research reference |
| campaign:c3 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_3) | Edition-specific research reference |
| campaign:c4 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_4) | Edition-specific research reference |
| campaign:c5 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_5) | Edition-specific research reference |
| campaign:c6 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_6) | Edition-specific research reference |
| campaign:c7 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_7) | Edition-specific research reference |
| campaign:c8 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_8) | Edition-specific research reference |
| campaign:c9 | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_9) | Edition-specific research reference |
| campaign:darknight_relic | [Source](https://bulbapedia.bulbagarden.net/wiki/Darknight_Relic) | Edition-specific research reference |
| campaign:desert_region | [Source](https://bulbapedia.bulbagarden.net/wiki/Desert_Region) | Edition-specific research reference |
| campaign:dojo, systems:dojo, roster:bulba_dojo | [Source](https://bulbapedia.bulbagarden.net/wiki/Makuhita_Dojo) | Edition-specific research reference |
| campaign:fantasy_strait | [Source](https://bulbapedia.bulbagarden.net/wiki/Fantasy_Strait) | Edition-specific research reference |
| campaign:far_off_sea | [Source](https://bulbapedia.bulbagarden.net/wiki/Far-off_Sea) | Edition-specific research reference |
| campaign:faraway | [Source](https://bulbapedia.bulbagarden.net/wiki/Mt._Faraway) | Edition-specific research reference |
| campaign:freeze | [Source](https://bulbapedia.bulbagarden.net/wiki/Mt._Freeze) | Edition-specific research reference |
| campaign:gardevoir | [Source](https://bulbapedia.bulbagarden.net/wiki/Gardevoir_(Red_and_Blue_Rescue_Team)) | Edition-specific research reference |
| campaign:grand_sea | [Source](https://bulbapedia.bulbagarden.net/wiki/Grand_Sea) | Edition-specific research reference |
| campaign:great | [Source](https://bulbapedia.bulbagarden.net/wiki/Great_Canyon) | Edition-specific research reference |
| campaign:howling | [Source](https://bulbapedia.bulbagarden.net/wiki/Howling_Forest) | Edition-specific research reference |
| campaign:index, roster:bulba_walkthrough | [Source](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team) | Edition-specific research reference |
| campaign:joyous | [Source](https://bulbapedia.bulbagarden.net/wiki/Joyous_Tower) | Edition-specific research reference |
| campaign:legend | [Source](https://bulbapedia.bulbagarden.net/wiki/Ninetales_legend) | Edition-specific research reference |
| campaign:magma | [Source](https://bulbapedia.bulbagarden.net/wiki/Magma_Cavern) | Edition-specific research reference |
| campaign:main, systems:overview, roster:bulba_game | [Source](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team) | Edition-specific research reference |
| campaign:marvelous_sea | [Source](https://bulbapedia.bulbagarden.net/wiki/Marvelous_Sea) | Edition-specific research reference |
| campaign:meanies | [Source](https://bulbapedia.bulbagarden.net/wiki/Team_Meanies) | Edition-specific research reference |
| campaign:murky | [Source](https://bulbapedia.bulbagarden.net/wiki/Murky_Cave) | Edition-specific research reference |
| campaign:oddity_cave | [Source](https://bulbapedia.bulbagarden.net/wiki/Oddity_Cave) | Edition-specific research reference |
| campaign:official_nintendo | [Source](https://www.nintendo.co.jp/ds/aphjb24j/index.html) | Edition-specific research reference |
| campaign:official_pokemon | [Source](https://www.pokemon.com/us/pokemon-video-games/pokemon-mystery-dungeon-blue-rescue-team-and-pokemon-mystery-dungeon-red-rescue-team/) | Edition-specific research reference |
| campaign:purity | [Source](https://bulbapedia.bulbagarden.net/wiki/Purity_Forest) | Edition-specific research reference |
| campaign:remains_island | [Source](https://bulbapedia.bulbagarden.net/wiki/Remains_Island) | Edition-specific research reference |
| campaign:silent | [Source](https://bulbapedia.bulbagarden.net/wiki/Silent_Chasm) | Edition-specific research reference |
| campaign:silver | [Source](https://bulbapedia.bulbagarden.net/wiki/Silver_Trench) | Edition-specific research reference |
| campaign:sky | [Source](https://bulbapedia.bulbagarden.net/wiki/Sky_Tower) | Edition-specific research reference |
| campaign:solar_cave | [Source](https://bulbapedia.bulbagarden.net/wiki/Solar_Cave) | Edition-specific research reference |
| campaign:southern_cavern | [Source](https://bulbapedia.bulbagarden.net/wiki/Southern_Cavern) | Edition-specific research reference |
| campaign:square, systems:square | [Source](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Square) | Edition-specific research reference |
| campaign:thunderwave | [Source](https://bulbapedia.bulbagarden.net/wiki/Thunderwave_Cave) | Edition-specific research reference |
| campaign:tiny, roster:bulba_nav | [Source](https://bulbapedia.bulbagarden.net/wiki/Tiny_Woods) | Edition-specific research reference |
| campaign:unown_relic, roster:bulba_unown | [Source](https://bulbapedia.bulbagarden.net/wiki/Unown_Relic) | Edition-specific research reference |
| campaign:uproar | [Source](https://bulbapedia.bulbagarden.net/wiki/Uproar_Forest) | Edition-specific research reference |
| campaign:waterfall_pond | [Source](https://bulbapedia.bulbagarden.net/wiki/Waterfall_Pond) | Edition-specific research reference |
| campaign:wish | [Source](https://bulbapedia.bulbagarden.net/wiki/Wish_Cave) | Edition-specific research reference |
| campaign:wyvern_hill | [Source](https://bulbapedia.bulbagarden.net/wiki/Wyvern_Hill) | Edition-specific research reference |
| graphics:webgl-practices | [Source](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | GPU resource, batching and memory guidance |
| graphics:webgl-renderer | [Source](https://threejs.org/docs/pages/WebGLRenderer.html) | WebGL 2 baseline and renderer API |
| overview:wikipedia | [Source](https://en.wikipedia.org/wiki/Pok%C3%A9mon_Mystery_Dungeon:_Blue_Rescue_Team_and_Red_Rescue_Team) | User-supplied overview; use specific original-edition sources for implementation |
| platform:pages | [Source](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | Published site and transfer constraints |
| roster:bulba_deoxys | [Source](https://bulbapedia.bulbagarden.net/wiki/Deoxys_(Pok%C3%A9mon)) | Deoxys changes form each dungeon floor; stats are stage modifiers. |
| roster:bulba_munchlax | [Source](https://bulbapedia.bulbagarden.net/wiki/Munchlax_(Pok%C3%A9mon)) | NPC only in original PMD; unobtainable. |
| roster:bulba_unknown | [Source](https://bulbapedia.bulbagarden.net/wiki/Unknown_Dungeon_(Mystery_Dungeon)) | Blue-only off-screen wireless feature, not a traversable map. |
| roster:github_pages | [Source](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Static HTML/CSS/JavaScript hosting. |
| roster:mdn_motion | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | Reduced-motion preference. |
| roster:mdn_storage | [Source](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) | Origin-scoped storage, exceptions, undefined file URL behavior. |
| roster:pmd_data_make | [Source](https://github.com/pret/pmd-red/blob/master/data_monster.mk) | References monster_data.json and learnset_data.json. |
| roster:pmd_decomp | [Source](https://github.com/pret/pmd-red) | PMD-specific reference; decompilation, no license established by this research. |
| roster:pokeapi_about | [Source](https://pokeapi.co/about) | Main-series data scope and provenance. |
| roster:pokeapi_docs | [Source](https://pokeapi.co/docs/v2) | Generation history and version-specific learnsets. |
| roster:pokeapi_license | [Source](https://github.com/PokeAPI/pokeapi/blob/master/LICENSE.md) | License retention and non-endorsement conditions. |
| roster:pokeapi_repo | [Source](https://github.com/PokeAPI/pokeapi) | CSV data source and BSD-3-Clause repository license. |
| roster:pokeapi_species | [Source](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_species.csv) | Machine-readable species facts. |
| roster:three_license | [Source](https://github.com/mrdoob/three.js/blob/dev/LICENSE) | MIT; retain license notice. |
| roster:w3c_targets | [Source](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | WCAG 2.2 AA target size baseline is 24 CSS pixels, with exceptions. |
| systems:areas | [Source](https://bulbapedia.bulbagarden.net/wiki/Friend_Area) | Friend Areas |
| systems:battle | [Source](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_battle_(Mystery_Dungeon)) | Pokémon battle (Mystery Dungeon) |
| systems:blue_manual | [Source](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf) | Nintendo Blue Rescue Team instruction manual |
| systems:cave | [Source](https://bulbapedia.bulbagarden.net/wiki/Luminous_Cave) | Luminous Cave |
| systems:evolution | [Source](https://bulbapedia.bulbagarden.net/wiki/Evolution_(Mystery_Dungeon)) | Evolution (Mystery Dungeon) |
| systems:food | [Source](https://bulbapedia.bulbagarden.net/wiki/Food_(Mystery_Dungeon)) | Food (Mystery Dungeon) |
| systems:houses | [Source](https://bulbapedia.bulbagarden.net/wiki/Monster_House) | Monster House |
| systems:iq | [Source](https://bulbapedia.bulbagarden.net/wiki/IQ) | IQ |
| systems:jobs | [Source](https://bulbapedia.bulbagarden.net/wiki/Job_(Mystery_Dungeon)) | Job (Mystery Dungeon) |
| systems:links | [Source](https://bulbapedia.bulbagarden.net/wiki/Linked_move) | Linked move |
| systems:misc | [Source](https://bulbapedia.bulbagarden.net/wiki/Mystery_Dungeon_game_mechanics) | Mystery Dungeon game mechanics |
| systems:quiz | [Source](https://bulbapedia.bulbagarden.net/wiki/Personality_Quiz_(Mystery_Dungeon)) | Personality Quiz |
| systems:rank | [Source](https://bulbapedia.bulbagarden.net/wiki/Rank_(Mystery_Dungeon)) | Rank (Mystery Dungeon) |
| systems:recruit, roster:bulba_recruit | [Source](https://bulbapedia.bulbagarden.net/wiki/Recruitment) | Recruitment |
| systems:red_manual | [Source](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/game_boy_advance_8/Manual_GameBoyAdvance_PokemonMysteryDungeonRedRescueTeam_EN.pdf) | Nintendo Red Rescue Team instruction manual |
| systems:regular | [Source](https://bulbapedia.bulbagarden.net/wiki/Regular_attack) | Regular attack |
| systems:rescue | [Source](https://bulbapedia.bulbagarden.net/wiki/Friend_Rescue) | Friend Rescue |
| systems:shops | [Source](https://bulbapedia.bulbagarden.net/wiki/Kecleon_Shop) | Kecleon Shop |
| systems:stats | [Source](https://bulbapedia.bulbagarden.net/wiki/Stat_(Mystery_Dungeon)) | Stat (Mystery Dungeon) |
| systems:statuses | [Source](https://bulbapedia.bulbagarden.net/wiki/Status_condition_(Mystery_Dungeon)) | Status condition (Mystery Dungeon) |
| systems:storage | [Source](https://bulbapedia.bulbagarden.net/wiki/Kangaskhan_Storage) | Kangaskhan Storage |
| systems:tiles | [Source](https://bulbapedia.bulbagarden.net/wiki/Dungeon_tile) | Dungeon tile |
| systems:traps | [Source](https://mysterydungeonwiki.com/wiki/Rescue_Team:Trap) | Rescue Team:Trap |
| systems:versions | [Source](https://mysterydungeonwiki.com/wiki/Rescue_Team:Version_Differences) | Rescue Team:Version Differences |
| systems:wonder | [Source](https://bulbapedia.bulbagarden.net/wiki/Wonder_Mail) | Wonder Mail |
| campaign:snow_path | [Source](https://bulbapedia.bulbagarden.net/wiki/Snow_Path) | Original Snow Path entry and return junctions; reviewed 2026-10-04 |
