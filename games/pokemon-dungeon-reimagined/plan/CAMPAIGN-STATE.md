# Canonical campaign state (P07)

This is the complete structural campaign boundary, not a playable campaign or a
claim that all original-game policies are ready. The concrete types are in
`src/contracts/campaign.js`; `src/domain/state/schema.js` enumerates the exact
serialized fields and finite variants. No opaque JSON field is accepted.

## Public API

| Export | Contract |
| --- | --- |
| `validateCampaign(input, content)` | Returns `{ok:true,snapshot}` only after detached structural, graph, identity and all relevant semantic checks; otherwise `{ok:false,kind:'invalid'\|'blocked',issues,requirementIds}` |
| `createCampaign(confirmedInput, content)` | Constructs exactly the sourced profile and opening scene; validates before exposing an immutable snapshot |
| `copyCampaignDraft(snapshot)` | Detached mutable copy of an already validated snapshot, for private domain work |
| `commandContext(snapshot)` | Captures `{transactionId,expectedRevision}` using the allocator's exact next transaction identity |
| `prepareTransaction(snapshot, context)` | Rejects stale context/exhaustion; allocates the transaction first in a private draft and returns `{draft,commitRevision}`; does not execute or commit a command |
| `copyPlainData`, `snapshotPlainData` | Existing bounded JSON-copy and detached immutable-view APIs |
| `createDomainStreams(seed)` | Existing three-stream API and initialization sequences unchanged |
| `createCampaignStreams(seed)` | Adds `jobsRewards` at the fourth jumped starting state |
| `validateCampaignStreams(input)` | Requires all four serialized streams; never seeds or repairs them |

`CampaignState`, `CampaignSnapshot`, `CampaignContent`, `CampaignValidation`,
`CampaignOptions`, `CampaignStatePolicies`, `CommandContext` and the generated
identity types are re-exported by `src/contracts.js`. Larger subsystem types
have a single definition in `src/contracts/campaign.js`.

P12 still owns the Adventure facade, command-specific validation, synchronous
transitions, final whole-draft validation, revision increment and atomic swap.
A rejected/no-change command discards its draft and consumes neither IDs nor RNG.
A changing command commits `commitRevision` exactly once. An accepted command ID
cannot be reused even with a refreshed revision: it is below the exact next ID.
Do not regenerate an envelope when retrying the same physical activation.

Domain event counters are nonpersistent, begin at 1 per Adventure instance and
are allocated only on commit. Check event-counter exhaustion before committing.
The application wraps committed results with its own Adventure epoch and clears
presentation queues synchronously on replacement. Events never enter this schema.

## Ownership and scopes

| Record | Authority |
| --- | --- |
| `roster` | One permanent record per recruited individual; no current HP or PP |
| `session.actors` | Effective expedition growth, HP/PP, conditions, movement and gains |
| `session.entry` | Immutable entrant records and exact entry projections; never restored wholesale by persistence |
| `items`, `containers` | One current instance record and exactly one placement per live item |
| `rescue.suspended` | Separate reserved run/item namespace; no second active run or RNG copy |
| `random` | Four campaign-owned streams, surviving town, floor changes and rescue |
| `revision`, `idSequence` | Single persisted canonical revision and global instance allocator |
| `town.day` | Single authoritative day; historical days are bounded observations |

All generated ID references, including entry histories, old actor sources, closed
shop maps and suspended runs, remain below `idSequence.next`. A consumed numeric
allocation cannot identify two kinds. Current declarations are unique across
live and suspended namespaces. Move slots may project between the same permanent
individual and its actor; different owners cannot share a slot. Historical entry
copies are not duplicate live ownership.

Home and session toolboxes and held containers are distinct. Every Pokemon has
its home held container, and every actor its actor-held container. Entry and exit
transfer item ownership atomically. Archive validation uses its own inventory
namespace. A shop lot outlives consumed stock and closed shops retain accounts,
not live keeper references. Storage merges equal complete templates, including
stickiness and finite machine/charges/story payloads.

An unsettled entrant's permanent record equals its historical baseline. A
participant settlement is unique and joins its actor/Pokemon identities in both
directions. Every roster-bound actor requires its own entry baseline, and a
settled Pokemon has no actor on the live map or in active team order. A retired
actor may be absent, but any extant binding must agree with its settlement pair.
Rescue reservation includes baseline, selection, actor-binding and settlement
claims, so omitting a baseline cannot hide a reserved participant. Reset actors deliberately need not equal permanent
growth. A suspended rescue reserves entrants and item identities against a second
run. This structural reservation is conservative; a future sourced exception
requires an explicit reviewed ownership rule, not silently shared mutable actors.

