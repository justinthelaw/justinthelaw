# Opening save ownership

`src/blue/save.js` owns a version-two journal:

- payload slots: `pokemon.blue-rescue-opening.v2.0` and `.v2.1`;
- handled marker: `pokemon.blue-rescue-opening.v2.handled`;
- read-only migration source: `pokemon.blue-rescue-opening.v1.0` and `.v1.1`.

Historical campaign keys are never accessed. The v1 opening slots are never
changed or removed. Opening payload version 1 remains readable only without progress metadata.
Version 2 requires exactly `playFrames`, `adventures` and `saveKind`; unknown
extra progress keys make the checksum-valid payload unsupported instead of
silently rewritable. First write promotes v1 with null time/count and unknown
kind, preserving missing history rather than deriving it from turns, floor,
level or EXP. The read-only v1 journal and legacy `xoshiro128ss-v1` sequence
remain unchanged.

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

## Continue metadata and card ownership

New adventures start play time at zero and increment it from the existing
eligible foreground animation-frame delta only while playing. Hidden,
unfocused, paused, Help, loading and root-menu time do not advance it. The
source ceiling is `9999:59:59`. Adventures starts at zero, increments on first
Tiny Woods entry and each fresh retry, caps at 99,999, and does not change on
floor transitions or Continue. Save kind distinguishes browser checkpoint,
quicksave, completed and unknown legacy state. Ordinary autosaves do not infer
quicksave provenance from the current phase.

The dedicated card renders Team, leader Name, Location, Play time, Adventures
and the friend-rescue Helper in source order. Pre-team formation uses `？？？？`;
the opening helper is `-----`, not the ordinary partner. A separate prompt and
Yes/No window starts on No. No/B return to root and Yes alone resumes; the
quicksave prompt is selected only from saved kind. Complete location takes
precedence over the retained dungeon object. Card geometry follows comparative
Red `load_screen.c` window cells; direct Blue placement, pixels, wording and
default-No identity remain qualified.

The in-dungeon main menu uses the same `playTimeText` formatter as the Continue
card. It snapshots the live foreground counter when the menu is built, places
the native-aligned `Play:` label at `(139,156)` and value at `(171,156)`,
and includes the value in the menu's non-dialogue accessibility announcement.
The existing foreground clock continues while the menu is open, but the visible
snapshot is intentionally not refreshed on every animation frame. This adds no
state, timer or scheduler, and legacy missing history remains `Unknown`.

Payload v2 also forms a forward-writer barrier: cached older code rejects its
exact numeric version, and a tab that loaded v1 before promotion fails the
existing exact-receipt check after v2 is written. Envelope revisions, opaque
unsupported handling, deletion markers and cross-process limitations are
unchanged.

## Limits and evidence

These are bounded optimistic checks, not cross-process transaction isolation.
The [HTML storage model](https://html.spec.whatwg.org/multipage/webstorage.html)
provides no atomic compare-and-swap or lock across agent clusters. Another
process can change storage between a check and a write; simultaneous writers or
changes that restore identical bytes remain unproved. There is no lock key,
Web Lock, storage listener or asynchronous transaction layer.

Candidate 25's full pinned Node 24.21.0 aggregate suite passed at 151 files
and 2,803,390 bytes. A fresh website-iframe check observed `0:02:05` and zero
Adventures before Tiny Woods, retained those values through No/root/Continue,
then observed `0:05:00`/1 after first entry and `0:05:52`/2 after Give Up and
Try again. The B1F Adventure Log remained at zero turns, independently of play
time. A separate preserved Mimi/Shell 91-turn completed save displayed `Tiny
Woods cleared` instead of its retained B3F object, resumed the completed
Caterpie state, retained all three berries in Adventure Log, and preserved the
cleared card through another top-menu Continue. Browser warning/error logs were
empty. These checks did not measure Help clock exclusion precisely, establish a
floor-transition count, produce fresh completed metadata or complete a
candidate-25 rescue.

Candidate 26's full pinned Node 24.21.0 aggregate suite passed at 151 files and
2,804,438 bytes. A restored Cinder/Fern save exposed the same Play time through
the visible dungeon menu and its accessibility announcement from `0:05:54`,
then retained B1F, `0:06:51`, Adventures 2 and one turn through Quicksave and
Continue. A separate continuation retained the metadata, observed `0:07:08`,
used Help download/Return, descended to B2F, and Quicksaved at `0:10:01` with
Adventures still 2 and five logged turns. Browser warning/error logs were
empty. This verifies that a floor transition does not increment Adventures;
it does not precisely measure Help clock exclusion or establish a full rescue.

Candidate 12 passed syntax, strict types, lint and static flow review. An
ordinary browser migration check copied a 454-turn legacy adventure, saved
455 turns in v2, then saved 456 turns in the old build. Reloading v2 still showed
455. A separate two-tab check rejected a stale Quicksave with a visible warning
and retained the newer 456-turn checkpoint. Both checks had empty warning/error
logs. The legacy slots and all saves were preserved.

These sequential browser checks do not prove every interleaving. Damaged-v2
handling, delete tombstones and quota failures remain source-reviewed only.
