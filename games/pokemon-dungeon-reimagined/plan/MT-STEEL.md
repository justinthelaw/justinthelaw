# Mt. Steel continuation

The target is original Blue Rescue Team. Native instruction traces in this
document use original Red comparative source at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; they do not establish Blue binary
parity. The current v10 checkpoint integrates the nine-floor Mt. Steel rescue
through MAIN(5,0); full-campaign and human acceptance remain open. Original dialogue and tactical geometry are authored
independently; native dialogue and art are not imported.

## AI factual prerequisite

`content/ai-facts.js` projects all413 native action records' AI weights,
target flags, conditional probabilities, frozen-target restriction and Taunt
exemption. AI range flags are distinct from actual move execution range.
The source data and six file hashes/Git blobs are recorded in
`tools/pokemon-dungeon/content/steel/ai-facts.json`. The independent exporter
checks identities, numeric/boolean ranges and exact generated source without
importing or executing game code. `npm run ai:check` is part of the game static
gate. Missing native boolean members are zero-initialized false values.

The source `ChooseAIMove` selects enabled usable slots by weight before checking
actual targets unless Weak Type Picker is active. Regular-attack weight is
`[100,20,30,40,50]` indexed by enabled slot count, including enabled zero-PP
slots; it is not the regular-attack record's own weight. The cumulative check
is `>=` against a zero-based draw. Failed chosen targeting falls back to a
regular attack, without resampling a different legal skill. All-zero total PP
uses the separate Struggle path. Linked continuations cannot be chosen as heads;
PP Checker additionally avoids chains with any member at one PP.

`LoadIQSkills` gives wild actors Status Checker, PP Checker and Item Catcher;
Self Curer depends on the actual bossFlag, and Item Master starts at level16.
The Skarmory cutscene does not set bossFlag through `SetupBossFightHP`, so a
story boss role alone must not confer it. These facts do not change prior save
admission or yet replace the existing regular-attack AI. Runtime integration,
status checks, targeting, PP/link execution and complete move coverage remain
separate prerequisites.

## Confirmed route constraints

The original dungeon has eight exploration floors and the9F Skarmory/Diglett
fixed encounter. Skarmory's native level10 growth yields65HP; its scene does
not call the later-boss HP override. Clear requires that specific Skarmory's
faint during the first/retry event. Diglett is a separate neutral rescue actor.
The fixed-room cutscene flag changes eaten Blast Seed damage from45 to30,
independently of which actor it hits.

Script2 return sets MAIN(4,7), then script3 has `unk11=false`. The main-loop
resolver converts this into a won-return without entering the dungeon runner;
it advances MAIN(4,8), then the rescue/return scene reaches MAIN(5,0) and save.
It is not another nine-floor run. First/retry/loss staging and visible Magnemite
crossing assistance remain mandatory. Rewards are500Poké, Pecha Scarf and
Ginseng, in order. Cash is rejected as a whole if it exceeds capacity; items
use recoverable inventory overflow and durable receipts.

## Rapid Spin evidence correction required by the consumer

The predecessor effect projection's adjacent-trap removal and partial cures
are unclosed candidate facts. Audited `move_orb_actions_1.c:961-974` and
`dungeon_move_util.c:385,457-461,1212-1223` instead queue cleanup after a
successful nonzero damage chain. Chance zero does not draw. The helpers clear
the entire frozen class and leech-seed class, including linked wrap counterpart
cleanup where applicable; this path contains no trap-removal call. The new
consumer must explicitly override the old candidate while retaining its exact
old resource hash for save verification. No Blue-specific trap difference has
been established. Unsupported wrap/status consumers stay explicit.

## Shared stat effects and execution targeting

Harden, Defense Curl and Meditate now target the user; Tail Whip and Leer use
front melee geometry, Sand Attack uses the separate corner-cutting position
predicate, and Growl visits active team/wild slots in native room order. Neutral
client targets are excluded before hit RNG. Original room sight includes the
one-cell room border and corridor visibility range. These execution predicates
are reusable and do not substitute for AI consideration flags.

Stat drops apply Mist, Clear Body/White Smoke first. Offensive drops additionally
check a real nonsticky held Twist Band, then physical Hyper Cutter; accuracy
checks Keen Eye after the shared guard. Stages clamp to0-20. Growl checks
Soundproof before accuracy. Boosts target self and still consume the source
first accuracy draw with guaranteed self-hit. Non-damage effects do not run the
second damage-only accuracy check. For damage, `CalcDamage` randomness precedes
`TryHitTarget_Async`'s second accuracy draw. `UseMoveAgainstTargets` raises wild
experience credit after the first hit check before dispatch, including capped
or protected stat effects and self boosts. Damaging dispatch restores only its
provisional credit when the damage-only accuracy check misses or returns zero
damage, preserving prior credit. Each eligible target wakes from indefinite
spawn sleep before protection/Soundproof/accuracy; finite sleep is retained.

