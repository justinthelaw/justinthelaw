# Thunderwave Cave continuation evidence

This Task 4/5 slice follows the accepted Magnemite request. Five exploration
floors precede a separate rescue scene; the terminal scene is not B6F. Work in
progress is not campaign, gameplay or visual acceptance.

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
| `dungeon_damage.c`, `TriggerTargetAbilityEffect`, `dungeon_config.c` | Adjacent Poison Point12% has no physical-type restriction; Static12% and Cute Charm12% require physical damage. Status-disabled defenders cannot react. |
| `move_orb_effects_1.c`, `dungeon_random.c`, `dungeon_range.c` | Poison blocks Poison/Steel types and Immunity, starts counter128 then persists at127; paralysis range[1,2)+1, charm[4,6)+1. Self-Curer/Natural Cure modify finite timers; Sleep Seed uses[3,7) without entry +1 and Early Bird can halve it. |
| `dungeon_turn_effects.c`, `dungeon_config.c` | Poison suppresses regeneration and deals4 at countdown0, then every10 end opportunities. Counter127 is indefinite. |
| `dungeon_item_action.c`, `move_orb_effects_2.c` | Apple restores50 Belly or adds5 maximum at full integer Belly, cap200. Seeds/berries restore5; Oran heals100; Cheri cures paralysis; eaten Blast Seed deals45 to the front actor. |
| `item_data.json`, `items.c`, `dungeon_items.c` | Gravelerock generates[3,5); toolbox has20 slots. Pickup selects largest nonfull same-sticky stack, then largest opposite-sticky stack, saturates at99 and propagates sticky. |
| `dungeon_pos_data.c`, `dungeon_range.c`, `dungeon_projectile_throw.c` | Arc search has a directional ten-tile priority fan (N/S last row width8), fallback two tiles ahead,90% hit, fixed20 damage and source-ordered nearby ground fallback. |
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
