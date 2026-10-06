# Task 1 implementation report

## Scope and readiness

Implemented complete P07 structural campaign contracts and validation at the
assigned paths only. Ready for independent static review. No game-source test,
import, playthrough or gameplay execution was performed. No playable campaign or
complete semantic policy catalog is claimed. Owned paths committed as `1a08bdf` after the controller granted the serialized
index slot. Unrelated root/tests/art/effects work was preserved; index slot released.

## Files and responsibilities

- `src/contracts.js`, `src/contracts/campaign.js`: full strict JSDoc records and
  finite unions, branded instance/catalog vocabulary, canonical snapshot/content/
  validation/new-game/command contracts, all retained legacy primitive exports.
- `src/domain/state.js`: public facade with preserved plain-data exports.
- `src/domain/state/plain.js`: existing copy/freeze implementation moved to avoid
  cycles; reviewed engineering node/text budgets increased.
- `src/domain/state/schema.js`, `structure.js`: exact 154 named serialized shapes,
  no partial JSON escape hatches, bounded diagnostics and deterministic structure
  walk before catalog predicates.
- `relations.js`, `inventory.js`, `session.js`, `graph.js`: current/history/escrow
  ownership, map/scheduler/status/party/entry/job/progression/result/scene relations.
- `policies.js`, `validate.js`: required interface verification, typed fail-closed
  semantic calls with explicit scopes, membership/join checks, high-water/global
  instance ownership, safe metadata/counters/quantities, detached immutable results.
- `create.js`: exact catalog-defined two-starter opening-scene construction;
  unsupported profile/policy returns a precise blocked requirement.
- `transaction.js`: exact-next activation context and private draft preparation;
  no dispatch, event publication, commit or persistence execution.
- `ids.js`, `rng.js`: explicit new instance/catalog kinds and fourth jumped RNG
  stream while preserving the complete original three-stream implementation.
- `plan/CAMPAIGN-STATE.md`, narrow STATE-FOUNDATION/SYSTEMS interface updates:
  ownership, API, required policies, safety budgets, compatibility and rule gaps.

Paths above are relative to `games/pokemon-dungeon-reimagined/`.

## Public interfaces and intentional refinements

- `validateCampaign(unknown, CampaignContent): CampaignValidation`
- `createCampaign(ConfirmedNewGameInput, CampaignContent): CampaignValidation`
- `copyCampaignDraft(CampaignSnapshot): CampaignState`
- `commandContext(CampaignSnapshot): CommandContext`
- `prepareTransaction(CampaignSnapshot,CommandContext): {draft,commitRevision}`
- `createCampaignStreams(RandomWords)`, `validateCampaignStreams(unknown)`
- Existing `createDomainStreams`, `copyPlainData`, `snapshotPlainData`,
  `PLAIN_DATA_LIMITS`, `PlainDataLimits` remain accessible.

Use `sectionId`, `floorId`, `SectionId`, `FloorId`, `visitedFloorIds`,
`reachedFloorIds`: these match the already accepted dungeon APIs rather than
creating divergent Segment/FloorKey identities. `CampaignIdentityLookup` adds
required `permitsFloor(address)` and `permitsSection(dungeonId,sectionId)` alongside
`has`/`permitsForm`, to validate actual catalog joins.

The initial profile requires authored `recruitedHistory` and
`initialScene.awaiting`, preventing hidden assumptions about whether starters count
as recruited history or the opening cursor awaits advance/choice. Options and all
gameplay initial values remain supplied; only empty genuine history and engineering
counters/IDs/stream state originate in P07.

Required semantic policies: profile, pokemon, actor, item, economy, floor,
conditions, scheduler, expeditionEntry, progress, job, scene, result, rescue, town,
options. All entry points are verified before calls. Every relevant active,
entry-history and suspended value is checked with explicit scope. Exceptions,
malformed results, promises, missing functions and unresolved requirements cannot
produce success. Policies receive frozen data and cannot repair it.

## Evidence

Commands use `PATH=/tmp/pokemon-tool-bin:$PATH`:

1. `npm --prefix tools/pokemon-dungeon run lint` — passed, 84 authored files,
   static lint/module-path parsing; no game execution.
2. `npm --prefix tools/pokemon-dungeon run typecheck` — passed, 37 authored source
   files, strict JSDoc including all new modules.
