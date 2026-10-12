# Opening save ownership

`src/blue/save.js` owns a version-two journal:

- payload slots: `pokemon.blue-rescue-opening.v2.0` and `.v2.1`;
- handled marker: `pokemon.blue-rescue-opening.v2.handled`;
- read-only migration source: `pokemon.blue-rescue-opening.v1.0` and `.v1.1`.

Historical campaign keys are never accessed. The v1 opening slots are never
changed or removed. The opening payload remains `version: 1`; its validator,
checksum, payload fields and revision limit are unchanged. Migrating a legacy
checkpoint copies its serialized payload exactly, so a legacy
`xoshiro128ss-v1` RNG state and its sequence remain unchanged.

## Selection and migration

The ownership receipt contains both v2 raw slots and the raw handled marker.
`load()` reads that receipt twice and requires exact equality. Any present v2
slot or marker selects v2 permanently for that load: damaged, partially written
or deleted v2 data never falls back to v1.

Only when the entire v2 receipt is absent does `load()` read v1 twice. It selects
the newest supported v1 checkpoint, serializes a v2 envelope in the alternate
slot at legacy revision plus one, then immediately rechecks that v2 is still
empty and v1 is unchanged. It writes the v2 slot, verifies v2 and v1, writes the
active marker, and verifies both receipts again before exposing live ownership.
A failure or divergent receipt exposes no migrated state. Neither v1 slot is
mutated at any point.

A checksum-valid envelope with a validator-unsupported payload contributes only
an opaque revision and slot. If it is at least as new as the newest supported
checkpoint, the older checkpoint is not recovered. The opaque revision keeps an
explicit replacement monotonic; it never grants Continue ownership. Torn,
malformed, oversized, checksum-invalid or otherwise unverified bytes never
supply a revision. Unknown non-null marker encodings also block ownership. The
existing app confirmation controls replacement of unreadable data.

## Writes and deletion

Every save and delete first compares the complete v2 receipt with the last
verified observation. An unchanged payload is a no-op only after that check.
Normal saves write the alternate slot, read back the complete expected receipt,
and advance the cached revision only after verification. The marker is part of
every stale-write check.

Explicit Delete Save Data first writes and verifies the deleted marker. It then
removes only the two v2 slots, checking the full receipt after each removal. The
retained marker prevents the untouched v1 journal from resurrecting. A partial
or ambiguous delete attempts no rollback and requires a fresh load.

Starting a replacement after a deleted or unknown non-active marker first
clears and verifies lingering v2 slots, then publishes and verifies the active
marker while the slots are empty, and only then writes the new payload. A crash
cannot leave a valid new checkpoint hidden behind the old marker. A null marker
beside a valid v2 slot remains a recoverable partial migration.

Export parses only the retained verified v2 payload. Later live-state mutations
cannot change the exported checkpoint.

## Limits and evidence

These are bounded optimistic checks, not cross-process transaction isolation.
The [HTML storage model](https://html.spec.whatwg.org/multipage/webstorage.html)
provides no atomic compare-and-swap or lock across agent clusters. Another
process can change storage between a check and a write; simultaneous writers or
changes that restore identical bytes remain unproved. There is no lock key,
Web Lock, storage listener or asynchronous transaction layer.

Candidate 12 passed syntax, strict types, lint and static flow review. An
ordinary browser migration check copied a 454-turn legacy adventure, saved
455 turns in v2, then saved 456 turns in the old build. Reloading v2 still showed
455. A separate two-tab check rejected a stale Quicksave with a visible warning
and retained the newer 456-turn checkpoint. Both checks had empty warning/error
logs. The legacy slots and all saves were preserved.

These sequential browser checks do not prove every interleaving. Damaged-v2
handling, delete tombstones and quota failures remain source-reviewed only.
