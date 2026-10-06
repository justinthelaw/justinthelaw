# Recovered P12 Adventure and turn boundary

This freezes the recovered consumer APIs on 2026-10-06; full P12 review,
integration and gameplay acceptance remain open. Exact unions and signatures are
in `src/domain/turns/types.js`; serialized speed/slot/effect/continuation records
are in `src/contracts/campaign.js` and the matching state schema/graph checks.

## Public APIs and atomic ownership

| Export | Contract |
| --- | --- |
| `createAdventure({initial,content,handlers,turns})` from `src/domain/adventure.js` | Full campaign validation; returns `{ok:true,adventure}` or safe `invalid` / `content-blocked` failure |
| `adventure.getSnapshot()` | Current fully validated frozen canonical snapshot; the only domain authority |
| `adventure.getEpoch()` | Fresh instance-local symbol; neither serialized nor interchangeable with the persistence application epoch |
| `adventure.dispatch(command)` | Synchronous discriminated DispatchResult with ordered frozen events |
| `createScheduler(schedulePolicyId, teamSlots, wildSlots)` from `src/domain/turns.js` | Initial mutable engineering record for phase 0; concrete actor/policy facts still required |
| `advanceTurns(context, hooks, action = null)` | Internal transaction-draft operation; returns `{kind:'input' \| 'prompt' \| 'terminal',consumedTurn}` or throws a bounded TurnFault |
| `installSpeedChange(context, actorRef, change)` | Install a reviewed speed-core TimerChange, preserving earlier effective-raise flags |
| `TURN_BUDGET` | 16,384 scheduler steps and 4,096 effect steps per advance call |

A `Command` carries exact-next `transactionId`, `expectedRevision`, current domain
`epoch` and a typed `Intent`. Capture identity with `state/transaction.js`
`commandContext(snapshot)`; retries retain their original context. Scene/result
acknowledgments additionally match identity, cursor and current revision. Input
adapters emit application intent; the composition root resolves and stamps a
domain command, checking its separate application binding first.

Dispatch rejects reentrancy/stale context, plans against frozen state, prepares one
private draft, applies synchronous behavior, validates the whole result and builds
events before swapping the snapshot pointer once. Rejected/content-blocked,
presentation and unchanged results preserve live state/revision/IDs/RNG. Changed
strategic configuration commits a revision without necessarily consuming dungeon
time. Retained drafts are sealed; no storage, animation or asynchronous callback
belongs inside domain mutation.

| Result / handler type | Meaning |
| --- | --- |
| `DispatchResult` | `accepted` with changed/consumedTurn/revision/events, or safe `rejected` / `content-blocked` with empty events |
| `CommandHandler.plan(snapshot,intent)` | `presentation`, `mutation`, `action` with ResolvedAction, or explicit failure |
| `CommandHandler.apply(context,intent)` | Required for mutation plans: `changed` with resumeDungeon, `unchanged`, or failure |
| `MutationContext` | Private state plus bounded `emit(EventData)`; handlers may not replace state or control revision/allocation authority |
| `Event` | EventData plus eventId/revision/domain epoch; IDs are monotonic within this Adventure and never saved |

Concrete command handlers own legal mode/family/action/choice checks, including
turn costs and game-condition failures. Presence of an intent in the union does
not provide a handler. Missing/malformed/promised handler results block; no generic
attack, successful no-op or invented campaign is supplied.

## Required concrete TurnHooks

Every hook in `turns/types.js` must exist before scheduling. All hooks are
synchronous and act only on the current private context.

