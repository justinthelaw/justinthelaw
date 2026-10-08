# Thunderwave Cave continuation evidence

This Task 4/5 slice follows the accepted Magnemite request. Five exploration
floors precede a separate rescue scene; the terminal scene is not B6F. The bounded route is implemented; this is not campaign, gameplay or visual acceptance.

## Source boundary

Detailed native traces below use original **Red comparative** commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85`. They are chosen browser behavior,
not proof of Blue binary parity. The original Nintendo **Blue** manual supports
the starter toolbox, bed saves, Gravelerock ranged throwing and recovery from
poison/paralysis/burn on the next floor (printed p31, PDF p15). The controller
rechecked this primary source on 2026-10-06. No commercial prose, art, geometry
or implementation code is copied.

| Pinned comparative source | Consumed finding |
| --- | --- |
| `ground_event_data.h`, `EVENT_M01E02A_L003/L004/L005/L006`, `GETOUT_M01E02A`; `code_80A26CC.c` | Actual departure owns MAIN(3,6); failed return uses the base interior. Successful return sequences end-map group1, cave-entry group3, base group23, conquered, MAIN(4,0), interior and save. |
| `ground_data_d02p01_station.h`, group3; `script_item.c`, `sScriptItemsTable[3]`; `textbox.c` special text dispatch | Thank-you reward is 500 Poké, Reviver Seed (58), Rawst Berry (63). No recruitment or ordinary-job unlock here. |
| `ground_data_d02p02_station.h`, group1; `ground_data_b01p01a_station.h`, group23 | Joined Magnemite are escorted out and separate outside. The partner admits first-job nerves and heads home to sleep. |
| `monster_data.json`, `chanceAsleep` | Rattata10, Nidoran♀15, Poochyena8, Voltorb0, Elekid8, Plusle8, Minun8 percent. Plusle remains gated in Blue. |
| `dungeon_damage.c`, `HandleDealingDamage_Async`, `dungeon_config.c` | Adjacent Poison Point12% has no physical-type restriction; Static12% and Cute Charm12% require physical damage. Status-disabled defenders cannot react. |
| `move_orb_effects_1.c`, `dungeon_random.c`, `dungeon_range.c` | Poison blocks Poison/Steel types and Immunity, starts counter128 then persists at127; paralysis range[1,2)+1, charm[4,6)+1. Self-Curer/Natural Cure modify finite timers; Sleep Seed uses[3,7) without entry +1 and Early Bird can halve it. |
| `dungeon_turn_effects.c`, `dungeon_config.c` | Poison suppresses regeneration and deals4 at countdown0, then every10 end opportunities. Counter127 is indefinite. |
| `dungeon_item_action.c`, `move_orb_effects_2.c` | Apple restores50 Belly or adds5 maximum at full integer Belly, cap200. Seeds/berries restore5; Oran heals100; Cheri cures paralysis; eaten Blast Seed deals45 to the front actor. |
| `item_data.json`, `items.c`, `dungeon_items.c` | Gravelerock generates[3,5); toolbox has20 slots. Pickup selects largest nonfull same-sticky stack, then largest opposite-sticky stack, saturates at99 and propagates sticky. |
| `dungeon_pos_data.c`, `dungeon_range.c`, `dungeon_projectile_throw.c` | Arc search has a directional ten-tile priority fan (N/S last-row radius8:17 positions), fallback two tiles ahead,90% hit, fixed20 damage and source-ordered nearby ground fallback. |
| `trap.c`, `move_orb_effects_4.c:sub_8079E34` | Wonder Tiles generate visible and remain reusable; stepping resets six stages to10 and four multipliers to1. No unseen-trap avoidance sample applies. |

## Preparation checkpoint

`generation/encounters.js` centralizes the existing threshold-then-availability
rejection algorithm and its1024-attempt engineering bound. Initial generation
retains its existing eligibility callback. The separate current expedition
facts include cave sleep thresholds and one finite Blue eligibility predicate;
periodic arrival integration follows in the route consumer commit. Catalog
pools are unchanged; exclusions are not removed from data. This checkpoint does
not enable Thunderwave entry or change predecessor save validation.

Static lint and strict types pass in the implementation workspace. No game
module was imported/executed, no game tests ran, and no manual play is claimed.

## Implemented route and shared consumers (2026-10-07)

The accepted request now offers actual departure. Departure changes MAIN from
(3,5) to (3,6) and uses the same generation, turn, actor and settlement owners as
Tiny Woods. Initial encounters and periodic arrivals share the eligible source
pool selection path. Cave wild actors retain their source level3/4 stats,
learnsets and spawn-sleep probabilities; Plusle's Blue exclusive gate remains
closed in both paths. The five catalog floors, ordinary item pools and Wonder
Tiles are unchanged factual data.

The shared item owner acquires into the starter toolbox, merges Gravelerock
stacks with native saturation, and supports self-use of the admitted consumables
and directional rock throwing. Enemy priority selects the rock destination;
its final tile occupant, including a teammate at the two-tile fallback, receives
the ordinary hit check. Fixed Blast Seed/rock damage shares faint and XP
handling; source fixed-item calls disable contact reactions. Ordinary damage
resolves the admitted contact abilities and recipient immunities, timers,
poison damage, regeneration suppression, paralysis speed and attack restrictions.
Next-floor cleanup removes temporary conditions and their historical sources;
Wonder Tiles reset only stat stages/multipliers. Apple maximum-Belly changes
remain session gains and reset on a fresh expedition.

At the final stairs, a separate original rescue scene pauses the session.
Acknowledging it settles inventory, growth, money and the browser clear receipt
atomically, then starts the cave-entry thanks. Acknowledging thanks grants
500 Poké, one Reviver Seed and one Rawst Berry with one reward receipt. Overflow
uses existing item storage. The evening then advances native MAIN to (4,0) and
returns the hero alone to the existing interior. Browser save/export remains
available at every committed boundary. No next day, jobs, Friend Area or
Magnemite recruitment is inferred. The browser clear receipt is deliberately
an expedition-settlement record at rescue acknowledgement; the native story
progress flag remains at (3,6) through thanks and changes only after the evening.
This is not a claim to reproduce native event interpreter timing byte for byte.

Fainting, wind expulsion and give-up retain the existing sourced non-reset loss
rules and return to the interior with the accepted request available to retry.
They award neither clear nor reward. Existing individual/roster identities and
move slots survive expedition entry, floor changes and settlement. Magnemite
are presentation-only scene actors. Forest, cave and town kits choose their own
lighting; all rendering consumes read-only snapshots and original placements.

## Save admission and remaining scope

Current content is v5. Held-v2, v3-team and v4-morning imports authenticate the
original envelope/body hash, validate against their exact predecessor policies,
then convert atomically and validate against current content. The original
expedition module remains unchanged; only the four policies whose current
semantics expand are isolated in the current module. The unchanged scheduler,
shape validators and historical wrappers stay shared. Independent source pins
now cover25 unchanged modules,7 exact function bodies and2 factual manifests;
new morning pins were calculated from the accepted `be2fe092` baseline, never
from changed semantics. Predecessor identity admission also excludes new scenes,
grants, conditions, encounter IDs and traps.

The finite browser decision policy still uses ordinary AI attacks/follow/chase;
source Run Away's HP threshold adds deterministic visible-threat retreat.
Enemy move selection, partner item tactics and complete native AI parity are
not claimed. Wild cumulative XP is the browser's normalized growth projection,
not proof of the unused native constructor field. Supported items expose
self-consumption and Gravelerock throwing; general inventory operations remain
future shared work. The terminal Reviver Seed reward has no enabled subsequent
expedition consumer yet. Later town services/story routes remain gated.

Focused lint, strict JSDoc types, source-pin and catalog/navigation audits pass.
No game module was executed or imported, no automated game tests or playthrough
ran, and no browser game boot or human play/visual/device acceptance is claimed.
Independent route review and controller full export checks remain separate gates.
