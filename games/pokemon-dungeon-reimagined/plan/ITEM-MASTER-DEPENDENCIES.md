# Item Master admission and effect prerequisites

Static source research at published checkpoint
`20b0a7f7382e2fb5edb9afd0797b55f122a7ac0e`, recorded during the v17 shared
item-impact checkpoint. This ledger defines the remaining effect prerequisites
for native roster Item Master under the approved full-game plan. T01 shared
recipient impacts and T02 ordinary throws are separate prerequisites; their
status is tracked in [PROGRESS.md](PROGRESS.md). File/line references below
identify that baseline, not future implementations. Application paths are
relative to `games/pokemon-dungeon-reimagined/` unless prefixed with tools/.

Native item flags and behavior references use the pinned original Red source
`pret/pmd-red@6bcbec4f906938c0243aa2026bcbd41b577bab85` as comparative evidence;
they do not establish Blue instruction parity.

## Closed boundary

The complete240-row native item-AI owner has43 nonzero eligibility triples and
197 zero triples. **Fresh construction exposes12 nonzero items somewhere in
early inventory, but only8 can reach a normal active companion's own held slot
through the currently implemented fresh gameplay routes.** Those8 are already
within T01's finite effect surface. Town stock adds Rawst, Big Apple, Warp Seed
and Stun Seed to the bag; it does not give companions autonomous access to that
bag.

The existing validated-state boundary is wider: **40 of the43 nonzero items
are admitted as clean canonical home/storage/portable lots**, including active
companion-held and ground lots. Their admission is supported by the accepted
catalog's later-dungeon acquisition evidence, not restricted to the current
floor-construction list. Gold Fang, Cacnea Spike and Corsola Twig remain
unresolved under the current acquisition-route policy. Rollcall Orb is admitted
but has only the self flag; the native team-orb self-use exclusion recorded in pinned `src/dungeon_ai_items.c:174–195` gives it no normal roster Item Master action.
Thus **39 admitted items require normal roster effect closure:10 in the
existing self/rock surface, plus29 additional item IDs grouped below**.

These are static admission and source-set results, not executed saves or a
gameplay reachability test. No inventory filters, altered old-save policies,
reduced native flags or fabricated acquisition receipts are proposed. T03 cannot
claim closure for the currently admitted active state from the eight-item fresh
companion construction alone.

## Route counts and ownership

