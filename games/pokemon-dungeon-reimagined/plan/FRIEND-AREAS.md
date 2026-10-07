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
