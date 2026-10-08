# Unselected Sinister construction and floor AI proposal

This package owns one pure call of pinned comparative Red
`sub_806A898(entity, r7, FALSE)`: initial construction has `r7=FALSE`;
floor refresh has `r7=TRUE`. It does not own construction, floor refresh
iteration, saved history, mutation, attacks/items, placement, turn PCs, or a
live hook. No existing module selects this proposal or its typedef. Exact
native evidence is commit `6bcbec4f906938c0243aa2026bcbd41b577bab85`, tree
`3a0dcb371062a672e6c291e6e0bda4314499e985`. Every source/catalog/dependency
fingerprint is in `sources.json`, based on parent
`2bc25c0e0c5916aa105d08ed9a27065d6baaba33`.

The product remains original Blue Rescue Team. This is qualified comparative
Red C behavior over original browser geometry and the accepted upper16
xoshiro Dungeon sampler, not Blue binary or native instruction/RNG parity.
In particular, `dungeon_ai_movement.c:447–448` explicitly records uncertainty
about matching AvoidEnemies in Blue. That uncertainty stays an admission
obligation; this leaf does not settle it by claiming equivalence.

## Boundary and ownership

`prepareSinisterAi(input:unknown, catalogs:Catalogs,
draw:typeof escortDungeonRandomInteger)` returns detached, deeply frozen
`SinisterAiPrepared`. It requires the exact accepted draw function identity;
there is no supplied predicate, damage, action, geometry or arbitrary RNG
callback. The input is plain data, copied before inspection; malformed
records, unsupported source coordinates/room access, missing remembered
slot bytes, or invalid identities fail without touching caller state.
Returned draws carry cap/output/before/after state in source order. A cap1
exit choice still pays one transition. Failed proposals have no commit.

The `AiActor` contract is an explicit projection of actual canonical/native
observer bytes. Its existence is not a source witness and does not admit a
new save field. The producer must join every supplied current value to the
actual actor, genuine temporary actor, or native lifetime receipt named
below. No omitted field defaults to zero, false, an intended leader, a
species rule, or a newly inferred historical value.

| Input | Current derivation or historical witness |
| --- | --- |
| owner session/map/actor/generation/revision and acting slot | Exact transaction binding and current allocation receipt; ActorId remains the canonical browser generation identity. The explicit16-bit generation here is the native spawnGenID witness, not an inferred conversion from ActorId |
| identity, actual HP/maxHP/Belly, held bytes, actual two abilities, source status classes | Join the actual temporary/final actor projection. Ability overrides/Transform/Conversion2 must come from their real owner; base-profile abilities are not a substitute. Belly only supplies the equivalent positive integer part read by FixedPointToInt |
| isTeamLeader, isNotTeamMember, raw tactic, enabled IQ, action direction | Retained native slot bytes at this call. Incoming intended party role/tactic/IQ is not sufficient for initial AI, which precedes those later copies |
| behavior, shopkeeper, joinedAt, room/visibility, prevPos4 | Actual entity source fields and ordered retained positions, including retired/reused target slot bytes. Entity.room differs from Tile.room |
| target pointer/expected generation/objective/flags/unkC, targetPos, action parameters, waiting/allySkip/moveRandomly | Genuine initial resets or prior results with actual producer/history proof. `decoyAITracker` is a separate EntityInfo byte; it is not target.unkC |
| mobileTurnTimer and visualFlags/previousVisualFlags | Real initialization/reset or prior result. Initial successful InitEntityFromSpawnInfo resets timer0 and both visual flags0; later calls retain them. No synthetic zero on resume |
| four team,128 wild and132 active entries | Browser frozen envelope; actual pointers, holes and ordered source-active prefix must be supplied. Native Red capacities4/16/20 are comparative facts; this adapter deliberately retains the browser's existing4/128 envelope. Enlarged native scans require an explicit qualified adaptation, not truncation or guessed slot order |
| leaderSlot before | Actual gLeaderPointer equivalent, including a nonnull stale slot. Null makes this call scan real team order for the first valid isTeamLeader and return the updated cache. No invented current leader lookup |
| terrainFlags, Tile.room, four walkability-mask bytes, object flags and monster pointer | Exact observed construction phase. ResetTile zeros masks; later source rebuilds them. Occupancy reads pointer-nullness, not HP/type validity. Do not replace partial masks with final terrain adjacency |
| roomData bounds,32 junction counts and ordered active prefixes | Initial new-run zeroing or real retained preceding floor inventory, then actual rebuild receipts. ResetFloor alone does not reset them. Preserve duplicates, self coordinates, order and count; unused tails are not input |
| tileset, visibility, monsterHouseTriggered, decoyIsActive | Genuine current globals. Crossable liquid mapping derives from the current catalog tileset plus the required preceding LoadDungeonTilesetAssets receipt |
| beforeRandom | Exact qualified Dungeon stream at this call, after all preceding source draws; not combat/encounter/presentation RNG or a reseed |

