# Profile / permanent Pokémon policy report

Base checkpoint: `958b11f7dad1123f5158aa8bb45aed236f36bc7d`.
Scope: approved Task 3/P07-B, controller brief `profile-pokemon-brief.md`.
No commits or staging; edits paused on handoff for independent review.

## Delivered and dependency readiness

New `content/state/profile.js`, `pokemon.js`, private shared `pokemon-rules.js`;
IQ/tactic cases in `identities.js`; public exports in `content/state.js`;
new `plan/STATE-PROFILE-POKEMON.md`. No schemas/contracts, previous item/economy
policies, shared ledgers or runtime scenes were changed.

Concrete profile admission is dependency-ready for all 26 quiz mappings, all
129 legal original starter pairs, sourced native names and ordinary evolution
selection integrity. The original selection is never inferred from evolved
current species. Stable authored quiz revision embeds the accepted result-table
hash prefix; exact crosswalk and full source hash are in the contract.

Permanent policy is a real supported-subset policy, **not full permanent roster
admission**. Ordinary starter records with bounded normalized growth and
supported moves, IQ and tactics can pass. The broader recruitment, scripted
acquisition and evolution policy owners remain missing. These paths return exact
requirements after concrete bounds, ownership, identity and chain checks; they do
not return fake success. No complete CampaignContent or initial opening is claimed.

Source-backed tables close IQ/tactic identity joins: 23 IQ skills with threshold
and exclusion groups; nine tactics with leader-level unlocks. Three unavailable
source tactic entries and IQ_NONE are omitted. Branded IDs remain intact.
`validateTacticSelection` is a complete pure selection-boundary check; retained
settings are not rechecked against the receiving member's level.

## Source decisions and review corrections

- Pinned initialization writes the actual team default `Pokémon`; no invented
  name or empty-string opening convention. `CheckQuest(SET_TEAM_NAME)` uses
  `ScenarioAfter(MAIN,2,-1)`. The chapter-58 exception affects the check, not the
  stored name. Parent review correctly separated snapshot validity from edit
  availability: valid retained names are admitted at58 without invented receipts.
  Source search finds initialization in new-save setup and the explicit setter
  in the naming command; the predicate reads state without changing names.
- Native keyboard/charmap yields a finite 78-character repertoire, including
  gender symbols, curly quotes, é and ⋯. Each authored code point corresponds
  to one native cell. END rejects zero length; excessive visual width changes
  display color, not acceptance. Spaces are retained; no trimming invented.
  Other glyphs require P19 crosswalk. No cartridge encoding compatibility claim.
- Tactic menu reads dungeon leader level. Retained supported tactics survive
  leader/level changes; selection-time checks are provided separately. No made-up
  historical unlock receipt or per-member current-level check.
- Evolution copies stats, resets EXP to evolved species' same-level threshold,
  and re-adds through current species' Friend Area. It does not rebuild stats
  from the evolved species' absolute level table. Lower evolution levels later
  in history remain possible after level loss; history checks do not assume
  monotonic levels.
- Source level-up saturates HP999 and other stats255; level loss subtracts and
  floors at1. A lower natural stat than the current absolute table can therefore
  be legal after saturation/loss. No historical receipt is required for those legitimate stored effective stats.
- Controller review correctly identified that source saves do not record enough
  history to reconstruct natural stats. After proposing the decision and obtaining controller approval, this scoped
  contract defines naturalStats and permanentStatBonuses as retained effective
  components whose sum is the bounded source stat. No comparison to the current
  species absolute table or history receipt is required. Deterministic future attribution: bonus gains credit only effective capped
  increases; level changes preserve retained bonuses unless reducing them is
  necessary to keep natural >=1 and match effective total; copying evolution
  preserves both components. Commands remain P17 responsibility. This is an
  explicit authored normalization of existing fields, not native byte semantics.
- Canonical EXP is a reduced rational Quantity, not a JS number: this policy
  requires denominator1 and checks numerator0..9,999,999 plus level interval.
