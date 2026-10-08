# Original asset production and directional pixel pipeline

Implementation is authorized. The latest 2026-10-05 direction supersedes D03 B:
faithful directional pixel characters inhabit textured, illuminated **real 3D**
environments. The full Blue main campaign, postgame and roster remain the goal.
See [FULL-GAME-GOAL.md](FULL-GAME-GOAL.md), [RENDERING.md](RENDERING.md) and the
[executable pixel contract](../../../tools/pokemon-dungeon/art/pixel/CONTRACT.md).

## Current production route

1. Preserve original Blue species proportions, silhouettes, markings and palettes
   in newly authored editable art. Do not extract commercial sprites/models.
2. Author directional integer-grid shapes, or correct original species geometry
   before rendering it to pixel frames. Do not pixelate rejected primitive models.
3. Export eight directions to deterministic local atlases with explicit frame,
   cell, foot-anchor, timing, clip, alpha and sampling metadata.
4. Independently validate JSON and binary bytes, inspect full atlases and individual
   views, then capture real billboard/depth behavior in the tools-only 3D viewer.
5. Record measured coverage and pending visual acceptance. Art captures are never
   campaign captures or evidence of gameplay. Integrate reviewed assets at P10.

The built-in ImageGen attempt returned a moderation error and no character
asset. Do not retry, disguise the request or switch to an API/CLI generator.
Original source-native pixel authoring is the selected independent route. No
uploaded/generated raster is edited by the export pipeline.

## Frozen character export

| Property | Contract v1 |
| --- | --- |
| Stable IDs | Existing `pokemon-NNN`; ordinary form key `default`; presentation asset revision independent of actor/creature IDs |
| Cell / anchor | 96×96; foot `[48,92]`; at least 2 transparent edge pixels |
| Atlas | 1152×768; 12 columns × 8 rows; top-left origin |
| Rows | front, front-right, right, back-right, back, back-left, left, front-left |
| Clips | idle 0–3/180 ms, walk study 4–7/110 ms, physical-attack study 8–11/100 ms |
| Looping | idle/walk loop; physical attack runs once and clamps |
| RGBA | PNG 8-bit, binary straight alpha, zero RGB under transparency, sRGB |
| Sampling | Nearest min/mag, no character mipmaps, depth/alpha test; no smoothing |
| Source evidence | Editable art sources, source/atlas SHA-256, encoded bytes, local relative paths |
| Coverage | Three unaccepted candidates, partial clips, no runtime integration |

The contract documents camera-relative row selection, world axes, UVs, full-cell
plane sizes and authored limitations. It is consumed only by independent tools
at this stage. Runtime save/simulation identities are unchanged. Future forms
need explicit original-edition mappings, never inferred modern variants.

## Identity, sheets and review

Keep one species/form per animation atlas. Portrait, item, status, UI decoration,
material, effect and loading-art sheets have separate profiles and coverage.
Never treat one accepted environment as approval of a character's anatomy.
Never bulk-produce hundreds of species from an unaccepted anchor. Produce small
reviewable batches with actual silhouette/marking comparisons at camera size.

For future raster sheets, preserve exact source bytes, prompt if applicable,
reference hashes, actual dimensions and crop manifests. Uniform grids must be
measured, not assumed from requested dimensions. Record every cell, including
rejected/empty cells. Store integer crop rectangles, gutters, full silhouette
bounds, alpha policy, intended use, source/provenance and acceptance status.
Do not crop away toes/tails or allow shadows and glows to bleed into neighbors.
Pixel animation exports preserve full cells and foot anchors across every frame.

UI controls remain accessible semantic DOM controls with real text/icons,
pressed/focus states and adequate touch targets; artwork never bakes controls
into inaccessible images. Dialogue/portrait artwork stays separate from text.

## Actual 3D environment work

Terrain, walls, props, obstructions and light belong to real 3D geometry.
Local textures may use filtered mipmaps for stable terrain detail; character
atlases retain nearest sampling. Match texel density at gameplay distance and
keep hero/partner faces legible. Use shadow/contact cues, coherent materials,
local atmospheric depth and authored paths; a flat generic board is not a
completed biome. Town, forest, cave, volcano, snow, sky, ocean, ruins and challenge
kits all need distinct coverage and review throughout campaign and postgame.

Geometry assets retain appropriate scale, pivots, bounds, materials and local
GLB validation. Optional geometry-rendered character sources must have corrected
species anatomy; rig/file validation cannot establish visual quality. Preserve
historical GLB evidence under `tools/pokemon-dungeon/art/manifests/` without
promoting those rejected candidates into current pixel production.

## Historical evidence

| Evidence | Current treatment |
| --- | --- |
| [A cinematic comparison](art-candidates/a-cinematic-cavern.webp) | Archived illustration, not runtime geometry or gameplay |
| [B cel-shaded illustration](art-candidates/b-cel-shaded-cavern.webp) | Formerly selected loading direction, now superseded as production style; loading use needs current review |
| [Original prompts](art-candidates/PROMPTS.md) and [provenance](art-candidates/provenance.json) | Preserve exact historical evidence; old no-pixel prompt is not current instruction |
| [P06 rigid-mesh review](../../../tools/pokemon-dungeon/art/REVIEW.md) | User rejected primitive character anatomy; prior inferred acceptance superseded |
| [Pixel manifest](../../../tools/pokemon-dungeon/art/pixel/manifest.json) | Three original candidates and measured frame/source metadata; acceptance open |

Do not rewrite previous candidates as though they passed. Historical inferred
acceptance and its subsequent rejection must both remain visible in the ledger.
Original asset authorship and character rights are distinct; do not invent a
license grant merely because source files were created for this project.

## Validation and promotion

`npm run pixel:export` rebuilds PNGs from original source. `npm run pixel:check`
validates source/PNG hashes, dimensions, CRCs, identities, timing, coverage,
alpha and cell gutters without importing any game code. `npm run check` retains
historical GLB, content, lint, strict types and vendor audits alongside pixels.
`npm run pixel:capture` produces independent art-only browser evidence with no
game import/request and no playthrough. See the tooling contract for exact usage.

Before runtime promotion, require actual species/clip review, honest complete
coverage, provenance, aggregate memory/load measurements, camera/obstruction and
mobile acceptance, then campaign integration. No placeholder/generic creature,
short art clip, green static check or successful export is full-game acceptance.
