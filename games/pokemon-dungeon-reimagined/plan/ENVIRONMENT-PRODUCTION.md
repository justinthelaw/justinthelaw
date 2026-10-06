# Environment production candidates

This wave authors 12 reusable textured 3D kits, 40 original prop definitions and 41 original 128×128 PNGs. It assigns every canonical dungeon and Friend Area plus all section and support-scene catalog identities. It does **not** finish or accept their individual maps. The 12 independent composition studies are reusable-kit previews, not campaign scene layouts.

## Delivered scope

| Scope | Explicit assignments | Scene layouts accepted |
| --- | ---: | ---: |
| Canonical dungeons, including 22 Dojo mazes | 67 | 0 |
| Dungeon sections | 73 | 0 |
| Actual Friend Areas | 57 | 0 |
| Fixed floors, support, segments, terminal and rest locations | 86 | 0 |

The `dojo-rescue-team-maze` special-mode catalog record is a mode descriptor, not another canonical dungeon or scene; it is intentionally excluded from location assignments. Every one of the 283 variant records declares `kit-assigned-scene-unbuilt`. Sections and most terminal/rest/fixed-floor variants inherit their parent kit and prop references; they have separate scene-gap records, not invented unique scenery. Ten support locations have explicit authored assignments.

## Art and runtime handoff

`assets/environment/production/manifest.json` is the local runtime artifact; all texture paths are relative to its directory. Authoring is `tools/pokemon-dungeon/art/environment/production/`. The exact typed geometry/material contract is in that directory's `CONTRACT.md`.

The renderer adapter is separately owned. A synchronous `EnvironmentKit.create(WorldView)` consumes locally prepared kit data and returns a Three group, visibility synchronization and disposal. Explicit `world.biomeId` selects a kit and `props[].kind` selects a prop. The manifest never owns legal movement, collision, exploration, encounter placement, exits or campaign progression. A successful art viewer does not establish runtime integration or gameplay correctness.

Twelve floor, wall and water texture families are kit-specific. Five shared textures provide foliage, timber, ornament, roof shingles and lava. Each kit currently references eight texture images; ornament also colors trim, accents, plaster and lighter leaves. All prop definitions are original assemblies of boxes, cylinders, cones and low-sided spheres; no GLB loader or extracted commercial assets are needed. Shared mesh definitions receive the kit material palette.

| Kit | Ground / light direction | Exact reusable prop IDs |
| --- | --- | --- |
| `forest` | Mossy earth; warm canopy light / cool haze | `boulder-cluster`, `stairway`, `broadleaf-tree`, `pine-tree`, `fern-cluster`, `flower-patch`, `fallen-log`, `root-arch`, `mushroom-ring`, `reed-bed`, `waterfall-rock`, `mossy-rock` |
| `cave` | Irregular grey rock; cool slate / muted key | `boulder-cluster`, `stairway`, `stalagmite-cluster`, `stone-arch`, `crystal-cluster`, `basalt-organ`, `fossil-ribs`, `mossy-rock` |
| `volcano` | Dark fractured basalt; ember pools / orange lava | `boulder-cluster`, `stairway`, `obsidian-spire`, `basalt-organ`, `lava-vent`, `stalagmite-cluster`, `stone-arch`, `sandstone-fin` |
| `snow` | Wind-softened snow; cold blue shadow / pale key | `boulder-cluster`, `stairway`, `snow-pine`, `ice-shard`, `snow-drift`, `carved-pillar`, `waterfall-rock`, `shell-cluster`, `stone-arch` |
| `sky` | Pale pavers; open blue atmosphere / ivory clouds | `boulder-cluster`, `stairway`, `cloud-bank`, `floating-island`, `carved-pillar`, `broken-pillar`, `stone-arch`, `rune-plinth`, `hanging-banner` |
| `coast` | Sand and rippling water; teal atmosphere / coral accents | `boulder-cluster`, `stairway`, `coral-fan`, `reed-bed`, `shell-cluster`, `waterfall-rock`, `broadleaf-tree`, `stone-arch`, `broken-pillar`, `mossy-rock` |
| `ruins` | Weathered pavers; green-grey stone / warm trim | `boulder-cluster`, `stairway`, `stone-arch`, `carved-pillar`, `broken-pillar`, `rune-plinth`, `fern-cluster`, `root-arch`, `lab-table`, `conducting-coil` |
| `crystal` | Blue stone; cyan mineral emission / deep violet haze | `boulder-cluster`, `stairway`, `crystal-cluster`, `stalagmite-cluster`, `stone-arch`, `rune-plinth`, `conducting-coil`, `lab-table`, `basalt-organ`, `carved-pillar` |
| `town` | Warm cobbles; amber windows / teal roofs | `boulder-cluster`, `stairway`, `cottage`, `fence-section`, `notice-board`, `pond-well`, `timber-gate`, `broadleaf-tree`, `fern-cluster`, `flower-patch`, `reed-bed` |
| `dojo` | Cedar boards; warm interior key / shaded timber | `boulder-cluster`, `stairway`, `timber-gate`, `training-post`, `hanging-banner`, `fence-section`, `carved-pillar`, `stone-arch`, `conducting-coil` |
| `desert` | Wind-striped sand; ochre canyon / pale sun | `boulder-cluster`, `stairway`, `cactus`, `sandstone-fin`, `fossil-ribs`, `broken-pillar`, `stone-arch`, `rune-plinth` |
| `storm` | Blue-grey basalt; cool storm sky / charged yellow accents | `boulder-cluster`, `stairway`, `conducting-coil`, `crystal-cluster`, `basalt-organ`, `sandstone-fin`, `pine-tree`, `hanging-banner`, `lab-table` |

