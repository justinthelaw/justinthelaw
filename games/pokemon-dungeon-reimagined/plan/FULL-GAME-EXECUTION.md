# Full Game Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete playable Blue Rescue Team reimagining with
faithful pixel-styled characters, third-person 3D environments and a verified
GitHub Pages deployment path.

**Architecture:** Retain the approved separate content, deterministic domain,
presentation, input/UI, audio and persistence owners. Reuse the local Three.js
runtime and website launcher. Replace the rejected art direction throughout
the complete campaign, without reducing the original content scope.

**Tech Stack:** Local browser ES modules, JavaScript/JSDoc, Three.js 0.186.1,
WebGL2, local pixel atlases/environment assets, independent static authoring
tools, existing Next.js static export and fixture-based Playwright integration.

**Spec:** [FULL-GAME-GOAL.md](FULL-GAME-GOAL.md), [PLAN.md](PLAN.md), its package
contracts and linked appendices. The new goal supersedes old visual decisions
and stale public-launcher state, not original content coverage requirements.

## Global Constraints

- Target the original Nintendo DS Blue Rescue Team; preserve its full main
  story, branching postgame, optional content, 386 species and applicable forms.
- All runtime dependencies and assets remain local and use relative URLs.
- Create original code, dialogue, artwork and audio with provenance.
- Use JavaScript ES modules with JSDoc and strict independent static checking.
- No automated tests import or execute game source or perform playthroughs.
  Website integration tests replace game responses with inert fixtures.
- Keep the root README unchanged and authoring dependencies outside `games/`.
- Preserve unrelated work. Do not merge or publish an unfinished runtime.
- Unavailable Codex Code Review does not block independent review and CI.

## Review Focus

1. A successful startup must lead into real game state, never a permanent
   development notice marketed as a playable campaign.
2. Interrupted input, resizing, hidden tabs and overlapping touch/keyboard
   ownership must not create stuck movement or duplicate commands.
3. Save import/recovery, defeat, one-time scenes and reset-level expeditions
   must preserve canonical ownership and grant each reward exactly once.
4. Camera framing and pixel direction selection must preserve species identity,
   tactical readability and visibility rules on small screens.
5. A successful Pages build must resolve every runtime asset under the project
   base path; passing website fixtures cannot prove campaign completion.

## Task 1: Reconcile the full goal and pixel-art production contract

**Files:** This goal/plan; root/game AGENTS; PLAN, DECISIONS, RENDERING,
ASSET-PIPELINE, PROGRESS; `tools/pokemon-dungeon/art/REVIEW.md`; new pixel-asset
authoring/manifest files within `tools/pokemon-dungeon/`.

**Interfaces:** Preserve domain contracts. Produce a documented directional
pixel atlas/animation metadata contract with stable species/form identities,
local paths, sampling, dimensions, frame layout, provenance and coverage state.

- [x] Record the latest user direction and remove contradictory current visual
  guidance without rewriting historical evidence as if it had passed.
- [x] Implement static validation/export support for the accepted pixel format.
- [x] Author and inspect faithful hero/partner/boss examples in an independent
  3D art viewer; label captures as art evidence until campaign integration.
- [x] Run game-tool static checks and source/provenance review; record concrete
  visual results and all remaining roster/environment work.

Foundation review accepted commits `62a7f7c` and `7055dbf`, including corrected
camera-relative direction selection. This completes the scoped production
foundation; the three candidates, full animation sets and campaign integration
still require the later whole-game visual acceptance.

## Task 2: Close source-dependent runtime content foundations

**Files:** P01/P02 research and authoring catalogs, source locators, runtime
catalog/provenance boundaries, fine-grained coverage.

**Interfaces:** Supported immutable catalog data consumed by P07 and P11-P17;
no authoring-only inventory is silently promoted into gameplay.

- [ ] Resolve scheduler, interruption and arithmetic gaps with original-Blue
  evidence; retain source confidence and cross-version qualifications.
- [ ] Complete PMD-specific species, move/effect, item, location, encounter,
  scene/flag, recruitment and progression records.
- [ ] Validate data membership, references, completeness, source locators and
  runtime export constraints; obtain independent content/rules review.

## Task 3: Complete canonical state, persistence, input and presentation

**Files:** PLAN P07-P10 and SYSTEMS/RENDERING ownership tables.

**Interfaces:** `Adventure.dispatch`, immutable snapshots, one persistence
repository, discrete input commands, read-only render projections and renderer
lifecycle defined by the approved contracts.