All five modes remain authoritative:

| Mode | Required committed boundary |
| --- | --- |
| `town` | No session/scene; optional permitted informational result or choice |
| `dungeon` | One session, no scene; ordinary input requires active run and no pending result |
| `scene` | Exactly one pending scene, no result; optional session according to continuation |
| `awaitingRescue` | No active session/scene and a self-rescue suspension |
| `defeat` | No session/scene; a committed defeat result |

A paused scheduler joins exactly its result or scene gate. Continuations resolve
explicit session/result/scene/request identities. Result rewards already exist in
canonical state; a job reward result must equal its claimed job and grant revision.
Acknowledgment cannot issue the same reward again. Scene/result-specific intent
fields still require their exact cursor and canonical revision in addition to the
universal transaction context. Success is not reported through defeat mode.

## Full structural coverage

The registry covers root/options, permanent Pokemon, all four learned positions,
linked groups, evolution/origin history, exact rational quantities, centralized
items/containers, storage/economy, shop lots/debt, complete session actors and
projections, all 66 statuses in their twelve exclusive groups, four independent
auxiliary conditions, speed/counters/modifiers, actor memory/AI, floor geometry,
knowledge/weather/effects, traps/rooms/exits, finite scheduler/action/effect
continuations, entry and outcome policy types, jobs/rewards/progression,
scenes/choices/results, rescue escrow and imported teams.

Shape validation rejects missing/extra fields, unsupported union variants, unsafe
numbers, non-reduced rationals, arrays with holes, accessors, nonplain objects,
unsafe keys, cycles and excessive input. Imported objects must originate from a
bounded JSON parse; arbitrary JavaScript Proxies are not a supported boundary.
There are no arbitrary string instance kinds or extension payload escape hatches.

Relational checks join map keys and entity IDs; hero/partner/party membership;
move links/order/PP slots; reciprocal inventory ownership; team/leader/bindings;
entry records and settlements; rectangular tile/knowledge layers; in-bounds
positions and room bounds; room/shop references; condition groups and live links;
scheduler PCs' structural target/hit/index bounds and paused gates; job objectives
and active phases; scene/result bindings; historical revision/day ordering;
once-only grant uniqueness; rescue records and reserved assets. Source-dependent
terrain collisions, numerical caps and executable PC legality are required policy
checks, not inferred from the presence of numeric fields.

Move references use a shared structural resolver across saved actions/effect
cursors, last-used memory, move-bound conditions, move gains and actor-owned
learning choices. An actor retains both underlying and copied-combat move
namespaces; a copied slot may resolve without rewriting its underlying moves.
Each PP projection still joins its own move set. Required actor, condition,
scheduler and result policies determine which channel is legal at the exact
saved operation; structural existence alone does not authorize a copied action.

## Required content interface

`CampaignContent` is a trusted local runtime object, never imported save data.
It declares `referenceEdition:'blue-rescue-team'`, `campaignSchemaVersion:1` and
an exact `contentRevision`. Its identity lookup and every policy method must exist
as own data properties before any predicate is invoked. Missing functions produce
blocked requirements, never an implicit successful check.

The identity lookup supplies:

- `has(kind,id)` for every finite catalog identity kind.
- `permitsForm(identity,'persistent'|'session')` for exact species/form context.
- `permitsFloor({dungeonId,sectionId,floorId})` for the complete floor relationship.
- `permitsSection(dungeonId,sectionId)` for rest-section relationships.

The current dungeon catalog's `getSection` and `getFloorById` are authoritative.
State uses `sectionId` and `floorId`, plus `visitedFloorIds`/`reachedFloorIds`,
rather than inventing the proposal's separate segment/floor-key catalog. Do not
use display floor numbers or the comparative `sourceFloorKey` as identity.
Species lookup uses `getProfile(speciesId,formId)` and its qualified level/learnset
resources. Catalog membership alone does not admit temporary Decoy/Munchlax as
collectible roster records or approve every comparative numerical field.

