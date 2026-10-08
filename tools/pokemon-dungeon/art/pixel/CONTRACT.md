# Directional pixel character contract v1

**Art foundation, not gameplay.** Three newly authored candidates implement this
contract. No character has visual acceptance or runtime integration. Historical
GLBs remain separately validated; they were rejected as character art.

## Identity and coverage

| Field | Frozen value / rule |
| --- | --- |
| `schemaVersion` / `profile` | `1` / `directional-pixel-v1` |
| Species | Existing P02 `pokemon-025`, `pokemon-004`, `pokemon-383` |
| `formId` | `default`: ordinary base appearance only, scoped to its species; no sex, shiny, Primal or modern form claim |
| `assetId` | `character.<speciesId>.default.pixel-v1`; presentation revision is independent of creature/actor identity |
| Status | `candidate-unaccepted`, `runtimeIntegrated: false` |
| Current coverage | 3 of 386 species; 8 directional rows, 3 four-frame motion studies each |
| Missing clips | turn, attack-special, cast-status, hit-light, hit-heavy, defeat, celebrate, rest-sleep, interact |
| Runtime promotion | Requires species art/clip review, full asset coverage, P10 integration and campaign evidence |

`default` is the pixel presentation key for species without a distinct original
form entry. It does not add records to the special-form inventory or change any
P07 identity/save contract. Future runtime mapping must explicitly preserve it.

## PNG and frame layout

| Property | Value |
| --- | --- |
| Atlas | 1152×768, 12 columns × 8 rows |
| Cell | 96×96, top-left origin, integer pixel coordinates |
| Foot anchor | `[48, 92]` in every cell; retain full cell, never trim/recenter per frame |
| Cell safety border | At least 2 completely transparent pixels on all edges |
| Encoding | PNG, 8-bit RGBA, non-interlaced, lossless, filter 0; CRC checked |
| Alpha | Straight alpha, binary 0/255; transparent RGB zero; no baked ground/shadow |
| Sampling | Nearest min/mag, no mipmaps, sRGB texture; alpha test 0.5, depth test/write |
| Source/export | Original integer-grid polygons, ellipses and strokes; no raster inputs, generators or game imports |
| Paths | Relative to `art/pixel/manifest.json`; local lowercase paths, no traversal/symlinks/URLs |
| Budget | Each encoded atlas ≤1,048,576 bytes; measured hashes and lengths in manifest |

Rows are `front`, `front-right`, `right`, `back-right`, `back`, `back-left`,
`left`, `front-left`. A camera at positive Z looking toward an actor whose
heading is zero sees the front. Camera bearing is `atan2(dx, dz)`. Row is the
nearest 45-degree sector of **actor heading minus camera bearing**, wrapped to
0–7. World +Y is up, +Z is the art actor's forward direction. This presentation
convention does not modify domain cardinal directions; a future adapter owns
that conversion. Left/right views intentionally mirror bilateral features.
The row names describe the sprite's screen-facing orientation, not the camera's
world position: row 2 points screen-right and row 6 points screen-left. Positive
actor heading rotates +Z toward +X around +Y. Therefore heading 0 viewed from
camera +X selects row 6 (nose screen-left); heading +90° viewed from camera +Z
selects row 2 (nose screen-right). Camera-bearing controls/capture filenames
identify camera positions, not the selected sprite row.

| Camera bearing, fixed actor heading 0 | Selected row | Visible facing |
| --- | ---: | --- |
| 0° / +Z | 0 | Front |
| +45° / +X,+Z | 7 | Front-left |
| +90° / +X | 6 | Screen-left profile |
| +135° / +X,-Z | 5 | Back-left |
| 180° / -Z | 4 | Back |
| +225° / -X,-Z | 3 | Back-right |
| +270° / -X | 2 | Screen-right profile |
| +315° / -X,+Z | 1 | Front-right |

Side silhouettes are independently drawn; diagonal views include compressed
silhouettes and face/marking changes. Future refinement should improve diagonal
volume and turning transitions; eight rows alone do not prove art quality.

| Clip | Columns | Frame duration | Playback | Coverage limitation |
| --- | --- | --- | --- | --- |
| `idle` | 0–3 | 180 ms | Loop | Subtle one-pixel breathing/flame study; repeated holds intentional |
| `walk` | 4–7 | 110 ms | Loop | Foot/limb displacement study, in place; no approved full gait |
| `attack-physical` | 8–11 | 100 ms | Once, clamp final | Anticipation/extension/recovery study, no simulation damage or effects |

