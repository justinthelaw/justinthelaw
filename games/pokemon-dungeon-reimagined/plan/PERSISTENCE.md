# Browser persistence (P08)

This package implements the save boundary and reusable application replacement
service. It is not wired into the startup shell. P12 still owns Adventure and
commands; P18 owns the real save/import/recovery UI; P19 supplies new-game state.
Full semantic content is mandatory. Missing policies return `content-blocked`,
never a successful header-only load or an invented campaign.

## Public boundary

Import runtime functions from `src/persistence/index.js`; JSDoc contracts live in
`src/persistence/contracts.js`, `repository.js` and `application.js`.

| API | Result and responsibility |
| --- | --- |
| `validateSave(state, content)` | Full P07 structural, graph, identity and semantic validation; immutable snapshot or fixed safe failure |
| `encodeSave(state, content, savedAt?)` | Validates, encodes canonical bytes and computes SHA-256; returns `{text,envelope,snapshot}` |
| `decodeSave(text, content)` | Bounds bytes before parsing, admits the closed envelope and validates the complete campaign and digest |
| `migrateSave(envelope)` | Explicit version routing only; version 1 is supported, other versions rejected. This is not semantic validation |
| `createIndexedDbAdapter(getFactory?)` | Browser `read`, generation-checked `write`/`remove`, idempotent `close` |
| `createSaveRepository({adapter,content,now?})` | Serial saves, same-epoch autosave coalescing, export, preparation, exclusive replacement scope and disposal |
| `createPersistenceService({repository,initial,getCurrent,bind,pause})` | Active binding ownership, command pause, application epochs, capture/confirmation/replacement guard and notifications |
| `notificationApplies(notification, context)` | Epoch and slot comparison for display |
| `notificationMarksSaved(notification, context)` | Successful save plus exact epoch, slot and revision comparison |

All fallible boundaries return `{ok:true,value}` or
`{ok:false,code,message}`. Messages are fixed display text; raw browser errors,
imported HTML and unbounded source diagnostics never enter them. `content-blocked`
means this build lacks required semantic rules; `content-mismatch` means another
content revision. Neither implies the player's file is corrupt.

## Envelope and byte format

The envelope has exactly `format`, `envelopeVersion`, `referenceEdition`,
`schemaVersion`, `contentRevision`, `revision`, `savedAt`, `state` and `integrity`.
The fixed values are `pokemon-dungeon-reimagined`, envelope version 1,
`blue-rescue-team`, and campaign schema 1. Header revision, content and edition
must equal the fully validated state. UTC timestamps have milliseconds and `Z`;
a save timestamp cannot precede campaign creation. Clock time is display
metadata, never turn timing, RNG, or write ordering.

The integrity object is exactly `{algorithm:'SHA-256',digest:<64 lowercase hex>}`.
Its input is the canonical UTF-8 JSON of every envelope field except integrity:
object keys sort lexicographically by UTF-16 code unit, arrays retain order,
scalars use ECMAScript JSON spelling, and no whitespace is emitted. Decoding
normalizes accepted input to this representation. SHA-256 detects accidental
corruption; anyone editing a save can recompute it. It provides no authenticity,
anti-cheating guarantee, or cartridge interoperability.

Encoded input is capped at **64 MiB before `JSON.parse`**. File import checks
`Blob.size` before file I/O and checks encoded text again before parsing. P07's
independent depth, node, array, object and cumulative-text limits still apply to
the entire state. These are engineering memory limits, not roster capacities.
The state is detached and deeply frozen before it can become a save candidate.
All canonical RNG streams, current sessions, entry histories, rescue escrow,
scene/result cursors and grant records are preserved without projecting or
replaying anything. Epochs and domain event counters are never imported.

There is no legacy startup-shell migration. Unsupported envelope/schema versions
are rejected without writing. A future migration must be explicit and followed
by full validation under its accepted content revision.

## One atomic browser record

IndexedDB database `pokemon-dungeon-reimagined:campaign:v1`, store `campaign`, key
`current` contains exactly `{generation,primary,backup}`. Both on-disk save values are
complete encoded envelopes or null. Adapter read/write/remove results use
`StorageRecord` with independent `Result<string|null>` slots: a non-string or
oversized envelope produces its own `invalid`/`too-large` result while retaining
the readable generation and the other slot. Rejected raw payloads are not
retained in these results or parsed. Outer framing or generation corruption
still fails the entire operation. The adapter owns all browser storage access;
the website's Zustand convention is unchanged.

A promotion first reads and validates the previous durable primary and backup
outside any readwrite transaction. It then uses one strict-durability readwrite
transaction to compare the expected generation and write the complete next
record. Only `transaction.oncomplete` reports success. Request success is
provisional. Request/transaction errors, abort, quota denial, blocked opening,
version change and disposal settle safely; a late blocked-open connection is
closed. No hashing, catalog calls, or unrelated awaited work runs inside the
transaction.

The previous valid primary becomes the backup. If primary is invalid, explicit
recovery/import retains the separately validated backup instead. Ordinary saves
refuse to erase a present unreadable primary, including non-string/oversized
payloads: the player must choose recovery or
replacement. Preparation never writes. Reset atomically writes a new generation
with two null envelopes; it retains a tombstone so reset cannot create a
compare-generation ABA race. Generation exhaustion fails closed.

The repository remembers its first observed/last committed generation. Ordinary
saves cannot silently adopt a generation written by another tab. A confirmed
load/replacement adopts the generation it validated. Concurrent writes additionally
compare generation inside IDB and fail with `conflict`; there is no automatic
retry with refreshed authority. An externally damaged record whose generation
cannot be read is rejected rather than bypassing the comparison. In contrast,
individually damaged envelopes do not block explicit reset when framing and
generation remain valid. A damaged backup also cannot prevent loading a fully
validated primary.