- Native town teaching explicitly permits duplicate move IDs; only slot IDs
  are unique. Self-review removed a main-series-style duplicate rejection.
  Source link conversion clears AI/set flags on followers; nine charging moves
  cannot link. Source-only fallback actions do not acquire invented MoveIds.
- Four special learned moves use IQ >=333 (the source comment saying >333 is
  contradicted by its actual `<333` exclusion and constant333).
- Current PP is an actor concern; permanent move capacity bonus is zero and
  Ginseng uses each effect row's own cap. Smeargle Sketch is distinguished from
  ordinary learned-move membership.

## Exact remaining policy requirements

| Requirement | Missing owner / reason |
| --- | --- |
| `P19:name-native-glyph-crosswalk` | Unsupported glyph beyond finite sourced keyboard/default species names |
| `P17:evolution-policy:<id>` | Accepted species catalog omits preEvolution/evolutionRequirements; complete per-edge facts and PolicyId crosswalk are not authored |
| `P17:permanent-move-acquisition:<id>` | Move absent from all retained species learnsets and not a sourced Sketch path |
| `P17:permanent-recruitment-admission` | Source actor/location checks alone do not authorize recruitability |
| `P19:pokemon-grant:<id>` | Scripted acquisition needs accepted grant owner |
| `P17:evolution-extra:<id>` | Shedinja extra creation needs evolution policy and origin integration |

Evolution requires static edge semantics, not proof of a past command: the pinned
comparative evolution algorithm has been read, but accepted SpeciesProfile has
no per-edge evolution data and effect species parameters only contain body/size
facts. This is not merely an unauthored ID over otherwise complete accepted
rules. The next owner can add the accepted edge table/crosswalk and validate
history without a receipt or replay.

No source guess was used to bypass these requirements. Structural/identity/graph
validation is a required precondition; this code is not a standalone untrusted
JSON parser. Scope selection requires object identity within exact live or entry
archives, never detached lookalikes. Direct rescue-suspended permanent records
are invalid because no separate suspended permanent roster exists. Economy
retains aggregate accommodation capacity; actor/entry/result own temporary
projection, reservations and settlements. Unsupported effect execution remains
outside pure permanent possession admission.

## Source qualification

Target is original Blue, not Red or DX. Existing catalog evidence retains
shared-original and comparative qualifications (256 shared-original /157
comparative persistent EXP profiles). Added lifecycle/control evidence below is
pinned Red comparative with explicit Blue annotations where source provides
these; it is not a newly verified Blue binary behavior claim.

