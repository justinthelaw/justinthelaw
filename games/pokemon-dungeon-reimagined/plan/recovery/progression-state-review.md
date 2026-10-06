# Independent progression-state review

Date: 2026-10-06. Scope: the new `src/domain/progression/**` implementation,
unstaged changes to `src/contracts/campaign.js` and `src/domain/state/{create,schema,validate}.js`,
and the narrow `plan/PROGRESSION-STATE.md` contract in PR #392.
Paths below are relative to `games/pokemon-dungeon-reimagined/` unless stated otherwise.
In the trace table, `progression/` and `state/` abbreviate
`src/domain/progression/` and `src/domain/state/` respectively.
The previously staged recovery is context only, not reaccepted by this review.

## Verdicts

- **Spec: pass for this bounded dependency.** The implementation supplies the
  lossless native facts and supported pure operations described in its brief.
  Missing domain behavior remains an explicit requirement. It does not purport
  to complete CampaignContent, P07-B, Task 3/4, or the full campaign.
- **Quality: pass for this bounded dependency.** No actionable correctness,
  ownership, validation, or maintainability defect was identified in the reviewed
  changes. Independent static checks passed. This is not behavioral test,
  manual-play, full-game, release, merge, or deployment acceptance.
- **Source qualification remains open:** the historical source fingerprint
  discrepancy is disclosed accurately. Acceptance here covers implementation
  against the specifically identified comparative facts, not historical-source
  fingerprint parity or Blue-binary equivalence.

## Findings

No P0, P1, P2, or P3 implementation finding.

One existing evidence limitation remains for tracking; it is not presented as
an undiscovered implementation defect:

| Severity | Location | Evidence and disposition |
| --- | --- | --- |
| Informational; provenance follow-up required | `plan/PROGRESSION-STATE.md:125-132,150-166` | Newly retrieved pinned file identities and historical catalog SHA-256 metadata do not have established parity. The contract explicitly states the discrepancy, preserves historical fingerprints, limits the supplementary evidence to identified facts, and leaves reconciliation open. Do not change fingerprints merely to make a check pass or claim that the catalog checker resolves this discrepancy. |

## Reviewed evidence

Read the parent/game AGENTS instructions, implementation brief and report,
PLAN authority/scope, progression contract, factual model/contracts, relevant
predicate and transition data, the new modules, and the exact unstaged diff.
Read existing plain-data, structural, policy, and catalog code only as necessary
to establish the integration boundary.

