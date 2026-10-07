# Town and ordinary rescue work

Continuation of the reviewed Thunderwave route at MAIN(4,0). The first town day and bank/storage/shop transactions are implemented. Ordinary
jobs and Diglett-request progression remain the next dependency boundary.

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

## Ordinary-job research in progress

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
Generator, objective, reward and seen-history consumers remain under research.

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

The checkpoint deliberately has no generated offers or ordinary expedition
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
before any faint/EXP/loss settlement. `ResetMonEntityData` and `sub_8078084` do
not restore PP. The shared faint and forced-loss consumers cover combat, fixed
item damage, poison and hunger; revival does not use failure retention rolls.
Unsupported auxiliary/tether conditions remain blocked by current admission;
future support must also clear cross-actor Leech Seed/Destiny Bond tethers as
the native helper does. No old admission body/hash is changed.

## Save boundary

Current content revision is v7-seen. Exact held-v2/v3-team/v4-morning/v5-
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
