# Town and ordinary rescue work

Continuation of the reviewed Thunderwave route at MAIN(4,0). The first town day,
bank/storage/shop transactions and real ordinary jobs now reach Diglett's
request at MAIN(4,6). Mt. Steel remains gated. Earlier prerequisite sections
below record their original bounded checkpoints; the current integration and
remaining limitations are described at the end.

## Source boundary

The target remains original Blue Rescue Team. Native details below use the
original **Red comparative** source pinned at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; this is not Blue binary proof.
The original Nintendo Blue manual, printed pp36-40, corroborates the purpose of
shops, bank, storage, linked moves, Friend Areas and Dojo, not numerical rules.
New dialogue and presentation are independently authored.

## Bank and storage transaction prerequisite

`src/domain/gameplay/town-economy.js` implements bounded draft-only bank and
storage transfers. The later integration below supplies current UI, scene admission, service access
and confirmation. Deposits
and withdrawals move equal integer amounts, with bank savings capped at
9,999,999 and carried money at99,999. Source `felicity_bank.c:200-263,339-379`
limits selection by both accounts and changes balances only on confirmation.

`kangaskhan_storage1.c:528-565,730-776` and
`kecleon_bros4.c:332-367` reject money/Used TM deposits and transfers exceeding
999 units per item. A deposit consumes the selected toolbox slot, preserving
normalized item identity/payload and clearing stickiness. Withdrawals place a
new slot in the toolbox, never merge with another town stack: source
`items.c:AddHeldItemToInventory`. Ordinary items withdraw singly; thrown
projectiles have a1-99 quantity selector bounded by the stored quantity. Both
ownership and capacity are rechecked on confirmation. Cancellation does not
invoke a transaction. Existing item/economy admission policies remain unchanged.

## Ordinary-job source boundary

`include/constants/wonder_mail.h` has two different enums. Numeric mission
semantics come from **WonderMailMissionTypes**:0 client rescue,1 target rescue,
2 escort,3 find item,4 delivery. `GenerateMailJobInfo`'s older MissionTypes names
are misleading at the same numeric values. Its rank-zero replacement of2 with0
therefore removes escort at Normal rank; it does not remove delivery.

The generator samples `[0,1,2,3,4,2,1,0]` before this conversion. Eligibility
joins seen-species flags, base-form filtering, mail exclusion tables and
pre-postgame exclusions including hero/partner (`pokemon_mail.c:sub_803C110`).
No arbitrary all-species pool or category pruning is authorized. The native
CLEAR_COUNT increments only after successful job-reward processing and resets
on MAIN chapter/substage changes; it is not a count of dungeon clears or days.
The integrated owners below use this bounded source trace; later rank and
mission families remain unresolved.

Focused lint/types and source-boundary checks are the permitted verification.
No game module is imported/executed and no game browser is booted. Full campaign,
human play, visual/device review and release gates remain open.

## First town day and live services

The current successor implements MAIN(4,0)→(4,1) at the next-morning command,
then the first dream/awakening, the empty mailbox and partner conversation,
Pokémon Square tour and Pelipper Post Office/board introduction. Wake completion
sets(4,2); the Square tour sets(4,3) with WARP_LOCK3; the Post Office tour sets
(4,4) with WARP_LOCK0. Each scene completion is a once-only ordered receipt.
The browser's town day2 is presentation/accounting state, not a claim that the
native game exposes that same day counter. MAIN changes reset CLEAR_COUNT.
Native ground map/warp-array staging is represented by explicit browser maps and
travel access, not copied interpreter bytecode. Sources: `ground_event_data.h`
EVENT_DIVIDE_FIRST, EVENT_DIVIDE_INIT_FUNC and M01E02B_L001/L002/L003;
`ground_data_a01p01_station.h` group1; `ground_data_b01p02a_station.h` group19;
`ground_data_b01p01a_station.h` groups24/25; `ground_data_t01p01_station.h`
group6; `ground_data_t01p03_station.h` group12.