| Required policy | Obligations beyond structural checks |
| --- | --- |
| `profile` | Sourced quiz revision/outcome/pair, immutable original identities, name rules and starter origins |
| `pokemon` | Exact permanent growth/EXP/caps/inheritance, accommodation/capacity, move/IQ/tactic/recruitability/evolution legality |
| `actor` | Binding/role/body/movement limits, reset effective profile, HP/PP/Belly/gains, overrides/Hidden Power and imported projection |
| `item` | Obtainability, complete payload/stack/held rules, stickiness, source and scope-specific quantities |
| `economy` | Money/storage/area capacities, entry-separated accounts, rewards and source restrictions |
| `floor` | Accepted authored geometry, terrain/occupancy/collisions, exits/events, floor/section variants, weather and shop arithmetic |
| `conditions` | Exact status payload/source/lifetime/group rules, auxiliary effects, stages/multipliers/speed and timer units |
| `scheduler` | Actual schedule policy, eligible opportunities, phase/PC/hit/target legality and preserved random decisions |
| `expeditionEntry` | Complete projection/baseline agreement, participant retention and every required exit/rescue outcome-policy field |
| `progress` | Story/branch/unlock/grant/history/day rules, capacities and once-only state |
| `job` | Sourced goals/target floors/rewards, phase/order/capacity and mail legality |
| `scene` | Exact content cursor, roles, options/choices/prerequisites and permitted continuation |
| `result` | Exact outcome classification, committed gains, offered options and continuation |
| `rescue` | Exchange format/digest/replay/lifecycle, reservation/escrow/restoration and imported-team legality |
| `town` | Map/placement, service availability/stock/day rules |
| `options` | Explicit application-defined bounds and valid preferences; defaults only for confirmed new-game input |

Every policy returns exactly `{ok:true}`, `{ok:false,kind:'invalid',issues}` or
`{ok:false,kind:'unresolved',requirementIds}`. Empty rejection diagnostics cannot
be mistaken for success; promises, malformed responses or exceptions block the
operation with a safe requirement identifier. No raw callback exception is shown.
Input is frozen before callbacks; policies cannot repair malformed saves.

Nested calls use `live`, `entry-history` (with session and active/suspended owner)
or `rescue-suspended` (with request) scopes. Entry Pokemon/items and suspended
actors/floors/conditions/schedulers/inventories receive the appropriate scope.
`expeditionEntry` must validate all saved projections and the *entire* outcome
policy set needed to leave or resume the run. An unresolved policy rejects load
even if the current screen could be drawn without it.

## New-game profile

P19 supplies confirmed quiz selection, names, canonical UTC metadata (ISO form
with milliseconds and `Z`), explicit four-word seed, options and profile ID.
`initialCampaign(profileId,selection)` returns a typed ready definition or named
blocked requirements. A ready template includes the exact two starters' stats,
moves/links, IQ/tactic/areas/items, party roles, economy, story/milestones/branches,
town placements/stock/day and initial scene/cursor/bindings/continuation.

Two deliberate refinements prevent hidden default game facts: the template also
supplies `recruitedHistory` and `initialScene.awaiting`. The initializer never
assumes that starter acquisition belongs in recruitment history or that a scene
cursor awaits an advance instead of a choice. Opening-scene order remains P19/P22.

Hero and partner IDs allocate first, followed by their move/container/item IDs,
toolbox and scene instance. Only engineering revision/sequence/stream setup and
empty histories without past events originate in P07. All authored initial facts
are validated through the same complete campaign path before returning a snapshot.
No profile exists merely because species and dungeon numeric catalogs exist.

## Safety budgets and static evidence

Engineering limits are not original-game roster or map limits. Plain copies allow
2,000,000 nodes, depth 64, 50,000 entries per array/object, 65,536 UTF-16 units per
string and 32 Mi UTF-16 units of cumulative text. P08 must cap encoded bytes before
JSON.parse (64 MiB maximum suggested by this boundary). Diagnostics stop at 100,
paths at 2,048 units and messages at 256. Mail replay protection allows at most
10,000 digests; admission must reject at capacity, never evict old protection.

An independent literal-schema node count (no source import/execution) measured
982,258 nodes for a conservative envelope: 413 permanent records, 413 entrant
copies in each active/suspended baseline, two 128-actor 64×64 floors, 2,048 item and
container records in every inventory namespace, plus bounded jobs/shops/progress.
This demonstrates headroom relative to the old 200,000-node boundary; it does not
certify source-dependent maximum map/entity capacities. Catalog owners must keep
accepted maximum shapes within the engineering budget or review a versioned change.
All 154 named shapes resolve their references. A source-text comparison verifies
the complete original RNG implementation is unchanged apart from its import path.
Strict JSDoc/type and lint/module-path checks parse source without executing it.

## Remaining rule owners

Growth provenance qualification, original timer/scheduler/PC semantics, damage
rounding, Transform/Transfer/Hidden Power/Reviver/TM/shop behavior, complete
challenge entry/exit/rescue retention, accepted fixed geometry and first/revisit
rules, P19/P22 quiz/scene profiles and P21 job/mail/rescue policies remain required
content work. Their absence blocks affected state admission explicitly. P08 owns
encoding/storage/recovery and the existing guarded application replacement
protocol. P12 owns command execution; P16 owns reset projection and outcome merges.
This package does not create an all-rejecting Adventure or fake town campaign.