## Evidence and budgets

The independent art inspector is `tools/pokemon-dungeon/art-preview/environment/index.html`. Serve the repository root to resolve local art data and pinned tools Three.js. It imports no game source and uses existing Pikachu/Charmander idle pages only as visual scale references. The capture server whitelists tools paths and runtime environment JSON/PNG files; all other game resources are forbidden.

Evidence: `tools/pokemon-dungeon/art/environment/production/evidence/captures/capture-record.json` and 34 JPEG frames: every kit at 1440×1000 and 390×844, four orbit views, and six named habitat palette/prop previews. Source and capture hashes are independently checked. `REVIEW.md` records actual inspection observations and corrections.

- 41 PNGs total 644,543 encoded bytes; largest 19,029 bytes. Manifest is 491,765 bytes. Every tracked artifact remains below 1 MiB.
- Each selected kit: eight 128² RGBA textures, approximately 699,056 decoded bytes including mipmaps. The two incidental sprite pages add 2.25 MiB. This estimate excludes framebuffers, depth/shadow maps and driver overhead.
- Observed art captures: maximum 41 draw calls and 33,524 rendered triangles. Ceilings: 160 draws / 80,000 triangles. These are static scene counters in SwiftShader, **not** mobile frame-rate, GPU-memory or game-performance measurements.
- Maximum prop: 12 parts; permitted ceiling 24. Radial segments 4–10, ceiling 12. Per-kit instancing groups identical primitive/material combinations.
- sRGB colors; environment magnification nearest, minification trilinear mipmaps, repeat wrapping; directional pixel sprites retain nearest sampling with no mipmaps.
- Kit switching explicitly disposes each `InstancedMesh` before clearing the old world, then releases unique geometry/material/texture and directional shadow resources. Twelve kit/variant switches emit 136 mesh disposal events and release 96 textures, returning to 12 live instance objects and eight environment images. Independent WebGL instrumentation observes 816 buffer creations / 736 deletions and returns to the initial 80 live buffers after each full cycle. These counts include all WebGL buffer types, not byte usage. Keyboard orbit was exercised.

## Verification commands

```sh
node tools/pokemon-dungeon/scripts/export-environments.mjs
node tools/pokemon-dungeon/scripts/check-environments.mjs
node tools/pokemon-dungeon/scripts/check-types.mjs
ENVIRONMENT_CAPTURE_BROWSER=/path/to/chromium node tools/pokemon-dungeon/scripts/capture-environments.mjs
```

The independent checker reads built-in Node JSON/PNG/source bytes only. It validates PNG CRCs, format, alpha, palette variation, hashes, file lists, local paths without symlinks, exact canonical ID coverage, all material and prop references, finite geometry dimensions, light bounds, texture estimates and capture freshness. It does not import the generator, viewer or game modules.

## Remaining work

Individual room layouts, unique landmark placements, scene-specific terrain topology, event/fixed-floor blocking, resident and NPC staging, entrances/exits, per-floor art direction, underwater volumes, weather/motion, accessibility evaluation and final human art acceptance remain open. Bespoke Pokémon Square, rescue-base and shop architecture, village services, lab machinery and charged habitats have appropriate reusable props and exact mappings; their complete buildings/interiors and interactions are unbuilt. The reference direction has been viewed, but matching its full foliage richness and polished scene composition requires further authored scene work.

The following tables are the exact mapping handoff, not completed-scene claims. Every row remains **scene unbuilt**.

## Canonical dungeons

