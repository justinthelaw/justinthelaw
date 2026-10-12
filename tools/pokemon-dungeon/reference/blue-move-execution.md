# Opening move execution

Current pass/EXP ownership follows comparative
`pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0`; Blue binary equivalence,
browser timing and native RNG replay remain unverified.
[The immutable full evidence](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-move-execution.md)
preserves the post-`blue-opening-review-20261011-0122` refactor, source addresses,
unchanged-function comparisons and checkpoint-specific counts. Current admission
is summarized in [move coverage](blue-move-coverage.md).

## Pass order

`TryUseChosenMove` selects chained count before the first target scan. Raw zero
draws `DungeonRandRange(2,6)` once; fixed counts draw nothing. Each pass checks
entity/floor validity and `CannotAttack`, selects/sorts fresh targets, casts,
then resolves every target: accuracy1, numerical damage draws, accuracy2, result.
An ordinary miss does not stop the chain; Rollout's stop-on-miss flag is excluded.

| Move | Count | Retained learner |
| --- | --- | --- |
| Barrage | 2-5, one draw | Exeggcute level 3; wild slots remain level 1 |
| Bone Rush | 2-5, one draw | Cubone level 41 |
| Doubleslap | 2-5, one draw | Skitty level 15 |
| Fury Swipes | 2-5, one draw | Meowth level 36/Psyduck level 40 |
| Bonemerang | Fixed 2 | Cubone level 25; line rescans each pass |
| Thrash | Fixed 3 | Cubone level 37; fresh native-order facing even before empty scans |