| Route | Complete source count / nonzero flags | Actual transfer and boundary |
| --- | --- | --- |
| Initial creation | Empty inventory | `content/state/initial.js:45` initializes empty bag/storage; awakening policy `content/state/opening-policies.js:39` checks that exact state. Item Master is enabled at IQ1 by `content/state/opening-facts.js:8` and `pokemon-rules.js:28`. |
| Generated early floors | Tiny Woods3/2; Thunderwave8/7; Steel15/6. Union17 item IDs/8 nonzero | Data joins over positive category/item effective draw counts and enabled generation contexts give only ordinary floor context for these three routes. `src/domain/gameplay/expedition.js:134–139` materializes those lots; `items.js:83–124` moves eligible ground lots into bag then companion-held, or own-held only before the toolbox grant. Poké converts to money. |
| Kecleon purchases | Item counter13/12; wares counter28/0. Union41/12 | Full unpruned first-tier pools are in `content/authored/town-shop-facts.js:TOWN_SHOP_POOLS`. `town-shop.js:21–35` samples full stock and clean templates; `shopOrderProblem:39–49` checks stock revision, price, money and bag space, not supported-use effects; `applyShopOrder` creates complete bag lots. Town stock validation `content/state/town.js:57–66` checks membership/quantity, not an effect subset. |
| Scripted grants | Union6/3 | `scenes.js:119` grants Reviver/Rawst, `scenes.js:138` grants Oran/Pecha/Rawst, `steel.js:82` grants Pecha Scarf/Ginseng. The three nonzero IDs are Oran, Pecha and Rawst. Reviver's zero selection flags do not disable its separately implemented faint-boundary consumer. |
| Ordinary job rewards | Complete difficulty1 pool4/3 | `EARLY_JOB_FACTS.rewardItems` contains Gravelerock, Reviver, Cheri and Max Elixir. `job-generation.js:earlyRewardItem` uses that full set; `job-records.js:promisedJobReward/prepareJobReward` awards one or two/three distinct full lots as applicable. `work.js:49–55` delivers them through the shared reward owner. Higher reward-set references in generic availability do not mean those sets execute in these early jobs. |
| Friend onboarding jobs | Same reward facts; no new received reward | `friend-job-facts.js` inherits EARLY_JOB_FACTS; `friend-progress.js:77–82` admits only fresh offered friend-board jobs during onboarding, not new accepted/completed receipts. This stage must not be counted as another reward delivery route. |
| Fresh inventory union | 46 distinct item IDs/12 nonzero | Union of the17 floor,41 shop,6 grant and4 reward IDs. Additional IDs beyond stock are Poké, White/Orange Gummi, Pecha Scarf and Ginseng. All zero-flag stock, food/gummies, seeds, equipment and orbs remain in their existing inventories. |
| Storage deposit/withdraw | Does not add fresh source IDs;40 nonzero clean IDs are policy-admissible | `town-economy.js:economyOrderProblem/applyEconomyOrder` deposits whole bag slots; withdrawals preserve stored templates, allocate a fresh bag slot, and permit projectile quantities1..99 versus one other item. `content/state/economy.js:117–125` applies the generic item-template policy with count1..999. Storage has no USABLE_ITEMS filter or held-effect gate. |
| Reward overflow | Does not narrow rewards | `reward-items.js:rewardItemRoute/receiveRewardItem` sends a complete slot to a free bag position or storage, with an explicit replacement/discard choice when neither fits. It does not reroll unsupported native items. |
| Dungeon Give/Take | Leader only, supported-held-effect gate | `commands.js:34–39` requires leader/self and applies `held-items.js:supportedHeldItem` to bag-to-held equip. It is not a companion Give operation. Most consumables have no held effect and pass this gate even if their active effect is unsupported; the four harmful-equipment rows below do not. |
| Friend Area resident Give | Any complete admitted bag lot; no supported-effect gate | `friend-residents.js:42–55` requires ground access to that resident and an existing bag lot; line89 swaps whole held/bag lot IDs. This can give any of the40 admitted IDs to a permanent resident, including the partner, or all12 fresh-source eligible IDs to an accessible resident. It does not by itself create an active dungeon actor. |
| Active-party assembly | Original pair in active early expeditions | `expedition.js:35` requires selectedPartyIds.length===2. `enterOpening:70–77` creates actors in selected order; `actors.js:24–31` transfers each permanent held lot and IQ flags intact. `friend-progress.js:69–71` permits only story Magnemite as an extra resident and keeps the original pair selected first; adding Magnemite makes three selected IDs and fails entry. |
| After resident Give | Ground preparation only in this baseline | `friend-progress.js:41` requires no active session and null moveState during onboarding. `friends.js:65` changes storyNodeId to FRIENDS.story; `work.js:20` requires the distinct TOWN.story for ordinary departure. `steel.js:17–18` no longer admits completed Steel; story Tiny/Thunderwave prerequisites in `expedition.js:32–35` also fail. Even with exactly the original pair, there is no implemented post-Give dungeon continuation. Do not invent one for T03. |

For a fresh active companion, the eight nonzero candidates are **Gravelerock,
Oran, Pecha, Cheri, Apple, Sleep Seed, Blast Seed and Max Elixir**. Pre-toolbox
Tiny Woods supplies only Oran/Pecha. After the toolbox grant, the bag must be full
for a newly encountered nonprojectile to fall back to an empty held slot; an
eligible projectile can also merge into an existing held lot. These capacity
predicates change the particular encounter result, not the source item set.
There is no general bag-drop command and dungeon equip targets only the leader,
so purchases/grants do not silently become companion-held input before the
later, ground-only resident Give boundary.

