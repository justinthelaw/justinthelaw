# Codex continuation: browser stability and complete game

## Instruction and scope

Justin requested on 2026-10-09: continue the game PR, make it work without
browser freezes, correct the plans, and hand off to a Codex environment able
to develop and test the actual game. Fix all defects and finish the full game;
do not report success from source checks, a title screen or website fixtures.
This is a development handoff, not release approval.

## Resume here

| Item | Current authority |
| --- | --- |
| Repository / active PR | `justinthelaw/justinthelaw`, draft PR #397 |
| Branch | `feat/pokemon-campaign-recovery`; fetch its current head before work |
| Main baseline | `ff21bb9c0228ff872455908ffbad4bd5760467de`, dialogue focus repair #396 |
| Original implementation | PR #392 is merged; do not reopen or use its deleted branch |
| Recovery baseline | `f2389c4dd217ab9765e521ec7077b425f31b9ac3` |
| Test-first checkpoint | `7c119cf3085889e7c820906e7d18b3cc5989a955` |
| Selected runtime | v24 opening through Tiny Woods, Thunderwave Cave, Mt. Steel, town/jobs/Friend Areas and escort/second-work to Caterpie at MAIN(5,9) |
| Next unimplemented route | Sinister Woods; recovered prerequisites are not selected gameplay |
| Current defects | Focus-paused overlay input; repeated full-state structural validation; actual freeze location/latency still needs browser evidence |

Read root/game AGENTS.md, this handoff, FULL-GAME-GOAL.md,
FULL-GAME-EXECUTION.md and PROGRESS.md, then only the contracts needed for the
current package. This handoff supersedes stale checkpoint, branch and status
claims in historical plans; it does not override source/save contracts.

## Environment required before acceptance work

- Node from `.nvmrc` (24.19.0), npm 12.2.0 and both committed lockfiles.
- A real WebGL 2 capable browser with a reachable production preview and
  working developer tools for errors, network inspection and performance traces.
- Working pinned Playwright browsers for the website fixture suites.
- Representative desktop and touch/mobile browsers, including Android Chrome
  and iOS Safari. Do not infer device acceptance from viewport emulation alone.
- Preserve real saves; use separate disposable browser profiles for new-game
  checks. Never silently reset, normalize or replace an existing save.

The previous cloud browser fails at `DungeonRenderer` with `WebGL 2 is
unavailable.` Its remote browser cannot reach the local preview. Local pinned
Chromium ZIP downloads are truncated. These are environment blockers, not
proof of a game fix or a reason to replace 3D with a mock/2D fallback.

## Priority 1: Close the present responsiveness defects

1. Reproduce the exact current build before changing it. Record browser/device,
   commit, direct/iframe URL, input sequence, console errors, network failures
   and a main-thread trace. Check new game, questionnaire, names, Butterfree,
   Tiny Woods entry, movement/combat, stairs, dialogue, menus, saves and reload.
2. Finish the website focus repair in
   `src/components/arcade/GameControls.tsx` and `useGameControls.ts`.
   Toolbar/overlay focus blurs the game; its `src/shell/application.js` sets
   `focusPaused` and blocks input, while overlay action buttons currently send
   synthetic keys without restoring iframe focus. Restore the exact current
   document before delivery; preserve typing protection. Keep Enter/Space
   release in the host, emit one pulse, and discard interrupted/stale actions.
3. Run the new regressions in `tests/game-controls.spec.ts`. The test-only
   checkpoint was published before a production focus fix; failures are
   expected until the implementation is completed. Review the added cancellation
   case, including frame replacement and release behavior. Never skip these
   tests or remove the game pause guard to obtain green checks.
4. Independently review the candidate optimization in
   `src/domain/state/escort-shape-proof.js`. Nested resource/learning proofs
   request whole-save copy/shape traversal six times per resource callback.
   The candidate caches only positive structural success for exact deeply
   frozen input identities. Every semantic ownership callback still runs;
   mutable/shallow-frozen inputs and failures are not cached. See
   `ESCORT-SHAPE-PREFLIGHT-CACHE.md` and the parser-only audit at
   `tools/pokemon-dungeon/scripts/check-escort-shape-cache.mjs`.
