# Runtime species/form atlas implementation report

Base `db9f7dc53f79f4c18ec0c72e75e408165acbfe25`, original active branch.
Owned scope is runtime art export/loading and the two scoped opening art
corrections. No gameplay/state/application, root README, publication or unrelated
evolution changes were made. No subagents or game execution were used.

## Result and delivery closure

The existing DungeonRenderer/ActorLayer now resolves exact canonical species,
nullable form and clip identity across all419 profiles. Unknown identity or form
fails explicitly; there is no default-form or different-species fallback.
The public renderer API remains unchanged.

| Export measurement | Result |
| --- | --- |
| Canonical profiles / species | 419 / 386 |
| Exact PNG clip pages | 5,028 |
| Preserved starter pages | 192 across16 starters, byte-for-byte |
| Metadata shards | 27, maximum65,728 bytes; runtime limit128KiB |
| PNG bundles | 78, maximum921,353 bytes; limit900KiB=921,600 bytes |
| Encoded PNG bytes | 61,297,497 |
| Largest individual PNG | 22,323 bytes; runtime limit64KiB |
| Root manifest | 88,098 bytes; runtime limit256KiB |
| Runtime directory files | 107, exact closure with no stale loose PNGs |
| Root manifest SHA-256 | `88fcea579360c6d879d32a554ed9a0027028d7322581080ce7bcfe075e0d758c` |

Packing is deterministic in original source order. Shards own whole bundles,
so overlap/gap/closure validation does not need another group's metadata.
This deliberately uses78 bundles instead of maximizing packing across groups.
The existing1MiB repository pre-push gate is unchanged. Every runtime output is
at most900KiB. Former loose starter PNG files are replaced by ranges containing
their identical bytes; all production starter authoring files remain unchanged.

## Files and APIs

- `src/rendering/pixel-catalog.js`: pinned root loading, exact form joins, lazy
  metadata validation, safe local paths, complete per-shard clip/range closure.
- `src/rendering/art-resources.js`: bounded shared refcounted metadata/bundle
  ownership, queueing, cancellation and residency.
- `src/rendering/asset-io.js`: shared same-origin streamed reads/hash helper,
  extracted from assets.js and changed to a single declared-capacity buffer.
- `src/rendering/assets.js`: existing decoded page cache composed with the lazy
  pools, whole-bundle and extracted-PNG validation before PNG decode, same texture
  sampling and bitmap disposal rules.
- `src/rendering/actors.js`: exact species/form/clip lookup and replacement keys;
  preserved mesh/material/UV/visibility ownership.
- `scripts/export-runtime-pixels.mjs`: tools-only binary packer and `--check`
  deterministic comparison; `check-runtime-pixels.mjs` independently inspects
  JSON, source/canonical joins, hashes, bundle ranges, PNG headers and file closure.
- `art/roster/opening.mjs`, character integration and generated roster source
  manifests/indexes: original Sunkern/Exeggcute corrections and source provenance.

Full contract: `plan/RUNTIME-PIXELS.md`, linked from the updated renderer and
roster contracts. `loadPixelManifest(signal)` now returns the small schema2 root
directory (no eager page list). Internal `ClipPageCache.acquire(character,clip,
manifest)` returns the existing `{promise,release}` lease, resolving
`{texture,bitmap}`. ActorLayer supplies those declarations. External callers keep
using renderer `ready`, `loadWorld`, `syncActors`, update/lifecycle APIs unchanged.
`metrics.characters` adds metadata/bundle counters, `pngReservedBytes` and
`transientBufferLimitBytes` while preserving existing decoded-page metrics.

## Bounds and lifecycle source review

Decoded reservations stay at21 pages ×1,179,648 bytes=24,772,608, below24MiB.
Each resource pool admits at most21 declarations and at most two started entries,
including settled-but-still-leased data. Bundle ownership is bounded at1,843,200
encoded bytes; metadata at262,144 declared JSON bytes. Queued work owns no
response buffers. There is no idle compressed/decoded cache or speculative load.
Each requested page also reserves64KiB for extracted PNG data, at most1,376,256.

