# Native campaign progression state

## Decision before implementation

Add required `progress.native` (`NativeProgressState`) and required
`InitialCampaignDefinition.nativeProgress`. No zero-filled new-game fallback,
load repair, migration or save compatibility claim is introduced. This is an
unpublished schema-1 refinement. Existing story nodes, branch histories,
milestones, dungeon clears and grant histories retain their responsibilities.

The native record preserves all eleven explicit scenario pairs (MAIN, SUB1-SUB9,
SELECT), CLEAR_COUNT, entry frequency, 64 persistent and 64 pending cutscene bits,
signed/unsigned scalar storage, all sixteen EVENT_S07E01 bits and all four
EVENT_GONBE cells. The sum and first-cell projections are derived on read so they
cannot drift. SELECT remains a continuation pair, not an independent quest.
Native indices never masquerade as authored dungeon/map/species identities.

Pure evaluation supports structured factual always/scenario/chapter/scalar and
boolean composition predicates. Missing external predicate consumers remain
explicit requirements, including in compound predicates. Operations return a
detached candidate plus required milestone acquisitions; they never commit a
campaign, dispatch callbacks, run scene scripts, allocate identities or advance
a day. A failed operation batch exposes no partial candidate. The campaign owner
must merge milestone acquisitions with revision/day metadata, apply acknowledged
job grant history, and validate the whole transaction before a commit.

## Source mapping and bounds

