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
- Existing `content/onboarding`, `content/species`, `content/dungeons` and
  `content/effects` retain their original Blue/shared/Red source qualifications.
  `export-blue-opening.mjs` projects factual JSON without executing game code.
  `content/blue-opening.json` records the SHA-256 of every input JSON resource.
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
  two or three enemies; arrival attempts occur every 36 turns, up to ten live
  wild actors. Source encounter threshold boundaries are retained.
- B1F/B2F money uses the source lookup and repeated index halving under a
  40-Poké bound: possible amounts are 4, 6, 10, 14, 22, 26, 34 and 38.
  B3F has Oran/Pecha berries. Without a toolbox, each actor has one held slot;
  an occupied slot leaves the next berry on the ground. Money, eating, pickup
  and placing the hero's held item are implemented.
- Eight-direction movement, corner checks, facing without time passing,
  regular attacks, move PP, partner move toggles, one selected shortcut,
  source-derived fixed-point damage/type rules, early move/status handlers,
  EXP/growth/learning, HP regeneration, hunger, wind timeout and retry.
- The domain has no animation clock. One accepted action produces a bounded
  event list. Idle browser frames and open menus do not advance enemies.
  Save admission validates bounded shapes, IDs, learned moves, species stats,
  numeric resources, map occupancy, RNG and a path to the stairs.

## Remaining fidelity gaps

- Browser xoshiro randomness is independent of the DS generator and call
  schedule. Geometry reuses the existing original-derived generator with its
  bounded connectivity repairs. Population placement/order is adapted; no
  cartridge seed replay or tile-for-tile dungeon claim is supported.
- AI uses compact pathfinding, local foe selection, following and wandering.
  This does not reproduce the full native movement/IQ/tactic decision tree.
  The scheduler uses one hero/partner/enemy pass; speed, Bide/Rage and some
  status ordering are simplified. Learning choices are presented after the
  current browser turn, rather than through native suspended continuations.
- Later moves attainable through extensive repeated tutorial grinding retain
  factual learnsets, but distinct effects such as Pay Day, Charm, weather and
  charging are not all implemented. `isMoveSupported` explicitly rejects these
  actions without PP or turn loss; they must not silently become plain damage.
- Item throwing/transferring, the complete original menu/IQ/tactic surfaces,
  exact failure-item loss and all animation/message timing remain unverified
  or incomplete. Retry currently clears money and held items and retains EXP
  and levels; it does not apply the initial level-five boost again.
- Source-backed numbers do not prove complete behavior. This module has no
  claim concerning exact sprites, audio, dialogue, DS layout or cinematics.

## Verification and next manual review

- Own-file ESLint passed. The official independent typecheck passed after the
  initial implementation; later concurrent app edits produced app-only errors.
  Re-run the full check after integration.
- `export-blue-opening.mjs --check` passed. Data-only comparison verified all
  16 starting stats, move order and PP. No tests imported/executed game source.
- Manually inspect all starter menus, blocked diagonal movement, facing/menu
  actions without turns, ordinary/move attacks, depleted PP, partner following,
  held/ground berries, save/reload, both faint routes, retries, each stair and
  the Caterpie/reunion stopping boundary. Compare Blue footage separately;
  static checks do not establish playability or visual acceptance.
