# Opening move coverage after repeated retries

Current follow-up: [Foresight and Psych Up](blue-stat-moves.md) and
[Charm and Screech stat multipliers](blue-stat-multipliers.md) add four bounded
retry-reachable handlers. [Heal Bell](blue-heal-bell.md) adds its source-qualified
status cure and presentation route, leaving 17 rejected learned move IDs across
22 learnset rows. The checkpoint tables below are historical evidence.

Static audit of checkpoint `049af6e219f10c54bb50fe648c34c6ff77eb6e64`,
2026-10-10. Inputs were the JSON learnsets/effects and parsed JavaScript AST;
no game module was imported or executed. The factual JSON SHA-256 was
`f83fbc0ca71d9211ba429cec1d6cd41046c22bbdecc19c0756da8d54e729bd7d`.

## Scope and reachability

- The audited checkpoint's `supportsMove` guard rejects **32 distinct learned move IDs**
  across **44 species/level entries**: 15/16 heroes and 9/10 partners.
  Cyndaquil has no guard-rejected move in its level-up list. That does not
  certify all of its later interactions.
- All level-five-to-seven starter moves pass the guard. No rejection occurs
  through level 15. This is the verified static coverage boundary for a normal
  first attempt, not evidence of a complete playthrough or exact move parity.
- The earliest rejected level is **Treecko 16: `move-pursuit`**. It requires
  28,040 EXP above its level-five start. Skitty's Assist at level 19 requires
  26,040 additional EXP because the species have different growth tables.
  These are prolonged grinding cases, not normal first-attempt progression.
- `retryDungeon` retains levels, EXP and learned moves while restoring PP.
  Failure therefore does not bound the eventual learnset. Repeated retries
  can reach every row below without entering a later dungeon. Each listed
  unsupported move is the sole level-up candidate at its level for that species.
  Four-slot replacement choices can retain it; the guard blocks its execution.
- The ten partner species use the same learnsets. Species marked **Both** can
  be hero or partner; **Hero** species cannot be selected as partners.

## Rejected matrix at the audited checkpoint

| Species | Role | Level: rejected move ID |
| --- | --- | --- |
| Bulbasaur | Both | 39: `move-synthesis`; 46: `move-solar-beam` |
| Charmander | Both | 43: `move-dragon-rage`; 49: `move-fire-spin` |
| Squirtle | Both | 23: `move-rapid-spin`; 28: `move-protect`; 33: `move-rain-dance`; 40: `move-skull-bash` |
| Pikachu | Both | 33: `move-agility`; 50: `move-light-screen` |
| Meowth | Hero | 18: `move-pay-day`; 31: `move-screech` |
| Psyduck | Hero | 23: `move-screech`; 31: `move-psych-up` |
| Machop | Hero | 19: `move-seismic-toss`; 22: `move-foresight`; 31: `move-vital-throw`; 37: `move-submission` |
| Cubone | Hero | 37: `move-thrash`; 45: `move-double-edge` |
| Eevee | Hero | 36: `move-baton-pass`; 42: `move-take-down` |
| Chikorita | Both | 22: `move-synthesis`; 36: `move-light-screen`; 43: `move-safeguard`; 50: `move-solar-beam` |
| Cyndaquil | Both | None rejected by the guard |
| Totodile | Both | 43: `move-screech` |
| Treecko | Both | 16: `move-pursuit`; 21: `move-screech`; 31: `move-agility`; 41: `move-detect` |
| Torchic | Both | 25: `move-fire-spin`; 37: `move-mirror-move` |
| Mudkip | Both | 19: `move-foresight`; 24: `move-mud-sport`; 28: `move-take-down`; 33: `move-whirlpool`; 37: `move-protect`; 46: `move-endeavor` |
| Skitty | Hero | 19: `move-assist`; 25: `move-charm`; 31: `move-covet`; 37: `move-heal-bell`; 39: `move-double-edge` |

## Small completion groups

