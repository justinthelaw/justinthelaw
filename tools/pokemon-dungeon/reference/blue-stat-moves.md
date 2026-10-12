# Foresight and Psych Up

These retry-reachable moves use
[pinned comparative Red source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
Blue binary/audio/frame identity and manual late-level casting remain unverified.

## Foresight

Mudkip learns it at level 19, Machop at 22. Exact admission requires the
front/opponent profile, 22 PP, accuracy 100, one pass, evasion clamp and
Ghost-immunity facts. The shared executor owns PP, targeting, accuracy and EXP marking.

`move_orb_actions_1.c:590` calls `move_orb_effects_2.c:916`.
Runtime clamps evasion above neutral to 10, retains lower stages and reports
the non-Ghost result. The closed 20-species combat roster contains no Ghost;
adding one requires exposed-state implementation. Safeguard is now admitted
separately; this handler performs no Safeguard-specific branch.

`dungeon_8041AD0.c:743` substitutes numeric `TYPE_GHOST=14` as the visual
effect for non-Ghost targets. Therefore effect 14, not 122, is selected:
`efob000`, palette 3, attachment -1, 11 frames / 22 ticks.
The generic owner captures placement once, retains the terminal frame and
keeps the native 100-tick maximum wait.

## Psych Up

Psyduck learns it at level 31 and is hero-only. `move_orb_actions_2.c:198`
copies stages and multipliers. Runtime copies all six stages and all four
Q8 offensive/defensive slots, defaulting absent historical slots to 256.
See [Charm/Screech and persistence](blue-stat-multipliers.md).

The comparison in `move_checks.c`, called by `dungeon_ai_attack.c:671`,
belongs to AI Status Checker, not a human-cast rejection rule.
The ordinary target route owns effect 205 once before the copy:
`efob058`, 23 frames / 35 ticks. Do not add a duplicate generic effect.

## Media limits

Sounds 613 and 756 are not implemented by these admissions. Sequence 756's
60 notes exceed the finite scheduling representation, including sub-frame
timing; raising a voice limit alone is insufficient.
Current unsupported-move totals belong in [move coverage](blue-move-coverage.md).

The [immutable admission record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-stat-moves.md)
retains prior pixel/archive preservation counts and the ignored
`.work/blue-parity-20261011/{stat-review,stat-art,stat-audio}/` evidence pointers.
