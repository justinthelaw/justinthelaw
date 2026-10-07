# Friend Areas and chapter-five continuation

## Evidence boundary

Target: original Blue Rescue Team. Handler locators below use the pinned Red
comparative source at `6bcbec4f906938c0243aa2026bcbd41b577bab85`; they are not
Blue binary proof. Code, dialogue and map staging are independently authored.
D05 permits static checks only; gameplay/device/visual acceptance remains open.

## Shared move prerequisites

Metal Sound consumes the existing front/corner targeting and protected stat
owner. `dungeon_move.c:941`, `move_orb_actions_1.c:878–882` call the special-defense
drop with three stages and shared protection enabled. The factual catalog uses
`special-defense`, explicitly mapped to the actor's `specialDefense` field.
`move_orb_effects_1.c:913–960` protects before clamping at zero.
`moves.c:255–269` includes Metal Sound in the sound moves, so Soundproof blocks
before the first accuracy draw, alongside Growl. The stat handler returns true
and preserves move experience credit even at the cap or under stat protection;
no damage formula or second damage accuracy draw is used.

The v10 predecessor factory and its four Steel authoring/policy modules are
frozen before successor admission changes. Earlier hashes remain untouched.
This prerequisite neither widens condition admission nor enrolls Magnemite.
Thundershock/paralysis, earlier wild moves, onboarding, area services/residents,
recruitment and separate chapter-five work receipts remain in implementation.

### v11 shared move-status boundary

Thundershock uses the canonical `move-thunder-shock` identity. Source
`move_orb_actions_2.c:871–884` applies a10% secondary only after positive nominal
damage; `dungeon_move_util.c:1179–1209` checks valid actors, nonterminal floor,
non-revived target, then chance/Serene Grace and finally Shield Dust. Paralysis
(`move_orb_effects_1.c:1289–1350`) replaces the burn class after Safeguard/Limber,
consumes the exclusive-upper `{1,2}` duration draw only for a new application,
and yields two turns including the source+1. Repeats do not refresh. Static
shares this exact owner, preserving its actual originating ability. Synchronize
recurses through adjacent opposite-side combat actors in native direction order;
its already-paralyzed guard stops cycles and it retains the original source.
The existing scheduler expires the burn-class timer at own beginning, subtracts
one speed stage, and prevents attacks/moves while allowing legal movement.

Hypnosis samples3..6 before sleep protection. Safeguard, Nonsleeper, Insomnia,
Vital Spirit and nonsticky Insomniscope block; finite Sleep/Nightmare do not
refresh, Sleepless/Napping reject, and Early Bird halves a newly applied timer.
Locators: `move_orb_actions_1.c:83–87`, `move_orb_effects_1.c:37–142`.

Charge owns its move slot in the bide class, with no timer or defense boost.
Electric damage consumes the existing fixed-point doubling rule. Completion of
any subsequent action clears the old Charge, including walking, waiting, items
and blocked moves; a newly applied Charge survives that action. Sleep/infatuation
skips also clear it. Linked-move execution remains explicitly unavailable, so
there is no fabricated chain exception. Locators: `move_orb_effects_3.c:31–110`,
`dungeon_action_execution.c:112,266–270`, `dungeon_move_util.c:412,450–452`.

Absorb captures Liquid Ooze before damage, then heals or deals residual damage
from half nominal damage (floor, minimum1), preserving same-hit faint behavior
and shared revival/faint settlement. Chance0 does not draw. Locator:
`move_orb_actions_2.c:385–416`. Quick Attack uses ordinary damage with the native
two-tile facing probe: corner cutting, ally skipping, and both destination
terrain checks. AI targeting remains a distinct owner. Locators:
`dungeon_move_util.c:890–905`, `dungeon_misc.c:746–789`.