Fresh GitHub connector reads used `pret/pmd-red` commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85` for:

- `src/script_vars_info.c`: unsigned-byte scenario arrays, signed/unsigned scalar
  widths, U16 frequency, sixteen event bits, and four S16 EVENT_GONBE cells.
- `src/event_flag.c`: scalar special projection, numeric storage setters,
  `ScenarioCalc` at lines 450-494, and before/equal/after at lines 497-549.
- `src/exclusive_pokemon.c`: pending/persistent writes, OR-and-clear flush,
  two-scope unset, pending-only clear, persistent reads, and bounds.
- `include/constants/cutscenes.h`: enum order, bit-31 gap, 64 meaningful cutscene
  positions, and the 255 invalid sentinel.
- `src/ground_main.c`: lines 216-225 increment the frequency for won, mode 10,
  mode 11, and lost returns. Combined with the U16 setter, this supports the
  explicit 65535-to-0 wrap.

The Git blob SHA metadata returned on these independent reads matches the five
blob identities recorded in the contract. This reviewer did not repeat the
implementer's base64/UTF-8 equivalence or historical-normalization experiments.
The source is comparative Red evidence with existing NDS annotations; this
review adds no independent Blue-binary parity claim.

## Spec and implementation trace

| Requirement | Evidence and assessment |
| --- | --- |
| Lossless named scenario pairs | `src/contracts/campaign.js:1078-1096`, `src/domain/state/schema.js:7-156`: required MAIN, SUB1-SUB9, SELECT objects, each retaining chapter and step. Exact structural checking rejects missing/extra names. No numeric chapter-to-authored-branch inference. |
| Counter separation and native bounds | `progression/validation.js:15-31`: byte pair components, CLEAR_COUNT 0..100, U16 frequency, 64 flags per scope, sixteen event bits, four signed event cells, explicit signed scalar widths, unsigned role bytes, route -1/0..82. Generic unsigned Int validation was not relaxed. |
| Same-pair versus changed-pair writes | `progression/operations.js:92-98`: either changed MAIN component resets CLEAR_COUNT; same MAIN preserves it; SUB/SELECT do not reset it. Assignment still invokes achievement hooks on same-pair writes. |
| Assignment achievements | `progression/operations.js:69-85`: MAIN/SUB1/SUB9 use the six factual rules, evaluated after pair assignment. MAIN's chapter range and the source comparison exceptions remain in catalog predicates. The catalog returns rules sorted by order; acquisitions deduplicate in the batch. Output requires the caller to merge metadata and histories. |
| Job counter and frequency lifecycle | `progression/operations.js:118-133`: only an explicit successful eligible reward receipt increments CLEAR_COUNT, once per unique grant in the batch and capped at 100. Four explicit return outcomes increment/wrap frequency. No day advance, reward callback invocation, or claim of cross-transaction replay protection. |
| Persistent versus pending flags | `progression/operations.js:101-117`, `progression/evaluate.js:112-129`: pending-only writes do not affect reads; persistent writes retain pending state; unset requires both scopes; flush requires the named boss boundary, ORs every bit, then clears pending; temporary clear leaves persistent intact. No incidental read/validation/save flush was introduced. |
| Flag identity/index mapping | `progression/support.js:45-67`: source symbols, including the absent-from-catalog bit 31, preserve actual native positions. All 64 positions remain serializable. Unknown flag identity blocks; null/255 read sentinel is false; invalid direct indices reject. |
| Scalar projection and writes | `progression/evaluate.js:11-28`, `progression/operations.js:19-36`: all fifteen catalog scalar projections, sum over all sixteen event bits, first EVENT_GONBE cell without discarding the other three, and only the five supported scalar write destinations. Unsupported names do not become zero/success. |
| Predicate comparisons | `progression/evaluate.js:38-49,81-88`: lexicographic pair comparisons, negative target step ignores step, current chapter 58 disables before/after, ge/le negate those results, and chapter-only comparisons remain ordinary numeric comparisons. Matches the fetched source and factual model. |
| Predicate ordering and unresolved domains | `progression/evaluate.js:58-109`: one detached entry state per evaluation, local memoization, cycle/depth/visit limits, and ordered child evaluation. Missing external consumers are propagated even under false AND/true OR siblings. Callback-result and external item/roster/area/return predicates cannot silently pass. This API does not claim to select/execute whole return decisions. |
| Unsupported operations | `progression/operations.js:134-147`: callback requirements always block; default blocks scene/population/map/route/dungeon/training and other unsupported actions. Failed later operations expose no partial candidate. |
| Copy ownership | `progression/support.js:18-26`, `progression/operations.js:47-56,148-150`: input state and operation data are detached through the existing safe plain-data copier. Results are private mutable transaction candidates, not accepted campaign snapshots. Receipt outputs originate from the detached batch. Catalog rows are read, never mutated. |
| Canonical validation integration | `state/validate.js:48-51`: exact structure then native bounds precede catalog callbacks; existing graph, allocation, ownership, scheduler, RNG, scene, and progress-policy validation remain. Existing state freezing and detached immutable snapshot return remain intact. |
| Initialization and unpublished schema change | `state/create.js:29,101`: catalog profile is already safely copied; its required nativeProgress is inserted and passed through whole-campaign validation. Required schema references exist on both profile and progress state. Missing native fields fail; no zero fallback, migration, or compatibility claim was added. |

## Independent verification

From `tools/pokemon-dungeon/`:

| Command/check | Result |
| --- | --- |
| `npm run lint` | Passed: 172 authored files; static syntax/lint/module-path review. |
| `npm run typecheck` | Passed: 96 authored source files; strict static JSDoc. |
| `npm run campaign:check` | Passed: 1,011 predicates, 586 ordered transitions, six job gates, 21 unlock rules, 83 routes, 26 bosses, 18 recruitment flags. Internal data/schema/hash joins only. |
| Repository `git diff --check` | Passed. |
| Read-only Python schema/catalog cross-check | Passed: eleven exact scenario names; both required native references; four event cells; all fifteen scalar projections; exactly five scalar write destinations; every catalog pair assignment within byte bounds; all 34 flag identities map correctly with the native bit-31 gap preserved. |

Check scripts were inspected for the static-only boundary. No game module was
imported or executed, no gameplay was automated, and no behavioral tests were
created. npm emitted its existing environment `http-proxy` warning; all commands
above exited successfully.

## Remaining integration obligations

The required whole-campaign progress policy must join native facts to authored
story/branch/map state and enforce legal boundaries. The jobs owner must establish
receipt authority and cross-transaction grant idempotency; the boss owner must
enforce pre-flush selection/cutscene/weather order. Existing milestone metadata
must be preserved when acquisitions are merged. External predicate consumers,
route/first-entry history, scenes, dungeon/training flags, opening profiles, and
other CampaignContent policies remain future work as documented. The historical
source discrepancy remains an evidence task. None of these explicitly excluded
owners is silently replaced by an always-pass implementation here.

Only this review report was written. No implementation edits, commits, or
subagents were made.
