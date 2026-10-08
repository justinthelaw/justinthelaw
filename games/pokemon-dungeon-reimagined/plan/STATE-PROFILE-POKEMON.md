# Profile and permanent Pokémon admission

These policies extend the independent joins in `content/state.js`; they are not
complete `CampaignContent`, opening definitions, effect handlers or save creation.
Call after canonical structural, identity and reciprocal graph validation.
`createProfilePolicy({onboarding,species})` admits supported selections and names.
`createPokemonPolicy({species,effects})` admits the supported permanent subset and
returns exact requirements for histories whose owners are still absent. Neither
mutates input. Invalid diagnostics take precedence over unresolved requirements;
each channel is capped at 100. Catalog disposal propagates to the caller.

## Original selection and names

`QUIZ_REVISION` is the authored browser encoding
`original-blue-onboarding-results-4643ebc8a10ecdbb-v1`, tied to the complete
onboarding results resource SHA-256
`4643ebc8a10ecdbb3fadcd7f145792f4bac330b11eb7ffc55e6bc3409212add1`.
`createQuizSelectionLookup` maps exactly the 13 sourced nature IDs × two result
columns to `quiz-${natureId}-${column}`. The column does not assert biological
sex or modify scores. The partner must be an accepted ordered pair. This is an
explicit browser crosswalk, not a native quiz save encoding or proof of answers.
A future change to the results mapping requires a new revision/migration.

The profile binds `originalHeroIdentity` and `originalPartnerIdentity`, starter
role/record IDs and origin outcome. Evolution starts at these saved originals;
current species is never used to reconstruct the quiz. The permanent policy
checks the remaining chain continuity. `createdAt` remains application metadata;
these source rules do not invent a native timestamp or browser clock policy.

Native initialization actually stores `Pokémon` in the team-name buffer.
`CheckQuest(QUEST_SET_TEAM_NAME)` is `ScriptVarScenarioAfter(MAIN, 2, -1)`;
the existing native comparison helper preserves the chapter-58 exception. That
exception makes the quest check false without resetting the name buffer; valid
retained names are admitted at chapter 58. Edit availability belongs to P19. Otherwise before
that boundary this policy requires the sourced default. Afterwards names require
one to ten character cells. No empty-string deferred-name convention exists.
The name-setting command and scenario advance must publish a coherent state;
intermediate naming screens do not change the saved profile before confirmation.

The finite browser name repertoire is the native keyboard's ASCII letters,
digits, space, `+ - , . ! ? :`, and these explicit character mappings:

| Native byte | Browser character |
| --- | --- |
| `85` | `⋯` |
| `91`, `92` | `U+2018`, `U+2019` |
| `93`, `94` | `U+201C`, `U+201D` |
| `BD`, `BE` | `♂`, `♀` |
| `E9` | `é` |

The regex uses Unicode escapes for distinct quote characters so repository quote
normalization cannot replace these source mappings with ASCII quotes.

Each listed code point is one source cell. No Unicode normalization, trimming,
case folding, profanity policy or proportional-width rejection is invented.
The source END handler rejects zero length; over-width names only render red.
Exact catalog species defaults also remain legal. Controls/empty/over-ten names
are invalid; unsupported other glyphs require `P19:name-native-glyph-crosswalk`.
Thus ordinary custom names and the entire sourced keyboard can return success.
The UI implementation and corrections for other input repertoires remain P19.

## IQ and tactics

`IQ_SKILLS` maps 23 real source symbols to branded `iq-*` IDs, each with its exact
threshold and mutually exclusive group. `IQ_NONE` is excluded. `TACTICS` maps
nine available symbols to branded `tactic-*` IDs and leader-level thresholds.
The two unused named tactics (All for One, Group Safety) and sentinel are excluded
(their source required level is 999). The identity lookup now owns these two
namespaces. Tables are recursively frozen rows and do not claim effect execution.

IQ is 1–999; enabled skills must be unique, meet thresholds and occupy distinct
groups. Initial Item Catcher, Course Checker and Item Master all require one
point and occupy distinct groups. The native starter tactic maps to
`tactic-lets-go-together`. `validateTacticSelection(id, leaderLevel)` provides the
complete sourced selection-time unlock check. The native menu uses the dungeon
leader's level, not the receiving member's level. Retained higher-level tactics
remain admissible after leader changes or level loss. Snapshot admission does not
invent historical selection receipts; P17 must invoke the concrete selection-time
helper when changing the tactic. All nine supported retained identities admit.

## Permanent records, growth and moves

Live records must be the exact roster object. Entry-history records must be the
exact entrant object in the selected active or suspended session with its exact
session ID. A `rescue-suspended` scope is rejected for permanent records: the
suspended run contains actors and entry history, not another permanent roster.
No actor level reset, HP/PP refill, temporary form or settlement projection is
applied to the permanent roster. Permanent forms must be explicitly persistent.
The current species' Friend Area must be owned and match the saved assignment;
source evolution copies the record and re-adds it into that destination area.
Economy continues to own aggregate area capacity and reserved inventory checks.

