# Tiny Woods wild slots and initial sleep

`content/blue-wild-spawns.json` pins facts and source hashes from
[comparative Red revision 013475aa](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
Blue binary/RNG/full-AI equivalence remains unverified.

| Species | Internal ID | Body size | Initial sleep |
| --- | ---: | ---: | ---: |
| Pidgey | 16 | 1 | 8% |
| Exeggcute | 102 | 1 | 40% |
| Sunkern | 191 | 1 | 5% |
| Wurmple | 290 | 1 | 5% |

These are `monster_data.json` `chanceAsleep` values selected by
`pokemon.c:GetChanceAsleep`; raw JSON SHA-256:
`024f8d2b42582e4d017e3d408b1229b369396d9321ab11c1b7737d19b52bce2e`.
Only these wild records project the field. Tiny Woods random movement chance is zero.

## Spawn and slot order

- `SpawnWildMonsOnFloor` selects species, initializes, then checks sleep
  (`dungeon_mon_spawn.c:440-523`). The browser draws sleep after its existing
  actor/facing initialization.
- `SpawnWildMon` draws `DungeonRandInt(100)`, even for zero chance, and compares
  `chanceAsleep > roll`. Success uses indefinite sentinel 127 with no duration
  draw (`move_orb_effects_1.c:37-61`).
- Arrivals draw random-movement chance after species/position and before
  initialization, even at zero; initial-floor materialization directly sets false
  (`dungeon_wild_mon_spawn.c:90-109`). Failed position/cap checks stop earlier.
- Native first-free allocation is `dungeon_util.c:273-328`; ordinary Tiny Woods
  capacity is ten (`dungeon_wild_mon_spawn.c:70-78`, `dungeon_config.c:23-24`).
  Browser `enemies` retains fainted entries and replaces its first vacancy,
  preserving turn/room-target order. New IDs prevent stale Leech Seed rebinding.
- Saves retain their actual order; missing historical slots/sleep are not
  reconstructed. The validator already admits fainted entries and sentinel 127.

## Waking

`DisplayActions_Async` skips the wake pass without queued movement
(`dungeon_entity_movement.c:150-194`). A flush wakes initial sleepers adjacent
to living teammates, including blocked diagonals, before tile interactions
(`:241`; `dungeon_monster_house.c:34-75`). No Sneak Scarf/Racket Band is admitted.

A transient WeakSet records actual movement. Walking/waiting do not flush it;
accepted attack/item actions, admitted residual/Bide boundaries and the completed
base beat do. A walking-only turn therefore wakes foes after blocked opportunities;
an earlier non-walk flush can wake them before a later opportunity.

Targeted moves wake sentinel sleep before accuracy 1
(`dungeon_move.c:189`, `move_orb_effects_5.c:541-555`), including Bide/Bonemerang.
Successful berry impacts wake; distant misses do not
(`dungeon_projectile_throw.c:184-190,359-365`).
Covet transfer runs the held-item wake pass
(`move_orb_actions_4.c:434-435`, `dungeon_misc.c:1468-1492`).
Ordinary timed sleep is unaffected; sentinel sleepers emit no repeated block message.

## Save boundary

`performAction`, `prepareDungeonTurn` and `completeForcedTurn` use synchronous
final flushes plus `finally` coverage. Generation clears markers; rejected/
menu/face-only actions create none; terminal defeat/rescue discards them.
No legal returned dungeon retains unsaved wake work or serializes that WeakSet.

[The immutable static proof](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-wild-spawns.md)
retains caller/AST evidence, unchanged-validator comparison against `7eab2dd`
and historical validation counts. Facing, compact AI and PRNG remain adapted;
the proof did not execute game modules or a playthrough.
