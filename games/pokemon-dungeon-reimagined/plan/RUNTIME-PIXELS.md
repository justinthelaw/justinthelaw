# Whole-roster runtime atlas adapter

The runtime directory now declares all419 canonical species/form profiles and
5,028 clip pages. It promotes original candidate art for provisional integration,
not whole-roster visual acceptance. The sixteen starter sources and all192 PNG
byte sequences are preserved exactly. No default-form or other-species fallback
is allowed for an absent identity.

## Delivery format

`assets/characters/pixel/manifest.json` is schema2 with the existing
`directional-pixel-clip-v2` profile and `roster-provisional-integration` review tag.
`integrity.js` pins its SHA-256. The88,098-byte root contains the common twelve
clip timings, frozen96×96 cell/384×768 page dimensions,419 character records,
27 metadata-shard descriptors and78 bundle descriptors. Its source manifest hash
joins the tools-only roster provenance, exact source pages and canonical catalog.

Character records contain `profileId`, `speciesId`, canonical nullable `formId`,
`assetId`, `worldHeight`, and `shardId`. Null remains the canonical default;
`default` is only the existing asset-ID spelling. Named Unown/Castform/Deoxys forms
retain their exact canonical IDs in lookup, lease, actor replacement and cache keys.

Each `pages-NN.json` owns at most16 identities and all twelve pages per identity.
It is independently pinned by hash and encoded length, with a128KiB limit.
Page records contain exact profile/species/form/asset/clip, original PNG filename,
SHA-256, encoded length, decoded byte count, bundle ID and byte offset. Each PNG
is at most64KiB (largest actual22,323 bytes). The root directory is capped at256KiB.

Each `bundle-NNN.bin` contains complete unmodified PNG byte sequences concatenated
in deterministic source order. Bundles are capped at900KiB (921,600 bytes), below
the unchanged1MiB repository pre-push limit. The largest is921,353 bytes. Total
PNG bytes are61,297,497. A bundle belongs to exactly one metadata shard; that
shard validates contiguous nonoverlapping ranges covering every bundle byte.
This grouping uses78 bundles instead of maximizing packing across shard boundaries,
so validation never needs another species group's metadata. There are107 runtime
files including the root, integrity module and metadata shards; no stale loose
PNGs remain. Original starter PNG bytes survive inside their bundle ranges.

Fetches use same-origin relative URLs, reject redirects, stream into a declared-
capacity buffer, reject overlong responses, and verify the whole bundle before
extracting a requested PNG. The PNG's own length/hash and header are checked
before `createImageBitmap`. HTTP Range support is neither requested nor assumed.
Unsafe paths, unknown forms, invalid shard owners, duplicate clips, overlaps,
gaps, stale hashes and incorrect dimensions fail explicitly.

## Caller API and lifecycle

`DungeonRenderer` keeps its existing API. `ready` loads only the small root
directory. `syncActors(views)` accepts exact species/form/clip presentation views,
awaits their declared assets, and retains domain visibility filtering. ActorLayer
owns meshes/materials/UVs and leases; it does not select a substitute identity.
Its actor replacement key is `[speciesId,formId,clip]`.

At the internal adapter boundary, `ClipPageCache.acquire(character,clip,manifest)`
returns `{promise,release}`. The promise resolves `{texture,bitmap}`. A cache accepts
only one immutable manifest revision. The manifest remains available through
`loadPixelManifest(signal)`; common byte-read/hash exports remain available to
the unchanged environment asset consumer through `assets.js`.

Pages are refcounted, with no idle texture cache or speculative preload. Multiple
actors sharing an exact page share one decode. Last release aborts its work;
loaded texture/bitmap disposal is immediate, while an unabortable image decode
keeps its reservation until it settles and closes its late bitmap. Metadata and
bundle pools separately share identical requests, hold at most21 entries each,
run at most two loads each, and keep zero idle resources. Queued jobs own only
bounded declarations. Last release removes queued work or aborts active fetches;
active byte reservations remain until completion/cancellation settles. Releasing
one consumer does not abort a request still needed by another. A cancelled
consumer awaiting such a shared request retains its page reservation until the
shared result arrives; it then rejects before extraction/decode. Cache disposal
cancels both pools and closes all settled decoded pages.