Source: `dungeon_move.c:189,239-315,1290-1294,1345-1400`,
`move_orb_effects_5.c:541-554`,
`dungeon_move_util.c:738-815,819-991`, `dungeon_misc.c:727-769`,
`move_orb_effects_1.c:848-1046,1219-1256`,
`dungeon_logic.c:241-280,1216-1239`, `dungeon_items.c:692-705`, and the
individual effect dispatchers in `move_orb_actions_1.c`, `move_orb_actions_3.c`
and `move_orb_actions_4.c`. Existing Wonder Tile and floor-reset owners restore
stat stages. Stage fields were already admitted by the unchanged v8 policy;
no prior save validator, hash or content revision is rewritten by this batch.

Only the seven named stat moves are newly admitted. Complete status, copied,
linked and multihit consumers remain open; learnsets are retained without
level caps, dropped slots or generic-damage substitutions. Human play and
visual acceptance of the additional effects remain open.

## Rapid Spin and Take Down consumers

The current consumer now explicitly overrides Rapid Spin's frozen candidate
projection: successful positive damage runs complete frozen/leech-seed class
cleanup after its admitted single-hit chain, with no extra chance draw or trap
removal. Reciprocal wrap links must resolve before both endpoints are cleared;
wrap application and admission remain gated. This does not claim that the
predecessor trap-removal projection has become supported or that a Blue-only
difference has been proved. Wonder Tiles are unaffected.

Take Down dispatches `dungeon_move.c:726-729` to `sub_8058E5C`
(`move_orb_actions_2.c:222-243`):
successful positive damage, valid user, Rock Head check, then maxHP/8 rounded
down with minimum1. Recoil uses shared faint/revival and does not grant team
experience for a wild user's recoil faint. The source chance-zero helper uses
no random draw. All existing HP damage paths now share a narrow subtraction
owner; its Bide accumulation hook counts nominal damage up to999 before HP
subtraction. Bide itself remains unavailable until its lifecycle/save admission
is integrated. Existing save resources and policies remain unchanged.

## v9 timed battle statuses and v8 preservation

Bide records its owning slot and nominal accumulated damage in the existing
charge payload, but is not implemented as a normal two-turn charge. Initiation
uses one learned-slot PP and counter4/5. Holding opportunities auto-pass; their
end phase decrements after residual damage, including the initiation action.
Expiry clears Bide first, checks the distinct native status/Run Away guards,
then runs fresh internal357 (Fighting/front) through current-facing targeting.
Release consumes no extra learned-slot PP or last-used update. Fixed damage is
min(999,2*stored), with only the typed Wonder Guard matchup exception and no
normal critical/variance/type multiplier or second accuracy draw.

Focus Energy occupies sureShot, starts3/4, decrements before actions and is not
refreshed or rerolled when already present. It overrides critical chance but
still draws the normal critical roll unless Battle/Shell Armor bypasses it.
Guts/Marvel Scale use the native negative-status predicate; neither Bide nor
Focus Energy is a negative status. Source: `move_orb_effects_3.c:31-80`,
`move_orb_effects_2.c:417-434`, `dungeon_turn_effects.c:360-377,504-509`,
`dungeon_damage.c:240-417,1310-1340,1415-1456`,
`dungeon_move_util.c:53-216,1002-1028,1356-1391`,
`dungeon_logic.c:471-509,534-550,608-647,1056-1088`, and
`move_orb_actions_1.c:652-673`.