PP/use text occur once. Status blockers are checked per pass, not between area
targets; contact paralysis can stop the next pass while later current-pass
targets still resolve. Empty initial scans still consume the count draw and cast.
Later empty front/corner passes stop before casting; line and
[Thrash](blue-thrash.md) can cast empty later passes. No old target object becomes
authoritative for a rescan. Owners:
[dungeon_move_util.c:381-477](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_move_util.c#L381),
count helper 1028-1035, and
[CannotAttack](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_logic.c#L622).

Water Sport draws ordinary self accuracy1 before duration: self success follows
the draw (`dungeon_move_util.c:739-750`, `move_orb_actions_3.c:241-252`,
`dungeon_move.c:872-873`). Bide end-turn release bypasses the action executor's
confusion-direction hook and retains existing facing; only Thrash adds facing
inside chosen-move passes (`dungeon_turn_effects.c:361-371`,
`dungeon_action_execution.c:71-77`, `dungeon_move_util.c:392-426`). The admitted
saved-state combination is reviewed; ordinary producers cannot confuse a party
Bide learner, so no normal-play demonstration is claimed.

## Whole-move EXP

A transient context records each KO's source award and recipient eligibility,
without changing EXP/HP/stats/levels during remaining passes. At move completion,
living recipients receive totals in hero/partner order; each recipient's levels
and learning finish before the next. Level 100 receives no award. Owners:
[AddExpPoints/EnemyEvolution](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_leveling.c#L49),
post-chosen/link/mimic `dungeon_move_util.c:205-218`. Linked/copied moves remain
excluded. Per-award saturation stays; below 100 cannot reach it here (largest
threshold 3,700,230, ten level-one foes at most 450 EXP). At most one new learning
request/member follows filled slots; actions cannot begin with pending learning,
so two requests fit the save limit 8. Current saved suspension is in
[mechanics](blue-mechanics.md#damage-abilities-and-learning).

| Terminal cause during current move | Continuation and awards |
| --- | --- |
| Leader attacker faints | Invalid attacker stops; no award |
| Original partner faints, leader survives | Retained native entity/pending forced loss differ from immediate floor-over; no awards |
| Surviving partner later removes leader | Later targets/passes stop; earlier award may apply to living partner |

`EntityIsValid` checks type, not HP (`dungeon_util.c:35-42`). Faint clears the
tile first; original partner sets forced loss before entity deletion
(`dungeon_misc.c:458-494,619-623`). `IsFloorOver` omits that flag
(`dungeon_engine.c:452-479`), EXP checks it (`dungeon_leveling.c:82`), then
`TryForcedLoss_Async` exits (`run_dungeon.c:766-806`). Current-move continuation
therefore permits Bonemerang past a cleared partner tile and already-selected
area targets. This is not a general retained-entity target proof: supported area
moves have one pass; repeated moves use front/corner/line geometry.

The original partner can remain valid for sampled contact even after fatal
recoil (`dungeon_move.c:1279-1310`, `dungeon_move_util.c:217-273`). Contact status
helpers check entity validity/Safeguard/immunity/existing status, not HP
(`move_orb_effects_1.c:307-336,1289-1324`, `dungeon_logic.c:1263-1279`). Dead
recipients never receive level/HP increases. The context records actual terminal
causes instead of inferring missing history from old HP fields.

## Handler joins

Damage samples contact flags before the handler ends; outer target resolution
activates them afterward. Absorb heals before EXP/level healing. Take Down,
Submission and Double-Edge recoil at maxHP/8 with Rock Head immunity; Struggle
uses maxHP/4 without immunity, self-source and `giveExp=false`. Recoil precedes
contact and EXP, using pre-level-up HP. Rage responds only on surviving targets
(`dungeon_damage.c:70-77,99-101`). Sources:
`move_orb_actions_2.c:385-414,502-523`, `move_orb_actions_4.c:343-365`,
`dungeon_damage.c:70-211`.

Pay Day's money/placement precedes learning draws; Covet keeps its zero-draw
transfer gate. Direct-HP moves retain caller amounts/EXP flags and omit numerical
damage/accuracy2 draws. Bide's separate end-turn receipt activates contact before
EXP; zero energy still rolls accuracy1 without EXP mark, number or hit reaction.
See [nominal/secondary corrections](blue-move-coverage.md#nominal-damage-and-secondary-gate-corrections).

## Presentation evidence

Ember records an attempted adjacent tile before terrain/occupant admission,
including empty/wall/outside stops; no second scan, fake actor or accuracy draw.
`GetTile` permits outside coordinates and camera visibility does not clamp them
(`dungeon_map_access.c:41-49`, `dungeon_tilemap.c:120-134`). The compiler owns
precreation frame/travel/drain/empty-impact prewait
(`dungeon_move_util.c:538-541,576-737`). Visible adjacent travel appears C+1,
reaches +21 px at C+8; its visual tail ends C+9, but blocking wait ends C+8
(`:674-695`). Fainted partner invisibility persists; attached effects/waits skip
while retained-entity status snapshots apply (`dungeon_misc.c:486-493`,
`dungeon_8041AD0.c:195-201,1297-1307`).

Face-only input emits a snapshot even for unchanged heading; rejected movement
only when heading changes (`dungeon_main.c:420-425,449-451`). Neither spends turn
or RNG. A living partner's queued learning can precede the defeated-state guard
while still in dungeon phase; rescued states, completed defeat saves and a legacy
request for a fainted actor retain their old exit route. Events remain bounded
by [battle event evidence](blue-battle-events.md), without truncation.

## Synthesis and Rapid Spin

Synthesis (Chikorita level 22/Bulbasaur level 39) admits its exact self-target record: one
accuracy draw, PP spend, clear-weather 50 HP, no damage draws. Existing heal owner
clamps HP and presents effect 7 even at full HP. No default Status Checker or
quarter-HP AI gate is invented. Source:
[SynthesisMoveAction](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_actions_1.c#L949).
Cast 271/terminator hold precedes healing's TRUE drain. Sound 809 can be interrupted
by delivered 606; the instant-batch quota can suppress 606 ([audio](blue-audio.md)).

Rapid Spin (Squirtle level 23) performs ordinary damage, then successful nonzero-damage
cleanup after all passes/contact and before EXP. Chance-zero checks user validity
without RNG, even after target KO; no target/miss/zero leaves success unset.
Cleanup does not require surviving target or active floor. Sources:
[RapidSpinMoveAction](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_actions_1.c#L961),
[TryUseChosenMove](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_move_util.c#L457).
Current cleared classes include represented constriction and Leech Seed; Freeze,
Destiny Bond and traps are not admitted. Clearing Leech Seed preserves its periodic
counter; source faint silently clears linked active statuses before terminal
returns, preserving binding/countdown
([sub_8078084](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_effects_2.c#L293)).
This prevents a redundant cure line when Rapid Spin defeats its seed source.
Artwork 83/terminator hold and sound 678 have separate presentation review.

Historical source/AST/lint/type checks establish bounded comparative ordering,
not higher-level manual play, audio identity or complete Blue handler/clock parity.
No game module, automated battle or playthrough was executed for those checks.
