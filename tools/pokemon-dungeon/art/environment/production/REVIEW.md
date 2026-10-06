# Environment art inspection — candidate kits

The author inspected the provided EthrA image: cute outlined directional pixels in a textured, dimensional landscape with warm/cool light and readable movement space. This wave is original code-native geometry and raster texture authoring. No reference pixels were sampled, no commercial art was extracted, and no image-generation API was called.

These are **12 art composition studies and reusable kit pieces**, not completed original-location scenes. Every one of the 283 canonical assignments remains `kit-assigned-scene-unbuilt`. Human art acceptance is separate from static checks and captures.

## Inspection evidence

`evidence/captures/capture-record.json` records 34 actual Three.js/SwiftShader frames, exact source hashes, screenshot hashes, resource errors and observed counters. There are 12 desktop and 12 portrait compositions, four elevated 45° orbit views and six named habitat palette/prop previews. Pikachu and Charmander are the existing incidental idle-page art at approximately 1.7/1.8 world units; neither is a playable actor. All kit captures were visually inspected at readable gameplay scale, including every 390px composition. Orbit shots were inspected for actual dimensional depth, grounding and billboard scale.

| Kit | Desktop + 390px observations | Scene work still needed |
| --- | --- | --- |
| Forest | Rounded layered canopy, rooted trunks, mossy ground, warm crown light and a clear foreground path; outlines stay readable against green | Authored forest rooms, rich undergrowth beyond the path, distinct meadow/forest layouts and local landmarks |
| Cave | Uneven rock clusters, tall stalagmites and cool grey strata frame a clear route; warm pixel characters separate from rock | Individual cavern topology, ceiling/back-wall structure and entrance staging |
| Volcano | Dark basalt columns and sharp obsidian silhouettes contrast with visible bright lava channels; warm pools do not hide feet | Lava lake/bridge layouts, active vent motion and encounter-specific platforms |
| Snow | Snow-capped pines, low drifts and blue ice shards have distinct profiles; dark sprite outlines survive the pale floor | Wind/weather, glacial room topology and frosty landmarks |
| Sky | Pale pillars, layered clouds and inverted suspended rock islands establish elevation in orbit | Real island boundaries/undersides, cloud depth and unique aerial route layouts |
| Coast | Teal water, sand, coral, shell clusters and waterfall stone distinguish the shore palette | Underwater volumes, shore curves, separate shallow/deep sea compositions |
| Ruins | Broken/full pillars, moss plants, plinths and irregular paving separate ancient masonry from caves | Bespoke relic rooms, doors, symbols and event staging |
| Crystal | Cyan crystals and local blue light stand apart from muted violet rock; characters remain warm and legible | Mineral chamber topology, more crystal arrangements and progression landmarks |
| Town | Rounded trees, teal-roof cottage pieces, notice board and pond/well create a warm forecourt; widened route remains clear at 390px | **Bespoke Pokémon Square, rescue-base and shop architecture**, named service entrances, residents and interactions |
| Dojo | Cedar boards, timber gates, banners and practice posts create a clear training lane | Distinct maze rooms, roof/interior architecture and challenge staging |
| Desert | Sandstone fins, cactus and fossil ribs give warm canyon silhouettes and a readable sandy path | Dunes, oasis/canyon variants and desert-specific destination scenes |
| Storm | Blue-grey columns and yellow mineral/machine accents retain contrast in cool haze | Storm/weather motion, charged terrain arrangement and power-plant buildings |

Named previews `power-plant`, `decrepit-lab`, `aged-chamber-an`, `mystic-lake`, `scorched-plains` and `safari` demonstrate explicit palette/prop references. They reuse their kit composition; they are not unique habitat maps or accepted habitat fidelity.

## Corrections made after actual image review

1. The first forest floor looked dry ochre and its canopies looked dark and slab-like. The ground palette was moved toward light moss green. After controller visual feedback, broadleaf spheres increased from seven to ten radial segments, gained a rounded crown cluster and warmer, lighter crown material. The path stayed open rather than receiving more obstructing props.
2. Bare diagonal land-plane edges looked like floating studio platforms in land biomes. The ground was extended behind/off camera and distant tree/rock layers added to produce a grounded horizon. Sky/coast remain deliberately bounded art studies, with full scene topology unfinished.
3. The volcanic ground initially hid lava outside the frame. Narrowing its authored land strip exposed bright lava channels beside the route and grounded the warm local lights.
4. Identical opposite-side positions were slightly staggered; background layers vary scale and yaw. These remain controlled composition studies, not generated or copied game maps.
5. The town fence lane was widened and reduced, revealing the forecourt and water landmark at 390px. Generic cottages remain kit pieces; no original-location architectural acceptance is claimed.
6. Caption text lost contrast on snow. A restrained translucent caption backing restored legibility without covering the character silhouettes.
7. The first low orbit camera crossed the perimeter trees and obscured the forest/town studies. Orbit inspection now lifts above the prop perimeter; reset restores the low gameplay-scale composition. This authoring camera is separate from the game camera.
8. Independent review found that primitive geometry disposal did not release each `InstancedMesh` instance buffer. Cleanup now calls `InstancedMesh.dispose()` before clearing the world, retaining the geometry/material/texture/shadow cleanup. Twelve kit/variant switches emit 136 mesh-dispose events, release 96 textures and return to 12 live instanced objects / eight resident images. Tools-only WebGL instrumentation observes 816 buffer creations and 736 deletions, returning to the original 80 live buffers after each complete cycle. Buffer totals include all geometry types, not only instance matrices; they are not byte measurements.

## Limits and acceptance

The imagery uses visible low-poly facets and original small textures. It is a coherent provisional foundation, not a claim to reproduce the reference's final polish or foliage richness. Repeated arches/stairs serve as reusable study landmarks; actual scene composition must replace those generic placements where appropriate. No wall-collision, legal-movement, campaign-state or runtime game behavior was exercised. Draw/triangle counters are observed scene complexity, not mobile frame-time measurements. Human review must judge complete authored locations and their integrated renderer separately.
