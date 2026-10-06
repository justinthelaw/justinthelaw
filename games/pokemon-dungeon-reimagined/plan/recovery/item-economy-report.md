# Item/economy semantic policy implementation

Status: concrete bounded policies implemented and statically checked; edits
paused for controller-owned independent review. No complete CampaignContent,
playable campaign, item action execution or acceptance of unsupported items is
claimed. No commits or staging were performed.

## Paths

- New `games/pokemon-dungeon-reimagined/content/state/items.js`
- New `games/pokemon-dungeon-reimagined/content/state/economy.js`
- Added exports only in `games/pokemon-dungeon-reimagined/content/state.js`
- New `games/pokemon-dungeon-reimagined/plan/STATE-ITEM-ECONOMY.md`
- This report; ignored source-read cache under adjacent `item-research/`

No prior join modules, contracts/schema, ledgers, bootstrap, factual catalog
resources or unrelated checkpoint paths were edited.

## Implemented responsibilities

`createItemPolicy({effects,campaign,dungeons})` returns the actual canonical
item-policy signature. It resolves live, active-entry-history,
suspended-entry-history and rescue-suspended namespaces explicitly; verifies
that the supplied records belong to that archive; enforces portable stack,
machine-origin/state, ordinary-payload, sticky/context and owner-capacity rules;
and rejects misplaced home/history/result shop claims. Structural/identity/graph
validation remains mandatory before these semantic callbacks.

`createEconomyPolicy({effects,campaign,dungeons,species})` checks bounded carried,
bank, active/suspended and historical cash; normalized storage counts/templates;
complete archive container capacities; exact Friend Area ownership/capacity;
and atomic home-versus-expedition wallet/toolbox/held-item reservation. Histories
and actor projections do not duplicate spendable resources or permanent residents.
The factory returns ordinary RuleCheck diagnostics, not an always-success guard.

Both use one shared item-template implementation in items.js. No extra private
module or generic callback registry was necessary. Dependencies are validated
catalogs, checked for liveness when used; no DOM, storage, rendering or gameplay
simulation imports were introduced.

Actual economy mutation, entitlement/progression, once-only rewards, source entry
restrictions and settlement remain their command/expedition/progress owners.
ItemInstance has no acquisition receipt; this policy establishes supported
possession and representation, not invented proof that a particular command ran.
This limitation is explicit in the implementation contract.

## Primary-source findings and adopted decisions