The town UI now exposes working Kecleon item/Wares counters, bank and storage
with selection, confirmation/cancel, ownership/balance checks and persistent
results. Every callback retains the displayed snapshot/binding and owning panel.
Number selection is a local form; only confirmed Adventure commands mutate
state and trigger the existing autosave. Town travel joins the Square, Post
Office, base exterior and interior. Rendering uses original arrangements of
existing local 3D town props and species-specific pixel actors; no visual or
manual gameplay acceptance is inferred.

`ground_main.c:sub_8098CC8` selects shop tier0 before MAIN(11,0).
`items.c:ChooseKecleonShopInventory/ChooseKecleonWareInventory` draws eight item
lots and four Wares lots with two[0,9999) rolls per lot. Category/item selection
uses the first positive threshold greater than or equal to its roll, from
`dungeon_info.c:sRandomItemsSetKecleonShop1/sRandomItemsSetKecleonWares1`.
The full pools remain intact. `InitBulkItem` supplies each projectile's source
half-open spawn range; ordinary lots contain one item. Display ordering uses
`data/item/item_data.json:order` followed by decreasing quantity. The new fact
exporter reads these sources as data; it never executes game/native modules.
The saved jobsRewards stream owns the browser's shop draws; no native RNG
sequence compatibility is claimed.

`TownState.serviceStock` now has a discriminated **lots** alternative. A lot
contains its own template and quantity, and duplicates remain distinct.
Normalized bank storage continues to use one StoredStack per item identity.
Whole-lot purchase consumes one toolbox slot and the entire quoted price,
removes that lot and advances the counter's stock revision. No partial lot
purchase, incidental merge, stock replenishment on reopening or addition of
sold goods is fabricated. Sale consumes one selected toolbox slot. Both paths
recheck source affordability, twenty-slot capacity and99,999 carried-money cap.
`kecleon_bros1.c:HandleKecleonBrosBuyItemYesNoMenu` and its sell counterpart;
`kecleon_bros4.c` sale bounds; `items.c:GetActualBuyPrice/GetActualSellPrice`,
`IsShoppableItem`, and `AddHeldItemToInventory` own those facts. Prices multiply
projectile units and do not add a stickiness discount.

The earlier town-only checkpoint deliberately had no generated offers or ordinary expedition
entry yet. CLEAR_COUNT stays0, so Diglett/Mt. Steel cannot unlock. Gulpin and
Dojo transactions remain explicitly unavailable; Friend Areas retain their
later native gate. Purchased TMs, orbs and Warp/Stun Seeds are owned and storable but their use
consumers remain unavailable. The shared item prerequisite now supports Big
Apple, Max Elixir, Plain Seed and Reviver Seed; ordinary expedition entry remains
gated until its job consumers are implemented.

### Shared restorative items

Pinned comparative `dungeon_item_action.c:sub_80479B8/MaxElixirAction` and
`move_orb_effects_2.c:RestorePPTarget/sub_8078B5C` supply Big Apple100 Belly,
+10 maximum only when already full (cap200), and Max Elixir restoring every
existing move to base PP without altering links, seal or experience flags.
The berries/seeds/vitamins category contributes5 Belly, including Max Elixir,
Plain Seed and a deliberately eaten Reviver Seed. The inventory explains that
eating the latter consumes its passive revival opportunity.

`dungeon_damage.c:604–650` requires Item Master and a clean Reviver Seed, checks
the held slot first, then team bag order, changes that same instance to Plain
Seed, fills HP/Belly and clears temporary conditions/stat stages/speed counters
before any faint/EXP/loss settlement. The following `sub_806A390` call restores
every learned move to base PP while preserving sealed flags (corrected in v14).
The shared faint and forced-loss consumers cover combat, fixed
item damage, poison and hunger; revival does not use failure retention rolls.
Unsupported auxiliary/tether conditions remain blocked by current admission;
future support must also clear cross-actor Leech Seed/Destiny Bond tethers as
the native helper does. No old admission body/hash is changed.

## Save boundary

