# Task 1 report: atomic persistence and guarded application binding

## Scope and status

Implemented P08 in `games/pokemon-dungeon-reimagined/src/persistence/` and the
consumer contract in `plan/PERSISTENCE.md`. No bootstrap/main/UI/input/domain or
shared ledger files changed by this task. Existing root/game AGENTS already
permit the isolated browser-storage adapter; no additional exception needed.
No game module was imported, executed, instrumented, or driven by automation.
No save UI, playable campaign, manual browser acceptance or release is claimed.

## Exact APIs

Public barrel `src/persistence/index.js` exports:

- `MAX_SAVE_BYTES = 64 * 1024 * 1024`.
- `validateSave(state, content)` => `Result<CampaignSnapshot>` through full P07.
- `encodeSave(state, content, savedAt?)` and `decodeSave(text, content)` =>
  `Promise<Result<EncodedSave>>`; encoded save is frozen `{text,envelope,snapshot}`.
- `migrateSave(envelope)` => closed version-1 routing admission, explicitly not
  whole-save validation. No historical shell migration.
- `createIndexedDbAdapter(getFactory?)` => typed `read()`,
  `write(expectedGeneration,candidate,guard)`, `remove(expectedGeneration,guard)`,
  `close()`. Read/write/remove return `Promise<Result<StorageRecord>>`.
- `createSaveRepository({adapter,content,now?})` =>
  `save(context,snapshot,guard,autosave=false)`, `prepareLoad(guard)`,
  `prepareImport(text)`, `exportSave(snapshot)`, `exclusive(action)`, `dispose()`.
- `createPersistenceService({repository,initial,getCurrent,bind,pause})` =>
  `getBinding()`, `getContext()`, `canAcceptCommands()`,
  `isCurrentRevisionSaved()`, `save(autosave=false)`, `exportSave()`,
  `prepareLoad()`, `prepareImport(text,storageMode='durable')`,
  `prepareImportFile(blob,storageMode='durable')`,
  `prepareNewGame(snapshot,storageMode='durable')`, `preparePersistCurrent()`,
  `prepareReset()`, `confirmReplacement(token,confirmed)`,
  `cancelReplacement(token)`, `dispose()`.
- `notificationApplies(notification,current)` and
  `notificationMarksSaved(notification,current)`.

The exclusive repository scope has `prepareLoad(guard)`,
`commit(save,loaded,guard)`, `reset(generation,guard)`, and
`acceptLoad(generation,guard)`; every scope closes when its callback returns.
These are application internals, not domain APIs. The service is the repository's
sole active owner; consumers dispose through the service, never close its adapter
independently during replacement.

Application results are `{result,notification,status}`. Ordinary storage results
use status `complete`/`failed`; confirmed memory-only replacement uses
`status:'unsaved',notification:null`. Preview tokens are immutable, identity-bound
in a private WeakMap, single-use and carry original epoch/slot/revision plus safe
confirmation text. Both epoch and notification IDs are fresh nonserialized symbols.

## Binding contract ruling

Arbitrary post-storage publication callbacks cannot guarantee atomicity if they
mutate external state and then throw. The controller accepted a service-owned
binding cell instead: `bind` constructs a NEW detached instance synchronously
before any storage commit, returns no promise, cannot publish or mutate old state,
and `getCurrent(candidate)` must be the exact supplied frozen snapshot. Failure,
reuse, thenables and mismatch reject before writing. After commit the service swaps
its private pointer and epoch synchronously without invoking any callback.

All command entry must check `canAcceptCommands()` and resolve `getBinding()`.
`pause`/release synchronously suspend/resume external input and never dispatch.
No observer is invoked inside the guard. A faulty release leaves commands paused.
Disposal before commit cancels; disposal during final commit is deferred through
binding swap and cleanup. No second mutable domain owner was introduced.

## Static adversarial traces

