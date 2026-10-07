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
