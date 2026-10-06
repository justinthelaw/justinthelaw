# Independent profile / permanent Pokémon review

Reviewed 2026-10-06 against base `958b11f7dad1123f5158aa8bb45aed236f36bc7d`.
Scope: new `content/state/{profile,pokemon,pokemon-rules}.js`, changes to
`content/state/identities.js` and `content/state.js`, and
`plan/STATE-PROFILE-POKEMON.md`. Paths below are relative to
`games/pokemon-dungeon-reimagined/` unless explicitly described as source/cache.

## Verdicts and findings

**Spec: pass for the scoped supported-subset responsibility.** The profile
policy and IQ/tactic joins are concrete; permanent Pokémon admission validates
supported state and retains precise missing acquisition/evolution requirements.
The approved retained-stat interpretation is implemented without historical
receipt demands. Commands, full permanent roster admission, complete
CampaignContent, initial opening and P07-B completion are not claimed.

**Quality: pass.** No actionable P0/P1/P2/P3 implementation findings identified.
Static lint, strict types, relevant catalog checks and independent source/data
comparisons passed. There are no requested implementation fixes from this review.
This does not certify gameplay, full-game acceptance, release, merge or deployment.

## Spec and code evidence

| Responsibility | Reviewed locations and conclusion |
| --- | --- |
| Source-backed original quiz identity | `content/state/profile.js:5-20,35-42`: stable revision binds the full accepted results-resource hash, all 13 natures × two columns receive distinct authored outcome IDs, and the accepted original ordered pair/form is checked. No current/evolved species reconstruction. |
| Original starter provenance | `content/state/profile.js:44-52`, `content/state/pokemon.js:108-111`: distinct hero/partner IDs, correct role/outcome, and chain root matching saved original form. The permanent policy checks chain continuity and current endpoint separately. |
| Names and MAIN58 | `content/state/profile.js:55-61`, `content/state/pokemon-rules.js:68-70`: native initial Pokémon name before the naming boundary, explicit chapter-58 retained-name admission, finite supported glyphs, one-to-ten cells, no trim or width rejection. Name edit permission remains a command/UI responsibility. Unsupported glyphs block rather than silently becoming accepted input. |
| IQ/tactic identities | `content/state/pokemon-rules.js:6-42`, `content/state/identities.js:34-35`: 23 real IQ symbols and nine available tactics, branded IDs, no IQ_NONE or three level-999 unavailable entries. Tables and rows are frozen; possession admission does not claim effects execution. |
| IQ groups and thresholds | `content/state/pokemon.js:48-58`: unique supported enabled skills, current permanent IQ threshold, mutually exclusive groups. Independently matched every numerical row to pinned source. |
| Tactic action versus snapshot | `content/state/pokemon.js:60-64`, `content/state/pokemon-rules.js:77-81`: all supported retained tactics are admissible regardless of receiving member level; separate selection helper checks supported identity and current dungeon leader level. No historical unlock receipt is invented. |
| Exact ownership and permanent form | `content/state/pokemon.js:9-13,23-27`: exact live roster object or exact entrant archive in the selected active/suspended session; detached lookalikes and direct rescue-suspended permanent records fail. Current explicit persistent form and its owned Friend Area are checked. Existing graph/economy policies retain identity reciprocity and aggregate capacity. |
| EXP and levels | `content/state/pokemon.js:30-37`: integer rational Quantity, denominator one, 0..9,999,999 total, levels 1..100, current species' cumulative-EXP interval. Evolution's source reset to the evolved species' threshold is compatible with this check; no actor reset is substituted for permanent state. |
| Approved retained stat components | `content/state/pokemon.js:38-46`: natural ≥1, bonus ≥0, effective sum capped at HP999/other255. Neither component is forced to the species' absolute table and no history receipt is required. The contract accurately labels decomposition/attribution as authored normalization; future bonus/level/evolution commands remain unimplemented. |
| Evolution history | `content/state/pokemon.js:65-80`: connected changed identities, explicit persistent endpoints, valid evolution levels, current endpoint match, no monotonic-level assumption. Each policy ID produces its specific unresolved edge-policy requirement. |
| Learned moves and duplicates | `content/state/pokemon.js:82-95`: nonempty move set, each move's Ginseng cap, zero permanent PP-capacity bonus, current/historical learnset membership without truncating after possible level loss, explicit Sketch path, and IQ333 special-move threshold. Duplicate MoveIds are not rejected; slot ownership/identity remains structural/graph work. |
| Link semantics | `content/state/pokemon.js:96-105`: set/AI flags only on sequence heads and the exact nine source charging moves cannot link. Existing graph checks cover adjacency, overlap and missing/duplicate slot references. |
| Other acquisition origins | `content/state/pokemon.js:112-121`: recruited met-level/session/original-actor identity checks, scripted met-level check, and distinct Shedinja evolution-extra/revision check precede their exact owner requirements. Unsupported admission cannot return success. |
| Diagnostics and immutability | `content/state/pokemon-rules.js:45-55`: issues and requirements capped at 100; invalid wins. Policies read structurally validated, frozen canonical input and do not mutate it. Catalog disposal/errors propagate to existing policy-unavailable handling. These functions do not claim to be standalone unknown-JSON parsers. |

## Source and dependency review

