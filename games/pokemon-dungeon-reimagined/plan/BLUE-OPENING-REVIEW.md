# Opening implementation and review

## Checkpoint — 2026-10-10

The selected runtime is now the opening through Caterpie's rescue, on
`feat/pokemon-campaign-recovery` for PR #397. Historical campaign source and
saves remain recoverable; the distribution excludes later chapters, the old
Three.js runtime, plans and art studies.

| Area | Implemented |
| --- | --- |
| Presentation | Two 256 × 192 canvases, post-office/interior/town opening, animated title, quiz and name entry, external portraits, field staging, forest dungeon and menus |
| Characters | All 16 quiz outcomes; sourced partner pool/type exclusions; partner naming before awakening and hero naming afterward |
| Rules | Three Tiny Woods floors, level-5 starting profiles, moves/PP, original damage helpers, early statuses, partner/enemy behavior, held items, stairs, growth, loss/retry and reunion rewards |
| Browser | Keyboard/touch input, interruption ownership, bounded sprite cache, no WebGL, startup cancellation, accessible menu mirrors and help, isolated alternating save checkpoints |
| Export | Parsed module closure plus explicit asset manifest; approximately 2.60 MB instead of the retained 84 MB historical tree |

## Review evidence

- The second checkpoint replaces the authored character/scenery/font substitutes
  with pinned native images, every source sprite direction/pose, 213 portraits,
  original opening scenery and aura layers, native window tiles and battle HUD.
  Exact Blue pixel checks cover the recorded samples; comparative Red data is
  qualified separately. All resources remain local, with no runtime CDN calls.
- The first signed checkpoint `087c252` passed hosted Game Static Checks and
  Playwright Tests. Lint found smart quotes in three runtime files; those have
  been corrected without changing the pinned checks or security settings.
- The native checkpoint passed the complete local authoring `npm run check`
  under Node 24.21.0, including retained historical audits and the new native
  pixel/provenance checks. All 184 selected changed files passed the applicable
  pre-commit checks using the required pre-commit 4.6.2. The distribution contains
  112 resources totaling 2,615,396 bytes; each contribution remains below 1 MiB.
- Independent prepared-turn review fixed missing partner swap upkeep/end effects,
  pointer releases suppressed during locked phases and dropped held movement
  across slow scheduling gaps. Sleep wake-up, Bide completion, prepared saves,
  stairs, deaths, wind/arrival accounting and paused clocks were statically traced.

- Specialist work covered visual references/rendering, audio, original mechanics,
  Pokémon data, browser input/performance, application/save flow, release
  integrity, mobile/accessibility, Tiny Woods completion boundaries and original
  asset permissions. All available concurrent worker slots were used.
- Independent review fixed readonly-input delivery, quick tap/diagonal loss,
  stale choice callbacks, save/resume line reset, live progress after denied
  storage, confirmation cancellation, depleted-move behavior, status accuracy,
  residual timing, ranged targeting, source spawn/wind order, warning thresholds
  and regeneration reset.
- Inert website export fixtures passed selected-resource copying, repeat export,
  content integrity, stale-resource rejection, path traversal rejection and
  source-symlink rejection. These checks do not execute game source.
- All nine retained native-source authentication audits passed against
  `6bcbec4f906938c0243aa2026bcbd41b577bab85`; historical P06 provenance was repaired
  by retaining the exact original lock snapshot, four v002 models and 24 captures.
- Current game source passed strict types and static lint at intermediate
  checkpoints. The full static suite reached the new art check after all legacy
  checks passed. Node 26 versus pinned Node 24 PNG encoding differed; regenerating
  under Node 24.21.0 preserved every decoded RGBA pixel across all 28 PNGs. Final
  full-check and publication outcomes belong in the next ledger entry.
- Root website dependency installation failed with Socket Security Policy E403
  for recently published pinned packages. No versions, security policy or checks
  were weakened. Full local website lint/build/Playwright remain unverified.

## Manual browser observations so far

The in-app browser loaded the real game without WebGL. Title/menu, trusted sound
activation, dialogue advancement and the eight-category personality test worked.
The alien-invasion answer entered the conditional follow-up without consuming an
extra main question. Reloading recovered that exact question. This run produced
relaxed/male Psyduck, excluded Water partners, selected Charmander and accepted
the nickname Ember through native text entry and Enter confirmation.

A frozen 66-file runtime snapshot, with per-file hashes, was used to avoid mixing
in-flight source edits during review. Its copied PNGs remain pixel-identical to
the pinned-toolchain outputs. A live partner-menu overlap was found and repaired
after that snapshot. That initial snapshot did not establish dungeon/reunion
acceptance. Physical devices and final-head website integration remain open.

The 22:43 UTC native review snapshot contains 112 resources with individual
hashes. It played the native opening/title, restored the existing Psyduck/Charmander
B3F save, opened Moves through the native touch toolbar, cancelled back to play,
and left the held berry unchanged when Throw was pressed without a Toolbox.
Manual movement reached the final stairs, then Caterpie's clearing, Butterfree's
reunion, the three-berry reward and the scoped completion screen. The browser
reported no console warnings or errors during this run. The arcade preview is an unchanged 256×192
capture from this run. The later held-direction fix across slow beats is a
documented source delta from that frozen snapshot and passed static review;
this run does not establish its manual status-effect behavior.

One raw browser-debugger reload call stalled for roughly 16 minutes. Ordinary
browser controls resumed, and the page reported no JavaScript errors. This is
not a measured game-engine freeze or performance result.

## Fidelity limits

- Dialogue and score remain authored substitutes. Native image reconstruction
  and selected exact Blue pixel checks do not establish complete animation,
  script or soundtrack identity. The source manifest records asset attribution
  without asserting a rights-holder reuse grant.
- Native AI/speed scheduling, cartridge RNG/call order and Blue binary parity
  remain qualified. Source arithmetic and sampled visual references are not
  proof of complete behavioral identity.
- All moves attainable within the conservative first-attempt Tiny Woods EXP
  ceiling have handlers. Repeated failed rescues retain EXP and can reach later
  learned moves with unsupported effects; these remain visibly unavailable
  without consuming a turn or PP rather than silently executing another effect.
- The title save menu and browser save/controls are scoped adaptations; later
  communication modes are not part of this opening.
- No automated game-source tests or playthroughs were created or executed.
  Static review and manual browser evidence remain separate.

## Source records

- [Visual evidence](../../../tools/pokemon-dungeon/reference/blue-visual.md)
- [Audio evidence](../../../tools/pokemon-dungeon/reference/blue-audio.md)
- [Mechanics evidence](../../../tools/pokemon-dungeon/reference/blue-mechanics.md)
- [Original Blue introduction video](https://www.youtube.com/watch?v=RrglH3dOqrg)
- [Current scope](BLUE-OPENING.md)