- [ ] Implement canonical campaign/session state and exact validation.
- [ ] Implement atomic save/backup/export/import and interruption recovery.
- [ ] Consume the existing emulator key bridge and native keyboard focus.
- [ ] Implement pixel-character rendering, textured 3D scene kits, third-person
  camera, occlusion/visibility, resource ownership and quality settings.
- [ ] Statically validate and independently review each responsibility before
  dependent simulation/scene integration.

## Task 4: Complete shared adventure mechanics and scene engine

**Files:** PLAN P11-P18, then P22, following their explicit module owners.

**Interfaces:** One authoritative legal-command and turn path; presentation
events never decide combat/progression; scenes commit idempotent transitions.

- [ ] Implement generation/navigation, turn scheduling, targeting, full move
  effects/linking, items/statuses/weather/traps, hunger and expedition outcomes.
- [ ] Implement partner AI, recruitment, evolution, IQ and team management.
- [ ] Integrate readable animation, effects, menus, original audio and dialogue.
- [ ] Implement the reusable staged scene engine before onboarding consumers.
- [ ] Record static checks, independent reviews and manual acceptance evidence.

## Task 5: Implement the entire opening and main campaign

**Files:** PLAN P19-P21 and P23-P26; CAMPAIGN M01-M08 and town/job contracts.

**Interfaces:** Authored scenes/quests use the shared engine and sourced dungeon
records; preserve original numbered floors, terminal maps and unlock gates.

Bounded checkpoint: opening/Tiny Woods/team formation and first morning through
the accepted Magnemite request and Thunderwave return are implemented. See
[FIRST-MORNING.md](FIRST-MORNING.md) and [THUNDERWAVE.md](THUNDERWAVE.md) for save
gates, source qualifications and remaining acceptance. Accepted opening work now reaches the actual MAIN(5,7) Meanies/Pelipper boundary.
The v24 escort/second-work owner extends that route through the complete station
and distinct inside/outside Caterpie request at MAIN(5,9); its independent
activation review and human acceptance remain separate. Sinister Woods is the
next route owner; later campaign and whole-story acceptance remain open.

- [ ] Implement onboarding, first rescues, town services, jobs and Friend Areas.
- [ ] Implement early rescues, Team Meanies, Mt. Thunder and Great Canyon.
- [ ] Implement the fugitive route, side paths, Absol and vindication.
- [ ] Implement reconstruction, required job intervals and the Groudon rescue.
- [ ] Implement Sky Tower, meteor, farewell, credits and the hero's return.
- [ ] Verify all required scene transitions, failure/retry and save boundaries;
  record actual main-story beginning-to-end manual acceptance.

## Task 6: Implement every postgame and optional route

**Files:** PLAN P27-P31; CAMPAIGN PG01-PG08, optional catalog and Blue modes.

**Interfaces:** Independent prerequisite predicates, persistent quest stages,
repeat encounters and unique recruitment outcomes in the shared domain.

- [ ] Implement ocean/relic, Eon siblings and mirage/Western Cave routes.
- [ ] Implement birds/Lugia/Deoxys, wishes, Gengar/Gardevoir and challenge routes.
- [ ] Implement remaining optional/event dungeons, Dojo and approved browser
  equivalents, maintaining distinct restrictions and completion conditions.
- [ ] Review and manually verify independent postgame branches and recovery.

## Task 7: Close whole-game asset/content coverage and polish

**Files:** PLAN P32-P35; content/asset registers and visual acceptance records.

**Interfaces:** Every encountered species/form, biome, scene and system has
accepted production content rather than a generic or names-only substitute.

- [ ] Finish and review distinct assets for the full roster and environments.
- [ ] Audit all original-scope content against both coverage inventories.
- [ ] Resolve performance, accessibility, camera, animation and feedback gaps.
- [ ] Record representative mobile/desktop and whole-game manual evidence.

## Task 8: Verify Pages integration and deliver the complete PR

**Files:** PLAN P36-P37; existing arcade data/capture and export integration.

**Interfaces:** Same-origin full-page iframe, relative game assets under
`/justinthelaw/`, website-owned controls and a complete static exported game.

- [ ] Replace the staged card image with actual campaign gameplay capture and
  change availability copy only once the full game is playable.
- [ ] Run independent game static checks, contribution hooks, `git diff --check`
  and `npm run flight-check` with inert game fixtures.
- [ ] Verify exported direct/iframe paths and local asset completeness.
- [ ] Obtain final independent review, publish/update the draft PR, and monitor
  current-head CI without unavailable Codex Code Review loops.
- [ ] Mark ready only after every FULL-GAME-GOAL gate has actual evidence.
