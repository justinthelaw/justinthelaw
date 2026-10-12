# Opening save ownership

`src/blue/save.js` owns the two-slot journal. Historical campaign keys are
never accessed; prior opening slots remain read-only.

| Key | Role |
| --- | --- |
| `pokemon.blue-rescue-opening.v2.0`, `.v2.1` | Current payload slots |
| `pokemon.blue-rescue-opening.v2.handled` | Active/deleted ownership marker |
| `pokemon.blue-rescue-opening.v1.0`, `.v1.1` | Read-only migration sources |

Payload version 1 is readable without progress metadata. Version 2 requires
exactly `playFrames`, `adventures` and `saveKind`; unknown extra progress keys
make a checksum-valid payload unsupported. Promotion uses null time/count and
unknown kind, preserving missing history rather than inferring it from EXP/turns.

## Selection and writes

1. `load()` reads both v2 slots and marker twice, requiring exact equality.
   Any present v2 byte selects v2; damaged/deleted/partial v2 never falls back to v1.
2. Only an entirely absent v2 receipt permits two matching v1 reads. Migration
   selects the newest supported checkpoint and prepares revision +1 in the
   alternate slot, then rechecks empty v2 and unchanged v1 before writing.
3. After slot write, verify both receipts; write the active marker; verify both
   again before granting ownership. Any failure/divergence exposes no migrated state.
4. Every save/delete compares the entire receipt with the last verified one.
   Even unchanged-payload no-ops check ownership. Saves alternate slots and
   advance the cached revision only after full readback verification.

A checksum-valid but unsupported payload contributes only its opaque revision/
slot. If it is at least as new as supported data, older recovery is blocked.
Malformed, torn, oversized or checksum-invalid bytes supply no revision.
Unknown non-null markers block ownership; explicit app confirmation controls
replacement. Export parses the retained verified payload, not mutable live state.

## Deletion and replacement

Delete first writes/verifies the deleted marker, then removes only the two v2
slots with a full receipt check after each removal. The marker prevents v1
resurrection. Ambiguous/partial deletion performs no rollback and needs reload.

Replacement after a deleted/unknown marker clears/verifies lingering v2 slots,
publishes/verifies active ownership while empty, then writes the new payload.
A null marker beside a valid slot remains a recoverable partial migration.
Payload v2 and exact receipts also block stale cached v1 writers.

## Progress and Continue

- Eligible foreground play time caps at `9999:59:59`; hidden, unfocused, paused,
  Help, loading and root-menu time do not advance it.
- Adventures starts at zero, increments on first Tiny Woods entry and fresh
  retries, caps at 99,999, and is unchanged by stairs/Continue.
- Saved kind distinguishes checkpoint, quicksave, completed and unknown legacy.
  Autosave never invents quicksave provenance.
- Continue shows Team, Name, Location, Play time, Adventures and Helper.
  Before team formation Team is `????`; Helper is `-----`, not the partner.
  Completed location wins over a retained dungeon object. Confirmation defaults
  to No; Yes alone resumes.
- Dungeon menus snapshot the same `playTimeText` value when built, with label
  at (139,156), value at (171,156), and an accessibility announcement. Time may
  advance behind the fixed menu snapshot. Missing legacy history stays Unknown.

Card geometry follows comparative Red `load_screen.c`; exact Blue placement,
pixels, wording and default-No identity remain qualified.

## Evidence and limits

These are optimistic checks, not cross-process transactions:
[HTML storage](https://html.spec.whatwg.org/multipage/webstorage.html) has no
atomic compare-and-swap across agent clusters. Simultaneous writers and changes
restoring identical bytes remain unproved; no lock/listener layer is claimed.

[The opening review](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md)
records sequential migration/stale-tab and progress/Continue observations.
[The immutable detailed record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-save-journal.md)
preserves candidate 12/25/26 timestamps, turn counts and limits.
Damaged-v2 handling, delete tombstones, quota failures and exact clock exclusion
were not fully manually accepted. Static inspection executes no game source.
