# Blue opening scope

The 2026-10-10 request narrowed the game to the original Nintendo DS opening:
company cards/cinematic, title and save menus, personality quiz, partner
selection/naming, awakening, hero naming, Tiny Woods and Caterpie's reunion
with Butterfree. Stop after the three-berry reward. Town, team formation,
Thunderwave Cave, later chapters and the former 3D campaign are excluded.
PR #397 is merged; its branch is not an ongoing delivery target.

| Area | Required boundary |
| --- | --- |
| Creation | Eight category-exclusive questions, conditional follow-up, sourced scoring/cyclic tie resolution; 16 heroes and the original eligible partner pool |
| Adventure | Level-5 pair, three procedural floors, turns/combat/PP, partner AI, items, stairs, loss/retry and rescue |
| Presentation | Two 256x192 Canvas 2D displays, top-down camera, local directional artwork, pixel UI and coherent scene order |
| Browser | Keyboard/touch, focus/visibility recovery, local saves, bounded work, no WebGL |
| Delivery | Static relative-URL runtime closure; independent static authoring checks |

Failed rescues preserve experience, so full hero growth/learnsets remain relevant
even though later dungeons are excluded. Unsupported retry moves remain visibly
unavailable. Existing historical saves keep their keys; this opening uses its
own versioned journal.

Published original artwork/font/UI sources supersede the former authored-art-only
preference. Preserve provenance and Blue pixel qualifications; attribution is not
a reuse license. Include no ROM. Dialogue remains authored, and exact timing,
audio and behavior are qualified in the [review](BLUE-OPENING-REVIEW.md).
Background music is intentionally absent (2026-10-11); gameplay/UI effects remain.

Unused campaign resources were retired with recoverable
[history](BLUE-PRUNING.md). Do not alter old saves. D05 permits static inspection
and manual browser play, but forbids automated game/native execution and playthroughs.
Website tests use inert fixtures. The [game instructions](../AGENTS.md) own engineering rules.

## Sources

- [Nintendo Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
- [Nintendo DS display specifications](https://www.nintendo.co.jp/en/ds/spec/index.html)
- [Original Blue title capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/)
- [Pinned comparative Red source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0)
- `tools/pokemon-dungeon/content/blue-source.json` and `content/blue-onboarding/`
  retain selected facts, qualifications and retired donor hashes.
