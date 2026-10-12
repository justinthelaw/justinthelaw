# Archived runtime species/form atlas report

Historical runtime-art checkpoint, base `db9f7dc53f79f4c18ec0c72e75e408165acbfe25`.
The 3D renderer/roster described here is retired; the active
[Blue opening](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md)
uses scoped Canvas 2D assets. [Original report](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/.superpowers/sdd/FULL-GAME-EXECUTION/runtime-roster-report.md).
Historical game-relative paths and measurements below are retained as evidence.

## Export evidence

The former DungeonRenderer/ActorLayer resolved exact species/form/clip identity
across 419 profiles, failing unknown identities without species/form fallback.
Deterministic packing followed source order with whole-bundle shard ownership.

| Measurement | Recorded result |
| --- | --- |
| Profiles / species | 419 / 386 |
| PNG clip pages | 5,028 |
| Unchanged starter pages | 192 across 16 starters, byte-for-byte |
| Metadata shards | 27; maximum 65,728 bytes; limit 128 KiB |
| PNG bundles | 78; maximum 921,353 bytes; limit 900 KiB = 921,600 bytes |
| Encoded PNG bytes | 61,297,497 |
| Largest PNG | 22,323 bytes; limit 64 KiB |
| Root manifest | 88,098 bytes; limit 256 KiB |
| Runtime files | 107; exact closure, no stale loose PNGs |
| Manifest SHA-256 | `88fcea579360c6d879d32a554ed9a0027028d7322581080ce7bcfe075e0d758c` |

The 1 MiB pre-push gate was unchanged. Packed ranges preserved starter PNG bytes
and authoring files. `pixel-catalog.js` joined exact identities and lazily validated
metadata/ranges; `art-resources.js` owned refcounted queues; `asset-io.js` supplied
bounded streamed reads/hashes; `assets.js` validated bundles/PNGs before decode;
`actors.js` retained mesh/material/UV ownership. Tools exported and independently
checked bytes, joins, ranges, PNG headers and closure. The retired contract was
`plan/RUNTIME-PIXELS.md`; renderer lifecycle APIs and `{promise,release}` page leases
remained stable while the schema-2 root replaced eager page lists.

## Ownership bounds

Recorded decoded reservations were 21 × 1,179,648 = 24,772,608 bytes, below 24 MiB.
Each metadata/bundle pool admitted 21 declarations and two started entries,
including settled leased data. Limits were 1,843,200 bundle bytes, 262,144 metadata
bytes and 1,376,256 extracted-PNG bytes (21 × 64 KiB). Queued work owned no response
buffers; there was no idle cache or speculative load.

The conservative 9,068,544-byte buffer envelope counted three copies of bundle/
metadata capacity plus two PNG reservations. Exact-length reads avoided trim
copies; root loading was separately bounded. These were explicit resource
ownership limits, excluding browser/crypto/decode internals, GC lag, JS objects
and GPU copies. Zero references canceled or evicted resources, but reservations
lasted through settlement. Shared leases could not cancel each other's fetch;
last release disposed texture/bitmap and late canceled bitmaps closed immediately.
Pressure errors required later presentation sync, without exceeding budgets.

## Art evidence and limits

Direction boards for Caterpie, Butterfree, Pidgey, Sunkern, Wurmple and Exeggcute
were inspected. Sunkern became a limbless striped seed with jagged rim/two-leaf
sprout; Exeggcute became six separate faced/cracked shells in a wider layout.
Revised direction and twelve-clip boards were inspected; all six eggs were not
required to remain visible through every occlusion. Continuation was provisional.

Appearance references were [official Sunkern art](https://assets.pokemon.com/assets/cms2/img/pokedex/full/191.png)
and the [official entry](https://in.portal-pokemon.com/pokedex/0191/). No commercial
raster input, ImageGen or browser capture was used for those authored assets.
Candidate metadata retained 14 symmetric profiles, 285 held directional rows and
three collision pairs: Metapod/Kakuna, Venomoth/Beautifly and Latias/Latios.
Whole-roster recognition, all views/animations, runtime composition/scale and
hardware performance were not accepted by these static measurements.

## Recorded verification

| Check | Historical result |
| --- | --- |
| Lint / types | 205 authored files / 126 source files passed |
| Production pixels | 16 species, 192 pages, 6,144 cells; hashes, CRC, alpha/gutters |
| Roster pixels | 419 profiles, 5,028 pages, 160,896 cells; source/catalog joins |
| Runtime pixels | Exact joins, 192 starter copies, 27 shards/78 bundles, hashes/ranges/paths/closure |
| Export `--check` | Deterministic bytes and closure matched |
| Environment | 12 kits, 40 props, 41 PNGs; shared reader API retained |
| Diff hygiene | Passed |

PNG decoding was static binary inspection. No game import/execution, automated
playthrough, browser runtime smoke or gameplay capture was recorded. Held-item
mechanics and application composition belonged to other work. Asset-error/retry
UX, rapid replacements, context loss, physical-device memory/performance and
human gameplay/visual review remained open then; no full-game or whole-roster
acceptance was claimed.