Lightningrod is a cached native prephase choice: after spawning, scan active
team then wild slots and retain the last valid owner, regardless of side/range.
Fainting does not select a fallback; floors clear the cache. An enemy cached
owner redirects globally and wakes before the first accuracy draw, then
suppresses the move with no damage, secondary, or move experience credit.
This includes Charge's electric self action. Locators:
`dungeon_engine.c:388–432`, `dungeon_move.c:105–117,181–189,222–257`.
The persisted `moveState` cache is admitted only by the v11 root; v10 and all
older root shapes and policy dependencies remain unchanged. Older envelopes
are authenticated/admitted first, then initialize the newly supported field
cache from current actors prospectively; they do not fabricate prior effects,
recruitment, seen history, mail or jobs. Native phase refresh owns later changes.

The earlier wild species keep their full move inventories. Their native AI
selection, party AI and recruitment conversion remain separate active work;
this checkpoint does not claim them from effect availability alone.

## v12 onboarding and usable areas

The original source route is now integrated from completed Steel MAIN5,0 through
actual dream/base dispatch, Wigglytuff's proximity interaction, the distinct
Team ACT/Shiftry/Jumpluff encounter and rest at MAIN5,5. Normal Square exploration
owns the encounter trigger; buying an area or closing a menu cannot skip it.
MAIN substage assignments reset CLEAR_COUNT. MAIN5,1 INIT and the post-encounter
operation3 each refresh shops/board once; the already accepted Steel return and
bridge refreshes are not repeated. Browser days advance at the actual mornings.
Locators: `ground_data_b01p01a_station.h:54–69`,
`ground_data_t01p01_station.h:185–200,1940–1951,2097–2113,2393–2407`.

Wigglytuff opens Wild Plains and Mist-Rise Forest, then Power Plant, preserving
the already owned original starter-area union (`pokemon.c:66–128`). The name
question persists as a canonical ask/edit choice before Power Plant ownership.
Both naming branches converge on operation0x19, which grants Power Plant and
enrolls Magnemite in one transaction with same-revision receipts;
it is not a recruitment refusal. Magnemite begins resident, level6, HP38,
Attack20/SpecialAttack18/Defense20/SpecialDefense18, EXP4560, IQ1, default IQ/tactic,
Metal Sound/Tackle/Thundershock/empty, no held item, with exact grant provenance
representing Pokemon Square2 native origin70/floor0. Growth matches the existing
natural-level table exactly. Persistent PP0 represents zero boost, not empty
actor PP. Its historical ID cannot alias either starter; any live record must
bind species081 and the exact scripted grant, and must exist until enrollment
finishes. Locators: `ground_script.c:3479–3515`, `ground_data_t01p01_station.h:2235–2242`,
`pokemon.c:198–254`.

The factual shop table preserves all57 areas plus NONE, native order, total413
capacity, prices and unlock kind. Current purchases expose only unowned story
shop areas, with carried-money review and atomic recheck. Original area geometry
uses existing textured real3D environment kits and directional pixel actors.
Players walk beside residents to Join/Standby/Give/Take/Summary/Moves/CheckIQ or
Farewell. Original hero/partner protections, town four-slot/six-body limits,
whole-lot held swaps, free-slot Take and whole-fit Farewell storage fallback are
owned by the domain. Check IQ lists every threshold-eligible skill in native
order, including disabled skills, and offers a persisted Switch. Enabling a
skill clears the other flags in its exclusive group; disabling clears only
that flag. Enrollment still requires the exact initial defaults; later
settings use the shared permanent threshold/group admission.
Locators: `iq_skill_menu.c:26–38,126–131,183–186`, `pokemon_3.c:369–463`.
A full bag still allows Give's atomic old-held swap. Farewell
keeps acquisition history and cannot replay enrollment. The current gift has
origin70; rare-origin68/69 double confirmation belongs to later admitted recruits.
Locators: `dungeon_data.c:gFriendAreaSettings`, `wigglytuff_shop1.c:166–211`,
`wigglytuff_shop3.c:442–460`, `friend_area_action_menu.c:235–315,594–610,697–801`.

