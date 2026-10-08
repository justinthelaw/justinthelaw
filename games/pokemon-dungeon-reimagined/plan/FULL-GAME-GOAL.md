# Full Blue Rescue Team delivery goal

## Authority and outcome

Justin reaffirmed this goal on 2026-10-05: improve the **full game/campaign**
visually, ensure it is playable, and make the completed build deploy correctly
to GitHub Pages when its PR is merged. Continue implementation autonomously.
An unavailable external Codex Code Review is not a reason to loop or stop;
use independent source review and the required verification instead.

The goal is the complete scope in [PLAN.md](PLAN.md), including the original
Blue main story, ending and return, branching postgame, optional content,
roster and systems. A startup screen, art viewer, short dungeon demo, green
website CI, or a list of content names does not satisfy the goal.

## Confirmed starting point

| Area | State at main `c7270c8` |
| --- | --- |
| Website | Full-page launcher, mobile key bridge, desktop iframe focus |
| Game | Loading/error lifecycle and background-only Three.js scene |
| Gameplay | No movement, combat, campaign, town, progression or ending |
| Persistence | No campaign save/load implementation |
| Domain | Reviewed identity, bounded JSON and seeded RNG primitives only |
| Content | Authoring identity inventories; numerical/runtime catalogs incomplete |
| Art | Three rejected rigid-mesh character candidates and one cavern study |

## Current visual authority

The user's [reference](https://share.google/nf1JRyLPdiqhzI0Nu) resolves to an
[EthrA frame](https://d3kjluh73b9h9o.cloudfront.net/original/4X/a/8/1/a8190bc653b48718700190e6def995aa772af976.jpeg)
discussed in this [rendering thread](https://forums.unrealengine.com/t/360-degree-pixel-art-animations-in-a-3d-world-how-did-they-do-it/2014183).
Its visual direction is crisp directional pixel characters in a textured,
illuminated three-dimensional world with a third-person camera. The
[developer's listing](https://store.steampowered.com/app/2177510/EthrA/)
provides additional context. These references guide style; their artwork is
not copied into this project.

This latest direction supersedes D03's former bold cel-shaded/no-pixel-art
choice and any earlier inferred approval of the P06 character models.

- Preserve the original Blue species silhouettes, proportions, markings,
  palettes and distinctive features in newly authored artwork.
- Use directional RGBA pixel atlases on depth-tested billboards within actual
  3D environments; maintain coherent texel density and nearest sampling.
- Keep the hero and partner legible at a close third-person distance. Camera
  orbit, obstructions, dialogue framing and boss framing must remain usable.
- Author distinct town, forest, cave, volcanic, snow, sky, ocean, ruin and
  challenge environments throughout the campaign and postgame.
- Review recognizable species-specific assets; generic bodies with different
  colors or nameplates are not full roster coverage.
- Capture the arcade picture from actual campaign gameplay. An illustration
  or independently staged art preview cannot stand in for gameplay evidence.

Original-game visual references include the
[Nintendo Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
and [original developer screenshots](https://www.spike-chunsoft.co.jp/pages/games/pokedun_i/rescue01.html).
Continue to create original code, dialogue, artwork and audio; retain provenance.

## Completion gates

Every row requires implementation, independent review, and the appropriate
acceptance evidence. Record exact build/commit and remaining gaps; do not
check a row merely because a document or menu entry exists.

| Gate | Required evidence | Status |
| --- | --- | --- |
| Source and runtime content | Supported Blue rules, PMD-specific stats/effects, complete validated catalogs; unresolved facts explicitly closed or approved adaptations recorded | Open |
| Adventure kernel | Canonical state, legal turns/navigation, combat/moves, statuses/items, partner AI, recruitment, hunger/failure and atomic progression | Open |
| Saves | New game, continue, autosave/manual save, backup recovery, export/import and reset-dungeon restoration without data loss | Open |
| Onboarding and town | Hero/partner selection, opening rescue, rescue base, town services, jobs, ranks, Friend Areas and Dojo | Open |
| Main story | Every original expedition and intervening scene; fugitive route, reconstruction, Groudon, Rayquaza, credits, farewell and return | Open |
| Postgame | Branching ocean/relic, Eon, mirage, Western Cave, birds/Lugia/Deoxys, wishes, redemption and ultimate-challenge routes with their distinct prerequisites | Open |
| Optional and roster scope | All 45 field dungeons, 22 Dojo mazes, eligible 386 species and applicable original forms, evolution, optional/event and approved browser-equivalent modes | Open |
| Whole-game visuals | Distinct faithful characters and animated feedback, complete environment/scene kits, readable pixel-styled UI and original audio | Open |
| Controls and accessibility | Standard keyboard play, usable mobile emulator controls, camera/map/menu access, focus and interrupted-input recovery | Open |
| Gameplay acceptance | Recorded manual beginning-to-end campaign and postgame evidence, recovery/defeat/save checks, representative mobile/desktop observations | Open |
| Static Pages delivery | All assets local/relative, direct and iframe routes under `/justinthelaw/`, static export, contribution checks and current-head website CI | Open |
| Final release review | Current-head independent review, actual gameplay arcade capture, no material unresolved playability/content/visual gaps; user merges the completed PR | Open |

## Execution and verification policy

- Use `feat/pokemon-full-campaign`, based on current main `c7270c8`, preserving
  the unrelated historical implementation checkout and local-only history.
- Resume dependency-ready packages in PLAN, record decisions and concrete
  results in PROGRESS, and maintain fine-grained content/asset coverage.
- Keep the PR a draft while any full-game completion gate remains open.
  Do not merge it or describe it as a playable full release prematurely.
- Preserve the user's existing prohibition on automated tests importing or
  executing game source. Static lint, strict JSDoc types, schema/provenance,
  asset checks, source review and requested visual capture remain permitted;
  record manual gameplay evidence separately.
- Website tests intercept game navigation with inert fixtures. Run the
  repository's `npm run flight-check` and contribution checks for delivery.
- Distinguish build success, website integration success, gameplay acceptance
  and art acceptance in every progress report.
- The native Goals capability is not exposed in this session. This file is the
  durable repository goal, not a claim that a background Goals task was created.