The seen-history prerequisite content revision was v7-seen. Exact held-v2/v3-team/v4-morning/v5-
Thunderwave/v6-town envelopes, timestamps and SHA-256 authenticate before their
original admission policies. A guarded conversion advances revision and
contentRevision, adds qualified seen history, then validates the entire current
snapshot; invalid/unknown input stays rejected without storage mutation.
`opening-campaign.js` retains the accepted v5 factory; `town-campaign.js` retains
the exact v6 factory, binding its authoring import to `createTownOpeningContent`.
All old policy bodies/hashes remain unchanged;33 module,11 function-body and2
manifest pins include the accepted v5 and published1991d70 v6 boundaries.
The old exact CampaignState root remains separate: only the new v7 revision
selects CampaignStateWithSeen, which requires speciesSeen. No optional field or
union admits new fields into v2-v6 snapshots.

### Recorded species history

Native `pokemon.c:124,248` records roster creation/recruit placement;
`dungeon_damage.c:679` records the defeated identity only when the actual
attacker is the team leader, after revival fails. The shared combat/fixed-item
boundary now receives that attacker explicitly. Spawn and visibility do not
set this flag. `ReadExclusivePokemon` restores saved bits, not gameplay sightings.
New games initialize complete history from recruitedHistory (the two starters).
Older saves initialize the same evidence-backed roster facts after authenticating
old admission, mark history `legacy-incomplete`, and keep its conversion revision.
Discarded wild actors cannot reveal who defeated them and are never guessed.
Import/continue explain the limitation: future leader defeats populate the job
pool. The marker is retained; later encounters do not prove old history complete.

Identity records retain exact species/form flags. Admission requires unique
catalog forms, every historical recruit, and only reachable early encounter
sources with Blue eligibility. Job eligibility will separately apply native
base-species normalization and bans; this is not global generator eligibility.

## Ordinary generator prerequisite

`early-job-facts.js` is projected by the static Python exporter from pinned
comparative text plus qualified catalog joins. `job-generation.js` has no UI
caller yet. It preserves native-order seen-species selection, Pidgey/Wurmple
no-eligible fallback, numeric mission draw `[0,1,2,3,4,2,1,0]`, Normal-rank2→0
replacement,24-bit seed, target/reward distinction and subtype samples.
`GetBaseSpecies` is form normalization, not an unevolved-species filter.
The exporter proves all ten early candidates are base forms and absent from
both native ban tables, no complete parent/friend/escort pair is eligible,
and no preferred-gummi item intersects either early target mask. Thus native
subtype transformations have zero candidates here; their samples are retained.
Hero/partner exclusion and recorded seen flags remain runtime predicates.

`GenerateMailJobDungeonInfo` uses conquered eligible dungeons once MAIN is after
(3,3), per `CheckQuest(QUEST_UNK1)`. Here both Tiny Woods and Thunderwave are
conquered before the town introduction. Source floor-count halves produce
Tiny Woods2–3 and Thunderwave3–5. Existing board/mail/accepted occupancy rejects
matching floors, with escort occupation excluding the whole dungeon. Circular
dungeon/floor search retains source selection order. Board generation makes
5–8 attempts, stopping when five total legal locations are exhausted.

Source item masks exclude projectiles/money/used TM. Tiny Woods targets Oran or
Pecha; Thunderwave additionally targets Cheri, Sleep Seed, Blast Seed or Apple.
All these source locations have mission difficulty1 and5 rank points. Reward
set1 contains Gravelerock, Reviver Seed, Cheri Berry and Max Elixir with native
category/item thresholds. Each `sub_803C37C` call discards one complete item
sample before returning the next, then rejects target/reward equality. Board
reward kinds0–3 retain money/item/extra distinctions. Extra item draws occur at
reward processing, not board generation. Browser xoshiro streams and rejection
resource bounds remain the documented engineering adaptation; no native seed
interoperability or exact DS RNG call stream is claimed.

Take/Suspend is separate from board acceptance: `AcceptJob` copies mail5 into
a free accepted slot; `wonder_mail_802C860.c:245,251` toggles taken6/suspended5.
Ordinary board acceptance does not delete its displayed offer; duplicate
acceptance must instead be rejected/marked until board refresh.

### Failed find-item return gate

