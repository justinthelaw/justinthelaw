# Blue Rescue Team opening

Follow [BLUE-OPENING.md](plan/BLUE-OPENING.md). The goal is the original Nintendo
DS opening, title/menu, personality test, partner creation, awakening and three
Tiny Woods floors through Caterpie's reunion with Butterfree. Stop after the
rescue reward. Town, team formation and later dungeons are outside this version.
Justin explicitly requested removing unused code and assets on 2026-10-11.

- `index.html` selects `src/blue/`, using two 256 × 192 Canvas 2D displays.
  Keep code, data, images, fonts and audio local with relative URLs. Preserve
  the existing GitHub Pages iframe integration and browser controls.
- Keep mechanics, rendering, input, audio and persistence separate. The small
  `src/domain/` helpers supply only the selected numerical rules, generation,
  random state and plain-data validation. Do not restore the campaign graph,
  Three.js or later-game abstractions to implement an opening feature.
- Authoring packages, caches, exports and evidence belong in
  `tools/pokemon-dungeon/`. `distribution.json` is the explicit runtime closure.
  Retain the 3 MiB distribution cap, per-image limits and effect-bank bounds.
- Use JavaScript ES modules with JSDoc and strict independent static checks.
  Run the pinned Node 24 authoring package's `npm run check` after changes.
  Website validation remains separate; report any unavailable required check.
- D05: no tests may import or execute game source, no native game execution,
  and no automated playthroughs. Static syntax, lint, types, JSON, source,
  provenance, PNG and size checks are permitted. Manual browser play and
  visual inspection are permitted. Website tests use inert game fixtures.
- Preserve the opening's save schema, two-slot journal and stale-write guards.
  Existing historical browser saves keep their separate keys; removing unused
  source must never clear browser data. Keep transient presentation evidence
  outside saves and prevent paused or retired callbacks from replaying actions.
- The reference is original Blue Rescue Team. Red source is comparative unless
  corroborated for Blue; do not silently use DX, Explorers or main-series rules.
  Keep source URLs, hashes, attribution and uncertainty with factual inputs.
  Public image availability is not a publisher reuse grant. No ROM is included;
  dialogue remains an authored adaptation with explicit fidelity gaps. Justin
  requested removing all background music on 2026-10-11; retain gameplay/UI
  effects and their source qualifications, without restoring a music scheduler.
- Record current evidence in [BLUE-OPENING-REVIEW.md](plan/BLUE-OPENING-REVIEW.md)
  and scoped `tools/pokemon-dungeon/reference/blue-*.md` notes. Retire unwanted
  files to macOS Trash with a restore ledger. Git history retains the former
  campaign; obsolete plans and validators are not current acceptance gates.
- Work on PR #397's `feat/pokemon-campaign-recovery` branch. Signed commits and
  ordinary pushes are authorized. Do not merge, deploy, or mutate issue/PR
  metadata without separate authority. Preserve unrelated work and leave the
  repository root README unchanged.