Canonical SpeciesForm observers cover real canonical actor identities. Native noncanonical sentinel/dummy identities require an actual entity representation owner before their AI can be admitted; zero-rate Decoy cache generation does not allocate a Decoy actor. Decoy status/tracker/treatment are implemented, but no guessed canonical species stands in for a real dummy.

Null slots represent genuine null pointers; type0 observers retain the old
slot bytes when a nonnull historical pointer is readable. A missing target
slot observer is an explicit failure, not a fresh target reset. Active slots
must be a supplied compact valid prefix with a null tail; no source-active
list is reconstructed. Type0 is not considered valid by scans. Validity is
source EntityIsValid (type not NOTHING), not an additional HP predicate.

The caller owns input/replay/lifetime/raw schema proof and the all-actor
refresh sequence. The output only contains the changed AI/action/flags and
leader cache, with exact retained fields in beforeAi/afterAi. It emits no
simulation event and never commits actor, slot, scheduler or RNG changes.
Commit must authenticate owner/phase/current input fingerprint and before
RNG, write only this declared result, then advance the real source call PC.
The floor-wide owner visits actual final active team slots first, then wild
slots, passing each predecessor's real committed AI/RNG/cache results.
Do not apply all calls to one pre-refresh snapshot.

## Real source call phases

`dungeon_mon_spawn.c:691–817` InitEntityFromSpawnInfo performs its two
ResetMonEntityData calls, clears held item, sets actual HP/maxHP1, Belly100,
resets target, timer, waiting and flags, then LoadIQSkills and
`sub_806A898(entity,FALSE,FALSE)`. It retains actual isTeamLeader/tactic/action
direction and some IQ state; ResetMonEntityData is not a blanket slot zero.
The general Hidden Power draw owner precedes this AI call. Cached natural
HP/stats/moves/held fields and actual party data are copied afterward.
Source sleep sampling/orientation follow their actual constructor PCs;
neither is sampled here. Source fixed actor creation observes the real
partial construction scan and retained previous room/junction inventory.

`run_dungeon.c:335–341` GenerateFloor is followed by actual roomData,
walkability and junction rebuilding. The final
`sub_806A914(TRUE,FALSE,FALSE)` visits the real active array after team/wild
placement and final resources/held/tactics/sleep. `a1=FALSE` refreshes every
valid actor; it is not a rescue-target-only filter. Source leader skipping
uses actual current isTeamLeader, so initial intended party leader is not
automatically a zero-draw case.

## Branch behavior preserved

The wrapper skips AIMovement only for the genuine current leader; it sets
targetPos one tile south. Nonleaders reset only the three source target
flags, then evaluate Be Patient half-HP, Wait There, integer-zero Belly,
rescue-target, run-away, eligible pickup, and ordinary target choice in that
order. Rescue pays Int8 even when later wrapper facing overwrites its sampled
action direction. Direct NOTHING/PICK_UP_AI assignment preserves action-use
indices. PASS/WALK construction clears the two indices and leaves the other
action fields unchanged; canMove comes from all424 pinned navigation rows,
including genuinely immobile species.

Choose scans the actual candidate array and preserves first nearest ties,
behavior0/shopkeeper exclusions, decoy treatment and Petrified rules. WALL
crossing bypasses ordinary sight/invisibility/blinker checks inside the
inclusive5-by5 deltas. TargetLeader uses raw tactic table; IsTacticSet has
the distinct leader rule. It then tries the actual leader cache, then
generation-matched remembered prevPos[0..3], then Wander. A remembered
pointer's type is not checked before reading its generation/previous bytes.
The normally unreachable item branch is retained, but the real wrapper
leader predicate prevents entering it during this owned call.

Avoid uses the distinct CanSeeTarget geometry and does not impose Choose's
ordinary behavior/shopkeeper filters. Natural-junction room escape searches
south-first0..7; otherwise exit selection preserves the native greater-or-
equal next-step-distance rule and strictly greatest exit-distance tie. The
final mirror target is stored with the native signed16-bit position conversion; it is not clipped to the map, pathchecked or randomly replaced.

Wander preserves native Entity.room dispatch, stale objective/target on room
fallthrough, old opposite direction captured before junction randomization,
three different direction searches, and exact active-prefix exit sampling.
WALL corridor IsAtJunction pays Int100 and updates the actual signed16-bit
timer; below200 is false, otherwise resets0. Other mobility uses exact mask
matches0x54/0x51/0x45/0x15/0x55, with actual IQ/item/boss/liquid overrides.

Movement probes consume no draws. They read the current tile's exact cached
mask after impassable/house/trap/lava checks, then pointer-null occupancy.
Source All-Terrain Hiker/Super Mobile can reduce a ghost's permission; that
source behavior is preserved. DecideMovement preserves diagonal turn
preference, occupancy/ally skip/waiting, ±45 versus ±45/±90 search limits and
reset of the two try flags when a direction is blocked without a monster.
Run Away updates current/previous visual flag4 even with show-effectFALSE.