The ordinary leader opportunity returns input before `hooks.ai` at
`src/domain/turns/engine.js:183–184`. Native leader bag scanning therefore is not
current autonomous player control. T03's companion owner must not start selecting
shared-bag stock simply to include it in a normal companion scan.

## Saved/imported states are a separate, wider admitted input

`content/state/opening-campaign.js:76` composes `createItemPolicy` and
`createEconomyPolicy`; successors retain that item owner. In
`content/state/items.js:createItemRules`, lines53–73 collect positive item rows
from **all canonical dungeon/section/floor contexts** whose generator actually
enables ordinary, buried, shop or monster-house items. `content/dungeons.js:293`
exposes all accepted dungeon IDs, rather than only the three implemented
departure routes. The data-only join covers1497 canonical floors and198 generated
item IDs. Forty nonzero-AI IDs have at least one such enabled context. Examples
include Buried Relic ordinary/buried pools, Darknight Relic equipment/projectile
pools, Joyous Tower shop Doom Seed and Frosty Grotto buried food. These examples
are factual acquisition-route evidence, not playable early routes.

`items.js:100–118` explicitly treats that evidence as existence of a route,
not proof of a particular grant. A reward reference1..15, fixed treasure or
special constructed route can also qualify an item, but none adds the remaining
three nonzero projectiles here. Their empty generated/reward/treasure joins return
`item-acquisition-route:item-gold-fang`, `:item-cacnea-spike` or
`:item-corsola-twig`; they must remain unresolved without inventing a route.

All40 admitted nonzero items use payload `none`, allow clean home/storage lots,
and have no storage prohibition; projectiles allow1..99, other items one. Item
policy lines175–188 validates archive/container/session ownership and capacities,
then template/quantity. It does **not** require a ground lot to belong to that
specific early floor's item pool, nor a held lot to have an acquisition receipt.
Economy policy checks capacities, money and reserved home inventory, not a
chronological inventory conservation log. Actor admission checks identity,
growth and entry projections, without a supported-held-effect predicate.

Consequently an otherwise valid ordinary/Steel saved state can carry any of
these40 clean lots in a correctly owned active companion-held slot, or as a
correctly positioned ground lot subsequently acquired by that companion. This
is a source-derived admission result, not a claim that a constructed arbitrary
save was executed through the validator. Save/import hash integrity does not
prove the lot was freshly generated: `src/persistence/codec.js:95–127` explicitly
describes integrity as corruption detection, validates the selected revision's
content, checks its original hash, and then converts/re-encodes; repository
`prepareImport` delegates to that path. Compatibility validates exact predecessor
state first in `opening-compatibility.js:81–96`, preserving the existing inventory
instead of filtering it. T03 must not reduce that admission or replay AI on import.

Early town imports can also hold all40 clean IDs in bag/storage/permanent-held.
`expedition.js:35` limits first-story Tiny Woods departure to Oran/Pecha and
first-story Thunderwave to USABLE_ITEMS, but **ordinary early work and Steel
bypass that template-list check**. Those departures transfer bag and held lots
intact. An already admitted active session likewise is not revalidated by the
departure command's list. These distinct boundaries must not be conflated.

## Complete nonzero flag inventory and consumers

Flags are ordered self/ally/enemy. `110` means self-use and ally-throw; `001`
enemy-throw; `100` self-only. They are eligibility facts, not unconditional
probabilities or handler coverage. The native role/condition/weight guards in
pinned `src/dungeon_ai_items.c` and `src/dungeon_ai_item_weight.c` still apply. Raw counts are21 self flags,19 ally flags and22
enemy flags. The admitted set has21/19/19; after the native team-orb exclusion,
normal roster actions have20/19/19 across39 unique IDs.

Fresh-source codes: **F** early floor; **P** Kecleon item purchase; **G** scripted
grant; **J** ordinary job reward. A dash means no implemented fresh source, not
denied saved-state inventory. **C0** denotes the existing finite self-use/rock
consumer pending T01 recipient integration. **D01–D10** are tasks below.

