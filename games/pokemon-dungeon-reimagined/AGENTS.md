# Blue Rescue Team opening

Follow [BLUE-OPENING.md](plan/BLUE-OPENING.md): original DS title/menu,
personality test, partner creation, awakening, and three Tiny Woods floors
through Caterpie's reunion and rescue reward. Town, team formation, later
dungeons, and 3D/campaign code are excluded. PR #397 is merged.

The owner's 2026-10-12 "95% viable product" target prioritized a playable,
review-ready opening, required checks, and blocking fixes. It is not a measured
fidelity score. Document remaining fidelity and retry-move limits; keep further
weather/move expansion outside this checkpoint.

- `index.html` selects `src/blue/`: two 256×192 Canvas 2D displays, local
  code/data/images/fonts/audio, and relative URLs. Preserve Pages iframe and
  browser-control integration.
- Separate mechanics, rendering, input, audio, and persistence. `src/domain/`
  holds only selected numerical rules, generation, random state, and plain-data
  validation. Do not restore the campaign graph, Three.js, or later-game
  abstractions for opening features.
- Authoring, caches, exports, and evidence belong in `tools/pokemon-dungeon/`.
  `distribution.json` defines runtime closure; keep its 3 MiB cap, per-image
  limits, and effect-bank bounds.
- Use JavaScript ES modules/JSDoc and strict independent checks. Run the pinned
  Node 24 authoring package's `npm run check` after changes; website validation
  is separate. Report unavailable required checks.
- D05 forbids tests importing/executing game source, native game execution, and
  automated playthroughs. Static syntax/lint/types/JSON/source/provenance/PNG/
  size checks and manual browser/visual review are allowed. Website tests use
  inert game fixtures.
- Preserve the save schema, two-slot journal, stale-write guards, and separate
  historical save keys. Pruning must never clear browser data. Keep transient
  presentation evidence outside saves; paused/retired callbacks must not replay.
- Use original Blue sources; Red is comparative unless corroborated. Do not
  silently substitute DX, Explorers, or main-series rules. Preserve URLs,
  hashes, attribution, and uncertainty. Public availability is not a reuse
  grant. Include no ROM; dialogue is an authored adaptation with fidelity gaps.
  The owner removed background music on 2026-10-11: retain qualified gameplay/UI
  effects without restoring a music scheduler.
- Record evidence in [BLUE-OPENING-REVIEW.md](plan/BLUE-OPENING-REVIEW.md) and
  `tools/pokemon-dungeon/reference/blue-*.md`. Retire unwanted local files to
  macOS Trash with a restore ledger. Git history retains the former campaign;
  obsolete plans/validators are not acceptance gates.
- Use signed commits and preserve unrelated work. Merging, deploying, and
  issue/PR metadata changes require explicit authorization. Keep root README
  changes within the user's requested scope.
