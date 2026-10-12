# Mud Sport and Water Sport

The opening runtime stores independent Mud Sport and Water Sport floor timers.
Pinned comparative Red source draws each from the half-open range `{10,12}`.
The browser stores 11 or 12 before its same-action end-beat decrement, preserving
10 or 11 effective beats in this scheduler. At each eligible end beat, Mud
decrements first and Water second; each emits its native fade message on reaching
zero. Defeat prevents the end-beat update, and a newly generated floor resets
both counters.

Mud Sport halves Electric damage while active. Water Sport independently halves
Fire damage. Both feed the existing type-context calculation; this slice adds no
general weather model. Old saves may omit `mudSport`, which reads as zero.
Validation accepts the optional field only as a bounded integer and does not
rewrite the loaded object.

Mudkip can learn Mud Sport on a retained-retry path and can be a partner. No new
AI branch is added: the opening's IQ 1 lacks native Status Checker, so the active
Mud timer does not suppress recasting, and the move's native AI flags contain no
75-percent condition roll. The existing qualified range-7 self-move policy is
reused.

Mud Sport uses actor animation 12, cast effect 180 and target effect 181. Both
effects use attachment set 3. The two existing banks are packed by one uniform,
deterministic post-dedup rule: height descending, width descending, then the
ASCII `width:height:rgbaSha256` key. The implementation is documented in the
[packer source](../art/blue/native-effect-format.mjs) and the generated
[runtime metadata](../../../games/pokemon-dungeon-reimagined/assets/blue/battle-effects.json).
Pose/effect ordering and layer geometry remain stable; extracted RGBA bytes for
every previously referenced layer were preserved while only atlas coordinates
changed. The two banks plus the Hypnosis reserve use 3,379,200 decoded bytes,
448,512 fewer than the prior two-bank layout.

These mechanics and effects are qualified from pinned Red source at
`013475aa04f5be3191e5527c186d9bfceae7cae0`; exact Blue-binary scheduling is not
claimed. The late Mud Sport path has not been manually cast.
