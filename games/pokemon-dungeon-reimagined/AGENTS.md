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
ordinary rescue work through Diglett's request and the nine-floor Mt. Steel rescue at MAIN(5,0).
Friend Area onboarding now continues through Wigglytuff, story Magnemite, the
Square wind request and rest at MAIN5,5, with navigable owned areas and resident
management. Frozen v20 opens original-pair Tiny/Thunderwave work at MAIN5,5
through the real inside-base MAIN5,6 morning boundary. Its v21 successor adds
ordinary Steel1–8/fixed9 and actual outside Meanies/Pelipper replacement mail,
then stops at MAIN5,7. Later work, escort, wild recruitment and Sinister remain
in implementation. See plan/CHAPTER-FIVE-WORK.md and plan/STEEL-MEANIES.md; mandatory client/return/reward/
morning owners block new work, and selected Magnemite is never silently removed. Static checks do not establish human play/visual acceptance or a complete
campaign; later services, escort admission and routes remain incomplete.
Current v23 learning saves preserve exact v2-v22 original-envelope import admission, including
v17 Sleep Seed provenance, v16 Leech Seed links and Water Sport counters. Stun
has development use/throw activation over its reviewed Petrified lifecycle and
accepted bounded turn continuation. Heal/Quick Seed consumers mutate already
admitted class/timer/seal/cache fields without a new save revision. Heal retains
scheduler flags; Quick installs genuine raises through the turn speed owner. See
plan/HEAL-QUICK-SEEDS.md, plan/STUN-SEED.md and plan/TURN-CONTINUATION.md.
Wider frozen statuses and Item Master
remain separate owners. Leech Seed
and Water Sport now have shared action, upkeep, damage and persistence consumers;
Water Sport Weak Type Picker weighting remains a full party-AI dependency. Bide, Focus
Energy and Confusion now have sourced lifecycle consumers; Mt. Steel uses exact scoped wild move selection, boss/neutral roles, retry/loss
return history and shared reward delivery. Metal Sound, Thundershock/paralysis, Hypnosis, Charge, Absorb and Quick Attack
retain shared source consumers. Roster companions now acquire ground items at
completed movement using native bag/own-held order, projectile stacking and flee
guards. All240 native item AI triples have a separate qualified factual export;
these facts do not complete autonomous use/throw AI or native movement. Shared
early recipient effects/catching now consume self ingestion and player
Gravelerock hits. Finite ordinary facing throw commands and explicit arc tiles
now share launch/impact/drop owners; all424 native throw-capability facts retain
419 exact profile joins. See plan/THROWING.md. Item Master and wider effects remain
separate owners. Catch/damage order is Red comparative evidence, not Blue binary parity.
Withdraw, Helping Hand, Thunder Wave, Disable,
Attract, Smokescreen and Reflect now have scoped execution consumers; Reviver
Seeds restore base move PP. Low Kick, Metal Claw, Mud-Slap and Water Gun have
scoped damage consumers. Ember burn, Bite/Bone Club/Headbutt flinching and Rage
now have sourced lifecycle consumers. Razor Leaf/Bubble use native line targeting
and Bubble has a sourced speed drop. Pay Day, nonleader fainted held-item drops
and missed projectiles share native floor placement. Tiny/Thunderwave wilds now use native move
weights, active IQ and Charge/sleep targeting. Native movement, partner move/item
AI, extra-party dungeon
entry, recruitment/capacity return and the broader move/item inventory remain
incomplete. MAIN5 onboarding refreshes source rank0 Steel jobs without opening
unlimited work; future work must close Bronze escorts and their source rewards. Accepted requests,
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