| Canonical ID | Kit | Palette / prop variant |
| --- | --- | --- |
| `tiny-woods` | `forest` | `#fff1c8`; broadleaf-tree, fern-cluster, flower-patch |
| `thunderwave-cave` | `cave` | `#d9e7ef`; crystal-cluster, stalagmite-cluster |
| `mt-steel` | `cave` | `#e4d6ca`; basalt-organ, boulder-cluster |
| `sinister-woods` | `forest` | `#b8c3bd`; root-arch, mushroom-ring, fallen-log |
| `silent-chasm` | `cave` | `#d7d0bb`; stone-arch, boulder-cluster |
| `mt-thunder` | `storm` | `#cedbed`; conducting-coil, basalt-organ, crystal-cluster |
| `great-canyon` | `desert` | `#f4d5a6`; sandstone-fin, broken-pillar |
| `lapis-cave` | `crystal` | `#b9d8ea`; crystal-cluster, stone-arch |
| `mt-blaze` | `volcano` | `#e6bc98`; obsidian-spire, sandstone-fin |
| `frosty-forest` | `snow` | `#e1f2f4`; snow-pine, snow-drift |
| `mt-freeze` | `snow` | `#eaf3fa`; ice-shard, stone-arch, snow-drift |
| `uproar-forest` | `forest` | `#e5e0ae`; broadleaf-tree, fallen-log, fern-cluster |
| `magma-cavern` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `sky-tower` | `sky` | `#f4ecd0`; carved-pillar, floating-island, stone-arch |
| `rock-path` | `cave` | `#ddcbb7`; boulder-cluster, stalagmite-cluster |
| `snow-path` | `snow` | `#d8eaf0`; snow-drift, ice-shard |
| `howling-forest` | `forest` | `#b9d3bf`; pine-tree, root-arch, mushroom-ring |
| `stormy-sea` | `coast` | `#a6d3d8`; coral-fan, broken-pillar, waterfall-rock |
| `silver-trench` | `coast` | `#c3ddea`; stone-arch, broken-pillar, coral-fan |
| `meteor-cave` | `crystal` | `#c8b8dc`; crystal-cluster, basalt-organ |
| `fiery-field` | `volcano` | `#edc5a0`; lava-vent, sandstone-fin |
| `lightning-field` | `storm` | `#dde1b6`; conducting-coil, crystal-cluster |
| `northwind-field` | `snow` | `#cfe9ef`; snow-drift, snow-pine |
| `mt-faraway` | `sky` | `#f2d5ac`; broken-pillar, rune-plinth, cloud-bank |
| `western-cave` | `cave` | `#c1cbd6`; stone-arch, basalt-organ, stalagmite-cluster |
| `northern-range` | `cave` | `#d6dfc8`; boulder-cluster, stone-arch |
| `pitfall-valley` | `forest` | `#b7cfad`; root-arch, broadleaf-tree, fallen-log |
| `buried-relic` | `ruins` | `#ded2b2`; stone-arch, carved-pillar, rune-plinth |
| `wish-cave` | `crystal` | `#d6c8e8`; rune-plinth, crystal-cluster |
| `murky-cave` | `cave` | `#b8c5b9`; mossy-rock, stone-arch |
| `desert-region` | `desert` | `#f5dfad`; cactus, sandstone-fin, fossil-ribs |
| `southern-cavern` | `cave` | `#ded1be`; stalagmite-cluster, basalt-organ |
| `wyvern-hill` | `forest` | `#d3debc`; pine-tree, boulder-cluster |
| `solar-cave` | `crystal` | `#e5ddb2`; carved-pillar, rune-plinth, crystal-cluster |
| `darknight-relic` | `ruins` | `#adb3cd`; broken-pillar, stone-arch, rune-plinth |
| `grand-sea` | `coast` | `#b5ded2`; coral-fan, shell-cluster, reed-bed |
| `waterfall-pond` | `forest` | `#cbe7c2`; waterfall-rock, reed-bed, mossy-rock |
| `unown-relic` | `ruins` | `#dbd1b3`; carved-pillar, rune-plinth, broken-pillar |
| `joyous-tower` | `sky` | `#e8e4c8`; carved-pillar, hanging-banner, stone-arch |
| `far-off-sea` | `coast` | `#abcbd8`; stone-arch, coral-fan, shell-cluster |
| `purity-forest` | `forest` | `#e2edc5`; broadleaf-tree, flower-patch, root-arch |
| `oddity-cave` | `cave` | `#d4c4de`; crystal-cluster, mossy-rock, fossil-ribs |
| `remains-island` | `ruins` | `#d8dfbf`; broken-pillar, fern-cluster, root-arch |
| `marvelous-sea` | `coast` | `#c6e3d9`; coral-fan, shell-cluster, waterfall-rock |
| `fantasy-strait` | `coast` | `#d5e4ed`; stone-arch, broadleaf-tree, reed-bed |
| `dojo-normal-maze` | `dojo` | `#e9dec1`; training-post, training-post, timber-gate |
| `dojo-fire-maze` | `dojo` | `#efc09a`; training-post, hanging-banner, timber-gate |
| `dojo-water-maze` | `dojo` | `#bbdbe5`; training-post, conducting-coil, timber-gate |
| `dojo-grass-maze` | `dojo` | `#cadfb4`; training-post, training-post, timber-gate |
| `dojo-electric-maze` | `dojo` | `#ebe1a2`; training-post, conducting-coil, timber-gate |
| `dojo-ice-maze` | `dojo` | `#dae9f0`; training-post, carved-pillar, timber-gate |
| `dojo-fighting-maze` | `dojo` | `#dfb491`; training-post, training-post, timber-gate |
| `dojo-ground-maze` | `dojo` | `#e2c99c`; training-post, stone-arch, timber-gate |
| `dojo-flying-maze` | `dojo` | `#d5e2de`; training-post, hanging-banner, timber-gate |
| `dojo-psychic-maze` | `dojo` | `#dec4e8`; training-post, carved-pillar, timber-gate |
| `dojo-poison-maze` | `dojo` | `#c5b6db`; training-post, hanging-banner, timber-gate |
| `dojo-bug-maze` | `dojo` | `#cddcad`; training-post, training-post, timber-gate |
| `dojo-rock-maze` | `dojo` | `#d1c5b3`; training-post, stone-arch, timber-gate |
| `dojo-ghost-maze` | `dojo` | `#bfbacf`; training-post, hanging-banner, timber-gate |
| `dojo-dragon-maze` | `dojo` | `#b8cfd4`; training-post, carved-pillar, timber-gate |
| `dojo-dark-maze` | `dojo` | `#acb4c5`; training-post, stone-arch, timber-gate |
| `dojo-steel-maze` | `dojo` | `#c6d2d3`; training-post, conducting-coil, timber-gate |
| `dojo-team-shifty-maze` | `dojo` | `#c3d3ae`; training-post, training-post, timber-gate |
| `dojo-team-constrictor-maze` | `dojo` | `#d8c9e4`; training-post, hanging-banner, timber-gate |
| `dojo-team-hydro-maze` | `dojo` | `#badce6`; training-post, conducting-coil, timber-gate |
| `dojo-team-rumblerock-maze` | `dojo` | `#d9c2a5`; training-post, stone-arch, timber-gate |
| `dojo-rescue-team-maze` | `dojo` | `#ecd79e`; training-post, timber-gate, timber-gate |