|Native ID|Canonical item ID|Flags|Admitted lot / fresh source|Shared effect state at20b0a7f|
|---|---|---|---|---|
|1|item-stick|001|Yes / —|D01: native line-projectile damage absent|
|2|item-iron-thorn|001|Yes / —|D01|
|3|item-silver-spike|001|Yes / —|D01|
|4|item-gold-fang|001|Unresolved / —|No accepted acquisition route; no inferred grant|
|5|item-cacnea-spike|001|Unresolved / —|No accepted acquisition route|
|6|item-corsola-twig|001|Unresolved / —|No accepted acquisition route|
|7|item-gravelerock|001|Yes / F,P,J|C0: fixed20 through projectiles/dealDamage; T01/T02 own common impact/targeting|
|8|item-geo-pebble|001|Yes / —|D01: sourced fixed15 arc effect absent|
|13|item-patsy-band|001|Yes / —|D10: held critical effect and uncaught equipment impact|
|27|item-diet-ribbon|001|Yes / —|D10: held Belly/hunger behavior and uncaught equipment impact|
|40|item-whiff-specs|001|Yes / —|D10: held own-throw hit override and equipment impact|
|41|item-no-aim-scope|001|Yes / —|D10: held throw direction and equipment impact|
|53|item-heal-seed|110|Yes / —|D03: negative-status cure absent; predicate exists|
|55|item-oran-berry|110|Yes / F,P,G|C0: Belly5/heal100, self only|
|56|item-sitrus-berry|110|Yes / —|D04: heal reuse plus full-HP permanent HP gain|
|57|item-eyedrop-seed|110|Yes / —|D05: eyedrops state/visibility absent|
|59|item-blinker-seed|001|Yes / —|D05: item blinker source/visibility absent|
|60|item-doom-seed|001|Yes / —|D08: level loss/reverse growth absent|
|61|item-allure-seed|001|Yes / —|D05: cross-eyed treatment/source absent|
|62|item-life-seed|100|Yes / —|D04: permanent HP gain absent|
|63|item-rawst-berry|110|Yes / P,G|C0: self burn cure/Belly5|
|64|item-hunger-seed|001|Yes / —|D09: leader/nonleader Belly branches absent|
|65|item-quick-seed|110|Yes / —|D07: item speed-up application absent; timers/upkeep exist|
|66|item-pecha-berry|110|Yes / F,P,G|C0: self poison cure/Belly5|
|67|item-cheri-berry|110|Yes / F,P,J|C0: self paralysis cure/speed refresh/Belly5|
|68|item-totter-seed|001|Yes / —|D06: Confusion lifecycle exists, item-source application/admission absent|
|69|item-sleep-seed|001|Yes / F,P|C0: self-only item Sleep source; nonself successor belongs to T01|
|71|item-warp-seed|001|Yes / P|D02a: real recipient warp owner absent|
|72|item-blast-seed|001|Yes / F,P|C0: eaten front damage; distinct thrown recipient/thaw effect belongs to T01|
|74|item-joy-seed|110|Yes / —|D08: item level increase absent; KO growth owner is not a substitute|
|75|item-chesto-berry|110|Yes / —|D06: Sleepless guards exist, item application/source/expiry absent|
|76|item-stun-seed|001|Yes / P|D02b: item Petrified application/source absent; interruption handling exists|
|77|item-max-elixir|110|Yes / F,P,J|C0: learned-slot base PP restore, self only|
|78|item-protein|110|Yes / —|D04: retained attack bonus/gain reconciliation absent|
|79|item-calcium|110|Yes / —|D04: retained special-attack bonus/gain reconciliation absent|
|80|item-iron|110|Yes / —|D04: retained defense bonus/gain reconciliation absent|
|81|item-zinc|110|Yes / —|D04: retained special-defense bonus/gain reconciliation absent|
|82|item-apple|110|Yes / F,P|C0: self food restore/max Belly; recipient/Diet behavior belongs to shared effect closure|
|83|item-big-apple|110|Yes / P|C0: self food restore/max Belly|
|84|item-grimy-food|001|Yes / —|D09: five-way food effects and real item provenance absent|
|85|item-huge-apple|110|Yes / —|D09: always-on max-Belly food branch absent|
|103|item-banana|110|Yes / —|D09: sourced food branch absent|
|205|item-rollcall-orb|100|Yes / —|Native team-orb self-use guard excludes normal roster choice; forced-held/orb action is a separate task|