## Checkpoints and preparation

`repository.save(context,snapshot,guard,autosave=false)` captures committed
snapshots only. Domain composition calls it after every completed state-changing
transaction, including pending choices/scenes/results, never during partial
combat/reward effects or rejected commands. The application service captures the
snapshot and context synchronously and supplies the guard.

Writes serialize. A waiting autosave may replace an older waiting autosave only
for the same epoch and slot, retaining the highest revision. Superseded callers
resolve with `superseded`; they do not receive a fake durable success for a
snapshot that was never written. Manual saves are separate queue entries. The
queue holds at most 64 operations; excess calls return `busy`. Every queued call
settles on coalescing, invalidation or disposal. In-flight work settles through
the adapter. Unload callbacks are not a durability strategy.

`prepareLoad(guard)` returns independently validated primary and backup results
plus immutable status/preview models. The player sees timestamp, canonical
revision, team name and mode. Names must be rendered as text nodes. Backup is
never chosen silently. `prepareImport(text)` validates without storage writes;
`exportSave(snapshot)` encodes without opening browser storage. Existing
in-memory campaigns therefore remain playable and exportable after denied or
quota-limited saves. This package does not automatically switch an existing
campaign to a failed replacement.

## Application ownership and replacement

The service owns one binding `{adventureEpoch,slotId:'campaign',instance}`.
`getBinding()` is the sole authoritative active-instance lookup. Epochs and
notification IDs are fresh JavaScript symbols, application-owned and impossible
to obtain from JSON. There is only one current campaign, so independent campaign
slot selection is deliberately absent.

Integration contracts are mandatory:

- `getCurrent(instance)` synchronously returns that instance's immutable
  canonical snapshot. No callback may accept commands while paused.
- `bind(snapshot)` synchronously constructs a **new detached instance** whose
  `getCurrent` returns exactly the supplied frozen snapshot. It must not publish,
  mutate the old instance, dispatch commands, or return a promise. The service
  rejects reused instances, thenables, thrown constructors and snapshot mismatch
  before touching durable storage. It publishes the final pointer itself.
- Every command entry resolves `getBinding()` and checks `canAcceptCommands()`.
  The service flag is the command gate; input presentation alone is insufficient.
- `pause()` synchronously suspends external input and returns a nonthrowing
  synchronous release function. Release must not dispatch. A throwing release
  leaves the service paused. Observers consume results only after the returned
  promise settles; no observer runs inside the exclusive commit section.

`prepareLoad`, `prepareImport`, `prepareImportFile`, `prepareNewGame` and
`prepareReset` capture epoch, slot and source revision before asynchronous work.
Their immutable tokens carry a preview and `requiresConfirmation:true`; the
private WeakMap binds the exact token to its validated candidate and observed
storage generation. `cancelReplacement(token)` discards it.
`confirmReplacement(token,true)` is called only after explicit user confirmation
of that preview. Tokens are single-use. Passing a forged/consumed token or false
confirmation performs no replacement. A rejected operation never refreshes its
context or silently reuses confirmation.

Confirmation serializes through the application guard. It pauses commands,
invalidates waiting old saves, drains an in-flight save, rechecks all captured
fields, reads/validates both durable slots again, and compares the preview's
generation. Every asynchronous preparation step rechecks context. A command
accepted at N+1 while a request at N was preparing makes it stale. Two requests
at the same revision cannot both commit: the first rotates the epoch.

After detached instance construction and the final comparison, imports, recovery,
new game and reset commit storage atomically under the same pause. A normal load
has no storage write. Successful storage commit is followed by a synchronous
private binding-pointer swap and epoch rotation with no callback or intervening
await. A failed commit keeps the previous binding/save. Disposal during that final
commit window is deferred through the swap and cleanup; earlier disposal aborts
work. This prevents a durably committed replacement from being stranded between
two application bindings.

`save()`/`exportSave()` and confirmed replacements return
`{result,notification,status}`. For storage operations, the immutable notification keeps the original captured
context, even after a successful replacement. It cannot perform replacement.
Save outcomes never dispatch domain commands, advance revision, consume RNG,
spend a turn or roll back gameplay. `isCurrentRevisionSaved()` compares the
service's durable context with the current exact revision; a prior checkpoint
cannot label later progress saved. Integration may use the two notification
predicates to implement banners without accepting old-instance results.

## Explicit memory-only play

`prepareNewGame(snapshot,'memory')`, `prepareImport(text,'memory')` and
`prepareImportFile(file,'memory')` deliberately skip browser storage preparation.
They still fully validate content, bind confirmation to epoch/slot/revision,
invalidate/drain queued writes and construct/swap under the exclusive command
guard. The preview explicitly says the campaign is unsaved, the existing browser
save stays unchanged, and export is needed to keep a copy. Confirmation returns
`status:'unsaved'` and `notification:null`; it never reports storage success.

An initial nonnull binding is also treated as memory-only until explicitly loaded
or persisted. Memory-only autosave and Save calls return `memory-only`, preserving
the existing durable primary and backup. `preparePersistCurrent()` creates a new
revision-bound confirmation preview before replacing that durable slot. There is
no automatic fallback to memory-only after a storage error and no silent first
autosave that would erase the campaign the player chose to preserve. Export
remains independent of browser storage.

## Evidence and remaining acceptance

Static syntax, lint, strict JSDoc/type checks, source traces and independent review
are allowed; no automated test may import or execute this game source. The
implementation report records exact checks and adversarial trace paths. Actual
IndexedDB/device interruption, quota and file-picker observations remain part of
P18's human save/export/import/recovery acceptance. No browser save UI, playable
campaign, manual persistence acceptance, or full-game release is claimed here.