Onboarding's board refresh includes conquered Steel after Tiny/Thunderwave in
native order. It draws from Steel candidate floors5..9 and circularly rejects
fixed9, rather than drawing from a prefiltered four-floor list. The actual seen
pool expands to19 eligible species; Magnemite/Diglett/Skarmory remain excluded by
their source bans. Item mask and six eligible favorite-item rows retain native
order. Rewrites replace client/target/item only after the ordinary reward draw;
no eligible pair rewrite exists in this finite pool. Unchanged early reward
helpers are shared. Accepted old generator, records and policy owners remain
frozen; separate successor owners preserve old import admission. Static factual
ledgers/checker live under `tools/pokemon-dungeon/content/friends` and scripts.
Locators: `code_80958E8.c:180–345,408–434`, `code_803C1B4.c:267–297`,
`pokemon_mail.c:407–439`, `dungeon_info.c:23,157,246–249,2452–2465`.

Incoming admitted MAIN5,0 states have at most four old receipts and20 points,
so these refreshes remain native Normal rank. No claim or expedition is added
by onboarding. This is a bounded prerequisite: the two later work intervals,
Bronze escort objectives/rewards, complete party/early-wild move AI, extra-party
floor entry, wild offers/conversion, return-capacity choice and MAIN5,9 story
request remain active work. No rank cap or filtered escort substitute is claimed.
Gummi/Orb inventory identities remain intact; their use consumers remain open.

The accepted v11 factory/policy/root and old generator are pinned before v12
admission. v2–v11 envelopes authenticate and pass their exact policies first,
then receive `friends:null`; an existing v11 Lightningrod cache is preserved.
The new root validates each scene prefix, grant/name boundary, roster origin,
area purchase, old-history projection and navigable ground placement. Static
checks do not replace human gameplay, visual or device acceptance.

## V13 earlier wild move selection prerequisite

Tiny Woods and Thunderwave wilds now use the same sourced weighted selector as
Steel, with their exact complete learned inventories. Charge suppresses its own
weight and regular attacks while charging, gives non-Electric moves weight1,
and leaves Electric weights intact. Status Checker rejects redundant Charge
and Hypnosis against existing sleep; default friendly IQ does not apply wild
PP/status filtering. Cut-corners follows active actor order and Course Checker
when present. All-zero total PP retains Struggle. Exhausted/sealed move attempts
complete ordinarily before PP spend, last-used, target wake or experience flags.
Locators: `dungeon_ai_attack.c:53–340,341–533,754–828,830–903`,
`move_checks.c:115–120,453–478,612`, `dungeon_move_util.c:52–224,337–383`.

Earlier wild creation now uses native Status Checker/PP Checker/Item Catcher
and Go After Foes. Exact v12 factory/dependencies/root and FriendsState are
pinned before widening actor admission. Older imports authenticate and validate
first, then prospectively initialize only earlier-wild IQ/tactic, preserving
move/PP/RNG/seen/history and existing Friend Area progress. V13 uses unchanged
v12 authoring and root shape with a distinct campaign content revision.

This is move selection closure for the earlier fixed encounter inventory, not
complete AI. Native movement/remembered targets, party Item Master/throws, the
remaining actual party effects and move learning/replacement, companion faint
continuation, extra-party entry, escorts, recruitment and chapter-five work
remain required before those intervals open. No higher-level move is filtered
or invented level cap imposed to avoid those dependencies.

## Additional party stat consumers

Withdraw now uses the same defense+1 consumer as Harden, as in native dispatch.
Helping Hand resolves all room allies in active-actor order, excluding the user
unless confusion overrides targeting; its handler still rejects the user after
the common hit boundary. Each eligible target receives physical attack+1 then
special attack+1 with ordinary caps. Native AI has a separate enemy-room trigger
for Helping Hand, and its Status Checker guard requires a visible teammate with
both offensive stages below the cap. Default party lacks that checker. This
selection kernel remains preparatory until the rest of party dispatch closes.
Locators: `dungeon_move.c:985–987`, `move_orb_actions_2.c:843–857`,
`dungeon_move_util.c:875–889,930–982`, `move_checks.c:400–450`; immutable
AI action185 flags48 versus execution flags54 are retained separately.

No admission widening is needed: these effects use existing validated stat
stages. Other actual party move effects, native movement and recruitment remain
active dependencies.

## V14 direct status and revival consumers

