# Original Blue title ocean

The lower 28 title rows scroll a 312x28 texture observed in published Blue
captures. Logo/clouds above y164 retain one captured phase; their full moving
field and alpha mask are unresolved. `native-scenery/title-sources.json` pins
nine PNGs, URLs/hashes/crops/offsets. Seven extra PNGs are under `title/`;
existing North American and [JRK/Moby](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/)
captures are reused. Commercial-image attribution is not a reuse license; no ROM is used.

## Direct pixel proof

| Capture | Phase relative to North American English |
| --- | ---: |
| North American English | 0 |
| European English | -78 |
| French / German / Italian | -120 |
| Spanish | -117 |
| Japanese | -62 |
| Korean | -181 |
| Moby lower display, crop x1 | -185 (127 modulo 312) |

Align at five-bit color precision and exclude German prompt rectangle
`(87,164,90,2)`: without it, 146 pixels conflict. With it, all 8,736 texture
pixels have four–nine observations: 64,080 comparisons, zero conflicts/gaps.
After `(channel5<<3)|(channel5>>3)`, phase 127 matches every one of the
7,140 Moby-derived pixels at `(1,164,255,28)`.

Runtime x0 uses phase 126 by extending the verified mapping. That column's
colors are observed elsewhere, but Moby's black first column does not directly
prove its placement. No new colors or painted edges are introduced.

## Comparative timing

Pinned Red revision `013475aa04f5be3191e5527c186d9bfceae7cae0` supplies the
mechanism, not replacement Blue imagery:

| Source | Relevant boundary |
| --- | --- |
| [S02.bpl](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/map_bg/S02.bpl) | 544 bytes, nine palettes, no palette animation |
| [S02c.bpc](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/map_bg/S02c.bpc) | 20,388 bytes; 3x3 chunks; 568 stored tiles and 122 chunks, each plus zero |
| [S02m.bma](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/map_bg/S02m.bma) | 560 bytes, two layers, 12x18 chunks, 288x432 |
| [MAP_TITLE_SCREEN](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_map.c#L1500) | Layer 0 follows camera; layer 1 advances one wrapped pixel per eight ticks |
| [Background mode 3](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/ground_bg.c#L693) | Splits fixed/wrapped layers |
| [Titlebg1](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ornament/titlebg.h) | Red-only sunset ornament: 12 poses, six ticks each; excluded |

Blue's observed repeat is 312, unlike Red's 288. Runtime moves the texture left
at the comparative eight-tick rate, initially matching Moby; reduced motion
holds it. Exact Blue speed/direction/entry phase/frame boundaries remain unverified.

## Upper-field gap

Analysis covers 51,168 coordinates (312x164). Flattened captures agree at 8,019
and conflict at 43,149. Outside conservative foreground rectangles, 16,384 agree
and 34,784 remain unseen; 11,154 visible coordinates have multiple observations.
Those masks are coverage bounds, not a recovered logo alpha matte.

Texture `(74,40)` is a concrete unresolved witness: seven available samples
land under logos and Korean/Moby do not expose it. Equal screen pixels also
cannot distinguish white cloud from white logo. Filling nearby sky would be inference.

`native-scenery/title-background-analysis.json` retains masks, histograms,
witness colors and manifest hash; reproduce with
`node art/blue/analyze-title-background.mjs --check`.
No partial cloud image ships. Further animation needs a complete sourced
background/mask or enough unobscured phases to prove both.

## Runtime and verification

`IntroArtwork.titleBackdrop()` uses the pause-aware clock and one/two
native-size draws for wraparound; no per-frame canvas/image allocation.
Existing load/abort/disposal ownership applies. `title-water.png` decodes to
34,944 RGBA bytes; current encoded bytes/hash are in the scenery manifest.
The original 413-byte export had SHA-256
`c8b5f405ebf539642b8c81ab79857bcf5087c53b3c3065c522bc918e0eac5620`.

`node art/blue/native-scenery-export.mjs --check` repeats byte/hash, alignment,
coverage and title comparisons through `native-title-format.mjs`, without
executing game/native modules. Static checks are not manual browser acceptance.
[The immutable analysis record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-title-background.md)
preserves the full per-witness and foreground-equality counts.