3. Independent `/tmp/audit-campaign-source.py` — source/literal JSON parsing only:
   154 named shapes, 150 resolved references, no dangling shape reference; full
   prior RNG source body unchanged apart from its plain-data import; conservative
   capacity-envelope node count 982,258 within the 2,000,000 node engineering limit.
4. `/tmp/pokemon-precommit/bin/pre-commit run --files <owned paths>` — passed merge
   conflicts, newline/whitespace/quote hygiene and Markdown lint; irrelevant hooks
   skipped. No generated-source behavior invoked.
5. `git diff --check` — passed.

A first typecheck caught a local shape-union narrowing issue (fixed); a transient
parallel effects catalog missing typedef then disappeared when its owner finished.
Current complete checks pass.

## Remaining limits and downstream obligations

P07 supplies the complete structural boundary and semantic call sites, not the
source-dependent rule implementations. Remaining rules are enumerated in
CAMPAIGN-STATE.md: scheduler/PC/timers, exact growth qualification and caps,
Transform/Transfer/Hidden Power/Reviver/TM/shop semantics, all reset and rescue
outcome fields, accepted geometry/first-revisit variants, starting quiz/scene and
job/mail/rescue lifecycle. Missing relevant policy remains blocked.

P08 must bound bytes before JSON.parse (64 MiB recommended). The 2M node, depth 64,
32Mi UTF-16 text limits are engineering bounds, not original party/map capacities.
The source-only 982,258-node envelope deliberately overprovisions 413 entry copies
in both active/suspended runs and two 128-actor 64x64 maps; exact accepted map/entity
maxima remain catalog-owned. Replay protection retains at most 10,000 mail digests
and rejects further admission rather than evicting IDs.

P12 owns synchronous dispatch, command family/mode/cursor checks, no-change discard,
whole-draft revalidation, revision commit and epoch-scoped event publication. P16
owns projected reset/retention transitions. No dummy Adventure or permissive
content adapter was introduced to make unavailable gameplay appear functional.

## Independent-review corrections (2026-10-05)

Read the complete task-1-review.md and verified both P1 findings against the
contract/source before editing. Fixed the shared causes rather than special-casing
the reported examples. Public APIs and serialized shapes are unchanged; the P08
implementer was notified directly.

- Move references now use `hasMoveReference` / `actorHasMoveReference` from
  `relations.js`. Underlying and copied-combat move namespaces remain separate but
  both participate in structural reference resolution. Saved leader/effect
  actions, memory, lock/charge conditions, move gains and actor learning choices
  use the resolver. Each PP projection remains joined to its own move set.
  Required actor/condition/scheduler/result policies still decide exact channel
  legality and active projection semantics.
- New `participants.js` validates the actor, entrant and settlement relationships
  together. Every roster-bound actor requires a matching baseline/roster. Existing
  actor bindings and settlement actor/Pokemon IDs must agree in both directions;
  settled Pokemon cannot have a map/team actor. Intentionally retired actors can
  remain absent, with their settlement retaining the historical pair, while
  contradictory extant bindings fail. Both live and rescue-suspended sessions use
  this same graph check.
- Rescue reservation now collects every permanent claim from entry baselines,
  selected entrants, actor bindings and settlements. Missing baseline records
  cannot hide an active/suspended ownership collision. Documentation records the
  stronger invariant and move namespace semantics.

Verification after these corrections:

1. `npm --prefix tools/pokemon-dungeon run lint` passed (89 authored files,
   source parsing only).
2. Strict P07 typecheck passed using the repository compiler options and scoped
   roots via `/tmp/pokemon-p07-review-tsconfig.json`:
   `node tools/pokemon-dungeon/node_modules/typescript/bin/tsc -p /tmp/pokemon-p07-review-tsconfig.json`.
   The initially attempted global typecheck encountered unrelated in-progress
   P08 JSDoc-template errors; notified that owner rather than editing their files.
3. Scoped pre-commit passed on the four changed/new source files and
   CAMPAIGN-STATE.md; `git diff --check` passed.
4. Source review traced transformed action/PC/memory/condition/gain/choice callers,
   the reported actor-A/actor-B settlement mismatch, omitted-baseline bindings,
   retired actor records and active/suspended reservation claims. No game-source
   execution, imported-source tests or automated playthrough occurred.

Corrections committed as `117845e` after the controller granted the serialized
index slot; index is empty and released for independent review. Full gameplay/source-rule/readiness/release limitations remain unchanged.
