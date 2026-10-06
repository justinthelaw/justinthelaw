# Lossless native campaign progression dependency

Status: implemented the bounded native state representation and pure supported
operations. This does not complete P07-B, the full CampaignContent adapter,
Task 3/4, opening scenes, playable campaign, manual acceptance or the full game.
No commit was made. Parent owns publication and independent review.

## Modified paths

Existing runtime files, preserving all preexisting staged changes:

- `games/pokemon-dungeon-reimagined/src/contracts/campaign.js`
- `games/pokemon-dungeon-reimagined/src/domain/state/schema.js`
- `games/pokemon-dungeon-reimagined/src/domain/state/validate.js`
- `games/pokemon-dungeon-reimagined/src/domain/state/create.js`

New bounded files:

- `games/pokemon-dungeon-reimagined/src/domain/progression/index.js`
- `games/pokemon-dungeon-reimagined/src/domain/progression/types.js`
- `games/pokemon-dungeon-reimagined/src/domain/progression/validation.js`
- `games/pokemon-dungeon-reimagined/src/domain/progression/support.js`
- `games/pokemon-dungeon-reimagined/src/domain/progression/evaluate.js`
- `games/pokemon-dungeon-reimagined/src/domain/progression/operations.js`
- `games/pokemon-dungeon-reimagined/plan/PROGRESSION-STATE.md`
- This report.

The contract's decision, source mapping and dependent interface self-check were
written before implementation. Parent explicitly authorized the minimal
`create.js` addition after identifying its required dependency. No shared ledger,
content/state adapter, tooling manifest, root README, launcher or unrelated WIP
was edited. No source files from the original game were copied into runtime.

## Implemented state and API

`ProgressState.native` is required. `InitialCampaignDefinition.nativeProgress`
is also required and copied into the initialized campaign without defaults.
The exact registry accepts eleven named MAIN/SUB1-SUB9/SELECT pairs, separate
CLEAR_COUNT/entry-frequency counters, persistent and pending flag arrays,
EVENT_S07E01 bits, all EVENT_GONBE cells, and eleven explicit scalar fields.

Source bounds are enforced independently of content callbacks: scenario bytes
0..255; CLEAR_COUNT 0..100; U16 entry frequency 0..65535; exactly 64 bits per
flag scope; sixteen EVENT_S07E01 bits; four signed-16 event cells; signed-8 and
signed-16 scalar ranges; unsigned-byte role projections; route -1 sentinel or
0..82. SELECT is never collapsed into a branch or quest. Source map/route/role
numbers never become authored runtime IDs implicitly.

`validateNativeProgress` safely copies and validates unknown data.
`evaluateNativePredicate` supports always, pair/chapter/scalar comparisons,
all/any/not with bounded local DAG memoization. Other predicate families return
explicit blocked requirements. Compound evaluation does not hide a missing
consumer behind a true OR or false AND branch. Native comparison preserves the
chapter-58 before/after exception, negative-step chapter matching, ge/le as
negations, and direct chapter-only comparison without the debug exception.

`projectNativeScalar` exposes all fifteen catalog projections. The sixteen-bit
sum and EVENT_GONBE[0] are derived from their full native arrays. Persistent flag
read APIs ignore pending bits, join catalog flags through exact source symbols,
handle the absent/255 read sentinel explicitly, and reject unsupported indices.
All 64 bits survive; the source's bit-31 Frosty Forest flag is intentionally not
compacted away just because the catalog only names 34 of the source flags.

`applyNativeOperations` returns a detached candidate or no candidate on failure.
Supported factual actions set scenario pairs, five scalar destinations, flags
and milestone acquisitions. Scenario assignment immediately evaluates the
catalog's six achievement rules in MAIN/SUB1/SUB9 hooks. Both changed-pair and
same-pair assignments preserve those achievement effects; only changed MAIN
pairs reset CLEAR_COUNT. Explicit catalog CLEAR_COUNT reset/set remains supported.

Additional typed native boundaries handle one increment per eligible-created
job reward receipt (cap 100), the four sourced return-frequency outcomes
(U16 increment/wrap), direct persistent/pending flag sets, clearing both scopes,
explicit post-weather boss-dispatch flush, and temporary-only clear. A flush
ORs all pending flags into persistent then clears pending. It never happens on
reads, ordinary saves, validation or generic operation completion.

