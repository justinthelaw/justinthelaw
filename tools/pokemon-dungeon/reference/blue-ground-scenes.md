# Ground-scene order

`story.js` and `render-story.js` reconstruct three transient movement gates
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
