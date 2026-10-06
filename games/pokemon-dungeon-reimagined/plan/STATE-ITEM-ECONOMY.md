# Item and economy state policies

This bounded P07-B dependency supplies concrete `item` and `economy` policies.
It does not assemble CampaignContent or implement item actions, grants, banking,
recruitment, expedition settlement or a playable campaign.

## API and admission

| Export from `content/state.js` | Contract |
| --- | --- |
| `createItemPolicy({effects,campaign,dungeons})` | Synchronous `CampaignStatePolicies.item` |
| `createEconomyPolicy({effects,campaign,dungeons,species})` | Synchronous `CampaignStatePolicies.economy` |
| `decodePokeQuantity(nativeIndex)` | Exact native money lookup index 0-99 to canonical monetary quantity |
| `encodePokeQuantity(amount)` | Exact inverse; rejects amounts absent from the source table |

Dependencies are existing validated local catalog objects. Exact structural,
identity and graph validation precedes these policies. Item arguments must be
the actual records in the specified frozen archive, as passed by the canonical
validator. Policies never repair input, transfer items, grant money or mutate
catalogs. Disposed dependencies throw and therefore block canonical admission.

Both policies return the exact RuleCheck union. Invalid quantities, payloads,
ownership and capacities produce invalid diagnostics. An unsupported acquisition
or event route produces a named unresolved requirement. Economy bounds
diagnostics and requirement sets to 100. No content readiness flags or arbitrary
membership callbacks can substitute for the concrete catalog joins.

## Item representation

| Source item | Canonical quantity and payload |
| --- | --- |
| Line/arc projectile | 1-99 units; `payload.kind:'none'`; spawn ranges are not inventory stack caps |
| Ordinary item, including Link Box and Regi objects | Exactly one; `payload.kind:'none'`; no invented charges or story variants |
| Unused TM/HM | Exactly one; machine payload with the exact taught canonical MoveId and `state:'unused'` |
| Used TM | Exactly one; machine payload with `state:'used'` and a unique nonreusable TM origin |
| Poké pile | Decoded source monetary amount; no machine/charge/story payload |
| Empty-slot sentinel | Invalid as an item instance |

There are 45 canonical nonreusable TM origins and eight reusable HMs. Two other
TM rows, Excavate and Spin Slash, teach source-only actions without canonical
MoveIds. Those records return `item-machine-source-action:<item-id>`; their
presence does not block construction of policies for supported items. An HM
cannot become a Used TM. The native Used TM quantity-byte origin is represented
by the canonical move instead of overloading the stack count.

Native Poké quantity indexes `gUnknown_810A3F0[100]`, not money directly. The
canonical quantity is its decoded amount so account arithmetic consumes actual
Poké. Static source comparison established that all 100 values are distinct;
for every index `i`, `encodePokeQuantity(decodePokeQuantity(i)) = i`, and for
every listed amount `a`, decoding its inverse returns `a`. No native index
identity is lost by this mapping. Amounts range from 4 to 20,000 but only the
listed values are legal piles; account balances can use every bounded integer.
Native serializers are not implemented and cartridge-byte compatibility is not
claimed. New generators and native-format adapters must call the conversion at
their boundary, never treat a monetary amount as a native index.

Portable ordinary items may retain stickiness. Town/entry-history held and
toolbox items are clean; storage also strips sticky state. Poké and the four
Regi objects are excluded by the source special-item stickiness guard. Held
containers and floor placements contain at most one stack, while a toolbox has
twenty occupied slots. A projectile stack consumes one slot. Result escrow has
no invented toolbox cap; its reward owner must define its bundle and settlement.

Live items use `state.items/containers`. Entry history resolves its named active
or suspended session and exclusively uses that entry archive's home-shaped
owners. Rescue-suspended items resolve the exact request and its separate archive,
with expedition owners. No history lookup falls back to live inventory. Home,
entry-history and reward escrow cannot retain a shop-lot claim. Existing graph
checks additionally require one reciprocal owner, valid actor/map relationships,
and exact shop-lot template agreement; shop debt belongs to its separate policy.

## Acquisition evidence and explicit blockers

Ordinary generator membership is joined through canonical dungeon/section/
variant/floor records, enabled floor/buried/shop/Monster House generator
parameters, and positive effective category/item draw counts. This yields 198
item identities. Excluded source-only floors and disabled shop contexts do not
grant membership. A candidate pool route does not promise an item on every
generated floor; geometry, campaign entry and generator consumers still own the
actual spawn. Fixed treasure identities and the declared duplicate-to-Link-Cable
route remain separate accepted evidence.

Only ordinary mission reward set references 1-15 can support this admission;
the accepted random-item-set contract identifies that range. Merely appearing
in uncalled set 25 is insufficient. Plain Seed uses the accepted Reviver Seed
replacement contract. Regi Parts join the campaign's exact boss part identities;
Music Box has the pinned three-Part conversion source. Actual grants, conversion
commands, progression prerequisites and once-only reward receipts remain their
transaction owners' responsibilities. Snapshot validation is not a fabricated
acquisition history: ItemInstance has no source receipt field.

The following stay unresolved, not silently obtainable:

- Gold Fang, Cacnea Spike and Corsola Twig: only unestablished set-25 routes.
- Alert Specs, Ring D/E/F, Observer/Reviver/Possess/Toss Orbs, Switch Box,
  Beatup Orb and GMachine 6/7/8: no accepted acquisition route.
- Excavate/Spin Slash TMs: source-only moves, reward blacklist, and disabled
  Buried Relic shop contexts.
- Weavile/Mime Jr. figures: the source delivers sculpture event flags. A canonical
  event-reward consumer is required; possession as an ordinary item is not granted.

Other unresolved *effect execution* subfields do not invalidate a supported
item's identity, payload and possession. Using or throwing it still requires its
actual effect implementation; this policy does not attest to one.

## Economy and accommodation

| Invariant | Accepted rule |
| --- | --- |
| Carried money | Integer 0-99,999 in each applicable account/history |
| Bank savings | Integer 0-9,999,999; remains separate from expedition cash |
| Storage | One normalized record per item ID, count 1-999; projectiles count individual units |
| Storage payload/stickiness | Clean template; unused machine mapping retained; no Used TM or Poké deposit |
| Friend Areas | Exact 57 catalog IDs; each capacity joined by source symbol, total 413 slots |
| Residents | All permanent individuals count once, including hero/partner/reserved entrants; actors/history do not count twice |
| Expedition reservation | Home toolbox and carried wallet empty while the active/suspended expedition owns them |
| Held reservation | Unsettled entrants' home held slots empty; settled participants may have returned belongings |

The generic state shape stores complete templates, but legal source storage is
normalized: different flags or payloads cannot create independent 999-unit
allowances for one item ID. Nonprojectile storage count is a number of individual
items, not a portable stack size. Legal machine identity determines its unused
payload; storage does not retain Used TM origin or sticky flags.

Area capacities use the existing catalog's source-symbol crosswalk, including
the source `AGED_CHAMBER_O_EXCLAIM` spelling mapped to the canonical O? area.
Accommodation uses each permanent record's assigned Friend Area. It does not
reassign evolved Pokemon to the current species profile's native area or count
temporary actors as permanent residents. Evolution/recruitment policies still
own lawful allocation and transfer.

Separate home/session records are a browser ownership representation of the
source's single carried wallet/toolbox. Entry/exit must transfer them atomically.
Historical entry cash/items are observations, not spendable escrow. This policy
does not rerun entry deletion/reset, restore lost money, infer the selected
route's entry cap, or settle gains. Positive dungeon entry item limits count
toolbox slots only, and zero-item entries delete selected held items too;
`expeditionEntry` must validate those actual projections and all exit policies.
Bank/storage services, grants and current ownership entitlements remain town,
progression and reward transaction responsibilities.

## Primary sources and static evidence

All new native facts retain original-Red comparative qualification at commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; original Blue is the target. No Blue
instruction-level parity is claimed. Repository files were read, never executed,
and their Git blob SHA-1 values were verified over complete file bytes.

| Pinned source path | Facts | SHA-256 |
| --- | --- | --- |
| `include/constants/item.h` | Inventory and money limits | `8786b3352a0cb539a150ae887b2ad8282e5315d80bde21d728094648261dcc03` |
| `include/structs/str_items.h` | Item flags, BulkItem fields, per-ID storage | `b0e705c1aab0893578f61f69b006ab4a404789d623a59feae7c27b00171ff4cb` |
| `src/items.c` | Stack categories, TM origin transfer, storage guard/count, money conversion and return cleanup | `b7fb55af3420e0afd9df767d0abda097e91c171882f3374672867afe17d16d5c` |
| `src/dungeon_data.c` | 100 money values and 57 area capacities | `ca56c6807cb1a2918e9fee4bf4f8410fbde21ad52e3bcbfdffaa6d5766af66b4` |
| `src/friend_area.c` | Slot capacities, leader/partner accounting and area ownership | `6b675a3aa0dcddcfae224fc427efea4259c43bc01cecc8b348934c306c197ca8` |
| `src/dungeon_items.c` | Projectile merge cap, sticky generation guard and MusicBoxCreation_Async | `c8ebcbae06bd7d151750e5a9b3f7cbf65939d7a0422d69e587ecfe53a7c46790` |
| `src/kangaskhan_storage1.c` | Deposit guard and maximum-99 projectile withdrawal | `09f6586c4d4104a9ec3a42e0d40ea04a08151d29ddb518225fa9176b74dc1a67` |
| `src/felicity_bank.c` | Bounded deposit/withdrawal accounts | `023fe4ef28c69dd14db62d8065471c7c5f551cac27c1525067ff5bd4565c953b` |

[Pinned primary source tree](https://github.com/pret/pmd-red/tree/6bcbec4f906938c0243aa2026bcbd41b577bab85)
contains these exact paths. Existing species/effects/dungeon/campaign/onboarding
catalog qualifications and expedition research remain authoritative within their
recorded scopes; no historical manifest fingerprint was rewritten.

Static checks parse JavaScript/JSDoc and validate catalog JSON. A separate
read-only numerical comparison checked every money-table element, both inverse
relations, every area capacity/source-symbol join and the 45 canonical/eight HM/
two source-only machine split. No check imports or executes game modules, and
no automated gameplay or manual campaign acceptance is claimed.
