# Tiny Woods wild slots and initial sleep

This bounded correction uses the pinned comparative Red revision
[`013475aa04f5be3191e5527c186d9bfceae7cae0`](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
The four numerical records and exact source hashes are retained in
`tools/pokemon-dungeon/content/blue-wild-spawns.json`. Blue binary equivalence,
cartridge RNG sequences and the complete native AI remain unverified.

## Facts and spawn order

| Tiny Woods species | Native internal ID | Body size | Initial sleep chance |
| --- | --- | --- | --- |
| Pidgey | 16 | 1 | 8% |
| Exeggcute | 102 | 1 | 40% |
| Sunkern | 191 | 1 | 5% |
| Wurmple | 290 | 1 | 5% |

These are `chanceAsleep` values in `data/monster/monster_data.json`, selected by
`pokemon.c:GetChanceAsleep`. The raw JSON SHA-256 is
`024f8d2b42582e4d017e3d408b1229b369396d9321ab11c1b7737d19b52bce2e`.
The authoring projection adds `chanceAsleep` only to these four species; it does
not invent zero values for unused roster entries. All Tiny Woods encounters
must have a projected integer chance. The dungeon's source
`randomMovementChance` is zero (`data/dungeon/dungeon_data.json`).

`SpawnWildMonsOnFloor` selects the species in scan order, allocates and
initializes the actor, then calls the initial-sleep owner
(`dungeon_mon_spawn.c:440-523`). `SpawnWildMon` draws `DungeonRandInt(100)` and
compares `chanceAsleep > roll`, even if the chance is zero. A successful branch
sets sleep to the indefinite 127 sentinel without a normal sleep-duration draw
(`move_orb_effects_1.c:37-61`). The browser consumes its sleep draw after its
existing actor initialization/facing step.

Ordinary arrivals first select species and position, then execute their
random-movement chance draw before initialization, even at Tiny Woods' zero
chance (`dungeon_wild_mon_spawn.c:90-109`). Initial floor materialization assigns
`moveRandomly=false` directly and does not execute that draw. Failed position or
live-cap checks do not enter the later initialization/sleep calls. Native
initialization includes general-RNG Hidden Power generation and native AI work;
the browser retains its qualified compact initialization and PRNG, so these
specified draw joins do not claim a complete native RNG trace.

## Persistent wild-slot order

Native `sub_804550C` chooses the first free body allocation and then the first
invalid wild entity (`dungeon_util.c:273-328`). All four species use body size
one. Tiny Woods has no Monster House; its ordinary arrival limit is ten active
wilds (`dungeon_wild_mon_spawn.c:70-78`; `dungeon_config.c:23-24`).

The browser now keeps fainted wild actors as vacant positions in `enemies` and
replaces its first `hp<=0` position when spawning. It no longer compacts the
array at the end of a beat. The array never grows beyond its existing ten-entry
bound. This preserves wild turn order and room-target enumeration after a
faint/arrival. Fresh actor IDs still advance, corresponding to a new spawn
identity rather than reviving the old entity; old Leech Seed references do not
bind to a replacement.

Existing saves keep their recorded array order. Lost historical slots are not
reconstructed, and existing actors are not rerolled for sleep. The prior save
validator already admits fainted wild entries and status value 127; its AST is
unchanged. No save version, field, optional-key rule or count bound is added.
Dead entries remain excluded from occupancy, AI, ordinary rendering and target
selection. Current-result defeat events can still render their brief fade.

## Wake timing

`DisplayActions_Async` returns before the wake pass when no walking is queued
(`dungeon_entity_movement.c:150-194`). When it flushes a walking group, it calls
`TryWakeSleepingWildPokemon` before movement-tile interactions (`241`). That
owner wakes initial sleepers adjacent to a living team member, including across
blocked diagonal corners (`dungeon_monster_house.c:34-75`). The opening has no
Sneak Scarf or Racket Band.

A transient WeakSet records actual `moveActor` calls. Walking and waiting do
not flush it. Accepted attack/item actions, the admitted residual-damage/Bide
owners, and the completed base beat flush it at their corresponding source
boundaries. A walking-only turn therefore wakes adjacent foes after their
already-blocked action opportunities; a preceding non-walk action can flush
movement before a later foe's opportunity. Proximity wake is silent. The
browser refreshes facing/goal through its existing compact target policy;
exact native AI refresh remains qualified.

Targeted move attempts wake sleep127 before accuracy 1, even when the move
misses (`dungeon_move.c:189`; `move_orb_effects_5.c:541-555`). Bonemerang's
per-pass scan and Bide release use that same wake owner. Successful berry
impacts wake it, while a missed distant berry does not
(`dungeon_projectile_throw.c:184-190,359-365`). Covet's successful held transfer
runs the explicit held-item refresh wake pass
(`move_orb_actions_4.c:434-435`; `dungeon_misc.c:1468-1492`). Ordinary timed sleep
is not affected by these sentinel-specific helpers. Initial sleeping wilds do
not emit a repeated blocked-action message every turn.

## Static save-boundary proof

The game simulation is synchronous. The only `moveActor` callers are
`performAction` and `tryAiMovement`; the latter is reached through
`actAI -> advanceOtherActors`. The two advancement owners are
`prepareDungeonTurn` and `finishLeaderTurn`.

| Public entry/boundary | Pending movement guarantee |
| --- | --- |
| `performAction` | All accepted movement reaches `finishLeaderTurn -> finishBaseBeat`; a `finally` also flushes on every return or exception. |
| `prepareDungeonTurn` | The unscheduled-leader branch completes `advanceOtherActors -> finishBaseBeat`; a `finally` covers every return or exception. Other branches do not move actors. |
| `completeForcedTurn` | The accepted path completes `finishLeaderTurn`; a `finally` covers every return or exception. |
| Creation, retry and floor transition | `generateFloor` clears the marker and uses direct placement, not queued movement. |
| No-op, rejected, menu and face-only actions | They create no movement marker, so a final guard does no work and does not wake nearby sleepers. |
| Terminal defeat/rescue | The marker is discarded without further gameplay wake work. |

An AST-only audit checked those three synchronous `try/finally` boundaries,
the complete movement/AI caller sets, the normal final flush and floor reset.
It also compared `validateDungeon` against checkpoint `7eab2dd` and found its
AST identical. Therefore a legal returned dungeon cannot retain unsaved wake
work, including an exception after movement. The transient marker is never
serialized or inferred on reload.

Pinned source hashes and all four projected probabilities were checked from
JSON. Focused strict types passed for four mechanics roots and 284 resolved
source files; focused ESLint and diff whitespace checks passed. Full-tree types
currently await the separately staged battle-presentation event contract.
No game module was imported or executed. Independent root review passed: all
nine source hashes, four chance/body-size values, spawn draw branches, vacancy
retention, sentinel wake joins and synchronous final flushes were checked.
The adapted facing/AI/PRNG qualification remains in force.
