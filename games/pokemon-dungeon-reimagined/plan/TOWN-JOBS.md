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
later native gate. Purchased TMs, orbs, Warp/Stun/Reviver Seeds, Max Elixir and
Big Apple are owned and storable but have no newly enabled use consumer in this
checkpoint. Existing supported consumables retain their previous consumers;
ordinary-route essentials must be implemented before later expedition entry.

## Save boundary

Current content revision is v6-town. Exact held-v2/v3-team/v4-morning/v5-
Thunderwave envelopes, timestamps and SHA-256 authenticate before their original
admission policies. A guarded conversion only advances revision/contentRevision,
then validates the entire current snapshot; invalid/unknown input stays rejected
without storage mutation. `opening-campaign.js` retains the exact accepted v5
factory body, with its authored import bound to the unchanged v5 body. Current
town policy is a separate wrapper. All old policy bodies/old hashes remain
unchanged;29 module,9 function-body and2 manifest pins now include the accepted
`1b71c26fcc1d5c51decf243eb98f5be89052d7e9` v5 boundary. The additive lot shape
cannot broaden old admission because every old town policy requires empty stock.

Seen-species state is not yet present in v6. Source job eligibility requires
native seen flags. Historical defeated species cannot be recovered from old
completed saves. The planned next conversion must preserve that uncertainty,
initialize only evidence-backed facts and record future leader-attributed faint
triggers (`dungeon_damage.c:679`), plus roster creation/recruitment triggers
(`pokemon.c:124,248`). `ReadExclusivePokemon` merely restores saved bits; it
is not a visibility/spawn trigger. Do not treat every visible/generated enemy
as natively seen or fabricate old encounter history.
