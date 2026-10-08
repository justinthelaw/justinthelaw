# Saveable cooperative turn continuation — v19

The prerequisite is implemented over published staged v18 at
`1b9eb5fc1d03a8f20dcf53ea182121a5b5112ef2`. Independent specification/quality
review remains required; Stun Seed is still absent from public `USABLE_ITEMS`
and `THROWABLE_ITEMS`. This is bounded native work and notification memory,
not whole-game acceptance or a measured millisecond latency guarantee.

## Version and transaction boundary

`content/state/continuation-campaign.js` composes the exact v18 factory. The
trusted exact revision is `v19-turn-continuation-opening`, with its complete
factual suffix in `src/domain/state/continuation-revision.js`. Only that exact
revision selects `CONTINUATION_SHAPES`; `schema.js` remains byte-for-byte frozen.
The successor registry adds only scheduler kind `continuing`, preserving all
old shape names and recursively threading the registry through union preflight,
all three inspection passes and both identity/catalog visitor lookups.

Exact v18 factory, policy and field-root dependencies are appended to the save
pin inventory. Import compatibility validates the original v2–v18 envelope and
state with its original factory before changing revision metadata. Conversion
does no gameplay, RNG, actor/ID allocation, status replay or manufactured player
decision. Existing ready, real-prompt and terminal PCs stay in place. V19 saves
retain continuing directly, with no stored event backlog or new effect cursor.
All old slots, inventories, historical actor records, Leech links, Water Sport
and item-source status provenance remain admitted; ready-Petrified rejection
still belongs to exact v18. Neither large co-located trap/money collections nor
the four-team/128-wild structural ceiling is narrowed.

Adventure still applies synchronous work to one private draft, validates the
whole result, stamps ordered events and swaps the canonical pointer once.
`TurnOutcome.kind` includes `yielded`; accepted dispatch exposes `turnOutcome`
(`input`, `prompt`, `terminal`, `yielded`, or null without scheduling).
`consumedTurn` retains its existing per-call meaning: supplied action or
incapacitated beginning consumes it; automatic traversal/AI alone does not
manufacture an extra consumed player turn. A yield is committed progress even
when this flag is false. The unchanged 16,384-step/4,096-effect guards protect
invariants, and the 4,096-event guard applies after tile collection. Faults
discard the draft; no overflow retry, discarded notification or replay occurs.

## Whitelisted committed checkpoints

`src/domain/state/continuation.js` owns the exact whitelist. Every continuing
PC requires active dungeon/session, terminal none, no scene/result/client
prompt, null action/effect, beginningRan=false and petrifiedSwapPending=false.
The existing graph checks still validate slot generations, ranges and speed
obligations. Genuine input, prompt, terminal or floor replacement wins before
publishing a checkpoint. No active effect or arbitrary mid-hook PC is admitted.

| Completed unit / saved cursor | Next work on automatic advance |
| --- | --- |
| Ordinary leader: pass leader, active null, stage select, step 1 or 2; no special/flush | Step 1 selects actual leader with preserved skipBeginning/speed-raise policy; step 2 runs wind then advances to team. |
| Team/wild: active null, stage select, step 0, slotIndex 1..that side's slot count; no special/flush | Inspect the next live slot generation, or change pass after the last slot. |
| Deferred follower: pass followers, active null, stage select, step/slotIndex 0, followerRound 0..2, followerIndex 1..captured order length; no special/flush | Inspect the next captured generation, then remaining native deferred rounds. |
| Leader after-work installing special: pass leader, step 0, active null, stage select, special.index 0; no flush | Start the actual Petrified special traversal before selecting a counterpart. The completed leader action is not replayed. |
| Special actor: same leader/select cursor, special.index 1..team+wild slot count, active null; no flush | Continue scanning from that next slot. Restore special.leader/leaderChanged after traversal, then run only administrative leader refresh. |
| Flush recipient: flushing.step 0, index 1..order length, no special; leader/begin at step 0 (preserved bounded slotIndex), or boundary/select at step 1 with slotIndex 0 | Continue the next captured recipient, or clear finished flush and resume the original begin/boundary owner. Tile/loss/end/XP/room and index advance already completed for the prior recipient. |
| Empty-completion phase: pass prephase, step/slotIndex 0, active null, stage select; no special/flush | Start the next phase, whose phase increment and any round increment were already applied. |