Repository: `pret/pmd-red` at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`.
All fetched bytes were verified against Git blob SHA1 before computing SHA256.
The ignored cache is outside the exported game tree and is not a deliverable.
Only factual crosswalks and original policy code ship.

| Primary path | Git blob | SHA-256 |
| --- | --- | --- |
| `include/constants/iq_skill.h` | `7a2bdd8fb4a0ab987bb5b6d66f4e3645a42fd7cb` | `7442ac7a05dddd30f064abc3920d0efed19593039ee4b2b997c90e7d255bf1de` |
| `include/constants/tactic.h` | `541d906b5e456a99ebc35aa4a986ea47f391adac` | `ce437107a2ccb6f60f67aa44103a26d0c21df3e7670fada25c835565a6a5ce3f` |
| `src/pokemon.c` | `3c5ab6eec362d6fccea49d1254cbb07682f1b172` | `ca46804becf408ad3a3a8cad21d7ac16309b2e43fd80bf4945a29951b66aa58b` |
| `src/pokemon_3.c` | `9687479351c4ffd43bdd1b05d4b5a80913c38631` | `4198a6531fe283e0a13aba9cb613c7425f778072098647cad8b9d37d3bf2155b` |
| `src/moves.c` | `19803cc678b9814e5686a569a08efeefdf4c83d7` | `bc1ed7fe1cbdeb2fd294c1329913b158b9c1365538f547f177877968dd345916` |
| `src/dungeon_leveling.c` | `9d719922c5be5418b72b305cb7fa5c1836ea7998` | `d7cab87c271db8bcc9f83a53625ba6cb5a860d717510f21eebd596fbcd581476` |
| `include/pokemon.h` | `5f39324e8f293fb0e58ff520de835924640b96eb` | `4fc8a2bc661f4bfa9ef84887e877816838fadbb6a639eb85762e3db07f37ef41` |
| `src/dungeon_menu_team.c` | `ba1fadca329c62cd4d30cc07ba49d85a6d72c12d` | `611fc083d09de11b7ca21dd874f848e05034a83f5e128da6cc29dbd835de17e2` |
| `src/dungeon_item_action.c` | `997771dd33f9c2290ed4f2b776d027f5ed449729` | `228d02bb28e1fd7b64ddc5fe3395196b9550f9b104bff2e362498ed7d215e353` |
| `src/luminous_cave.c` | `01251a79c3acc532001287f0564217c691c4c5df` | `fd4d4ac595b6ef235f38e22f400a75a79c100bd76d10639afeb6327c24543011` |
| `include/structs/str_pokemon.h` | `51b868b46f04d1354bbeb77cf6253adf307f0701` | `0ddac900868a8fe924943d23b7f6cafac087b82380fcb94a81e564da9c1fa17b` |
| `src/naming_screen.c` | `d24034e11c858f755ccd6084fa6c54452903435f` | `d345f4376d480fec819318b6d1c70f54fa085db678df990eaef86ac9da10734f` |
| `src/rescue_team_info.c` | `d9ed31645217f5114c92e5d4743884dd752d2a0f` | `a5e9e033610833e1c22904c110830cd4fd4578514495f6cd419c304a19ea2d36` |
| `include/constants/global.h` | `54251c20c212922b1bfcd96558c78eadc83f99cf` | `f2fa0f4d85c9f90c72fadf9a8bcffa5b28b112daf93a804f91b23fc918f608b5` |
| `src/pokemon_evolution.c` | `2399ead6e58ecf8bc105ac1e1b350c351b5d0606` | `bff5aec0f073c39b1c7552a50584cc86e98cd89e839205abaf0530bb8a13bc38` |
| `src/event_flag.c` | `73675e3c8ae94304d2259fb97dc8901d9cfa499a` | `1726f2e121b7f15a1ab4f2a30c2a0b45ebe088364cb37e01d9bbdbeae42c7f5e` |
| `charmap.txt` | `b3ebae63994f755307ba6a0162efdfc005466a94` | `3b46842c609bde4a98545fd720c565f70529ab0c3068ed15d58d83b027293c94` |

Threshold source `src/dungeon_data.c` reuses the verified item/economy source
blob `19b3967abd568a9377a09dc8ee3ada3bf840f765`, SHA256
`ca56c6807cb1a2918e9fee4bf4f8410fbde21ad52e3bcbfdffaa6d5766af66b4`.
Source URLs are reproducible as
`https://github.com/pret/pmd-red/blob/<commit>/<primary-path>`.

## Verification

Static checks only; no game modules imported or executed, no game tests or
playthroughs. The user/repository restriction supersedes TDD execution defaults.

- Authored source lint/local imports: 177 files, pass.
- Strict static JSDoc types: 101 authored files, pass.
- Species check: 386 species /419 profiles /384 numerical resources /386 learnsets, pass.
- Effects check: 27 deterministic resources /356 moves /413 actions /240 items /
  266 operation families /66 statuses, pass.
- Onboarding check: 56 questions /140 score maps /13 natures /26 outcomes /
  129 pairs /16 level1+5 profiles, pass.
- Campaign check: 1011 predicates /586 transitions /83 routes, pass.
- Source-data comparisons: all17 fetched Git blobs match; all23 IQ threshold/group
  rows and all9 tactic threshold rows exactly match pinned source; three unused
  tactic entries excluded; full onboarding results hash matches revision binding.
- `git diff --check`, pass. Root ESLint also passed (invoked once while reviewing).

A first type pass caught treating rational EXP as a number; fixed by exact integer
Quantity admission, not casting. Lint caught a forbidden control-range regex;
replaced with explicit character-code checks. An early shell write used the tools
working directory, wrote no target files, and was repeated at repo root before
validation. Final checks include all new authored source files. Parent owns the
independent spec/quality review and checkpoint integration.
