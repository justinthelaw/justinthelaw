# Pokémon Dungeon Reimagined progress and decisions

## Current handoff

- **State:** planning and prerequisite setup only; implementation paused for Justin's review.
- **Review:** [draft PR #387](https://github.com/justinthelaw/justinthelaw/pull/387); implementation, merge and deployment remain paused.
- **Branch:** `plan/pokemon-dungeon-reimagined`, based on `main` at `b4ed31955a2e6d5ae031faa610066d3fc66975ff`.
- **Current package:** P00, preparation and review. All product packages P01-P37 are unstarted and unapproved.
- **Next safe action after this PR:** read Justin's review. Do not begin implementation, update the arcade card, merge, or deploy before the user authorizes that stage.
- **Start here:** [PLAN.md](PLAN.md), then the next package's appendix. The plan is intentionally decomposed for a smaller implementing model.
- **Coverage:** [COVERAGE.csv](COVERAGE.csv) records 38 parent packages, 386 species identities, 45 field dungeons, and 26 system families. It is an initial planning ledger; P02 must expand the remaining forms, individual rules/items/moves, scenes and art records. P00 is prepared and awaiting user review. All product implementation/evidence fields remain not started or not performed.

## Latest user instructions

| Instruction | Effect |
| --- | --- |
| Clean first, then develop the first game | Cleanup completed; source and tooling preserved |
| Whole original rescue adventure in third-person 3D, beautiful Unreal-like graphics; latest clarification: Blue based | Original Nintendo DS Blue Rescue Team is the fixed baseline; Red only comparative research; no prototype/full-game equivalence claim |
| Single HTML was allowed to become a folder under games | Proposed future entry point is `games/pokemon-dungeon-reimagined/index.html` |
| Extremely extensive plan and necessary repository setup, then stop for review | Supersedes the earlier instruction to continue implementing until complete |
| Semi-transparent lower-half emulator controls and repeatable bulk image sheets | Required touch-control specification plus ASSET-PIPELINE.md master prompts, sheet/crop contracts and provenance; no runtime implementation |
| Show all decisions and generated assets for visual decisions | Added DECISIONS.md and two original environment loading-art candidates, with prompts/provenance; no production character or gameplay claims |
| Plan near/inside game; concise parent games README with arcade concept and live/WIP catalog | Full plan moved to the game's `plan/` folder; `games/README.md` added; root README preserved |
| No game-source tests; website well tested; DRY/SOLID; record requirements in AGENTS; root README unchanged | Carried into parent/game instructions and each workstream |

## Prepared setup

| Path | Current responsibility |
| --- | --- |
| Root `AGENTS.md` | Records planning hold, folder permission, documentation placement, instructions and links |
| `games/README.md` | Concise arcade concept, current game status, integration and contributor guide |
| `games/pokemon-dungeon-reimagined/AGENTS.md` | Scoped rules and explicit stop before implementation |
| `tools/pokemon-dungeon/.gitignore` | Excludes future authoring caches outside the exported game tree |
| `games/pokemon-dungeon-reimagined/plan/PLAN.md` | Goals, boundaries, architecture, decisions, dependencies, 38 work packages |
| `DECISIONS.md` and `art-candidates/` | Remaining choices and two generated reusable loading-background options; awaiting selection |
| Five domain appendices | Campaign, mechanics, data, rendering, integration detail |
| `RESEARCH.md` and `research/*.json` | Source register, structured facts, source limitations and gaps |
| `COVERAGE.csv` | Traceable initial scope and evidence fields |
| This file | Approval status, current handoff, decisions and validation |

There is no game HTML entry point, game runtime, production asset bundle, vendor dependency,
root dependency change, new screenshot or arcade card modification in this
planning change. The existing public arcade continues to show three placeholders.

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

## Proposed decisions, not user approvals

D01-D08 are listed in PLAN.md section 12; [DECISIONS.md](DECISIONS.md) is the user-facing choice sheet. **D01 is resolved: original Blue Rescue Team**, selected by Justin on 2026-10-04. D02 is a research obligation and D07 is the established release hold. **D03, D04, D05, D06 and D08 await user input.** No default in the plan authorizes silently omitting original modes,
using approximate numerical data, shipping generic models as complete species,
or enabling automated game tests.

| Planning reconciliation | Reason |
| --- | --- |
| One canonical persistent Pokémon record; temporary session actors | Prevent divergent party/reserve/save copies and reset-dungeon corruption |
| Domain, rendering and persistence have separate owners | Keep graphical timing/browser APIs from changing rules or save authority |
| All content remains source-backed; missing original numerical tables block exact-fidelity claims | Modern/main-series datasets are useful references but do not implement PMD |
| Separate numbered exploration floors from terminal story maps | Avoid repeated original-versus-DX and walkthrough-counting errors |
| Proposed initial download ≤8 MiB, active scene ≤24 MiB, whole game ≤300 MiB | Start with reviewable browser/Pages budgets; these are not measured results |
| Existing 1,024 KiB added-file hook remains | Asset optimization needs a plan; do not weaken contribution policy by accident |
| Old flat prototype paths are replaced by the documented domain/presentation layout | A smaller model needs one consistent module map |

## Validation and review record

No game code is present or tested. Validation below concerns documentation,
repository setup and the unchanged website. PR CI and GitHub Codex review are
recorded on the planning PR for its exact head commit; inspect those results
before treating the handoff as ready.

| Check | Actual result |
| --- | --- |
| `pre-commit run --all-files` | Passed after the hooks normalized quotation marks and Markdown table formatting |
| `pre-commit run --all-files --hook-stage pre-push` | Passed, including size/private-key checks and website ESLint |
| `npm run flight-check` | Website ESLint, TypeScript, production build and game-directory export passed; browser installation blocked before tests because the pinned Playwright CDN returned an empty/truncated Chromium archive |
| Documentation audit | 140 relative links resolved after relocation; all 3 research snapshots and art provenance JSON parse; 495 unique coverage IDs, including 386 species and 45 field dungeons |
| Scope audit | Root README unchanged; no website/runtime/vendor/dependency/card changes; documentation, directory setup and two explicitly requested generated planning illustrations only |
| `git diff --check` | Passed |
| Independent architecture review | One important and three minor findings addressed: tooling moved outside export tree, ActorView unified, Friend Areas kept explorable, persistent/session identities and AI RNG ownership reconciled |
| Independent fidelity review | One important and one minor finding addressed: scene grants/completion require atomic persistence; Snow Path includes both original entrance/return junctions |
| GitHub Codex review of initial head `ca69d21` | Seven findings addressed in the follow-up: P06 art-harness ownership, durable campaign-gap IDs, P22 before onboarding, D01 dependency/resolved Blue baseline, newly written dialogue, unmerged intermediate runtime PRs, separate storage notifications |
| Final focused independent review | No remaining actionable findings after Blue-scope, decision, control-overlay and bulk-sheet corrections; actual WebPs match their provenance |
| Initial-head website CI `ca69d21` | All checks passed; Playwright reported 302 passed and 13 skipped (9.3 minutes); final-head checks/review must also complete after these revisions |

The independent reviews were static plan reviews with selected factual
spotchecks, not exhaustive verification of all cartridge data. Remaining source,
asset and numerical blockers stay visible in the plan. The local browser
download failure does not establish a website test failure or a passing suite;
current-head CI is required for browser results.

## Future implementation entries

After approval, append one record per accepted task/sub-batch using PLAN.md
section 14's template. Include the approving instruction, base/result SHA,
owned paths, public interfaces, resolved research gaps, exact static checks,
independent review, approved manual evidence, advanced coverage IDs, remaining
limits and next task. Retain failed/blocked evidence when it affects what the
next model must know.
