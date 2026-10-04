# Raster asset production and atlas pipeline

**Status: planning handoff only.** No images, crops, tools or runtime assets are created by this document. The fixed game baseline is original Nintendo DS **Blue Rescue Team**. The user requested consistent prompts, bulk image generation, and sheets that can later be chopped into reusable assets. The user selected **B: bold cel-shaded 3D** for D03 and accepted the recommendations, including D05 manual review and omission of D06 practice. This specifies the accepted strategy without lifting the separate implementation-start hold.

Read [PLAN.md](PLAN.md) for authority, P03/P06/P32 dependencies and budgets; [RENDERING.md](RENDERING.md) for visual/character requirements; [DATA.md](DATA.md) for provenance and stable identities. Raster assets complement the 3D game. A sheet of pictures is not a mesh, skeleton, animated character, material package, or gameplay screenshot.

## 1. Fixed strategy and selected B style

Use the **built-in image-generation tool**, one generation call per small atlas. Lock the master prompt and class profile, change only the explicit cell inventory/batch ID, review the whole image, then crop accepted cells through a reproducible authoring tool. Do not use a paid API, guessed API endpoint, third-party generator, or alternate service as an unasked fallback. If a generation request is rejected or fails, report the specific blocked batch, retain its pending status and continue independent planning; do not disguise the same request to evade a service restriction.

Generation is stochastic: identical prompts do not guarantee identical pixels, cell alignment or species identity. Reproducibility means preserving the accepted source image, complete request, referenced anchors, hashes, measured crop manifest and export settings. Do not invent a seed/control parameter the available tool does not support.

D03 is resolved to **B bold cel-shaded 3D**. The current concrete reference files are:

| Candidate | Actual file | Use as example | Limit |
| --- | --- | --- | --- |
| A: archived cinematic comparison | [a-cinematic-cavern.webp](art-candidates/a-cinematic-cavern.webp) | Sculpted depth, restrained PBR-like geological detail, warm lava/cool haze and filmic exposure | Raster environment/loading illustration only; not rendered browser output or a character reference |
| B: selected bold cel-shaded 3D | [b-cel-shaded-cavern.webp](art-candidates/b-cel-shaded-cavern.webp) | Broad graphic forms, two-to-three-band shading, selective contours and vivid palette | Raster environment/loading illustration only; not proof of a cel-shaded renderer or animation |

Their exact source prompts and hashes are recorded in [PROMPTS.md](art-candidates/PROMPTS.md) and [provenance.json](art-candidates/provenance.json). The B cavern background is selected as future loading artwork and the environment-style reference. A remains archived comparison and must not enter production prompts. Do not mix A lighting/material response with B contours across batches. Selecting B does not approve uncreated character models, portraits, items, rigs or shaders. Earlier character image requests did not produce character assets, so no accepted Pokémon portrait anchor exists yet.

At P06, after a separate implementation-start instruction, establish reviewed B class anchors: a portrait, an item/icon set, a UI-material tile set and a texture sample, using the selected B environment reference. D05 manual acceptance is already approved; actual anchor outputs still need the normal P06 quality review. Store approval ID/date and file hash. An approved environment anchor cannot establish correct Pokémon anatomy; character anchors need their own species-specific review. Do not bulk-generate 386 portraits before representative anchors pass.

## 2. Asset classes and batch sizes

