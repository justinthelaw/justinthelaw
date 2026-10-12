# Status indicator evidence

Artwork and timing use comparative Red source
`013475aa04f5be3191e5527c186d9bfceae7cae0`; Blue pixels/driver timing remain
unverified. `art/blue/native-status/sources.json` pins source sheets/controller
hashes. Palette bytes come from the native sprite archive; no ROM is included.

The current `status-icons.json` atlas is 256x192 with 12 records. Runtime
`render-status.js` derives height/count from its closed `EXPECTED` table,
rather than maintaining a separate fixed height.

| Condition | Bit | Palette | Runtime selection |
| --- | ---: | ---: | --- |
| Sleep | 26 | 4 | Active; additional +8px horizontal offset |
| Burn | 1 | 0 | Active |
| Poison | 2 | 11 | Active |
| Confusion | 4 | 0 | Active |
| Whiffer | 17 | 10 | Active |
| Reflect / Counter | 8 | 0 | Shared shield |
| Light Screen | 10 | 3 | Active shield |
| Protect | 11 | 10 | Artwork loaded; `statusMask()` currently omits this bit |
| Safeguard | 9 | 4 | Artwork loaded; `statusMask()` currently omits this bit |
| Focus Energy | 19 | 4 | Active |
| Team HP below `floor(maxHP/4)` | 13 | 0 | Team only |
| Any battle stage below 10 | 27 | 3 | Does not include movement speed |

The missing Protect/Safeguard selection is a runtime gap, not an absent asset.
Paralysis, cringe, infatuation, Bide, Leech Seed and slow have no invented
persistent symbols. The separate frozen-body bank is outside admission.

## Position, clock and limits

`SpriteBank.draw()` returns the selected pose attachment plus frame offset.
The `(99,99)` sentinel suppresses it; icons center there, 16px upward.
Images update every four nominal frames; actors cycle ascending active bits
every 61 frames. Removal retains the chosen icon until the next boundary,
unless the mask becomes empty. Hidden actors advance; floors reset the clock.
Reduced motion fixes image frame zero but retains informational selection.

The loader admits only the curated records, 16 KiB metadata and 256 KiB PNG
bodies; dimensions are checked before/after decode. One bitmap and at most
12 actor cycles are owned by the renderer, with abort/disposal guards.
Species atlases separately cap steady-state pixels at 8 MiB; transition overlap
is bounded by all 23 atlases (11,657,216 bytes), excluding decoder overhead and
other sheets. This is not a total browser-memory cap.

Sources: [graphics/driver](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_pokemon_sprites.c),
[attachments](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/sprite.c),
[actor join](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_mon_sprite_render.c),
[flags](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_8041AD0.c),
[bits](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/include/constants/status.h).
Static geometry/provenance checks are separate from manual status acceptance.
