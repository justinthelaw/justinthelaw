# Scoped move targeting

`mechanics-targets.js` owns actual impact candidates and relation admission.
It reads the current scoped roster and consumes no turn, random draw or save
mutation. Effect admission remains in `supportsMove`; this extraction enables
no additional move effects or AI policies.

The comparative source is Red Rescue Team revision
`013475aa04f5be3191e5527c186d9bfceae7cae0`:

- `dungeon_move_util.c:SetTargetsForMove` supplies geometry and candidate order.
  Adjacent-area moves scan eight directions starting at the user's facing, in
  native `S, SE, E, NE, N, NW, W, SW` order. The browser's movement direction
  array runs in the opposite order and remains unchanged.
- `dungeon_move_util.c:SortTargets` then preserves the other candidates while
  moving an admitted user to the end. This matters for confused room moves;
  it does not reorder the remaining room roster.
- `dungeon_move_util.c:SetNewTarget` admits enemies for category 0, allies
  including the user for 1, either side for 2, geometry-selected self for 3,
  enemies for an effective released category 4, all except self for 5, and
  allies except self for 6. Confusion overrides the ordinary relation checks.
  Baton Pass excludes its user before that override. Helping Hand's separate
  self-failure stays with its effect owner.
- `dungeon_misc.c:sub_80696A8,sub_80696FC,sub_806977C` distinguish front-one,
  corner-cut and front-two checks. Front-two may continue past an inadmissible
  first actor; a straight-line move stops at its first actor.
- Native action 355 and the canonical `actions-02.json` record both specify
  regular attack category 0. The opening exporter now retains that record
  instead of overriding it to category 2. Its other numerical facts and
  existing regular-attack AI weight remain unchanged.

Bonemerang still calls the shared target resolver for each pass. Its hit count,
PP owner and attack-blocking checks remain outside this module. Existing room
geometry and room roster ordering are retained; correcting native wild-slot
reuse also affects spawn and NPC scheduling and belongs to a separate owner.
Old saves do not contain enough removed-slot history to reconstruct that order.

## AI prerequisite

Actual impact categories must not replace native AI intent. The existing
`tools/pokemon-dungeon/content/steel/ai-facts.json` includes the native AI flags,
but this patch does not export or activate them:

| Move | Actual flags | AI flags |
| --- | --- | --- |
| Agility, Safeguard | `0x31` | `0x30` |
| Heal Bell | `0x31` | `0x331` |
| Helping Hand | `0x36` | `0x30` |
| Baton Pass | `0x32` | `0x32` |
| Psych Up | `0x02` | `0x02` |
| Pay Day, Covet | `0x00` | `0x00` |

`moves.c:GetMoveTargetAndRange` chooses between these profiles, while
`dungeon_ai_attack.c:IsAITargetEligible` also applies AI conditions. Agility and
Safeguard can inspect an enemy intention while their actual effect reaches
allies. Heal Bell additionally requires its status-cure condition. Implement
those owners before enabling the currently unsupported effects. The current
AI choice predicate remains unchanged.

Charged target-profile changes, neutral/protected actors, invulnerable poses,
Nontraitor IQ and additional geometry remain separate prerequisites. They are
not inferred from the current two-member Tiny Woods state.

Static source, factual JSON, syntax and type inspection qualify this work.
No game module or automated playthrough is executed; exact Blue binary and
manual move acceptance remain separate.
