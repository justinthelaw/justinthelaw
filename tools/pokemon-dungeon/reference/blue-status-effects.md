# Opening status indicators

The selected opening uses original published Rescue Team status images and
source-derived placement/timing. The source belongs to **Red Rescue Team** at
`013475aa04f5be3191e5527c186d9bfceae7cae0`; Blue status pixels and exact driver timing
have not been independently corroborated. No ROM is read or included.

## Assets and placement

`art/blue/native-status/sources.json` pins nine source PNG sheets plus the
controlling source-file hashes. Palette bytes come from the already-pinned
native sprite archive. The exporter uses the same qualified dungeon brightness
conversion as the character images, then packs one 256×144 local atlas.

The species exporter retains the first `PositionSets` attachment for every
source pose. `SpriteBank.draw()` returns that attachment plus the selected
animation frame's offset; it does not derive an approximate head position from
the trimmed sprite rectangle. The `(99,99)` source sentinel suppresses drawing.
Status images are centered at that attachment, 16 pixels upward. Sleep has the
source's additional eight-pixel horizontal offset.

Sources:

- [Status graphics and driver](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_pokemon_sprites.c)
- [Per-pose attachment lookup](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/sprite.c)
- [Actor-to-sprite join](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_mon_sprite_render.c)

## Scoped status routes

| Condition | Native bit index | Image | Palette |
| --- | --- | --- | --- |
| Sleep | 26 | Sleep | 4 |
| Burn | 1 | Burned | 0 |
| Poison | 2 | Poisoned | 11 |
| Confusion | 4 | Confused | 0 |
| Whiffer | 17 | Whiffer | 10 |
| Reflect | 8 | Shield | 0 |
| Focus Energy | 19 | Sword | 4 |
| Team HP below `floor(maxHP/4)` | 13 | Low HP | 0 |
| Any admitted battle stage below 10 | 27 | Stat down | 3 |

The original flag owner assigns no persistent indicator to paralysis, cringe,
infatuation, Bide, Leech Seed or reduced movement speed. No substitute symbols
are invented for those conditions. The separate frozen-body sprite bank is
outside the currently admitted opening effect handlers.

[Status flag source](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_8041AD0.c)
and [bit definitions](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/include/constants/status.h).

## Animation and resource limits

Shared image strips advance every four nominal frames, retaining the source's
four upload phases. Each actor cycles its nonzero status bits in ascending order
every 61 frames. Removing one condition retains its selected image until the
next selection boundary; clearing the entire mask removes it immediately.
Hidden actors advance the same bounded presentation state. A new floor resets
the image clock. Reduced motion fixes the bitmap at frame zero while retaining
informational status selection.

The loader admits exactly nine bounded records, a 16 KiB metadata body and a
256 KiB PNG body, checks dimensions before and after decode, and owns one bitmap.
The cycle map contains at most two teammates and ten enemies. It uses the
application's paused clock and never changes a turn, save or random state.
Fetches abort and the bitmap closes when the renderer is disposed.

The separate species atlas cache caps steady-state decoded pixels at 8 MiB.
It retains the previous scene while loading its successor, so transitions can
temporarily exceed that cap. All 23 currently pinned species atlases total
11,657,216 decoded pixel bytes (about 11.12 MiB), bounding that overlap. This
figure excludes portrait/status sheets and browser decoder overhead; it is not
a total browser-memory limit.

Static export checks validate image bytes, frame geometry, palette provenance,
pose coverage and metadata. They do not execute game code or establish observed
Blue status behavior. A manual status-effect playthrough remains separate.