Thunder Wave and Disable apply the original paralysis handler; Disable does not
seal a move. Both retain Safeguard/Limber/existing-paralysis guards, sourced
duration, speed change and adjacent Synchronize provenance. Thunder Wave still
uses its actual50% first accuracy and cached Lightningrod redirection. These
status handlers do not apply a damage type-matchup immunity.

Attract ignores gender and guards Safeguard/Oblivious/existing infatuation before
sampling4..5 plus1. Smokescreen samples1..5 before guards, stores plus1 only on
a new Whiffer application, and forces accuracy failure after the earlier self
hit branch while still consuming the normal accuracy draw. Reflect samples
10..11 plus1 without curer skills only when newly applied; it halves physical
damage before critical multiplication. All use native before-action class
expiry and clear on floor transition/revival. Current source actors and learned
move identities are checked before neutral projection to frozen predecessors.

Locators: `move_orb_actions_1.c:410–414,624–628`,
`move_orb_actions_2.c:886–890`, `move_orb_effects_1.c:307–337,1289–1351`,
`move_orb_effects_2.c:377–398`, `move_orb_effects_4.c:153–173`,
`dungeon_random.c:85–104`, `dungeon_move_util.c:735–757`,
`dungeon_damage.c:1296–1306`, `dungeon_turn_effects.c:448–553`.

Reviver Seeds now restore base PP for every existing slot while preserving
sealed flags. Native `dungeon_damage.c:642–644` follows ResetMonEntityData with
`sub_806A390` (`dungeon_misc.c:1288–1302`); the former browser claim of unchanged
PP omitted that second call. Player text and the older ledger note are corrected.
This does not change the source recruitment rule: accepting a defeated wild
heals HP but preserves its snapshot PP.

Rage, Water Sport, Leech Seed, the remaining actual party damaging families,
move learning/replacement and native party item/movement consumers remain active
before broader party dispatch and recruitment open. Rage specifically requires
the shared post-revival/faint damage-reaction owner, not a normal-hit-only hook.

## Shared damage and contact ordering prerequisite

The immediate damage owner now resolves fainting, revival and experience before
rolling admitted Static/Poison Point/Cute Charm reactions. Flags apply after
move-specific effects, with native distinct-actor/adjacency/status guards.
A revived defender can roll its ability after conditions reset; an attacker
revived by recoil or Liquid Ooze retains already rolled flags. Safeguard is
checked when applying all three effects. Causal ability ownership remains in
condition provenance, while the recipient is the native effect user/target.

Normal hits, Bide release, fixed items and self recoil share this boundary;
environmental damage uses explicit dummy provenance. Raw HP subtraction remains
narrow and never decides reactions. Rage, counter/retaliation and later contact
abilities are still separate incomplete consumers, with no broadened admission.
Qualified pinned Red source: dungeon_damage70–237/619–649/1398–1450,
dungeon_move1306, dungeon_move_util221–275, dungeon_logic608–620 and
ResetMonEntityData in dungeon_mon_spawn819–908. This is comparative evidence for
the Blue target, not executed gameplay proof.

V14 review correction: direct status handlers return their actual application
result. Protection and an already-active status now produce the existing visible
no-effect outcome; successful paralysis/infatuation/Whiffer/Reflect have explicit
status messages. Accuracy, experience credit, duration draws and no-refresh guards
keep their prior order. Review correction is presentation feedback only.

## Four further party damage consumers

Low Kick uses the apparent species/form's existing qualified weight/256 fact as
its final damage multiplier. Water Gun uses the existing corner-cutting front
geometry and ordinary damage pipeline. Metal Claw samples its 10% secondary
against the user, then raises physical Attack and records move experience credit;
the damaged target's death or revival does not replace the self guard. Mud-Slap
uses the native chance0 secondary helper (no draw), then Shield Dust and accuracy
drop protections; protection messages are suppressed as in its handler.

Qualified pinned Red: move_orb_actions_1:917–926, actions_3:254–269,
actions_4:116–131 and dungeon_move378/478/926/1075. Existing species-parameters
facts own Low Kick's numeric crosswalk. No new condition/root/save admission;
partner AI remains gated on its complete move, item and movement dependencies.
The complete starter coverage table also reconciles previously closed v11 moves.