The conservative buffer envelope is9,068,544 bytes: three times bundle+metadata
limits (stream capacity, current accepted chunk, possible short-response trim
copy), plus two times PNG reservations for PNG/Blob ownership. Normal exact-
length responses require no trim copy. No chunk array can grow independently of
the byte budget. Root fetch is separately bounded before character page work.
Parsed JSON is bounded by shard bytes/counts. These are explicit ownership limits;
browser/crypto/decode internals, GC lag, JS object overhead and GPU copies are
not a claim of total process memory and are documented separately.

Zero references cancel queued or inflight resources, or immediately evict settled
data. Cancellation reservations remain until load/decode settlement. Releasing
one lease cannot abort another consumer's shared fetch. A cancelled page waiting
on a still-shared resource retains its page reservation until the shared promise
settles, then fails before extraction/decode. Last decoded-page release disposes
texture and bitmap; late cancelled bitmaps close immediately. Resource disposal,
actor generations, clip replacement and renderer generations retain prior owners.
Pressure/cancelling-key errors are explicit and may require a later presentation
sync; the adapter does not exceed limits or introduce a gameplay retry clock.

## Art inspection and qualification

Inspected eight-direction PNG boards for Caterpie, Butterfree, Pidgey, Sunkern,
Wurmple and Exeggcute. Replaced Sunkern's generic plant body with a single limbless
seed, dark vertical stripes, jagged rim and two-leaf top sprout. Replaced the
occluded generic Exeggcute cluster with six independent faced/cracked shells and
a wider staggered layout. Also inspected the two revised twelve-clip front-right
boards. Source geometry remains six eggs; all six need not be visible through
occlusion in every view. Controller inspected the two revised direction boards
and authorized provisional continuation. Other opening art is unchanged.

Official Sunkern references were appearance-only:
<https://assets.pokemon.com/assets/cms2/img/pokedex/full/191.png> and
<https://in.portal-pokemon.com/pokedex/0191/>. No commercial artwork was copied
into the repository or used as raster drawing input. New art uses existing
original code-native shape/painter utilities. No ImageGen or browser capture.

Both authoring and runtime metadata preserve candidate/provisional status. The
static roster report still identifies14 symmetric profiles,285 held directional
rows and3 silhouette collision pairs (Metapod/Kakuna, Venomoth/Beautifly,
Latias/Latios). Those are existing candidate review gaps, not proof of art
acceptance or a reason to alter unrelated species in this task. Whole-roster
recognition, every view/animation, runtime camera composition, scale and hardware
performance remain human review gates.

## Verification

| Command / check | Result |
| --- | --- |
| `npm run lint` | Passed205 authored files; no game execution |
| `npm run typecheck` | Passed126 authored source files; strict static checking |
| `npm run production:check` | Passed16 species,192 pages,6,144 cells; exact PNG/source/frame hashes, CRC, alpha/gutters |
| `node scripts/check-roster-pixels.mjs` | Passed419 profiles,5,028 pages,160,896 cells; hashes, CRC, alpha/gutters, source/catalog joins |
| `npm run runtime-pixels:check` | Passed exact419/5,028 joins,192 starter copies,27 shards/78 bundles, all hashes/ranges/paths/closure |
| `node scripts/export-runtime-pixels.mjs --check` | Deterministic output bytes and closure matched |
| `npm run environment:check` | Passed12 kits/40 props/41 PNGs; shared byte-reader API retained |
| `git diff --check` | Passed |

PNG decode in static tools is binary inspection, not game-source execution.
No automated game import/test/playthrough, browser runtime smoke test or gameplay
capture was run. Manual art-board inspection is not runtime correctness evidence.

## Next owner and open limits

Root owns independent review and publication. The requested opening held-item
mechanics correction is queued separately; this art task did not edit gameplay.
Application composition then uses the unchanged renderer/presentation APIs and
exact domain visibility. Remaining runtime evidence: asset errors/retry UX,
rapid actor/clip/world replacement, context loss/restoration, physical-device
memory/performance and human gameplay/visual review. No full-game completion or
whole-roster human art acceptance is claimed.