## Task-sized effect/provenance dependencies

No automatic Item Master consumer exists in this baseline. The C0 rows are
handled in `src/domain/gameplay/items.js:useDungeonItem` and Gravelerock's
`projectiles.js:throwRock`; their shared recipient/uncaught-impact and launch
owners are exactly the existing T01/T02 prerequisites. Every damaging addition
must retain `damage-resolution.js:dealDamage/finishDamage` and
`revival.js:tryRevive` ordering and canonical held/drop ownership.

| Task | Item IDs closed | Existing reusable owner and concrete missing state/consumer |
| --- | --- | --- |
| D01: projectile effect dispatch | Stick/Iron Thorn/Silver Spike/Geo Pebble (4) | `projectiles.js:throwRock` and `damage-resolution.js` support fixed Gravelerock damage only. Geo Pebble needs its explicit fixed15 operation; the three admitted line items need the actual MOVE_PROJECTILE damage consumer in pinned `src/dungeon_item_action.c:156–178,371–382`, not projectile constants treated as fixed damage. Reuse T02 launch/quantity and T01 impact; no persisted projectile identity parallel to canonical lots. |
| D02a: Warp Seed | Warp Seed (1) | No gameplay warp function exists. Close the source-qualified random destination/placement and live actor scheduling/tile boundary; preserve real recipient and floor/map ownership. Do not substitute ordinary walk/pathfinding or invent a random empty-tile distribution from the high-level factual op. |
| D02b: Stun Seed | Stun Seed (1) | Existing movement/action guards recognize Petrified; `field-moves.js:43` clears it on target interruption, and the engine supports petrified swaps. There is no item-origin application or admitted Petrified condition owner. Add the actual source-qualified lifetime, item user/session/map/identity, payload and interruption lifecycle in a successor; a generic frozen class is not sufficient admission. |
| D03: Heal Seed | Heal Seed (1) | `conditions.js:hasNegativeStatus` is a shared predicate; `resetFloorConditions` is a floor reset that also clears beneficial state and speed. Implement the exact negative-status cure set and derived refreshes. Do not invoke wholesale floor reset to fake Heal Seed. |
| D04: stat/HP items | Sitrus/Life/Protein/Calcium/Iron/Zinc (6) | `support.js:maxHp`, item healing and permanent Pokémon stat caps exist. `content/state/expedition-current.js:51` still requires actor bonuses unchanged from entry; line67 rejects nonzero statItems gains. A new real item-gain projection/settlement and successor actor policy are required. Sitrus full-HP2 and Life HP3 cannot silently mutate an inadmissible bonus; vitamin gains3 need native saturation and actual recipient. |
| D05: visibility/treatment seeds | Eyedrop/Blinker/Allure (3) | General condition fields exist, but `expedition-current.js:createConditionsPolicy` falls through to a named requirement for these states. Close actual item-source timers, upkeep and `CanSeeTarget`/blinded-observer/apparent treatment consumers. Representing a status label without selector/visibility behavior does not close T03. |
| D06: Confusion/Sleepless items | Totter/Chesto (2) | `conditions.js:applyConfusion` and `battle-status.js` own move-origin Confusion; `battle-mechanics.js:11–17` requires learned move-confusion actor provenance. Sleep-related guards in `move-conditions.js:32` already recognize Sleepless. Neither seed/berry has a real item application/admitted source. Reuse lifecycle with explicit item provenance; do not invent a learned move source or alias Chesto to Sleep Seed. |
| D07: Quick Seed | Quick Seed (1) | `conditions.js:refreshSpeed`, hooks upkeep and five native positive timers exist; `expedition-current.js:106–113` validates them structurally. Add the item-specific sampled timer/application/stacking/derived speed behavior. No new serialized condition field is justified merely by reusing the existing timer owner; confirm exact sourced lifecycle before implementation. |
| D08: level-changing seeds | Joy/Doom (2) | `growth.js:applyExperience` handles KO-driven level increases, learned-slot identity and HP differences. It is not an item level-change or level-loss handler. Close cumulative EXP, reverse natural growth, HP, gain reconciliation and learned-slot semantics, with source-preserving successor admission where necessary. Do not remove learned moves or invent a generic main-series curve. |
| D09: wider food/Belly | Hunger/Grimy/Huge Apple/Banana (4) | Normal food/Belly primitives and max-Belly gains exist in items.js, but these source operations do not dispatch. Hunger's role/Self Curer branches, Huge Apple's always-on max-Belly branch and Banana's full-Belly branch are distinct. Grimy Food's equal five-way result requires genuine item-origin poison/shadow-hold/burn/paralysis/stat-lowering consumers; current damage-status/party-move policies require their actual move sources. Persistent item conditions must be admitted separately rather than borrowing those move PCs. Diet Ribbon is a shared nonleader Belly guard, not a reason to filter food. |
| D10: harmful held equipment | Patsy Band/Diet Ribbon/Whiff Specs/No Aim Scope (4) | Frozen facts specify named held passives and an explicit uncaught1-damage throw branch. There is no runtime implementation for these held effects. They can already occupy admitted companion-held state; before being selected/thrown, the actual holder's critical/Belly/hunger/hit/direction behavior matters. Close those owners plus T01 catch/sticky/default equipment impact and T02 direction handling. Do not treat all unknown effects as default damage or ignore a held passive because it will eventually be thrown. |

