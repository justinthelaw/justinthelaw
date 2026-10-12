# Original Blue title ocean

The title now scrolls an original Blue ocean strip across its bottom 28 rows.
Every texture pixel is observed in published Blue captures. The logo and clouds
above y164 retain the existing captured phase; their full moving field has not
been reconstructed.

Original PNG bytes, URLs, hashes, crops and phase offsets are pinned in
`art/blue/native-scenery/title-sources.json`. Eight regional captures come from
the Mystery Dungeon Wiki's original image archive. The ninth is
[JRK's original Blue capture on MobyGames](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/).
Seven additional source PNGs live under `native-scenery/title/`; the existing
North American and Moby captures are reused. These are commercial game images.
Attribution does not claim a publisher reuse license. No ROM is used.

## Direct Blue pixel evidence

Exact cloud and ocean patch translations establish a 312-pixel horizontal
repeat. Offsets are measured relative to the North American wiki capture:

| Capture | Relative horizontal phase |
| --- | ---: |
| North American English | 0 |
| European English | -78 |
| European French, German and Italian | -120 |
| European Spanish | -117 |
| Japanese | -62 |
| Korean | -181 |
| Moby lower screen, crop x1 | -185, equivalent to 127 |

The exporter aligns these crops at original five-bit color precision. The only
excluded rectangle is `(87,164,90,2)` in the German capture: its localized start
prompt overlaps the first two ocean rows. Without this mask, 146 pixels disagree;
the other original captures expose the underlying water. With the mask, all
8,736 pixels in the 312×28 strip have four to nine agreeing observations each:
64,080 comparisons, zero conflicts and zero unobserved pixels.

The resulting colors use the existing DS ground-image expansion
`(channel5 << 3) | (channel5 >> 3)`. At texture phase 127, all 7,140 pixels in
display rectangle `(1,164,255,28)` exactly match the current Moby-derived title
asset after that expansion. This comparison is repeated by the offline exporter.

The complete runtime band starts at display x0 and texture phase 126. Its x0
placement is a coordinate inference: x1 maps to texture127, x2 to texture128,
and continuing the same wrapped mapping maps x0 to texture126. All 28 colors in
that texture column are directly observed elsewhere in the Blue captures. The
Moby image's first column is black, so it does not independently verify this
placement. No new colors or painted edge pixels are introduced.

## Comparative source and timing limits

The public Red source is pinned at commit
`013475aa04f5be3191e5527c186d9bfceae7cae0`. Its title data establishes the
scrolling mechanism, but is not substituted for Blue imagery:

| Source | Relevant data |
| --- | --- |
| [S02.bpl](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/map_bg/S02.bpl) | 544 bytes, nine palettes, no palette animation |
| [S02c.bpc](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/map_bg/S02c.bpc) | 20,388 bytes, 3×3 tile chunks, 568 stored tiles plus zero tile, 122 stored chunks plus zero chunk |
| [S02m.bma](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/map_bg/S02m.bma) | 560 bytes, two layers, 12×18 chunks, 288×432 extent |
| [MAP_TITLE_SCREEN](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_map.c#L1500) | Layer 0 follows the camera; layer 1 advances its wrapped horizontal camera one pixel every eight ticks |
| [Ground background mode 3](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_bg.c#L693) | Splits the fixed and wrapped layers |
| [Titlebg1 composition](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ornament/titlebg.h) | Separate Red sunset sun/reflection ornament: twelve poses, six ticks each, 72-tick loop; excluded from Blue |

Blue's observed 312-pixel repeat differs from the Red background's 288-pixel
width. Red tile/palette transfers have disagreements, and the Red sun is absent
from the Blue captures. Neither is used to complete missing Blue cloud pixels.

The browser uses the comparative rate of one pixel every eight nominal 60 Hz
ticks, moving the visible texture left. Its initial phase reproduces the chosen
Moby capture. Exact Blue speed, direction, title-entry phase and frame boundaries
have not been established by frame-counted footage. Reduced motion holds this
phase fixed. The remaining upper-cloud animation must be sourced separately.

## Upper field and foreground separation

The same nine inputs do not yet establish the complete upper texture or a logo
alpha mask. An image-only analysis covers all 51,168 coordinates in the
312×164 field above the selected ocean band:

| Comparison | Agreeing coordinates | Conflicting coordinates | Unobserved coordinates |
| --- | ---: | ---: | ---: |
| All flattened capture pixels | 8,019 | 43,149 | 0 |
| Outside conservative foreground rectangles | 16,384 | 0 | 34,784 |

The second row uses deliberately broad, visually inspected rectangles around
each regional logo, prompt and captured letter. Of its visible coordinates,
11,154 have multiple agreeing observations and 5,230 have only one observation.
These counts are conservative coverage bounds. They are not an exact alpha
matte, nor a claim that every masked coordinate is irrecoverable. The raw
conflicts reflect foreground pixels sampled at different screen positions;
they do not demonstrate conflicting Blue cloud artwork.

A concrete unresolved coordinate is texture `(74,40)`. Its seven available
samples fall on logo artwork at EU English `(152,40)`, French/German/Italian
`(194,40)`, Spanish `(191,40)`, Japanese `(136,40)` and North American `(74,40)`.
The Korean and Moby crops do not expose that coordinate. None supplies its
underlying cloud/sky pixel. Assigning the surrounding sky color would be a fill
inference, not an observed value.

The two North American captures establish 33,362 identical screen-space pixels
out of 41,820, but equality alone cannot recover logo alpha. That set includes
9,492 unchanged sky-blue pixels and 3,923 white pixels; white occurs in both
clouds and the logo outline. All inputs are opaque, flattened displays, without
layer masks. The same-phase French/German/Italian captures expose some localized
lettering differences but retain the shared Pokémon logo over the background.

`art/blue/native-scenery/title-background-analysis.json` preserves the masks,
coverage histograms, exact witness colors and source-manifest hash. Run
`node art/blue/analyze-title-background.mjs --check` to reproduce it offline.
No partial cloud image is emitted or selected at runtime. A complete published
Blue background and foreground mask, or enough additional unobscured phases to
prove both, are needed before upper-cloud animation can be implemented.

## Runtime and offline validation

`IntroArtwork.titleBackdrop(context, elapsed, reducedMotion)` draws the existing
title, then the bounded ocean strip. Callers supply the pause-aware title clock.
One or two native-size `drawImage` calls handle wraparound; no canvas or image is
allocated per frame. Existing loading, abort and bitmap-disposal ownership apply.

`assets/blue/scenery/title-water.png` is 312×28 and 413 bytes, with SHA-256
`c8b5f405ebf539642b8c81ab79857bcf5087c53b3c3065c522bc918e0eac5620`.
The decoded bitmap occupies 34,944 RGBA bytes. Scenery profile/schema v2 remain
unchanged; the manifest adds one PNG record and embedded `titleWater` evidence.
There is no new runtime JSON request or remote asset load.

From `tools/pokemon-dungeon`, run
`node art/blue/native-scenery-export.mjs --check` with Node 24.21.0.
`native-title-format.mjs` rechecks every original byte/hash, alignment, coverage,
conflict and existing-title comparison before comparing the generated PNG and
manifest. It imports only authoring image utilities and never executes game or
native source. Static lint/types and manual browser review remain separate.

The native scenery and title-background analysis checks passed. Static lint
passed after the analysis script was added; strict types passed for the runtime
change. These checks do not establish manual browser acceptance.
