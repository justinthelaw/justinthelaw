# Pokémon Dungeon Reimagined progress and decisions

## Current handoff

- **State:** implementation authorized on 2026-10-04; P01 source audit in progress.
- **Planning baseline:** [PR #387](https://github.com/justinthelaw/justinthelaw/pull/387) merged as `0d34db51c258368ade8f081557200905214cebcd`.
- **Delivery:** continue draft [PR #388](https://github.com/justinthelaw/justinthelaw/pull/388) on `impl/pokemon-dungeon-p01-source-freeze`; the local foundation work began from reviewed head `ce4d3151ba4e966517978fb9279c318e4c1185f9`. Keep this runtime-bearing PR unmerged.
- **Current work:** P01-B evidence addendum, reviewed P03-A/P04-A foundations, P05 startup shell and P06 candidate models/captures. P01 remains incomplete; gameplay and whole-game acceptance are unstarted.
- **Next safe action:** obtain the required P06 visual review of [actual model/scene evidence](../../../tools/pokemon-dungeon/art/REVIEW.md) before mass production. P06 and P05 manual device acceptance remain open. Resolve mechanics through [RULES-BLUE.md](RULES-BLUE.md) and [the additive revision](RULES-BLUE-ADDENDUM.md). Follow PLAN section 10's bounded foundation ordering. Arcade activation, merge and deployment remain held for P36/P37.
- **Start here:** [PLAN.md](PLAN.md), then the next package's appendix. The plan is intentionally decomposed for a smaller implementing model.
- **Coverage:** [COVERAGE.csv](COVERAGE.csv) records 38 parent packages, 386 species identities, 45 field dungeons, and 26 system families. P02 must expand the remaining forms, individual rules/items/moves, scenes and art records. P01 advances source evidence only; no gameplay implementation or manual acceptance is claimed.

## Latest user instructions

| Instruction | Effect |
| --- | --- |
| Make the game work and be playable from beginning to end; provide the full experience | Reaffirms full main story, postgame, optional content and systems. Passing website CI, a shell or art preview cannot establish gameplay completion. Continue reviewed packages until actual acceptance gates; do not stop merely because a research PR is clean |
| Continue the @Codex implementation in justinthelaw/justinthelaw, starting from any uncommitted changes | Separate implementation-start authorization on 2026-10-04. The supplied workspace had no checkout or uncommitted files; no open Pokémon PR/branch was found. Resumed from merged PR #387 in an isolated clone. Abandoned prototype drafts remain excluded under the existing plan |
| Clean first, then develop the first game | Cleanup completed; source and tooling preserved |
| Whole original rescue adventure in third-person 3D, beautiful Unreal-like graphics; latest clarification: Blue based | Original Nintendo DS Blue Rescue Team is the fixed baseline; Red only comparative research; no prototype/full-game equivalence claim |
| Single HTML was allowed to become a folder under games | Proposed future entry point is `games/pokemon-dungeon-reimagined/index.html` |
| Extremely extensive plan and necessary repository setup, then stop for review | Established the planning hold; the later continuation instruction above resumes implementation |
| Semi-transparent lower-half emulator controls and repeatable bulk image sheets | Required touch-control specification plus ASSET-PIPELINE.md master prompts, sheet/crop contracts and provenance; no runtime implementation |
| Show all decisions and generated assets for visual decisions | Added DECISIONS.md and two original environment loading-art candidates, with prompts/provenance; no production character or gameplay claims |
| Approve all recommendations except choose design B | D03 B, D04 browser equivalents, D05 manual acceptance, D06 omit practice and D08 JavaScript/JSDoc were resolved on 2026-10-04; implementation was authorized separately afterward |
| Remove README paragraph text; use tables and bullets | Parent games/README.md uses headings, tables and lists only; no prose paragraphs; root README unchanged |
| Plan near/inside game; concise parent games README with arcade concept and live/WIP catalog | Full plan moved to the game's `plan/` folder; `games/README.md` added; root README preserved |
| No game-source tests; website well tested; DRY/SOLID; record requirements in AGENTS; root README unchanged | Carried into parent/game instructions and each workstream |

## Prepared setup

| Path | Current responsibility |
| --- | --- |
| Root `AGENTS.md` | Records execution/release gates, folder permission, documentation placement, instructions and links |
| `games/README.md` | Concise arcade concept, current game status, integration and contributor guide |
| `games/pokemon-dungeon-reimagined/AGENTS.md` | Scoped execution constraints and remaining quality/release gates |
| `tools/pokemon-dungeon/.gitignore` | Excludes future authoring caches outside the exported game tree |
| `games/pokemon-dungeon-reimagined/plan/PLAN.md` | Goals, boundaries, architecture, decisions, dependencies, 38 work packages |
| `DECISIONS.md` and `art-candidates/` | Recorded choices, selected B future loading background, and archived A comparison with provenance |
| Five domain appendices | Campaign, mechanics, data, rendering, integration detail |
| `RESEARCH.md` and `research/*.json` | Source register, structured facts, source limitations and gaps |
| `COVERAGE.csv` | Traceable initial scope and evidence fields |
| This file | Approval status, current handoff, decisions and validation |

The development branch now contains a startup-only entry point and pinned local
engine. It has no playable adventure or accepted character assets. Root package
and lockfile remain unchanged; independent tools are excluded from website lint
and type checks. The public arcade continues to show three placeholders.

## Foundation implementation handoff

| Package | Concrete result | Evidence / remaining gate |
| --- | --- | --- |
| P01-B | Additive v2 research profile preserves the v1 hash and caveats; 31 new qualified records and 11 blocker clarifications | Independent review finding addressed; JSON composition/IDs/joins checked. `runtimeReady` remains false |
| P03-A | Asset authoring contract and strict glTF manifest schema | Independent consumer review accepted; manifest-relative path ambiguity resolved. No asset has human approval |
| P04-A | Exact Three.js 0.186.1 local closure, pinned tools, reproducible minification, separate strict JS types, source/schema/hash checks | `npm run check` passes; vendor symlink boundary review finding fixed. No game tests or source execution |
| P05 | Semantic loading/errors/retry, bounded initial manifest, WebGL2 startup, resize/visibility/disposal | Static review fixed BFCache forced-loss and loss-during-loading races; interface accepted for the independent art preview. Direct-page/iframe/device observation pending; no gameplay or save operations |
| P06 | Original Pikachu/Charmander/Groudon models, eleven clips each, three LODs and a Magma Cavern composition; measured candidate manifests and rendered evidence | All 12 GLBs pass Khronos validation and file limits. Actual captures prompted proportion/lighting corrections. Human visual approval and full device/clip/rig acceptance remain open |

P04/P06 validation measures the checked files; it does not establish visual or
gameplay acceptance. The shell explicitly states that its campaign is
unavailable. The art harness imports only vendor modules and candidate assets,
with no game/domain/save imports. Its captures retain the art-preview label.

### Foundation verification

- Independent source lint, strict JSDoc types, schema/local path/source hash
  checks, Khronos glTF validation and deterministic vendor comparison pass.
- Independent review findings fixed: direct-browser import resolution, vendor
  output symlinks, BFCache/context-loss races, export revision/provenance closure,
  grounded character pivots and staged art-load cleanup. No game tests were run.
- Website `npm run flight-check` passed lint, type checks, compilation and static
  export; E2E did not start because the pinned Chrome 153 archive download was
  invalid. Preserve that limit separately from eventual current-head CI.
- Art-only captures used Chrome 154.0.8037.92 and SwiftShader software WebGL2.
  The browser reported no page/console errors during successful captures.
  Phone-size viewport evidence is not a physical-phone performance result.
- GitHub review of `122b06b` identified unverified manifest measurements, stale
  PLAN setup wording and lockfile provenance classification. The follow-up
  derives measurements from actual glTF bytes, reconciles the plan's current
  paths/state and labels the npm lockfile as generated source. Re-export leaves
  all twelve GLBs, candidate revisions and capture bytes unchanged. P01 and the
  P05/P06 human acceptance gates remain open; revised-head CI/review belongs on
  PR #388 and cannot be inferred from the earlier head's passing website checks.

## Cleanup record

Only verified, unused, rebuildable `.next` and `out` directories in the active
checkout and the older baseline worktree were removed. Source, worktrees,
untracked diagnostics, lockfiles, dependencies, browser/tooling runtimes,
credentials and managed services were retained. No processes were terminated.

| Metric | Measured result |
| --- | --- |
| Allocated bytes of verified deletions | 373,460,992 bytes, approximately 356.16 MiB |
| Filesystem available-space change | +373,460,992 bytes on the same filesystem |
| RAM reclaimed estimate | +26,525,696 bytes, approximately 25.30 MiB; concurrent processes affect this estimate |

The initial process inventory was readable. Later `ps` calls failed with a
container process-lookup error; the cleanup did not rely on terminating any
process or removing runtime services. The exact deleted targets were checked
for symlinks, mounted descendants and active working directories before removal.

## Scope-change handling

The user changed the task while initial implementation was underway. All workers
stopped product work. Incomplete game source/vendor drafts were parked outside
this review branch, and the first-card/test integration draft was restored to
the unchanged main version. Those drafts are not reviewed deliverables, accepted
contracts, dependencies, gameplay evidence or a baseline for future work.

The initial rushed state design had duplicated party/roster concepts and
main-series-stat approximations. The plan replaces those with canonical roster
ownership, temporary expedition actors, explicit original-data blockers and
source-backed content coverage. Do not resurrect the old interfaces from chat
or scratch paths.

## Historical planning handoff: decisions approved before execution

On **2026-10-04**, Justin instructed: "Solidfy the decisions to be all your recommend, EXCEPT for design let's go with option B." This resolves every remaining product choice in [DECISIONS.md](DECISIONS.md). D01 remains Blue, D02 is a research obligation, and D07 is the established release hold.

| Decision | Approved selection |
| --- | --- |
| D03 | B: bold cel-shaded 3D, `style-b-v1`; B loading background selected, A archived comparison |
| D04 | Browser rescue codes/files, Blue extra-mode equivalents and archived event expeditions; original cartridge interoperability is not a completion gate |
| D05 | Human play and visual review allowed; automated game-source tests remain prohibited |
| D06 | Omit separate Groudon practice; use campaign encounter and actual campaign capture |
| D08 | JavaScript ES modules with JSDoc and strict independent static type checks |

These choices do not authorize implementation, merge or deployment, silently omitted original content, guessed numerical data, or generic models labeled complete. Actual authored characters and 3D quality still require their future reviews.

| Planning reconciliation | Reason |
| --- | --- |
| Browser save recommendation fixed | One current campaign with primary/backup recovery, autosave after completed canonical transactions, manual save/export and explicit recovery; no strict cartridge quicksave choice remains |
| One canonical persistent Pokémon record; temporary session actors | Prevent divergent party/reserve/save copies and reset-dungeon corruption |
| Domain, rendering and persistence have separate owners | Keep graphical timing/browser APIs from changing rules or save authority |
| All content remains source-backed; missing original numerical tables block exact-fidelity claims | Modern/main-series datasets are useful references but do not implement PMD |
| Separate numbered exploration floors from terminal story maps | Avoid repeated original-versus-DX and walkthrough-counting errors |
| Proposed initial download ≤8 MiB, active scene ≤24 MiB, whole game ≤300 MiB | Start with reviewable browser/Pages budgets; these are not measured results |
| Existing 1,024 KiB added-file hook remains | Asset optimization needs a plan; do not weaken contribution policy by accident |
| Old flat prototype paths are replaced by the documented domain/presentation layout | A smaller model needs one consistent module map |

## Historical planning validation and review record

At the planning checkpoint, no game code was present or tested. Validation below concerns documentation,
repository setup and the unchanged website. PR CI and GitHub Codex review are
recorded on the planning PR for its exact head commit; inspect those results
before treating the handoff as ready.

| Check | Actual result |
| --- | --- |
| `pre-commit run --all-files` | Passed after the hooks normalized quotation marks and Markdown table formatting |
| `pre-commit run --all-files --hook-stage pre-push` | Passed, including size/private-key checks and website ESLint |
| `npm run flight-check` | Website ESLint, TypeScript, production build and game-directory export passed; browser installation blocked before tests because the pinned Playwright CDN returned an empty/truncated Chromium archive |
| Documentation audit | All relative documentation links resolved; all 3 research snapshots and art provenance JSON parse; 495 unique coverage IDs, including 386 species and 45 field dungeons |
| Scope audit | Root README unchanged; no website/runtime/vendor/dependency/card changes; documentation, directory setup and two explicitly requested generated planning illustrations only |
| `git diff --check` | Passed |
| Independent architecture review | One important and three minor findings addressed: tooling moved outside export tree, ActorView unified, Friend Areas kept explorable, persistent/session identities and AI RNG ownership reconciled |
| Independent fidelity review | One important and one minor finding addressed: scene grants/completion require atomic persistence; Snow Path includes both original entrance/return junctions |
| GitHub Codex review of initial head `ca69d21` | Seven findings addressed in the follow-up: P06 art-harness ownership, durable campaign-gap IDs, P22 before onboarding, D01 dependency/resolved Blue baseline, newly written dialogue, unmerged intermediate runtime PRs, separate storage notifications |
| Final focused independent review | No remaining actionable findings after Blue-scope, decision, control-overlay and bulk-sheet corrections; actual WebPs match their provenance |
| Resolved-choice independent review | Stale DATA/P21/CAMPAIGN approval wording corrected; reviewers found the selected B assets, README format, implementation hold, checkpoint policy and asynchronous replacement guard consistent |
| Third-head website CI `eb13b31` | All checks passed; revised-head CI and Codex completion still required |
| Third GitHub Codex review `eb13b31` | Two issues addressed: load/import replacement now rejects stale epoch/slot/revision context under an exclusive transition guard; browser checkpoint triggers and recovery policy are explicit rather than an omitted choice |
| Second GitHub Codex review `2566d2f` | Four final issues addressed: settled toggleable map overlay, release ownership of the parent game catalog, accurate two-image planning exception, and persisted domain revisions with per-instance storage epochs |
| Second-head website CI `2566d2f` | All checks passed; Playwright reported 302 passed and 13 skipped (7.7 minutes); revised-head gates still required |
| Initial-head website CI `ca69d21` | All checks passed; Playwright reported 302 passed and 13 skipped (9.3 minutes); final-head checks/review must also complete after these revisions |

The independent reviews were static plan reviews with selected factual
spotchecks, not exhaustive verification of all cartridge data. Remaining source,
asset and numerical blockers stay visible in the plan. The local browser
download failure does not establish a website test failure or a passing suite;
current-head CI is required for browser results.

## Future implementation entries

Append one record per accepted implementation task/sub-batch using PLAN.md
section 14's template. Include the approving instruction, base/result SHA,
owned paths, public interfaces, resolved research gaps, exact static checks,
independent review, approved manual evidence, advanced coverage IDs, remaining
limits and next task. Retain failed/blocked evidence when it affects what the
next model must know.

## P01-A: source-qualified foundation audit, 2026-10-04

### Brief and scope

- **Approval/dependencies:** Justin authorized continuing implementation after
  P00 merged in PR #387. No existing checkout or uncommitted implementation was
  present in the supplied workspace. The isolated checkout starts from
  `0d34db51c258368ade8f081557200905214cebcd`.
- **Inputs:** PLAN P01, RESEARCH, CAMPAIGN, SYSTEMS, DATA, historical snapshots,
  the original Blue manual and explicitly original-edition reference sections.
- **Outputs:** `RULES-BLUE.md` and `research/blue-rules-v1.json`; source-to-rule
  mappings and narrower blocking questions. Documentation execution status and
  coverage are reconciled to the current user instruction.
- **Owned paths:** root/game AGENTS; games README; PLAN, DECISIONS, PROGRESS,
  RESEARCH, RULES-BLUE, COVERAGE; scoped notes/status corrections in CAMPAIGN,
  SYSTEMS, RENDERING, ASSET-PIPELINE and INTEGRATION; the new research JSON.
- **Finish criteria:** qualified field evidence, null blocked values, valid
  source/coverage joins, focused independent review and required repository
  checks with infrastructure failures reported accurately.

### Result and limits

| Field | Recorded result |
| --- | --- |
| Base / result | Base `0d34db51c258368ade8f081557200905214cebcd`; result is the focused P01-A review branch, with its exact published SHA recorded on the PR |
| Public interfaces | Documentation schema version 1, `rulesRevision: blue-rules-v1`; no runtime exports or executable game content |
| Source evidence | 72 source identities; 44 records: 30 supported fields and 14 explicit blockers; each record retains edition/region, locators, limitations, consumers and questions |
| Reconciliation | Departure versus dungeon party limits; nominal versus fixed-point arithmetic; dungeon totals versus observed labels; reset entry versus outcome restoration; omitted versus contradicted Gengar prerequisite |
| Gap disposition | CAMPAIGN-GAP-02/03/12 narrowed; no complete campaign/data gap closed; exact scheduler and damage arithmetic remain blocked |
| Coverage advanced | P00 planning acceptance; P01 source audit; evidence links for all 26 system families and 13 affected dungeon rows; all gameplay implementation/acceptance states remain unstarted |
| Manual evidence | Not performed; no cartridge observation, browser gameplay or visual acceptance is claimed |
| Next exact sub-batch | P01-B: resolve the original Blue scheduler's phase order and speed-counter units, beginning with `P01-MECH-TURN-02` and `P01-MECH-SPEED-02`; then remaining RULES-BLUE priorities |

### Validation and review

- Static evidence audit passed: unique IDs, 72 resolvable source identities,
  44 rule records, 26 family joins, 495 unique coverage rows, blocked null
  values and local documentation links. The audit reads documentation only.
- `pre-commit run --all-files` and
  `pre-commit run --all-files --hook-stage pre-push` passed with the new files
  included; `git diff --check` passed.
- Independent review found one important provenance-cleanup error and one minor
  retrieval-history inconsistency. Restored the affected source numbers/text,
  reconciled retrieval outcomes and strengthened the static audit. Focused
  re-review found no remaining actionable issues.
- GitHub Codex review of `6ad37b7` found incomplete dungeon source locators.
  Reopened the affected references and replaced truncated and extraction-line
  references with named sections, species/item rows and floor columns. The
  profile records this correction explicitly; no rule values or blocked states
  changed. Revised-head CI and Codex review are required on the PR.
- `npm run flight-check`: website ESLint, TypeScript, production build and
  game-directory export passed. The pinned Playwright Chrome download returned
  a non-ZIP response; browser installation failed before tests ran. An earlier
  TypeScript `--showConfig` parse failure was traced to the execution sandbox
  blocking a child process; the permitted rerun passed that step without source
  or dependency changes.
- Current-head GitHub checks/review are recorded on the review PR. P01 remains
  incomplete regardless of those website results.

### Rulings

- Use the user's current continuation instruction as the separate implementation
  start authorization; retain package evidence, visual and release gates.
- Apply the established prohibition on automated game-source tests over generic
  TDD guidance. Static document audits and existing website checks remain allowed.
- Keep the first evidence revision partial. Public reference summaries do not
  justify inventing a scheduler, rounding algorithm or reset restoration matrix.
- The reviewer declined exhaustive cartridge/regional verification and runtime,
  gameplay, visual or persistence acceptance: those remain open, outside this
  documentation sub-batch. Website results are reported separately; review does
  not complete P01 or authorize merge/deployment.
