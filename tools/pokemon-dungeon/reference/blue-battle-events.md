# Battle event ownership

`src/blue/battle-events.js` captures detached actor/item snapshots from mechanics.
The presentation compiler consumes committed action, movement, target, damage,
status, faint and pickup facts. It never infers decisions from final HP/text,
reruns targeting/RNG or serializes presentation evidence.

Walking groups close at `flushQueuedMovement`. Pickup receipts wait for their
movement group; an actor snapshot waits only for that actor's queued walk.
Comparative owners are `dungeon_entity_movement.c:DisplayActions_Async` and
`dungeon_monster_house.c:TryWakeSleepingWildPokemon` at
`013475aa04f5be3191e5527c186d9bfceae7cae0`.
See [wild-slot/wake ownership](blue-wild-spawns.md).

## Capacity and sequencing

- The compiler rejects more than 8,192 events; it never truncates.
- One `performAction`, `prepareDungeonTurn` or `completeForcedTurn` result
  supplies a compiler input. Zero-duration owners replace rather than concatenate.
  Carry retains pose/effect/number tails, not extra gameplay opportunities.
- Admission bounds two teammates and ten live wild slots. Swaps spend the
  partner opportunity; forced Bide release replaces a blocked action.
- Target visits precede accuracy 1. Repeated-hit and bounded empty-target
  receipts follow [move execution](blue-move-execution.md); missing artwork is skipped.
- Money flight is bounded by 60 flight and 25 landing samples, without a
  per-frame event. New mechanics must re-review the event-cap proof.
- The historical 5,361-event proof preceded later target/camera/guard additions.
  [The immutable instrumentation record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-battle-events.md)
  preserves that table and its assumptions; [Protect](blue-protect.md) records
  the later guarded-target allowance. Do not treat the early total as current.

## Damage display

[Comparative damage source](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_damage.c#L347)
displays nominal damage before HP clamping. The browser follows that order;
HP loss, fainting, Bide, EXP and RNG remain separately owned. Healing displays
the actual capped restoration. False Swipe retains nominal damage and its
survival message before the hit wait.

Zero damage records attacker/target evidence, emits its existing message once,
then uses the native target-team sound when both actors display or a 30-frame
wait otherwise (`dungeon_damage.c:313-329`). It creates no damage number,
MISS, hit reaction or HP patch.

Historical AST evidence froze 78 producer functions under
`.work/blue-producer-baseline-20261011-0114/`; after removing instrumentation
only, their semantics matched. That proof preceded separate numerical fixes
and does not establish Blue binary/timing parity or manual acceptance.