`sub_8096AF8` alone is insufficient: it recognizes taken find6 plus matching
returned toolbox ownership, without a floor-visit predicate. But failed ordinary
81 returns skip the reward station. `ground_event_data.h:5054–5069` routes only
STARTMODE_DUNGEON_WON/10 to SELECT56; other results go to EVENT_S00E01A_L001
(2926–2932), NEXT_DAY and home without rewards. `main_loops.c:834` clears native
7/8/9 objective records on loss, preserving taken6 for retry. The later eligible
return must recheck ownership after its own settlement; no failed reward/count.

## Shared reward inventory prerequisite

`reward-items.js` owns one promised item slot; existing scripted single-item
rewards now delegate to it without changing their admission. Ordinary reward
queues will retain a persisted cursor and invoke it only inside the same draft
that advances that cursor. It is not yet an ordinary-job reward UI.

Pinned comparative `code_801B60C.c:176–202,279–316,404–462` first allocates a
fresh toolbox slot (never projectile stacking), then sends the whole quantity
to storage when the bag is full and the per-item total fits999. When neither
fits, the source offers discarding the received item, or replacing a selected
whole toolbox slot. That old slot can be stored if it fits or discarded after
confirmation. `kecleon_bros4.c:sub_801ADA0` excludes money/Used TMs and checks
whole-quantity storage; `items.c:MoveToStorage` normalizes per-item ownership.
The shared owner preserves clean stored templates, slot order, item identity
removal, and all-or-nothing quantities; ten reward rocks require ten storage
units. A missing choice writes nothing. Stale/invalid confirmations fail before
writes; caller transaction rollback protects item allocation and events.
Selection/cancel and confirmation presentation remain in the future reward UI.

Ordinary rescue actors have separate targeting rules: native rescue-target
behavior is ignored by generic move targets and Gravelerock target/hit checks,
and its AI walks in a random direction instead of chasing/attacking. Eaten
Blast Seed uses the front-tile entity path without that role exclusion
(`dungeon_item_action.c:565–610`, `dungeon_misc.c:746–763`). Its fixed damage
can faint a client and set the leader-attributed seen flag/award experience.
Generic faint only forces the special joined-at-client escort loss;
`HandleBossFaint_Async` does nothing for CUTSCENE_NONE, so an ordinary rescue
client faint is not a whole-expedition loss. These consumers are integration
requirements, not blanket damage immunity.

## Ordinary job lifecycle integration prerequisites

Generated records now retain posting origin, native24-bit seed, numeric mission,
target item, promised item and reward kind. The additive generated-source shape
keeps the existing generation-policy discriminator. `suspended` represents
accepted native5; `accepted` represents taken6. All predecessor content policies
still require no jobs. The exact predecessor v7 root still rejects `earlyWork`; no predecessor command
or current policy enables ordinary expeditions at this prerequisite checkpoint.

`job-records.js` owns board refresh, eight-slot acceptance, separate Take/Suspend,
and deletion. Accepting a board request keeps its visible offer; accepting mail
removes its mailbox slot. Removing the accepted copy permits accepting a still
visible board offer again. Occupancy includes board, mailbox and accepted jobs,
including suspended jobs, but excludes detached claimed history.

Mailbox delivery retains the source sampled fill bound, four-slot capacity,
pending flag and queued/read newsletter priority. In `sub_80961D8`, the news
`goto _flag` continues the loop: remaining slots can receive jobs. Native reward
kinds4–7 promise200Poké,200Poké plus item, item, or item plus two distinct extra
items. Board type3 adds one distinct item. Extra draws occur only at station
preparation; every pair is distinct. Difficulty1 grants5 rank points per receipt.
The source Friend Area helper still samples its four unowned mail-only areas
before rankF discards that result and rewrites reward8 to4. The exporter now
verifies those four native areas and their initialized-unowned source facts.

The ground timing is significant. `ground_main.c:216–229` refreshes shops,
board and pending mail before successful reward processing; completed accepted
slots still occupy their floors during this refresh. Reward cleanup then frees
those floors before morning mail. Thus mailbox jobs are reachable after one
receipt even though an immediately refreshed early board covers every free
location. Failure clears completed native7/8/9 in `main_loops.c` before ground
refresh and never invokes the reward station. Unfinished taken6 remains retryable.
Base map9 groups5/7 route through group8 opcode3b04 to delivery; the interior
morning routes back there. MAIN(4,4) with at least two reward receipts prioritizes
the Diglett request before the normal morning/mail path.

