# Opening factual checks

`scripts/check-blue-facts.mjs` reads JSON using Node built-ins. It does not
import game modules, exporters, retired catalogs or test fixtures.

| Input under this authoring package | Independent checks |
| --- | --- |
| `content/blue-source.json` | Selected species/moves/floors, donor hashes, complete hero growth/learnsets |
| `content/blue-onboarding/{algorithm,questions,results,partners,sources}.json` | 56 questions, 140 score maps, 13-nature order, 26 gender outcomes, ten partners, 129 eligible pairs, 16 initial loadouts |
| `content/blue-wild-spawns.json`, `blue-secondary-gates.json` | Wild sleep and raw-zero secondary caller facts |
| `content/rule-runtime/type-matchups.json` | Independent 324-cell type chart and type identities |

Quiz policy checks eight category-exclusive main questions, the unscored
menu-99 Brave follow-up and circular first-maximum ties. The Hardy/Docile tie
maps 60,495:5,041 over 65,536 values; it is not uniform.
[Comparative personality source](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/personality_test1.c)
qualifies sampling/ties without asserting Blue binary or correlated-RNG identity.
The [type chart source](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/dungeon_config.c#L382)
does not by itself verify dual-type/ability composition.

## Pins and projection

The canonical selected-record digest is
`d8c13d77871528f7c9daec7152db8c8acb98111b67847c42c4aff4415e6e3b4f`;
donor attribution has a separate pin. Never refresh either merely from a new
export. A factual correction requires source review and a deliberate pin change.
Object key order is irrelevant; array order is significant.

Before pruning, an independent comparison verified all 28 donor SHA-256 values
and every selected record. Paths/hashes remain in `blue-source.json`; donors
are recoverable at `882cdd14c25b7d79445a637f3dcd97d2c92f0c35`.
The reviewed Rapid Spin correction changes action 096's cleanup/gating facts,
with six pinned native owners; the other 114 action records and donor hashes remain.

The authoring bundle retains 22 profiles, 115 actions and 60 timers. Runtime
projects 20 combat profiles and 101 moves: 16 starters retain level-1–100
growth/learnsets; four level-1 wilds retain initial moves and two growth rows
for the next-level EXP rejection boundary. Caterpie/Butterfree keep story/art
resources but no unused combat profiles.

Playable quiz JSON omits source evidence and later Friend Area metadata;
the checker compares every projected value against full catalogs.
Independent joins also cover content-addressed IDs, increasing EXP rows,
cumulative-table hashes, full-PP level-5 loadouts and same-type exclusions.
These are factual/data checks, not execution or cartridge-play evidence.
