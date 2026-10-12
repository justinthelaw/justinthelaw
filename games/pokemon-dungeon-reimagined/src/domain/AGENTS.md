# Selected domain rules

Only numerical rules, Tiny Woods generation, random state and plain-data
validation remain here; the opening runtime lives in `../blue/`.

| Path | Responsibility |
| --- | --- |
| `rng.js` | Native-family stream plus exact legacy random-state compatibility |
| `generation/` | Admitted Tiny Woods layouts, features and support |
| `rules/` | Fixed-point arithmetic, type context and damage |
| `state/plain.js`, `shared-types.js` | Plain-data validation and shared JSDoc types |

Preserve integer rounding, admission order and every reachable random draw,
including zero-bound/discarded draws. Do not restore campaign graphs, general
weather or unused layout families. Changes to roster/items/moves require reviewing
the assumptions behind pruned branches. Static checks may parse these files;
automated checks must never import or execute them.
