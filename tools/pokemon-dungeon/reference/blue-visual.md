# Blue Rescue Team opening visual evidence

Checked 2026-10-10 for the narrowed boot-to-Caterpie browser game. The source
edition is the original Nintendo DS **Blue Rescue Team**, not the GBA or DX
remake. The new renderer adopts its screen geometry and presentation structure;
the local artwork, lettering, portraits, logo and cinematic remain original
adaptations. They are not pixel-identical Nintendo assets.

## Directly observed references

| Source | Observation | Implementation consequence |
| --- | --- | --- |
| [Nintendo manual, printed pp. 14–15, 24–25](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf) | The quiz has a luminous cloud backdrop and blue framed question/choice panels. Naming uses a letter grid. Tiny Woods has pale ground, green edges and a one-line floor/level/HP HUD. The separate upper screen can show map, team or message log. | Preserve two displays, compact framed UI, keyboard naming and independently selectable upper information. |
| [Original DS title screenshot](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/) | 256×384 stacked capture. The upper 256×192 is black. The lower display contains the title above clouds and blue sea, with a white envelope near the upper edge. | Do not duplicate the logo onto both screens or add a wide cinematic crop. |
| [Original DS dungeon screenshot](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287134/) | Upper display has four lavender team rows; empty slots remain visible. Lower display has small overhead sprites, a compact HP/floor line, an outlined map overlay, and a blue framed message window. | Keep 1:1 logical pixels, nearest-neighbor scaling, tight HUD and 4-slot team layout. This image is a later dungeon, not a Tiny Woods layout reference. |
| [Original DS dialogue screenshot](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287137/) | Upper display shows an illustrated region map with a location label. Lower display has a large bottom message frame and yellow speaker name. | Preserve the two-screen distinction, speaker emphasis and location panel. This image is at Pelipper Post Office, not the opening clearing. |
| [Original Blue Butterfree screenshot](https://www.serebii.net/mysteriousdungeon/eng-ds9.jpg) | Removing the capture's 8-pixel surround leaves a bottom message window at (16,136), 224×40 pixels, with three text rows and an external portrait. The entry meadow is bright green, with a stump above the characters and no tan path. | Use the native message geometry, a 208-pixel text area, an inline yellow speaker name, and independent portrait positions. |
| [Blue Rescue Team original opening/title video](https://www.youtube.com/watch?v=PsqaxW-COlM) | The source identifies itself as the Blue opening sequence and title. Anonymous video retrieval returned a sign-in/bot challenge. No frame sequence or timing was inspected. | Do not claim frame timing, exact cinematic staging or animation parity from this link. |

Screenshots and the manual were downloaded to temporary reference files only.
No pixels or commercial script from these sources were copied into runtime
assets. Screenshots are evidence of the game, not redistributable art licenses.

## Runtime drawing contract

- Two independent 256×192 logical Canvas 2D displays; drawing uses integer
  positions and disables image smoothing. The host owns responsive sizing.
- Dungeon grid: 24 logical pixels per cell, centered camera, eight sprite
  directions and animation interpolation that never advances the simulation.
- Menus and dialogue use a local original bitmap alphabet. Choice hit bounds
  are returned in lower-screen coordinates for pointer input and an accessible
  DOM mirror. The host uses `paginateDialogue` to retain all text in three-row,
  208-pixel pages. The normal frame is (16,136,224,40); portraits sit outside it.
  A legacy longer page expands the window instead of discarding text.
- Upper dungeon display supports map, team and message log. Pre-game upper
  display stays black. Opening dream dialogue can explicitly black out both
  backgrounds.
- Original terrain uses a separate deterministic decoration hash. It never
  consumes the mechanics RNG. No runtime CDN, web font or remote image exists.
- Species PNGs are fetched individually. There are 23 scoped species and 8
  clips per species; each decoded atlas occupies 1 MiB. A renderer retains at
  most 12 atlases after each scene load and disposes bitmaps and pending fetches.
- A separate 288×192 portrait sheet contains 23 original 40×40 face crops from
  the authored 96-pixel source fronts. It adds 216 KiB of decoded memory and
  keeps face detail separate from the reduced world sprites.

## Source-derived opening sequence

The pinned [comparative Red source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0)
provides the original ordering and movement coordinates. It is not proof of
identical Blue timing. The `DEMO_03` owner in
[`ground_event_data.h`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_event_data.h)
orders the post-office interior, exterior, aerial town, and animated title.

| Stage | Source ownership | Presentation |
| --- | --- | --- |
| Post office interior | [`t01p04` group 5](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p04_station.h) | A random starter visits two Pelipper at their straw perches. One Pelipper waits, flaps, rises, and exits while the camera pans upward. |
| Post office exterior | [`t01p03` group 29](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p03_station.h) | Pelipper leaves the open-beaked building, accelerating northeast. |
| Aerial town | [`s03` group 1](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s03_station.h) | Northward camera pan; distant Pelipper curves right, then sweeps left toward the viewer at increasing sizes and drops a letter. A 60-frame white fade precedes the title. Blue stays in daylight. |
| Animated title | [`s02` group 3](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s02_station.h) | Letter descends; a small Pelipper crosses west; after a 32-frame pause a large Pelipper sweeps northeast and catches the letter. The prompt appears later and blinks in 10-frame intervals. |

The movement reconstruction uses nominal 60 Hz script frames, preserving
fixed-point waypoint speeds, explicit pauses, and the 8-pixel ground-coordinate
grid. The authored upper screen remains black. Nominal interior/exterior/aerial
movement and fade windows are 497/115/407 frames. The opening then holds white
until the 19-second presentation boundary. Native `MUS_INTRO` runs continuously
across the cuts and waits for its nonlooping end; its 876 music ticks and tempo
changes yield about 19 seconds, but GBA driver completion is not DS timing proof.
The animated title's nominal cue and prompt boundaries are 8.75 and 10.75 seconds.
An explicit user skip can select the settled title instead.

## Field staging

The entry and reunion use the fixed camera and actor coordinates from
[`d01p01`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h).
The hero and partner stand at lower-screen positions (112,104) and (144,104).
Butterfree follows the source's eight approach waypoints from the left edge to
(128,80); the worried turning cycle uses the source's four 30-frame directions.
At the reunion Caterpie and Butterfree stand at (112,76) and (144,76). They leave
east after the farewell. These are nominal script-derived movements; the browser
story has original wording and input pacing rather than exact script timing.

The end clearing uses
[`d01p02`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h):
Caterpie starts at (128,76), facing north. The rescuers enter from below the
display at y=204 and walk 88 pixels north before the conversation. Named story
beats drive wake-up, surprise and thankful reactions. Motion remains visual
only and never changes story or dungeon state.

The comparative source's
[`portrait_placements.h`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/portrait_placements.h)
plus the DS display offset places the hero portrait at (24,80), the flipped
partner at (192,80), and Caterpie/arrival Butterfree at (64,24). Reunion
Butterfree uses the flipped upper-right placement at (152,24).

The interior composition was checked against the original
[startup capture](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Startup_Cutscene.png)
and [interior image](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Pelipper_Post_Office_interior.png).
The exterior was checked against a
[Blue press screenshot](https://images.nintendolife.com/screenshots/4996/900x.jpg).
All runtime scene paintings and the flight sheet were authored from geometric
primitives; these reference images are not paint, tracing, or sampling inputs.

## Asset provenance and limitations

`art/blue/export.mjs` reads the already-authored original character PNGs from
the authoring `art/roster` and `art/production` trees, checks their recorded SHA-256 values,
and reduces 96-pixel cells to 32-pixel cells with deterministic nearest-neighbor
sampling. It records every original clip hash in `assets/blue/manifest.json`.
The 23 encoded character atlases total 581,789 bytes. Four original cinematic
paintings add 27,573 bytes and the portrait sheet adds 9,748 bytes, for 619,110
bytes of PNG art. Existing 3D runtime asset bundles
are not requested by this renderer.

Generate and check these PNGs with the repository's required Node 24.21.0
toolchain. Its zlib 1.3.2.1 encoder produced different compressed bytes from the
local Node 26.11.0/zlib 1.2.12 combination. The corrected Node 24 export passed
`--check`; all 28 runtime PNGs had identical decoded RGBA bytes to the frozen
review snapshot, while 27 compressed files changed. Source hashes were unchanged.

[PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab) was inspected
as a reference route, but not imported. Its README distinguishes original
Chunsoft art from community submissions. The submission policy grants
noncommercial credited reuse of submitted work; it does not establish a
rights-holder license for the original commercial sprites. Likewise,
[pret/pmd-red](https://github.com/pret/pmd-red) is comparative Red version
research, not proof of Blue rendering or a commercial-asset license.

Still unverified: exact Blue boot/cinematic frame timings, exact cloud/ripple timing,
font metrics, palette values, title logo geometry, original portraits, all
sprite-frame timings, exact Blue clearing tiles and camera choreography, and browser/device
visual acceptance. The new terrain, world map and cinematic are newly authored.
Do not label this renderer an exact replica, or equate static checks with a
human comparison against the Nintendo DS game.

## Visual acceptance checklist

- Verify the title upper display is black and lower display is exactly 4:3.
- Verify every available hero and partner fits a 24-pixel dungeon cell with
  recognisable front, back, side and diagonal views.
- Verify all name keys, menu rows, speaker labels and three-line portrait
  messages remain within their frames at integer and fractional CSS sizes.
- Verify darkness, minimap discovery, stairs, berries, money and enemy positions
  match the selected state; the renderer must not expose undiscovered entities.
- Verify one turn animates once, pausing/returning does not jump state, and
  reduced motion holds visual poses without delaying input.
- Compare captured scenes against a lawful original Blue playthrough before
  making stronger claims about visual fidelity.