## V15 burn, flinching and Rage

A separate v15 condition policy follows the frozen v14 factory. It validates
Ember burn, Bite/Bone Club/Headbutt flinching and self-owned Rage with actual
learned source identity, exact timer/counter/payload bounds and immunity checks.
Exact v14 envelopes validate before conversion; all earlier pins stay unchanged.

Ember thaws before damage calculation and Accuracy2, then samples the 10% burn
secondary. Burn rejects Safeguard/Water Veil/Fire/water terrain, replaces its class
without refreshing, spreads through native Synchronize directions, and deals
5 HP every20 upkeep counts (immediate at zero). Its 128-to127 sentinel persists;
there is no fabricated physical-attack penalty. Flinching chances are20% Bite,
10% Bone Club and25% Headbutt; the common secondary gate precedes Safeguard and
Inner Focus, with a two-count class and no refresh. Flinching blocks attacks,
while movement and items retain their independent rules.

Rage lasts5–10 counts, ignores curer duration modifiers and never refreshes. It
retains the learned self slot, expires after Bide upkeep and does not force a
pass/release. Surviving real-monster damage raises its target's Attack after
faint/revival, including self recoil and fixed thrown damage. Dummy environmental
burn/poison/hunger/Liquid Ooze never triggers it; revival clears Rage first.
Periodic damage now uses that same immediate dummy-source owner, including its
indefinite-sleep wake and revival boundary. Duplicate statuses and Rage expiry
have explicit original feedback. Contact rolls still precede move secondary,
with status application afterward.

Source: pinned comparative Red actions_1:188/573–588/689–703,
actions_2:364–376/487–501, effects_1:339–425/1258–1287,
effects_3:31–81, damage70–105/271–284/1398–1450 and turn_effects205–216/382–390.
Full party AI, line moves/Bubble, Water Sport/Leech Seed/Pay Day, extra-party
entry/faint, escort/work and recruitment/capacity remain active dependencies.

## Line moves and Bubble speed prerequisite

Razor Leaf and Bubble now follow a ten-tile straight line, cutting corners and
stopping at walls or the first actor. Their execution category can hit allies;
a protected client blocks without becoming a target. The native AI flags instead
seek opposing actors in active order, deduplicate directions and honor Course
Checker's wall/intervening-actor checks. Without Course Checker, native line
eligibility can choose a target behind an obstruction; execution still stops.
The ordinary damage owner supplies Razor Leaf's catalogued critical chance.

Bubble samples its10% common secondary before speed protection; Safeguard,
zero speed and a full negative-counter array prevent duration draws. The first
free negative counter receives the native curer-aware6..7 sample plus1 via the
shared pure speed owner. All five counters, expiry and cached-stage admission
already existed in exact predecessor policies; this adds no schema or condition
source widening. Source: dungeon_move_util580–737, dungeon_ai_attack443–473/
535–606/830–875, actions_1:168–180 and effects_1:1392–1437. Qualified Red comparison
for Blue; party dispatch and remaining task integration are still pending.

Rage follow-up: leader Give/Take now uses the native class distinction. Bide and
actual two-turn charging statuses block transfer; Rage and Charge do not. Native
CheckVariousConditions/CheckVariousStatuses and IsChargingAnyTwoTurnMove own that
boundary, including the source's unreachable extra Charge check. Ordinary item
use and movement already remain independent of Rage.

## Pay Day and shared floor drops

Unrevived nonleaders drop the whole held lot before experience/recruitment/removal.
The shared placement owner preserves that instance identity, searches native
center/cardinal/diagonal/radius2 order and attempts one of64 floor item slots.
Walls, stairs, traps and existing items block; actors do not. Origin traps are
revealed and preserved (trap.c235–252), never removed. Water/lava accepts an item;
void loses it. Failed placement discards the lot with feedback. Missed rocks reuse
this owner with the native center-skip; their old lava-loss approximation is fixed.