Leader/begin flush additionally requires the active current leader generation,
replanCount=0, actionStop=none and leaderChanged=false. Boundary flush requires
active=null. Captured flush generations must exist historically; every still-live
completed recipient has discharged movement/end obligations, and every remaining
live recipient retains its movement obligation. Every live pending mover must
occur with its exact side/slot/actor generation in the unvisited suffix; omission
cannot let phase upkeep or input overtake its tile/end work. Resolving captured
generations retain native relative order: leader first, ascending other team
slots, then ascending wild slots. Removed captured generations remain historical
and never resolve to a new occupant of the same slot. Validation rejects omission
or reordered live work without rebuilding, sorting or normalizing saved data.
Current flush hooks cannot change leader identity or reorder/spawn/replace live
slot occupants: tile resets/picks up, end runs residual/Bide/loss, XP grows and
room updates knowledge. Wild faint can retire a captured generation; team defeat
ends continuing. Therefore current-leader/slot ranks preserve the captured live
relative order. A future leader-changing or slot-reordering flush hook must
revisit that proof rather than reinterpret an old order. Each special actor gets its
own opportunity checkpoint; combining leader plus counterpart would invalidate
the event allowance below.

Only action, activeEffect and beginningRan are cleared at completed opportunity
refresh (and completed leader special installation). The completed action's
damage/end/XP has already run or its movement/end obligation remains owned by
the original flush; these fields are no longer read for that action. Special
restoration reads special.leader/leaderChanged and actor speed, and goes directly
to refresh. All other bounded predecessor frame fields, follower arrays,
skipBeginning, deferred/replan, actionStop, leaderChanged and speed flags retain
their native ownership; no fresh scheduler is fabricated to obtain admission.
The transient ready tag while resuming exists only inside the draft so existing
synchronous hooks can establish genuine prompts; it is not a published input PC.

Native safe swap can temporarily co-locate leader/counterpart before the reverse
walk. `swap-continuation.js` proves only the actual pending pair using live team
slots, special scan position, opposite facings, pending flags, empty original
tile and the original safe-swap movement plan. The continuing floor policy
projects that pair to original distinct occupancy solely for prior validation.
It mutates nothing and grants no unrelated collision permission.

## Complete current atomic notification accounting

These are conservative source bounds, conditional on stopping at the first
completed unit. Use **N=132** active actors (four team plus128 wild), not the
fresh floor's16 wild slots. At most132 initially live Leech links plus one new
link can clear in a chunk: shared **L=133**. Exactly two entry identities can
grow, each at most99 increments with two notices: shared **G=396** across all
XP/settlement calls, including historical actors. New entry policies must revisit
this proof. Shared L/G are charged once, not hidden inside local bounds.

| Current call-chain owner | Conservative notifications, excluding L/G and final lifecycle |
| --- | ---: |
| Petrified/ordinary127 Sleep interruption | 4 |
| One drop / one Reviver Seed | 3 each |
| dealDamage: interruption4 + max(revive3, drop3+faint1) + Rage2 | 10 |
| forcedLoss: up to four team revival checks ×3 | 12 |
| Paralysis propagation: each actor sets status before revisits, 132×2 | 264 |
| Contact reactions: Static264 + Poison Point1 + Cute Charm1 | 266 |
| Burn: at most132 new burns, 1+8N recursive calls each at most one message, plus N condition changes | 1189 |
| Begin: timed groups6 + Leech expiry2 + sureShot1 + Charge cleanup1 | 10 |
| AI: flagged special Petrified release | 2 |
| Bide release: interruption4 + damage10 + attack1 + contact266 | 281 |
| End: hunger11 + periodic11 + Leech/Ooze21 + Bide expiry1/release281 + Rage2 + forcedLoss12 =339 | 340 |

Current multi-target stat moves perform at most two stage operations per target:
interruption4 + stage changes4 + attack1 =9, times132 plus Charge1 =1189.
Every current damaging action resolves one target. Its larger bound is
interruption4 + damage10 + attack1 + Ember burn1189 + largest extra move
(Absorb/Ooze or recoil)11 + contact266 + thaw2 + Charge1 =1484, rounded to
**A=1500**. Distinct secondaries/move IDs are deliberately overcounted together.
Current item/throw paths are below32 plus Charge; movement/equip/wait and
instant status branches are smaller. Current effect hooks block linked/repeated
effect programs, so structural hit/target ranges are not an execution proof.

