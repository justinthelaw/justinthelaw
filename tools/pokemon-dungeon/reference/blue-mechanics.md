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
- The scoped `tools/pokemon-dungeon/content/blue-source.json` and
  `content/blue-onboarding/` inputs retain the selected records' original
  Blue/shared/Red qualifications and retired donor hashes.
  `export-blue-opening.mjs` projects factual JSON without executing game code;
  `content/blue-opening.json` records its live input hashes. See
  [the independent factual checks](blue-facts.md).
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

The private damage helper is specialized to this opening's sole caller.
Permanently neutral form, stat-item and clear-weather inputs and their dormant
branches are removed. The closed twenty-species roster also excludes eight
numerical abilities: Huge Power, Pure Power, Hustle, Intimidate, Thick Fat,
Flash Fire, Levitate and Swarm. Their branches and six constant-false stat
inputs are removed. Fixed-point operations, active ability ratios, stage/type
tables, rounding, RNG calls and returned facts retain their order and values
for every admitted input. The shared power roll is still drawn and validated;
armor, contact effects and ability-announcement ownership remain unchanged.
Full growth/learnset data and save acceptance are unchanged; weather-changing
moves still have the unsupported boundary described below. Expanding the roster,
copied abilities, factual mutation or helper callers requires a new source review.

## Remaining fidelity gaps

- New adventures use the source-qualified dungeon LCG family and per-floor
  preseed split documented in [blue-rng.md](blue-rng.md); historical saves keep
  their xoshiro state and transitions. Browser initial seeding and the full
  native call schedule remain adapted, so cartridge seed replay and tile-for-
  tile dungeon claims are unsupported. The version-two save journal passed
  independent review and the recorded browser migration and stale-write checks.
