# Structural preflight

## Redundant work

`src/domain/state/structure.js` previously traversed each successful union member
twice, even when the caller supplied no visitor. The first recursive probe used
isolated diagnostics and no visitor, then a second recursive pass repeated the
same proof. Each nested successful union repeated its own two traversals, so
work multiplied along nested union paths. The selected v24 expedition registry
contains 24 variants with full actor and floor trees; dungeon state makes this
cost substantially larger than an opening scene with no session.

The inspector now returns the successful probe directly when no visitor exists.
A caller with a visitor still receives the original admitted traversal. Branch
order, isolated trial diagnostics, failure diagnostics, reference callbacks,
registry selection, exact shapes and all semantic validation remain unchanged.
There is no cross-call cache or new admission shortcut: the entire selected
member must succeed in the current call before returning true.

## Predictable nullable identity failures

The manual baseline dungeon trace separately exposed exception overhead:
`instanceId` accounted for approximately 38.740 seconds of self samples in a
46.425-second recording, and structural inspection accounted for about 41.300
seconds inclusive. Nullable tile `roomId` and `shopId` try an instance branch
before the literal null branch. Each expected null mismatch previously
constructed and caught a `TypeError` inside structural traversal.

The instance branch now rejects nonstrings through the existing `fail()` owner
before calling `instanceId`. The identity function already rejects every
nonstring, so the accepted values and retained diagnostics are identical.
Strings still pass the unchanged full identity validator, preserving kind,
prefix, length, decimal spelling and safe sequence checks. `ids.js` is unchanged.

## Preservation argument

A successful visitorless probe has already checked all the selected member's
fields. It produced no retained issues and ran no callbacks. Repeating that
same visitorless proof contributes neither admission evidence nor diagnostics.
An unsuccessful candidate still proceeds to the next candidate, and no match
still calls the original failure owner. When a visitor exists, its full original
pass retains reference ordering and diagnostics; speculative probes still never
invoke it. The historical schema and original-envelope codec stay byte-identical.

## Verification and remaining evidence

`check-structure-unions.mjs` parses the exact union control flow, authenticates
every unrelated inspector byte against the pre-change source, and rejects eleven
deliberate mutations covering failed admission, leaked trial diagnostics,
speculative/missing visitors, wrong registry, redundant traversal and identity
admission. The audit
runs with `save-boundaries:check` and never evaluates game source.

An actual manual Tiny Woods entry stalled on the baseline runtime, prompting
this source review. The subsequent native Wait/Right recording showed a
16.625-second interaction and five production main-thread tasks of 3.492 to
14.592 seconds. This identifies the baseline structural bottleneck; a comparable
after trace remains required before claiming an improvement. Earlier awakening
dialogue profiling was responsive and does not establish dungeon or
maximum-envelope performance. The trace and its data-only analysis remain in
the task's external evidence directory.
