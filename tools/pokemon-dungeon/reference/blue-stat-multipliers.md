# Charm and Screech stat multipliers

This note qualifies the mechanics implementation for retry-reachable Charm and
Screech in the Blue opening scope. The comparative source is pinned Red Rescue
Team commit `013475aa04f5be3191e5527c186d9bfceae7cae0`. Blue binary identity and
manual late-level acceptance remain unverified.

The exact move tuple is checked against `data/move/move_data.json` at that
revision (Git blob `19f186845d6c41afe1584feddbf4e278c57885f9`, SHA-256
`fd5777d6514ed6fc5b2fb28c24e6e04654b4b1a17e157775e4d05c48b46131d8`). Charm's native `accuracy1`
is 75 and `accuracy2` is 100; Screech's are 100 and 88. The exported opening
record maps those fields to `accuracyBeforeEffect` and `accuracyAfterDamage`.

## Native action and arithmetic owners

- `src/move_orb_actions_1.c:CharmMoveAction` calls
  `ApplyOffensiveStatMultiplier(..., STAT_INDEX_PHYSICAL, IntToF248(0.5), TRUE)`.
- `src/move_orb_actions_1.c:ScreechMoveAction` calls
  `ApplyDefensiveStatMultiplier(..., STAT_INDEX_PHYSICAL, IntToF248(0.25), 1)`.
- `src/move_orb_effects_1.c:ApplyOffensiveStatMultiplier` and
  `ApplyDefensiveStatMultiplier` multiply the existing Q8 slot, clamp below
  0.01 to `IntToF248(0.01)` (integer value 2), clamp above 99.99, and choose the
  fell/rose/no-change message by comparing old and new values.
- `src/math.c:u24_8_mul` shifts the product by eight and increments when bit
  seven of the discarded portion is set. For these positive values the browser
  equivalent is `floor((value * factor + 128) / 256)`.
- `src/dungeon_damage.c` multiplies the stage-adjusted raw offense by the
  attacker's offensive slot and raw defense by the target's defensive slot,
  then converts each Q8 result to an integer. Physical and special select index
  zero and one respectively.

The native drop guard runs before mutation. Both helpers call
`IsProtectedFromStatDrops`, which checks Mist and then Clear Body/White Smoke;
Charm additionally checks Twist Band and physical Hyper Cutter. The selected
runtime has no Mist state or Twist Band item, and none of its 20 species has
Clear Body, White Smoke, or Hyper Cutter. Those unreachable branches are not
carried in the scoped handler. Any later roster, item, or Mist expansion must
join this owner before reusing the admission.

Physical multiplier-down presentation calls effects 404 (offense) and 399
(defense), both present in the shipped battle bank. Charm's move route also
uses shipped preparation effect 15. Screech's motion record requests travel
effect 52, which is absent from both shipped banks; coordinated presentation
work is required before complete admission can be claimed.

## Psych Up and persistence

`src/move_orb_actions_2.c:PsychUpMoveAction` loops over both physical and
special indices and copies offensive stages, defensive stages, hit-chance
stages, offensive multipliers, and defensive multipliers. The scoped actor has
six corresponding stage keys; the mechanics copy now also includes all four Q8
multiplier slots, defaulting an absent historical slot to neutral 256.

New actors store all four Q8 values at 256. Dungeon-floor entry resets them to
256 with the other volatile stat modifications. Save validation accepts either
all four bounded integer slots or none. Thus historical opening saves remain
valid and neutral without a version bump or forced rewrite; partially shaped or
out-of-range multiplier payloads are rejected.

An old valid save can already contain a late learned Charm or Screech and use
it before any floor transition. That target initially has none of the four
fields. The handler therefore captures the pre-effect actor first, then lazily
initializes all four live slots to 256 before changing the selected physical
slot. Its next save has a coherent four-field shape. Psych Up independently
writes all four slots, so every current multiplier mutation owner either starts
from a complete new actor or performs a complete historical-save upgrade.

No timer, callback, RNG draw, target scan, or scheduler rule is added. Static
syntax, lint, types, JSON facts, and source inspection qualify this change; D05
prohibits importing game modules or automated playthroughs.