## Actual Friend Areas

| Canonical ID | Kit | Palette / prop variant |
| --- | --- | --- |
| `friend-area-beau-plains` | `forest` | `#e8e8b4`; flower-patch, broadleaf-tree |
| `friend-area-mt-cleft` | `cave` | `#d1c4b3`; stone-arch, boulder-cluster |
| `friend-area-turtleshell-pond` | `coast` | `#c8dfbf`; shell-cluster, reed-bed |
| `friend-area-mist-rise-forest` | `forest` | `#bfd8ce`; pine-tree, mushroom-ring |
| `friend-area-flyaway-forest` | `forest` | `#dce5ba`; broadleaf-tree, fallen-log |
| `friend-area-wild-plains` | `forest` | `#dbd0a0`; fern-cluster, boulder-cluster |
| `friend-area-ravaged-field` | `volcano` | `#ccb79f`; basalt-organ, obsidian-spire |
| `friend-area-energetic-forest` | `forest` | `#e8dba6`; flower-patch, fallen-log |
| `friend-area-furnace-desert` | `desert` | `#f0c699`; sandstone-fin, cactus |
| `friend-area-safari` | `forest` | `#d9d39b`; broadleaf-tree, fern-cluster |
| `friend-area-mt-moonview` | `cave` | `#c2c8e0`; boulder-cluster, stone-arch |
| `friend-area-darkness-ridge` | `storm` | `#b9bfd2`; basalt-organ, sandstone-fin |
| `friend-area-sky-blue-plains` | `forest` | `#d5ebde`; flower-patch, fern-cluster |
| `friend-area-echo-cave` | `cave` | `#d6dedb`; stone-arch, stalagmite-cluster |
| `friend-area-jungle` | `forest` | `#b9cc9f`; root-arch, broadleaf-tree, fern-cluster |
| `friend-area-mushroom-forest` | `forest` | `#d9c5d0`; mushroom-ring, fallen-log |
| `friend-area-secretive-forest` | `forest` | `#b2c2bd`; root-arch, mushroom-ring |
| `friend-area-boulder-cave` | `cave` | `#d3ccbc`; boulder-cluster, basalt-organ |
| `friend-area-scorched-plains` | `volcano` | `#dcbd9e`; lava-vent, basalt-organ |
| `friend-area-tadpole-pond` | `coast` | `#c5ddbc`; reed-bed, mossy-rock |
| `friend-area-decrepit-lab` | `ruins` | `#c8d5d4`; lab-table, conducting-coil, broken-pillar |
| `friend-area-mt-discipline` | `dojo` | `#d6c9ac`; training-post, stone-arch |
| `friend-area-bountiful-sea` | `coast` | `#d1e6c5`; coral-fan, shell-cluster |
| `friend-area-mt-deepgreen` | `forest` | `#bbd2ae`; pine-tree, mossy-rock |
| `friend-area-power-plant` | `storm` | `#c7d4df`; conducting-coil, lab-table |
| `friend-area-ice-floe-beach` | `snow` | `#d9edf0`; snow-drift, shell-cluster |
| `friend-area-poison-swamp` | `forest` | `#c2bad2`; reed-bed, mushroom-ring |
| `friend-area-shallow-beach` | `coast` | `#f0e1bd`; shell-cluster, reed-bed |
| `friend-area-treasure-sea` | `coast` | `#eadbad`; broken-pillar, shell-cluster |
| `friend-area-rub-a-dub-river` | `forest` | `#d1e7d1`; waterfall-rock, reed-bed |
| `friend-area-overgrown-forest` | `forest` | `#bccba0`; root-arch, fern-cluster |
| `friend-area-frigid-cavern` | `snow` | `#caddeb`; ice-shard, stone-arch |
| `friend-area-crater` | `volcano` | `#c9b6b2`; obsidian-spire, basalt-organ |
| `friend-area-waterfall-lake` | `coast` | `#cae7dc`; waterfall-rock, mossy-rock |
| `friend-area-mystic-lake` | `coast` | `#d0cde5`; stone-arch, coral-fan |
| `friend-area-transform-forest` | `forest` | `#d5d8be`; broadleaf-tree, mushroom-ring, flower-patch |
| `friend-area-deep-sea-floor` | `coast` | `#a9c8d9`; coral-fan, boulder-cluster |
| `friend-area-ancient-relic` | `ruins` | `#d8cfb2`; carved-pillar, rune-plinth |
| `friend-area-legendary-island` | `sky` | `#e2d8bf`; carved-pillar, rune-plinth, cloud-bank |
| `friend-area-cryptic-cave` | `crystal` | `#c9bddb`; rune-plinth, stalagmite-cluster |
| `friend-area-final-island` | `forest` | `#e8e2c2`; broadleaf-tree, flower-patch, mossy-rock |
| `friend-area-thunder-meadow` | `storm` | `#d9dcae`; crystal-cluster, pine-tree |
| `friend-area-peanut-swamp` | `forest` | `#d3ceac`; reed-bed, fallen-log |
| `friend-area-aged-chamber-an` | `ruins` | `#d4c59e`; carved-pillar, rune-plinth |
| `friend-area-aged-chamber-o-question` | `ruins` | `#bdc8d0`; broken-pillar, stone-arch |
| `friend-area-serene-sea` | `coast` | `#d8ece1`; shell-cluster, coral-fan |
| `friend-area-sacred-field` | `forest` | `#e9dcae`; flower-patch, root-arch |
| `friend-area-deep-sea-current` | `coast` | `#b5cfe0`; waterfall-rock, coral-fan |
| `friend-area-rainbow-peak` | `sky` | `#ecd6b0`; rune-plinth, floating-island |
| `friend-area-healing-forest` | `forest` | `#deedc9`; flower-patch, broadleaf-tree |
| `friend-area-dragon-cave` | `cave` | `#c6cfca`; stone-arch, fossil-ribs |
| `friend-area-magnetic-quarry` | `storm` | `#c0ced6`; conducting-coil, basalt-organ |
| `friend-area-southern-island` | `coast` | `#eddcbd`; broadleaf-tree, shell-cluster |
| `friend-area-seafloor-cave` | `coast` | `#b1d2d4`; stone-arch, waterfall-rock |
| `friend-area-volcanic-pit` | `volcano` | `#d6bca6`; lava-vent, obsidian-spire |
| `friend-area-stratos-lookout` | `sky` | `#d9e6ed`; floating-island, carved-pillar, cloud-bank |
| `friend-area-enclosed-island` | `ruins` | `#cdd7bb`; stone-arch, root-arch |

