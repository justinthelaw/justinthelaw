# Opening move execution

This bounded refactor follows the pinned comparative Rescue Team source at
`013475aa04f5be3191e5527c186d9bfceae7cae0`. It changes pass ownership and queued
EXP after the frozen `blue-opening-review-20261011-0122` build. It does not admit
any of the 24 rejected move IDs, add a save field, alter damage arithmetic or
replace the qualified browser random stream. Independent source review passed.

## Pass order

`TryUseChosenMove` selects the raw chained-hit count before its first target
scan. Raw zero makes one `DungeonRandRange(2, 6)` call; a fixed raw count makes
no count draw. Each pass then checks entity/floor validity and `CannotAttack`,
selects and sorts fresh targets, performs its cast and resolves each target.
Accuracy 1 belongs to every target visit, including later passes. Numerical
damage draws still precede accuracy 2. Ordinary misses do not cancel the chain;
the separate stop-on-miss flag belongs to rejected Rollout behavior.

| Move | Raw count | Count draw | Existing opening join |
| --- | ---: | --- | --- |
| Barrage | 0 | 2–5 once | Exeggcute level 3; current wild slots remain level 1 |
| Bone Rush | 0 | 2–5 once | Cubone level 41 |
| Doubleslap | 0 | 2–5 once | Skitty level 15 |
| Fury Swipes | 0 | 2–5 once | Meowth level 36; Psyduck level 40 |
| Bonemerang | 2 | None | Cubone level 25 |
| Thrash | 3 | None | Cubone level37; fresh native-order facing before every pass, including empty scans |

The shared pass owner replaces the former nested ordinary-hit loop and the
separate Bonemerang loop. A pass's status blocker is not repeated between
members of one area target list: contact paralysis can stop the next pass,
while later targets in the current pass still resolve. An empty initial scan
still follows the variable count draw and produces the first cast. Later empty
front/corner-cut passes stop before casting. Line projectiles and the separately
admitted [Thrash owner](blue-thrash.md) can still cast their later empty pass. PP is spent once and the use message appears once.