`job-objectives.js` owns taken-job expedition objectives, exact floor/client
binding, complete-slot delivery consumption and outcome transitions. Find-item
eligibility uses returned toolbox ownership without a mission-floor requirement;
held items do not count. Item loss precedes eligibility. Successful candidates
must be rechecked individually at the station so one item cannot satisfy two
requests. Completed clients become reward-ready only after success; losing after
rescuing a client removes that completed request without a reward. An unfinished
or fainted ordinary client leaves its taken request retryable.

The shared expedition kernel now has an explicitly selected ordinary purpose,
ordinary final stairs and client placement/objective hooks; the predecessor checkpoint selected only story purpose. A client replaces the first monster placement
without a wild-species or spawn-sleep sample and adds the source mission enemy
count/Monster House suppression. The actor uses source level1 growth/moves,
neutral affiliation, random-direction AI and client presentation. Generic moves
and arc projectiles exclude it before hit RNG; eaten Blast remains unchanged.
Floor exit clears transient actor references while preserving completed state.
No story rescue, clear receipt or story item is replayed by the ordinary branch.
The current v8 integration below supplies save admission, no-turn dialogue,
reward queue UI and Diglett scenes.

Review correction: acceptance callers in `pelipper_board.c:378–381` and
`mailbox.c:416–418` invoke `SortJobSlots` after copying the request. Its native
dungeon/floor order now shares a comparator with mailbox sorting. Take/Suspend
and deletion preserve that order, which flows through settlement into station
eligibility. With only one returned item for two find-item requests, the earlier
native floor is therefore processed first rather than the first accepted job.

## Current v8 ordinary work and Diglett boundary

The source owners are now admitted and presented. At the Post Office the board
shows real generated offers; the base mailbox receives news and native mailbox
requests on eligible later mornings. Accept copies a request into the eight-slot
Job List as suspended. Take/Suspend/deletion preserve native dungeon/floor order.
The base departure selector enters a shared ordinary Tiny Woods or Thunderwave
run, with taken requests bound to their real dungeon/floor. Returning never
replays Caterpie/Magnemite scenes or duplicates story clear/reward receipts.
Bank/storage/shop service confirmations remain available between runs.

A leader talks to the client on the facing tile with the shared native melee
terrain/corner geometry. `dungeon_main.c:491–497` handles TALK_FIELD inside its
input loop, so opening/confirming rescue or delivery, the leave question and its
second confirmation do not advance a turn, timers or AI. `dungeon_jobs.c:83–143`
consumes a delivery's first eligible whole toolbox slot, marks native8 and removes
the client before offering immediate exit. Leave defaults yes; really-leave and
continue-adventure default no. Denying either second question returns to leave.
The domain blocks movement/items/facing/advance while this persisted prompt owns
input. Cancelling the initial rescue spends no turn. A missing delivery item
retains the request/client. The native talk predicates block supported sleep and
confusion/infatuation, but not paralysis or poison alone. Native target wake
clears indefinite sleep/petrification before eligibility; current neutral clients
have no reachable source for those conditions, so no substitute cure is invented.

Every successful ordinary return retains an ordered candidate cursor. All taken
find requests in that dungeon are candidates regardless of listed-floor visit
or initial returned ownership. `textbox.c:SPECIAL_TEXT_UNK_22/23` and
`code_80958E8.c:sub_8096AF8` recheck ownership as each native slot is reached: an
earlier reward item may satisfy a later find, while one slot cannot satisfy two.
`thank_you_messages.c:201–206` consumes the first matching complete toolbox slot.
Delivery has already consumed its item in the dungeon. Missing finds remain
taken for retry. Failed ordinary81 returns never enter this station; completed
client requests are removed, unfinished requests remain, and no count is earned.