All original engine details here retain `original-red-comparative` confidence;
the target is original Blue. No Blue binary parity or cartridge compatibility is
claimed. Facts are newly implemented from behavior, without copying source code.
Pinned source revision: `pret/pmd-red` at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`.

| Native fact | Representation and source |
| --- | --- |
| MAIN, SUB1-SUB9, SELECT | Named `{chapter,step}` pairs, each component 0-255; campaign model plus `src/script_vars_info.c:gScriptVarInfo` U8 arrays of length 2 |
| CLEAR_COUNT | Integer 0-100; model reward unit/cap and reset contract; source U8 storage; never cumulative `statistics.jobsCompleted` |
| Entry frequency | Integer 0-65535; `gScriptVarInfo` U16; `src/ground_main.c` won/mode-10/mode-11/lost increment through U16 setter, wrapping 65535 to 0 |
| Persistent/pending flags | Exactly 64 booleans each; `include/constants/cutscenes.h:NUM_CUTSCENE_FLAGS`, `src/exclusive_pokemon.c`; unnamed/reserved bits preserved, 255 read sentinel false |
| EVENT_S07E01 | Exactly sixteen booleans; `gScriptVarInfo` BIT array; projection counts set bits |
| EVENT_GONBE | Exactly four signed 16-bit cells; first-cell projection does not discard other cells |
| BASE_LEVEL, WARP_LOCK, FLAG_KIND, FLAG_KIND_CHANGE_REQUEST | Signed 8-bit values (-128..127), storage bounds rather than guessed narrative legality |
| GROUND_GETOUT, EVENT_LOCAL | Signed 16-bit values (-32768..32767); source namespace, not authored map membership |
| DUNGEON_ENTER, DUNGEON_ENTER_INDEX | -1 sentinel or native route 0..82; catalog's 83-route namespace, includes excluded/wrapper identities without making them enterable |
| PARTNER1_KIND, PARTNER2_KIND | Unsigned 8-bit native role projections; not species IDs |
| SCRIPT_MODE | Explicit boolean projection (`GetScriptVarValue` SPECIAL returns `GetScriptMode()!=FALSE`), never inferred from canonical campaign mode |

`content/campaign/model.json`, `contracts.json`, `predicates.json`,
`transitions.json`, and `identities.json` remain immutable factual authority.
Catalog evidence `evidence-2f3d9d492d4da5e0` covers scenario comparisons and
assignment; `evidence-b0b0e6d05b8664b4` covers flag lifecycle. Supplementary pinned
source reads resolve field widths; existing sources already fingerprint
`src/script_vars_info.c`, `src/event_flag.c`, `src/ground_main.c` and
`src/exclusive_pokemon.c`.

## Interface and integration self-check

The exact structural registry and contract change together. Native bounds are
checked before trusted content callbacks, alongside existing structural/graph
checks. Existing required `progress` policy remains mandatory for narrative
legality, branch/milestone consistency and boundary/idempotency rules. Ownership,
scheduler, RNG, scene, save and all other policy checks remain unchanged.
`createCampaign` copies explicitly provided native facts and validates them.
Missing native fields reject old unpublished snapshots; no migration is invented.

Only structured catalog operations with independently supported semantics are
accepted. Scene/population, callbacks, dungeon flags, training completion, route
entry and ground-map changes require their domain owners. This dependency is not
a complete CampaignContent, scene engine, opening profile or playable campaign.

## Implemented public API

Import from `src/domain/progression/index.js`.

| API | Result and boundary |
| --- | --- |
| `validateNativeProgress(unknown)` | Detached native data, or typed invalid diagnostics; exact fields and bounded indices, never narrative approval |
| `evaluateNativePredicate(input,catalog,predicateId)` | Ready boolean, blocked requirement IDs, or invalid input; maximum 4,096 graph visits and depth 128; local memoization only |
| `projectNativeScalar(validatedNative,variableId)` | Finite fifteen-variable projection; unknown names block, never zero |
| `compareNativeScenario(validatedPair,comparison,chapter,step)` | Typed low-level comparison of sourced operands; negative target step ignores step, chapter 58 disables before/after, ge/le negate those results |
| `readPersistentFlag(validatedNative,catalog,flagId)` | Catalog-to-native flag crosswalk; null absent-flag sentinel false, unknown flag lookup blocked |
| `readPersistentFlagIndex(validatedNative,index)` | Only native 0..63 or the 255 read sentinel; pending scope is not consulted |
| `applyNativeOperations(input,catalog,operations)` | Up to 512 ordered operations, returning an isolated candidate or no candidate on failure |

Supported catalog actions: `set-scenario`, `set-scalar` for the five variables
actually written by this catalog, `set-flag`, and `set-milestone`. MAIN/SUB1/SUB9
assignments evaluate their dedicated factual achievement hooks immediately,
including same-pair writes, and return each required milestone acquisition once.
These are required transaction effects, not a claim that native pairs alone
satisfy the entire ScenarioCalc boundary. Existing acquired milestone metadata
must be preserved; absent milestones receive the committing revision and day.

Additional bounded operations represent native lifecycle facts:

- `completed-job-reward` consumes a trusted `eligible-job-reward-created` receipt
  identifying the job and grant. The jobs owner must first establish eligibility,
  create the reward successfully, and reject already-applied grants. This pure
  helper rejects duplicate grants within its batch, increments once per receipt,
  caps at 100, and returns the receipts for atomic grant-history integration.
  It neither calls a reward consumer nor treats missing callbacks as success.
- `record-return-frequency` accepts only won/mode-10/mode-11/lost. Its U16 wrap
  is sourced storage behavior. It does not advance the narrative day or update
  per-route first-entry history; those are different facts and responsibilities.
- `write-cutscene-flag` sets pending or persistent bits; false requires `both`
  and clears both scopes. Catalog `set-flag` uses the same rule.
- `flush-pending-flags` requires the explicit
  `boss-dispatch-after-weather-clear` boundary. The future boss consumer must
  finish its ordered selection, mark cutscene mode and clear weather first.
  Flush ORs all 64 pending bits into persistent and clears pending. Saving,
  predicate reads and ordinary candidate construction never flush implicitly.
- `clear-pending-flags` represents the independently sourced temporary clear;
  it does not clear persistent flags or itself establish a permitted scene/day
  boundary. The required campaign policy retains that responsibility.

Direct projection/flag/comparison readers take already validated typed data;
public unknown-state evaluation and mutation entry points validate and copy it.
No reader inspects arbitrary source text. External item/area/roster ownership,
return-outcome and callback predicates stay typed requirements. Unknown actions,
including scene/population/dungeon/training/map/route operations, cannot become
no-ops. No callback receipt is accepted to bypass `require-callback` actions.

## Supplementary source integrity record

On 2026-10-06, GitHub `fetch_file` at the pinned revision returned identical
UTF-8 and base64 bytes for the following files. Their observed SHA-256 values
are recorded separately. For files already listed in the factual catalog, these
values differ from that catalog's historical fingerprints; the cause is not
established. Those historical manifests were not changed. The supplementary
reads support the specifically identified width/index facts and corroborate
existing semantics, but do not establish fingerprint parity with earlier
research artifacts. This discrepancy requires source-provenance reconciliation.

| Pinned path | Observed SHA-256 |
| --- | --- |
| `src/script_vars_info.c` | `e68b36e69287694f2b7978e77ed07ee86efbe54bdd6f41a3ff130beebe433dca` |
| `src/event_flag.c` | `1726f2e121b7f15a1ab4f2a30c2a0b45ebe088364cb37e01d9bbdbeae42c7f5e` |
| `src/ground_main.c` | `4f782dae4947be39c34b0230360382d0cc13540926570531231b96a37585b411` |
| `src/exclusive_pokemon.c` | `ee3d2acf14425d4e20c82e151de7dcde0881e929175c528b1b77814eb16a8241` |
| `include/constants/cutscenes.h` | `896bfcd42e619f4ac11305b1484e3fc94185011a38bb46992c5a407f8ef5e650` |

The 34 catalog flag identities are mapped by their exact native enum symbols.
The source's Frosty Forest intruded flag at bit 31 is absent from that subset;
it and unnamed bits remain serializable, preventing index compaction or loss.
Scenario pair changes never rewrite canonical authored branch nodes. A future
progress policy must supply the actual scene/node/domain crosswalk rather than
infer it from numeric chapter values. SCRIPT_MODE and native ground-map facts
also need their owning consumer's consistency checks.

The observed hashes above cover complete base64-decoded GitHub repository file
bytes, without a transformation. Git blob identities were independently verified
as SHA-1 of `blob <byte-length>\0` plus those bytes:

| Path | Bytes | Verified Git blob |
| --- | ---: | --- |
| `src/script_vars_info.c` | 7378 | `afdf6e56505de6b0831ae9a2acd92092b9cfc16c` |
| `src/event_flag.c` | 28316 | `73675e3c8ae94304d2259fb97dc8901d9cfa499a` |
| `src/ground_main.c` | 26825 | `1dea799868772c623aaca64538369750eafcfe36` |
| `src/exclusive_pokemon.c` | 4856 | `f0d5144c596e7a1e5bd9fef7ec05c7705880ac9a` |
| `include/constants/cutscenes.h` | 4302 | `b2c36aebbd4fe4d0436cb1f5f15a4f21ba058924` |

Historical campaign normalization copies `sourceArtifacts[].sha256` from the
unavailable research input; it does not document a source-text transformation.
CRLF conversion, removing/adding the final newline, and stripping line trailing
whitespace did not reproduce any of the four historical file hashes. An older
or transformed extraction remains a possibility, not an established explanation.
Exact source URLs use the commit above and these paths:

- [Storage declarations](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/script_vars_info.c)
- [Scenario and native scalar semantics](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/event_flag.c)
- [Return-frequency boundary](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/ground_main.c)
- [Flag lifecycle](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/exclusive_pokemon.c)
- [Flag indices and sentinel](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/include/constants/cutscenes.h)
