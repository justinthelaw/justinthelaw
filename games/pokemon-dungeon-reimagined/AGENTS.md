# Roux's Adventure

Follow [BLUE-OPENING.md](plan/BLUE-OPENING.md): start directly at the authored
Roux menu, then personality test, partner creation, awakening and three Tiny
Woods floors through Caterpie's reunion/reward. The 2026-10-13 owner brief
supersedes original boot/title fidelity: optional Normal/Ground Roux, a playful
quiz route, brown/cream branding, canine/Ground moves and Pickup. Town, team formation, later dungeons and the
former 3D campaign are excluded. PR #397 is merged.

- `index.html` selects `src/blue/`: two 256x192 Canvas 2D displays, local assets
  and relative URLs. Preserve Pages iframe/control integration.
- [`src/blue/`](src/blue/AGENTS.md) separates mechanics, presentation, input,
  audio and persistence. [`src/domain/`](src/domain/AGENTS.md) retains selected
  numerical rules, generation, random state and plain-data validation only.
- Authoring, archives and disposable previews belong in
  [`tools/pokemon-dungeon/`](../../tools/pokemon-dungeon/AGENTS.md).
  `distribution.json` defines runtime closure; preserve its 3 MiB cap,
  per-image bounds and battle-effect memory limits.
- Use JavaScript ES modules/JSDoc and the pinned authoring package's
  `npm run check`. Website validation is separate; report unavailable checks.
- D05 forbids automated tests importing/executing game source, native game
  execution and automated playthroughs. Static syntax/lint/types/JSON/source/
  provenance/PNG/size checks and manual browser review are allowed.
  Website tests use inert fixtures.
- Preserve save schemas, two-slot journals, stale-write guards and historical
  keys. Cleanup must not clear browser data. Keep transient evidence outside
  saves and prevent paused/retired callbacks from replaying.
- Use original Blue evidence; Red is comparative without corroboration.
  Preserve URLs, hashes, attribution and uncertainty. Include no ROM.
  Public availability is not a reuse grant; dialogue is an authored adaptation.
- Background music was removed at the owner's request on 2026-10-11.
  Keep qualified gameplay/UI effects without a music scheduler.
- Record acceptance in [BLUE-OPENING-REVIEW.md](plan/BLUE-OPENING-REVIEW.md)
  and source decisions in `tools/pokemon-dungeon/reference/`.
  The owner's "95% viable product" goal is a review target, not a fidelity score.
  Roux's explicitly authored learnset extends that historical checkpoint;
  unrelated weather/move expansion stays outside this task.
- Keep cleanup recoverable; the [pruning history](plan/BLUE-PRUNING.md) records
  the former campaign. Obsolete plans/validators are not current gates.
- Use signed commits and preserve unrelated work. Root repository instructions
  govern publication authorization; historical PR authority is not ongoing.