| Class / ID convention | Output purpose | Default atlas | View/profile constants | Transparency |
| --- | --- | --- | --- | --- |
| `portrait.pokemon-025.default.neutral.v001` | Party, dialogue, selection portraits | 2×2 for four detailed portraits; 4×4 only for approved simple small heads | Same three-quarter head angle, eye line, crop, expression family and key/fill lighting | Transparent background; silhouette fully inside cell |
| `icon.item.apple.v001` | Inventory/service item icons | 4×4 for 16 simple isolated subjects; 2×2 for ornate items | Same object view, scale envelope, soft key/fill, consistent shadow policy | Transparent; no shared ground/shadow across cells |
| `icon.status.sleep.v001` | Status/action pictograms | 4×4 | Same stroke weight, contrast, semantic silhouette; distinct shapes, not color alone | Transparent |
| `ui.tile.panel-stone.v001` | Decorative panel/button material tiles | 2×2 or 4×4 only if broad simple fills | Front-on orthographic flat tiles; no baked control lettering, state or fake bevel geometry | Usually opaque; frame/corner variants may be transparent |
| `illustration.biome.volcano.loading.v001` | Loading/chapter background | Usually one full image; 2×2 for four small illustration thumbnails only | Locked composition/camera/lighting family, caption-safe region | Opaque |
| `texture.basalt.albedo.v001` | Repeating material color input | 2×2 small material variants; single-image tile preferred for seamless quality | Orthographic surface, even illumination, no perspective or baked cast shadow | Opaque |
| `effect.sprite.ember.v001` | Original effect sprite/mask | 4×4 simple motifs, 2×2 high detail | Consistent scale/falloff; no labels or decorative frame | Transparent |

These IDs are illustrative, not assertions that assets exist. Stable `SpeciesId` is `pokemon-025`, separate from numeric dex number 25 and `FormId`. Exact default form key and registry syntax must match frozen SYSTEMS/DATA contracts. Each requested form/expression is explicit; never infer modern shiny/sex variants. Portrait coverage and final rigged-model coverage are separate ledger columns.

Do not batch unlike classes, styles, views, lighting profiles or alpha policies in one sheet. A loading painting, a portrait and an inventory icon do not belong in the same atlas. Use 2×2 when a subject needs anatomy/face detail; use 4×4 for small simple objects/pictograms. Large boss illustrations and fine seamless textures may warrant one asset per call. The strategy is consistent small-batch production, not the largest possible sheet.

UI artwork is decoration. The emulator-style controls in RENDERING remain semantic DOM buttons with real text/icons and pressed/focus states; imagegen does not bake entire control panels or keyboard labels into one inaccessible image.

## 3. Locked master prompt and class profiles

Maintain `prompt-template-version`, fixed `style-profile-version = style-b-v1` and one `class-profile-version` per asset class. Record exact expanded prompt bytes and referenced image hashes for every call. Once anchors are approved, keep style, palette, contour/material response, lighting, camera, subject scale, margin and alpha policy identical within a class. Change a constant only through a new profile version and explicit visual review; do not silently repair every batch with a different ad hoc prompt.

Copyable master template for later approved production:

```text
Create one original production raster atlas for the approved Blue Rescue Team
reimagining. This is [ASSET_CLASS] artwork, not gameplay, not 3D mesh data.

STYLE LOCK style-b-v1 (user-selected B)
[INSERT THE FIXED STYLE B BLOCK BELOW]
Environment reference: supplied b-cel-shaded-cavern.webp; it establishes style
only and does not establish correct character/item anatomy.
Match the supplied approved [CLASS] anchor image(s), especially shape language,
material/contour response, palette, lighting and edge quality. Preserve each
listed subject's defining anatomy or object identity; do not copy commercial
artwork or add unrequested modern variants.

CLASS LOCK [CLASS_PROFILE_ID / VERSION]
View: [FIXED VIEW]. Lighting: [FIXED LIGHTING]. Subject scale: [FIXED ENVELOPE].
Expression/pose: [FIXED CLASS POSE]. Background: [TRANSPARENT OR OPAQUE POLICY].
Output request: [WIDTH] by [HEIGHT] pixels, exactly [ROWS] rows and [COLS] columns.
Equal rectangular cells in row-major order. Outer margin [M] px, separation
[gutter] px, safety clearance [SAFE] px inside every cell. All subjects centered
and completely contained; no part, shadow, glow or outline enters another cell.
No decorative grid lines, frames, labels, lettering, numbers, logos or watermark.
Empty unused cells remain [TRANSPARENT / CLASS BACKGROUND].

CELL INVENTORY (row 1 at top, column 1 at left):
R1C1: [STABLE ASSET ID] — [PRECISE SUBJECT / DISTINCTIVE FEATURES]
R1C2: ...
[EVERY CELL EXPLICITLY LISTED; DO NOT WRITE LABELS IN THE IMAGE]

Do not combine subjects, omit a cell, reorder them, crop a subject, invent a
background scene, or let lighting/shadows span cells. Aim for exact alignment;
production will independently inspect the actual output and reject misalignment.
```