## Dungeon sections

| Canonical ID | Kit | Palette / prop variant |
| --- | --- | --- |
| `buried-relic` | `ruins` | `#ded2b2`; stone-arch, carved-pillar, rune-plinth |
| `darknight-relic` | `ruins` | `#adb3cd`; broken-pillar, stone-arch, rune-plinth |
| `desert-region` | `desert` | `#f5dfad`; cactus, sandstone-fin, fossil-ribs |
| `dojo-bug-maze` | `dojo` | `#cddcad`; training-post, training-post, timber-gate |
| `dojo-dark-maze` | `dojo` | `#acb4c5`; training-post, stone-arch, timber-gate |
| `dojo-dragon-maze` | `dojo` | `#b8cfd4`; training-post, carved-pillar, timber-gate |
| `dojo-electric-maze` | `dojo` | `#ebe1a2`; training-post, conducting-coil, timber-gate |
| `dojo-fighting-maze` | `dojo` | `#dfb491`; training-post, training-post, timber-gate |
| `dojo-fire-maze` | `dojo` | `#efc09a`; training-post, hanging-banner, timber-gate |
| `dojo-flying-maze` | `dojo` | `#d5e2de`; training-post, hanging-banner, timber-gate |
| `dojo-ghost-maze` | `dojo` | `#bfbacf`; training-post, hanging-banner, timber-gate |
| `dojo-grass-maze` | `dojo` | `#cadfb4`; training-post, training-post, timber-gate |
| `dojo-ground-maze` | `dojo` | `#e2c99c`; training-post, stone-arch, timber-gate |
| `dojo-ice-maze` | `dojo` | `#dae9f0`; training-post, carved-pillar, timber-gate |
| `dojo-normal-maze` | `dojo` | `#e9dec1`; training-post, training-post, timber-gate |
| `dojo-poison-maze` | `dojo` | `#c5b6db`; training-post, hanging-banner, timber-gate |
| `dojo-psychic-maze` | `dojo` | `#dec4e8`; training-post, carved-pillar, timber-gate |
| `dojo-rescue-team-maze` | `dojo` | `#ecd79e`; training-post, timber-gate, timber-gate |
| `dojo-rock-maze` | `dojo` | `#d1c5b3`; training-post, stone-arch, timber-gate |
| `dojo-steel-maze` | `dojo` | `#c6d2d3`; training-post, conducting-coil, timber-gate |
| `dojo-team-constrictor-maze` | `dojo` | `#d8c9e4`; training-post, hanging-banner, timber-gate |
| `dojo-team-hydro-maze` | `dojo` | `#badce6`; training-post, conducting-coil, timber-gate |
| `dojo-team-rumblerock-maze` | `dojo` | `#d9c2a5`; training-post, stone-arch, timber-gate |
| `dojo-team-shifty-maze` | `dojo` | `#c3d3ae`; training-post, training-post, timber-gate |
| `dojo-water-maze` | `dojo` | `#bbdbe5`; training-post, conducting-coil, timber-gate |
| `fantasy-strait` | `coast` | `#d5e4ed`; stone-arch, broadleaf-tree, reed-bed |
| `far-off-sea` | `coast` | `#abcbd8`; stone-arch, coral-fan, shell-cluster |
| `fiery-field` | `volcano` | `#edc5a0`; lava-vent, sandstone-fin |
| `frosty-forest-main` | `snow` | `#e1f2f4`; snow-pine, snow-drift |
| `frosty-grotto` | `snow` | `#e1f2f4`; snow-pine, snow-drift |
| `grand-sea` | `coast` | `#b5ded2`; coral-fan, shell-cluster, reed-bed |
| `great-canyon` | `desert` | `#f4d5a6`; sandstone-fin, broken-pillar |
| `howling-forest` | `forest` | `#b9d3bf`; pine-tree, root-arch, mushroom-ring |
| `joyous-tower` | `sky` | `#e8e4c8`; carved-pillar, hanging-banner, stone-arch |
| `lapis-cave` | `crystal` | `#b9d8ea`; crystal-cluster, stone-arch |
| `lightning-field` | `storm` | `#dde1b6`; conducting-coil, crystal-cluster |
| `magma-cavern-main` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `magma-cavern-pit` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `marvelous-sea` | `coast` | `#c6e3d9`; coral-fan, shell-cluster, waterfall-rock |
| `meteor-cave` | `crystal` | `#c8b8dc`; crystal-cluster, basalt-organ |
| `mt-blaze-main` | `volcano` | `#e6bc98`; obsidian-spire, sandstone-fin |
| `mt-blaze-peak` | `volcano` | `#e6bc98`; obsidian-spire, sandstone-fin |
| `mt-faraway` | `sky` | `#f2d5ac`; broken-pillar, rune-plinth, cloud-bank |
| `mt-freeze-main` | `snow` | `#eaf3fa`; ice-shard, stone-arch, snow-drift |
| `mt-freeze-peak` | `snow` | `#eaf3fa`; ice-shard, stone-arch, snow-drift |
| `mt-steel` | `cave` | `#e4d6ca`; basalt-organ, boulder-cluster |
| `mt-thunder-main` | `storm` | `#cedbed`; conducting-coil, basalt-organ, crystal-cluster |
| `mt-thunder-peak` | `storm` | `#cedbed`; conducting-coil, basalt-organ, crystal-cluster |
| `murky-cave` | `cave` | `#b8c5b9`; mossy-rock, stone-arch |
| `northern-range` | `cave` | `#d6dfc8`; boulder-cluster, stone-arch |
| `northwind-field` | `snow` | `#cfe9ef`; snow-drift, snow-pine |
| `oddity-cave` | `cave` | `#d4c4de`; crystal-cluster, mossy-rock, fossil-ribs |
| `pitfall-valley` | `forest` | `#b7cfad`; root-arch, broadleaf-tree, fallen-log |
| `purity-forest` | `forest` | `#e2edc5`; broadleaf-tree, flower-patch, root-arch |
| `remains-island` | `ruins` | `#d8dfbf`; broken-pillar, fern-cluster, root-arch |
| `rock-path` | `cave` | `#ddcbb7`; boulder-cluster, stalagmite-cluster |
| `silent-chasm` | `cave` | `#d7d0bb`; stone-arch, boulder-cluster |
| `silver-trench` | `coast` | `#c3ddea`; stone-arch, broken-pillar, coral-fan |
| `sinister-woods` | `forest` | `#b8c3bd`; root-arch, mushroom-ring, fallen-log |
| `sky-tower-main` | `sky` | `#f4ecd0`; carved-pillar, floating-island, stone-arch |
| `sky-tower-summit` | `sky` | `#f4ecd0`; carved-pillar, floating-island, stone-arch |
| `snow-path` | `snow` | `#d8eaf0`; snow-drift, ice-shard |
| `solar-cave` | `crystal` | `#e5ddb2`; carved-pillar, rune-plinth, crystal-cluster |
| `southern-cavern` | `cave` | `#ded1be`; stalagmite-cluster, basalt-organ |
| `stormy-sea` | `coast` | `#a6d3d8`; coral-fan, broken-pillar, waterfall-rock |
| `thunderwave-cave` | `cave` | `#d9e7ef`; crystal-cluster, stalagmite-cluster |
| `tiny-woods` | `forest` | `#fff1c8`; broadleaf-tree, fern-cluster, flower-patch |
| `unown-relic` | `ruins` | `#dbd1b3`; carved-pillar, rune-plinth, broken-pillar |
| `uproar-forest` | `forest` | `#e5e0ae`; broadleaf-tree, fallen-log, fern-cluster |
| `waterfall-pond` | `forest` | `#cbe7c2`; waterfall-rock, reed-bed, mossy-rock |
| `western-cave` | `cave` | `#c1cbd6`; stone-arch, basalt-organ, stalagmite-cluster |
| `wish-cave` | `crystal` | `#d6c8e8`; rune-plinth, crystal-cluster |
| `wyvern-hill` | `forest` | `#d3debc`; pine-tree, boulder-cluster |

