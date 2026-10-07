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