Read primary pret/pmd-red files at pinned commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85` through the GitHub connector. All facts
remain original-Red comparative inputs for the Blue target. Eight source files'
complete bytes were independently checked against the fetched Git blob SHA-1;
their observed SHA-256 values and exact paths are recorded in the contract.
Source code was read, never imported or executed. Only independently implemented
logic and numerical tables are added to runtime code.

- `include/constants/item.h`: twenty toolbox slots, 99,999 carried Poké,
  9,999,999 bank savings.
- `src/items.c`, `str_items.h`, storage consumer: per-item-ID storage counts up to
  999; individual projectiles count individually; standard storage rejects money
  and Used TM; flags and origin payloads are not separate storage compartments.
- `src/dungeon_items.c`: projectile merge cap 99, special-item sticky guard and
  three-Part Music Box conversion.
- `src/dungeon_data.c`, `src/friend_area.c`: 57 capacities totaling 413 slots,
  joined via species identity source symbols. Hero/partner use actual slots;
  historical/actor copies are not extra permanent residents. The known O? source
  symbol spelling discrepancy is preserved by the existing explicit crosswalk.
- Normalized storage is a legal subset of the current generic complete-template
  schema, not a weakened structural contract. This was reported to and approved
  by the controller before implementation.
- Canonical live cash/toolbox transfers to the active or suspended expedition;
  home account/toolbox and unsettled entrant held containers remain empty.
  Entry history remains a historical observation. Positive route-specific entry
  caps and destructive reset projections remain expeditionEntry obligations.

## Exact Poké conversion and roundtrip evidence

Native `GetMoneyValue` reads `gUnknown_810A3F0[item.quantity]`, a 100-element table.
The source quantity byte is an index, unlike the canonical ItemInstance quantity.
The controller approved decoded monetary amount as the canonical quantity.
`decodePokeQuantity` and `encodePokeQuantity` expose explicit conversions.

A read-only Python source/JSON review parsed every integer in the pinned native
table and the new JS literal (as text, never evaluated) and required exact ordered
equality. The list has length 100 and `len(set(values)) == 100`. For all
`i in range(100)`, `values.index(values[i]) == i`; every listed amount maps back
to itself through that index. Thus **all 100 native indexes roundtrip exactly**,
with no duplicate-value ambiguity or native-index information loss. Extremes are
4 and 20,000, but only table members are legal money piles. Accounts accept all
bounded integer monetary amounts. No cartridge serializer or byte compatibility
is asserted; future native import/generation must perform the explicit conversion.

## Acquisition joins and exact blocked rows

The policy derives generator membership through accepted canonical dungeon,
section, variant, floor, enabled generator parameter and effective pool-weight
joins. The data-only audit found 198 supported generator item identities.
Fixed treasure definitions, accepted duplicate Link Cable conversion, ordinary
mission reward sets 1-15, Reviver Seed replacement and campaign Regi Part
definitions cover distinct additional routes.

Reading `randomItemSetContract` exposed that table membership is insufficient:
set 25 has no established ordinary acquisition caller. Gold Fang, Cacnea Spike
and Corsola Twig therefore remain `item-acquisition-route:<id>` requirements.
Other unresolved rows are Alert Specs, Ring D/E/F, Observer/Reviver/Possess/Toss
Orbs, Switch Box, Beatup Orb and GMachine 6/7/8. These are not promoted merely
because they have a catalog record. Weavile/Mime Jr. figures produce
`item-event-delivery:<id>` because the accepted source uses sculpture event flags.
The empty-slot sentinel is invalid, not an item.

### Two unused TM exceptions

The catalog contains 55 teach-move item records: 47 nonreusable machines and eight
HMs. Independent data inspection found only **45 distinct canonical nonreusable
MoveIds**; the other two are Excavate and Spin Slash, whose source action records
deliberately have `moveId:null`. Their only referenced shop contexts are disabled
and rewards blacklist them.

The initial join assumption that all 47 machines had canonical moves was rejected
by the data-only review before handoff. The final factory preserves those two
source-only rows without adding them to the canonical Used TM origin map; their
own templates return `item-machine-source-action:<id>`. They cannot block policy
construction for supported items or acquire a fabricated MoveId. Every Used TM
must instead match one of the 45 unique, nonreusable canonical origins; reusable
HMs and ordinary moves cannot masquerade as an origin.

## Validation and self-review

Final commands from `tools/pokemon-dungeon/`, all exit 0:

| Command | Evidence |
| --- | --- |
| `npm run lint` | 174 authored files, syntax/lint/local module-path checks |
| `npm run typecheck` | 98 authored source files, strict static JSDoc |
| `npm run effects:check` | 27 deterministic resources; 356 moves, 413 actions, 240 items, 266 families, 66 statuses |
| `npm run dungeons:check` | 25 deterministic resources and complete field/maze/floor/variant identities |
| `npm run species:check` | 386 species, 419 profiles, 384 numeric resources, 386 learnsets |
| `npm run campaign:check` | Closed schemas, 1,011 predicates, 586 transitions, 83 routes and qualified source joins |

`git diff --check` passed. New source is included in lint/types; no game modules
were imported or executed. No automated gameplay, test suite or playthrough was
added. The user/repository no-game-execution instruction governs over skill TDD
defaults; proof uses source/data comparisons and static checks instead.

Additional read-only numerical review passed exact 100-value money-table equality
and inverse uniqueness, all 57 area source-symbol capacities and total 413,
45 unique canonical TM origins, eight HMs, two source-only actions, and enabled
canonical pool membership. Primary-source byte verification initially exposed
one extra terminal newline added while materializing connector text into the
ignored cache. Removing exactly that added newline reproduced each fetched Git
blob SHA; only those verified bytes supplied recorded SHA-256 fingerprints.
An initial strict-type error from a generated nonliteral `op` union was fixed
by checking the `itemId` field before reading it; no cast weakened the contract.

Self-review covered each scope branch, missing sessions/requests, reference
ownership, portable versus storage counts, Used TM/HM distinction, currency-index
versus amount, no sticky home/storage/special items, duplicate per-ID storage
allowances, count caps, source-only inventories, whole-roster occupancy,
settled-versus-unsettled held reservations and invalid diagnostics taking
precedence over unresolved requirements. No full semantic adapter or permissive
fallback was introduced. Parent owns independent review, full website checks,
checkpoint publication and remaining gameplay integration.
