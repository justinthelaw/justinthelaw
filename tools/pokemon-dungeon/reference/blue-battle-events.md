# Opening battle event evidence

Mechanics producers now attach detached actor/item snapshots to transient
events. Saves, the random stream and gameplay decisions do not consume this
metadata. The presentation owner receives explicit walk/action boundaries,
casts, target visits, accuracy failures, HP changes, status/stat attempts,
faints, held-item changes and actual wild arrivals. It does not infer those
facts from final HP or message text.

The reviewed spawn implementation was preserved before instrumentation under
the ignored `tools/pokemon-dungeon/.work/blue-spawn-baseline-20261011-0100/`.
The static source comparison in `.work/blue-presentation-equivalence-20261011.mjs`
parses both revisions without importing game modules. After removing only new
metadata/capture statements and visual scratch values, all 78 existing functions
match: 34 in mechanics, 19 in common and 25 in combat. The Bide miss receipt
retains its original short-circuit condition and its single accuracy draw.
The comparison also preserves the original semantic events and message text.
The four producer files and comparison evidence were then frozen under
`.work/blue-producer-baseline-20261011-0114/` before the separate damage-number
correction below. Save validation and the actor/dungeon shapes are unchanged.
Independent review accepted the producer instrumentation and equivalence proof.

Walking is grouped at the existing `flushQueuedMovement` boundary. Movement
pickup messages and item snapshots explicitly wait for that group. A full actor
snapshot waits only if that actor has a move record since the last flush;
another actor's pending walk does not defer its upkeep. This distinction keeps
swapped actors' destination coordinates from appearing before their movement.
The source references are `DisplayActions_Async` in
`dungeon_entity_movement.c`, `TryWakeSleepingWildPokemon` in
`dungeon_monster_house.c`, and the separately documented spawn lifecycle.

Each actual target visit is recorded before accuracy 1. Initial instrumentation
preserved the former ordinary multi-hit loop without adding an accuracy draw or
rescanning targets. The later, separate `blue-move-execution.md` refactor corrects
that numerical ordering and adds bounded empty-Ember endpoint evidence. Other
no-target move travel remains unrepresented; no geometry is replayed by rendering.
Missing effect artwork is skipped by its presentation owner, not replaced with
an invented effect.

## Event bound

The compiler's 8,192-event limit rejects excess evidence; it never truncates a
valid result. The current admitted roster, save bounds and factual move catalog
give this conservative upper bound. Counts include both original semantic events
and new presentation records.

Independent review confirmed one `performAction`, `prepareDungeonTurn` or
`completeForcedTurn` result per compiler input. Consecutive zero-duration
preparation/input owners are replaced, never concatenated. Visual carry contains
only pose/effect/number tails, not events or additional gameplay opportunities.

| Bounded work | Count | Events each | Allowance |
| --- | ---: | ---: | ---: |
| Target/hit pieces | 74 | 32 | 2,368 |
| Team level increases | 198 | 6 | 1,188 |
| Actor upkeep/action/end wrappers | 13 | 32 | 416 |
| Residual damage calls | 37 | 16 | 592 |
| Item actions/pickups | 12 | 16 | 192 |
| Initial-sleep wakes | 12 | 8 | 96 |
| Setup, arrivals and floor messages | 1 | 64 | 64 |
| Camera boundaries | | | 365 |
| Leader money-throw route | 1 | 64 | 64 |
| Seed-source faint unlink | 12 | 1 | 12 |
| Party Rapid Spin cleanup | 2 | 2 | 4 |
| **Total** | | | **5,361** |

There are at most twelve actor opportunities: two team members and ten live
wild slots. A swap spends the partner's opportunity; Bide release replaces a
blocked normal action. The extra wrapper allowance covers preparation. Two
team moves can each visit all twelve actors, while ten wild actions are
conservatively allowed five hit pieces each. Current valid wild level-one
learnsets are narrower. Multi-hit moves in the factual catalog are single-target;
the area/room handlers use a single pass. No unbounded linked action is admitted.

A hit's 32-record allowance covers its visit/repeat cast, ability announcements,
damage/reaction/faint/drop messages, secondary effects, contact reactions and
move-specific recoil/drain/item work. Recoil, drain, Pay Day and Covet are
distinct move branches; fainting prevents the target's secondary/contact branch.
An ordinary status effect emits at most its effect snapshot, message and status
event; Helping Hand applies two stat effects. Each level emits at most a growth
message/event plus one selected move's learning message/snapshot. No level can
increase more than once toward the level-100 cap.

An actor wrapper covers timer messages, action/cast boundaries, movement and
the three upkeep/action/end sync records. Residual calls are bounded by one
leader hunger call plus poison, burn and Leech Seed on twelve actors. Admission
can retain both poison and burn, so both are counted. Initial sleep can end once
per actor; the bound includes legacy admitted team sentinels as well as ten wild
slots. Berry/pickup branches fit within sixteen records including any drop and
item snapshots. These bounds must be revisited when activating more mechanics.

Seed-source unlink adds one silent sync per actual KO, containing at most twelve
changed actors. Successful Rapid Spin adds at most one cure message and one sync
per party opportunity. Neither adds an effect track, random draw or frame wait.
Money flight geometry remains separately bounded at sixty flight and twenty-five
landing samples; samples do not allocate an event per frame.

## Separate nominal damage display correction

After the metadata comparison was frozen, shared damage numbers/messages were
changed to use the passed nominal amount. Comparative
[dungeon_damage.c:347-402](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_damage.c#L347)
formats and displays `dmgStruct.dmg` before subtracting/clamping target HP.
The browser's HP loss, fainting, Bide accumulation, EXP and random draws remain
unchanged. Healing still displays the capped amount actually restored. A later
reviewed correction retains False Swipe's nominal input and carries a survival
message to the HP-patch boundary before the ten-frame hit wait.

Raw zero damage now adds captured attacker/target evidence to its existing
message. The presentation owner emits that message once, then plays the native
target-team sound when both actors display or waits 30 frames otherwise
(`dungeon_damage.c:313-329`). It does not allocate a number, MISS, hit reaction
or HP patch. Current zero-capable callers all provide a real attacker; the
positive source-less residual callers keep their existing behavior. The receipt
reuses one message, so the conservative event bound is unchanged.

Strict types and focused lint pass. These are source-only checks, not a browser
playthrough or a claim of complete Nintendo DS binary/timing equivalence.
