# Native scenery evidence

`art/blue/native-scenery/sources.json` pins URLs, lengths and SHA-256 values
for published original imagery. Blue press PNGs live once in
`native-reference/`; comparison/crop records live in `native-scenery/`.
Attribution is not a publisher reuse grant. No ROM is read/downloaded.

From the authoring package, `node art/blue/native-scenery-export.mjs --check`
checks bytes/pixels with pinned Node; it never executes game modules.

| Asset | Source and exact transformation | Corroboration |
| --- | --- | --- |
| Tiny Woods entry | [432x360 published map](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Tiny_Woods_exterior.png), crop (87,80,256,192) | 36,684 pixels match the complete lower display of original Blue press image `ss02`; differences are actors and UI |
| Upper location display | Lossless crop 8,8,256,192 of [Blue press image ss02](../art/blue/native-reference/manifest.json) | The underlying [world map](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_World_Map.png), crop 63,80,256,192, independently matches 38,427 pixels; final export retains the marker and restores the label rectangle so blue/pink UI can be drawn dynamically |
| Dungeon tiles | Original `b14fon`, `b14cel` and `b14cex` byte literals in [the public native archive](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/dungeon_sbin.s) | All 206 independently archived [DTEF wall/floor variants](https://github.com/PMDCollab/RawAsset/tree/03c80dad937911572f8fb19903771a47956fc696/TileDtef/TinyWoods) match the original cell lookup, plus 600 complete 24x24 tile comparisons against original Blue `ss01` |
| Caterpie rescue ending | Original `D01P02m.bma` fixed layout, tileset 14, variant 0 and original ground-scene palette | Source camera 180,168 and Blue display center 129,108 give crop 51,60,256,192; the sunken dirt rectangle, rocky rim and bottom path agree with the [original Blue video at 5:12](https://www.youtube.com/watch?v=RrglH3dOqrg&t=312s) |
| Aerial town | Complete original `S03.bpl`, `S03c.bpc` and `S03m.bma` | The full 288x312 map includes sky and native margins. [Original Blue footage](https://www.youtube.com/watch?v=4iTyZkVX9DI&t=24s) stays blue/green at 0:24, 0:25 and the white fade at 0:27, so the comparative Red sunset cycle remains unselected |
| Post Office interior | [Original 384x312 image](https://github.com/PMDCollab/RawAsset/blob/03c80dad937911572f8fb19903771a47956fc696/Tile/24x24/PostOffice.png) | Crop (76,78,255,192) matches 47,952 pixels of the [startup screenshot](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Startup_Cutscene.png); the remaining pixels are actors |
| Post Office exterior | Lossless 256x192 crop from the [published mega_leo scene sheet](https://www.pinterest.com/pin/pokemon-mystery-dungeon-rrt-intro-scenes--480196378991037109/) | Sheet coordinates 285,114; no resizing or invented edge pixels. The unused ocean image stays in authoring evidence only |
| Title | Lower 256x192 display of [JRK's original Blue title capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/) | The 36x18 captured letter region is replaced only by unoccluded pixels from the [other original title frame](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Blue_Startup_NA_English_logo.png); full-display x1 equals the narrower frame's x0 |
| Title ocean | 312×28 strip assembled from nine original Blue PNG captures | All 8,736 pixels have four to nine agreeing observations; 64,080 comparisons have zero conflicts. The existing title phase matches all 7,140 observed pixels. See [title-background evidence](blue-title-background.md) |
| Press START | Original 75x11 glyph image at full-display (95,144) | Black outline and enclosed white foreground isolated from the original title frame; no replacement font |
| Items | Public original indexed 16x16 [Item01 images](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0/graphics/ornament/Item01) | Berry and money indices equal dungeon `itempat` sprites 2 and 6 byte-for-byte; parameter records 55/63/66/105 select palettes 0/10/4/3 |
| Personality background | Original `A01P01c.bpc` and `A01P01m.bma` indexed layers; `S01.bpl`, `A01P01.bpl` and `A01P02.bpl` palettes | Two 480x384 layers, camera 244,156, opposite 0.5px/tick scroll, 8:8 integer blend, and 63 palette frames lasting eight ticks each; direct Blue timing comparison remains open |
| Company cards | Four published original Blue captures, corroborated against native `S04` data | All 48,960 pixels per card match at five-bit precision; Blue copyright sits nine pixels lower. See [boot-card evidence](blue-boot-cards.md) |

## Decoder and coordinates

`map-sources.json` pins 19 asset files/byte-literal segments (148,412 bytes).
The bounded `native-ground-format.mjs` decodes BMA/BPC/BPL/AT4PX data.
The entry map matches 155,520 independent pixels; Post Office matches 119,808
RGB pixels, corroborating the decoder before its aerial-map use.

Ground expansion is `c=channel>>3; (c<<3)|(c>>3)`. Dungeon brightness instead
uses `c=floor(channel*31/256)`, then expansion, matching 28 tile colors
([palette source](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/bg_palette_buffer.c)).
Items use that rule without a direct Blue item-pixel comparison.

Display center (129,108), Tiny Woods camera (216,188), crop (87,80) yield actor
anchors (113,116)/(145,116). Post Office origin (72,90) and its missing display
column give full-display Pelipper anchors (101,92)/(157,92); each matches
314 opaque pixels. Portrait coordinates do not receive the camera translation.

The independent [DTEF importer](https://github.com/RogueCollab/RogueEssence/blob/ee6811c27720c76abe5d2d6bf42d3ce5dd463b58/RogueEssence/Dev/DtefImportHelper.cs)
uses four cardinal plus adjacent diagonal bits. Runtime instead uses the native
CEX S, SE, E, NE, N, NW, W, SW lookup, with comparative 2:1:1 variant weighting
([source](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_map_access.c)).
An isolated coordinate hash selects variants; cartridge cosmetic RNG order is
not reproduced. The fixed ending uses variant 0.

## Runtime and gaps

`blue-native-scenery-v2` ships `manifest.json` and its 14 PNG records.
Current bytes/hashes belong to that manifest. It embeds aura palettes; one
decoded source feeds a reusable 256x192 buffer updated only on pixel/palette
changes. Reduced motion holds initial offsets/palette. All requests are local.

The upper label window is (56,152,184,32); native white pixels start (121,163),
with text drawn at (121,162) for glyph bearing. Blue/pink UI is independent.

Direct Blue comparisons remain incomplete for aerial margins, ending palette,
item colors, exterior alignment, aura phase/timing, cut timing and title clouds.
The map marker retains one observed phase. Pixel proofs establish their sampled
regions, not full cinematic timing or device acceptance.