Fixed style block; class-specific anchors remain subject to P06 output review:

```text
STYLE B / style-b-v1:
Bold cel-shaded 3D illustration with expressive sculpted forms, two-to-three-band
shading, selective crisp dark contours, broad material shapes, coherent saturated
palette, rich cool shadows and extremely readable silhouettes. No pixel art,
flat low-detail blobs, scratchy outlines or uncontrolled gradients. Match the
selected B cavern reference's graphic shape/light language; class anchors govern
subject anatomy, view, expression and usable crop.
```

For texture albedo, replace directional lighting with the class's even surface-lighting rule; never bake the portrait's key light into a surface texture. These blocks are prompt examples, not proof that a generated raster shader/material will match the future WebGL renderer.

### Worked 4×4 simple-icon request

Use the master template with `ASSET_CLASS = isolated item icons`, requested canvas 2048×2048, four rows/columns, outer margin 16 px, gutters 32 px, and safety clearance 24 px. Planned cell area is 480×480 px. Lock a centered three-quarter object view and approximately 65–75% subject occupancy. Transparent background, no cast shadow extending beyond the safety envelope. Inventory order may be apple, berry, food bag, seed, elixir bottle, orb, scroll, coin pile, chest, key, scarf, ribbon, stone, toolbox, mailbox and rescue badge, with an explicit approved visual brief/ID for every cell. Names here describe original icon subjects; exact gameplay item identity comes from DATA. Do not invent unavailable items based on the image inventory.

### Worked 2×2 detailed-portrait request

Use requested canvas 2048×2048, two rows/columns, outer margin 16 px, 32 px gutters and 48 px safety clearance; planned cell area is 992×992 px. Choose four approved species/form/expression briefs. Lock head/upper-body three-quarter angle, eye line and silhouette occupancy near 70%. Each cell contains one isolated subject with the approved neutral expression and lighting. Transparent background; no text or frame. A humanoid portrait and a long serpent require reviewed crop-envelope accommodations before batching; they cannot be made consistent by clipping anatomy.

Output dimensions are requests, not guarantees. If the tool returns another size, record the actual image and inspect it before any grid math or crop.

## 4. Grid, gutters, bleed, and rejection policy

A source atlas uses **separation gutters** to keep neighboring subjects independent. Runtime edge bleed is a separate export operation. Never ask the generator to make subjects overlap gutters to provide bleed.

For a planned grid, cell width = `(actual width − 2×outer margin − (columns−1)×gutter) / columns`; height uses rows equivalently. Only adopt these rectangles if the actual image has the expected measured alignment. Fractional divisions need an explicitly recorded integer edge policy, not rounding drift that chops final cells. Inspect every row/column, subject silhouette and alpha edge visually, including bottom/right cells.

Reject or regenerate a batch before cropping when it has wrong subject count/order, merged subjects, off-model anatomy, inconsistent lighting/style, labels, cell-crossing shadows/glows, clipped ears/tails, or irregular spacing that cannot be represented by a clean reviewed crop manifest. Request a smaller batch for recurring failures. Do not crop incorrectly aligned cells and pretend the generator obeyed the grid. If equal-grid placement is imperfect but independent complete subjects can be isolated, a reviewer may approve measured per-cell rectangles; record that exception and its exact rectangles rather than calling them the original regular grid.

For accepted transparent assets, crop the measured source rectangle, preserve alpha, and retain deliberate transparent padding. Add a small **exported edge-bleed/padding region** if the runtime atlas/filtering needs it: extend edge RGB under transparency and record 2–4 px as the candidate bleed, not opaque duplicate silhouettes. For opaque tiles, edge extrusion may be suitable; seamless textures need their own repeated-edge validation. Cropping does not create missing transparency or valid seamlessness. Reject/repair the source through an explicitly authorized editing request if those are missing; do not silently remove backgrounds from complex art.

An atlas can be discarded as a batch even if one cell is attractive. Subject correctness, consistent class style and clean export geometry determine acceptance. Rejected source images remain authoring records, never runtime manifest entries.