| Case | Exact source path and result |
| --- | --- |
| >64 MiB file | `prepareImportFile` checks Blob.size before `text`; `decodeSave` independently checks UTF-8 size before JSON.parse. No storage/binding changes |
| Malformed JSON, deep/cyclic/unsafe state, accessors, sparse arrays | Decoder parses bounded text then `validateSave -> validateCampaign`; P07 rejects full structural boundary. Encoder uses same whole-campaign path |
| Unknown envelope/header field or imported epoch | `migrateSave -> exactRecord` rejects the closed root; no extensions or imported epoch accepted |
| Unsupported schema/edition/version/content | Migration rejects unsupported headers; full P07 plus envelope/state consistency rejects content mismatch. No guessed migration |
| Missing semantic catalogs | `validateSave` returns content-blocked from P07's required identity and policy interface. Header/hash success cannot bypass it |
| Wrong revision/time/hash | Header fields must equal snapshot; savedAt is canonical UTC and >= createdAt. Recomputed canonical SHA-256 must match. It is corruption detection, not authenticity |
| RNG/cursor/grant preservation | Codec canonicalizes the complete frozen state, not a projection. Domain state is never dispatched, rerolled or replayed |
| Primary corruption plus valid backup | `prepareLoad` decodes each independently. Ordinary write refuses unreadable primary. Explicit backup recovery chooses validated backup; `commit` never copies corrupt primary into backup |
| Both saves corrupt | View exposes both failures, no silent reset. Explicit revision/generation-bound reset or a fully validated replacement is needed |
| Quota/security/blocked open | Adapter returns fixed failure. Existing in-memory binding stays live; export never opens IDB. Blocked requests settle and late connections close |
| Request put succeeds then transaction aborts | Result remains provisional. Only `oncomplete` resolves success; onabort returns failure and IDB preserves old atomic record |
| Version change/disposal during IDB use | `closeWith` aborts tracked transactions, closes connection and settles pending open; idempotent repeated close is safe |
| Concurrent writes/tabs | `transact` rereads generation inside one strict readwrite transaction. Mismatch rejects. Repository's knownGeneration prevents subsequent old-tab saves adopting another tab's newer generation |
| Reset then old write | Reset writes an incremented tombstone, not key deletion. Old expected generation cannot pass after reset |
| Waiting autosaves N, N+1, N+2 | Same epoch/slot queue retains newest; replaced callers resolve superseded. Running save settles, manual entries remain distinct, queue capacity is bounded |
| Revision N save completes after command N+1 | Save guard allows older committed snapshot from same epoch. `isCurrentRevisionSaved` and notificationMarksSaved require exact current revision; no false saved marker |
| Equal revision across different campaigns | Fresh symbol epoch differs. Notification predicates reject old binding even when revision number equals |
| Import/load begins at N, command reaches N+1 during hashing/read/file I/O | Context rechecks after every asynchronous preparation step and under guard reject stale candidate before binding or writing |
| Two confirmations from same revision | Transition promise serializes; first rotates epoch; second fails original-context guard. Tokens cannot refresh their context |
| Already-running old checkpoint when replacing | `exclusive` sets write hold, invalidates waiting requests and drains running work. Replacement checks context and rereads validated generation after drain; changed generation causes conflict/reconfirmation |
| Bind throws/returns promise/reuses instance | Detached construction checked before commit. Old pointer and durable save survive unchanged |
| Successful durable import/recovery/new game | Exclusive pause lasts through CAS commit; next binding/epoch allocated beforehand; private pointer assignment is synchronous afterward; original-context notification delivered only after release |
| Load with no write | Full read/validation and context guard still apply; accepted generation adopted then pointer/epoch rotate synchronously |
| Disposal between commit and promise continuation | `committing` causes disposal request to defer close. Guard remains stable, pointer swap completes, finally disposes. No successful durable commit is stranded between bindings |
| Explicit memory-only import/new game | Full encode/decode semantic validation; token clearly discloses unsaved status; repository drains prior writes but never reads/writes for this replacement; guarded swap yields unsaved/null notification |
| Autosave following memory-only replacement | `memoryOnly` blocks both auto/manual save. Existing durable data stays untouched until a separately confirmed preparePersistCurrent token commits |
| Storage conflict for current campaign | Failed save clears service's remembered durable marker; it cannot label current progress saved after a known foreign writer |
| Reset leaves title with no campaign | Both stored envelopes become null, new epoch has null instance. isCurrentRevisionSaved returns false for null revision |
| Disposal with queued operations | Repository resolves queued calls disposed; running adapter settles, chained confirmations check disposed. No caller's queued save promise is dropped |

## Validation evidence

- `PATH=/tmp/pokemon-tool-bin:$PATH npm --prefix tools/pokemon-dungeon run check`
  passed for the initial 45-module P08 implementation: source lint/path checks,
  strict types, all content/species/rule/dungeon/effect/coverage checks, historical
  asset and current pixel production audits, and byte-exact vendor checks. This
  preceded final memory-only edits and concurrent P10 files.