- AI still uses compact pathfinding, local foe selection, following and wandering.
  Move opportunities are selected before resolving targets for the admitted
  native AI classes: thirteen reachable front/self moves (`0x00`), Growl and Quick Attack
  (`0x40`), Bubble and Razor Leaf (`0x50`), and seven reachable corner-cut adjacent moves
  (`0x80`). Regular attacks retain their weighted opportunity without a target
  and capture their direction from current facing before move selection.
  Failed selected-move targeting uses that captured regular fallback without
  another opportunity draw. Every nonempty target pool consumes its own draw,
  including a one-candidate pool.
  Opportunity selection deliberately retains the native inclusive endpoint:
  `ChooseAIMove` adds each positive weight and accepts `cumulative >= draw`,
  with `DungeonRandInt(total)` in `[0,total)`. Subtracting each weight and
  accepting `<= 0` is equivalent, including the first slot's extra endpoint.
  Native target selection separately uses `< 0`; that boundary is not shared.
  All retained factual AI weights are positive. See pinned
  [opportunity source](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_ai_attack.c#L271-L292)
  and [random bound](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_random.c#L42-L50).
  Front/self and two-tile candidates follow native South, Southeast, East,
  Northeast, North, Northwest, West, Southwest order. Front/self requires an
  attackable adjacent foe; Focus Energy, Rage and Withdraw still affect the
  user after admission. Two-tile targeting prefers an eligible adjacent foe in
  each direction before checking distance two, with only the first-step corner
  check. Line and corner-cut adjacent candidates retain persisted actor-slot
  order. Lines admit the first eligible target per direction and respect the
  partner's Course Checker toggle; execution still hits the first actual actor
  on that ray. Wild Status Checker uses the represented active status fields.
  These are bounded comparative Red-source corrections, not proof of Blue
  binary equivalence. Ordinary nonconfused actors without Dedicated Traveler
  now enter the existing chooser without a visible foe when every enabled slot
  belongs to these 24 exact move IDs. This consumes the real opportunity pool
  and can resolve a two-tile target beyond the browser's room sight border;
  it does not substitute a discarded random draw. Empty enabled sets, global
  PP exhaustion, Exclusive Move User and wild IQ guards retain their owners.
  An enabled later move outside that set preserves the qualified scheduling
  path. Confusion, Dedicated Traveler, broader Struggle/movement behavior and
  the full native IQ decision tree remain qualified. Water Sport and Helping Hand
  belong only to hero species in this roster, so dormant room-target AI is
  omitted; their player actions remain available. Hero-only Attract, Disable,
  Low Kick and Bone Club are also absent from autonomous policy, and the dead
  Helping Hand target fallback is removed. Save role/learnset validation and
  the partner/wild-only turn loop preserve this boundary through retries.
  Candidate 20 adds one narrow corridor-junction branch for the browser's
  binary normal-floor/wall topology. It admits only the five native
  `IsAtJunction` masks when the first scan is proven to have a terrain-legal,
  unoccupied branch other than the direction opposite the actor's pre-draw
  facing. Each admitted call consumes the native eight-way start draw, even
  with one choice, and scans in native signed direction order. Blocked
  junctions and the sole-free-opposite case return before drawing and retain
  adapted movement because their native second stage owns waiting/ally-skip
  behavior outside this patch. Pinned `dungeon_logic.c:916-1044`,
  `dungeon_ai_movement.c:623-653` and `dungeon_pos_data.c:577` support this
  bounded branch. Liquid/special mobility, room movement, pursuit, confusion,
  following/BFS, non-junction wandering and broader Blue movement behavior
  remain qualified.
  Candidate 21 narrows one further Together case. After the existing tactic,
  visibility, confusion, belly and higher-priority action gates choose the
  visible leader, an ordinary partner takes the exact direction toward that
  leader when its destination is legal and empty. Comparative
  `TargetLeader`/`ChooseTargetPosition`/`DecideMovement` source selects this
  direct step before room routing, alternate turns, RNG, remembered targets or
  waiting ownership. Blocked or occupied direct tiles, adjacency, other tactics
  and every case requiring alternate ±45-degree turns keep the existing BFS
  fallback unchanged. This source-qualified branch does not establish broader
  native or Blue pathfinding parity.
  Candidate 22 admits the same successful-direct-step fact for the four Tiny
  Woods wild species only when the existing visible-target owner yields one
  uniquely closest active team actor. The branch repeats visibility, excludes
  equal-distance target ties, requires a noncoincident target and a legal empty
  sign-clamped direct tile, and adds no RNG draw. This corresponds to the
  comparative fixed-enemy target scan, Chebyshev distance,
  `GetDirectionTowardsPosition` and the first successful `DecideMovement`
  direction. Failed visibility, uniqueness, terrain or occupancy guards fall
  through byte-for-byte to the signed BFS path. Equal-distance and remembered
  targets, decoys, special mobility, run-away/terrified behavior, blocked or
  occupied tiles, alternate-direction choice, the surrounding attack scheduler
  and broader native/Blue pathfinding remain qualified.
  Candidate 23 replaces the browser visibility approximation at exactly four
  reviewed AI acquisition sites: the two comparative `CanTargetEntity` routes
  and the two wild direct-step guards. Its `targetSight` helper accepts the
  source room plus one-tile border, then applies the native short-range
  corridor test over the browser's binary normal-floor/wall topology; a target
  two tiles away behind a wall is rejected. The existing `inSight` function is
  unchanged for actual sight, camera/minimap, wake-facing, remembered-position,
  adjacent and unreviewed move owners. The correction adds no random draw,
  although rejecting a formerly visible target can change downstream choices
  and RNG history. Secondary terrain and later-dungeon sight remain qualified.
  Candidate 24 closes three further autonomous owners. Paralysis or cringe
  rejects attack selection before charge lookup, move weights and RNG, then
  leaves movement fallback available. For a non-Dedicated confused actor, held
  items retain precedence; the comparative 70% attack-choice draw precedes
  stored charge and weighted selection, while a rejected choice falls through
  to confused walking in native direction order. Admitted attacks randomize
  facing at action execution, including accepted zero-PP attempts. Dedicated
  Traveler keeps its separate movement return. Confused Eat/Throw direction,
  leader confused Walk, Bide release direction, unsupported no-foe resolvers
  and Blue RNG-stream identity remain unowned.
  The scheduler implements the admitted normal/slowed speed rows and forced
  leader passes described below; the full native phase/speed repertoire and
  some status ordering remain incomplete. Learning choices are presented after the
  current browser turn, rather than through native suspended continuations.
- Later moves attainable through extensive repeated tutorial grinding retain
  factual learnsets, but some weather-changing and charging effects are not
  implemented. `supportsMove` explicitly rejects those actions without PP or
  turn loss; they must not silently become plain damage.
- The complete original menu/IQ/tactic surfaces, exact failure-item loss and
  all animation/message timing remain unverified or incomplete. The opening
  has no toolbox, so its held-item pages do not offer transfer or Place.
  Retry currently clears money and held items and retains EXP
  and levels; it does not apply the initial level-five boost again.
- Source-backed numbers do not prove complete behavior. This module has no
  claim concerning exact sprites, audio, dialogue, DS layout or cinematics.

## Verification and next manual review

- Run the package lint, strict typecheck and opening static check together after
  integration; dated audit sections below record only the checks that passed for
  their specific changes.
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
- `CanTakeItem` (`src/dungeon_ai_movement.c:106-141`) schedules standing AI
  pickup as a movement-phase action when its held slot is empty. A separate
  `DisplayActions_Async` pass interacts with items after a nonleader walks onto
  them. The restored late path is described below; the early held-slot gate
  stays intact. Item Catcher is selectable, but berries remain uncatchable.
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

Held B+A is sampled at each eligible leader input opportunity before the
pressed-A set-move shortcut, so B+A takes priority over L+A. It spends one wait
per opportunity only while the integer part of Belly is nonzero; plain A remains
edge-triggered and standalone Space waiting is unchanged. This follows
`DungeonHandlePlayerInput` (`src/dungeon_main.c:176-191`) without admitting OS
key-repeat as additional actions.

Candidate 24 admits the exact Squirtle level-40 Skull Bash row as a dedicated
charge owner. First phase spends one PP, records the charge and learned slot,
and applies its represented effective physical Defense stage; release uses the
source second-turn presentation route without another PP spend. Optional save
state remains backward-compatible and is cleared on invalid slot/life/status,
floor reset, class replacement and the source-qualified leader/autonomous
action boundaries. Initial autonomous selection uses tuple-zero adjacent target
order, candidate draw and regular fallback. A newly created charge survives its
creating action; a charge present at autonomous action start clears after that
action. This does not generalize to Solar Beam, Bide or other charge classes.

Defense-down presentation remains separate from stat ownership. Comparative
`LowerDefenseStageTarget` helpers request effect 399 before mutation and clamp
reporting, including a valid attempt at the minimum stage. Candidate 23 maps
that existing receipt to bounded SE2 cue 906 for the 15 reviewed Leer, Tail Whip
and Screech species/level pairs. It changes no defense arithmetic, player,
quota, counter or scheduler phase. The comparative Red cue does not establish
Blue instrument identity, waveform phase, mixing or physical audibility.

For Sing, Hypnosis and Sleep Powder, `BasicSleepMoveAction` calculates the sleep
duration before `SleepStatusTarget` checks whether the target is already asleep.
A duplicate therefore consumes the native duration draw, leaves the existing
sleep timer and class unchanged, requests the sleep entry effect, and reports
that the target is already asleep. Accuracy still resolves before this handler;
the discarded duration is not adjusted by Early Bird. See `src/dungeon_move.c:584-590`,
`src/move_orb_actions_1.c:82-87` and `src/move_orb_effects_1.c:37-96`.

## Early ability activation announcements

The scoped numerical ability audit found no gameplay defect for the 16 heroes,
ten partners, four Tiny Woods wild species and typical level-five-to-seven
moves. In particular, Pickup explicitly excludes Tiny Woods; Lightningrod
does not intercept allied Pikachu's moves; Rock Head does not suppress Struggle
recoil; and the imported damage helpers already apply the native Guts and
quarter-HP type boosts. Psyduck's Cloud Nine/Damp have no weather/explosion
interaction in this slice. Water Sport is a separate floor effect.

The browser now supplies authored activation announcements through the existing
message/log event path, without new random draws or numerical changes:

- `ApplyAtkDefStatBoosts` (`src/dungeon_damage.c:1027-1038`) evaluates Guts;
  `sub_806E100` (`:820-865`) evaluates Torrent, Overgrow and Blaze only for the
  corresponding attack type. `SetVisualFlags` (`src/dungeon_logic.c:1425-1449`)
  announces a false-to-true transition. A qualifying inactive evaluation clears
  its bit, while an unrelated move type leaves a type-boost bit untouched.
- Optional actor `abilityVisualFlags` preserves those four native bits: Guts
  `0x01`, Overgrow `0x02`, Blaze `0x20`, Torrent `0x80`. It starts at zero and
  resets when a new floor/retry recreates dungeon actors, matching
  `src/dungeon_mon_spawn.c:789-790`. It survives browser saves, matching the
  native visual-flag serialization at `src/dungeon_serializer.c:372-373`.
  Admission accepts only bits belonging to that actor's sourced abilities.
  Historical opening saves without the field remain valid; their first future
  evaluation starts prospective announcement tracking at zero. No historical
  native announcement state is inferred or written during validation.
- `HandleDamagingMove` (`src/dungeon_move.c:1333-1343`) calls `CalcDamage`
  **before** `TryHitTarget_Async` performs the second accuracy check
  (`:1358-1391`). Consequently, a newly activated boost can correctly be
  announced before that later miss. No-target/first-accuracy failures never
  reach the announcement evaluator. The early one-damage branches in
  `CalcDamage` (`src/dungeon_damage.c:1125-1131`) also bypass it. This follows
  source evaluation order instead of claiming every announcement means a hit.
- Static/Cute Charm messages use the already-sampled contact-reaction booleans.
  They occur after move-specific secondary effects and immediately before the
  corresponding status helper, as in `TriggerTargetAbilityEffect`
  (`src/dungeon_move_util.c:238-268`). There is no extra probability roll or
  speculative activation on a failed contact check. The native announcement
  precedes the status helper's duplicate/immunity checks too; it is not a
  second claim that a new status was successfully installed.

The original ability-specific visual and sound effects are still absent.
These messages use the existing browser combat-log visibility policy; exact
native viewport-dependent popup suppression remains a presentation limitation.
The source remains the pinned comparative Red revision, not Blue binary proof.

## Item interaction after walking — 2026-10-11

The complete comparative path is `ACTION_WALK` → `sub_8074FB0` →
`sub_8075050` → `DisplayActions_Async` → `TryInteractWithTile` →
`MonTryPickUpItem`. [The moved-actor pass](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_entity_movement.c#L245)
runs after walking and waking, visits the leader first, then moved nonleaders
in active slot order. Its nonleader call has no held-slot or visibility gate.
[The item owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_ai_items.c#L429)
handles team Poké before held slots. A partner can therefore collect money
while holding a berry; an occupied ordinary or wild held slot instead produces
the stepped-on-item message without sound or acquisition.

The browser restores that nonleader pass at the existing movement flush. A
local set identifies movement since the previous flush, then surviving partner
and wild slots are visited once after the existing wake pass. The single pickup
helper is shared with existing calls. Failed-slot arrival messages include
nonleaders; the standing AI gate remains unchanged. Swapped partners retain
their skip flag, preserving the twelve-pickup result bound. No new random draw,
action, wait, saved field, callback or audio owner is introduced.

This corrects the earlier inference that AI movement could not also collect an
item. It does not establish Blue binary identity. The hero's existing canonical
pickup still occurs before the wake pass, with deferred presentation. Existing
nonwalking wrappers can place late receipts after their camera/cursor work;
the correction adds no wait and does not claim exact native pre-wrapper timing.
The source's separate DS/debug comment and broader end-effect scheduling remain
qualified. Source pins, owner/AST comparisons and independent admission are
preserved in the ignored `blue-late-pickup-implementation-20261011-0708` packet.

## Blue touch THROW fallback — 2026-10-11

The [original Blue manual, printed p12 / PDF page7](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=7)
specifies a regular attack when the touch THROW icon has no set item. Opening
Tiny Woods has no Toolbox or set-item state. The earlier inert toolbar behavior
was an unsupported inference from that absence; Red's stubbed touch inputs do
not establish the Blue fallback.

The toolbar now emits a transient `regularAttack` action to the existing combat
owner before menu-opening audio. Keyboard and virtual A retain their existing
`attack` action and free partner Talk interception. The new tag adds no save
field, move, damage rule, PP use, input queue or scheduler. Normal ally exclusion
and confusion behavior remain with the existing target owner. All activation,
phase, Help, camera, presentation, deadline and stale-click checks remain.

The manual plus native action separation supports the direct-attack distinction;
no original Blue footage of THROW facing a partner has been established. Ground
Throw remains a separate item-menu action. The three-source correction and its
independent whole-file AST proof are preserved in the ignored
`blue-toolbar-fallback-implementation-20261011-0738` packet.

## Ground Poké before the Toolbox

Ground Poké offers Get/Throw/Info in the original no-Toolbox command branch.
Normal held pages use unsigned indices 144–147, not the separate held index 129:
leader-held Poké is Info only, while partner-held Poké permits Use and then the
existing Second Thoughts action without consuming it. Berry commands remain
Eat/Info for the leader and Use/Info for the partner. Nintendo's original Blue
manual places the Toolbox after rescue-team formation; its general item list
does not establish pre-Toolbox transfer commands.

The [pinned comparative Red projectile owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_projectile_throw.c)
uses ten ordinary straight tiles, one 90-percent hit draw at the first eligible
actor, wall-entry animation before logical rollback, and whole-pile catch/drop.
The [item action owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_item_action.c)
lets an eligible empty-handed wild catch money; team members require Item
Catcher. Initial sleep ends first. Timed sleep, infatuation and Bide block the
catch in this opening; paralysis, confusion and cringe do not. An uncaught pile
is consumed for one neutral direct HP, independent of value, without changing
prior EXP marks or invoking contact abilities. The shared HP/EXP/faint/drop
owners continue to apply.

The [drop owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_items.c)
chooses its first eligible offset even when the pool refuses spawning. Its hop
uses 24 integer interpolation/sine steps plus one settle frame; a missing landing
candidate produces no hop. Loss uses the source X-position macro on both coordinates plus
the throw-direction offset. Native item impact8/neutral10/loss144 artwork is
already shipped; the new route preserves their retained termination updates.
Spin356 and loss711 have admitted finite audio roles; throw336, catch333 and
impact607/609 remain held without authored fallback. Red clipping translated to
Blue's viewport, cosmetic start phase and native PRNG replay remain qualified.

The source/design packet and independent review are retained under ignored
`.work/blue-item-menu-audit-20261011-0709/` and
`.work/blue-poke-throw-independent-20261011-0734/`; implementation source hashes,
whole-module preservation, literal native facts and event/lifecycle limits are
retained in `.work/blue-poke-throw-implementation-20261011-0740/`. No game/native
execution or automated playthrough is part of those checks.

The same source review also corrects the shared visible-KO hold: every admitted
visible damage reaction ending at HP zero keeps its hit animation during the
thirty-frame blink, suppresses the shadow and retains status-icon display until
faint. Canonical/HUD HP is zero; no save field or simulation wait is added.
Non-KO, False Swipe and offscreen paths stay unchanged. A visible KO now retains
the final +40 projection through one eligible browser rendering opportunity
before retirement and settlement. The app releases it on a later eligible RAF;
interruption cancels it without replay. This adds no native wait or save field.
The shared global blink phase, physical display timing and exact Blue parity
remain qualified. The projection and clock contract is described in
[battle visual evidence](blue-battle-visuals.md#final-faint-publication).
