# Original Blue Rescue Team move/item effect research

Date: 2026-10-05. JSON deliverable: `/tmp/pokemon-effect-corpus.json`.

## Result and boundary

This is a **complete identity/family mapping with explicit unresolved implementation fields**, not a complete Blue-verified executable effect registry. It replaces a generic damage/heal placeholder approach with 266 independently written operation families, exact comparative numeric parameters, per-move targeting and handler references, separate item use/hold/throw channels, and status groups/timer evidence. It now resolves common status/ability predicates and ordered consumable/orb/throw/TM/Link Box/Key branches as qualified original Red contracts. It does not certify every nested move-specific guard or original Blue availability route. Consumers must reject unresolved required fields rather than invent behavior.

| Coverage | Count |
| --- | ---: |
| Original move catalog rows with structured effects | 356 / 356 |
| All internal move/action rows | 413 |
| Internal actions with structured effects | 406 |
| Item rows with separate use/held/throw channels | 240 / 240 |
| Orb rows with effect-bearing action mapping | 51 / 53 |
| Effect-family records | 266 |
| Mutually exclusive status-group members with behavior | 66 / 66 |
| Raw status timer records with half-open domains and caller references | 60 |
| Species-specific Low Kick/Sizebust parameters | 424 comparative internal rows |
| Terrain rows each for Secret Power, Camouflage, Nature Power | 76 |

The 356 catalog includes the original 354 move identities, Wide Slash and Vacuum-Cut. **Struggle is in the catalog but is not normally learnable.** Do not describe this count as 356 independently obtainable learned moves. The 240-item inventory deliberately includes internal/unused rows to avoid omissions; it is not an obtainable-item certification. The two unmapped orbs are Possess Orb (216) and Toss Orb (220), both in the original **reward blacklist**, which alone is not a global obtainability proof. Itemization/reward/version filtering remains an independent content gate.

No repository file was edited. No game source was imported, compiled, or executed. Scripts parsed public source as text and numeric JSON only. No ROM, game assets, commercial item descriptions, or dialogue entered the deliverable.

## Source authority

