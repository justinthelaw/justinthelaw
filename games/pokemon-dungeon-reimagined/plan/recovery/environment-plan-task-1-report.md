# Task 1 report — full-campaign environment kit production

## Status and scope

Implemented original reusable environment kit candidates and exact canonical assignments. **Complete scene production is not claimed.** All 283 canonical variants explicitly remain `kit-assigned-scene-unbuilt`; no scene layout or original-location fidelity has been accepted. The controller viewed forest desktop, volcano desktop and town portrait, requested softer/lighter forest art, then reviewed the revision as a provisional kit foundation suitable for independent review.

| Artifact / coverage | Delivered |
| --- | ---: |
| Distinct biome material/light/prop kits | 12 |
| Original reusable 3D prop definitions | 40 |
| Original opaque 128×128 textures | 41 |
| Canonical dungeon identities, including 22 Dojo mazes | 67/67 |
| Dungeon sections | 73/73 |
| Actual Friend Areas | 57/57 |
| Other support/fixed-floor/segment/terminal/rest scenes | 86/86 |
| Independent 1440px / 390px kit compositions | 12 + 12 |
| Elevated orbit / named habitat reference frames | 4 + 6 |
| Individually finished campaign scene maps | 0 |

All main scene families plus desert and storm have dedicated kits: forest, cave, volcano, snow, sky, coast, ruins, crystal, town, dojo, desert and storm. Exact canonical rows, palette/prop references and shared-kit details are in `games/pokemon-dungeon-reimagined/plan/ENVIRONMENT-PRODUCTION.md`. Sections and many non-dungeon scenes inherit explicit parent material/prop references; their separate records do not imply unique scene production. The `dojo-rescue-team-maze` special-mode record is a mode descriptor, excluded from the scene inventory rather than invented as a 68th dungeon.

## Owned paths and runtime handoff

- New original authoring: `tools/pokemon-dungeon/art/environment/production/` (`geometry.mjs`, `kits.mjs`, `textures.mjs`, `mappings.mjs`, `source-index.json`, `CONTRACT.md`, `REVIEW.md`, captured evidence).
- New runtime data only: `games/pokemon-dungeon-reimagined/assets/environment/production/manifest.json` and `textures/*.png`.
- New independent inspector: `tools/pokemon-dungeon/art-preview/environment/`.
- New scripts: `tools/pokemon-dungeon/scripts/{export-environments,check-environments,capture-environments}.mjs`.
- New campaign plan: `games/pokemon-dungeon-reimagined/plan/ENVIRONMENT-PRODUCTION.md`.

The existing magma-cavern authoring proof and all character art are preserved. No game source, renderer, domain, shared progress or package files were edited by this task.

The schema is `environment-kits-v1`, version 1. It declares relative texture paths; per-kit material descriptors; box/cylinder/cone/sphere part sizes, transforms and material IDs; terrain material IDs; wall height, floor repeat and light/fog settings; exact binding groups and explicit unfinished variants. `CONTRACT.md` gives primitive dimension and rotation conventions. All paths are local and project-prefix safe.

The manifest contract was coordinated directly with `/root/production_renderer`. That separate owner provides asynchronous data/texture loading followed by synchronous `EnvironmentKit.create(WorldView)` returning `{root,syncVisibility,dispose,obstacles}`. `WorldView.biomeId` selects the kit, explicit prop kind selects a prop, and visibility/collision/legal tiles remain domain owned. This task's viewer never imports or executes the runtime adapter. Renderer integration is separately reviewed; no game execution occurred here.

## Visual evidence and corrections

The provided EthrA reference was actually viewed. All art is original code-native geometry/raster work; no extracted commercial assets, reference-pixel sampling or ImageGen/API retry. The art viewer uses the pinned tools Three.js and existing Pikachu/Charmander PNG pages solely as scale references.

Actual 34-shot source-hashed evidence lives at `tools/pokemon-dungeon/art/environment/production/evidence/captures/`. Every kit was inspected at 1440×1000 and 390×844; actual orbit and six habitat-reference views were also inspected. Important files: `forest-1440.jpg`, `forest-390.jpg`, `volcano-1440.jpg`, `snow-390.jpg`, `town-390.jpg`, `crystal-orbit.jpg`, `forest-orbit.jpg`, `habitat-power-plant.jpg` and `habitat-decrepit-lab.jpg`.

Corrections made from actual images:

1. Brightened the originally dry/olive forest ground and, after controller review, replaced slab-like canopy clusters with rounder ten-segment layered crowns and warm highlights. Clear movement space stayed open.
2. Extended land surfaces and added distant rock/tree layers after obvious platform edges made land scenes look suspended.
3. Narrowed the volcanic land strip to reveal lava channels and connect the warm lighting to visible lava.
4. Staggered side placements and background scales/yaws rather than repeating exact mirrored positions.
5. Widened/reduced town fences to reveal a readable forecourt and water landmark at 390px.
6. Added restrained translucent caption backing after pale snow reduced text contrast.
7. Lifted the inspection orbit camera above perimeter props after actual forest/town orbit captures were blocked by tree crowns. The reset camera retains the low gameplay-scale view.
8. Explicitly disposed directional shadow resources on kit switches in addition to textures, materials and geometry.