Targetability and visible-teammate/run-away sight are separate: the former
uses room bounds plus the local distance2 two-direction terrain walk; the
latter uses room bounds or corridor visibility0→2. Neither substitutes an
ordinary raycast. Room rectangle endpoint names/comparisons remain literal.

Finally, targetPos nonzero and the exact source **OR** of two negative status
predicates updates action.direction. Only floor-refresh requests actual
sprite orientation (`sub_806CE68`); initial keeps the supplied retained
sprite facing. A request does not select/execute an animation. Its real
presentation owner must also preserve the source animation-id selection;
directional art mapping is explicitly south-first rather than the unrelated
north-first support FACINGS array.

## Finite ledger and remaining integration proof

| Per call | Actual ceiling |
| --- | --- |
| candidate records | 132, preserving browser envelope |
| team visibility / leader scan | 4 each |
| remembered positions | 4 |
| exits inspected or sampled | 32 inspected;10 paid samples maximum |
| Dungeon draws | 11 =10 exit samples plus1 room-junction sample. Corridor WALL costs at most Int100+2Int8; rescue1; ordinary branches0–1 |
| movement probes | 13 = up to8 Wander/Avoid probes plus5 DecideMovement probes |
| returned intrinsic simulation events C/K/I/A | 0/0/0/0; caller commit, display, cache/history writes and continuation are separate finite owners |
| observed grid | at most128×128 as an engineering input ceiling, not copied native geometry; exact OOB sentinel all zero with room255 |
| plain detached input | 400,000 nodes,16 depth,16,384 array length,64 record keys,128 string units,1MiB aggregate text |

These bounds are source branch ceilings, not old constant wander counts or
a whole-turn4096 proof. Returned ordered draw receipt is at most11 entries;
each contains two four-word RNG states. The source branch string records the actual conditional corridor/room/timer/exit/fallback route. Candidate/grid/junction inventories
are not returned. Output is one owner/phase binding, two AI records, two
leader-cache refs, one action/facing/flags result, <=13 movement probes, and
<=11 draws. Counting every ordinary object/array/primitive occurrence (including the duplicated action alias when serialized) gives at most402 output nodes: two42-node AI records,6-node owner, two8-node RNG states,265-node source receipt, two3-node leader refs,18-node repeated action and seven root/scalar nodes. The caller must bound each actual committed write/event and
prove source initialization/reset/reuse, retained slot generation, sprite
orientation and geometry masks/room inventories across real new floors and
quicksave restore. The native serializer includes AI target/action/timer
and visual state, but this contract does not invent a browser restore path.
Genuine old v24 sessions retain their old owner until return.

This package supplies no initial/floorwide hook, constructor, general RNG,
cache, saved source indices, effective-ability defaults, sleep, placement,
respawn, current AI turn owner, factory, registry, codec or frozen schema
change. Full-game admission remains dependent on the concrete raw producer,
ordered commit owner, qualified geometry/Blue uncertainty decisions and
independent immutable SPEC/QUALITY review; there is no encounter exclusion
used to pretend those obligations are complete.

## D05 verification

`node tools/pokemon-dungeon/scripts/check-sinister-initial-ai.mjs
--native-root /path/to/pinned-native --negative-controls` reads only text,
Acorn AST, JSON, and immutable Git blobs. It rejects8 deliberate text
mutations of draw-owner, timer, mask, history, tracker, flag and OR guards;
joins all424 canMove facts directly to native JSON; checks exact native and
base dependency pins; and confirms no other game module selects this leaf.
It never imports/evaluates/compiles the leaf or native code. Strict no-emit
types, lint/local-path checks and configured source hygiene are separate.
Static checks do not establish human gameplay, device latency or Blue
binary matching.

## Recovery onto the current campaign

The original proposal implementation and typedef are recovered byte-for-byte.
The historical provenance body and its original base commit remain preserved in
`sources.json`; that original Git checkpoint is unavailable in the fresh clone.
All ten original dependency and three catalog Git blobs and SHA256 values also
exist unchanged at the available integration base
`efe20598c424cb09873dbc1def9aad9f7fe97d44`. The recovery section records this
independent anchor and both exact recovered leaf hashes.

The current campaign contract has one additional early-campaign scene typedef.
The checker authenticates its exact current hash, removes only that recorded
four-line addition for comparison, and requires the original dependency hash.
It also verifies the original bytes and Git blobs at the available base; no
historical checkpoint or current resource behavior is inferred or rewritten.
Three negative source controls reject altered, omitted or duplicated additions.
The complete36-pin native Git/source proof and eight behavior source controls
remain required. This requalification supplies no selected consumer, saved AI
history, constructor or complete raw factory.
