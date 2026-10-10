# Native Blue scenery evidence

The opening now uses published original Rescue Team image pixels for Tiny Woods
terrain, its entry, the upper location map, the title, the Post Office, stairs
and ground items. The exporter records each source URL, byte count and SHA-256
in `art/blue/native-scenery/sources.json`. This is an attribution record for
commercial game artwork, not a claim that its archive provides a publisher
reuse license. No ROM is read or downloaded by the authoring pipeline.

Run `node art/blue/native-scenery-export.mjs --check` from the authoring package
with Node 24.21.0. It checks source bytes and compares image pixels; it never
imports or executes the browser game. The main Blue art exporter invokes it.

## Evidence and transformations

| Asset | Source and exact transformation | Corroboration |
| --- | --- | --- |
| Tiny Woods entry | [432x360 published map](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Tiny_Woods_exterior.png), crop87,80,256,192 | 36,684 pixels match the complete lower display of original Blue press image `ss02`; differences are actors and UI |
| Upper location display | Lossless crop 8,8,256,192 of [Blue press image ss02](../art/blue/native-reference/manifest.json) | The underlying [world map](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_World_Map.png), crop 63,80,256,192, independently matches 38,427 pixels; final export retains the marker and restores the label rectangle so blue/pink UI can be drawn dynamically |
| Dungeon tiles | Original `b14fon`, `b14cel` and `b14cex` byte literals in [the public native archive](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/dungeon_sbin.s) | All 206 independently archived [DTEF wall/floor variants](https://github.com/PMDCollab/RawAsset/tree/03c80dad937911572f8fb19903771a47956fc696/TileDtef/TinyWoods) match the original cell lookup, plus 600 complete 24x24 tile comparisons against original Blue `ss01` |
| Caterpie rescue ending | Original `D01P02m.bma` fixed layout, tileset 14, variant 0 and original ground-scene palette | Source camera 180,168 and Blue display center 129,108 give crop 51,60,256,192; the sunken dirt rectangle, rocky rim and bottom path agree with the [original Blue video at 5:12](https://www.youtube.com/watch?v=RrglH3dOqrg&t=312s) |
| Aerial town | Complete original `S03.bpl`, `S03c.bpc` and `S03m.bma` | The full 288x312 map includes sky and native margins. [Original Blue footage](https://www.youtube.com/watch?v=4iTyZkVX9DI&t=24s) stays blue/green at 0:24, 0:25 and the white fade at 0:27, so the comparative Red sunset cycle remains unselected |
| Post Office interior | [Original384x312 image](https://github.com/PMDCollab/RawAsset/blob/03c80dad937911572f8fb19903771a47956fc696/Tile/24x24/PostOffice.png) | Crop76,78,255,192 matches47,952 pixels of the [startup screenshot](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Startup_Cutscene.png); the remaining pixels are actors |
| Post Office exterior | Lossless 256x192 crop from the [published mega_leo scene sheet](https://www.pinterest.com/pin/pokemon-mystery-dungeon-rrt-intro-scenes--480196378991037109/) | Sheet coordinates 285,114; no resizing or invented edge pixels. The unused ocean image stays in authoring evidence only |
| Title | Lower256x192 display of [JRK's original Blue title capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/) | The36x18 captured letter region is replaced only by unoccluded pixels from the [other original title frame](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Blue_Startup_NA_English_logo.png); full-display x1 equals the narrower frame's x0 |
| Press START | Original75x11 glyph image at full-display95,144 | Black outline and enclosed white foreground isolated from the original title frame; no replacement font |
| Items | Public original indexed16x16 [Item01 images](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0/graphics/ornament/Item01) | Berry and money indices equal dungeon `itempat` sprites2 and6 byte-for-byte; parameter records55/63/66/105 select palettes0/10/4/3 |
| Personality background | Original `A01P01c.bpc` and `A01P01m.bma` indexed layers; `S01.bpl`, `A01P01.bpl` and `A01P02.bpl` palettes | Two 480x384 layers, camera 244,156, opposite 0.5px/tick scroll, 8:8 integer blend, and 63 palette frames lasting eight ticks each; direct Blue timing comparison remains open |
| Company cards | Four published original Blue captures, corroborated against native `S04` data | All 48,960 pixels per card match at five-bit precision; Blue copyright sits nine pixels lower. See [boot-card evidence](blue-boot-cards.md) |

The original Blue press PNGs are retained once in `art/blue/native-reference/`.
The background, palette and crop comparison records are under
`art/blue/native-scenery/`. Runtime outputs are local files under
`assets/blue/scenery/`; no remote image is requested while playing.

`map-sources.json` pins 19 selected original asset files and byte-literal
segments, totaling 148,412 bytes. The independent `native-ground-format.mjs`
authoring decoder handles their BMA row compression, BPC tile/chunk layout,
BPL palettes and AT4PX byte compression. It accepts those bounded asset formats,
not a ROM. The complete decoded entry map matches all 155,520 pixels of the
independent published map. The decoded Post Office crop matches all 119,808 RGB
pixels of its independent image. These checks establish the decoder against
other sources before using the complete aerial map.

## Palette and coordinates

Ground-scene channel expansion is `c = channel >> 3; (c << 3) | (c >> 3)`.
The exact press-image comparisons establish this representation for these
assets. Dungeon tiles instead pass through the original brightness31 calculation
in [`SetBGPaletteBufferColorRGB`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/bg_palette_buffer.c):
`c = floor(channel * 31 / 256)`, then the same display expansion. All28 independently
matched tile colors agree with that formula. Item colors use the same sourced
dungeon rule, but have not yet been compared against an original Blue item capture.

The Blue ground display center is129,108. The Tiny Woods camera is216,188, so the
native map crop is87,80. The original hero and partner anchors become113,116 and
145,116. The Post Office image begins at world72,90. Its source screenshot is255px
wide, missing one display column; native Pelipper anchors100,92 and156,92 in that
capture become101,92 and157,92 in the full display. Each Pelipper comparison
matches all314 opaque source pixels. Portrait coordinates do not receive this
ground-camera translation.

The independent DTEF comparison uses the published
[RogueEssence importer](https://github.com/RogueCollab/RogueEssence/blob/ee6811c27720c76abe5d2d6bf42d3ce5dd463b58/RogueEssence/Dev/DtefImportHelper.cs).
Its mask uses down/left/up/right in the low four bits and matching adjacent
diagonals in the upper four. The runtime now uses the original CEX table instead:
all eight neighbor bits in south, southeast, east, northeast, north, northwest,
west, southwest order select the source cell and variant. No quarter-tile
painting, interpolation or texture stretching is used. Native variation
weighting is 2:1:1, from comparative
[`sub_80498A8`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_map_access.c).
The browser still selects those variants with an isolated coordinate hash, so
it does not reproduce the cartridge's cosmetic RNG call order. The fixed ending
uses variant 0, as the original ground-dungeon loader does, with no random choice.

The selected scenery profile is `blue-native-scenery-v2`. Its only runtime files
are `manifest.json` and the 13 PNG records it lists, totaling 312,493 bytes.
Aura palette tables are embedded in that manifest; there is no second aura JSON
or binary download. The packed aura image is decoded once and released. Its
reusable 256x192 output buffer updates only when a native pixel offset or palette
frame changes, using a precomputed 256-entry color table for each palette frame.
Reduced motion holds both layer offsets and palette at their first frame.

The upper map's native label window occupies 56,152,184,32. The original white
text pixels begin at 121,163; with the native glyph bearing, draw the text at
121,162. The field map is independent of the selected blue/pink window palette.

## Remaining visual gaps

- Aerial-map margins and the ending palette need direct Blue pixel comparisons.
  Their image data and layout now come from the original comparative source.
- The title has one observed cloud/ocean phase. Native mail and Pelipper images
  animate separately; the captured moving letter is absent from the background.
- The upper location map retains one observed marker phase.
- Aura timing and phase selection need comparison against original Blue footage;
  the implementation follows the comparative native map and scrolling source.
- Exterior camera alignment, native cut timing and item palette parity need
  direct Blue frame comparisons. Static pixel evidence does not establish
  complete cinematic or device acceptance.