Older admitted deferred follower-end records can execute up to four extra
end hooks before the next completed unit; retain and charge them even though
current hooks do not defer/replan. Room is knowledge-only, scans/spawn/populate
emit none, fieldUpkeep only Water Sport expiry and wind at most one warning.
End's own forced loss is included in E=340; four extra forcedLoss calls cover
prephase/effect/after/phase-boundary alternatives. Settlement/floor/Steel
transitions can emit at most two final lifecycle notices before actual exit;
their growth was already charged in G.

| Whole chunk allowance | Opportunity | Flush recipient | Otherwise-empty phase |
| --- | ---: | ---: | ---: |
| One action A | 1500 | 0 | 0 |
| End hooks, including four older deferred predecessors | 1700 | 1700 | 1360 |
| One begin + AI | 12 | 12 | 0 |
| Four additional forcedLoss calls | 48 | 48 | 48 |
| Shared link clears L | 133 | 133 | 133 |
| Shared growth G | 396 | 396 | 396 |
| Tile collector | 0 | 2 | 0 |
| Wind + Water Sport expiry | 2 | 2 | 2 |
| Final lifecycle | 2 | 2 | 2 |
| Exact conservative sum | **3793** | **2295** | **1941** |
| Rounded allowance | **3800** | **2300** | **1950** |

The largest allowance leaves296 below4096. Immediate damage/revival/faint,
forced loss and required cursor updates complete before yield. New effects,
automatic action chains, propagation, extra-party entry/growth or tile output
patterns must revise this proof before implementation; unknown output still
encounters the existing guard. This arithmetic is source evidence, not a game
execution or measured performance result.

## Deliberate transient presentation API change

`turns/presentation-events.js` wraps exactly one synchronous tile hook. Every
Wonder Tile reset and canonical pickup still runs in the original order.
Consecutive exact `message/wonder-tile` notices become `messageRepeated` when
count>1; consecutive tile `itemChanged` notices become new `pickupChanges` when
count>1. Singletons retain their old event shape and renderer filtering. Counts
are positive safe integers checked by both collector and Adventure. Different
item IDs are counted invalidation notices, not duplicate items, quantities or
a retained per-lot audit log. The renderer reports completed pickup changes and
asks the player to check toolbox/held state; it does not imply all lots fit.

The current tile hook emits Wonder notices followed by pickup notices, hence
at most **two** published events regardless of imported co-located record count,
with constant collector memory and exact counts. Any unknown event closes the
run and stays verbatim/in order. Combat, movement, floorChanged and all prompt,
terminal and progression notifications remain unchanged. Event IDs are monotone
in published order and stamped at commit. There is no global deduplication,
saved backlog, unbounded ID array, fake/truncated count or catch/retry overflow.

## Domain, browser and acceptance owners

Adventure centrally blocks every player mutation while continuing, including
face, SET and equipment; presentation intents and save/export stay usable.
`leaderInputReady` is simulation readiness, independent of asset readiness.
`automaticTurnReady` admits only a whitelisted continuing PC or the distinct
fresh-floor initializer; advancing at ordinary input does not consume an empty
turn. Menus can inspect/save a continuing checkpoint without simulation time.

The shell owns one RAF continuation pump with at most one dispatch per frame.
It captures application binding epoch, Adventure/domain epoch, snapshot identity
and revision, rechecks them plus all pause/readiness gates, then obtains fresh
commandContext. Entering continuation cancels queued player input; cadence
rearms only at real leader input. Each committed chunk is presented once and
queues autosave through the existing coalescing repository owner. Histories are
never concatenated; automatic chunks bypass the280ms player clip-idle delay.
Fresh floors and loaded continuing saves start the same pump after assets are
ready. Replacement/load/disposal, hidden document, graphics loss, blur and user
menu/save pause cancel scheduled work. Resumption uses the saved PC. Stale render,
menu and save callbacks cannot gain dispatch authority in a replacement binding.

Independent static review must cover128 wild slots, incapacitated leader/status
replacement, deferred/special movement, large co-located trap/money batches,
genuine prompt/terminal/floor outcomes, every saved PC, and stale replacement,
load/menu/save/render callbacks. Review of this prerequisite precedes public
Stun activation. Human keyboard/touch/visual, maximum-envelope latency/device,
and save interruption/reload acceptance remain open under D05. Atomic hook scans,
pathfinding and full copy/validation/serialization may still take appreciable
synchronous time. A strict maximum-frame deadline would need separate resumable
tile/serialization owners; no runtime performance evidence is claimed here.
