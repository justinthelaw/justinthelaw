# Starter clip-page contract v2

This is an original, editable **art candidate implementation** for the 16 Blue
quiz heroes, including all ten partner species. It is not accepted final art,
a runtime loader, a completed roster, or gameplay. V1 and its three historical
art candidates remain unchanged.

## Frozen file layout and identity

| Property | Contract |
| --- | --- |
| Profile | `directional-pixel-clip-v2`, schema version 2 |
| Asset identity | `character.<canonical pokemon-NNN>.default.pixel-v2` |
| Page granularity | One species + one clip per local PNG |
| Page / cell | 384×768 RGBA; four 96×96 columns, eight directional rows |
| Anchor | `[48,92]`, untrimmed cell; no per-frame recentering |
| Gutters | At least two transparent pixels on every cell edge |
| Sampling | Nearest min/mag, no character mipmaps, sRGB |
| Alpha | Binary straight alpha; zero RGB under transparency; alpha test 0.5 |
| Encoded limit | Each file strictly below 1,048,576 bytes |
| Decoded page | 384 × 768 × 4 = 1,179,648 bytes = **1.125 MiB** |
| Acceptance | `candidate-unaccepted`; `runtimeIntegrated: false` |

Rows are front, front-right, right, back-right, back, back-left, left,
front-left. The selected row is the nearest 45-degree sector of **actor heading
minus camera bearing**, wrapped to 0–7. Camera bearing is `atan2(dx,dz)`.
Heading zero faces world +Z; row 2 faces screen right, row 6 screen left.
At fixed heading zero, camera bearings 0,45,90,135,180,225,270,315 degrees select
rows 0,7,6,5,4,3,2,1. The viewer's cyan world +Z arrow is independent of that
selection and is recorded in eight orientation captures.

The page-index is the small future handoff: species/asset identity, clip,
relative path, encoded/decoded size and SHA-256. Its hash is recorded in the
full manifest. It is **not consumed by game modules**. `manifest.json` also
records every cell hash, all 20 editable source hashes, the unchanged v1 raster
utility hash, authored anatomical features, timing and review status.

## Motion vocabulary

Frame durations are milliseconds; all clips restart only on an explicit
presentation caller request. Nonloops clamp their last frame. A clip finishing
never grants a turn or causes damage.

| Clip | Durations | Loop | Authored behavior |
| --- | --- | --- | --- |
| idle | 240,200,240,200 | Yes | Breath, small appendage movement, blink |
| walk | 110,110,110,110 | Yes | Opposite biped contacts; diagonal quadruped leg pairs; bird toes/wing balance |
| turn | 110,110,130,160 | No | Head lead, planted step, opposite correction, settle |
| attack-physical | 140,90,110,180 | No | Rear anticipation, forward contact, extended paw/jaw/club, recovery |
| attack-special | 180,120,140,200 | No | Gather, raised head, open-mouth projection posture, settle |
| cast-status | 170,170,200,160 | No | Closed-eye focus, raised arms/forepaw/head, release |
| hit-light | 90,100,130,160 | No | Brief closed-eye recoil and recovery |
| hit-heavy | 100,170,180,220 | No | Larger recoil, low brace, recovery |
| defeat | 150,200,240,800 | No | Stagger and lowered/collapsed body with closed eyes |
| celebrate | 130,160,170,170 | No | Crouch, hop with raised appendages, landing |
| rest-sleep | 320,500,640,500 | Yes | Lowered tucked posture, closed eyes, two intentional breathing holds |
| interact | 180,150,190,190 | No | Notice, asymmetrical greeting, nod, settle |

These are compact four-frame authored animations, not smooth skeletal motion
or per-move effects. Shared pose curves articulate separately authored anatomy.
No whole PNG is rotated or recolored to substitute for species anatomy. Local
parts are projected and depth sorted at each view; eyes are culled by their
surface normal. Left/right views preserve asymmetric tail and held-bone detail.

Authored exceptions: Cyndaquil and Skitty normally have narrow/closed eyes;
sleep is also distinguished by posture, and Cyndaquil extinguishes its flame
quills while asleep. Turn is a directional *transition gesture*; the caller
still owns the actual world heading. Defeat is a low collapse, not a rotated
upright sprite. Walk and idle intentionally contain settling holds. Effects,
portraits, sex/shiny/modern variants, evolution lines and all other species are
outside this wave.

## Viewer memory and lifecycle

`art-preview/production/` imports only tools and the pinned local Three.js.
It loads one selected species/clip page, or three visible pages in composition
mode. Old textures, materials and geometries are disposed before replacement.
Replacement requests are serialized and stale completions are disposed, so
rapid control changes cannot accumulate parallel image decodes. Page hiding
freezes the presentation clock; reduced motion starts held; page exit disposes
scene resources. Context loss gives an explicit reload path.

The visible-page peak is **3.375 MiB** of decoded character texels. The declared
future character-page ceiling is 24 MiB, allowing at most 21 pages (23.625 MiB).
That ceiling is not a total renderer/CPU budget: browser image copies, the
384×96 inspector canvas, terrain, framebuffers and driver overhead are extra.
The viewer reports resident, peak and disposed page counts. It implements no
game cache, actor visibility rules, transitions, domain actions or performance
acceptance. A complete 192-page starter preload would be 216 MiB and is forbidden.

## Reproduction

From `tools/pokemon-dungeon/`:

```sh
node art/production/export.mjs
node scripts/check-production-pixels.mjs
PIXEL_CAPTURE_BROWSER=/path/to/chromium node scripts/capture-production-pixels.mjs
```

Package aliases are `production:export`, `production:check`, and
`production:capture`, respectively. The existing `assets` command includes
`production:check`; all checks remain static and independent of game execution.

The independent checker does not execute the generator or import game modules.
It parses PNG chunks/CRCs/filter-zero RGBA, validates every cell and hash,
identities, all twelve clips, distinct view/clip images and species alpha
silhouettes, local nonsymlink paths, source/page-index freshness and budgets.
It cannot certify recognizability, animation appeal, IP rights or human approval.

The capture server exposes only `tools/pokemon-dungeon/`. Its 93 held-frame
captures include all 16 species at four 3D bearings, six desktop and six
390×844 compositions, eight fixed-world-arrow checks and nine action examples.
Its authoring-only lifecycle check observes 3 live/3 peak pages and 12 disposed
pages after four clip switches, then checks keyboard camera orbit. None of
these checks execute game source.

## Originality and references

Every raster pixel is generated by these new original source-native drawings.
No commercial sprites, models, screenshot pixels or downloaded images are
sampled, traced or embedded. The user-supplied EthrA frame was inspected as the
pixel-character/real-3D composition reference. No ImageGen retry or API fallback
was used. Existing v1 integer raster primitives and the tools-only cavern are
reused as utilities; the rejected rigid character meshes are not imported.

Species descriptions/identity were cross-checked against the existing canonical
catalog and official reference pages (reference only):

- <https://www.pokemon.com/us/pokedex/totodile>
- <https://www.pokemon.com/us/pokedex/chikorita>
- <https://www.pokemon.com/us/pokedex/cubone>
- <https://legends.arceus.pokemon.com/en-us/pokemon/cyndaquil/>

Original file authorship does not assert a Pokémon character-IP license.
