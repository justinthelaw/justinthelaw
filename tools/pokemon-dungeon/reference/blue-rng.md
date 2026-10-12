# Blue opening random-state boundary

Status: source-qualified browser implementation. This does not claim a complete
Blue Rescue Team RNG schedule or cartridge-seed replay.

## Sources

- [AntyMew's Blue TAS research, post 430977](https://tasvideos.org/Forum/Posts/430977)
  identifies Blue's `state = state * 0x5D588B65 + 1` family, a frame/input-owned
  global stream, an initial dungeon seed, and a separate in-dungeon stream.
- Comparative Red source is pinned to
  [`013475aa04f5be3191e5527c186d9bfceae7cae0`](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
  `src/random.c` owns the global generator. `src/run_dungeon.c` transfers the
  initial preseed and starts fresh floors. `src/dungeon_random.c` owns the
  dungeon preseed, floor seed and live draws. Red is comparative evidence, not
  a verified Blue executable.

## Accepted random-state model

- New adventures use the native-family 32-bit LCG core with multiplier
  `0x5D588B65` and increment one. Initial preseed admission forces odd and masks
  to 24 bits.
- A fresh floor advances the preseed twice. The complete second 32-bit result is
  retained as the next preseed; the combined returned floor seed is masked to
  24 bits and forced odd. Live dungeon draws then advance their own 32-bit
  state once per admitted browser draw.
- Historical saves keep their exact `xoshiro128ss-v1` bytes, validation and
  transition sequence. Their random records are not converted or reseeded by floor entry.
- Explicit numeric seeds preserve the prior unsigned coercion. Explicit arrays
  must have exactly four present uint32 entries and cannot be all zero; sparse,
  undefined, short, long and malformed arrays fail before their first word can
  seed a new stream. Default seeding remains browser-owned.

## Lifecycle and limits

- Only fresh-floor generation advances the stored dungeon preseed. Reload and
  Continue restore the saved live state. Browser retry calls fresh-floor
  generation and therefore advances its stored preseed again.
- Quicksave preserves the selected algorithm record. The version-two journal isolates it
  from cached older builds and copies a valid prior opening checkpoint while
  preserving its original bytes. See [save ownership](blue-save-journal.md).
  Candidate 12's manual migration and stale-tab checks passed; a fresh
  new-adventure rescue trial remains in progress.
- The browser does not reproduce Blue's frame/input global RNG, original seed
  history, complete initialization/gameplay call schedule, tutorial retry seed
  provenance or verified quicksave internals. Connectivity repair and compact
  autonomous behavior also consume adapted draws. Exact replay remains outside
  the supported boundary.
