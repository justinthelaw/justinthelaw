# Move targeting

`src/blue/mechanics-targets.js` owns actual impact candidates and relations.
It consumes no turn/RNG/save mutation. Effect admission remains in
`supportsMove`; AI intent is a separate owner in `mechanics.js`.

Comparative Red revision:
`013475aa04f5be3191e5527c186d9bfceae7cae0`.

| Source owner | Selected behavior |
| --- | --- |
| `dungeon_move_util.c:SetTargetsForMove` | Adjacent areas scan from facing in native S, SE, E, NE, N, NW, W, SW order |
| `SortTargets` | Preserve other recipients; move the admitted user last |
| `SetNewTarget` | Categories 0/4 enemies, 1 allies/self, 2 either, 3 geometry-selected self, 5 others, 6 allies excluding self; confusion overrides relations |
| `dungeon_misc.c:sub_80696A8,sub_80696FC,sub_806977C` | Distinct front, corner-cut and front-two checks; front-two may pass an inadmissible first actor, lines stop there |
| Native action 355 | Regular attack category 0 |

Bonemerang resolves targets for each pass; PP, hit count and blockers stay
with the execution owner. Charged releases supply their effective target
profile first. Wild slots now preserve vacancy/order as documented in
[spawns](blue-wild-spawns.md); deleted historical slots cannot be reconstructed.

Baton Pass is unavailable. Its native self-exclusion must be restored before
enabling it or an unguarded copied-move route; the current generic relation
resolver does not implement that exception. Helping Hand's self-failure belongs
to its effect owner.

## AI intent

`blue-source.json` retains independent native AI flags:

| Move | Actual | AI |
| --- | --- | --- |
| Agility, Safeguard | `0x31` | `0x30` |
| Heal Bell | `0x31` | `0x331` |
| Helping Hand | `0x36` | `0x30` |
| Baton Pass | `0x32` | `0x32` |
| Psych Up | `0x02` | `0x02` |
| Pay Day, Covet | `0x00` | `0x00` |

`moves.c:GetMoveTargetAndRange` and
`dungeon_ai_attack.c:IsAITargetEligible` distinguish intent and AI conditions.
Runtime has explicit admitted-move resolver sets, including Safeguard's room
enemy intent; it does not generically activate every retained AI flag.
See [Safeguard](blue-safeguard.md) and [mechanics](blue-mechanics.md) for current limits.
Heal Bell and Psych Up are hero-only in the selected roster.

Neutral/protected actors, invulnerable poses, Nontraitor IQ and broader geometry
need separate admission. Static source/data checks do not establish Blue binary
identity or manual move acceptance.