Only the caller starts/restarts a nonlooping clip. Animation must never cause
turns or damage. Reduced-motion holds a frame; hidden tabs freeze the authoring
clock. Sprite geometry is a vertical yaw billboard, so real 3D geometry occludes
it correctly. UV repeat is `[1/12,1/8]`; offset is `[column/12,1-(row+1)/8]`.
The plane translates vertically by `worldHeight*(92/96-0.5)` to ground its foot
anchor. `worldHeight` is the full-cell plane height in authoring world units,
not a sourced biological height; values are Pikachu 1.65, Charmander 1.75,
Groudon 4.8. These maintain one 96-pixel cell, with deliberate larger boss texels;
final campaign camera/texel-density tuning is still open.

## Decoded memory and roster scaling

Each 1152×768 RGBA atlas occupies **3,538,944 bytes (3.375 MiB)** before browser
CPU copies, materials or framebuffer overhead. The three-character proof uses
**10.125 MiB of character texels**; small PNG transfer size does not reduce that
allocation. Terrain textures, shadow maps, buffers and browser/UI residency are
additional. No mobile device memory/performance acceptance is claimed.

Proposed future character-cache ceiling: 24 MiB, at most six full v1 atlases
(20.25 MiB), reserving 3.75 MiB inside that character allowance. This is separate
from the existing 24 MiB **encoded-transfer** scene budget; it is not a claim
that the entire renderer fits 24 MiB. Loading 386 full atlases would consume
1,302.75 MiB of character texels and is prohibited. The runtime must load only
party/visible encounter species with a bounded reference-counted cache, stream
clip pages or export smaller reviewed hero/enemy cells where needed. Scenes
with more distinct simultaneous species need that redesign before promotion.
No streaming/cache implementation is claimed by this three-actor art viewer.

## Reproduction and source provenance

From `tools/pokemon-dungeon/`:

```sh
npm run pixel:export
npm run pixel:check
npm run check
PIXEL_CAPTURE_BROWSER=/path/to/chromium npm run pixel:capture
```

Export needs only Node built-ins. The viewer uses the pinned Three.js dependency
from this tools package; it never imports `games/`. Capture uses root Playwright,
serves only `tools/pokemon-dungeon/` at an ephemeral local port, and records any
page/console/non-tool request as an error. No game routes or mechanics execute.
The saved `captures/capture-record.json` records viewport, query and browser.
`?subject=pikachu&angle=2&clip=walk&still=1&frame=2` reproduces a held art frame. Add `&direction-proof=1` for a cyan **world-space
+Z arrow**, independent of the sprite row selection. The eight
`facing-pikachu-camera-*.jpg` captures compare that fixed vector to the projected
nose at orthogonal/diagonal camera positions. The capture record includes the
observed selected row; all eight are checked against the table above.

`characters.mjs`, `raster.mjs` and `export.mjs` are editable production sources.
Their SHA-256 hashes are in the manifest. Source changes require re-export;
`pixel:check` detects stale bytes without executing authoring or game modules.
The checker independently decodes PNGs, checks CRC/dimensions, every cell's
opacity/gutters, eight distinct neutral views, identities, clips, sizes and
local paths. It cannot judge anatomy, rights, gameplay or artistic acceptance.

The user supplied an EthrA frame as stylistic direction. It was inspected, not
sampled/copied. The built-in ImageGen attempt returned a moderation error and no
asset; no retry/API fallback was used. All current raster pixels are produced by
original source-native shapes. Pokémon character IP remains with its respective
rights holders; original file authorship does not assert rights-holder licensing.

## Required next work

- Improve diagonal volumes, crouch/weight, expressions and complete motion clips.
- Review neutral front/side/back/diagonal species anatomy, especially Groudon's
  armor, snout and posture; recognition is not final visual acceptance.
- Produce 383 remaining species and all applicable original visual forms,
  distinct portraits, effects, UI and original audio with accepted coverage.
- Build all campaign/postgame environment kits; this cavern is one geometry,
  texture, light and depth proof, not a finished environment or encounter.
- Integrate only accepted assets into the campaign renderer and capture actual
  gameplay for the arcade picture. These art captures cannot replace it.