`REVIEW.md` records observations and unfinished work for all 12 kits. Counts and clean screenshots are not treated as final human art acceptance.

## Verification and limits

Independent static audit uses Node built-ins only and imports no generator, viewer or game module. It validates PNG signatures, CRCs, opaque RGBA format, dimensions and palette variation; local nonsymlink paths and all file/source/catalog hashes; exact canonical coverage and target references; bounded finite primitive geometry, material/light parameters and texture estimates; manifest/source scope; and fresh capture hashes, expected views, errors and observed budgets.

The art-only capture server serves tools code and an exact whitelist of runtime environment JSON/PNG data. Other game URLs and all game code are excluded. It records zero console, page or forbidden-resource errors, keyboard orbit, and the repaired twelve-switch instance/buffer lifecycle described below; eight resident images / 699,056 decoded bytes including estimated mipmaps.

Each kit uses eight 128² textures, approximately 0.667 MiB with mipmaps; two incidental character pages add 2.25 MiB. Driver resources, framebuffer and shadow-map memory are excluded. Per-file ceiling is 1 MiB, selected-kit texture ceiling 1 MiB, authored prop ceiling 24 parts, radial ceiling 12 segments; observed max prop is 12 parts. Scene ceilings are 160 draws / 80,000 triangles. Counters are SwiftShader scene complexity, **not** mobile frame-time, actual GPU-memory or game-performance certification.

Final verification:

- `node tools/pokemon-dungeon/scripts/check-environments.mjs`: PASS; 12 kits / 40 props / 41 original opaque PNGs, exact 67+73+57+86 assignments, all source/runtime/capture hashes and limits valid.
- Deterministic regeneration: all 42 runtime files retain identical SHA-256 hashes.
- Scoped ESLint for all new environment authoring/viewer/scripts: PASS.
- Strict global authoring types: PASS, 74 authored source files; no source execution.
- Final 34 art captures: zero console/page/resource errors; keyboard orbit and texture lifecycle PASS.
- Texture encoded bytes: 644,543 total, max 19,029. Runtime manifest: 491,765 bytes; SHA-256 `9da1ab8f1098db484fcc60449d1211cc24db67aacc00722f94278062c6de7c6c`.
- Final observed peak: 41 draw calls / 33,524 triangles. Largest JPEG: 290,736 bytes. All artifacts below 1 MiB.
- Scoped pre-push hooks: PASS (large files, secrets, conflict markers, EOF/whitespace, quotes and Markdown); formatting-only doc fixes were applied and rechecked.
- `git diff --cached --check`: PASS.
- Game imports/execution/tests: none.

## Remaining production work

All 283 individual scene layouts remain unbuilt: terrain topology, entrances/exits, fixed-floor and event blocking, residents/NPCs, local landmarks, per-floor direction and final human acceptance. The existing generic cottages are reusable pieces only: **Pokémon Square, rescue-base and shops need bespoke architecture and named-service layouts**. Labs/power plants have explicit machinery references, not complete interiors. Underwater volumes, weather/motion, richer foliage, camera/occlusion in complete maps and actual device performance remain open. The controller's provisional kit review does not close these tasks or approve full campaign scenery.

## Commit ownership

Controller granted the environment index slot after root commit `5a6f300`. Only the new paths above will be staged. Package aliases are deferred to the controller: `environment:{export,check,capture}` and `environment:check` in the asset chain. No child agents or game tests were used.

Commit: `7ae404f` (`feat(pokemon): author full-campaign environment kit candidates`), exactly 92 environment-owned files. Index released; unrelated concurrent work preserved.

## Independent-review P2 repair

The review correctly identified missing `THREE.InstancedMesh.dispose()` in the art viewer. The shared primitive geometries were disposed, but their separate per-instance GPU buffers were not owned by that cleanup. The old claim about complete mesh disposal was too broad.

Repaired `cleanup()` to call `dispose()` on every old instanced object before `world.clear()`, retaining unique geometry/material/texture disposal and directional shadow disposal. Added event-based created/disposed/live object accounting. Capture instrumentation separately wraps actual WebGL2 buffer creation/deletion, and waits for a rendered revision before sampling. It exercises two complete forest → crystal → town → volcano → forest → Safari variant → forest-reset cycles (12 kit/variant changes).

Observed evidence: 148 mesh objects created, 136 dispose events, 12 live on return to forest; 816 WebGL buffer creations, 736 deletions, 80 live buffers matching the initial baseline after both cycles. Every transition disposes exactly the prior live instance count. Texture releases total 96, with eight resident images at completion. WebGL counts include all buffer types and do not estimate their byte sizes. The independent static audit validates the 13-sample trace, exact step labels, conservation arithmetic, disposal deltas and repeated baseline recovery.

Fresh 34-frame capture run: zero console/page/forbidden-resource errors. All screenshot pixels/hashes remain unchanged; the capture record has the new viewer source hash and lifecycle trace. Scoped ESLint passes; strict authoring types pass for 83 files. The independent environment audit passes. No runtime game code was imported or executed; the separately owned runtime adapter was not changed. Review limits on scene staging and human acceptance remain unchanged.

Repair commit: `f2adf399c4483708b19aa1e6c94ff19c4ddec7f3`. Exactly six environment repair files; all scoped pre-push hooks and cached-diff checks passed. Index released.
