# Independent item/economy review

Reviewed 2026-10-06 in the specified worktree against recovery base `2974199`.
Scope: new `content/state/items.js`, `content/state/economy.js`, barrel exports,
`plan/STATE-ITEM-ECONOMY.md`, task brief/report, and their canonical contracts and
accepted source/catalog dependencies. No source edits, staging, commits, game
module imports/execution, gameplay, or whole-game acceptance review occurred.
This report is the only reviewer-authored file.

## Verdicts

| Review | Verdict |
| --- | --- |
| Specification | Pass for the bounded concrete item/economy policies and explicit unsupported acquisition contexts. |
| Code quality | Pass; no actionable defect found in this scope. |
| Complete adapter / release | Not established. Other mandatory policies, construction, mutation/settlement and acceptance remain separate. |

**Actionable findings: none.** The boundaries documented below remain mandatory
when the eventual complete adapter is assembled; these two policies alone do not
authorize campaign admission or establish acquisition transaction history.

## Canonical contract and ownership review

- Factories return actual `CampaignStatePolicies.item` and `.economy` callbacks;
  the barrel adds only these factories and the explicit money conversions.
  No fabricated CampaignContent, revision, initial state or permissive registry
  was introduced. Borrowed catalogs own their loading/disposal and all code stays
  independent of DOM, rendering, browser storage and simulation.
- Canonical `state/policies.js` passes actual detached/frozen archive records;
  therefore `items.js:176-177` reference checks agree with the existing calling
  convention rather than rejecting structurally equivalent inputs unexpectedly.
  The explicit live, named active/suspended entry-history, and request-scoped
  suspended archive resolution at `items.js:161-166` does not fall back between
  namespaces. Scope/container rules at lines 178-185 reinforce existing reciprocal
  graph ownership and prevent home/history/result shop claims.
- Held and floor placements admit at most one stack, toolboxes at most twenty.
  Item checks validate occupied containers; `economy.js:105-111` additionally
  visits every archive container, including empty ones. Result escrow is not
  assigned an invented toolbox capacity; its exact bundle remains the separately
  mandatory result/reward policy's responsibility.
- `economy.js:134-152` checks active/suspended and historical cash separately,
  requires the home wallet/toolbox empty while expedition ownership is reserved,
  and reserves unsettled entrants' permanent held slots while allowing settled
  participants to have returned belongings. Entry archive records remain
  observations; they do not become spendable money or second permanent residents.
  Native entry restrictions, losses and settlement are deliberately left to
  their actual policy/transaction owners, rather than guessed from a snapshot.
- Per-item-ID storage normalization at `economy.js:117-123` is a legal sourced
  subset of the generic complete-template structure. It does not weaken schema
  validation. Duplicate template variants cannot create additional 999-unit
  allowances. The implementation contract records the approved normalization.

## Native limits, payloads and accommodation

- Portable quantities at `items.js:148-153` require positive safe integers,
  projectile stacks 1–99, ordinary objects exactly one, and Poké amounts from the
  actual source table. Spawn-size ranges are not incorrectly used as stack caps.
- `items.js:127-144` preserves portable stickiness but rejects sticky town/history
  and storage templates, and excludes the native special objects from stickiness.
  Storage excludes money and Used TM, consistent with the actual Kangaskhan
  deposit guard. Ordinary Link Box/Regi objects are not assigned invented charges
  or variants. Used TM origins are unique nonreusable canonical moves; an HM
  cannot masquerade as an origin, and unused machines require their exact mapping.
- Data inspection independently confirmed **45 unique canonical nonreusable TM
  origins**, **8 reusable HMs**, and the two source-only Excavate/Spin Slash action
  rows. Those two rows remain explicitly unresolved without preventing the
  construction of supported policies.
- `economy.js:95,113-114,136-137` enforces integer carried accounts/history
  0–99,999 and bank savings 0–9,999,999. Storage counts individual projectiles and
  ordinary items up to 999 per source item ID, rather than portable stack size.
- Independent source/text comparison matched every one of the **100 money-table
  elements** in exact order, established uniqueness, and checked the inverse
  index relation for all 100 values. The canonical decoded-amount representation
  is lossless for the supported native table; conversion rejects absent indexes
  or amounts. Account balances correctly permit bounded amounts beyond those
  discrete pile denominations.
