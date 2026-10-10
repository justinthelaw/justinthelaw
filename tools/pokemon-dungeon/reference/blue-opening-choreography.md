# Opening choreography audit

Checked 2026-10-10 against public comparative Red source commit
`013475aa04f5be3191e5527c186d9bfceae7cae0`. This note covers the selected browser
opening in `src/blue/render-intro.js`. Source review establishes the calculations
below; it does not establish Blue frame parity or replace manual browser review.
No game module was imported or executed for this audit.

The subsequent [company-card integration](blue-boot-cards.md) adds an 8.9-second
boot prefix. All movement ticks below remain relative to their own cinematic
scene; the prefix does not change those paths or title-relative timings.

## Movement and cues

The earlier renderer interpolated between exact waypoints using rounded,
independently entered frame numbers. The native `CMD_BYTE_80` behaves differently:

- [The movement command](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_script.c#L2504)
  divides the fixed-point distance by the supplied speed, truncating to an integer
  duration of at least one tick.
- [Fixed-point distance](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/math.c#L316)
  uses three refinement steps. Its multiplication rounds half upward; division
  truncates. A floating-point Euclidean distance is not equivalent.
- [Movement updates](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_script.c#L677)
  use interpolation weights `(duration, 0)` through `(1, duration - 1)`. The next
  command reads the last position; it does not snap to the requested endpoint.
- [Cue delivery](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_script.c#L4130)
  occurs after the frame's controller, actors, objects and effects have acted.
  A waiting recipient resumes on the following tick.
- `WALK_GRID` is a separate operation: it clamps each axis to the given speed,
  reaches the target and detects completion on the next tick.

The renderer now stores bounded 24.8 positions, uses those arithmetic rules,
preserves each partial endpoint, and derives later movements and cues from the
preceding segment. Rendering samples whole nominal ticks and truncates world
coordinates before applying the camera. It allocates no new trajectories per
frame.

For example, the title letter moves from world y4 to y52 at speed 51. Its first
segment lasts 240 ticks, but the final position is 13260/256, or y51.796875.
The second segment therefore lasts 221 ticks. Starting at title tick60, the
letter is deleted at tick 521 after that second movement. The earlier hardcoded
tick 512 deleted it before the source movement finished.

## Derived schedule

Ticks are relative to each scene's first script action, at a nominal 60 Hz.
Display-driver fade phase and Blue scheduler equivalence remain unverified.

| Scene | Derived events |
| --- | --- |
| Interior, [T01P04 group 5](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p04_station.h#L281) | Client completion 80; carrier flaps 141; staff faces southwest 172, west 180; carrier rises 201–265; northward waypoint 265–409; carrier faces southeast 409, east 417; next waypoint 425–468; camera begins 267; fade 469–499. |
| Exterior, [T01P03 group 29](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p03_station.h#L3148) | First waypoint 0–50; second 50–86; departure continues during fade 87–117. |
| Aerial, [S03 group 1](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s03_station.h#L30) | Carrier begins 35; camera begins 55; flight animation 15 begins 266, then 16/17/18/19/20/21 at 288/310/324/336/344/352; animation 21 is selected again at 360; letter appears 345; bird is deleted 368; white fade 353–413. |
| Title, [S02 group 3](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s02_station.h#L57) | Letter 60–521; small westbound Pelipper 301–437; large sweep 470–530, changing animations at 488/504/519; controller receives completion cue 531; prompt cue 651. |

The three movement scenes total 1029 ticks, or 17.15 seconds. The existing
19-second cinematic boundary remains a qualified soundtrack-duration choice and
holds the final white image after movement. Title readiness is 531 ticks
(8.85 seconds); the prompt cue follows 120 ticks later, at 651 (10.85 seconds).
Their exported constants are derived from the movements rather than maintained
as independent numbers.

`ROTATE_TO(8, DIR_TRANS_10, ...)` takes two eight-tick direction steps for the
interior turns. Both diagonal poses are restored, and each direction change
restarts its native sprite animation. Hidden ornaments do not advance their
animation: [the drawing owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_sprite.c#L831)
returns before the AX frame update. The aerial letter consequently begins its
wobble when unhidden.

## Coordinates, loading and remaining differences

The existing Blue field center `(129,108)` remains. The interior image's source
origin is `(72,90)`. Exterior camera `(440,220)` gives actor offsets `(-311,-112)`;
aerial camera x144 gives x offset -15; title camera `(144,116)` gives `(-15,-8)`.
No scenery pixels, dimensions or native S03 margins changed. Direct Blue image
corroboration is recorded in `blue-native-scenery.md`.

Reduced motion retains a fixed interior frame 170, exterior frame 55 and aerial
frame 250. Fades, camera movement and title flights remain suppressed. Asset
loading still awaits the species, scenery, ornament and aura resources before
startup. Aborts and load failures dispose pending resources; late bitmaps close
before they can enter a disposed renderer.

The audit also identified two edition-specific findings:

- S03 initially disables palette animation, then command 3B/38 requests one
  palette cycle after its fade and waits, at nominal tick 94. The native
  `sub_80A3B80(0,1)` trigger allows one cycle and leaves repetition disabled.
  This is a Red transition. Manual browser inspection of the published Blue
  intro [by Pokemon Dungeon](https://www.youtube.com/watch?v=4iTyZkVX9DI&t=24s)
  found cyan/blue sky and water with green forest at 0:24 and 0:25. At 0:27 the
  white fade begins while the sky remains blue and the letter is in the
  foreground. The browser therefore retains its daytime palette. Earlier
  scenery wording about disabled animation described initialization only.
  The authoring record `art/blue/native-scenery/aerial-palette-evidence.json`
  pins the 12 Red palettes, their 64 six-tick frames and these Blue observations.
  The compressed, horizontally stretched video establishes the visible edition
  difference, not pixel equality or exact frame timing.
- The browser allows immediate opening/title cancellation. Comparative
  `STARTMODE_16` blocks cancellation for a new game's `SCENARIO_MAIN == 0` until
  the title completion cue enables it; existing saves can cancel sooner.
  Early cancellation selects the settled title through `DEMO_04`. Blue input
  timing and whether to retain the browser accommodation need separate review.

The observed Blue cinematic begins around 0:07 after logos and reaches its
white fade around 0:27. These are player timestamps, not frame-counted scene
boundaries; they do not prove or correct the current 19-second duration.

Native title cloud/ocean animation, exact aerial palette channels, fade phase,
Blue scene transitions and device acceptance remain open. The loading audit and
static checks do not establish those results.

Validation: `node scripts/check-source.mjs` passed for 594 authored files and
`node scripts/check-types.mjs` passed for 461 source files. Both commands parse
and inspect source without executing the game.