Pool limits and pending cancellation can return an explicit asset error requiring
a later presentation sync; they never exceed the budget to hide pressure. No
new retry clock or domain action is introduced by this adapter. Existing renderer
generation checks continue to discard stale completions.

## Resource bounds

| Owned resource | Bound |
| --- | --- |
| Decoded page reservations, including pending/cancelled decode | 21×1,179,648 =24,772,608 bytes, below24MiB |
| Bundle data pool | Two active loads; at most1,843,200 declared bytes resident/inflight |
| Metadata pool | Two active loads; at most262,144 declared JSON bytes; each shard≤192 page records |
| Extracted PNG reservations | 21×65,536 =1,376,256 bytes; independent of bundles |
| Conservative streamed/trimmed/extracted/Blob buffer envelope | 9,068,544 bytes, reported as `transientBufferLimitBytes` |
| Root directory fetch | Separate startup maximum256KiB, before page work starts |

The conservative envelope counts three times the pooled byte limits (capacity
buffer, at most one current accepted network chunk, and a possible short-response
trim copy), plus two times extracted PNG reservations for PNG and Blob ownership.
There is no collected-chunk array. Exact-length normal responses do not need the
trim copy. Parsed metadata is bounded by two declared128KiB shards and their
record counts; the permanent directory is separately bounded at419 characters,
27 shards and128 maximum bundles. UTF-8 decoding, JavaScript object overhead,
crypto/decoder internals, browser network buffering, garbage-collection lag,
GPU copies, terrain and framebuffers are outside the page-texel budget. This is
explicit ownership accounting, not a claim about total browser process memory.

`DungeonRenderer.metrics.characters` retains page counters and now includes
`pngReservedBytes`, `transientBufferLimitBytes`, and metadata/bundle pool counters
(`reservedBytes`, `peakBytes`, `active`, `queued`, `resources`, `limitBytes`).

## Source and visual scope

The six opening nonstarter eight-direction boards were inspected: Caterpie,
Butterfree, Pidgey, Sunkern, Wurmple and Exeggcute. Sunkern now has one limbless
yellow seed, dark vertical stripes, a jagged rim and a thin top stem with two
leaves; no invented feet/lateral body leaves or separate head remain. Exeggcute
has six individually faced, cracked shells in a wider unequal-height cluster.
Occlusion may hide shells in a direction; source geometry remains exactly six.
The controller inspected the two revised boards and permitted provisional
integration, without granting full art acceptance.

The changes are original code-native shapes in `tools/pokemon-dungeon/art/roster/opening.mjs`.
Official Sunkern artwork was inspected only as an appearance reference; no
commercial pixels, vectors, models or scripts were copied into the repository.
References: <https://assets.pokemon.com/assets/cms2/img/pokedex/full/191.png> and
<https://in.portal-pokemon.com/pokedex/0191/>. Modern Pokédex mechanics on that page
were not used as game rules. Other opening art is unchanged. Individual recognition,
every animation/view, composition, world scale and hardware performance remain
human review gates across the broader roster.

## Reproduction and evidence

The tools-only roster source/export/check remain the art authority. Runtime export
parses its pinned JSON and copies exact PNG bytes; it imports no game modules.
The separate checker independently joins canonical profile IDs/forms, all source
pages, bundle ranges, hashes/lengths/headers, complete clip coverage, unchanged
starter bytes and exact file closure. Production/roster audits additionally check
PNG CRCs, decoded cells, gutters, alpha and source/frame hashes.

```sh
node tools/pokemon-dungeon/art/roster/export.mjs
node tools/pokemon-dungeon/scripts/export-runtime-pixels.mjs
node tools/pokemon-dungeon/scripts/export-runtime-pixels.mjs --check
node tools/pokemon-dungeon/scripts/check-runtime-pixels.mjs
npm --prefix tools/pokemon-dungeon run production:check
npm --prefix tools/pokemon-dungeon run roster:check
```

No browser runtime, automated game-source import/test/playthrough or gameplay
capture was used. Application composition and allowed human runtime inspection
follow independent review of this adapter.
