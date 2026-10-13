# Roux's Adventure scope

The 2026-10-13 owner request keeps the existing adventure scope and adds an
optional Normal/Ground Roux, based on the owner's chocolate-and-white Pomeranian
Work Pet. The game is now **Pokémon Mystery Dungeon: Roux's Adventure**, with
chocolate/cream browser chrome and an authored starting menu. It starts directly
at that menu. Original company cards, cinematic and title logo are retired from
the runtime; their archived evidence remains attributable.

The personality quiz, original sixteen heroes, original partner pool, naming,
awakening, three Tiny Woods floors, Caterpie reunion and reward remain. Roux
adds naughty/energetic answers and a guaranteed final treat question for an
obvious unlock. An explicit Play as Roux choice also accompanies original results.
Town, team formation, later chapters and the former 3D campaign stay excluded.
The original 2026-10-10 boot/title fidelity requirement is superseded only by
this owner-approved rebrand. PRs #397, #404 and #405 are merged history.

| Area | Required boundary |
| --- | --- |
| Creation | Eight questions with category exclusion/follow-up, authored Roux treat unlock and cyclic tie resolution; 16 original heroes plus Roux, original partner pool |
| Adventure | Level-5 pair, three procedural floors, turns/combat/PP, partner AI, items, stairs, loss/retry and rescue |
| Presentation | Two 256x192 Canvas 2D displays, top-down camera, local directional artwork, pixel UI and coherent scene order |
| Browser | Keyboard/touch, focus/visibility recovery, local saves, bounded work, no WebGL |
| Delivery | Static relative-URL runtime closure; independent static authoring checks |

Failed rescues preserve experience, so full hero growth/learnsets remain relevant
even though later dungeons are excluded. Unsupported original retry moves remain visibly unavailable. Roux's authored
learnset uses admitted operations; his own full growth has no evolution. Existing historical saves keep their keys; this opening uses its
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

Roux's moves, growth, quiz and Pickup adaptation are separately recorded in
[the authored brief](../../../tools/pokemon-dungeon/reference/roux-adventure.md).
Original factual catalogs and their digest pins stay unchanged. Rebranding does
not establish a franchise rights grant.

## Sources

- [Nintendo Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
- [Nintendo DS display specifications](https://www.nintendo.co.jp/en/ds/spec/index.html)
- [Original Blue title capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/)
- [Pinned comparative Red source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0)
- `tools/pokemon-dungeon/content/blue-source.json` and `content/blue-onboarding/`
  retain selected facts, qualifications and retired donor hashes.