Confusion resolves its10% secondary only after positive damage and immediate
faint/revival; a revived target is excluded without drawing. Serene Grace doubles
chance; Shield Dust blocks a successful secondary before application checks.
Safeguard, nonsticky Persim Band and Own Tempo prevent it. An existing confused
status keeps its timer without another duration draw. Otherwise native6-12
upper-exclusive duration applies Self Curer/Natural Cure and then adds1.
Execution draws one native direction. Leader movement searches cyclically for a
legal unoccupied step; nonleaders accept the sampled direction and wait if
blocked. Attacks discard the earlier selected target and resolve the new front
tile, with Nontraitor and neutral-client guards retained. Player items, waits
and menus do not randomize direction. Confused AI skips attack selection on
its70% early draw and otherwise retains normal faction-based selection; failed
selection walks if species mobility permits, with no pass/walk RNG. Existing
AI otherwise remains regular-attack-only until the scoped Steel selection
consumer is connected. Source: `dungeon_ai.c:104-167`,
`dungeon_ai_attack.c:69-75,754-794`, `dungeon_action.c:96-108`,
`dungeon_action_execution.c:69-78`, `dungeon_main.c:449-478,1007-1027`,
`dungeon_config.c:696-765`, `dungeon_move_util.c:819-991,1179-1209`,
`move_orb_effects_2.c:35-75`, and `dungeon_random.c:85-105`.

The current factory is v9-battle. The exact v8 factory lives in work-campaign.js;
all its data/policies and v2-v7 predecessor hashes are unchanged. Additive pins
cover43 modules,14 exact function bodies, two factual manifests/resources and
three predecessor root shapes, captured from accepted e59a35d. V8 imports first
pass original envelope authentication and original v8 admission, then retain all
posting, reward, scene, RNG and stable IDs through conversion. Only legacy saves
without the work root initialize prospective ordinary work. New statuses require
exact classes, counters, payload/slot bounds and actual same-session source-move
actors. All other condition fields are checked by the unchanged predecessor
policy. Unsupported statuses cannot use the new policy label to enter saves.

[The static move inventory](MT-STEEL-MOVE-COVERAGE.md) records every earlier wild
candidate and every starter level-up candidate through100. Missing native
partner/earlier-wild move use, remaining effect families and move replacement/
linking remain full-game obligations, not omissions from the requested scope.
Human timing, confusion movement, interruption/import and visual acceptance are
still required. Static checks alone do not establish those observations.

Status review corrections preserve input and AI ordering: a confused leader's
regular-attack input is accepted even while facing a teammate or neutral client.
Talking is still suppressed by the shared client interaction predicate; actual
attack execution randomizes direction and excludes neutral targets. Native
Run Away short-circuits the attack-choice chance, then confused actors pass/walk
directly without flee pathfinding. Source: `dungeon_main.c:244-247,898-899`,
`dungeon_ai_attack.c:69-75`, and `dungeon_ai.c:104-127`. No save policy changed.

## Scoped native wild move selection and Struggle

Steel hostile actors use the source weighted selector after the existing
CannotAttack/Run Away/confusion guards. All learned slots remain present; an
unsupported slot or IQ/link profile blocks admission instead of disappearing
from the weights. Enabled-slot count includes exhausted moves; total PP includes
disabled moves. PP Checker excludes exhausted/sealed candidate slots, then native
move weights and the regular weight are drawn before target range is checked.
The cumulative comparison intentionally retains source `>=` against a zero-based
sample. An untargetable selected move falls back to the already considered
regular attack, without rerolling another move. Exact Steel actor/IQ admission
is supplied by the v10 route policy; the selector is wired only for Steel
hostiles.

AI targeting uses the factual AI flags, separately from execution geometry:
front0, around32, two-ahead64 and corner128. Self buffs still seek enemies under
their native AI flags, after the appropriate self stage/status checks. Target
stage minima/frozen exclusions precede target selection. Native active order and
direction order are retained, with one target draw even for a single candidate.
Without Course Checker, corner AI has the source early-true range behavior;
actual move execution retains its terrain checks. Regular attacks scan from
current facing and select the first eligible enemy without another draw.
Neutral clients/Diglett never become candidates. Source:
`dungeon_ai_attack.c:53-338,341-572,596-851`,
`dungeon_move_util.c:1224-1289`, and `move_checks.c:22-451,453-710`.

Zero total PP considers Struggle instead of a regular-attack substitute. Its
explicit temporary action uses native352, no invented learned slot or PP debit,
records last-used Struggle with a null owning slot, and participates in normal
execution-time confusion. Positive damage triggers maxHP/4 recoil, rounded down
with minimum1 and no Rock Head exemption; recoil faint grants no experience.
Source: `dungeon_action_handler.c:767-816`,
`dungeon_move_util.c:277-361`, `dungeon_misc.c:1739-1756`, and
`move_orb_actions_4.c:343-369`. The action discriminant is additive; unchanged
predecessor scheduler admission accepts only initial/leader-input boundaries or
its exact paused exit scene, so no old save gains a new in-flight action. No
predecessor source pin or factual resource was changed.