## 5. Crop manifest and provenance example

The future cropper is a deterministic **offline authoring tool**, not game runtime. The user has explicitly requested chopping sheets, so approved later production can crop accepted source atlases without asking again for each crop. That instruction does not authorize new generation while the current plan is paused.

Illustrative JSON record (values are an example, not actual files or measured acceptance):

```json
{
  "batchId": "icon-items-b-v001-b0001",
  "assetClass": "item-icon",
  "status": "proposed-example",
  "generation": {
    "tool": "built-in-imagegen",
    "requestedSize": [2048, 2048],
    "actualSize": [2048, 2048],
    "promptTemplateVersion": "atlas-v001",
    "styleProfile": "style-b-v1",
    "classProfile": "item-icon-v001",
    "expandedPromptFile": "prompts/icon-items-b-v001-b0001.txt",
    "anchorIds": [],
    "environmentReference": "plan/art-candidates/b-cel-shaded-cavern.webp",
    "requestTimestamp": "record-actual-time",
    "sourceSha256": "record-actual-sha256"
  },
  "grid": {"rows": 4, "columns": 4, "outerMargin": 16, "gutter": 32},
  "alignment": {"reviewStatus": "not-reviewed", "reviewId": null},
  "cells": [
    {
      "assetId": "icon.item.apple.v001",
      "row": 1,
      "column": 1,
      "sourceRect": [16, 16, 480, 480],
      "alphaRequired": true,
      "safetyPadding": 24,
      "runtimeBleed": 2,
      "runtimePath": "assets/icons/items/apple-v001.webp",
      "runtimeSha256": "record-after-export",
      "encodedBytes": null,
      "reviewStatus": "not-reviewed"
    }
  ]
}
```

Enumerate all 16 or four cells in a real batch; the example shows one for readability. `sourceRect` is `[x, y, width, height]`, origin top-left in actual source pixels. Include each rejected/empty cell explicitly. Per-cell records additionally need author/generation provenance, intended game use, source/licensing/rights notes, exact export tool version/settings, output dimensions, alpha policy, prompt/anchor hashes, approval and superseded-version links. Asset IDs remain stable across exports; a revision suffix distinguishes intentional visual changes rather than duplicate gameplay identities.

Do not fabricate SHA-256, approval IDs or timestamps. Obtain hashes from preserved actual files. Prompt hashes and source hashes make crop/export regeneration auditable; they do not prove legal clearance or generator determinism.

## 6. Storage, conversion, and runtime packing

| Location, proposed | Contents | Export boundary |
| --- | --- | --- |
| `tools/pokemon-dungeon/art/sources/` | Original accepted/rejected PNG atlases and source images | Outside copied game tree; large files/cache excluded as appropriate and preserved through approved durable artifact storage |
| `tools/pokemon-dungeon/art/prompts/` | Exact expanded prompts, profile versions and request records | Authoring only; meaningful small records can be checked in with provenance |
| `tools/pokemon-dungeon/art/manifests/` | Measured crop manifests and export records | Authoring authority; runtime manifest gets required subset |
| `tools/pokemon-dungeon/art/exports/` | Reproducible intermediate crops/encodings/contact sheets | Outside copied game tree; no accidental raw PNG export |
| `games/pokemon-dungeon-reimagined/assets/` | Approved runtime WebP/PNG and compact asset manifest entries | Only accepted needed runtime assets; all relative URLs |
| `games/pokemon-dungeon-reimagined/plan/` | Documentation, review/provenance register and existing A/B planning candidates | Existing project-planning location; not an authoring cache |

Preserve raw PNG sources outside the game export tree. A Git ignore rule inside `games/` does not prevent the existing exporter from copying a file. Respect the repository's **1,024 KiB per added file** limit for source/record/runtime files that enter git; do not add giant source atlases to git or weaken hooks. When raw sources exceed it, preserve them through the approved durable artifact workflow with recorded hashes and retrieval references. Do not create an external runtime dependency on that storage.

