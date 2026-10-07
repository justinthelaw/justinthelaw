# Mt. Steel continuation

The target is original Blue Rescue Team. Native instruction traces in this
document use original Red comparative source at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; they do not establish Blue binary
parity. Mt. Steel remains gated until its shared consumers, route and save
admission are integrated. Original dialogue and tactical geometry are authored
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
will be supplied by the route policy; the selector is wired only for Steel
hostiles, not yet-accessible campaign floors.

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
required full-game work. This checkpoint does not admit Steel floors or claim
human gameplay/visual acceptance.

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