| Hook(s) | Required result / responsibility |
| --- | --- |
| `speed(context,ref)` | Reviewed SpeedContext from current species/form/weather/status/theft facts; canonical timer arrays remain scheduler-owned |
| `spawn`, `refreshSides`, `forcedLoss`, `experience`, `end`, `tile`, `room`, `wind` | HookResult: `continue`, canonical `prompt`, or failure; implement each named lifecycle responsibility |
| `begin(context,ref)` | BeginResult with canAct; sourced status admission and beginning effects |
| `ai(context,ref,replan)` | DecisionResult: concrete action, defer, bounded replan or failure |
| `startAction(context,ref,action)`, `effect(context,ref,cursor)` | EffectResult: next finite cursor, prompt, or done with movement/leaderChanged/stop |
| `effectAllowed(context,ref,cursor)` | Exact boolean continuation permission after current status/identity changes |
| `invalidReference(context,ref,cursor,reason)` | EffectResult for vanished target/reaction source/reaction target; preserve the remaining action's actual rules |

Each effect step settles zero-HP survival/revival/faint/recruitment synchronously.
Successful recruitment stops remaining links/hits. Terminal latches and actor/floor
invalidations stop old-floor work. Combat, effects, items, hunger/failure, AI,
recruitment and experience owners must supply real behavior and unresolved-field
requirements; the scheduler does not implement their catalogs.

## Scheduling, canonical cursors and bounds

| Responsibility | Recovered implementation boundary |
| --- | --- |
| Fractional timing | Persisted phase 0-23; reviewed pure speed core determines admitted opportunities and finite timer decrement |
| Pass order | Stage-1 prephase spawn/side refresh/lock clear/loss; leader; live ascending team slots; three deferred-follower rounds; follower end; live wild slots; movement/evolution boundary; phase increment |
| Leader refresh | Immediate leader change skips its beginning effects once; effective speed raise refreshes phase to 0; refresh does not reapply ordinary eligibility |
| Stable identity | ActorSlotRef is side/slot/monotonic ActorId; empty native slots remain meaningful; later-slot recruits/spawns can participate in the current pass |
| Movement/end effects | Logical movement precedes deferred tile/loss/end/experience/room handling; leader is flushed first; explicit pending flags prevent duplicate end passes |
| Prompts | Hook establishes canonical pendingScene/pendingResult and matching paused scheduler; persisted next cursor resumes completed work without replay |
| Structural limits | Four team slots, 1-128 wild slots; five speed counters per sign, 0-127; cached stage 0-4; effect hitCount 1-256, target list at most 132, linked moves at most four, reactions at most 32 |
| Dispatch limits | At most 4,096 emitted events; event/revision/allocation exhaustion rejects; finite scheduler/effect budget failure discards the draft |

Full CampaignContent is mandatory: all sixteen semantic policies, identity joins,
accepted content revision and initialCampaign lookup. Scheduler/actor/condition/
result policies must validate exact saved PC, timer/cursor semantics, retired
references, prompt ownership and outcomes. Structural bounds alone cannot admit
a semantically unsupported save. Unpublished schema refinements introduce no
fabricated legacy migration.

The engine itself draws no RNG. Concrete hooks use named canonical streams only;
no Math.random, render clock or catch-up loop may determine gameplay. P08 may
checkpoint committed snapshots or validated prompt continuations. Its detached
binding requires `getSnapshot()` to return the exact supplied frozen snapshot
initially; Adventure preserves that identity after validation. P08 owns storage,
replacement/command pause and a separate application epoch; P18 owns safe UI.

## Source and review limits

[RULES-BROWSER-CONTRACT.md](RULES-BROWSER-CONTRACT.md), sections 2-5, is the adopted
scheduler/interruption contract. It distinguishes joint original Rescue Team
research, pinned original Red comparative evidence at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`, and browser engineering adaptations.
No instruction-level Blue or native RNG parity is claimed. Effect/timer owners
also consume [EFFECT-CATALOG.md](EFFECT-CATALOG.md) and preserve unresolved fields.

Static parsing/lint/types and bounded source traces support the recovered
foundation. Complete independent P11/P12 review, concrete handlers/policies/hooks,
save/UI/application integration and manual normal/speed/link/recruit/faint/terminal/
prompt/recovery observations remain open. The startup shell remains unconnected.
These APIs do not establish a playable adventure or any full-game completion gate.
No automated game-source tests, imports or playthroughs are permitted.