Prefer runtime WebP for suitable portraits/icons/illustrations; use PNG where lossless alpha/edge quality or supported rendering requirements justify it. Review alpha fringes, small-icon legibility and color-space consistency after encoding. Resize/quantize/compress or split atlases until each runtime file is **below 1,024 KiB**, with headroom; do not keep reducing quality until anatomy becomes unreadable. The first interactive scene stays ≤8 MiB encoded, active scene assets ≤24 MiB, total published game ≤300 MiB as PLAN proposes. Count shared assets once and include actual encoded byte sizes; decoded GPU memory is a different budget.

Keep generated source sheets separate from a future packed runtime atlas. Deterministic cropping produces individually reviewed assets first; optional runtime repacking uses known rectangles/bleed and deterministic tools. Do not ship a giant sheet containing all 386 portraits when a menu shows only a few. Lazy-load by party/visible menu page/dungeon relevance; batch packing must not inflate initial transfer or make one failed sheet hide every portrait.

For surface materials, imagegen may supply an original albedo/source illustration. Normal, roughness, metalness, occlusion and emissive inputs require separate material-authoring work and consistency checks; naming a painted tile "PBR" does not create physically correct maps. Inspect texture repetition in the approved art harness later. Never infer a mesh/rig/animation from a portrait atlas.

## 7. Separate rigged 3D production

The main game remains full third-person 3D. Use RENDERING section 4's original modeling, topology, UV/material, skeleton, animation, LOD and GLB pipeline for all accepted species/forms. A generated portrait can inform a **reviewed** visual brief or serve as 2D UI art; it cannot prove back/side anatomy, deformable joints, correct scale, movable tail/ears, or animation coverage. If any image-to-3D tool is later proposed, it requires an explicit reviewed pipeline decision, local runtime compatibility and topology/rig/material work. This document authorizes no such service.

Keep separate coverage columns for raster portrait/icon approval and 3D model/rig/clip approval. No completion milestone can substitute one for the other. The arcade preview must remain an actual captured gameplay frame; generated loading artwork and character sheets never replace it.

## 8. Work packages and permitted validation

| Package | Bounded future work | Exit evidence |
| --- | --- | --- |
| P03 / raster specification | Freeze ID schema, prompt/class profile files, crop record shape, authoring storage and provenance/export rules | Approved specification and a traceable existing sample record; no mass generation or runtime implementation |
| P06 / visual anchors | After separate implementation-start authorization, create small B class anchor candidates and one 2×2 or 4×4 trial atlas with built-in imagegen; inspect/crop only accepted output | B already selected; actual class-anchor output review; actual measured alignment; provenance/hash/size records and static contact sheet |
| P32 / bounded production batches | Produce one homogeneous atlas per call from locked anchors/prompts; review, crop and encode accepted cells; register coverage | Every exported asset has exact prompt/source/crop/output records; consistent approved style and no off-model cells |
| P34 / resource polish | Optimize reviewed runtime files/packing without losing alpha/silhouette/readability | Actual static byte/dimension/alpha/manifest records within PLAN budgets |
| P35–P36 / final preview | Use actual game rendering for capture after full acceptance, unrelated to generated atlas art | Genuine gameplay screenshot with unchanged content, correct website integration |

Static image/manifest validation is permitted: file decode/dimensions, SHA-256, alpha presence, crop bounds, cell count/unique IDs, relative path existence, encoded bytes, profile/anchor/approval references, and deterministic export records. These checks do not execute or import game source. Visual review must verify actual subject identity, anatomy, style, grid separation and icon usability; numeric crop bounds cannot prove those qualities. A transparent channel can exist while an unwanted painted background remains, so alpha presence alone is insufficient.

No unit/game/snapshot/playthrough tests, automatic runtime launch or hidden game-test hooks are added. The planning update contains exactly two explicitly authorized environment loading-art candidates with prompts/provenance. This pipeline document adds no additional production images, atlas batches or crops. D03 is resolved to B; production stops for missing implementation-start authorization, unaccepted class-anchor outputs, rejected generation, off-model or misaligned cells, unclear provenance/rights, or file/scene budget violations. The fixed translucent touch-control design is already specified by the user and is not another visual approval choice.