Read the controller brief/report, scoped contract, applicable root/game
instructions and the existing canonical shapes, graph/policy call sites and
catalog interfaces. Read accepted onboarding, species and effects facts as data.

Inspected cached primary source at
`.superpowers/sdd/FULL-GAME-EXECUTION/profile-research/`, pinned to `pret/pmd-red`
commit `6bcbec4f906938c0243aa2026bcbd41b577bab85`. Independently recomputed Git
blob SHA-1 for all 17 cached files and matched their recorded identities. Also
verified the reused `item-research/src-dungeon_data.c` blob
`19b3967abd568a9377a09dc8ee3ada3bf840f765`. A fresh GitHub connector read of
`src/pokemon_3.c:416-477` returned the same blob and corroborated IQ groups/defaults.
This remains explicitly qualified original-Red comparative evidence, not a new
Blue-binary parity claim.

Specific source traces:

- `src/pokemon_3.c:326-376,416-477`, `src/dungeon_data.c:66` onward and
  `src/dungeon_menu_team.c:607` support tactic/IQ thresholds, group exclusion,
  defaults and leader-level menu selection.
- `src/naming_screen.c` keyboard layout and END branch at lines 512-521,
  `GetEnteredNameLength` at lines 839-854, and the pinned charmap support the
  finite repertoire, cell count and width/acceptance distinction.
  `src/rescue_team_info.c:34,126-135` writes the actual default and saves the
  retained name independently of the naming-quest bit.
- `src/pokemon_evolution.c:189-253` copies the Pokémon, changes species, resets
  EXP to the same-level target threshold, preserves copied stats, and re-adds it.
  It does not reconstruct stats from the evolved species' absolute table.
  `src/dungeon_leveling.c:403-434,465-529` supports saturation and level-loss floors.
- `src/pokemon.c:1108-1136` checks full level-up/auxiliary membership;
  lines 1174 onward use `< IQ333` exclusions. Accepted effects contracts
  `town-tm-hm-use` explicitly preserve legal duplicate move IDs; `sketch` supplies
  permanent replacement semantics with no further move exclusions beyond nothing.
  `src/moves.c:718-735,987-1043,1558-1571` supports charge restrictions and
  normalized sequence-head set/AI flags.

The remaining evolution requirement is **genuine missing accepted content**:
accepted SpeciesProfile/species records contain neither preEvolution nor
evolutionRequirements, and no accepted per-edge condition/PolicyId crosswalk is
available. The fetched comparative algorithm reads those absent tables; reading
the algorithm alone does not close the join. The implementation requests static
edge-policy content, not proof or replay of a past command. The recruitment and
scripted/evolution-extra paths similarly identify missing admission/grant owners.
These requirements are accurately described as partial admission, not hidden
always-pass behavior. They must be closed before claiming full roster support.

## Independent static checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed: 177 authored files. |
| `npm run typecheck` | Passed: 101 authored source files. |
| `npm run species:check` | Passed: 386 species, 419 profiles, 384 numerical resources, 386 learnsets; 256 shared-original /157 comparative persistent EXP profiles. |
| `npm run onboarding:check` | Passed: 56 questions, 140 maps, 13 natures, 26 outcomes, 129 pairs, 16 starting profiles. |
| `npm run effects:check` | Passed: 27 resources, 356 moves, 413 actions, 240 items, 266 families, 66 statuses. |
| `npm run campaign:check` | Passed: 1,011 predicates and 586 transitions; internal facts/source joins. |
| Independent read-only source/data comparisons | All 23 IQ threshold/group rows and all nine available tactic thresholds match; all 78 keyboard characters match the declared repertoire; results-resource SHA-256 matches QUIZ_REVISION; cached source blob checks pass. |
| `git diff --check` | Passed. |

One reviewer Python comparison first used repository-relative paths from the
tools directory and stopped with FileNotFoundError before reading or changing
anything. It was rerun successfully from repository root. npm emitted only the
existing environment http-proxy warning. No game module was imported/executed,
no gameplay was automated, and no tests or implementation changes were written.

Only this review report was created. No staging, commits or subagents.

## Scoped rereview: quote-normalization correction

Reviewed the unstaged two-file correction against the currently staged,
originally reviewed source. **Spec and quality: pass; no findings.**

- `content/state/pokemon-rules.js:70` replaces the four literal source quote
  glyphs with JavaScript Unicode escapes. Static decoding of those escapes
  produces the exact staged regex text, preserving U+2018, U+2019, U+201C and
  U+201D. Neither ASCII U+0027 nor U+0022 is added to the accepted character
  class. Beyond the explanatory comment, source text from `checkName` onward is
  identical after this escape normalization.
- `plan/STATE-PROFILE-POKEMON.md:46-47` retains the exact native byte mapping:
  91/92 to U+2018/U+2019, and 93/94 to U+201C/U+201D. The additional explanation
  accurately describes why escape notation is used.
- A read-only Python text comparison verified exact equivalence, the four
  escape values, absence of new ASCII quote characters, and the documentation
  mapping. `node --check` passed for the corrected JavaScript, and scoped
  `git diff --check` passed. No regex matching, game imports/execution, or
  gameplay automation was performed.

The correction restores/preserves reviewed behavior after the smart-quote hook
incident and does not expand the name repertoire. No implementation edits,
staging, commits or subagents were made in this rereview.