1. Pinned [pret/pmd-red `6bcbec4f906938c0243aa2026bcbd41b577bab85`](https://github.com/pret/pmd-red/tree/6bcbec4f906938c0243aa2026bcbd41b577bab85). This is original **Red comparative** evidence. Source-level numeric facts and dispatch routing are strong evidence for Red; shared names or a Blue-address comment do not prove all Blue branches identical.
2. Pinned [Blue-reported data `f8890eb4ae9867c380381b3b95349092076fa4a6`](https://github.com/diegogliarte/tools.diegogliarte.com/tree/f8890eb4ae9867c380381b3b95349092076fa4a6/src/lib/data/pmd-blue). The author identifies move flags as FAQ-derived. Their effect descriptions are **not** reliable executable rules; numerous errors are recorded below. Only facts were independently restructured, with no copied description prose.
3. UPC first-party researcher documentation covering the two originals: [move table](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-moves.html), [attack explanations](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-attack-explanations.html), [status conditions](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-status-conditions.html), [items](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-items.html). This corroborates original scope, disputed numeric values, range interpretation and timer conventions, but has its own disagreements with pinned Red. Do not silently promote it to a build-identified Blue trace.

Full source-file SHA-256s and pinned URLs are embedded under `sourceArtifacts`. Downloaded source references stay outside the product at `/tmp/pokemon-research/effect-*`. Public visibility is not a redistribution license for copied source implementations.

## Schema and consumption contract

- `moves[]`: original internal ID/symbol, numerical facts, phase-specific accuracies, independent effect operations, targeting geometry/category, original flags, hit-count contract, source handler path/line, directly referenced constants, condition references, and unresolved fields. `handlerConditionReferences` is a navigation aid, **not an exhaustive immunity/guard specification**.
- `effectFamilies`: 266 annotation-keyed groups transformed into explicit operations such as normal/fixed damage, chance-gated status, stage/multiplier change, charge, recoil, drain, terrain mutation, move calling, item theft, ability change and actor displacement. An operation that still contains a null or unresolved helper must not become an invented default.
- `items[]`: separate `useEffects`, `heldEffects`, `throwEffects`, a move action ID for every TM/orb/HM, prices and stack spawn ranges. An explicitly researched `no-held-effect` for an item is different from an unresolved behavior.
- `statusRegistry`: original mutually exclusive groups and per-group numeric values. Never use those group values as a global status ID. A Pokémon may have one member of several groups at once.
- `statusTimerEvidence`: raw bounds, actual random draw domain, caller `+1`, curer flag, source function, and explicit comparative actor-hook semantics. The actor opportunity scheduler, not a generic player-turn countdown, consumes these timers.
- `terrainEffectTables`: exact comparative tables indexed by original tileset. Nature Power includes its callback identity because the callback can differ from the normal handler for the same move.
- `speciesEffectParameters`: `weight/256` is Low Kick's multiplier; `size` is Sizebust damage; `bodySize` is team body slots. These are three separate facts. Bulbasaur is 153/256, 27, 1; Onix is 358/256, 76, 4. Do not use main-series weight or team body slots for either effect.
- `conflicts`, `evidencePolicy`, `verification`, `coverage`: inspect before ingestion. `runtimeApproved` remains false.

## Corrections that must not be lost

### Six numeric disagreements resolved to corroborated original values

| Move | Field | Blue-reported dataset | Selected original value |
| --- | --- | ---: | ---: |
| Dragon Rage | Power | 10 | 2 |
| Sonicboom | Power | 10 | 2 |
| Refresh | PP | 12 | 17 |
| Refresh | Accuracy after damage | 125 | 100 |
| String Shot | Critical percentage | 5 | 12 |
| Thrash | Power | 17 | 18 |

Blue `acc1` corresponds to Red `accuracy2` (after-damage check). Blue `acc2` corresponds to Red `accuracy1` (before-effect check). Accuracy 125 is not a literal 125% UI probability after arbitrary modifiers; the original accuracy helper has an above-100 bypass. Dragon Rage and Sonicboom actually remove 65 and 55 HP; their listed power of 2 is not fixed damage.

### Further Blue annotation mistakes found by direct handler inspection

| Annotation | Original Red handler fact |
| --- | --- |
| Acid classified as Status | Damaging Poison move; physical split in originals |
| Crunch / Shadow Ball: 40% cringe | 20% chance of Special Defense −1 |
| Thunder / ThunderPunch: 10% paralysis | 20% |
| Bubble: 30% movement-speed reduction | 10% |
| Attract requires opposite gender | No gender check; Safeguard and Oblivious block application |
| Charm subtracts two Attack stages | Multiplies the separate Attack multiplier by 1/2, floor 2/256 |
| Psycho Boost lowers target's Sp. Atk | Lowers user's Sp. Atk by two stages on a hit |
| Rollout / Ice Ball multiply each previous hit by 1.5 | Five-hit multipliers 1, 1.5, 2, 2.5, 3; stop on miss |
| Magnitude includes a 20-damage outcome | Seven outcomes 5, 10, 15, 25, 30, 35, 40; uniform index draw |
| Transfer Orb swaps positions | Changes an eligible enemy to a different floor species of equal body size; up to 30 candidates |

Also reject the assumption that Hidden Power rerolls every floor. Original researcher documentation says dungeon entry; generation and serialization evidence exist, but its complete initialization call chain is not closed here. Its type/power fields are therefore persistent expedition state, pending that call-site audit.

### Remaining source disagreements

- UPC status Taunt minimum 11 versus Red raw minimum 10.
- UPC Mirror Move duration/problem classification differs from Red raw `{2,5}` and `factorCurerSkills=FALSE`.
- UPC damage Def. Scarf +12 versus Red +8; earlier runtime evidence has independent researcher support for +8.
- UPC item prose says Oran restores all HP; pinned Red heals 100, capped at max. This is not equivalent for high-HP actors. Sitrus also heals 100, or raises max/current HP by 2 when already full.
- UPC Joy Ribbon timing says end-of-turn; pinned Red awards actual HP-loss experience inside damage handling if the recipient survives and the damage is not 9999.

These are explicit conflicts, not grounds for averaging or claiming identical Blue behavior.

## Implementation-critical exact facts

- Multi-hit count zero means a uniform integer from 2 through 5; nonzero count means that exact number. These are hits inside one action. Fury Cutter is two hits; Thrash is three with random facing before each hit. Outrage and Petal Dance are 2–5 same-action hits followed by confusion, not a main-series multi-turn lock.
- The status RNG upper bound is exclusive unless both bounds are equal. Self-Curer halves finite duration with truncation; Natural Cure changes values greater than 4 to 5; minimum is 1. This applies only when the call enables curer effects. Sleep/Nightmare/Napping additionally apply Early Bird halving. Caller `+1` is a separate stored-counter adjustment. `127` is the indefinite sentinel.
- Burn deals 5 every 20 opportunity-end checks after the initial next check; poison 4 every 10; bad poison is a constant 6 every 2. Do not implement growing toxic damage. Poison and bad poison stop passive regeneration.
- Counter returns 100% of qualifying adjacent physical damage; Mini Counter returns 25%; Mirror Coat returns 100% for qualifying adjacent special damage. These are not main-series 2× counters.
- Stat stages are 0–20, neutral 10. Separate multiplicative modifiers are not stages. Screech multiplies Defense by 1/4; Charm halves Attack. Belly Drum saturates Attack at stage20 and sets Belly to1, failing at integer Belly≤1.
- `sub_805727C` applies opponent Shield Dust protection; `RollSecondaryEffect` handles self effects. A chance argument of zero means certain, not impossible. Serene Grace doubles a nonzero chance.
- Explosion radii are1 and2. Damp anywhere among active floor actors or apparent Rain prevents the effect. Team damage is half current HP (quarter for Fire type), minimum1. Enemy damage is40/80 (half for Fire type). Items are destroyed and eligible interior walls cleared; source interleaving/faint interruptions still matter.
- Seed/berry/drink ingestion adds5 Belly before its other effect. Oran heals100; Life Seed adds3 max/current HP; vitamins add3 permanent stat; Ginseng adds1 or3 with88/12 weighting to eligible leader-set moves. Blast Seed eaten damage45 (boss30), thrown20 (boss15), thawing its target first.
- Line projectile values are **normal-damage power inputs**, not fixed damage: Stick1, Iron Thorn5, Silver Spike6. Gravelerock20 and Geo Pebble15 are fixed arc damage. Ordinary thrown nonedibles do1, sticky thrown items2. Projectile base accuracy90, with item overrides and catching applied separately.
- Held bonuses: Power/Special Band12; Def. Scarf/Zinc Band8; Munch Belt8 to both offenses. Scope Lens/Patsy Band add40 critical points to their respective attack direction. Detect Band subtracts30 from incoming base accuracy before stage multiplication, except the above100 bypass.
- Reviver Seed requires Item Master, ignores sticky seeds, searches own held seed before team Toolbox, becomes Plain Seed, restores HP/Belly and invokes volatile reset before permanent faint. Exact reset helper fields still need a separate contract.

## Remaining work before an exact runtime claim

1. Audit all operation recipients, conditional branches, special status behavior, damage exclusions and common ability/IQ guards against direct original code; a handler citation is not proof of every nested helper.
2. Obtain Blue-specific corroboration for branch-level behavior and resolve the source conflicts above. Preserve source confidence field-by-field.
3. The common consumable/orb/throw/Key/TM/Link Box chains are now normalized below. Complete remaining shopping ownership, non-dungeon TM use, recycling origin payload, Gummi Friend Area stat bonuses and revival reset fields.
4. Validate every obtainable item route against original Blue pools, rewards, story objects and mode-specific availability. Preserve the excluded/unused rows rather than exposing them in normal shops.
5. Complete move-calling eligibility tables, Hidden Power initialization, Transfer copied state, room/corridor/fixed-room geometry edges and environmental restrictions. Some are already available in the cached source but were not fully normalized in this pass.

## Static verification and reproducibility

The scripts in `/tmp/pokemon-research/` are `build-effect-corpus.py`, `normalize-effect-families.py`, `normalize-item-status-effects.py`, `finalize-effect-corpus.py`, and `effect-final-audit.py`, executed in that order. They are research parsers/normalizers, not imported game modules. Do not add them to the runtime tree.

Static checks passed: unique contiguous internal move/item row IDs; complete 266-family key set; structured effects for all356 original move catalog rows; 51 orb rows resolve to effect-bearing actions; only two reward-blacklisted internal orbs lack a handler mapping; six numeric differences retained across five move records; 76 rows per terrain table. An inventory check is not a behavioral test or fidelity certification.

The follow-up pass closes the previously empty behavior fields for all14 listed statuses. Every status now has behavior operations; this count is not a claim that every nested move/status interaction is exhaustively modeled.

`numericEvidence` retains decimal fixed-point source macro arguments as evidence; those literals are not already exact 24.8/48.16 values. Prefer rational parameters in individual effects and trace source conversion before arithmetic use.

## Follow-up: concrete comparative contracts

`/tmp/pokemon-effect-contract-additions.json` is the compact implementation view. The main JSON is updated in place. These resolved original Red facts are independently usable with that source label; Blue instruction-level equivalence remains a separate question. There is no need to replace a sourced comparative rule with a generic effect while that separate question remains open.

### Fourteen status gaps closed

| Status | Ongoing contract |
| --- | --- |
| Sleepless | Replaces/wakes the sleep group and blocks Sleep, Nightmare, Napping and Yawn application; reapplying does not refresh. |
| Safeguard | Blocks only applicators invoking its predicate. JSON indexes29 call sites and their bypass conditions. It also blocks self-infliction through those helpers. Rest's Napping helper explicitly skips this predicate. |
| Magic Coat | Flagged moves reflect only from an adjacent distinct defender that can attack back in the required direction. Retarget to the original attacker without changing attacker identity; no one-shot consumption. |
| Protect | Prevents impact for target categories0/2/4/5 outside first charge phase; additionally prevents Perish Song expiry damage. |
| Mirror Move | Adjacent legal return direction, same target-category gate, excludes Regular Attack/Projectile/first charge phase. Retargets; does not borrow or teach the move. |
| Vital Throw | After qualifying surviving adjacent physical damage, hurls the attacker. Reaction enable flag and status guards apply. |
| Decoy | One floor decoy; applying removes other Decoy/Snatch. The24-cell faction/tracker/target table is explicit. AI Decoy actors choose random-direction walking; observers update their tracker only for a visible decoy. |
| Snatch | Registers one actor with a generation identity check. Redirects flagged effects before Lightningrod/Pass Scarf, retains the original attacker, and has no distance check. Reapplying refreshes by removing the previous registration. |
| Destiny Bond | User holds the status, target is a linked actor identified by active index and generation ID. Eligible damage is copied to that actor; holder fainting is not the trigger. |
| Invisible | Ordinary observer targeting ignores the actor unless the caller bypasses invisibility or the observer has Eyedrops/active Goggle Specs. Not universal damage immunity. |
| Transformed | Up to20 floor-pool draws choose a different available appearance. Real species, stats, moves, types and abilities are untouched. Ending restores normal apparent species. |
| Blinker | Camera blindness; AI continues forward if possible, otherwise chooses equally between random walking and move choice. Frontal AI move targeting is restricted to facing direction. |
| Cross-Eyed | Camera renders other monsters using decoy appearance; affected AI randomly walks. |
| Eyedrops | Reveals invisible traps/monsters and allows invisible targeting. The trap handler's15% unseen-trap avoidance becomes0 for revealed/visible traps; Trap Scarf remains separate. |

Status application stores the researched caller-adjusted counter. `TickStatusAndHealthRegen` runs the decrement/end handlers:127 does not decrement;128 first becomes127. Ability and item end checks use `DoEndOfTurnEffects_Async`. Never convert these directly into global player turns. The separately normalized scheduler determines when each actor receives the hook.

### Guard and order contracts

`guardRegistry` distinguishes sleep immunity, damage reactions, inability to attack, item-catching eligibility, stat-drop defenses, move usability, two concurrent abilities, and active held items. Burn/poison/freeze/confusion/cringe/paralysis/infatuation predicates retain exact ability/item/type checks. No modern Electric-type paralysis immunity was added. Safeguard is not a substitute for Mist/Clear Body/White Smoke, and Twist Band/Hyper Cutter/Keen Eye apply only through their stat-specific helpers.

The impact sequence is redirect selection → status reflection → Protect → semi-invulnerability → Soundproof → accuracy1 → Lightningrod no-impact decision → effect handler/damage accuracy2 → secondary effects. Snatch, Lightningrod and Pass Scarf are an `else-if` chain at their outer eligibility tests: an entered outer branch can suppress later redirection even when its inner test fails. Pass Scarf requires2 Belly, scans from facing+1, chooses the first adjacent monster regardless of faction, and charges Belly only on successful redirection.

The negative-status cure contract is explicit. It conditionally clears entire groups, so a beneficial member of one such group can disappear when another negative condition caused the cure to run. Speed-down counters and move sealing are cleared afterward. Reflect, Bide, Invisible and Long Toss groups are outside this cure helper. Shed Skin uses this helper on a50% check; Speed Boost increments a source counter once per opportunity-end hook and raises speed at250, with indefinite duration. These counter names do not establish video-frame timing.

### Use, failure and throw consumption

| Command branch | Item result |
| --- | --- |
| Sticky ordinary use | Retained; no effect |
| Muzzled edible use | Retained; no effect |
| Accepted edible/item self-use | Item removed before effect; ineffective heal/status/stat effect still consumes |
| Orb on fixed room IDs1–49 | Consumed; no effect |
| Orb with Cringe/Infatuation/Paralysis | Retained; no effect |
| Switcher/Pounce Orb after those gates | Removed before move-usability checks; a later Taunt/Encore/muzzle rejection cannot restore it |
| Other orb rejected by move-usability preflight | Retained |
| Other orb misses, has no target or reaches an ineffective handler | Consumed |
| Sticky held item or sticky projectile ammunition throw | Retained; no throw |
| Accepted throw | Remove one ammunition unit or one ordinary item before flight; hit, miss, catch and floor drop decide its later location |
| TM learning canceled/fails or HM used in dungeon | Retained |
| Successful dungeon TM teaching | Becomes Used TM; quantity stores old item ID−125 |
| Link Box used only to delink or toggle moves | Retained; a performed link command causes consumption on exit |
| Key use | Consumed before checking the tile directly **north**, independent of facing; wrong location still consumes |

Catching precedes sticky-impact handling. Wild actors may catch non-ammunition, non-seed/berry/drink categories; team actors require Item Catcher and a non-seed/berry/drink category. Empty hands and the dedicated status guard are required; lock-on/piercing flags can bypass catching. A caught item has no immediate consumable effect. A missed throw can land as a floor item, so source removal is distinct from destruction.

Wish Stone, the three Regi parts and Music Box have dedicated active/uncaught-thrown handlers: they disappear without the ordinary nonedible1-damage effect. Music Box's possession encounter role is separate from actively using it.

### Item availability distinctions

The original `gInvalidItemIDs` table contains15 reward-blacklisted IDs plus a sentinel. It is not a universal obtainable-item predicate. Every item now records that flag, random dungeon pool references, random reward/town-shop set references, trading eligibility and fixed-treasure evidence where present.

All178 random dungeon pools were joined to the existing normalized floor/generation corpus. Their202 item identities are not202 certified normal-play items. **Excavate176 and SpinSlash177 occur only in pool83, assigned to the Buried Relic26/36 shop contexts, and both contexts have shop chance0.** These inert references must not cause those TMs to appear in gameplay. The exact disabled contexts are embedded in each item record.

The20 fixed-treasure item definitions are recorded without source room layouts. Fixed spawning checks Toolbox, dungeon-team held items, recruited-roster held items and storage; if the named treasure is already owned, it spawns Link Cable instead. This applies to the helper generally, not just HMs.

Weavile/Mime Jr. figures are present in reward sets10–15. Delivery sets a sculpture event flag instead of following the ordinary inventory branch; duplicate delivery grants1000 Poké, and ordinary reward generation rerolls an already-owned figure. Gold Fang/Cacnea Spike/Corsola Twig have set25 references but no ordinary reward-set proof: ordinary mission selection caps at15. Do not label a data-only reference as an obtainable item. Plain Seed and Used TM have separate conversion paths.

The follow-up normalizers are `/tmp/pokemon-effect-followup.py`, `/tmp/pokemon-effect-followup-final.py`, and `/tmp/pokemon-effect-final-review.py`, applied in that order to the existing corpus. They only parse source text and write research artifacts. Static checks verify all66 behavior records, the14 sourced additions,15 reward exclusions,178 route joins,20 treasure definitions and the two disabled TM contexts. No gameplay tests or Blue parity certification are claimed.