Continuation work must preserve frozen schema.js, all historical pins/original
envelope admission, four-team/128-wild slots and large co-located trap/money
records. `continuing` is a saved native work PC, never leader input or a fake
prompt. Yield at the first completed opportunity/flush recipient/empty phase,
including leader after-work before Petrified special traversal. Do not admit an
active effect or normalize fields without the specific ownership proof in
plan/TURN-CONTINUATION.md. Future effects, propagation, entry/growth policies or
tile event patterns must revise its conservative3800/2300/1950 burst allowances
under4096. Preserve tile-scoped exact counted notices and unknown-event order.
The single frame pump must guard binding/snapshot/revision, pause for menus,
saves and interruption, and present/autosave each committed chunk once. Accepted
continuation review covers every saved cursor and stale callback
path; review future changes to those responsibilities independently. Static checks
do not establish maximum-envelope latency, device or interrupted-save acceptance.

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

Bronze continuation work consumes [BRONZE-JOBS.md](plan/BRONZE-JOBS.md).
The exact v22 successor prepares native numeric2 metadata, Set3 reward payloads,
mail-area/news producers and saved station prefix/mission-area receipts while
MAIN5,7 departure/refresh remains held for the separate escort guest/second interval.
Preserve all95 original dependency pins and original-envelope admission; do not
add default posting/guest/prefix/area history during conversion. EVENT_B01P01
figure bits are distinct from cutscene flags. Wonder Mail areas are10/14/35/36
(Boulder Cave36); Decrepit Lab38 is a shop area. New area receipt admission must
compose the actual successful interval and `checkMissionAreaRewards` ownership.

Round1 Bronze review requires one pure prospective proof before every legacy
per-job/progress/town projection. Saved v22 pauses require exclusive applied prefix
or authenticated unpaid conversion debt; absence alone is invalid. A real old
prepared queue may gain truthful current-conversion metadata only after original
envelope/hash/exact factory admission, preserving every lot/queue/RNG/resource.
The next successor must carry the exact prefix/schema/revision guards recorded in
BRONZE-JOBS.md; do not restore old ordering or infer debt from field omission.

The v23 [move-learning prerequisite](plan/MOVE-LEARNING.md) owns actual persisted
level/candidate choices, native team traversal, direct settlement and terminal
scene continuations before copyback. Source stats/HP precede the sole candidate
draw; confirmed forgetting removes the exact selected linked tail. Preserve
new-only unconsumed EXP source/frame ledgers and immediate/forced-loss Reviver
arbitration; never infer or rewind converted legacy EXP/choices. Every new policy
callback independently proves raw ownership before a frozen v22 view, including
the complete-state condition callback. Internal inherited slot gaps retain all
resources and hold growth before mutation until a real layout/reorder owner;
trailing empty slots remain valid. Unsupported source-learned move possession
must remain canonical without effect filtering or automatic decline. Full party
move/item AI, broader effects and human/UI interruption acceptance remain open.
The whole132-actor3798/2300/1946 proof retains3800/2300/1950 under4096; future
guests/entry/effects/output must revise it. All105 frozen dependencies and original
schema/bodies/manifests/resources remain checked. MAIN5,7 outings/refresh, escort
and Caterpie stay held for the preserved actual escort/second-work successor.

The [escort general RNG prerequisite](plan/ESCORT-GUEST.md) supplies a pure,
explicit comparative native LCG seed/state interface. Preserve signed16 OR,
two transitions, low16 scaling, zero-bound draw and reseed overwrite semantics;
never substitute a browser stream or fabricate original seed history. Exact
guest/state/AI/loss/cleanup and second-work successor activation remains held.
The live PR records completed scoped independent v23 review after ML-R001–003;
human/device/visual/Blue parity/full release remain pending.

Native [escort entry preparation](plan/ESCORT-GUEST.md) now owns qualified19-client
stats/source-ordered level1 moves/full PP, explicit prospective fixed boot seed,
real Hidden Power general draws for all supplied roster slots before conditional
guest admission, first-free-four/body6 failure and temporary native identity/IQ26.
Preparation is not a canonical/saved guest. Do not activate it before exact slot/
actor/container/archive/RNG proof and native placement/AI/loss/cleanup closure;
do not skip roster draws or let rejection evict selected members.
