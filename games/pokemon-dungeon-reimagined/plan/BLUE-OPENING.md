# Blue Rescue Team opening

## Current scope — 2026-10-10

Justin requested PR #397 be refactored to the original Nintendo DS presentation,
from the opening cinematic and title menu through the personality test, partner
selection, awakening, Tiny Woods and Caterpie's reunion with Butterfree. Stop
after the rescue and its reward. Town, team formation, Thunderwave Cave and all
later chapters are outside this version.

This instruction supersedes the historical full-campaign and 3D requirements in
PLAN.md, FULL-GAME-GOAL.md and the previous handoff. The reference is the original
Blue Rescue Team, not DX or Explorers. The active runtime is `src/blue/`, with two
256 × 192 Canvas 2D displays and local assets. It does not initialize Three.js or
the historical v24 campaign/save graph. Existing saves retain their original
storage keys; this opening has a separate versioned save namespace.

## Work and acceptance

| Responsibility | Required result |
| --- | --- |
| Opening | Ordered cinematic, title, top menu and input transitions |
| Personality | Eight category-exclusive questions, conditional follow-up, sourced scoring and cyclic tie resolution |
| Characters | Sixteen possible heroes, original partner pool and type exclusions, names in the correct story order |
| Adventure | Level-5 pair, three procedural Tiny Woods floors, turn-based movement/combat, moves/PP, partner AI, ground/held items, stairs, loss/retry and rescue |
| Presentation | Native screen geometry, top-down camera, local directional sprites, legible pixel UI, dialogue pacing and coherent scene staging |
| Browser | Keyboard and touch, focus/visibility recovery, local saving, no WebGL requirement, bounded work per turn and frame |
| Delivery | Static export containing only the scoped runtime resources; signed commits to the existing PR branch |

Original-game sources and existing factual catalogs establish rules independently
of presentation assets. The selected runtime now uses published original Rescue
Team sprites, portraits, scenery, font and UI tiles with pinned provenance and
explicit Blue pixel comparisons. The current exact-visual instruction supersedes
the historical authored-art-only preference for these public image/data sources.
No ROM is included, and source attribution is not a publisher reuse license.
Dialogue and score remain authored adaptations. Record script, soundtrack and
unverified Blue behavior as open fidelity gaps; sampled pixel matches and static
checks do not establish perfect replication.

Keep historical implementation/evidence recoverable. Do not alter old save
schemas or overwrite old browser saves. Existing static audits remain applicable
to retained source. Manual, user-directed browser inspection and gameplay are
permitted; D05's prohibition on automated game-source tests/playthroughs remains.
Website tests continue to use inert game fixtures. Commit/push authority covers
PR #397's selected branch; merging, deploying or mutating issue/PR metadata still
requires the applicable explicit authorization.

## References

- [Nintendo Blue Rescue Team manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
- [Nintendo DS display specifications](https://www.nintendo.co.jp/en/ds/spec/index.html)
- [Original Blue title screenshot](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/)
- [Comparative Red source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0)
- Existing `content/onboarding`, species, dungeon and effect catalogs retain
  their per-record source qualifications. Red evidence is comparative unless
  corroborated for Blue.
