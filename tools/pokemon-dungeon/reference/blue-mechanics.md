# Blue Rescue Team opening mechanics

The browser implements the opening through Tiny Woods and Caterpie's rescue;
exact Nintendo DS parity and a completed game are not claimed. Mechanics produce
bounded committed events; presentation owns animation clocks.

Sources: [Nintendo's Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf),
comparative [`pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0`](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0),
and [original Tiny Woods corroboration](https://bulbapedia.bulbagarden.net/wiki/Tiny_Woods).
DX facts are excluded. `content/blue-source.json`, `content/blue-onboarding/` and
`games/pokemon-dungeon-reimagined/content/blue-opening.json` retain qualifications/hashes; see [facts](blue-facts.md).
[The immutable full record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-mechanics.md)
preserves dated audits, source addresses and detailed implementation evidence.

## Scope and population

- Three procedural floors B1F-B3F, then a rescue destination; choose B3F stairs
  to continue. No boss, recruits, traps, shop, Monster House or team formation.
- Sixteen original heroes plus optional Roux/ten original partner species,
  excluding shared types; both start at level
  five with qualified stats, ordered moves, EXP threshold and full PP.
- Level-one Pidgey/Sunkern/Wurmple throughout; Exeggcute/Hypnosis on B3F. Density
  four creates two or three flags; collisions can suppress realization. Arrivals
  attempt every 36 base beats, up to ten live wild actors.
- B1F/B2F money repeatedly halves its table index under 40 Poké: amounts
  4/6/10/14/22/26/34/38. B3F has Oran/Pecha; no Toolbox, one held slot per actor.
- Eight directions/corners, free facing/menu edits/Talk, attacks/PP/shortcut,
  fixed-point damage/types, statuses, EXP/learning, regen/hunger/wind/retry.
  Retry retains EXP/levels/moves, clears money/held items, restores PP and does
  not repeat the level-five boost.

Generation preserves bounded `dungeon_generation.c` rules: layout 1 has four
columns, two/three rows, only left-half columns active; minimum 30 room tiles,
two rooms and connectivity. Selection is stairs, item flags, leader, enemy flags.
Item density samples `[density-2,density+2)` (minimum 1); enemies sample
`[floor(density/2),density)`. Twice-as-many swaps as candidates precede consecutive
wraparound selection. Junctions exclude initial stairs/items/enemies; item flags
can overlap stairs, and leader placement excludes them before materialization.

Partner placement scans 121 `gUnknown_80F4598` offsets, same room first
(`dungeon_mon_spawn.c:sub_806B168`). Flags do not block it; covered wild spawns fail.
Actors precede items (`run_dungeon.c:335-360`); wild/items use independent random
scan starts; stairs suppress items. Arrivals try room tiles at least six tiles
from the leader on either axis, any room, then ordinary floor; occupancy, not
visibility, filters at most 1,792 tiles/pass (`dungeon_range.c:sub_8083660`).

Connection/merge/repair, initialization draws and complete native call order
remain adapted. [RNG](blue-rng.md) distinguishes new LCG/preseed saves from old
xoshiro saves; cartridge seed replay is unsupported. Admission validates bounded
identity/learnset/stat/resource/map/RNG shapes and a path to stairs.

## Prepared opportunities and statuses

`prepareDungeonTurn` begins at most one beat and runs scheduled leader upkeep
once: `input`, `forced`, or completed `advanced`. `getDungeonTurnPhase` is a pure
admission query; `completeForcedTurn` completes one prepared opportunity. The app
owns 60-frame cadence/interruption. Menus/input waiting do not advance others;
forced and unscheduled beats do.

All admitted actors have native speed 1. Stage 1 slots 3/7/11/15/19/23 and stage 0
slots 7/15/23 reduce to two beats; slowed/paralyzed actors act on the second,
checked before upkeep. Unscheduled leader beats have no timers, regeneration,
hunger, residuals, Bide or wind; scheduled others still act. Arrivals belong to
every 36th beat, wind to completed leader opportunities. Full 24-slot positive-
speed/multiaction scheduling remains unimplemented.

Current `STATUS_TICK_ORDER`: sleep; poison/burn/paralysis;
cringe/confusion/infatuation; Reflect/Light Screen/Counter/Protect/Safeguard;
Leech Seed; Focus Energy/Whiffer; slow. Save keys add end-turn Bide/Rage (18 keys).
Missing/zero/indefinite 127 retain their handling. Sources:
[`TickStatusAndHealthRegen`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_turn_effects.c#L396),
[`sub_80838EC`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_range.c#L342).
Sleep/infatuation expire before input; sleep 1 wakes without an extra pass. Bide 1
forces a pass and releases at its end (`dungeon_turn_effects.c:361-379`).

Swapped teammates get immediate upkeep/deferred walking end effects, then clear
their next skip flag without duplication (`dungeon_engine.c:157-173,228-238`,
`dungeon_entity_movement.c:262-278`). Swap Walk clears held-use requests and omits
ordinary AI Bide/infatuation blocking text. Sleep/confusion on either actor blocks
swaps (`dungeon_main.c:898-905`); Bide is not in that charge-status list. Stage-zero
`LowerSpeed` refuses without refresh/duration draw, including paralysis minimum
(`move_orb_effects_1.c:1391-1439`).

Optional `baseBeat`0-35 and `leaderPrepared` appear together. Old saves initialize
from `floorTurn % 36`, unprepared, without invented cartridge history; floors reset
both. Prepared resumes do not repeat upkeep; stairs wait for prepared input.
Forced interruption clears held input; unscheduled beats discard taps but retain
live directions (`dungeon_main.c:390-396`). Held B+A precedes L+A, spending one wait
per eligible opportunity with nonzero integer Belly; plain A is edge-triggered
(`:176-191`).

## Items and tutorials

The manual pp24-29 shows Moves/Items/Team/Others/Ground; its general Toolbox list
does not prove pre-Toolbox commands. Predicates: `dungeon_main.c:1088-1580`,
`dungeon_menu_items.c:566-808`, `dungeon_menu_others.c:447-561`.

| Context | Behavior |
| --- | --- |
| Ground berry | Get/Eat/Throw/Info; occupied leader slot disables Get |
| Held berry | Leader Eat/Info; partner Use/Info; no Give/Take/Place/held Throw/Swap |
| Ground Poké | Get/Throw/Info |
| Held Poké, indices 144-147 | Leader Info; partner Use leads to Second Thoughts without consumption |
| Others | Quicksave/Give Up/Mission Objectives |
| Zero PP | Menu/shortcut reject before turn loss; all-empty Struggle still requires set move (`dungeon_main.c:200-241`) |
| Partner Use | Next scheduled AI action; optional `useHeldItem` survives skipped beats, floor/retry clears it (`dungeon_action_handler.c:286-292`) |

B-moving with nonempty integer Belly suppresses leader pickup even if confusion
prevents running (`dungeon_main.c:465-474`, `dungeon_items.c:161-168`). Post-walk/
wake interaction visits moved nonleaders in slot order without held-slot or
visibility prefilters ([movement](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_entity_movement.c#L245),
[item owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_ai_items.c#L429)).
Team money precedes held-slot checks, so a berry-holding partner collects it;
occupied ordinary/wild slots report stepping on an item. Hero's earlier pickup
and late nonwalking receipt timing remain qualified.

Ground throws travel ten tiles, test 90% at first eligible actor and stop on miss;
wall-entry presentation precedes logical rollback (`dungeon_projectile_throw.c:32-228`,
`dungeon_config.c:207`). Berries cannot be caught: hit applies five Belly and
Oran 100 HP/Pecha poison cure/Rawst burn cure (`dungeon_item_action.c:84-105`). Only
indefinite 127 sleep ends. Drop searches 25 native offsets: walls/stairs/items
block, actors do not. All heroes have qualified `canThrowItems=true`.

Thrown money is caught whole by eligible empty-handed wild actors; team need
Item Catcher. Initial sleep ends first; timed sleep/infatuation/Bide block catches,
paralysis/confusion/cringe do not. Uncaught money costs one neutral HP regardless
of value, without EXP-mark changes/contact. Hop has 24 integer/sine steps plus
settle; no landing means no hop. Loss uses source X-coordinate macros on both
axes plus direction offset. Sources: [projectile](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_projectile_throw.c),
[item action](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_item_action.c),
[drop](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_items.c).
Artwork8/10/144 and audio356/711 are admitted; launch336/catch333/impact607/609
remain gaps. See [faint publication](blue-battle-visuals.md#final-faint-publication).

Touch THROW without a set item emits direct `regularAttack`
([Blue manual p12/PDF7](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=7));
keyboard/virtual A retain Talk interception. Ground Throw is separate; footage of
THROW facing a partner remains unestablished.

Tutorials show first unseen general flag/floor: attacks/protect partner, turns/menu,
then regeneration/B+A (`dungeon_message.c:611-623`). Pickup tips follow successful
leader currency/Oran/Pecha pickup only (`dungeon_items.c:183,256,291`); partner
pickup/use/full-slot steps do not trigger them. Flags survive retry; native
mid-turn tutorial suspension remains a presentation qualification.

## Tactics, IQ, Talk and bounded AI

Together follows visible leader; Go after foes/Avoid the first hit prefer closest
visible foe, otherwise leader. Avoid waits at distance 2 or turns away at1 if no
attack (`dungeon_data.c:50-79`, `dungeon_ai_movement.c:143-309`). IQ 1 enables Item
Catcher/Course Checker/Item Master; Dedicated Traveler/Exclusive Move-User start
off (`pokemon_3.c:465-476`). No Gummis spawn; retry-level higher tactics remain
unimplemented. Optional `tactic`/unique known `enabledIq` persist; absent historical
fields mean defaults. Tactic edits clear goals, not held-use; sleep/infatuation
block editing (`CheckVariousStatuses2(TRUE)`).

Dedicated Traveler tries movement then attack if blocked (`dungeon_ai.c:95-149`).
Exclusive Move-User removes regular opportunities, not all-empty Struggle. Course
Checker gates choices, not executed wall/ally penetration (`dungeon_ai_attack.c:830-883`).
Item Master checks self before ally throws: quarter-HP Oran/poisoned Pecha 100%
beside foe, 50% otherwise; burned Rawst 50%. Explicit Use bypasses need/probability/
Item Master. Standing pickup's empty-slot gate (`dungeon_ai_movement.c:106-141`)
is distinct from post-walk interaction.

Talk is free and paraphrased: archive response 2 at quarter HP, 1 at 60%, otherwise 0
(`data/dungeon_sbin.s`, `PartnerConversion0/2/15/27/28SIRO`). Menu faces south;
field Talk faces leader. Field action0x13 resets to Nothing inside input
(`dungeon_main.c:491-495,989-1004`), without hunger/wind/arrival/AI. Bide alone does
not block menu Talk (`sub_8070BC0`).

| Bounded correction | Remaining limit |
| --- | --- |
| 24 exact front/self/two-tile/line/corner IDs choose opportunity before targets; regular fallback captures facing. Nonempty pools draw even for one target. | Broader IQ/Struggle/no-foe policy remains adapted. |
| Opportunity uses `cumulative >= draw`, `[0,total)`; targets use `<0`. | Preserve distinct endpoints. |
| Front/two-tile order S/SE/E/NE/N/NW/W/SW, adjacent before distance 2; line/corner routes use actor-slot order. | Execution hits first actual actor; later enabled moves/confusion retain separate owners. |
| Four reviewed acquisition/direct-step sites use `targetSight` room+border/corridor-wall tests. | General `inSight`, camera/minimap, wake and memory consumers differ. |
| Five junction masks draw an eight-way start only with legal empty nonopposite branch. | Blocked/sole-opposite cases retain adapted waiting/ally skip. |
| Together partners/uniquely closest visible wild targets use legal empty sign-clamped direct steps without RNG. | Ties/blocked/occupied/alternate/remembered routes retain BFS. |
| Paralysis/cringe reject attack before charge/weights/RNG. Non-Dedicated confused AI prioritizes held items, then 70% attack choice before charge/weights; accepted attacks randomize facing even at zero PP. | Movement fallback remains; Dedicated/confused item/leader Walk and unsupported resolvers remain separate. Bide release retains facing. |

Sources: [opportunity](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_ai_attack.c#L271-L292),
[random bound](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_random.c#L42-L50),
`dungeon_logic.c:916-1044`, `dungeon_ai_movement.c:623-653`, `dungeon_pos_data.c:577`.
Binary floor/wall topology does not establish liquid/special mobility, pursuit,
room routing or complete Blue AI. Hero-only moves do not imply AI support.

## Damage, abilities and learning

Damage removes constant-neutral form/stat-item/clear-weather inputs and impossible
roster abilities Huge/Pure Power, Hustle, Intimidate, Thick Fat, Flash Fire,
Levitate, Swarm. Active ratios, fixed-point order, stages/types and RNG stay;
expansion needs review. Final damage may be zero (`dungeon_damage.c:1265-1378`):
no minimum-one clamp, hit or number. Positive `actorId` is attacker, `targetId`
recipient. [Coverage](blue-move-coverage.md)/[execution](blue-move-execution.md)
own passes, secondary gates and EXP.

Guts/Overgrow/Blaze/Torrent announce false-to-true evaluations via bits1/2/32/128,
reset floor/retry, persisted in saves (`dungeon_damage.c:820-865,1027-1038`,
`dungeon_logic.c:1425-1449`, `dungeon_mon_spawn.c:789-790`,
`dungeon_serializer.c:372-373`). Unrelated types do not clear type bits. Evaluation
precedes accuracy2; no-target/accuracy1 failures and early one-damage branches
bypass it (`dungeon_move.c:1333-1391`, `dungeon_damage.c:1125-1131`). Static/Cute Charm
use sampled flags after secondary effects, before duplicate/immunity checks
(`dungeon_move_util.c:238-268`). No new draw/native ability artwork/audio is implied.
Pickup excludes Tiny Woods; allied Pikachu is not Lightningrod-intercepted; Rock
Head does not block Struggle; Cloud Nine/Damp have no weather/explosion producer.
Popup visibility remains qualified.

Learning saves bounded leader/actor preparation/action/end continuations. Current
award/completed level stay committed; resumption finishes that recipient before
the next, without repeated action/upkeep/move draws
([EXP owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_leveling.c)).
Old saves drain queued choices without invented history. New records bind actor
identity/life, stage and EXP cursor; terminal states clear them. Thrown-money
pauses retire pose, retaining logical return. Exact Blue coroutine/manual choice
acceptance remains open.

## Charges and constriction

Skull Bash (Squirtle level 40) spends PP, stores slot/charge, boosts physical Defense;
release uses second-turn presentation without PP again. Invalid slot/life/status,
floor/class reset and reviewed action boundaries clear it. Autonomous charge
survives creation but clears after an action begun charged. Solar Beam
(Bulbasaur level 46/Chikorita level 50) spends PP/accuracy1 on self, then releases at current
front without PP/target draw; empty tiles consume charge. Its slot excludes
Skull Bash/Bide/Rage. Weather branches remain unadmitted.

Fire Spin/Whirlpool: nonzero damage reaches 10% secondary; fresh constriction
stores `4 + draw(3)`, countdown 0/effect 316 or 59. Duplicates preserve fields without
duration draw. Next completed action takes five residual damage, then every
second opportunity, before duration decrement. Walk/swap block; attacks/items/wait
remain legal. Heal Bell, successful Rapid Spin, floor/faint/expiry clear all-or-none
optional fields. No Freeze replacement/producer or `freeze` save key is admitted.

Duplicate Sing/Hypnosis/Sleep Powder draws duration before already-asleep checks,
keeps old timer/class, plays entry and reports duplication; Early Bird does not
adjust discarded duration (`dungeon_move.c:584-590`, `move_orb_actions_1.c:82-87`,
`move_orb_effects_1.c:37-96`).

## Verification boundary

Use authoring static lint/type/data checks; never import/execute game modules or
automate playthroughs. Archived passing checks apply to their checkpoints.
Manual review remains necessary for menus, movement/corners, PP, partner/items,
save/reload, faint/retry/stairs, learning, concurrent expiry and rescue. Exact
failure-item loss, full menu/IQ/tactic surfaces and message/animation timing remain
incomplete or unverified.
