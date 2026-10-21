# Opening route and ground-scene order

The [current scope](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md)
starts at the authored Roux menu and ends after the first rescue. Dialogue is
the existing English adaptation, not a transcription of the commercial script.

| Stage | Required sequence |
| --- | --- |
| Character creation | Welcome, eight main quiz questions, gender, result, partner choice/confirmation/naming, departure. Original category exclusion, Brave follow-up and cyclic ties remain; the final treat question and optional Roux result are authored additions. |
| Awakening | Partner wakes the hero; human/Pokémon realization; hero naming/confirmation; Butterfree's offscreen cry and arrival; Caterpie's predicament; movement-only departure. No rescue-choice branch. |
| Tiny Woods | A level-five pair enters B1F, then B2F and B3F; choosing B3F stairs reaches Caterpie. No boss, town or team formation follows. |
| Rescue | Caterpie's cry, rescuers approach, reassurance, reunion with Butterfree, Oran/Pecha/Rawst Berry reward, farewell and completed adventure. |
| Retry/Continue | Defeat offers retry from B1F with EXP/levels/moves and tutorial flags retained, HP/PP restored, and money/held items cleared. Continue resumes the saved phase/line; completed Continue stays at the scoped ending. |

`story.js` owns dialogue, named `STORY_BEATS` offsets, movement durations and
`storyMovementGate()`. The app owns transitions/reward publication; the renderer
uses the same beat offsets for actor poses and movement. These numeric offsets
are persisted meanings: inserting a line requires a deliberate save-compatibility
review, not just renumbering constants. Rewards remain the existing saved
completion record; there is no post-rescue Toolbox or later campaign inventory.

`scripts/check-blue-story.mjs` parses source/ASTs without executing game modules.
It pins the authored dialogue at `1444a4f34788`, saved beat positions and nominal
durations, and checks the selected phase route, shared movement owner, reward beat
and B3F rescue branch. The pin protects the adaptation from accidental edits; it
does not establish commercial-dialogue parity. The independent onboarding/fact
checks own quiz catalogs, original partner pairs and level-five facts.

## Movement gates

The app and `render-story.js` reconstruct three transient movement gates
from saved boundaries. They use the paused foreground clock and add no save
fields. Reduced motion keeps full intervals with actors drawn at settled positions.
Dialogue is authored; nominal frame counts do not prove exact Blue duration.

The comparative scripts below are pinned to Red revision
`013475aa04f5be3191e5527c186d9bfceae7cae0`.

| Gate | Selected sequence | Comparative evidence |
| --- | --- | --- |
| `named:3` | Offscreen cry at `named:2`, then Butterfree's eight walks (152 ticks) and 20 settled ticks before partner reply: 172 total | [Player 195–221](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L195-L221), [Butterfree 327–348](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L327-L348), [links 0–7](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L812-L820) |
| `enter:0` | 120-frame movement-only departure; separate westbound paths at speed 384, then create B1F; no rescue-choice menu | [Player 248–259](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L248-L259), [partner 316–324](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L316-L324), [links 8–13](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h#L821-L826) |
| `clearing:1` | Caterpie cry, 30-frame wait, 88-frame rescuer walk, 30 settled frames, then reply: 148 total | [Player 39–68](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h#L39-L68), [partner 79–85](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h#L79-L85) |

Continue reconstructs each gate. Historical `help-choice:0` and `enter:0/1`
normalize to movement-only `enter:0`; named/clearing retain line indices.
Input clears at both gate boundaries. Hidden, unfocused, loading and Help
time does not advance the foreground clock.

Hero naming/confirmation uses the Tiny Woods ground/map; pre-adventure partner
naming uses the personality aura. Historical sparse Blue video observations
corroborate scene order and the hero keyboard's ground backdrop, not exact frames.
The ignored record is
`.work/blue-ready-20261011/source-video/root-observations.json`.
[The immutable observation note](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-ground-scenes.md)
retains recorded timestamps; the repeated 6:20–6:24 attribution for two different
scenes needs rechecking and is not used as a current timing proof.

These are source/ordering qualifications, separate from complete commercial
dialogue parity and manual acceptance of the current gates.

## Manual acceptance boundary

For a fresh acceptance run, record quiz/partner naming, awakening/hero naming,
all three floors, reunion/rewards and completed Continue. Separately exercise
defeat/retry, Continue at a movement gate, and reduced motion. Record the exact
revision and observations in the [opening review](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md);
static checks do not establish a successful playthrough or Blue timing parity.