- Every one of the **57 area capacities** in `economy.js:10-68` matched the pinned
  source symbol/value, totaling **413 slots**, and joins the accepted species
  inventory. All permanent residents count once, including hero/partner and
  reserved entrants. Actor/history copies do not create extra residents.
  Accommodation uses assigned areas, avoiding incorrect reassignment of evolved
  residents to their current species' native area.

## Acquisition evidence and blocked contexts

- Read-only JSON reconstruction independently reproduced **198 generated item
  identities** through the canonical dungeon/section/variant/floor joins and
  enabled floor/buried/shop/Monster House parameters with effective category and
  item draw weights (`items.js:54-73`). Excluded floors and disabled shop records
  are not treated as ordinary acquisition evidence.
- The reward join restricts sets to ordinary difficulty-derived **1–15**, in
  agreement with accepted `randomItemSetContract`; uncalled set 25 does not
  establish a route. Fixed treasure definitions, qualified duplicate Link Cable,
  the Reviver Seed replacement, exact campaign Regi part definitions and pinned
  Music Box conversion remain distinct routes (`items.js:100-118`).
- Unsupported set-25 objects, unreached placeholder items, source-only machines
  and sculpture event delivery retain named unresolved requirements. The empty
  sentinel is invalid. Other unresolved effect execution fields do not erase
  supported possession identity, and possession admission does not assert an
  action/grant occurred: ItemInstance has no acquisition receipt. Actual reward,
  progress, result, entry and effect policies remain mandatory.

## Poké owner boundary: independent primary-source trace

The parent specifically queried whether money piles must be floor-only. **They
must not be restricted to floor owners.** Ordinary pickup and ground exchange
have different native behavior:

1. `src/dungeon_items.c:177-184` converts normal leader pickup to team cash;
   `src/dungeon_ai_items.c:461-475` does the same for team AI. Enemy AI bypasses
   that team-only branch and can acquire a held pile through its ordinary item
   branch, so enemy-held Poké is supported.
2. `src/dungeon_menu_items.c:593-595` offers ground exchange with no Poké category
   exclusion. `src/dungeon_action_handler.c:338-387` exchanges the ground item
   directly into a held slot at lines 375-376 or toolbox via AddItemToInventory
   at lines 378-379. Its alternate ground exchange does the same at 393-438.
3. `src/items.c:638-650` copies the raw item into inventory; it does not convert
   money on every insertion. `ConvertMoneyItemToMoney` is a separate operation,
   called by inventory-menu sorting. `ClearAllItems_8091FB4` later converts both
   toolbox and permanent-held money on return.

Thus portable held/toolbox money admission is supported, while home/storage
money rejection is consistent with the boundary cleanup. Result escrow's exact
monetary/item bundle remains its mandatory result/reward owner; item possession
validation is not itself a receipt or permission to invent that reward.

## Independent primary evidence and static verification

Re-fetched the following primary files through GitHub at exact commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85` in `pret/pmd-red`: item constants,
item structs, items, dungeon data/items, Friend Areas, Kangaskhan storage and
Felicity bank. Complete fetched text bytes matched the eight source-read cache
files exactly; independently computed SHA-256 values matched the contract table.
The 100-value/57-capacity comparisons used those verified bytes. Additional money
tracing read pinned dungeon AI, item menus and action handlers directly. These
remain explicitly qualified original-Red comparative evidence for the Blue target;
no Blue instruction-level equivalence or cartridge serialization is claimed.

Primary source tree:
<https://github.com/pret/pmd-red/tree/6bcbec4f906938c0243aa2026bcbd41b577bab85>.
Source was read, never imported or executed. One initially narrow reviewer regex
missed a differently spaced area initializer and the enclosing array declaration;
it was corrected and exhaustive symbol/value comparison then passed. That was a
review-parser issue, not a source-data discrepancy.

| Independently run check | Result |
| --- | --- |
| `npm run lint` | Pass; 174 authored files, static source/module paths |
| `npm run typecheck` | Pass; 98 authored sources, strict static JSDoc |
| `npm run effects:check` | Pass; 27 resources, 356 moves / 413 actions / 240 items |
| `npm run dungeons:check` | Pass; 25 resources and complete floor/variant identities |
| `npm run species:check` | Pass; 386 species / 419 profiles / growth and learnsets |
| `npm run campaign:check` | Pass; closed schemas and qualified source joins |
| `git diff --check` | Pass for tracked worktree changes |

All checks remained static source/data work; no automated game test or playthrough
was run. Passing this bounded review does not complete P07-B or certify gameplay,
other semantic owners, full scope, art acceptance, merge or deployment.