The four variable IDs receive an explicit raw-zero admission check; their
unchanged factual records already satisfy it. All other admission logic is
unchanged. Native source owners are
[dungeon_move_util.c:381-477](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_move_util.c#L381),
its count helper at `1028-1035`, and
[CannotAttack](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_logic.c#L622).

Water Sport now reaches its ordinary self-target accuracy-1 gate before the
existing duration draw. `AccuracyCalc` draws before returning success for self
(`dungeon_move_util.c:739-750`); `MudWaterSportMoveAction` follows the normal
target dispatch (`move_orb_actions_3.c:241-252`, `dungeon_move.c:872-873`). The
duration and floor end-beat owner are unchanged. This is a separate identified
RNG correction, not a consequence inferred from animation evidence.

## Whole-move EXP

A transient move context collects awards at each actual KO. It captures the
recipient's level eligibility and the source award while leaving EXP, HP,
levels, stats and learning unchanged during the remaining passes. At the native
completion boundary, each living recipient receives its total in hero/partner
slot order. That recipient's level and learning draws finish before the next
recipient is processed. Level-100 members receive no award.

This follows
[AddExpPoints and EnemyEvolution](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_leveling.c#L49)
and the post-chosen/link/mimic call at `dungeon_move_util.c:205-218`. Linked and
copied moves remain outside the opening's admitted surface. The existing KO
amount/experience-mark formula is unchanged. The native per-award saturation
rule is retained; its boundary cannot be reached here by a below-100 recipient:
the largest level-100 threshold is 3,700,230, while ten level-one foes provide
at most 450 EXP. The existing growth/learning owner is unchanged.
A static growth/learnset bound over every starter level shows that this award
can add at most one queued learning request per member after free move slots
are filled. Actions cannot start with pending learning, so at most two new
requests fit within the unchanged eight-request save limit.

The context records terminal causes when damage occurs. It does not infer
missing native history from an old save's HP fields.

| End of current move | Remaining resolution | Queued awards |
| --- | --- | --- |
| Leader attacker faints | Attacker is invalid; stop | None |
| Original partner faints while leader survives | Native retained entity and pending forced loss are distinct from immediate floor-over | None for either member |
| Surviving partner's later hit removes leader | Stop later targets/passes | Earlier award can apply to the living partner |

`EntityIsValid` checks entity type, not HP (`dungeon_util.c:35-42`).
`HandleFaint` first clears the tile's monster pointer, then the original partner
sets forced loss and returns before entity deletion
(`dungeon_misc.c:458-494,619-623`). `IsFloorOver` does not read that forced-loss
flag (`dungeon_engine.c:452-479`); `EnemyEvolution` does (`dungeon_leveling.c:82`).
The later `TryForcedLoss_Async` owner exits with the fallen partner
(`run_dungeon.c:766-806`). The public browser scheduler still ends the dungeon;
only current-move continuation distinguishes these native cases.

This permits a Bonemerang pass to trace past a fainted partner's cleared tile.
It also preserves already selected later area targets after partner failure.
The targeting helper's living-actor filter is not asserted as a general native
validity rule: admitted area moves have one pass, and admitted repeated moves
use front/corner/line geometry. Unsupported repeated room effects would need
a separate retained-entity target audit.

The original partner can remain valid for sampled contact activation even after
fatal recoil, until forced loss. The source target owner checks immediate
floor-over before `TriggerTargetAbilityEffect`, whose own gate is entity
validity (`dungeon_move.c:1279-1310`, `dungeon_move_util.c:217-273`). Dead
recipients never receive a level or its HP increase.
The scoped contact status helpers also have no HP gate: infatuation and
paralysis check entity validity, safeguard, their ability immunity and existing
status before drawing/applying a duration (`move_orb_effects_1.c:307-336,1289-1324`).
`AbilityIsActive` retains the same entity-type validity rule
(`dungeon_logic.c:1263-1279`).

## Handler joins

Contact flags are sampled by damage before the move handler completes; the outer
target owner activates them afterward. Absorb's nominal-damage healing therefore
precedes queued EXP/level healing. Take Down, Submission and Double-Edge use
max-HP/8 recoil with Rock Head immunity. Struggle uses max-HP/4 without that
immunity, passes self as source with `giveExp=false`, and retains regular
residual presentation. Its recoil now precedes contact activation and EXP; the
self-source also restores the native surviving Rage response to that recoil.
The shared Rage response now requires a surviving target: native damage returns
before that response on a fatal hit (`dungeon_damage.c:70-77,99-101`). This
prevents the self-source correction from adding an incorrect dead-actor stage
mutation and removes that older fatal-hit mutation from other damage callers.
These joins follow `move_orb_actions_2.c:385-414,502-523`,
`move_orb_actions_4.c:343-365`, and `dungeon_damage.c:70-211`.

Pay Day's money quantity/placement remains before learning draws. Covet's
zero-draw transfer gate is unchanged. Seismic Toss, Dragon Rage and Endeavor
retain their direct-HP amounts, no accuracy-2/numerical-damage draw, the scoped
Wonder Guard check and their original give-EXP flags. Bide release has a
separate end-turn receipt boundary and now samples/activates contact before
that receipt settles EXP. Its zero-energy path retains accuracy 1 without an
EXP mark, damage number or hit reaction.

## Transient presentation and learning joins

Only Ember's existing adjacent scan supplies optional empty-target evidence.
It records the attempted tile before terrain/occupant admission, including
empty, wall, inadmissible-actor and outside-grid stops. No second scan, fake
actor or accuracy draw is introduced. The actual point can be one cell outside
the map: `GetTile` returns the out-of-bounds tile, while `sub_803F428` checks
camera visibility without clamping grid coordinates (`dungeon_map_access.c:41-49`,
`dungeon_tilemap.c:120-134`). The presentation owner supplies the nonzero travel
creation's preceding frame (`sub_8056564`, `dungeon_move_util.c:538-541`), travel,
the effect drain and the one-frame empty-impact prewait (`576-737`). It preserves
the fainted partner's invisibility across results and skips attached effect
creation/waits while still applying its retained-entity status snapshots
(`dungeon_misc.c:486-493`, `dungeon_8041AD0.c:195-201,1297-1307`).
For visible adjacent Ember, the travel record distinguishes its visual tail from
the native blocking handle: after creation at C, the origin appears at C+1,
the seven 3-pixel advances reach +21 pixels at C+8, and the visual tail ends at
C+9 exclusive. The handle wait ends at C+8, so the effect drain does not add a
spurious ninth blocking tick (`dungeon_move_util.c:674-695`).

Face-only input emits an explicit face snapshot even when heading is unchanged.
A rejected movement emits that snapshot only when heading changes; a blocked
same-heading command preserves the prior pose (`dungeon_main.c:420-425,449-451`).
Both still consume no turn or RNG. A surviving partner's already queued learning
request can be answered before the defeated-state action guard: first request,
matching living actor and legal slot checks are unchanged. Rescued-state input
stays rejected. The app only shows this learning-before-defeat path while still
in the dungeon phase; a completed defeat save or a legacy first request for a
fainted actor retains the prior defeat route.

The 5,361-event conservative bound in `blue-battle-events.md` covers these
joins. Empty-target/face records fit the action/setup allowance, and the summed
recipient message/sync fits the hit/level allowances. No events are truncated.

## Static verification boundary

The ignored `.work/blue-pass-audit-20261011.mjs` parses the frozen/current sources
and factual JSON only. It checks unchanged functions, unchanged target output
after erasing optional trace evidence, unchanged save types/validation, and
unchanged admission after the four already-satisfied raw-zero guards. Numerical
damage, accuracy, growth/learning, status timers, contact sampling and item
transfer owners remain unchanged. Focused lint and strict types accompany the
source review. Independent review reproduced the four runtime hashes and all 74
unchanged functions; 473-source strict types, focused lint, whitespace and
pre-commit checks passed. No game module, automated battle or playthrough was
executed.

The subsequent [nominal damage and secondary gate corrections](blue-move-coverage.md#nominal-damage-and-secondary-gate-corrections)
retain False Swipe's nominal amount through accuracy 2, restore its one-HP
survival after subtraction, join Bide contact and record Mud-Slap/Dynamic
Punch's source zero-chance sentinel explicitly. Their static review is separate
from the unchanged-function comparison above.
Browser PP/learning UI timing, AI, PRNG and full Blue binary parity remain
qualified; this refactor establishes the bounded comparative execution order.

## Synthesis in prolonged Tiny Woods retries

Synthesis is admitted only for its single-hit self-target healing record. The
three Tiny Woods profiles require clear weather, whose comparative native value
is 50 HP. The existing healing owner handles clamping, full-HP results, effect 7,
status display and result numbers; no weather or save state is added. Initial
accuracy still draws once and the selected slot spends PP, with no damage draws.
The source is [SynthesisMoveAction](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_actions_1.c#L949)
and its retained weather table.

Chikorita learns it at level 22 and Bulbasaur at level 39. Failed rescues preserve
EXP and moves. This is source/static evidence, not a manually played higher-level
acceptance. Default playable IQ lacks Status Checker, so no quarter-HP AI gate
is added. The browser's existing foe-proximity rule for autonomous self moves
remains qualified.

The separate cast uses selected effect 271 and the existing terminator-hold
support before healing's TRUE drain. Separately reviewed sound 809 starts on
the fresh cast handle's first source update. A later heal sound 606 interrupts
it when delivered to the shared PCM owner; the existing instant-batch quota
can suppress that later request, as documented in `blue-audio.md`. The sounds
and native image records do not establish complete Blue audiovisual or AI identity.

## Rapid Spin in prolonged Tiny Woods retries

Squirtle learns Rapid Spin at level 23. Its exact admitted record uses ordinary
damage, followed by status cleanup after that chosen move's raw-hit passes and
contact activation, before EXP. Positive damage sets a transient success flag;
the chance-zero user-validity gate adds no random draw and still succeeds after
a target KO. No target, either accuracy failure or zero damage leaves the flag
unset. A successful cleanup does not require a surviving target or active floor.
The source owners are [RapidSpinMoveAction](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_actions_1.c#L961)
and [TryUseChosenMove](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_move_util.c#L457).

The opening represents Leech Seed within the two native cleared status classes.
Its cleanup clears that active status and source binding while preserving the
periodic counter. The shared HP-zero owner also follows
[sub_8078084](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_effects_2.c#L293):
a fainting seed source silently clears linked active statuses, preserving their
binding and countdown. This happens before terminal returns and prevents an
extra cure line when Rapid Spin defeats its own seed source. Original-partner
validity remains distinct from HP and floor completion; sync cannot reveal a
hidden fainted actor.

No frozen/Destiny Bond status, trap, weather, save field or general status engine
is added. Historical donor attribution stays intact while action 096's stale
trap-removal claim is corrected with explicit native pins. All other move records,
RNG call sites and save owners remain unchanged. The correction leaves 22
unavailable move IDs across 31 species/level entries. Its target artwork and
terminator hold and sound 678 are separately reviewed. Native message visibility,
original Blue audio identity and complete Blue handler/clock parity remain
qualified. Higher-level casting has not been established by manual play.

## Bide end-turn direction ownership

The native end-turn owner expires Bide and calls `TryUseChosenMove` with
`MOVE_BIDE_2` directly. It bypasses the action executor's confusion-direction
hook; the chosen-move loop only adds a direction draw for Thrash. The browser
therefore retains the Bide user's existing facing at release. Removing its
extra confusion draw also removes that unsupported RNG advance. Targeting,
accuracy, damage, contact, queued EXP and presentation keep their existing
owners.

This is a correction for an admitted saved-status combination and future move
owners. Current ordinary Tiny Woods producers cannot confuse the hero or
partner who knows Bide, so no normal-play demonstration is claimed. Source
evidence is comparative Red at `013475aa04f5be3191e5527c186d9bfceae7cae0`:
`dungeon_turn_effects.c:361–371`, `dungeon_action_execution.c:71–77` and
`dungeon_move_util.c:392–426`. No save field or producer is added.
