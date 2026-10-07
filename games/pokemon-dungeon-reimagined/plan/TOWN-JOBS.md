# Town and ordinary rescue work

Continuation of the reviewed Thunderwave route at MAIN(4,0). Implementation
is in progress; no functioning service, ordinary expedition or Diglett-request
acceptance is claimed by the transaction prerequisite checkpoint.

## Source boundary

The target remains original Blue Rescue Team. Native details below use the
original **Red comparative** source pinned at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; this is not Blue binary proof.
The original Nintendo Blue manual, printed pp36-40, corroborates the purpose of
shops, bank, storage, linked moves, Friend Areas and Dojo, not numerical rules.
New dialogue and presentation are independently authored.

## Bank and storage transaction prerequisite

`src/domain/gameplay/town-economy.js` implements bounded draft-only bank and
storage transfers. It has no current UI or scene admission; service access and
confirmation belong to the forthcoming town command/UI integration. Deposits
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