Existing Sleep Seed provenance is a concrete T01 blocker already identified:
`content/state/expedition-current.js:95` requires the item user's actorId to equal
the recipient. T01 must retain the actual thrower in a narrow successor source
policy. Other condition policies are similarly specific: battle-mechanics,
party-moves and damage-status require their real learned move actor source;
field-moves requires its live Leech link. New item-source conditions must not be
laundered through those existing policies. Permanent stat/level gains require
their own explicit actor/retention reconciliation, while instantaneous cure/PP/
food operations can reuse admitted fields once their exact behavior is closed.

Zero-flag lots remain valid inputs. Reviver Seed's existing Item Master-gated
faint consumer remains active despite `000`; Plain Seed/Ginseng, gummies, TMs
and the early orbs are retained with their existing command/effect gates. Broader
zero-flag held modifier equipment and target protection can also appear in
validated inventory; the independent modifier/treatment dependencies already
listed in [FRIEND-AREAS.md](FRIEND-AREAS.md) remain in force. This43-row eligibility audit is
not a claim that all accepted held passives or all240 item actions execute.

## Recommended implementation order

1. Complete source acceptance for T01, then T02, without expanding
   their explicit command admission or rewriting frozen predecessors.
2. Publish the39-item admitted roster closure ledger above as T03's actual
   dependency set. Close D02a/D02b early because Warp/Stun are also real early
   purchases; finish D01 and D03–D10 as separately reviewable recipient-effect/
   source-policy packages. Do not describe the fresh eight-item companion set as
   a complete save-admission boundary or ship Item Master that skips the other
   native candidates.
3. Add normal Item Master choice only when the applicable admitted candidate
   consumers and provenance are closed, preserving incoming native flags,
   native role guards, complete inventories and move slots. Keep forced-held,
   leader autonomous control, wild choice, new post-Friend dungeon entry and
   recruitment/extra-party admission separate.

The copied factual item operations retain their existing
original-red-comparative-with-explicit-conflicts qualification. The additive AI
facts remain pinned Red comparative at6bcbec4f, not independently verified Blue
binary behavior. Where a named operation lacks the source detail needed for an
implementation (for example Warp's placement sampling), the next task must
resolve that exact native source question rather than infer it from the label.

This research used file/function reads and data-only Python JSON joins over
the complete240 AI rows, canonical dungeon contexts, shop/reward facts and
effect records. No game source was executed/imported, and no tests or
playthroughs established these findings. This ledger changes no runtime or
old-save admission. Each dependency requires scoped implementation, static
verification and independent source review before autonomous item use opens.