Level is 1–100, IQ 1–999 and total EXP 0–9,999,999. Permanent EXP is an integer
canonical Quantity (`denominator:1`) within the current species' level interval;
at level 100 the upper cap applies. Each natural stat is positive and bounded by
999 HP / 255 others; bonuses are nonnegative within the achievable component cap.
The authored browser decomposition is explicit: `naturalStats` is the currently
retained natural component and `permanentStatBonuses` is the currently retained
effective bonus component after prior saturation/loss. Their sum is the source's
stored effective stat and cannot exceed its cap. These are not uncapped lifetime
gains, and neither field is required to equal the current species' absolute
level table. Legitimate copied evolved or level-reduced stats are admissible
without inventing historical receipts the original save never stored.

P17 gain/level/evolution commands must preserve that normalized sum. Bonus gains
credit only the effective increase after saturation. Level changes preserve retained
bonuses while possible, reducing them only when necessary to keep natural ≥1 and
match the source effective total. Evolution preserves both components when source
copies stats. These deterministic attribution rules are controller-approved; the
commands remain unimplemented here. No hidden overflow gains are stored. This is an authored
interpretation of the existing fields, not a new schema or native decomposition.
Individual canonical evolution policy-ID authorization remains unresolved;
chain checks accept persistent forms and levels 1–100 without assuming evolution
levels are monotonic after possible level loss.

Move slots use sourced per-move Ginseng caps and zero permanent PP-capacity bonus.
Current PP belongs to actors, not permanent moves. Duplicate move IDs are allowed:
the accepted town teaching contract explicitly does not reject duplicates;
unique slot identities and contiguous nonoverlapping links remain graph rules.
Only linked heads may be set or AI-enabled. The exact nine charging moves cannot
link, including SolarBeam irrespective of weather. Higher-level learned moves
can survive level loss. Current/historical species level-up and auxiliary
learnsets establish supported acquisition membership; Smeargle's sourced Sketch
can permanently acquire canonical moves. Unsupported acquisition has a precise
`P17:permanent-move-acquisition:<move>` requirement. The four special starter
moves require IQ ≥333 for ordinary learning, with Sketch distinct. Internal
fallback actions without canonical move IDs are not fabricated as learned moves.

Starter provenance is concrete and can return success. Recruited records check
met level and historical actor/session/original species consistency, then require
`P17:permanent-recruitment-admission`. Scripted records require the exact
`P19:pokemon-grant:<id>`. Evolution-extra is restricted to distinct Shedinja with
valid creation revision and requires its `P17:evolution-extra:<policy>` owner.
Every normal evolution step requires `P17:evolution-policy:<id>` because the
accepted species catalog omits preEvolution/evolutionRequirements, and no accepted
per-edge condition table or canonical PolicyId-to-edge mapping exists. The fetched
comparative condition algorithm alone does not supply those catalog joins. This
is missing static relationship content, not a request for a historical command
receipt. A future complete edge table/crosswalk can admit supported history
without executing or attesting to its past command. These are real remaining permanent-policy
boundaries, not complete admission for all 413 persistent profiles.

## Source qualification and validation

Target remains original Blue Rescue Team. Existing onboarding/species/effects
qualifications are retained (including shared-original versus comparative EXP).
Additional lifecycle evidence is pinned original Red comparison, not a Blue ROM
build or byte-layout compatibility claim. Primary source root:
<https://github.com/pret/pmd-red/tree/6bcbec4f906938c0243aa2026bcbd41b577bab85>.

| Source path | Responsibilities |
| --- | --- |
| `include/constants/iq_skill.h`, `include/constants/tactic.h`, `src/dungeon_data.c` | Symbols, thresholds, groups' threshold join, special-move IQ |
| `src/pokemon_3.c` | IQ groups/defaults/threshold comparison and tactic enumeration |
| `src/dungeon_menu_team.c` | Tactic selection uses leader level |
| `include/constants/global.h`, `src/naming_screen.c`, `charmap.txt` | Ten-character bounds, finite glyph mapping, END/width distinction |
| `src/rescue_team_info.c`, `src/event_flag.c` | Actual initial name and MAIN naming boundary |
| `src/pokemon.c`, `src/pokemon_evolution.c` | Creation, raw learning, evolution copy/EXP reset/area re-add |
| `src/dungeon_leveling.c`, `src/dungeon_item_action.c` | EXP/stat/IQ caps, history-sensitive level loss, Ginseng |
| `src/moves.c` | Base PP, stored boost transport, link and AI/set normalization |

Only numerical facts, short symbol crosswalks and original policy code ship.
Original source cache stays outside the exported game tree. Static lint/types,
catalog integrity checks and independent textual/numerical comparisons are used;
no game module imports/execution, game tests or playthroughs are permitted.

The concrete opening join additionally verifies exact source level-one stats.
Non-HP natural components allow zero: accepted onboarding contains Bulbasaur
Special Defense 0, Charmander Defense/Special Defense 0 and Chikorita Special
Defense 0. HP remains positive. See `STATE-CAMPAIGN-CONTENT.md` for the initial
state and the canonical natural/bonus component bounds correction.
