# Immutable escort structural preflight candidate

## Cause and change

`content/state/escort-resources.js` calls its raw proof directly and through
`content/state/escort-campaign.js`. Each proof calls entry validation directly
and via the learning/work proofs. The resulting six structural requests per
resource callback repeatedly copy and scan the whole campaign on the main
thread. This is static call-graph evidence, not a measured browser duration.

`src/domain/state/escort-shape-proof.js` now retains successful structural
admission in a private WeakSet only after bounded plain-data copying, exact
shape validation and descriptor-only traversal proving every descendant is
frozen. The recursively frozen schema registry is unchanged. Cache misses,
mutable/shallow-frozen callers and failed input retain full preflight. No
caller is frozen or repaired; no semantic/raw ownership result is cached.
Every independent resource, learning, entry and complete-state callback runs.

## Verification and remaining gates

- `tools/pokemon-dungeon/scripts/check-escort-shape-cache.mjs` parses source
  only; it failed before implementation and passed after, including ten
  rejected mutations of cache identity, admission and freeze ownership.
- Source lint, strict types, historical save-boundary and escort work/resource/
  activation checks passed. Semantic proof files and frozen pins are unchanged.
- Full authoring rerun was interrupted for the user-requested handoff.
- Independent review, full current-head CI and before/after manual browser
  profiling remain open. No gameplay or performance acceptance is claimed.
- Continue [the handoff](CODEX-HANDOFF-2026-10-09.md) before further optimization.