These groups isolate required state/effect ownership. The table records the
original implementation proposals; the sections below identify later completed
work and its review status. Source references
below are relative to
[the inspected comparative Red revision](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
Existing numerical helpers should be reused without importing the old campaign
state graph.

The current opening helpers omit dormant weather modifiers whose sole caller
always supplied clear weather. A future weather admission must explicitly
restore and review those modifiers and their input wiring. The native weather
facts and original proposals below remain source evidence, not current support.

| Group | Rejected moves covered | Smallest required behavior and source owners |
| --- | --- | --- |
| Direct HP and recoil | Seismic Toss, Dragon Rage, Endeavor; Take Down, Submission, Double-Edge | Preserve each direct-HP caller's flags instead of routing through ordinary damage. Recoil is max-HP/8 with Rock Head protection, distinct from Struggle's max-HP/4. `move_orb_actions_2.c:sub_8059A2C,sub_8058E5C,DoubleEdgeMoveAction`; `move_orb_actions_4.c:DragonRageMoveAction`; `move_orb_actions_1.c:EndeavorMoveAction`. |
| Item side effects | Pay Day, Covet | Money placement after a confirmed KO, plus held-item transfer after successful damage. Reuse the existing money distribution and floor-item placement rules; retain source ordering around held-item drops. `move_orb_actions_3.c:PayDayMoveAction,ThiefMoveAction`. |
| Stat multipliers and exposure | Charm, Screech, Psych Up, Foresight | Add sourced Q8 offensive/defensive multipliers separately from stat stages; copy the correct stages/multipliers; clamp evasion and preserve the exposed flag. Requires save/reset admission and damage input wiring. `move_orb_actions_1.c:CharmMoveAction,ScreechMoveAction,ExposeMoveAction`; `move_orb_actions_2.c:PsychUpMoveAction`. |
| Reflect-class defenses and reactions | Pursuit, Protect, Detect, Light Screen, Safeguard, Vital Throw, Mirror Move | Shared mutually exclusive reflect-status storage, timers and guards; physical counter damage; hurl reaction; one reflected move dispatch. Protect/Detect must retain their 75 accuracy and native exception to automatic self-target hits. `move_orb_effects_4.c`; `dungeon_damage.c:88-137`; `dungeon_move.c:192-255`. Pursuit is a Counter status in this game, not ordinary damage. |
| Healing and cleanup | Synthesis, Heal Bell, Rapid Spin | Weather-qualified healing; cure the supported negative classes; perform Rapid Spin cleanup after its chain. `move_orb_actions_1.c:SynthesisMoveAction,sub_80578EC,RapidSpinMoveAction`; `dungeon_move_util.c:457-460`. The JSON's adjacent-trap-removal claim for Rapid Spin needs separate verification: the inspected native post-chain owner clears frozen/leech classes. |
| Floor sport and weather | Mud Sport, Rain Dance | Persist the second sport timer and native weather timer, pass actual apparent weather to damage, and update affected accepted moves such as Thunder. Rain is the reachable learned weather change in this roster. `move_orb_actions_3.c:MudWaterSportMoveAction`; `move_orb_actions_1.c:RainDanceMoveAction`; `weather.c:sub_807EAA0`; `dungeon_move_util.c:769-777`. |
| Positive speed | Agility | Add positive speed counters and the native additional movement/attack opportunities. This expands the present stage-zero/one scheduler; a status timer alone is insufficient. `move_orb_actions_1.c:AgilityMoveAction`; `move_orb_effects_1.c:BoostSpeed`; `dungeon_config.c:gSpeedTurns`. |
| Position changes and fixed chains | Baton Pass, Thrash | Room target ordering and position swaps; three Thrash hits with a new direction/target scan before each hit. `move_orb_actions_4.c:SwitcherOrbAction`; `dungeon_move_util.c:392-426,sub_8057070`. Keep this separate from ordinary multi-hit damage. |
| Charged moves | Skull Bash, Solarbeam | Saved charge identity, release timing, targeting/range transition and source damage multipliers; Solarbeam must compose with rain. `move_orb_actions_4.c:SkullBashMoveAction`; `move_orb_actions_2.c:SolarBeamMoveAction`; `dungeon_move_util.c:MoveMatchesBideClassStatus,MoveRequiresCharging`. |
| Called move dispatch | Assist | Select from eligible active-floor move slots, including enemies, with the native 80-slot cap and charging/Sketch exclusions. Replace the chosen move once before execution; do not recurse indefinitely when Assist selects itself. Complete this after the referenced handler groups. `dungeon_move_util.c:130-151,1110-1141`. |

Target categories are a shared prerequisite for several groups: Agility,
Safeguard and Heal Bell use category 1, while Baton Pass/Psych Up can target
either side. The current room/front predicates do not fully implement those
relations. Merely adding an effect name to `supportsMove` would be incorrect.

## Admitted effects versus unverified interactions

- **Confirmed admitted defect at the audited checkpoint:** Cubone learns
  `move-bonemerang` at level 25. It passes the guard, but its source
  `chainedHitsRaw: 2` is ignored because its catalog `hitCount.min_hits` is null.
  The current count expression consequently executes one hit. Native
  `sub_8057070` returns the fixed raw count; `TryUseChosenMove` reruns the
  straight-line scan for each pass. This is additional to the 32 rejected IDs.
- **Metadata trap:** Thrash has `chainedHitsRaw: 3` despite a catalog label of
  `Single`. It remains explicitly rejected. Implement its native facing and
  per-pass targeting behavior before enabling it.
- **Not certified by guard acceptance:** later weather-specific accuracy,
  status interactions, recoil/counter ordering, charge interruption and
  multi-hit target replacement. Those are separate evidence checks, not
  additional counted rejections. Adding Rain Dance, reflection or Assist
  changes the interactions reachable through already accepted moves.
- The matrix describes this browser implementation against qualified facts.
  Static coverage does not establish Blue binary parity or playable acceptance.

## Narrow Bonemerang correction after the audit

The later-level Bonemerang defect was corrected separately from the frozen
manual Tiny Woods build. That correction did not admit any of the 32 rejected
IDs above; Thrash remains outside its handler.

- `moves.c:GetMoveNumberOfChainedHits` returns the raw source count, and
  `dungeon_move_util.c:sub_8057070` returns that count without a random draw when
  nonzero. Bonemerang alone uses its verified `chainedHitsRaw: 2`; its admission
  rejects other/missing metadata. Existing single/variable-hit selection is
  unchanged for every other move.
- `TryUseMoveInMoveset` owns one learned-move PP charge around
  `TryUseChosenMove`, whose loop performs the passes. The browser likewise
  decrements the selected slot once before either pass and prints one use
  message. The new pass helper never changes PP.
- The native loop (`dungeon_move_util.c:392-449`) checks the attacker's ability
  to continue before each pass, then runs the straight-line owner
  `sub_80566F8` again. Each browser pass rescans from the user: a first-pass KO
  can reveal a different target behind it. An empty path consumes no accuracy
  or damage draws. A first-pass miss does not cancel the second pass. Fainting,
  dungeon completion, or an admitted native attack-blocking status stops the
  next pass. In particular, adjacent Pikachu's Static can interrupt it.
- Each actual target follows the existing source order: accuracy 1; damage
  calculation's power/critical/variance draws; accuracy 2; then damage, growth
  and contact effects. See `dungeon_move.c:239-255,1333-1391`. Failed accuracy 1
  skips the numerical/accuracy-2 draws for that pass; failed accuracy 2 leaves
  the target available for the next scan. No target object is retained as the
  second pass's authoritative target.
- The single-hit impact block is extracted into one shared helper. Its former
  accuracy-2 `continue` becomes an early helper return; the enclosing ordinary
  hit loop still continues exactly as before. No normal damage formula,
  probability, recoil rule or other move's hit count is changed.

Static syntax/type/lint review qualifies this fix. No game code or automated
playthrough was executed, and the frozen manual run does not cover level-25
Bonemerang or its animation timing.

Own-file ESLint, the full independent typecheck and `git diff --check` passed.
An AST-only comparison against the checkpoint confirmed that the shared impact
block differs only by `continue` becoming a helper `return`; the ordinary
hit-count expression and numerical damage wrapper are unchanged.

## Direct HP and recoil implementation after the audit

The six direct-HP/recoil moves have explicit handlers in the working tree,
covering eight of the historical matrix's species/level entries. After this
group the rejected inventory was **26 move IDs across 36 entries**; its earliest
level remained Treecko's Pursuit at 16. These handlers are outside the immutable 00:20
manual build. Independent source/AST review passed after correcting deferred
EXP ordering; this is not manual move acceptance.

| Move | Handler and caller flags | Comparative source |
| --- | --- | --- |
| Seismic Toss | Direct HP equals user level; move type Fighting, giveExp=true, regular residual damage, reactions enabled, final special flag zero | `move_orb_actions_2.c:741-751`; `dungeon_move.c:714-716` |
| Dragon Rage | Direct HP 65; move type Dragon, giveExp=true, regular residual damage, reactions enabled, final special flag zero; adjacent corner-cut range 8 | `move_orb_actions_4.c:296-303`; `dungeon_config.c:195`; `dungeon_move_util.c:908-913` |
| Endeavor | Direct HP is max(0, target HP minus user HP); move type Normal, giveExp=false, regular residual damage, reactions enabled, final special flag zero | `move_orb_actions_1.c:719-737` |
| Take Down and Submission | Normal damage, then recoil of max(1, floor(user maximum HP / 8)); type None, giveExp=false, recoil residual/faint cause; Rock Head prevents recoil | `move_orb_actions_2.c:222-245`; `dungeon_move.c:726-729` |
| Double-Edge | Same maximum-HP recoil amount and Rock Head protection, through its separate native action owner | `move_orb_actions_2.c:502-523` |

The direct-HP owner follows `dungeon_damage.c:1415-1454`: no normal damage,
critical, variance, ability-boost or accuracy-2 calculations. Its only type
calculation is Wonder Guard's combined matchup gate; it does not scale the HP
amount. The admitted opening roster has no Wonder Guard user. Accuracy 1 still
belongs to the common move caller. A zero Endeavor difference reports no damage,
does not mark the target for full move EXP, and does not sample contact abilities.
Positive damage retains nominal Bide accumulation, Rage, held-item drops and
faint handling. The optional damage settings preserve EXP for every previous caller and
explicitly disable it for Endeavor and the new self-recoil calls.

Recoil runs after a successful nonzero hit, including a target KO. Rock Head
skips it without an RNG draw. `RollSecondaryEffect(user, 0)` only checks that the
user remains valid (`dungeon_move_util.c:1212-1222`); it does not roll a chance.
The damage owner samples eligible Static/Cute Charm flags before returning to
the move action. Recoil follows, and only a surviving user on an active floor
receives the queued contact effect when `TriggerTargetAbilityEffect` runs
(`dungeon_move.c:1278-1307`). The scoped handler preserves that order. Recoil is
self-attributed, so the existing Bide/Rage accumulation and defeat owner remain
available without awarding EXP for self-damage.

The three recoil handlers retain ordinary accuracy-1, damage calculation and
accuracy-2 behavior. Their target KO records a local deferred EXP award;
`AddExpPoints` queues the native award (`dungeon_leveling.c:49-65`), and
`EnemyEvolution` applies it only after the move (`dungeon_move_util.c:206`).
Recoil therefore uses pre-level-up HP and maximum HP. The browser flushes its
local award after recoil/contact resolution only if the user survives and the
opening remains active. A recoil defeat discards it, without persisting a new
field or giving a premature level-up. This closes a low-HP survival error that
would otherwise occur when the KO crosses a growth threshold. The previous
callers' immediate EXP behavior is unchanged.

All six new handlers opt into native nominal damage numbers, including overkill;
Dragon Rage displays 65 rather than the target's smaller remaining HP. New recoil
also has distinct authored damage/faint wording. The general old damage callers
retain their existing display behavior. Existing accepted moves still sample contact before
move secondary effects and activate the sampled flags afterward. Struggle keeps
its separate maximum-HP/4 path. No save field, scheduler, targeting predicate,
normal-damage formula or existing move's PP/hit-count behavior changes.

Static checks: own-file ESLint and all 465 authored source files' strict type
checks passed. An AST-only comparison with the frozen 00:20 source confirmed
17 existing functions unchanged, including numerical damage, target selection,
accuracy, Bonemerang and timers. The numerical impact prefix, contact sampling/activation, secondary-effects
loop and Struggle statements match; removing the new direct-HP dispatch branch
leaves the existing attack AST intact. The former EXP award statements are
extracted without changes into `gainExperience`.
The JSON learnset join confirms six move IDs and eight entries. No game module
was imported or executed.

Independent review reproduced the unchanged-function/EXP/attack comparisons and
closed the recoil-before-level-up finding. Focused pre-commit checks also passed.
These results qualify source structure and the bounded comparative behavior;
Blue binary equivalence and manual late-level move play remain unverified.

## Pay Day and Covet implementation after the first checkpoint

The item-effect group adds Meowth's level-18 Pay Day and Skitty's level-31 Covet,
leaving **24 rejected move IDs across 34 species/level entries**. Both retain
native front/enemy targeting (`0x00`) with blocked corners and the existing
confusion override. The implementation is based on checkpoint
`7eab2dd885edcd56b103f3456b0a71ffdc67e6c3`; independent source review passed
after correcting the nonleader held-drop ordering.
Neither late-level move has been manually played in the frozen opening review.

Pay Day follows `move_orb_actions_3.c:370-389`. It uses ordinary damage, then
`RollSecondaryEffect(user, 0)` checks the surviving user without a chance draw.
Only a target removed by fainting produces money; recruitment is unavailable in
this opening. The original partner retains a valid entity on defeat
(`dungeon_misc.c:489-493`), so a confused hit that defeats the partner does not
produce a pile. The money owner is called even if the later placement fails.
`CreateItemWithStickyChance(ITEM_POKE, FORCE_STICKY_NEVER)` performs no sticky
roll; `sub_8046CE4` performs one `DungeonRandInt(100)` draw and repeatedly halves
its index until the money table is within the floor's bound. All three Tiny
Woods floors use a bound of 40. The existing eight-value browser lookup and its
nonuniform distribution are reused unchanged (`dungeon_items.c:59-85,708-722`;
`dungeon_data.c:112-123`).

The shared item owner now serves missed berries, fainted held items and Pay Day.
Its 25 offsets exactly match the first sentinel segment of `gUnknown_80F4468`
(`dungeon_pos_data.c:16-42`). It tries the origin, N/E/S/W, diagonals, then the
outer ring; walls, stairs and occupied item tiles are excluded, while actor
occupancy is ignored. It stops at the first eligible tile, including failure
when the 64-item pool is full (`dungeon_items.c:451-529`;
`structs/str_dungeon.h:23`). No placement RNG is added. A thrown berry preserves
its existing ID; a newly placed drop allocates an ID only on success.

Faint handling drops every nonleader's held item before awarding EXP and before
`HandleFaint` (`dungeon_damage.c:653-745`), including the original partner. Only
the hero retains its held slot for the dungeon-exit owner. The shared browser
drop now precedes the team-defeat return, closing the prior partner omission.
Pay Day creates its money afterward. The first
drop can therefore occupy the defeated target's tile and move the money to the
next eligible offset. The former browser faint path appended directly at the
target tile without checking occupancy, stairs or the item cap; it now uses the
shared source placement owner. The held slot is cleared even when placement is
lost. Ground spawning never performs automatic pickup or wallet credit.

Covet shares `ThiefAction` (`move_orb_actions_4.c:393-442`, dispatched from
`dungeon_move.c:817-820`). After nonzero damage and contact sampling, the native
secondary gate is `sub_805727C(user, target, 0)`: the factual catalog's 100-percent
secondary label must not consume a percentage draw. The scoped implementation
requires a surviving target on an active floor, then checks Shield Dust and
Sticky Hold before empty user/occupied target slots. Alert Specs and held equipment
updates are absent from the admitted opening item/actor surface. The separately
reviewed wild-spawn owner supplies the native initial-sleep refresh after a
successful transfer. Future equipment expansion must add its source joins before
reusing this scoped handler.

A successful Covet copies the whole held payload, clears the target's slot and
marks the user for regular move EXP. It does not steal the item of a defeated
target; faint handling has already dropped that item. Stolen Poké remains held
with its quantity and does not credit the wallet. The transfer emits its message
without the browser pickup/money audio event, then queued contact abilities
activate. Existing no-Toolbox held-item commands remain unchanged.

Both new moves use the local deferred EXP owner. Pay Day's money draw and item
placement precede EXP/learning draws, while Covet's transfer/contact resolution
precedes the award. Their damage numbers use nominal damage, as the first group
does. No persistent field, save boundary, item kind, menu or old campaign owner
is added.

Static checks after the item/targeting join pass: all 609 authored files'
lint/local-import audit, all 469 authored sources' strict types, and
`git diff --check`. An AST comparison against `7eab2dd` confirms 33
unchanged functions in `mechanics.js` and 22 unchanged combat functions before
the separately reviewed targeting extraction; the
money function, item-name/offset constants, berry trajectory/impact, old
secondary-effect loop, recoil/contact calls and Struggle match their prior
owners. The only berry join replaces its placement tail with the shared helper
and passes the existing projectile ID explicitly. These are static source/JSON
checks; no game module was imported or executed.

Independent review checked native ThiefAction, the zero-chance secondary/Shield
Dust gate, PayDayMoveAction, CreateItemWithStickyChance and SpawnDroppedItem.
It closed the partner held-drop finding and found no remaining defect in this
scoped path. Focused pre-commit checks passed. Blue binary equivalence, item-drop
animation timing and manual late-level move play remain unverified.

## Pass and EXP findings after item activation

- **Variable multi-hit passes:** the former ordinary path checked accuracy 1
  and selected its target outside the hit loop. Comparative native
  `TryUseChosenMove` calls `sub_8057070` before the first target/accuracy pass
  (`dungeon_move_util.c:392`); raw count zero draws the half-open range 2..6
  (`1028-1034`). The browser previously drew its variable count after accuracy 1.
  Each native pass rechecks `CannotAttack`, selects/sorts targets, then enters
  complete move resolution (`392-449`). Battle-sequence review identified
  this as a numerical/targeting audit, separate from visual instrumentation.
  Bonemerang's explicit two-pass correction does not close the variable-hit path.
- **Whole-move EXP timing:** before the pass refactor, only recoil/item handlers
  deferred EXP. Ordinary and multi-target damage awarded/leveled per KO, potentially
  changing later-hit HP, stats, learning and RNG order. Native `AddExpPoints`
  only accumulates `expGainedInTurn` (`dungeon_leveling.c:49-65`).
  `EnemyEvolution` at `dungeon_move_util.c:206` follows all chosen, linked and
  mimic work; `dungeon_leveling.c:70-118` applies totals/levels. Audit the complete
  move/linked-chain boundary before widening deferral. Presentation metadata
  must not silently change this behavior.

The separate [move-execution refactor](blue-move-execution.md) now implements
these bounded corrections, Water Sport's self accuracy draw and explicit
terminal receipt rules after the frozen 0122 build. Independent source review passed;
the 24 rejected move IDs remain unchanged.

## Nominal damage and secondary gate corrections

- **False Swipe nominal damage:** the caller now retains nominal damage through
  accuracy 2 and shared damage. Native `dungeon_damage.c:347-357` displays that
  amount before its one-HP survival clamp at `410-413`. The survival receipt
  places its message after the HP patch and before the ten-frame hit wait.
  A positive hit at one HP still presents damage and retains Bide, Rage and
  contact behavior; it cannot faint, drop an item or award EXP.
- **Bide release contact:** the end-turn release now joins direct-HP contact
  sampling/activation before its separate EXP settlement. Native `Bide2MoveAction`
  (`move_orb_actions_1.c:658-672`) passes the Fighting move type and reaction
  flag into `sub_806F370_Async`; living adjacent targets can sample contact
  abilities in `dungeon_damage.c:144-211`, before the outer target owner
  activates them at `dungeon_move.c:1305-1308`. Zero accumulated energy still
  reaches accuracy 1 when a target exists; successful zero damage produces no
  damage number, hit reaction or EXP mark.
- **Guaranteed-secondary draw ownership:** Mud-Slap
  (`move_orb_actions_3.c:254-265`) and Dynamic Punch (`485-499`) call
  `sub_805727C` with chance zero. That source gate succeeds without a percentage
  draw after its validity/Shield Dust checks. Explicit `secondaryChanceRaw: 0`
  facts now preserve that behavior for these two IDs. Covet keeps its dedicated
  zero-draw join; other 100-percent catalog labels retain their existing draw
  ownership. Move admission remains unchanged at 24 unsupported IDs.

## Metal Claw user secondary

Metal Claw's native secondary gate receives the user twice. Its ten-percent
draw can follow a wild target's knockout and is not blocked by the defender's
Shield Dust. The user must be alive, the floor must remain active, and its
native `unk158` targeting flag must already be set. Successful accuracy 1 sets
that flag on the recipient before the handler, including Bide's release.
The selected catalog has no other admitted user-recipient secondary.

A transient weak actor set now owns that history. Native initialization clears
the flag, and `dungeon_serializer.c:ReadMonster` zero-initializes it while
`WriteMonster` omits it. New objects therefore start clear; floor entry and
same-object dungeon Continue explicitly reset it. Ordinary autosave and
preferences retain live actor identities. No saved field or migration is added.
The successful gate applies the existing stat helper and marks user EXP,
including an already capped Attack stage, before contact activation and whole-move
EXP settlement. Damage, accuracy, target selection and other secondary draws
remain unchanged. Future revival, cloning or new target owners need a fresh
lifetime review. This is comparative source behavior, not Blue binary parity.