Pay Day requires positive nominal damage, a still-valid user and actual target
removal. Revival yields no money. It makes one index draw, folds the index until
the existing amount table fits floor.moneyUpperBound*40, then drops a clean pile
after any held item; no purse credit or sticky draw. Future recruitment must
complete its target retention/removal decision before this post-hit branch.
The shared XP boundary also now requires a team attacker; a hostile faint caused
by another hostile does not award party experience.

Source: qualified pinned Red damage650–723, items59–83/296–329/432–540/707–720,
trap235–252, projectile_throw384 and actions_3:370–390/545–562. Existing canonical
item shapes and exact admission are unchanged. Recruitment and full Friend Area
integration remain pending; no game execution or human acceptance is implied.

## Exact damage-status predecessor

The accepted v15 factory and damage-status policy are independently frozen before
Leech Seed or Water Sport admission broadens. The source manifest now pins68
modules, retaining all earlier hashes,14 exact bodies and2 factual manifests.
This checkpoint changes no runtime revision, migration or gameplay behavior.

## V16 Leech Seed and Water Sport prerequisite

A separate v16 field-move factory and strict root follow the frozen v15 factory.
Fresh adventure creation initializes an explicit null moveState; the first native
refresh creates its floor-bound Water Sport counter. Incoming v2-v15 envelopes
pass their exact original admission before conversion. Conversion preserves the
old Lightningrod cache and all effects/RNG/history while prospectively setting
Water Sport to zero. All68 module pins,14 exact bodies, predecessor root shapes
and both factual manifests remain unchanged. New-game v15 initialization was
already present in the published baseline; this change extends it to v16 rather
than claiming a recovered v15 fix or unavailable historical commits.

Leech Seed uses existing corner-cutting front targeting and first accuracy only.
Self, Safeguard and Grass guards precede the curer-aware10..11 sample plus1;
already seeded targets do not refresh or draw. The linked actor is the original
learned-move user on this session/floor. Admission requires both the seeded
recipient and linked user to be live in active slots with exact identity and
payload agreement. Beginning-of-opportunity expiry precedes sureShot; the pulse
runs after poison/burn and before Bide/Rage. Countdown starts0, resets2, and
transfers fixed10 HP independent of actual HP loss, including same-pulse faint
or revival. Freeze skips both sides after countdown reset. Liquid Ooze is
captured before victim damage and damages the linked user by10 instead of healing.
Dummy-source damage shares wake, faint/revival/drop settlement without contact,
Rage or experience. Residual damage releases Petrified/indefinite Sleep first;
healing alone does not. Revival and faint/removal clear every link to the old
actor; floor cleanup and Rapid Spin already clear the recipient class.

Water Sport's self/floor action always samples10..11, including repeat use,
without curer modifiers or plus1. The floor-wide counter survives Lightningrod
refresh and expires at the native base-speed phase boundary before experience,
with an explicit fieldUpkeep hook; actor actions and wind do not tick it.
The existing fixed-point damage pipeline now receives its active flag, halving
Fire damage for both sides. New floors and town clear the owner. Native Weak
Type Picker returns weight2 for Fire under Water Sport; that weighting remains
an explicit full party-AI dependency, and no complete party selection is claimed.

Source locators at comparative Red pin
`6bcbec4f906938c0243aa2026bcbd41b577bab85`: `move_orb_actions_4.c:195–200`,
`move_orb_effects_2.c:239–316`, `dungeon_config.c:125–126,168,216`,
`dungeon_turn_effects.c:302–340,495–502`, `move_orb_effects_5.c:541–555`,
`move_orb_actions_3.c:241–252`, `weather.c:239–249,302–307`,
`dungeon_engine.c:435–450`, `dungeon_damage.c:641–644,902–905,1006–1007` and
source-removal `dungeon_misc.c:RemoveEntity`/`sub_8078084`. Existing catalogs supply
Blue-qualified move metadata; exact Blue binary parity remains unclaimed.
Static review does not establish game execution, human play or visual acceptance.
Remaining native party item/movement/selection, move learning/replacement,
extra-party entry/faint, escort/work and recruitment/capacity block broader
Friend Area continuation.
