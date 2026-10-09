# Unselected native geometry operations

`prepareSinisterNativeGeometry(input, authority)` produces one detached,
deeply frozen before/after proposal for an explicitly named comparative Red
geometry operation. The exact source is commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; five native files and four unchanged
runtime dependencies are authenticated in `sources.json`.

This supplies missing geometry algorithms, not a layout generator, native
constructor, source history, save admission, or selected Sinister route.
It takes an explicit current observer at the actual call phase. Matching the
separately supplied owner is a necessary private-call join, not evidence that
either input was generated legitimately. The future construction owner must
authenticate every tile write, pointer token, retained byte, source call PC,
and transaction before committing a proposal.

| Operation | Exact owned projection |
| --- | --- |
| `reset-floor-tiles` | Main56x32 tile scalar/pointer reset and impassable border flags. Retains current room bounds, room count, all32 junction counts and all32 positions per room. The separate stairs, fixed-room tiles, item count and trap resets are not supplied. |
| `finalize-junctions` | Column-major in-place corridor neighbor writes, secondary-to-normal conversion and room254 anchor conversion; then actual column-major junction collection, capped at32 per room with unused tails retained. |
| `rebuild-room-bounds` | Row-major room extrema, signed16 sentinels9999/-9999, active/explored bytes, exclusive maxima, source room-count behavior and unsigned32 pixel bounds. Inactive-room pixel bytes remain retained. |
| `rebuild-neighbor-masks` | Four source masks in south-first direction order; diagonal corner sides require any nonzero terrain, destination requirements remain distinct, and wall masks use the exact native boundary offsets. |

The narrow native observer keeps the actual source dimensions56x32. It does
not silently replace hardcoded native wall limits with browser dimensions.
Original Blue has a different Tile layout (0x14 versus comparative Red0x18),
so this represents named fields and symbolic pointer tokens, not platform
addresses or binary memory. A qualified browser-to-native geometry observer
crosswalk remains required before connecting the existing AI proposal.

Room indices0–255 remain observable during partial construction. Room-bound
rebuild explicitly requires0–31 or corridor255, rejecting unresolved254 anchors
or other unsafe indices instead of indexing native storage out of bounds.
Junction positions retain full signed16 historical storage, including inactive
tails. The public input never defaults missing observations to zero.

The source's in-place ordering matters: an anchor may gain its junction flag
before it becomes a corridor. The helper retains that behavior and keeps the
source's left/up/down/right neighbor order. A later secondary-terrain phase can
change tiles after junction collection; this proposal does not recompute a
final-looking junction inventory at arbitrary call sites. Final room and mask
rebuilds occur after `GenerateFloor` and before final wild placement in the
source floor loop, separately from initial constructor AI.

Each proposal copies a bounded ordinary graph before validating it, validates
the complete result, and returns no simulation events or RNG draws. It exposes
no mutation or commit callback. Only the output's declared fields may be
committed after current input/authority/source-PC authentication; the helper
does not prescribe an invented sequence that would skip layout attempts,
partial fixed actor construction, or retained preceding-floor observations.

Run `node tools/pokemon-dungeon/scripts/check-sinister-native-geometry.mjs
--native-root /path/to/pinned-native` for source/AST/Git qualification and12
negative source controls. Source lint and strict no-emit type checks remain
separate. No game or native module is imported or executed under D05.

The next construction package must produce actual layout/partial tile writes,
native temporary actor fields and Hidden Power, initial AI, final resources,
sleep and ordered refresh with authenticated journals. Full raw admission,
live route composition, turns/terminal owners, Blue qualifications and human
device/visual/campaign acceptance remain open.