Earlier wild/partner native move selection and the broader move inventory remain
required full-game work. The prerequisite alone did not admit Steel floors. The integrated route below
still makes no human gameplay/visual acceptance claim.

## SET and Ginseng

The move menu now exposes a persistent SET/UNSET toggle independently from move
use. It acts only at the leader input boundary and consumes no turn, PP, Belly
or random draw. Existing shortcut/slot identity is retained; no initial first
slot is automatically selected. Linked-menu semantics remain gated. The menu
shows the selected move and accumulated power boost. Ginseng is eaten through
the shared sticky/consumption/Belly owner, samples random100 before any effect
eligibility check, adds3 below12 and otherwise1, and caps at the move's sourced
maximum. Only the leader's actual SET slot with nonzero base power can change.
The gate does not depend on the effect-consumer allowlist: an unavailable
damaging move can still be SET and strengthened. Ineffective use still consumes
the item and the Ginseng sample.

Canonical `MoveSlot.powerBoost` and `MoveSet.setMoveSlotId` were already admitted
by the exact current/predecessor actor and permanent policies. Existing non-reset
settlement copies those canonical moves for both success and loss, preserving
slot IDs and power. No policy/hash/version change is needed to use those fields.
The separate `RunGains.moveBoosts` ledger remains empty/unadmitted; reset-dungeon
projection/retention is future work and must not invent old gain history from
previously admitted boosts. Source: `dungeon_menu_moves.c:130-143,715-740`,
`dungeon_item_action.c:519-563`, and `moves.c:1389-1418`.

## Original Steel staging foundation

The nine-floor route's original dialogue now distinguishes first/retry travel,
first/retry battle, loss recovery, departure, non-running return bridge, gap
rescue, thanks and home. The v10 route now consumes this authoring. The fixed
arena has independent9x17 composition inside the shared56x32 grid, a broad lower
fighting platform and Diglett's isolated ledge across a sky gap. Its isolated
fixed-role placement is explicit in the generator request; ordinary required
placements still require the entry component. No stairs exist on the boss map.
The shared generator/materializer remains the only floor construction kernel.

New sleep facts use the actual native species crosswalk. Fixed Skarmory and
Diglett skip spawn-sleep RNG completely (`SpawnWildMon(...,TRUE)` and nonzero
behavior; `dungeon_generation_fixed.c:43-67`, `dungeon_mon_spawn.c:513-523`).
Mt. Steel's entire floor item pool is retained, including White/Orange Gummi and
Switcher/Blowback/Warp/Petrify/Escape/Hurl Orbs. Their currently missing optional
use consumers will remain visibly unavailable, never rerolled into another item;
carrying/storage and reward Ginseng/Pecha consumers are separate responsibilities.
Complete item consumers remain a full-game obligation. Source pooled facts come
from the existing qualified dungeon catalog, not guessed drops.

## Integrated nine-floor route and return

The existing expedition kernel now owns all eight procedural source floors and
fixed9. Source encounters, full item pools and Wonder Tiles use the same
catalog/generator/materializer. Steel wild actors receive exact native active
IQ, source sleep probabilities and the reviewed move selector. Fixed Skarmory
uses level10 ordinary growth (65HP), without the generic boss multiplier;
Diglett uses level5 wild allocation with a neutral guest binding. Both fixed
roles skip spawn-sleep draws. Native density0 suppresses periodic arrivals
before timer advancement or RNG (`dungeon_wild_mon_spawn.c:33-35`).

Skarmory's actual faint callback sets a durable completion flag during damage.
Same-hit Take Down/Struggle recoil still resolves, then leader/partner loss has
priority. No subsequent actor/end-turn phase runs after successful floor clear.
A simultaneous recoil loss preserves boss completion but grants no rescue or
reward. A later fixed9 visit removes both fixed actors, presents the original
quiet-summit observation, and clears automatically. First/retry battle dialogue
uses reached history, separately from travel attempts. Source:
`dungeon_damage.c:709-731`, `dungeon_misc.c:583-591`,
`dungeon_cutscene_skarmory.c:57-79,167-174`, `dungeon_cutscene.c:138-157,349-350`,
`exclusive_pokemon.c:43-54`, `run_dungeon.c:468-475,609-618,767-812`.

