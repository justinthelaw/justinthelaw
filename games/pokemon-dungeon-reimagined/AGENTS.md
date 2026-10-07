# Pokémon Dungeon Reimagined

## Current status: opening implemented; full campaign acceptance pending

Planning PR #387 was merged on 2026-10-04. Justin's later instruction to
"Continue the @Codex implementation" authorizes execution of this plan. Resume
the first incomplete dependency-ready package in `plan/PROGRESS.md`. P01 retains
open source questions; merged PR #388 adds static tooling, a
pinned vendor bundle and a startup-only shell. The development branch now
contains the canonical opening adventure through
Tiny Woods, Caterpie reunion, confirmed team formation and the first morning
through Thunderwave Cave, functioning bank/storage/Kecleon services, and real
ordinary rescue work through Diglett's request at MAIN(4,6). Mt. Steel remains
gated. Static checks do not establish human play/visual acceptance or a complete
campaign; later services, escort admission and routes remain incomplete.
Current v8 work saves preserve exact v2-v7 import admission. Accepted requests,
no-turn client dialogue, return/reward cursors and mail are persisted. Older town
saves receive a prospective board and an explicit missing-posting-history notice. Imported
legacy history stays explicitly incomplete; never infer native seen flags from
visibility/spawn or fabricate discarded defeat history. The latest 2026-10-05 direction rejects the P06 rigid-mesh character candidates
and requires faithful directional pixel characters in textured real 3D spaces.
Earlier inferred acceptance is superseded; all visual acceptance stays open.
Preserve package evidence, visual review and full-release gates.

On **2026-10-04**, the user approved all recommendations except the visual
recommendation, selecting **D03 B: bold cel-shaded 3D**. The updated D03 below supersedes that historical choice; the other choices
remain binding and need no repeat decision question. Implementation is now authorized;
full-game acceptance and subsequent runtime releases remain open.

On 2026-10-05, Justin authorized merging #390 and a new PR for the joystick,
first-card development preview, full-page modal and mobile controls, then
requested autonomous implementation and waived external Codex review.
This scoped launcher instruction overrides the older first-card hold. Label
the existing startup shell in development and its P06 picture an art study;
do not claim a playable campaign or completion of P36/P37. The new launcher
PR remains unmerged until separately authorized. Website controls send standard
keyboard events; gameplay consumers still belong to future game packages.

| Decision | Binding selection |
| --- | --- |
| D03 | Directional pixel characters in textured real 3D environments, per the latest EthrA reference. Preserve species anatomy, silhouettes and markings; historical B and rigid-mesh studies do not approve current art. |
| D04 | Browser rescue codes/file exchange, browser equivalents for Blue's extra modes, and labeled archived event access preserving content/progression. Original cartridge interoperability is not a completion gate; claim compatibility only where sourced and demonstrably verified. |
| D05 | Human play and visual review are permitted after implementation; no automated game-source tests or playthroughs. |
| D06 | Omit separate Groudon practice; retain the campaign encounter and campaign screenshot capture. |
| D08 | JavaScript ES modules with JSDoc and strict independent static type checks; tools live in `tools/pokemon-dungeon/`. |

The two generated loading illustrations remain under `plan/art-candidates/`
with provenance: B was formerly selected; both are historical comparisons under the new direction. These raster
assets are neither 3D models nor gameplay screenshots and cannot replace the
eventual arcade gameplay capture.

Read [the project plan](plan/PLAN.md) first. Then read the
specific task and appendix it identifies. The [progress ledger](plan/PROGRESS.md)
records completed work, resolved decisions and remaining research. The parent AGENTS.md remains
applicable, with the standalone-game exceptions stated here.

## Binding implementation constraints

- The source reference is the original **Pokémon Mystery Dungeon: Blue Rescue
  Team**, not Rescue Team DX or the Explorers games. Red Rescue Team is only
  comparative/cross-version research; do not build a Red campaign or an edition
  selector, and verify shared research against Blue.
- Use `games/pokemon-dungeon-reimagined/index.html` as the proposed entry point.
  A folder is authorized; single-file packaging is no longer required.
- Use local relative URLs for all code, data, models, textures, fonts, and
  audio. The game must work inside the existing iframe on GitHub Pages.
- Keep authoring packages, dependencies, scripts and caches in repository-relative
  `tools/pokemon-dungeon/`, never in this directory: the exporter copies the whole
  game tree, including Git-ignored files. Only browser runtime resources and project documentation belong here.
- Keep domain simulation, content, rendering, input/UI, audio, and persistence
  separate. Apply DRY and SOLID without speculative frameworks.
- Do not import website React or Zustand into the game. A dedicated save
  repository adapter may use browser storage; isolate and validate it.
- Write original code, dialogue, and artwork. Do not extract game assets or
  copy a commercial script into this repository. Track provenance and retain
  licenses for third-party components and any permitted assets.
- Preserve Blue-specific behavior and source uncertainty in data. Do not insert
  modern types, DX rules, main-series growth curves, or guessed probabilities
  while describing the result as faithful to Rescue Team.
- Keep every intermediate runtime-package PR unmerged until P37 full-scope
  acceptance and explicit release/merge/deployment approval. `games/**` is
  exported and deployed at direct URLs even with a disabled arcade card;
  unfinished runtime work must stay on development branches.
- No tests may execute or import game source. Do not create game test suites,
  game-test CI jobs, or automated playthroughs. Static syntax, lint, type,
  schema, license, and size checks are allowed. Website integration tests
  must replace game responses with inert fixtures before Play is pressed.
- Original game rules and user-approved adaptations take precedence over
  illustrative pseudocode. Resolve source conflicts in the research ledger.
- Keep the full plan in `plan/` and the arcade/live/WIP catalog in `../README.md`.
  Use headings, tables and lists in that catalog; omit prose paragraphs. Allow
  2–3 front-matter sentences in a section only when absolutely necessary; none
  are needed in the current catalog. Do not change root README.md. Update relevant AGENTS requirements, content
  coverage, task progress, and provenance when work changes them.

## Required controls and asset workflow

- Controls appear as a semi-transparent emulator-style overlay on the lower half
  of the screen; follow RENDERING for touch, keyboard, safe areas and visibility.
- Use [ASSET-PIPELINE.md](plan/ASSET-PIPELINE.md) for bulk asset sheets: locked master
  prompts, approved references, uniform grids, verified crop manifests and hashes.
- Use the versioned [directional pixel contract](../../tools/pokemon-dungeon/art/pixel/CONTRACT.md)
  for character atlases; keep icon/portrait/material sheets distinct. Real 3D
  geometry remains required for environments. Historical A/B illustrations and
  rejected rigid models remain archived evidence, not approval of current art.
- Do not retry the failed ImageGen character request or use API generation as
  a fallback. Author original editable shapes/geometry, then deterministic pixel
  frames. Do not pixelate the unchanged rejected primitive models.

## Executor discipline

1. Check the user has approved moving past planning.
2. Read PLAN.md's authority order and the first incomplete work package.
3. Read only its required appendices plus any contracts it consumes.
4. Work on that task's listed paths; preserve other contributors' changes.
5. Resolve its research blockers before writing dependent behavior.
6. Use static review and approved manual evidence for game code; use the
   repository's meaningful fixture-based tests for website changes.
7. Record files, commands/results, source decisions, remaining limitations,
   and the next task in PROGRESS.md. Never mark a task done from code volume.
8. Request review of the changed responsibility before widening scope.

Do not recover or ship abandoned scratch prototypes as production code. They
were interrupted when the user changed the task to planning and have not been
reviewed for correctness, completeness, or visual quality.