## Other campaign scenes

| Canonical ID | Kit | Palette / prop variant |
| --- | --- | --- |
| `team-base` | `town` | `#f1ddbb`; cottage, notice-board, fence-section |
| `pokemon-square` | `town` | `#efe2c4`; cottage, pond-well, notice-board |
| `friend-areas` | `town` | `#dfe9c7`; timber-gate, notice-board, flower-patch |
| `makuhita-dojo` | `dojo` | `#e5cfaa`; timber-gate, training-post, hanging-banner |
| `whiscash-pond` | `coast` | `#d8e7ca`; mossy-rock, reed-bed, waterfall-rock |
| `luminous-cave` | `crystal` | `#dfecd6`; crystal-cluster, rune-plinth, stone-arch |
| `pelipper-post-office` | `town` | `#e9dbb6`; cottage, notice-board, timber-gate |
| `mt-thunder-main` | `storm` | `#cedbed`; conducting-coil, basalt-organ, crystal-cluster |
| `mt-thunder-peak` | `storm` | `#cedbed`; conducting-coil, basalt-organ, crystal-cluster |
| `mt-thunder-rest-stop` | `storm` | `#cedbed`; conducting-coil, basalt-organ, crystal-cluster |
| `mt-blaze-main` | `volcano` | `#e6bc98`; obsidian-spire, sandstone-fin |
| `mt-blaze-peak` | `volcano` | `#e6bc98`; obsidian-spire, sandstone-fin |
| `mt-blaze-rest-stop` | `volcano` | `#e6bc98`; obsidian-spire, sandstone-fin |
| `frosty-forest-main` | `snow` | `#e1f2f4`; snow-pine, snow-drift |
| `frosty-grotto` | `snow` | `#e1f2f4`; snow-pine, snow-drift |
| `frosty-forest-rest-stop` | `snow` | `#e1f2f4`; snow-pine, snow-drift |
| `mt-freeze-main` | `snow` | `#eaf3fa`; ice-shard, stone-arch, snow-drift |
| `mt-freeze-peak` | `snow` | `#eaf3fa`; ice-shard, stone-arch, snow-drift |
| `mt-freeze-rest-stop` | `snow` | `#eaf3fa`; ice-shard, stone-arch, snow-drift |
| `magma-cavern-main` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `magma-cavern-pit` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `magma-cavern-rest-stop` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `sky-tower-main` | `sky` | `#f4ecd0`; carved-pillar, floating-island, stone-arch |
| `sky-tower-summit` | `sky` | `#f4ecd0`; carved-pillar, floating-island, stone-arch |
| `sky-tower-rest-stop` | `sky` | `#f4ecd0`; carved-pillar, floating-island, stone-arch |
| `mt-blaze-junction` | `volcano` | `#ddcbb5`; sandstone-fin, basalt-organ |
| `frosty-forest-junction` | `snow` | `#e1eced`; snow-pine, snow-drift |
| `mt-freeze-junction` | `snow` | `#dceaf1`; ice-shard, stone-arch |
| `tiny-woods-caterpie-clearing` | `forest` | `#fff1c8`; broadleaf-tree, fern-cluster, flower-patch |
| `thunderwave-cave-magnemite-clearing` | `cave` | `#d9e7ef`; crystal-cluster, stalagmite-cluster |
| `silent-chasm-rescue-clearing` | `cave` | `#d7d0bb`; stone-arch, boulder-cluster |
| `hill-of-the-ancients` | `desert` | `#f4d5a6`; sandstone-fin, broken-pillar |
| `mt-freeze-ninetales-summit` | `snow` | `#eaf3fa`; ice-shard, stone-arch, snow-drift |
| `murky-cave-judgment` | `cave` | `#b8c5b9`; mossy-rock, stone-arch |
| `howling-forest-smeargle-rescue` | `forest` | `#b9d3bf`; pine-tree, root-arch, mushroom-ring |
| `pitfall-valley-latias-rescue` | `forest` | `#b7cfad`; root-arch, broadleaf-tree, fallen-log |
| `mt-steel-skarmory-floor` | `cave` | `#e4d6ca`; basalt-organ, boulder-cluster |
| `sinister-woods-team-meanies-floor` | `forest` | `#b8c3bd`; root-arch, mushroom-ring, fallen-log |
| `mt-thunder-peak-zapdos-floor` | `storm` | `#cedbed`; conducting-coil, basalt-organ, crystal-cluster |
| `mt-blaze-peak-moltres-floor` | `volcano` | `#e6bc98`; obsidian-spire, sandstone-fin |
| `frosty-grotto-articuno-floor` | `snow` | `#e1f2f4`; snow-pine, snow-drift |
| `uproar-forest-mankey-floor` | `forest` | `#e5e0ae`; broadleaf-tree, fallen-log, fern-cluster |
| `magma-cavern-pit-fallen-allies-floor` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `magma-cavern-pit-groudon-floor` | `volcano` | `#d1c4b9`; basalt-organ, lava-vent, obsidian-spire |
| `sky-tower-summit-rayquaza-floor` | `sky` | `#f4ecd0`; carved-pillar, floating-island, stone-arch |
| `stormy-sea-kyogre-floor` | `coast` | `#a6d3d8`; coral-fan, broken-pillar, waterfall-rock |
| `buried-relic-regirock-floor` | `ruins` | `#ded2b2`; stone-arch, carved-pillar, rune-plinth |
| `buried-relic-regice-floor` | `ruins` | `#ded2b2`; stone-arch, carved-pillar, rune-plinth |
| `buried-relic-registeel-floor` | `ruins` | `#ded2b2`; stone-arch, carved-pillar, rune-plinth |
| `northern-range-latios-floor` | `cave` | `#d6dfc8`; boulder-cluster, stone-arch |
| `silver-trench-lugia-floor` | `coast` | `#c3ddea`; stone-arch, broken-pillar, coral-fan |
| `meteor-cave-deoxys-floor` | `crystal` | `#c8b8dc`; crystal-cluster, basalt-organ |
| `fiery-field-entei-floor` | `volcano` | `#edc5a0`; lava-vent, sandstone-fin |
| `lightning-field-raikou-floor` | `storm` | `#dde1b6`; conducting-coil, crystal-cluster |
| `northwind-field-suicune-floor` | `snow` | `#cfe9ef`; snow-drift, snow-pine |
| `mt-faraway-ho-oh-floor` | `sky` | `#f2d5ac`; broken-pillar, rune-plinth, cloud-bank |
| `western-cave-mewtwo-floor` | `cave` | `#c1cbd6`; stone-arch, basalt-organ, stalagmite-cluster |
| `wish-cave-medicham-floor` | `crystal` | `#d6c8e8`; rune-plinth, crystal-cluster |
| `wish-cave-jirachi-floor` | `crystal` | `#d6c8e8`; rune-plinth, crystal-cluster |
| `purity-forest-celebi-floor` | `forest` | `#e2edc5`; broadleaf-tree, flower-patch, root-arch |
| `silver-trench-15-monster-house-floor` | `coast` | `#c3ddea`; stone-arch, broken-pillar, coral-fan |
| `silver-trench-35-monster-house-floor` | `coast` | `#c3ddea`; stone-arch, broken-pillar, coral-fan |
| `silver-trench-55-monster-house-floor` | `coast` | `#c3ddea`; stone-arch, broken-pillar, coral-fan |
| `silver-trench-75-monster-house-floor` | `coast` | `#c3ddea`; stone-arch, broken-pillar, coral-fan |
| `fantasy-strait-15-monster-house-floor` | `coast` | `#d5e4ed`; stone-arch, broadleaf-tree, reed-bed |
| `dojo-normal-maze-boss-floor` | `dojo` | `#e9dec1`; training-post, training-post, timber-gate |
| `dojo-fire-maze-boss-floor` | `dojo` | `#efc09a`; training-post, hanging-banner, timber-gate |
| `dojo-water-maze-boss-floor` | `dojo` | `#bbdbe5`; training-post, conducting-coil, timber-gate |
| `dojo-grass-maze-boss-floor` | `dojo` | `#cadfb4`; training-post, training-post, timber-gate |
| `dojo-electric-maze-boss-floor` | `dojo` | `#ebe1a2`; training-post, conducting-coil, timber-gate |
| `dojo-ice-maze-boss-floor` | `dojo` | `#dae9f0`; training-post, carved-pillar, timber-gate |
| `dojo-fighting-maze-boss-floor` | `dojo` | `#dfb491`; training-post, training-post, timber-gate |
| `dojo-ground-maze-boss-floor` | `dojo` | `#e2c99c`; training-post, stone-arch, timber-gate |
| `dojo-flying-maze-boss-floor` | `dojo` | `#d5e2de`; training-post, hanging-banner, timber-gate |
| `dojo-psychic-maze-boss-floor` | `dojo` | `#dec4e8`; training-post, carved-pillar, timber-gate |
| `dojo-poison-maze-boss-floor` | `dojo` | `#c5b6db`; training-post, hanging-banner, timber-gate |
| `dojo-bug-maze-boss-floor` | `dojo` | `#cddcad`; training-post, training-post, timber-gate |
| `dojo-rock-maze-boss-floor` | `dojo` | `#d1c5b3`; training-post, stone-arch, timber-gate |
| `dojo-ghost-maze-boss-floor` | `dojo` | `#bfbacf`; training-post, hanging-banner, timber-gate |
| `dojo-dragon-maze-boss-floor` | `dojo` | `#b8cfd4`; training-post, carved-pillar, timber-gate |
| `dojo-dark-maze-boss-floor` | `dojo` | `#acb4c5`; training-post, stone-arch, timber-gate |
| `dojo-steel-maze-boss-floor` | `dojo` | `#c6d2d3`; training-post, conducting-coil, timber-gate |
| `dojo-team-shifty-maze-boss-floor` | `dojo` | `#c3d3ae`; training-post, training-post, timber-gate |
| `dojo-team-constrictor-maze-boss-floor` | `dojo` | `#d8c9e4`; training-post, hanging-banner, timber-gate |
| `dojo-team-hydro-maze-boss-floor` | `dojo` | `#badce6`; training-post, conducting-coil, timber-gate |
| `dojo-team-rumblerock-maze-boss-floor` | `dojo` | `#d9c2a5`; training-post, stone-arch, timber-gate |
