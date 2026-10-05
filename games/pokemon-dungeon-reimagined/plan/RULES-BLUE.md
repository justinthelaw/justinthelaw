# Blue rules revision 1

## Scope and authority

- **Package:** P01, first source-audit sub-batch; recorded 2026-10-04.
- **Authorization:** Justin's instruction to continue implementation after
  [planning PR #387](https://github.com/justinthelaw/justinthelaw/pull/387) merged.
- **Profile:** [research/blue-rules-v1.json](research/blue-rules-v1.json).
- **State:** partial source freeze. P01 remains incomplete; the profile has
  `runtimeReady: false` and supplies evidence for schema/inventory work.
- **Edition:** original Nintendo DS Blue Rescue Team. Each record retains its
  evidence's region; regional equivalence is not assumed.
- **Evidence:** newly retrieved manual/reference pages, qualified facts and
  unresolved questions. No cartridge play, save comparison or game-source
  execution was performed.

## Reading the profile

| Field | Contract |
| --- | --- |
| `rulesRevision` | Stable identity of this evidence revision; future factual changes require a new revision or an explicit correction record |
| `status: verified` | The stated field is supported by its cited source and edition qualifier; `evidenceLevel` distinguishes manual from reference support |
| `status: blocked` | `value` is null; `unverifiedContext` is a research lead, never an executable default |
| `evidence` | Source ID plus a section/page locator; the source register resolves each ID to a URL |
| `retrievalStatus` | Distinguishes this audit's retrievals from inherited candidate references |
| `independenceGroup` | Groups the same source URL; aliases, mirrors and related wiki prose do not establish independent corroboration |
| `systemFamilies` | Maps all 26 existing system coverage rows to owners, supported records, source candidates and specific remaining questions |
| `affectedGaps` | Links the field to existing DATA/CAMPAIGN gaps or SYSTEMS tasks; an individual supported field does not close an entire gap |

Use the profile as documentation. Runtime modules must not import anything
from `plan/`. Source retrieval, static review, gameplay implementation and
manual acceptance remain separate evidence states.

## Supported foundations

| Subject | Supported field | Records and source |
| --- | --- | --- |
| Action cadence | Ordinary dungeon actions advance encounters; idle decision time does not | `P01-MECH-TURN-01`; [Blue manual, printed p.30](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=16) |
| Type factors | Nominal 1.5 / 0.9 / 1 / 0.5; dual-type factors multiply | `P01-MECH-TYPE-01/02`; [original type reference](https://mysterydungeonwiki.com/wiki/Rescue_Team:Type#Damage_multiplier) |
| Abilities | Both original ability slots apply; per-ability ordering is still open | `P01-MECH-ABILITY-01`; [series section](https://bulbapedia.bulbagarden.net/wiki/Ability#Pok%C3%A9mon_Mystery_Dungeon_series) |
| Team limits | General departure cap 3; dungeon total cap 4; combined body-size cap 6 | `P01-MECH-PARTY-01/02`; [original row and body-size section](https://mysterydungeonwiki.com/wiki/Pkmn:Team_Mechanics#Max_Party_Members_and_Allies) |
| Rescue ranks | Normal starts; Bronze 50, Silver 500, Gold 1,500, Platinum 3,000, Diamond 7,500, Lucario 15,000 | `P01-MECH-RANK-01`; [original rank table](https://bulbapedia.bulbagarden.net/wiki/Rank_(Mystery_Dungeon)#Red_and_Blue_Rescue_Team) |
| Map counts | Specific original dungeon counts are retained separately from terminal-scene interpretation | `P01-CAMPAIGN-*`; per-dungeon sources and limits in the profile |
| Reset dungeons | Original level-1 entry and narrowly documented restoration/restrictions | `P01-RESET-*`; [Wish](https://bulbapedia.bulbagarden.net/wiki/Wish_Cave#Generation_III), [Joyous](https://bulbapedia.bulbagarden.net/wiki/Joyous_Tower#Gameplay), [Purity](https://bulbapedia.bulbagarden.net/wiki/Purity_Forest#Gameplay) |

The original type reference reports 58982/65536 for nominal 0.9. Its complete
arithmetic context is unverified: P13 must resolve `P01-MECH-TYPE-03` before
using decimal shorthand or candidate fixed-point values in exact combat code.
The party limits do not supply species sizes, guest-slot rules or dungeon
overrides. Rank thresholds do not specify job rewards.

## Blue and Red comparison boundary

| Original capability | Blue implementation consequence | Evidence / remaining work |
| --- | --- | --- |
| Buttons, touch and two displays | Apply the approved browser control overlay and menu layout | `P01-BLUE-INPUT`; [manual pp.8-13](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=5) |
| Wireless/password mail; dual-slot rescue and Dojo team exchange | D04 browser codes/files and imported-team equivalents; retain content/progression | `P01-BLUE-EXCHANGE`; [manual pp.42-48](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=22); complete P21/P31 contracts |
| Blue Contact Mode | Retain an off-screen expedition equivalent | `P01-BLUE-CONTACT`; [manual pp.51-52](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=26); unlock/reward semantics remain open |
| Version-native availability and Wonder Mail unlocks | Preserve every species' Blue acquisition path; Red lists are comparison evidence | `P01-BLUE-VERSION-ROSTER`; [version tables and Korean exception](https://mysterydungeonwiki.com/wiki/Rescue_Team:Version_Differences#Version_Exclusive_Pok%C3%A9mon) |

D04 does not claim cartridge compatibility. The browser payload, reward guards,
event access and exact capability mapping remain in `P01-BLUE-EQUIVALENTS`.
DX/Explorers mechanics and an edition selector remain outside the approved
product scope. Browser checkpoint saving follows the approved
[SYSTEMS policy](SYSTEMS.md#fixed-browser-checkpoint-policy), rather than being
labeled original cartridge saving.

## Remaining P01 questions

| Priority | Records / dependent packages | Evidence needed |
| --- | --- | --- |
| 1 | `P01-MECH-TURN-02`, `P01-MECH-SPEED-02`; P12-P17 | Blue phase order, speed opportunity/duration units, mid-turn changes and transition preemption; resolve conflicting slowdown counter descriptions |
| 2 | `P01-MECH-TYPE-03`, `P01-MECH-ABILITY-02`; P13-P15 | Original fixed-point operations, rounding/clamps and ability interaction order |
| 3 | `P01-RESET-OUTCOME-MATRIX`, `P01-RESET-PURITY-HELD-ITEMS`; P08/P15/P16/P30/P31 | Field-by-field restoration for each exit/rescue outcome; resolve the Purity held-item exception |
| 4 | `P01-CAMPAIGN-TERMINAL-LABELS`, Howling/Pitfall scene records; P11 and campaign owners | Original on-screen labels, procedural/fixed/terminal boundaries and first/repeat transitions |
| 5 | Gengar/Wish blocked records; P20/P22/P30 | Exact day/interaction predicates and Stormy Sea necessity, using original evidence that distinguishes the conditions |
| 6 | DATA-01 through DATA-10 and the family ledger | Complete numerical/content tables and browser-mode specifications before their respective consumers |

The Gengar audit adds an [original Serebii prerequisite description](https://www.serebii.net/mysteriousdungeon/dungeon/28.shtml)
that also names Stormy Sea. The walkthrough's omission does not establish the
opposite. Shared guide agreement does not prove the original program's
condition, so the unlock predicate remains blocked.

Resolve each question with permitted original evidence or document an explicit
user-approved adaptation. Keep inaccessible evidence, inferred map boundaries
and candidate constants visible; do not close a gap from agreement counts.

## Acceptance and handoff

- Static audit checks JSON structure, IDs, source references, coverage joins,
  blocked null values, package ownership and relative document links.
- Focused review checks edition/region qualifiers and unsupported completion
  claims; [PROGRESS.md](PROGRESS.md) records actual findings and commands.
- This sub-batch adds no runtime entry point, gameplay tests, assets or website
  behavior. P02-P37 and manual gameplay acceptance remain unstarted.
- Next: P01 priority 1, then the other blocking questions above. Preserve the
  existing P06/P10 visual reviews and P36/P37 publication gates.
