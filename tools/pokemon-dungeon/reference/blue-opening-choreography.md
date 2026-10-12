# Opening choreography

`src/blue/render-intro.js` follows comparative Red revision
`013475aa04f5be3191e5527c186d9bfceae7cae0`. The
[8.9-second boot prefix](blue-boot-cards.md) precedes these scene-relative ticks.
Source calculations do not establish Blue frame parity or manual acceptance.

## Arithmetic and cues

- [Movement command](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_script.c#L2504):
  fixed-point distance/speed truncates to at least one tick.
- [Distance arithmetic](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/math.c#L316):
  three refinement steps, half-up multiplication and truncating division.
- [Updates](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_script.c#L677):
  weights run from `(duration,0)` to `(1,duration-1)`; no endpoint snap.
  `WALK_GRID` instead reaches each clamped target and detects completion next tick.
- [Cue delivery](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_script.c#L4130)
  follows controller/actor/object/effect work; recipients resume next tick.

Runtime retains bounded 24.8 trajectories and samples whole nominal ticks,
truncating coordinates before camera translation. No per-frame trajectory allocation.
The title letter's first y4→52 movement at speed 51 lasts 240 ticks, ending at
13260/256; the next lasts 221. From tick 60, deletion is 521, not the former 512.

## Derived schedule

| Scene | Derived events |
| --- | --- |
| Interior, [T01P04 group 5](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p04_station.h#L281) | Client completion 80; carrier flaps 141; staff faces southwest 172, west 180; carrier rises 201–265; northward waypoint 265–409; carrier faces southeast 409, east 417; next waypoint 425–468; camera begins 267; fade 469–499. |
| Exterior, [T01P03 group 29](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p03_station.h#L3148) | First waypoint 0–50; second 50–86; departure continues during fade 87–117. |
| Aerial, [S03 group 1](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s03_station.h#L30) | Carrier begins 35; camera begins 55; flight animation 15 begins 266, then 16/17/18/19/20/21 at 288/310/324/336/344/352; animation 21 is selected again at 360; letter appears 345; bird is deleted 368; white fade 353–413. |
| Title, [S02 group 3](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s02_station.h#L57) | Letter 60–521; small westbound Pelipper 301–437; large sweep 470–530, changing animations at 488/504/519; controller receives completion cue 531; prompt cue 651. |

The movement scenes total 1029 ticks (17.15 seconds). The retained 19-second
cinematic boundary holds white afterward; it is a historical duration choice,
not a measured Blue frame boundary or a current music dependency.
Title-ready is tick 531; prompt is 651 (8.85/10.85 seconds).

`ROTATE_TO(8,DIR_TRANS_10,...)` takes two direction steps; each restarts
animation. [Hidden ornaments](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_sprite.c#L831)
do not advance AX frames, so the aerial letter starts wobbling when shown.

## Geometry and gaps

Blue display center is (129,108). Interior origin is (72,90); exterior camera
(440,220) gives offsets (-311,-112), aerial x144 gives -15, title (144,116)
gives (-15,-8). [Scenery evidence](blue-native-scenery.md) owns pixel comparisons.
Reduced motion fixes interior/exterior/aerial at frames 170/55/250, suppressing
fades, camera motion and title flights. Loading/disposal owns late bitmap closure.

Comparative Red S03 requests one sunset palette cycle at nominal tick 94.
[Blue footage at 0:24–27](https://www.youtube.com/watch?v=4iTyZkVX9DI&t=24s)
stays blue/green through the white fade, so runtime retains daytime.
`native-scenery/aerial-palette-evidence.json` pins 12 Red palettes, 64 six-tick
frames and those observations; compressed footage proves no pixel equality.

Browser opening/title cancellation is immediate. Comparative `STARTMODE_16`
blocks fresh-game cancellation until title completion; early allowed cancellation
selects settled `DEMO_04`. This remains a browser accommodation.
Upper clouds, precise ocean speed/phase, fades/transitions and physical-device
acceptance remain open. Use package `npm run lint`/`typecheck` for static checks;
no game module is imported or executed.