5. Measure before/after startup, scene/turn/autosave latency on the same save
   and device. Inspect long tasks and repeated work. No timing improvement or
   freeze resolution has been measured yet. Fix further proven causes without
   dropping original envelope admission, semantic checks or the 4096 event cap.
6. Exercise blur/focus, Show/Hide controls, Enter/Space/A/Start, simultaneous
   touch/keyboard, visibility changes, resize, menus during automatic turns,
   save interruption and graphics recovery. Record actual observations.

## Priority 2: Finish the complete original scope

- Continue `RECOVERY-2026-10-08-DIALOGUE.md` and `FULL-GAME-EXECUTION.md`.
  Genuine Sinister construction still needs partial geometry/room/mask
  observers, temporary Hidden Power/initial AI, party/cache/held/sleep copies,
  ordered final floor refresh, complete raw v25 admission and current callers.
- Complete source-qualified turn/contact/end/learning/terminal adapters,
  scene and save routing, then select the real Sinister route. Recompose the
  event bound before activation; do not reuse invalidated old burst estimates.
- Finish every later main-story expedition/scene through ending and return,
  every branching postgame/optional route, recruitment/evolution/IQ/Dojo and
  remaining systems, roster assets, environments, accessibility and polish.
- Track fine-grained requirements in `COVERAGE.csv`, `ASSET-COVERAGE.csv` when
  present, the content registries and PROGRESS.md. Distinguish authored,
  implemented, selected, independently reviewed and manually accepted states.
- Preserve the recovered inventory in `recovery/2026-10-08-mvp-handoff.md`.
  Additional archived source is available at immutable commit
  `70453ce9ce6cb5f52fd83e57d0964e6cbf301e83`, under `recovery/pr392`.
  Do not depend on old scratch paths or copy old UI over current fixes.

## Validation and completion

- D05 remains binding: no automated game-source execution/import tests or
  automated playthroughs. Actual manual browser gameplay and profiling are
  permitted; website tests must intercept game responses with inert fixtures.
- Run `npm ci`, `npm ci --ignore-scripts --prefix tools/pokemon-dungeon`,
  `npm run check --prefix tools/pokemon-dungeon`, sourceful checks from
  `.github/workflows/game-static.yml`, both pre-commit stages,
  `git diff --check` and `npm run flight-check`.
- Use `npm run build` then `npm start` for actual production preview. Follow
  `PAGES-PREVIEW.md`; verify both direct and iframe entry under `/justinthelaw/`,
  local asset closure/MIME types, saves and reloads against that exact build.
- Obtain independent review of code and remaining findings. External Codex
  Code Review was waived; do not wait for or repeatedly request that bot.
- After every push, inspect current-head CI and actionable review threads.
  Commit complete scoped checkpoints and keep the plans/evidence current.
- Do not mark the full PR ready until all FULL-GAME-GOAL gates have evidence:
  actual beginning-to-end main story, postgame/optional routes, device/save
  recovery, faithful visual coverage and no material unresolved freezes.
- Keep PR #397 draft and do not merge/deploy without applicable user approval.
  The prior opening MVP publication does not authorize this unfinished full
  campaign. Replace the arcade art-study image only with real gameplay capture.

## Evidence at handoff

| Check | Result / limit |
| --- | --- |
| Pre-change authoring `npm run check` | Passed locally on the recovered baseline |
| Candidate cache checks | Lint 529 files, strict types 417 files, 115 frozen dependencies/14 bodies/2 manifests, escort-work/resources/activation and cache source audit passed |
| Cache regression | Expected source-audit failure before change; passes after, rejecting 10 deliberate source mutations; no game execution |
| Candidate full authoring rerun | Interrupted at user-requested handoff; not a full pass |
| Website lint/types/build/export | Baseline passed; final handoff needs its own CI |
| Local website browser suite | Blocked before test bodies by truncated pinned Chromium download |
| Hosted test-first CI | Started at `7c119cf`; inspect run 38001364529 and latest-head replacement runs |
| Local full pre-commit | Blocked installing markdownlint's Git package by npm EALLOWGIT; use hosted full hooks, do not weaken installation policy |
| Browser/gameplay/performance acceptance | Open; cloud WebGL 2 unavailable, no measured latency or complete playthrough |
| Independent cache/focus review | Open; focus production change is not implemented |