Candidates include required milestone IDs and reward receipts. The owner must
integrate them with existing once-only histories, retain old milestone metadata,
assign new revision/day metadata, and validate the whole campaign transaction.
This helper does not grant rewards, create their authority, skip a callback,
advance a day, stage a scene, settle an expedition or commit state. Duplicate
grant receipts are rejected within the batch; existing-history replay protection
remains with the transaction owner. `require-callback` always blocks here.

## Source trace and source-integrity discrepancy

Read the authorized brief, root and nested AGENTS, PLAN authority, prior adapter
report, CAMPAIGN-CATALOG, CAMPAIGN-STATE, accepted RULES-BROWSER-CONTRACT and the
specific factual campaign model/contracts/predicates/transitions/identities/types.
Original comparative evidence remains qualified, not a Blue-binary parity claim.

For storage widths absent from the normalized catalog, retrieved specific files
through GitHub at `pret/pmd-red` commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85`. The supplementary sources establish
integer widths, array sizes, source flag positions and actual U16 increment
behavior. The detailed contract records exact source URLs, observed whole-file
SHA-256 hashes, byte counts and independently verified Git blob IDs.

Observed whole-file bytes differ from four historical catalog source hashes.
UTF-8 and base64 retrievals agree, and SHA-1 of Git blob header plus complete
bytes matches every returned Git blob ID. CRLF conversion, final-newline
addition/removal and stripping line trailing whitespace do not explain the
historical hashes. The checked-in normalizer copies those old hashes unchanged
from unavailable `sourceArtifacts` research input; no transformation is documented
there. An older/different extraction is a possibility, not an established cause.
Parent was notified during work. Catalog manifests/fingerprints were preserved.
This discrepancy remains a source-provenance review requirement even though
observed relevant semantics corroborate the catalog's model.

Existing independent campaign checks verify checked-in resource/schema/hash
parity and internal source-reference joins; they do not establish parity between
those historical source hashes and newly retrieved upstream file bytes.

## Static verification

From `tools/pokemon-dungeon/`:

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 172 authored files, static module-path review |
| `npm run typecheck` | Passed; 96 authored source files, strict JSDoc |
| `npm run campaign:check` | Passed; 1,011 closed predicates, 586 ordered transitions, six job gates, 21 unlock rules, 83 routes, 26 bosses and 18 recruitment flags |
| `git diff --check` | Passed on shared tracked diff; new module formatting covered by lint |

A read-only Python review parsed the schema's object literal as JSON and compared
it to factual data: eleven exact scenario names; both required state/profile
references; four event cells; all 34 source-symbol flag joins including the bit-31
gap; all fifteen scalar projections; every catalog scalar assignment and pair
assignment within sourced bounds. It executed no game code. The first version of
that review over-read trailing JS after the literal; using JSON raw decoding of
only the literal resolved the review-script parsing issue.

No game imports, behavioral unit tests, simulations, playthroughs or source
scripts were executed. Root flight-check/manual presentation acceptance are
outside this bounded game-only task and remain with the parent. No new tooling
or game-test jobs were added.

## Self-review and remaining requirements

- Traced zero/full/edge bounds and signed native scalar values. They bypass the
  old generic unsigned `Int` rule only through explicit native fields plus their
  dedicated source-bound validation. No existing generic validation was relaxed.
- Traced MAIN same pair, either-component changes, independent SUB/SELECT writes,
  repeated achievements, reward increments at cap, per-receipt counting and
  U16 frequency wrap. Cumulative jobs/days/expeditions remain separate.
- Traced pending-only reads, pending flush, persistent writes, two-scope unset,
  temporary clear, missing flag identities and the noncatalog flag gap.
- Traced failed later batch operations: original input stays untouched and no
  candidate escapes. Catalog disposal/missing lookups block. Unknown callbacks,
  malformed/unknown operations and unsupported scalar destinations cannot
  silently succeed. Requirement strings are bounded.
- Preserved complete campaign graph, identity, semantic-policy, ownership,
  scheduler, RNG, save, schema-version and content-revision validation paths.
  Existing progress policy remains mandatory; no always-pass policy was added.
- The schema refinement intentionally rejects old missing-native schema-1
  structures. There is no migration, compatibility claim or inferred native
  opening state.

Required next work: whole-campaign progress semantics and native-to-authored
branch/story/map/scalar consistency; per-route first-entry history and routing;
actual job reward acknowledgements with once-only grant integration; boss
boundary ownership; external predicate consumers; dungeon/training state,
scene/population/map/route actions; opening profile, catalog revision and all
other required CampaignContent policies. Provenance review must reconcile the
historical source hash mismatch. These requirements do not shrink the complete
Blue campaign/postgame scope or justify substituting a demo.