Prepared extra rewards and the next item cursor persist before an overflow
choice is exposed. Every transfer and cursor change share one draft, including
discarding the received item or storing/discarding a selected whole old slot.
Reload cannot reroll extras or grant an earlier slot again. Money, rank points,
claimed history, accepted-list removal and the displayed receipt commit after
all item choices. This browser atomic final receipt adapts native TYM_Create's
earlier count increment: no menu click or interrupted inventory prompt earns a
receipt. Money caps at99,999 and each early difficulty1 receipt grants5 points.
The result distinguishes promised items from items kept, stored or discarded.
Native successful client rewards unlock exclusive variants, not seen flags;
no new exclusive flag is needed for the finite early Blue-enabled pool.

Return cleanup preserves source ownership: `pokemon.c:1004/1016` converts retained
held items with `ItemToBulkItem`, dropping flags; `ground_main.c:sub_8098CC8` ends
with `items.c:ClearAllItems_8091FB4`, clearing retained toolbox stickiness after
shop/board/mail-pending refresh. Ordinary held/toolbox instances retain their
identity and quantity while their sticky bit clears. Existing pickup already
converts Poké to money, so no invented bag-money case is admitted.

Each ordinary return advances the browser day exactly once after all receipts.
At MAIN(4,4), at least two actual job receipts select the next morning's Diglett
request before normal mail delivery. Independently authored Dugtrio/partner
scenes then set MAIN(4,5) and(4,6), resetting CLEAR_COUNT on each native scenario
assignment. Mt. Steel is visibly unavailable. Normal rank's native type2→0
conversion makes escort unreachable here: the rank threshold is50, each receipt
is5, and at most one preceding receipt plus three same-dungeon objectives can
reach the mandatory gate. No point cap, generator filter or invented objective
is used to enforce that bound. Escort consumers are required before later
rank/route admission can expose them.

### Save and validation boundary

Current revision is v8-work. Its exact root adds nullable `earlyWork`; pre-town
states have no owner, while town work records the initial story-expedition
baseline, board IDs, four mailbox slots/read news/pending flag, no-turn prompt,
returned dungeon/session/candidate cursor and prepared reward/item cursor.
Current-only policies validate explicit source job metadata/people/items,
posting ownership/conflicts, accepted and station order, objective/client joins,
rank/count/day receipts and exact Diglett scene progress. They reuse predecessor
numerical/floor/town prerequisites only after checking the changed facts.
Rescue-stage admission and confirmation share the live client-interaction
predicate, including the actual leader input boundary, facing tile, terrain
geometry and supported talk eligibility. Already-rescued exit stages retain
separate off-map checks. A persisted reward item cursor must route to a real
full-toolbox/full-storage choice; available-space contradictions are rejected,
never repaired by replaying transfers or rerolling extras.
The separate v7 root, factory, authored body and seen policy are frozen; all
older module/body/manifest hashes remain unchanged. Additive pins now cover34
modules,13 exact bodies, two manifests and both predecessor root shapes.

Each v2-v7 import authenticates its original envelope/hash and exact original
admission before conversion. Existing seen history is retained; older missing
history remains explicitly incomplete. A legacy town save preserves its old
scene, cursor, day and receipts, then gets a newly generated prospective board
because prior postings/mail history were never stored. The UI explains this
limitation at import/continue and at town. It does not reconstruct past mail,
invent defeated species or claim an exact historical generator pool.

### Remaining scope and acceptance

This interval implements numeric mission0/1/3/4 and board/mail reward0–7. Later
escort, Friend Area/recruitment access, Gulpin, Dojo, higher ranks and every later
route remain separate full-campaign work. TMs, orbs, Warp Seeds and Stun Seeds
retain honest carrying/storage/purchase and explicit unavailable-use feedback.
The shared basic food/berries, Sleep/Blast Seed, rocks, Max Elixir and Reviver
consumers are live; the complete move/status/AI catalogs remain partial. New
neutral clients do not imply all target/effect families are implemented.

Verification is static source parsing/lint, strict types, source/data exporter
checks and immutable predecessor pins only. No game source was imported or
executed, no game browser was booted and no automated playthrough ran. Human
acceptance still needs actual board/mail selection, multiple objective types,
no-turn dialogue/geometry, failure/retry, same-item reward ordering, overflow
choice/cancel/reload, old-save continuation, Diglett staging, controls and visuals.
Full campaign, Blue binary verification and P36/P37 release gates remain open.