- Final focused strict type check uses `/tmp/pokemon-p08-tsconfig.json`, extending
  the unchanged independent tsconfig and including `src/persistence/**/*.js` plus
  transitive imports. `node tools/pokemon-dungeon/node_modules/typescript/lib/tsc.js
  -p /tmp/pokemon-p08-tsconfig.json` passed with no diagnostics. It parses/types
  source only.
- Final source lint and both scoped pre-commit hook stages passed. Push-stage
  website ESLint skipped by file scope; no root website files belong to P08.
- A concurrent full-check rerun reached typecheck and reported only new
  `src/presentation/projection.js` branded-ID/DeepReadonly errors. Controller
  notified; P08 focused check passed. A subsequent shared lint also encountered
  concurrent rendering/assets.js globals `crypto`/`createImageBitmap`; the explicit
  seven-file P08 ESLint invocation passed. Record later full rerun below if resolved.
- No automated game-source tests or manual IndexedDB/browser interactions were
  performed. Controller owns the required website flight-check and integration
  review for the shared branch.

## Remaining consumers/gates

P12 must implement actual Adventure behavior and preserve the exact snapshot
getter/command gate contract. P18 must render safe text previews, explicit
confirmation, unsaved/saving/error status, export download, and backup choice.
P19 supplies the real sourced initial campaign. Content policies currently missing
remain named blocks. Human browser/device interruption/quota/import checks and the
full-game release gate remain open. Root README unchanged.

## Scoped commit

`75eec6f` — `feat(game): add atomic campaign persistence and guarded binding`.
Exactly eight P08 files committed; no unrelated paths staged. Index released to
controller. Independent review and its fixes remain separate evidence.

## Independent review repair: per-slot storage admission

Review `.superpowers/sdd/persistence-plan/task-1-review.md` found one P2: an
oversized/non-string envelope made the adapter reject the entire record, hiding
a valid sibling and preventing confirmed reset. Verified the source path and
separated outer framing/generation admission from payload admission.

The on-disk format remains exactly `{generation,primary,backup}` with raw encoded
strings/null. The adapter's public `StorageRecord` now has independent
`StorageSlot = Result<string|null>` values. `indexeddb.slot` returns immutable
`invalid` or `too-large` failures without retaining/parsing rejected raw data;
`record` preserves a readable generation and sibling slot. `repository.decodeSlot`
propagates those bounded failures and invokes the full codec only for an admitted
string. `StorageCandidate` remains raw strings/null, so failures can never be
written as envelopes. Successful transaction completion returns the same admitted
record shape as read. No schema version/migration change is necessary because the
durable format did not change.

Fresh static source traces:

| Stored case | Result |
| --- | --- |
| Valid generation, oversized primary, valid backup | Adapter yields primary `too-large` plus admitted backup; repository decodes only backup; application exposes explicit backup token. Confirmed recovery rechecks context and generation; commit retains the validated backup and never copies oversized primary |
| Valid generation, numeric/object primary, valid backup | Primary becomes `invalid` rather than empty; ordinary save refuses it. Backup recovery follows the same validated path |
| Valid primary, oversized/non-string backup | Primary is decoded/admitted independently; Continue can load it under the normal guard. A future successful save backs up that valid primary rather than the damaged sibling |
| Both envelopes independently invalid/too-large | Preparation returns both unavailable slot views and readable generation. `prepareReset` can create a revision-bound token; confirm rereads then `remove` compares generation and writes a two-null tombstone atomically |
| Present invalid primary during ordinary autosave | Existing `writeJob` rejection remains: only `empty` admits an absent primary. No automatic repair, fallback, or overwrite |
| Missing/extra outer fields or unsafe/unreadable generation | `record` still returns `storage-corrupt`. Read, recovery and reset cannot bypass compare-generation authority |
| Concurrent generation change after reset/recovery preview | Existing transaction CAS still rejects; per-slot admission does not refresh captured confirmation or expected generation |

Verification after repair: focused strict TypeScript/JSDoc check passed with no
diagnostics; scoped seven-file ESLint passed; both scoped pre-commit stages and
`git diff --check` passed. No game source imported/executed and no browser tests
run. Changed only `contracts.js`, `indexeddb.js`, `repository.js` and
`plan/PERSISTENCE.md`. Report written before the scoped repair commit.

Repair committed as `7d9f1a6` — `fix(game): preserve recovery across damaged save
slots`. Exactly four reviewed P08 paths committed; index released clean for the
controller. Independent re-review remains to confirm the P2 closure.
