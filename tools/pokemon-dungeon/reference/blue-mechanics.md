# Blue Rescue Team opening mechanics

Status: a browser implementation of the opening, with qualified original-game
facts. **This is not a claim of exact Nintendo DS parity or a completed game.**

## Sources and boundaries

- [Nintendo's Blue Rescue Team manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
  verifies separate regular attacks/moves, PP, turn-based movement, facing,
  diagonal/run controls, top-screen modes, partner naming before awakening,
  and hero naming during awakening.
- [pret/pmd-red](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0)
  is comparative Red source, **not a verified Blue executable**. The inspected
  revision is `013475aa04f5be3191e5527c186d9bfceae7cae0`; no ROM was downloaded.
  Useful owners: `src/personality_test1.c`, `src/dungeon_generation.c`,
  `src/dungeon_items.c`, `src/dungeon_turn_effects.c`,
  `src/dungeon_wild_mon_spawn.c`, `src/dungeon_move_util.c`,
  `src/data/ground/ground_data_d01p01_station.h` and `d01p02_station.h`.
- Existing `content/onboarding`, `content/species`, `content/dungeons` and
  `content/effects` retain their original Blue/shared/Red source qualifications.
  `export-blue-opening.mjs` projects factual JSON without executing game code.
  `content/blue-opening.json` records the SHA-256 of every input JSON resource.
- [Tiny Woods corroboration](https://bulbapedia.bulbagarden.net/wiki/Tiny_Woods)
  distinguishes the original game's three floors, enemies and berry reward
  from Rescue Team DX. DX's levels, encounters and reward are not used.

## Implemented scope

- Exactly three procedural Tiny Woods floors, labeled B1F–B3F, followed by a
  separate rescue destination. The B3F entrance does not complete the rescue;
  the player must reach and choose the final stairs. No boss, recruits, traps,
  shop, Monster House, later dungeon or team formation is activated.
- All 16 original heroes and the original ten-species partner pool; shared
  types are excluded. Both enter at level five with the qualified species
  stats, move order, experience threshold and full PP. A data-only comparison
  confirmed all 16 against the existing starting-profile catalog.
- Level-one Pidgey, Sunkern and Wurmple on all three floors; Exeggcute on B3F.
  Exeggcute's level-one move is Hypnosis. Initial enemy density four produces
  two or three spawn flags; an occupied partner tile can suppress a spawn.
  Arrival attempts occur every 36 normal-speed base beats, up to ten live wild actors. Source
  encounter threshold boundaries are retained.
- B1F/B2F money uses the source lookup and repeated index halving under a
  40-Poké bound: possible amounts are 4, 6, 10, 14, 22, 26, 34 and 38.
  B3F has Oran/Pecha berries. Without a toolbox, each actor has one held slot;
  an occupied slot leaves the next berry on the ground. Money, eating, pickup,
  commanding partner-held berry use and throwing a ground berry are implemented.
- Eight-direction movement, corner checks, facing without time passing,
  regular attacks, move PP, partner move toggles, one selected shortcut,
  source-derived fixed-point damage/type rules, early move/status handlers,
  EXP/growth/learning, HP regeneration, hunger, wind timeout and retry.
- Holding B while moving with nonempty integer Belly suppresses leader item
  pickup, independently of whether confusion prevents the running animation.
  `src/dungeon_main.c:465-474` sets the walk pickup parameter to zero and
  `src/dungeon_items.c:161-168` only reports stepping on the item. The move
  command carries this flag separately from presentation speed.
- Partner swaps reject supported Sleep and Confusion on either participant,
  matching `sub_805EC4C` (`src/dungeon_main.c:898-905`). Confused random movement
  cannot bypass that guard and displace the partner. Bide is not a member of
  the separate native two-turn charging list and is not excluded by analogy.
- The domain has no animation clock. One player or automatic opportunity
  produces a bounded event list. Waiting for player input and open menus do not
  advance enemies; forced inactivity and unscheduled leader beats do.
  Save admission validates bounded shapes, IDs, learned moves, species stats,
  numeric resources, map occupancy, RNG and a path to the stairs.

## Remaining fidelity gaps

- Browser xoshiro randomness is independent of the DS generator and call
  schedule. Geometry reuses the existing original-derived generator with its
  bounded connectivity repairs. Population placement follows the source rules
  documented below, but the full initialization draw schedule is adapted; no
  cartridge seed replay or tile-for-tile dungeon claim is supported.
- AI uses compact pathfinding, local foe selection, following and wandering.
  This does not reproduce the full native movement/IQ/tactic decision tree.
  The scheduler implements the admitted normal/slowed speed rows and forced
  leader passes described below; the full native phase/speed repertoire and
  some status ordering remain incomplete. Learning choices are presented after the
  current browser turn, rather than through native suspended continuations.
- Later moves attainable through extensive repeated tutorial grinding retain
  factual learnsets, but distinct effects such as Pay Day, Charm, weather and
  charging are not all implemented. `isMoveSupported` explicitly rejects these
  actions without PP or turn loss; they must not silently become plain damage.
- The complete original menu/IQ/tactic surfaces, exact failure-item loss and
  all animation/message timing remain unverified or incomplete. The opening
  has no toolbox, so its held-item pages do not offer transfer or Place.
  Retry currently clears money and held items and retains EXP
  and levels; it does not apply the initial level-five boost again.
- Source-backed numbers do not prove complete behavior. This module has no
  claim concerning exact sprites, audio, dialogue, DS layout or cinematics.

## Verification and next manual review

- Own-file ESLint passed. The official independent typecheck passed after the
  initial implementation; later concurrent app edits produced app-only errors.
  Re-run the full check after integration.
- `export-blue-opening.mjs --check` passed. Data-only comparison verified all
  16 starting stats, move order and PP. No tests imported/executed game source.
- Manually inspect all starter menus, blocked diagonal movement, facing/menu
  actions without turns, ordinary/move attacks, depleted PP, partner following,
  held/ground berries, save/reload, both faint routes, retries, each stair and
  the Caterpie/reunion stopping boundary. Compare Blue footage separately;
  static checks do not establish playability or visual acceptance.

## Tiny Woods population audit, 2026-10-10

The opening-only `mechanics-generation.js` follows the inspected comparative
[Red source revision](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0)
for the following bounded rules. This does not change the version-one save shape
or reject an earlier valid opening save because its generated floor differs.

- `GenerateFloor` and `InitDungeonGrid` select layout 1 as four grid columns,
  two or three rows, with only the left half of the columns active. The reused
  geometry already had this small-floor extent. Long corridors alone are not
  evidence of an incorrect floor size. Admission now also requires the source
  minimum of 30 room tiles, in addition to two rooms and connectivity.
- `SpawnNonEnemies` and `SpawnEnemies` in `src/dungeon_generation.c` select
  stairs, item flags, leader, then enemy flags. Positive item density varies
  over `[density-2,density+2)` with a minimum of one; enemy density varies over
  `[floor(density/2),density)`. Tiny Woods therefore retains one to three item
  flags and two or three enemy flags. Counts come from the floor data, not
  replacement constants. Actual counts can be lower after native collisions.
- `ShuffleSpawnPositions` makes twice as many random swaps as candidate tiles,
  then selects consecutive positions from a random index with wraparound. Room
  junctions are excluded from initial enemies as well as stairs and items.
  Item flags may overlap stairs; the leader excludes the item flag even when
  that item will not materialize. Unoccupied stairs can be the leader spawn.
- `sub_806B168` in `src/dungeon_mon_spawn.c` searches the first 121 offsets in
  `gUnknown_80F4598`, same room first, then any standable tile. The pair uses
  this ordered placement rather than a random neighboring tile. An item or
  enemy flag does not block the partner. A wild spawn covered by the partner
  fails instead of relocating elsewhere.
- `run_dungeon.c:335-360` realizes the party and wild actors before floor
  items. `SpawnWildMonsOnFloor` and `CreateFloorItems` scan from independent
  random row/column offsets. `CreateFloorItems` suppresses an item on stairs;
  ordinary category/item selection and zero-probability sticky draws remain.
- `sub_8083660` in `src/dungeon_range.c` selects arriving enemies from the
  first nonempty candidate pass: room tiles at least six tiles from the leader
  on either axis, any room tiles, then any ordinary floor including corridors.
  It checks actor/item occupancy rather than either teammate's visibility.
  Each pass examines at most 1,792 tiles; occupied coordinates use a fixed
  per-attempt set rather than repeated actor/item scans.

The browser RNG, generation connection/merge/repair algorithms, entity
initialization draws and wild AI remain adapted. These fixes preserve specific
source rules; they do not establish a native random-call schedule or seed replay.
Own-file ESLint and strict static type checking passed after this change.
No game module was imported or executed by a test.

Tutorial source review: `TryDisplayGeneralTutorialMessage` in
`src/dungeon_message.c:611-623` displays only the first unseen general flag on a
new floor, in the order attacks/protect partner, turn-taking/menu, then HP
regeneration/B+A waiting. These flags persist across retries; they are not
floor-number flags. Movement, hunger, move/EXP and IQ/tactics lessons belong to
Thunderwave Cave. `DisplayItemTip` separately tracks the first currency, Oran
and Pecha pickups. Its only callers are in `TryLeaderItemPickUp_Async`
(`src/dungeon_items.c:183,256,291`), after the leader's pickup state change and
message. A partner pickup, item use, or walking onto a berry with a full held
slot does not trigger it. The mechanics now emit a separate `tutorial` event
after a successful leader pickup's `item` event, once per existing persisted
`state.tutorials` flag (`item-poke`, `item-oran-berry`, `item-pecha-berry`). These
flags survive retries. The UI owns the tip presentation; native suspension in
the middle of the actor's turn remains a timing difference.

## Pre-toolbox menu and berry audit, 2026-10-10

The [Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf),
printed pages 24-29, was checked visually. Its Tiny Woods B1F screenshot shows
the five-entry main menu: Moves, Items, Team, Others, Ground. The manual's
general toolbox command list is not proof that every command is available
before the toolbox is acquired. The source predicates determine that subset.

- `ShowMainMenu` / `PrintOnMainMenu` (`src/dungeon_main.c:1088-1580`) retain
  Items without a toolbox. `sub_8060D64` (`src/dungeon_menu_items.c:776-808`)
  includes the item at the leader's feet and each occupied team-held slot.
  The opening now exposes those entries under Items instead of Team.
- `SetSubMenuActions` (`src/dungeon_menu_items.c:566-750`) gives a ground berry
  Get, Eat, Throw and Info. Get is visibly disabled when the leader already
  holds an item. Without inventory, held pages provide leader Eat/Info or
  partner Use/Info; Give, Take, Place, held Throw and ground Swap are absent.
  The earlier browser-only held Place command has been removed.
- `PrintOthersMenuOptions` / `PrintQuickSaveMenuOptions`
  (`src/dungeon_menu_others.c:447-561`) put Quicksave and Give Up in an Others
  submenu. The opening follows that route and includes Mission Objectives.
  Menus, descriptions, move registration/toggles and settings remain turn-free.
  `CanAIUseMove(...,TRUE)` disables a zero-PP move's Use command in the menu;
  the selected-move shortcut also rejects an exhausted slot before spending
  a turn (`src/dungeon_main.c:224-241`). When all move slots have zero PP,
  that shortcut instead selects Struggle after requiring a set move
  (`src/dungeon_main.c:200-221`). The leader's rejection does not change an
  AI actor without PP Checker selecting an exhausted slot during its turn.
- `HandleUseItemAction` (`src/dungeon_action_handler.c:286-292`) requests the
  partner's held use through its next AI opportunity. `RunMonsterAI` and
  `AIDecideUseItem` consume that request, rather than healing the partner during
  the leader's own action. The optional actor `useHeldItem` boolean persists a
  request across an opportunity skipped by the normal/slowed scheduler. Old
  exact actor keysets are still admitted with absent meaning false; new exact
  keysets validate the boolean. Admission does not mutate loaded input. Floor
  generation and retry clear it. Higher speed stages are still not admitted.
- Ordinary ground berries use the ten-tile straight trajectory from
  `sub_80671A0` (`src/dungeon_action_handler.c:554-583`) and
  `HandleStraightProjectileThrow` (`src/dungeon_projectile_throw.c:32-228`).
  Walls stop flight at the preceding tile. The first eligible actor, including
  a teammate, intercepts it; the hit chance is 90 percent
  (`src/dungeon_config.c:207`). An ordinary miss stops at that actor.
- Berries cannot be caught (`src/dungeon_item_action.c:84-105`). On a hit they
  apply their usual recipient effect and five Belly points. Oran restores
  100 HP; Pecha cures poison; Rawst cures burns. Throwing a beneficial berry
  does not become a damage attack. `TrySendImmobilizeSleepEndMsg` only ends
  indefinite sleep (127) among statuses currently admitted by this opening;
  ordinary timed sleep is not incorrectly removed.
- A miss, wall or range endpoint calls the source-order 25-coordinate nearby
  drop search from `SpawnDroppedItem` / `gUnknown_80F4468`. It excludes walls,
  stairs and existing items, but actors do not block a landing tile. Flight is
  bounded by ten tiles and drop search by 25 positions. All sixteen admitted
  heroes have `canThrowItems=true` in the existing qualified throw catalog.

Summary now exposes species types, abilities and current statuses, but it does
not reproduce the original tabbed layout.
The renderer has a turning-grid drawing path; wiring the Grids option and
Y-facing lifecycle belongs to the app/input owner. Projectile events include
origin and endpoint for the renderer; animation timing still needs manual review.

## Initial Tactics, IQ and Talk, 2026-10-10

`mechanics-policy.js` owns the initial preference vocabulary and menu facts;
mechanics applies them to actual action selection. The inspected comparative
source separates these rules from the larger native movement implementation.

- `gReqTacticLvls` / `gTacticsTargetLeader` (`src/dungeon_data.c:50-79`) expose
  Let's go together, Go after foes and Avoid the first hit from level one.
  `ChooseTargetPosition` (`src/dungeon_ai_movement.c:143-309`) makes Together
  follow the visible leader; the other two prefer the closest visible foe,
  falling back to the leader. `DecideMovement` waits at distance two for Avoid
  the first hit, or turns away at distance one when no attack was selected.
  Its ordinary fallback checks the two 45-degree alternatives, not arbitrary
  sideways or backwards paths. These three initial policies are implemented.
- Team members start at IQ one. `gReqIQSkillPts` and `SetDefaultIQSkills`
  (`src/pokemon_3.c:465-476`) make Item Catcher, Course Checker and Item Master
  enabled initially. Dedicated Traveler and Exclusive Move-User are also
  available at IQ one but initially off. No Gummis spawn in Tiny Woods, so
  higher-IQ skills are not unlocked by ordinary opening play.
- `RunMonsterAI` (`src/dungeon_ai.c:95-149`) makes Dedicated Traveler try
  movement before choosing an attack, then attack if movement cannot proceed.
  It does not prohibit all attacks. `ChooseAIMove` excludes regular attacks
  for Exclusive Move-User; the separate all-PP-exhausted Struggle route remains.
- `IsTargetInRange` (`src/dungeon_ai_attack.c:830-883`) applies Course Checker
  before choosing a line/corner-cut move or thrown item. Turning it off permits
  a choice with an obstructed line; the eventual projectile still hits the
  first actor or wall. It does not grant wall penetration or ignore allies.
- `AIDecideUseItem` and `GetAIUseItemProbability` apply Item Master to actual
  autonomous held use. A quarter-HP Oran user eats with probability 100 percent
  next to a foe, otherwise 50 percent. A poisoned Pecha user has the same
  adjacency probabilities; a burned Rawst user has a 50-percent chance. The
  self check occurs before ally throws. Berry AI flags permit both self and
  ally use, so a partner can throw its berry toward the leader when indicated.
  Explicit Items -> partner -> Use bypasses the need/probability and Item
  Master toggle, while preserving the deferred-action flag.
- `CanTakeItem` (`src/dungeon_ai_movement.c:106-141`) schedules AI pickup as
  an action in the movement phase, provided its held slot is empty. Moving
  onto an item does not also pick it up in the same AI action. Hero pickup
  retains the separate leader movement behavior. Item Catcher is selectable,
  but berries are never catchable; the available Tiny Woods projectiles do not
  gain a false catch effect when that skill is enabled.
- Optional `tactic` and `enabledIq` fields retain player choices across floors,
  retries and saves. Missing historical fields mean the native initial defaults
  because those opening controls did not previously exist. Admission accepts
  only the exact mandatory keys plus present recognized optional keys, known
  tactic IDs and a unique subset of the five IQ IDs. It does not mutate saved
  input or invent a pending item command. Switching a tactic clears its old
  movement goal; editing preferences leaves `useHeldItem` unchanged. Sleeping
  and infatuated actors cannot switch preferences, matching the applicable
  `CheckVariousStatuses2(TRUE)` menu gate.
- Team -> Talk follows `sub_8067558` / `sub_806A3D4`. The original partner
  archive is selected by native species ID, with response index two at HP
  at most one quarter, index one at most 60 percent, and index zero otherwise.
  The ten partner entries were inspected in `data/dungeon_sbin.s`,
  `PartnerConversion0/2/15/27/28SIRO`. The browser contains short original
  paraphrases of their encouragement, fatigue and urgent-help meanings, not
  the commercial script. Menu Talk is turn-free; it applies supported status
  refusal, indefinite-sleep wake-up and original facing changes.
- Field A uses `sub_805EF60` (`src/dungeon_main.c:989-1004`) to select Talk
  when a reachable adjacent partner is ahead and the leader can talk. This
  is intercepted inside the leader input loop (`src/dungeon_main.c:491-495`):
  `ACTION_TALK_FIELD` is `0x13` and is reset to `ACTION_NOTHING` after dialogue.
  Both field and menu Talk are therefore turn-free, with no hunger, arrivals,
  wind or autonomous actions. The partner faces the leader for field Talk
  rather than the menu's south-facing pose.
  Dialogue emits a separate `talk` event, not a fabricated message-log entry.
  Bide alone does not block menu Talk: it is absent from the native two-turn
  charging-status list used by `sub_8070BC0`.

Remaining AI limits are explicit: the browser still uses its bounded path
search, visibility and remembered-position model rather than the complete native
target-memory, route and IQ weighting machinery. Higher-level tactics unlocked
through repeated tutorial grinding are not yet implemented; their absence must
not be represented as later-campaign-only scope. Manual play must verify the
new policy interactions. Static checks do not establish native AI parity.

Zero-damage review: `src/dungeon_damage.c:1265-1378` clamps the base formula
before applying final modifiers and variance, then explicitly permits the
rounded result to be zero. `HandleDealingDamageInternal_Async:315-329` displays
a no-damage message and returns without a damage reaction. A minimum-one final
clamp would therefore be incorrect. The opening retains the numerical result,
reports no damage, and emits no zero-value hit/number event. Positive damage
events now consistently identify the attacker in `actorId` and the recipient in
`targetId`; the former reversed fields caused renderer feedback on the attacker.

## Prepared opportunities and forced inactivity, 2026-10-10

The native input boundary is after upkeep. `RunLeaderTurn_Async`
(`src/dungeon_engine.c:84-118`) checks the actor's scheduled speed slot, calls
`TickStatusAndHealthRegen`, then enters `DungeonHandlePlayerInput`.
`sub_80701A4` (`src/status_checks.c:90-175`) bypasses input for remaining sleep,
infatuation and Bide among the opening's supported statuses. It selects a pass;
`DungeonHandlePlayerInput` waits 60 frames and returns without a button press.
Paralysis, cringe and confusion are not interchangeable with this forced-input
gate.

- `prepareDungeonTurn` starts at most one base beat and performs a scheduled
  leader's upkeep once. It returns `input` or `forced` without completing that
  opportunity, or completes an unscheduled-leader beat and returns `advanced`.
  `getDungeonTurnPhase` is a pure input-admission query. `completeForcedTurn`
  completes exactly one prepared forced opportunity. The app owns the 60-frame
  delay, event presentation and interruption handling; none of these functions
  loops through an entire status duration.
- Sleep and infatuation expire in `TickStatusAndHealthRegen` before input. A
  saved sleep counter of one therefore becomes an awake, prepared input state
  without spending an extra pass. Bide decrements in `DoEndOfTurnEffects_Async`
  (`src/dungeon_turn_effects.c:361-379`): Bide one still forces a pass and releases
  at its end. Release remains subject to the native supported status blockers.
- A data-only inspection of `data/monster/monster_data.json` verified native
  movement speed one for all 16 heroes and all four Tiny Woods enemies. The
  admitted speed changes only lower it. `gSpeedTurns` schedules stage one at
  fractional slots 3, 7, 11, 15, 19, 23 and stage zero at 7, 15, 23. Their
  equivalent two-beat schedule is used directly; empty fractional slots are
  not simulated as extra browser work. `CalcSpeedStage` also lowers the stage
  for paralysis. Normal actors act every base beat; slowed/paralyzed actors
  only on the second beat, checked before their status tick.
- An unscheduled leader receives no regeneration, timer tick, hunger, residual
  effects, Bide decrement or wind decrement. Scheduled companions/enemies
  still act. Arrival attempts belong to every 36th base beat, before leader
  preparation. Wind belongs only to completed leader opportunities. A swapped
  teammate receives its own immediate upkeep and deferred walking end effects
  even if its speed would not schedule it on this beat. The next scheduled
  companion opportunity clears its skip flag without duplicating those effects.
  This follows `sub_8044454_Async` (`src/dungeon_engine.c:157-173`), the companion
  skip branch (`:228-238`) and the movement flush
  (`src/dungeon_entity_movement.c:262-278`). Its already-selected swap Walk does
  not emit the ordinary AI's Infatuation/Bide blocking message. A pending
  held-use request survives unscheduled beats, but the executed swap clears it
  just as `ExecuteEntityDungeonAction_Async` does (`:68`).
- `LowerSpeed` (`src/move_orb_effects_1.c:1391-1439`) refuses a reduction at
  stage zero. Repeated String Shot neither refreshes slow nor consumes a new
  duration draw, and String Shot cannot add slow while paralysis already puts
  the actor at minimum speed.
- The optional save pair `baseBeat` (0-35) and `leaderPrepared` (boolean) records
  the phase. Both absent is a valid historical opening save; operational
  initialization uses its known completed-browser-pass count `floorTurn % 36`
  and an unprepared boundary. This preserves the old arrival countdown without
  claiming to reconstruct cartridge history. New floors reset both explicitly.
  A prepared save resumes without a second upkeep tick. Admission requires both
  new fields together, validates their exact bounded types and never mutates
  the raw loaded value. Existing campaign saves remain unrelated.

Stair menus are presented only after the leader reaches a prepared input
boundary, since native forced inactivity is checked before the stair prompt.
The app must save changed preparations, clear held inputs on actual forced
status interruption, and pause its cadence while hidden, in help or otherwise
paused. An unscheduled slow beat retires queued taps while retaining live held
directions, matching the ordinary native held-D-pad input path
(`src/dungeon_main.c:390-396`); at most one action enters each eligible frame.
Manual verification still owns those browser and presentation properties.
The compact stage-zero/one scheduler is not proof of all native 24-slot speed,
multiaction, weather or suspended-learning behavior.