Diglett does not choose actions or walk randomly. Moves and projectiles retain
neutral exclusion. Eaten Blast Seed can damage him for the fixed-room30HP;
actual lethal damage uses ordinary wild faint/experience/seen rules, with no
invented immunity, HP clamp, boss completion or client forced loss. Its native
wild allocation never receives client/base joinedAt. Later ground rescue actors
are separate scene roles. Source: `dungeon_ai.c:47`,
`dungeon_cutscene.c:1091-1138`, `dungeon_item_action.c:565-610`,
`dungeon_mon_spawn.c:498-525`, `dungeon_util.c:273-333`,
`dungeon_misc.c:488,571-591` and `dungeon_damage.c:659-708`.

Successful settlement owns MAIN(4,7), followed by the non-running script3 bridge
and MAIN(4,8). It never starts a second nine-floor expedition. The original
visible scene composition shows Skarmory depart, two Magnemite reach the gap,
lift Diglett together above it, and carry him to the team; thanks reunite him
with Dugtrio at the base. This read-only staging uses local directional pixel
actors and the textured mountain-grotto3D kit. Scene acknowledgment, not animation
elapsed time, advances canonical state. Home acknowledgment records the rescue
once, MAIN(5,0), interior placement and the durable save boundary. Friend Area
onboarding remains the next unopened story stage.

Rewards use exact ordered receipts:500Poké (whole grant refused above99499),
Pecha Scarf, Ginseng. Shared inventory delivery and shared choice presentation
handle full bag/storage, discard, whole-slot replacement and confirmation.
Every partial reward cursor reloads without replay. The source-qualified
non-reset settlement retains exact current move slots, SET and Ginseng boosts
on success or loss. Town bank/storage/Kecleon preparation remains available
between the completed request and departures/retries.

Ground returns refresh shops, board/mail scheduling and surviving toolbox
stickiness in source order, once before actual success/loss return scenes and
once more at the non-running script3 bridge acknowledgment. They do not advance
the browser day. Retained held items lose flags through native BulkItem
conversion. The later MAIN(5,0) to(5,1) INIT refresh belongs to the next task,
not an extra current call. Source: `ground_main.c:216-225,510,531-535`,
`main_loops.c:650-691,779`, `pokemon.c:977-1008`, and
`items.c:228-237,1377-1405`.

## Held reward equipment

Leader Give/Take now uses ordinary turn actions and whole-slot ownership.
Giving swaps through the freed toolbox slot even when full; taking needs a free
slot. Sticky outgoing held items reject inside the action and still consume its
turn. Incoming sticky items can be held; the current item UI exposes no native
projectile-SET flag. Confusion performs no equip direction draw. The actual
CheckVariousConditions target guard is distinct from CannotAttack. Pecha Scarf
protection reads the real clean held slot. Source:
`dungeon_action_handler.c:125-240,252-288`,
`dungeon_action_execution.c:192-200,266-315`,
`dungeon_logic.c:535-550,591-619`, and `dungeon_menu_items.c:632-665`.
Only items with implemented held behavior (Pecha Scarf, Twist Band or no held
effect) can newly be equipped; other equipment remains visibly gated.
Partner transfer/use-held-item commands and their native skip-action flag remain
explicit full-game work; this UI admits only the leader recipient.

## Exact v10 save boundary and remaining scope

The additive Steel root owns only route phase/history, durable reached/defeated
facts, last session, successful settlement revision and reward cursor. Real HP,
items, moves, map, actors, RNG and scheduling remain in the shared canonical
owners. Current policies check the exact prerequisite request, source floor
order, fixed geometry/roles, phase-scene counts, native flags/MAIN, loss versus
success, and receipt ordering. Pending summit scenes are specific stable pause
boundaries. New encounter seen flags require reachable entry/summit history;
spawning or visibility does not fabricate them.

Exact v9 factory and battle-status policy are frozen from accepted2348abc;
v2-v9 retain original envelope authentication and their original policy admission
before conversion adds only `steel:null` and the new content/revision. All43
previous source pins,14 authored bodies,2 factual manifests and three old root
shapes remain unchanged; two new pins make45. No old gains/history are invented.

White/Orange Gummi and all six pooled Orb use consumers remain visibly gated;
carrying/storage still preserve every source item. Full native partner and early
route move AI, Charge/Hypnosis/Absorb/Quick Attack and the complete starter
level1-100 inventory in MT-STEEL-MOVE-COVERAGE remain binding follow-up work.
No artificial level cap, move deletion or weighted substitute is introduced.
Native broader thrown-item/teammate catching remains open; wild Gravelerock
catching is not required because the source wild branch excludes thrown-arc
items (`dungeon_item_action.c:84-120`, `dungeon_projectile_throw.c:364`).
Static checks and source review do not establish human play, visual/device
acceptance, Blue binary parity or full-campaign completion.
