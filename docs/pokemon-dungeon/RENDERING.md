# Rendering, visual production, camera, and user-experience implementation appendix

Status: **planning only; implementation is paused for user review**. This appendix defines future work and acceptance gates. It does not authorize resuming product code. The review must resolve the art-production scope and minimum quality bar before a smaller implementation model is instructed to work.

This is an implementation plan for an original browser-based 3D reimagining of the original Red Rescue Team / Blue Rescue Team experience, integrated into the existing arcade. It is not an Unreal Engine project, a port of an existing game, or a promise of Unreal rendering features. The desired cinematic impression must come from strong composition, convincing silhouettes, original art, physically based materials, selective shadows, atmospheric effects, and coherent animation within a static WebGL2 application.

## 1. Visual outcome and scope decisions

### 1.1 Desired result

The player should see a recognizable Pokémon hero at close third-person distance, exploring readable three-dimensional dungeon spaces with a partner. The camera follows behind one shoulder, can orbit, and preserves useful tactical information. The world should look authored even when room layouts are generated: convincing ground surfaces, natural transitions, landmark props, a deliberate color script, and attractive lighting rather than a flat tile board surrounded by uniformly repeated cubes.

The Groudon encounter is the initial art-quality anchor. A small Pikachu and Charmander stand against a much larger red armored Groudon, surrounded by a volcanic cavern with an incandescent lava boundary, dark basalt, warm bounce-light impression, cool or neutral silhouette separation, layered haze, and restrained sparks. The models must be identifiable from their silhouettes and distinctive anatomy before nameplates or UI are considered. Characters need contact shadows and believable surface response. Visible movement, attacking, damage, and reactions must fit the character's body plan.

"Beautiful" is an art acceptance decision, not a feature flag. Counting lights, enabling bloom, or constructing thousands of objects does not prove it. The review compares actual rendered frames, neutral model turntables, and short gameplay captures against the concrete rubric below.

### 1.2 Distinguish three deliverable levels

| Level | What it includes | What it must not be called |
| --- | --- | --- |
| Procedural prototype | Shared primitive geometry, original approximate sculptures for selected species, archetype models for the rest, basic rig transforms, PBR materials, simple particles | Complete detailed character coverage, production animation, or an Unreal-quality remake |
| Polished browser vertical slice | Authored hero/partner/Groudon assets, strong volcanic arena, robust third-person camera, complete tactical battle feedback, desktop/mobile quality tiers, original sound and UI | A finished entire game or proof that 386 production assets already exist |
| Full accepted art production | Species-specific models for every included species and required visual form, consistent rigs/animation, complete dungeon/town art kits, audited asset provenance, performance adaptation, full UX | Exact recreation of the original artwork or scripts |

The recommended sequence is to approve the complete target and staged coverage policy, then establish the vertical slice before multiplying content. The entire game cannot be declared visually complete merely because every species ID maps to one of seven body archetypes.

### 1.3 Decisions to resolve in plan review

1. Confirm the style: stylized cinematic PBR with readable expressive faces, rather than photorealistic creatures or a low-poly novelty look.
2. Confirm that all 386 species need distinct final character assets, and agree how variants such as Unown letters and Deoxys forms are handled. A plan may include staged production, but the final completion wording must match the accepted coverage.
3. Confirm an asset-authoring route: original procedural modeling followed by manual refinement, commissioned or user-supplied original models with documented rights, or another expressly approved source. Do not silently fill gaps with ripped commercial assets.
4. Approve the proposed browser/mobile budgets as starting constraints subject to measurement, not guarantees.
5. Confirm whether the full map/move-preview overlay is an optional accessibility aid or always available. Default exploration must retain the requested third-person presentation.
6. Agree that the Groudon preview is actual gameplay, not a generated image, fake combat scene, or independently staged illustration.

## 2. Runtime capability gate: static browser, WebGL2, and recovery

Use locally vendored Three.js ES modules and local assets beneath `games/pokemon-dungeon-reimagined/`. Relative URLs are mandatory for the GitHub Pages project base path, arcade iframe, and local static preview. The rendering module has no network service dependency. Runtime decoders, loaders, environments, textures, models, and shaders must also be local if used.

The proposed baseline is `WebGLRenderer` with WebGL2. Three's official documentation states WebGL1 is unsupported from r163 onward; candidate version 0.186.1 is recorded in the research, but no engine is installed by this planning PR. A WebGL1 fallback cannot be assumed. At P04, select/pin the exact release and check version-compatible APIs. Do not migrate to WebGPU merely because current Three documentation offers it. [WebGLRenderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html).

### Capability and recovery decisions

| Condition | Required behavior | Ownership |
| --- | --- | --- |
| WebGL2 available | Create renderer once, choose conservative initial tier, start assets progressively | Rendering bootstrap / quality controller |
| WebGL2 unavailable or context creation fails | Accessible explanation and return-to-arcade option; keep saved data intact; do not leave a black canvas | Controller and UI |
| Small viewport or weaker GPU | Lower internal resolution, reduce post effects/shadows/particles/LOD, retain readable models and controls | Quality controller |
| Asset not yet loaded | Honest loading state and documented temporary model policy; avoid unresolved invisible enemies | Asset manager / controller |
| Asset fails to load | Surface error, allow retry; use accepted recognizable fallback if one exists and label reduced-detail mode | Asset manager / UI |
| Context lost | Pause presentation/input, preserve simulation/save state, show recovery state | Renderer / controller |
| Context restored | Recreate GPU resources from retained manifests and current simulation snapshot; resume safely | Renderer / asset manager |
| Browser tab hidden | Pause render loop and audio; do not make turn-based simulation advance due to elapsed wall time | Controller / audio |
| Iframe resized or fullscreen toggled | Resize canvas and render targets; preserve camera/input state | Renderer / UI |
| Dispose / leave game | Remove event listeners, release render targets, loaded resources and decoders with ownership checks | Controller / renderer / assets |

Do not claim browser availability or performance solely from a successful context constructor. Treat browser/GPU compatibility as a deployment risk that requires user-approved manual acceptance later. No game execution or tests are part of the current planning phase.

## 3. File boundaries and contracts

The architecture in [PLAN.md](PLAN.md), particularly sections 7–8, and canonical domain/state/event contracts in [SYSTEMS.md](SYSTEMS.md) govern this future design. No game implementation exists on the planning branch. This appendix proposes presentation-only interfaces; they must be frozen at P07/P10 against SYSTEMS before implementation. Keep rendering, art loading, presentation feedback, camera, input interpretation, and menus separate. The proposed plain ES-module approach is sufficient; do not introduce a bundler or another framework without a concrete reason and plan review.

### 3.1 Proposed exact file ownership

Runtime paths below are relative to `games/pokemon-dungeon-reimagined/`. Repository-root `docs/pokemon-dungeon/` paths are explicitly marked and remain outside runtime assets. All entries are future proposals, not existing product files.

| Path | Responsibility | Explicit boundary |
| --- | --- | --- |
| `src/rendering/renderer.js` | Scene lifecycle, terrain/actor/pickup coordination, public renderer API, render pass orchestration | Does not generate rules, mutate simulation, or create menus |
| `src/rendering/camera.js` | Follow/orbit, framing, obstruction handling, tile-to-view orientation, boss framing | Does not decide whose turn it is or which tile is legal |
| `src/rendering/quality.js` | Quality presets, DPR/resolution limits, hysteresis-based adaptation, resource budget reporting | Does not disable gameplay feedback to improve FPS |
| `src/rendering/assets.js` | Local manifest lookup, cached loading, animation templates, reference-counted resource ownership | Does not manufacture license claims or silently fetch a CDN |
| `src/rendering/models.js` | Original procedural fallback models, shared geometry/material pool, fallback rig metadata | Does not claim a generic archetype is a finished species asset |
| `src/rendering/scenery.js` | Instanced/merged terrain chunks, biome prop kits, stairs and scenery sockets | Does not derive legal movement from rendered geometry |
| `src/rendering/effects.js` | Bounded particles, impact rings, status overlays, projectile presentation, damage/recruitment/rescue effects | Does not determine damage, accuracy, or status duration |
| `src/rendering/animation.js` | Actor mixers, state-to-animation selection, movement interpolation, event sequences | Does not introduce animation-dependent combat outcomes |
| `src/input/index.js` | Keyboard, pointer, touch, controller bindings and camera-relative action intent | Does not bypass simulation validity checks |
| `src/ui/index.js` | Accessible panels, HUD, dialogs, focus, screen-reader announcements, settings | Does not duplicate simulation state or inject logic into renderer |
| `src/main.js` | Coordinates simulation, render updates, input, UI, audio, and lifecycle | Owns animation-loop timing; renderer has no independent loop |
| `assets/manifest.json` | Authoritative model/texture/animation/LOD entries and coverage status | References every runtime asset by relative path |
| `assets/characters/001/` ... `386/` | Per-species final model files or explicitly documented fallback record | Each included form uses a stable form key |
| `assets/environment/` | Original biome kits, materials, texture atlases and local environment maps | Shared resources are deduplicated |
| `assets/effects/` | Original effect textures and sprite atlases | Effects have low-detail alternatives |
| `assets/audio/` | Original or properly licensed audio if audio files supplement synthesis | Asset rights recorded alongside sources |
| `vendor/` | Pinned Three modules, approved addons/decoders, third-party notices | No runtime package downloads |
| `docs/pokemon-dungeon/ART-DIRECTION.md` (repository root) | Style bible, color scripts, scale, visual references and acceptance | Separates target from current coverage |
| `docs/pokemon-dungeon/ASSET-REGISTER.csv` (repository root) | Provenance, license, author, source, hashes, coverage and review status | Needed for all contributed/downloaded art |
| `docs/pokemon-dungeon/VISUAL-ACCEPTANCE.md` (repository root) | Review records, screenshots, device captures, limitations | Records actual rendered build/commit |

If the later team elects fewer modules, responsibilities still remain separate. Do not split modules so finely that ownership and data flow become harder to follow. Do not add any of these implementation files during the current paused phase.

### 3.2 Future proposed renderer API

Proposed `src/rendering/renderer.js` exports `DungeonRenderer`. Proposed constructor: `new DungeonRenderer(canvas, { onError?, reducedMotion? } = {})`. The composition root in `src/main.js` supplies the canvas and drives `update(dtSeconds)`. These names are a future interface proposal, not a preserved implementation. Settings and selection metadata are read-only presentation inputs; their exact contracts must be reconciled at P07/P10 with SYSTEMS and recorded before consumers are built.

| Method / field | Required semantics |
| --- | --- |
| `loadWorld(worldView)` | Consumes an immutable `WorldView`; builds static chunks/biome once per projected world identity; releases prior world-owned resources; retains shared art caches |
| `syncActors(actorViews)` | Consumes readonly `ActorView` records; diffs by `actorId`; adds/removes only changed roster; updates targets/HP/facing/status arrays; no entire-world rebuilding |
| `syncPickups(pickupViews)` | Consumes readonly visible pickup projections; diffs stable pickup IDs and visibility; keep reusable instances; no full prop recreation every turn |
| `setFollow(actorId)` | Works before or after actor creation; remembers ID and resolves it after sync; falls back predictably if actor disappears |
| `rotate(deltaRadians)` | Changes public yaw; clamp pitch inside camera implementation; does not move simulation actors |
| `zoom(delta)` | Adjusts clamped follow distance; maintains minimum tactical/occlusion framing |
| `flash(x, z, type = 'hit', color?)` | Creates presentation effect at tile location with bounded pool; never determines result of an action |
| `update(dtSeconds)` | Smooths transforms, updates animation/effects/camera, renders; clamps extreme dt; does not own requestAnimationFrame |
| `resize()` | Uses canvas display size; respects chosen internal resolution and target budgets; no width/height zero allocation |
| `dispose()` | Idempotently releases owned GPU resources/listeners and shared-library ownership |
| `cameraYaw` | Public radians; camera offset is `(sin(yaw), 0, cos(yaw))`; view-forward ground vector is `(-sin(yaw), -cos(yaw))` |

World scale is **2 world units per tile** as the proposed baseline. Small heroes should be approximately 0.9–1.3 units tall, with per-species scale metadata instead of arbitrary body-size doubling. Groudon's reviewed presentation may be approximately 5–6 units tall. Large display scale must not alter simulation occupancy without a rule-side footprint. Explicitly document distinction between tile footprint, collision for camera, art bounding box, and recruitment/body-size capacity.

The renderer consumes an immutable `RenderSnapshot` projected in `src/presentation/` from the canonical domain state defined in SYSTEMS; it never consumes the mutable simulation world or live actor arrays. Proposed view records are:

| View | Proposed presentation fields | Authority / invariant |
| --- | --- | --- |
| `WorldView` | Stable projected map identity/revision, width, height, projected `tiles[z][x]`, spawn/exit/room presentation hints, biome/name/floor/setpiece hints, **mandatory visible and explored masks** | Domain navigation/visibility owns truth; projection only exposes permitted visible information and explored-map information |
| `ActorView` | `{ actorId, speciesId, formId, dexNo, name, x, z, face, hp, maxHp, role, statuses }` | `actorId` identifies an instance; `speciesId` is stable, e.g. `pokemon-025`; `dexNo` is numeric 25; `statuses` is a readonly array of projected status descriptors, never one universal string |
| `PickupView` | Stable pickup ID, projected x/z, visible kind/quantity/icon hints | Hidden traps/loot are filtered by projection; art cannot reveal their existence |
| `RenderSnapshot` | `WorldView`, readonly actor/pickup views, ordered presentation events and approved settings/selection views | Canonical domain contracts remain in SYSTEMS; render state is derived and not saved as domain authority |

The proposed numeric tile codes 0 wall, 1 floor, 2 stairs, 3 water, 4 lava are **render-projection codes only**. Canonical terrain, occupancy, triggers, visibility, water/lava behavior and movement permissions may use richer independent layers in SYSTEMS. The renderer cannot infer action legality or rewrite domain terrain from these art codes. Projection is mandatory: hidden actors, pickups and traps must not be present in renderable views solely because a camera can see around a wall. `role` identifies presentation roles such as hero, partner, boss, enemy, rescue client or town NPC; affiliation and any additional role enum details must be frozen from the SYSTEMS projection contract at P07/P10. All record fields are readonly presentation data; the exact shared typedefs belong in `src/contracts.js`, not competing renderer-owned canonical definitions.

### 3.3 Future presentation metadata to freeze before implementation

The proposed basic methods require ordered presentation events and reviewed metadata for complete combat animation. These are future projections/extensions to freeze against SYSTEMS; they do not place rule decisions inside rendering. Required discovery protection is not an optional extension.

| Metadata | Producer | Consumer | Requirement |
| --- | --- | --- | --- |
| Stable projected world identity/revision and cosmetic seed | `src/presentation/` from domain map identity and separate cosmetic stream | Renderer/scenery | Distinguish new world from ordinary turn sync; deterministic art variation without gameplay RNG |
| `speciesId`, `formId`, `dexNo` | Projection from canonical species/form records | Asset manager | Stable manifest lookup; no integer-only species identity or name heuristics |
| `ActorView.role` and readonly `statuses` | Projection from deployed/guest/NPC roles and concurrent condition groups | Animation/camera/UI | Role-specific framing and accurate simultaneous status feedback |
| Ordered events with actor IDs, move ID, result and permitted affected tiles | Domain event projection | Animation/effects/audio/UI | Present misses, multi-target moves and statuses correctly; conceal hidden state |
| Landmark/prop socket hints | Domain generation to presentation projection | Scenery | Dungeon-specific art without scenery altering tile rules |
| **Visible and explored masks** | Domain navigation/visibility to presentation projection | Renderer/map UI | **Mandatory**; no hidden enemies/loot/traps revealed by third-person perspective, wall cutaway or effects |
| Settings view | Application settings projection | Camera/quality/UI/audio | Future approved read-only settings contract; not domain combat authority |
| Selection/preview view | UI command selection plus domain legal-action queries | Renderer/UI | Future approved descriptor; legal tiles/targets come from domain, never renderer guesses |

Do not quietly change canonical contracts to make rendering easier. Freeze exact presentation typedefs and event mappings before dependent tasks. If essential visibility data is unavailable, rendering implementation is blocked; it cannot release with a documented discovery leak. Shiny appearances and sex-specific visual variants are outside the default original-game scope; add them only through an explicit approved cosmetic adaptation, not an automatic metadata field.

## 4. Character production plan: 386 species, forms, rigs, and detail

### 4.1 Coverage register and completion language

Every National Dex ID 001–386 must have an explicit manifest record. A record must include name/ID, included form keys, source/provenance, asset path or fallback reference, author, license/rights notes, body-plan rig, scale/bounding box, LODs, material count, texture sizes, animation inventory, attachment sockets, and reviewed status. "Registered," "playable with fallback," "distinct authored model," and "final approved model" are separate statuses.

The roster data is authoritative for identities and rules. Rendering data is authoritative for presentation paths and animations. Do not infer colors, anatomy, or final dimensions from combat statistics. Do not include species added after #386 or modern redesign features merely because a current public asset source contains them.

A completed art milestone requires distinct identity for each species, not just distinct color. Shared skeletons, materials, topology foundations, and animation retargeting are desirable; shared silhouette with cosmetic color changes is insufficient for species that have materially different anatomy.

### 4.2 Forms and variants to account for explicitly

| Category | Planning requirement |
| --- | --- |
| Evolution lines | Separate species records; scale, topology and anatomy changes reviewed rather than copying the unevolved model at larger scale |
| Unown | Enumerate approved original-game letter/symbol forms in manifest; audit whether mechanics expose them; use clear form keys |
| Deoxys | Verify original version-specific and in-game appearance rules before selecting form; do not assume all later-game form-change systems |
| Castform | Explicit weather form assets/state mapping if weather rules are included |
| Spinda | Decide deterministic spot generation from saved seed versus a fixed representation; preserve appearance across reloads |
| Wurmple line / similar branches | Evolution outcome and visual identity remain simulation/data responsibilities |
| Nidoran pair | Separate species and visible identities; no name-only distinction |
| Shiny variants | Outside default original-game scope; require an explicitly approved cosmetic adaptation before any assets/state/UI are added |
| Sex-specific appearance | Outside default original-game scope; do not import modern sex-specific designs; an explicitly approved cosmetic adaptation is required |
| Idle-only town NPC versus recruitable character | Same species asset can be reused, but animation/function coverage must reflect both roles |

Document original-form coverage separately from the excluded modern/cosmetic variants. A 386-species count alone does not establish form coverage.

### 4.3 Production waves and their review gates

| Wave | Character scope | Exit requirement | Parent packages |
| --- | --- | --- | --- |
| W-A: art anchor | Pikachu, Charmander, Groudon; first rescue client if present in slice | Neutral turntables, approved material response, walk/attack/hit/defeat, actual volcanic battle composition | P03, P06; later combat integration P10/P13/P18 |
| W-B: starter selection | All researched original starters and selectable partners, with evolution lines planned | Selection portraits and 3D preview consistent with in-game assets; starter-specific silhouettes/animation | P19, P32 |
| W-C: main campaign | Main-story bosses, story NPCs, common encounter species and rescue clients | Distinct dungeon encounter silhouettes; dialogue framing; major setpiece animation | P23–P26, P32 |
| W-D: postgame landmarks | Legendary/recruitment bosses and species prominent in optional dungeons | Arena-specific visual treatment; large-scale framing; correct alternate forms as agreed | P27–P31, P32 |
| W-E: remaining roster | All remaining species through #386 | No unspecified fallback; coverage register reaches accepted final quality for every included species/form | P32–P33 |
| W-F: consistency pass | Entire roster | Comparable art quality, corrected scale/material/face mismatch, final LOD/animation/license audit | P32–P35 |

Task ordering does not reduce the final promised scope. If production stops at a wave, the release description must state that coverage honestly.

### 4.4 Original asset-authoring pipeline

1. Compile a per-species design brief from original-game identity and public reference facts. Use references to understand anatomy and recognition features, not to extract textures or rip a commercial mesh.
2. Produce a grayscale silhouette blockout at standard camera distances. Check recognition from front, side, back, and three-quarter views; large bosses also need a low-angle view.
3. Sculpt/model original geometry using a consistent style. For hero species, detail the face, ears, paws/claws, tail, distinctive markings, and joint transitions before decorative surface noise.
4. Retopologize with deformation in mind. Rig joints must bend predictably; avoid intersecting loose primitive pieces as the final animation system.
5. UV unwrap and author original albedo/normal/roughness/metalness/emissive textures or intentionally designed vertex-color material layouts. Use an original material library for shared horn/claw/fur/scale/shell appearance.
6. Rig to body-plan standards, add facial/feature controls where needed, and author animation clips. Shared rigs are a starting point; species-specific animation offsets and appendages still require review.
7. Export local glTF/GLB with supported PBR materials, named clips, stable attachment sockets, correct unit scale and forward direction. Validate hierarchy/skin/material compatibility through offline tooling and static inspection; do not introduce game-source tests.
8. Create LOD1/LOD2 silhouettes and texture variants. Keep eyes/markings readable at gameplay distance. Decimation must not destroy pointed ears, lightning tail, claws or boss armor seams.
9. Optionally compress meshes and textures only after evaluating load cost, quality and decoder size. Vendor required decoders locally. Three's official GLTFLoader integrates approved geometry/texture loaders; KTX2Loader supports transcoding Basis Universal textures for GPU formats. [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html).
10. Add manifest/provenance record, hashes, review captures, and acceptance status. Verify no asset path reaches an external CDN at runtime.

Procedural modeling is valid for original art, but the production route must include species-specific refinement. Automatically placing the same spheres/cones with different colors is a rapid prototype, not a substitute for that work.

Asset-file licensing and Pokémon character IP are separate questions. Recording a mesh creator's permission does not establish permission from the character rights holder. Do not label a Pokémon-derived model "fully licensed" solely because it was modeled from scratch. Public distribution/branding assumptions belong in the root project scope review; keep notices and source provenance accurate without inventing legal clearance.

### 4.5 Rigs, clips, and attachments

| Body plan | Core rig | Additional controls / concerns |
| --- | --- | --- |
| Biped | Root, pelvis, spine, head, two legs/feet, two arms/hands | Fingers/claws where visible; eye/mouth expression; avoid foot sliding |
| Quadruped | Root, pelvis/chest, neck/head, four legs, tail | Front/rear gait phase, shoulder flexibility, muzzle and ears |
| Bird / winged | Root/body, neck/head, legs, multi-joint wings, tail | Ground versus flight clips; feather/wing silhouette; large boss wings cannot hide targeting |
| Serpent | Root and distributed spine chain, head/jaw | Slither path, turn deformation, no straight rigid chain during movement |
| Fish / aquatic | Root/body, tail chain, fins, head/jaw | Hover/swim presentation outside water; readable ground occupancy and contact marker |
| Insect | Body segments, legs, wings/antennae as applicable | Many-legged gait, wings do not imply actual gameplay flight capability |
| Round / amorphous / ghost | Root, squash/stretch controls, eyes/features, optional limbs | Preserve identity during deformation; gentle floating without camera nausea |
| Mechanical / multi-body | Stable root, sub-body controls, effect sockets | Orbiting parts must not be mistaken for extra actors or legal tiles |

Required clip vocabulary: idle, walk/locomotion, turn-in-place where needed, attack-physical, attack-special, cast/status, hit-light, hit-heavy, faint/defeat, celebrate/recruit, rest/sleep, and optional unique boss introduction. For large monsters add roar and scripted setpiece actions only when supported by actual encounter events. Not every move needs a bespoke full-body clip; moves combine a compatible body animation, socket effect, projectile/area effect, camera response, and UI result.

Motion interpolation represents completed simulation steps. The grid and turn outcome remain deterministic even if rendering drops frames. Input during action animation follows the controller's reviewed queue policy. Never award extra actions because a clip finishes early.

## 5. Dungeon and town art kits

### 5.1 Generated room art must respect simulation

A tile grid is the rules surface, not the entire visible world. Generate art from deterministic sockets and spatial constraints: floor variants, wall sections, corners, entrances, stair markers, ceiling hints, perimeter silhouettes, and prop placement zones. Reserve travel lanes, tile-selection outlines, loot markers, and character clearance. Place tall scenery near boundaries and room backgrounds; lower or fade near-camera walls where necessary. Mandatory domain-derived visible/explored masks must filter hidden actors, pickups, traps and any revealing effects; scenery and cutaway must not leak their presence.

Use chunked instancing/merged static geometry. Reuse materials/atlas textures. Avoid one mesh per tiny grass blade, one shadow per rock, or rebuilding a generated level each turn. Chunk bounds should support culling and modest streamed resource loading. The same floor seed should produce stable art on reload. World transition releases world-only chunks and effects while retaining shared model assets.

### 5.2 Biome art direction matrix

| Theme | Ground/wall kit | Landmark props | Lighting/atmosphere | Tactical hazards / clarity |
| --- | --- | --- | --- | --- |
| Forest | Earth, moss, roots, stone edges, authored tree-trunk boundary sections | Fern groups, fallen logs, flowers, hollow roots, light shafts | Warm canopy highlights, cool green shade, sparse dust/fireflies | Vegetation must not conceal loot or tile boundaries; water visibly separate |
| Cave | Rough rock, rubble, mineral veins, damp floor variants | Stalagmite clusters, fractured arches, crystal accents | Low ambient fill, cool reflected light, selective warm crystals/torches if justified | Walls fade/cut away near camera; paths readable without excessive emissive neon |
| Electric / storm | Dark stone, scorched ground, conducting crystal motifs | Wind-torn pillars, small charge arcs, cloud vista | Blue-violet atmosphere, intermittent restrained lightning, bright boss silhouette | Lightning flash intensity adjustable; no full-screen strobe; danger previews distinct from decoration |
| Volcano | Basalt plates, black seams, cooling lava crust, jagged walls | Lava falls in backgrounds, obsidian spires, collapsed arches | Amber emissive impression, charcoal fog, restrained heat haze, sparks | Lava bright but clamped; safe floor high-contrast; telegraphs remain legible over glow |
| Ice / snow | Snow caps, blue ice slabs, frozen edges, crystalline walls | Icicles, snowbanks, frosted arches, distant glacier | Cool environment light, warm character/landmark separation, sparse snow | Water/ice rules must not be conflated; pale characters retain silhouettes |
| Sky | Pale/cloud-temple stone or researched tower identity, floating platforms | Broken columns, cloud layers, distant islands | Soft high-altitude light, controlled cloud motion, depth haze | Edges and legal tiles explicit; backdrop must not resemble walkable floor |
| Ocean | Wet stone, coral-like original props, sand, water boundaries | Sea plants, shells, underwater-window vistas where appropriate | Turquoise fill, patterned light impression, bubbles; avoid expensive full-volume effects | Aquatic presentation does not change movement rules; stairs clearly visible |
| Ruins | Worn blocks, carved geometric original motifs, dust, broken tiles | Door frames, seal plates, fragment columns, inert relic props | Directional shaft accents, neutral aged stone, faint dust | Doors/interactive objects visually distinct from decorative ruins; no copied game symbols |
| Desert | Sand/stone, dunes outside walkable region, warm rock walls | Dry grasses, eroded pillars, fossil-like original shapes | Warm sun, cool shadows, sparse drifting sand | Sand effects do not hide enemies; no hallucinated movement penalty from visual terrain |
| Town / hub | Shared warm paving, grass, fences, natural building shapes | Rescue-team home, square fountain/landmark, service entrances, mailbox/notice board | Welcoming morning/day palette; readable service iconography | NPCs/services match actual available functions; no invisible interaction areas |

Water and lava need shared surface systems with theme-specific material/settings. Both must support cheap low-tier surfaces. Reflections may be an environment-map impression; real-time planar reflection is optional and budget-gated, not required to sell the scene.

### 5.3 Major setpiece presentation inventory

The root campaign research remains authoritative for dungeon names, boss floors, route availability and version differences. This is the art inventory, not an assertion that every proposed environment is already implemented.

| Campaign/setpiece | Required authored identity | Character/camera requirement |
| --- | --- | --- |
| First rescue / Tiny Woods presentation | Small approachable woodland clearing; obvious rescue target and exit | Low-pressure readable hero/partner framing; brief rescue celebration |
| Early caves and mountain rescues | Distinct tunnel/mineral and outdoor ascent kits rather than color-only variants | Rescue-client focus without losing turn context |
| Great Canyon / Xatu scene | Cliff and sky depth, important perch/landmark, deliberate horizon | Conversation camera that respects hero/partner identity and exits safely to gameplay |
| Mt. Thunder / Zapdos | Storm-charged rocky summit, layered cloud background, electricity accents | Large wing silhouette, safe lightning setting, clear boss tile |
| Mt. Blaze / Moltres | Heated rock/summit identity distinct from enclosed Magma Cavern | Fire/wing lighting restrained enough for readable eyes and target telegraphs |
| Frosty Forest / Articuno | Frozen forest clearing, authored icy focal shape, snowfall | White/blue boss separated from background; wing animation within frame |
| Mt. Freeze / Ninetales | Cold mountain sanctum, quiet atmosphere contrasting prior combat | Story framing supports dialogue; no camera assumption that every setpiece is a boss fight |
| Magma Cavern / Groudon | High-quality basalt arena, lava boundary, cavern depth, scale reference props | Hero foreground-left, boss midground-right/center, claws/armor/eyes readable |
| Sky Tower / Rayquaza | High-altitude ancient tower/platform identity, clouds below, visible vertical scale | Serpentine boss fully readable; camera accounts for tall/long shape and recoil |
| Stormy Sea / Kyogre | Deep-water/ancient chamber or approved aquatic interpretation | Broad fins framed; clear ground/tile marker for aquatic actors |
| Buried Relic / Regi encounters and Mew | Distinct relic chambers, restrained original seal motifs | Different elemental boss material identities; hidden content presentation respects mechanics |
| Three Fields and Mt. Faraway route | Fiery/lightning/northern field differentiation plus summit landmark | Entei/Raikou/Suicune/Ho-Oh recognition and varied encounter framing |
| Silver Trench / Lugia | Monumental ocean depth, pale stone and cool haze | Large wings/body remain visible without occupying entire HUD |
| Western Cave / Mewtwo | Deliberate remote cavern focal chamber | Humanoid boss gestures and special-move socket effects |
| Wish Cave / Jirachi | Quiet wish/relic chamber, minimal original star-like motifs | Tiny legendary given clear focus without arbitrary giant scaling |
| Meteor Cave / Deoxys | Extraterrestrial-looking original geological forms, form-aware silhouette | Research-led Deoxys form presentation and illusions/encounters if included |
| Other optional, challenge, long and level-reset dungeons | Reusable biome kits with unique entrance/landmark and palette | Do not equate reused art kit with omitted gameplay/content; arrival UI states special rules |
| Friend Areas / recruited roster spaces | Authored, explorable habitats for every original Friend Area | Preserve original resident interaction, roster selection, terrain identity and unlock ownership; a menu-only substitute requires an explicit user-approved scope change |

The future full route manifest should attach an `artKit` and optional `setpiece` to every dungeon. A missing art-kit assignment is a content gap, even if procedural generation can still produce a grey room.

### 5.4 Town services and interaction clarity

The square/home/service design must follow the root's verified original service inventory. Give each actual service a consistent silhouette, sign/icon, NPC anchor, interaction prompt and panel. The UI should distinguish storage, bank/money, item shop, move/linking services, rescue/job selection, team management/recruitment, evolution access, training, and any postgame-gated services included by the accepted rules. Disabled/gated services explain the actual prerequisite using available game state. Do not present nonfunctional building facades as working services.

Town interactions should work via keyboard, touch and focused action controls. Interaction range comes from simulation, not raycasting whichever decorative mesh the player clicks. Dialogue boxes name speakers, support skip/advance, wrap cleanly, and never trap focus in an inaccessible 3D-only hotspot.

## 6. Third-person tactical camera and movement readability

### 6.1 Base camera

Default perspective, not top-down. Start from a shoulder-follow design with about 50–60° vertical FOV, follow distance roughly 5.5–8.5 units for ordinary heroes, and enough elevation to see the next few tiles while keeping the hero's full silhouette. These are tuning starting points, not final constants. Camera follows a smoothed visual actor target; simulation positions remain on tiles. Add a modest right-shoulder offset so the hero does not obstruct the forward path.

Yaw convention: offset x = sin(yaw), z = cos(yaw). Ground-forward action vector = (-sin(yaw), -cos(yaw)); ground-right = (cos(yaw), -sin(yaw)). The input adapter snaps intent to the permitted grid directions and communicates it to simulation. It must handle yaw wrapping and boundaries consistently. Camera-relative controls and fixed-grid controls should be selectable if the review approves both.

Mouse drag / touch drag or orbit buttons rotate yaw. Wheel / pinch or zoom buttons adjust distance within clamps. Camera yaw changes alone never consume a turn. Zoom should not move through floor/walls or expose unexplored hidden actors. A recenter action restores the default view without moving the hero.

### 6.2 Obstruction and cutaway

Raycast or sample against a simplified camera obstruction mesh, not every blade of grass or particle. Use a collision radius/near-plane clearance, move the camera closer gradually, and restore distance smoothly. If a tall wall still obscures hero/path, fade or lower only the relevant wall group while keeping its tile border visible. Scenery art collision must not block legal actor movement.

Do not use aggressive camera snaps on corridor turns. Partner/enemy motion should not cause target switching. Keep boss introductions short and return to a stable user-controlled gameplay view. Reduced motion disables shakes, strong easing overshoot, repetitive idle camera drift and aggressive zoom transitions.

### 6.3 Boss framing

Create a framing policy using actor bounding boxes and combat relevance. For Groudon, keep the hero/partner and upper body/face within frame. Extend distance/elevation and bias the look-at target ahead of the hero, but preserve third-person scale and tactical tile reading. Long serpents, wide wings, tiny legendaries and tall humanoids need different framing hints. Boss camera must not assume every boss has Groudon's proportions.

The camera's default volcanic encounter frame should place Pikachu near the lower-left foreground with recognizable ears/cheeks/tail, Charmander within the allied group, and Groudon in the midground with clear face/armor/claws. UI may occupy top corners and a restrained bottom control band; it must not cover Groudon's head or the hero's destination tile.

### 6.4 Tactical overlays

| Aid | Purpose | Visual rule |
| --- | --- | --- |
| Subtle actor contact/side marker | Ground occupancy and team affiliation | Color plus shape; ally/enemy distinguishable without red/green alone |
| Selected target outline / ring | Clear intended target | One selected target emphasized; does not look like an effect on all enemies |
| Legal move/attack tile preview | Explain range and action intent | Derived from simulation-provided legal tiles; high-contrast edge and optional pattern |
| Floor/exit marker | Find stairs and progress | Original model plus readable icon; does not rely on particles alone |
| Visibility/exploration mask | Preserve discovery rules | Do not render hidden enemies or loot merely because camera can see beyond a wall |
| Minimap / tactical map | Navigation and accessibility | Toggleable overlay; marks discovered tiles and known allies/enemies/stairs, with legend |
| Facing indicator | Explain directional melee/ranged actions | Appears on demand/selection rather than permanently obscuring model |

Tactical preview does not need to expose the entire world. Main default view remains third-person even if the user can temporarily open an overhead map. When the camera obstructs a critical destination, the system should offer a readable aid rather than force the player to guess.

## 7. Lighting, materials, atmosphere, and postprocessing

### 7.1 Lighting/material standards

Use consistent linear-light calculations and correct display color-space configuration for the pinned Three version. Use tone mapping and deliberate exposure. Author albedo without baked fake highlights where PBR would duplicate them. Use physically plausible roughness/metalness: claws/stone/fur/scales are generally nonmetallic; shell and armor can have different roughness without turning every Pokémon into chrome.

One principal shadowed directional/spotlight with bounded coverage is the proposed baseline. Combine inexpensive environment/hemisphere fill and a small number of selective unshadowed accent lights. Lava emissive texture alone does not actually light nearby geometry in a conventional forward renderer; reproduce the impression with selective warm lights, baked vertex/color cues, and environment fill. Do not promise global illumination or physically traced lava bounce.

Characters need silhouette rim/fill appropriate to the biome and shadow contacts that prevent floating. Fine surface normals should be subtle. On Groudon, shape and armor separation matter more than a noisy skin texture: red layered plates, dark seams, pale spikes and claws, heavy snout/jaw, muscular legs, tapering armored tail and luminous focused eyes. Pikachu needs actual black-tipped ears, cheek disks, back stripes and angular lightning tail; visual identity cannot depend on a text label.

### 7.2 Effects tiers

| Feature | Desktop target | Mobile / low-tier fallback |
| --- | --- | --- |
| Shadows | One bounded soft filtered map; characters and selected major scenery cast | Smaller single map or blob/contact markers; scenery receives where feasible |
| Bloom | Restrained selective-looking emissive contribution; no glowing whole scene | Half/quarter-resolution restrained pass or disable with emissive readability retained |
| Ambient occlusion | Optional budget-gated small-radius pass | Omit; authored contact/shadow cues remain |
| Antialiasing | Choose compatible economical strategy for pinned pipeline | Lower-cost AA or native context AA if compatible; no mandatory supersampling |
| Fog | Cheap depth/distance fog matching biome palette | Same or simpler fog; no true volumetric simulation |
| Heat distortion | Small bounded volcanic areas; very low amplitude | Off; animated lava surface and embers retain identity |
| Water | UV motion/normal highlights/environment impression | Flat animated low-detail material; no per-frame planar reflection |
| Particles | Bounded pooled embers/snow/dust with reusable buffers | Lower count and simpler opacity; no game-important information removed |
| Camera shake | Small impact impulse, not constant | Optional/off; reduced-motion disables |
| Depth of field | Optional for dialogue/title captures only | Off; combat default stays sharp for tactical readability |
| Motion blur | Not required; generally off for turn-based combat | Off |

Post effects add cost, and bloom cannot fix poor modeling or lighting. Transparency must be bounded to avoid overdraw, especially for stacked fog sprites, lava glare, wings, and particle clouds.

### 7.3 Effect vocabulary and pools

Provide original effect families for physical slash/impact, electric arcs, flame bursts, water splashes, leaf/nature arcs, ice shards, rock dust, psychic/ghost pulses, healing, buff/protect, sleep/poison/burn/paralysis/freeze/confusion, recruitment, rescue and pickup. Reuse atlases/materials and bounded particle pools. Area moves identify affected tiles clearly. Hit feedback includes the correct target, result, text and limited reaction; a miss cannot show a damaging impact on the target. Status visuals use icon/pattern and log/UI wording as well as color.

Effects should not block camera visibility or trigger turn outcomes. Screen overlays must avoid intense flashing and support reduced motion. Camera shake is not necessary for every basic action. Projectiles complete visually within a controller-coordinated action sequence while game state remains authoritative.

## 8. Performance budgets and resource lifecycle

The encoded-transfer, total-game and per-file limits below are aligned with [PLAN.md section 8](PLAN.md#8-content-and-asset-production-contracts). Detailed GPU/draw-call/triangle targets remain **proposed planning budgets**, to be refined from real device measurements after approval. None are measured performance claims. MiB/KiB use binary units; estimated GPU residency is separate from encoded transfer/file sizes. The browser renders the portfolio shell and iframe as well as the game, so the game cannot consume the device's entire resource budget.

| Metric | Standard desktop target | Mobile / low tier target | Gate interpretation |
| --- | --- | --- | --- |
| Presentation rate | Aim 60 FPS, 16.7 ms frame envelope | Aim stable 30 FPS, 33.3 ms envelope | Sustained capture, not one idle frame |
| Internal resolution | Cap DPR near 1.5; optional 2 on proven hardware | DPR near 1 with adjustable render scale 0.7–1 | Preserve legible DOM UI at device resolution |
| Main visible triangles | Start below ~250k–350k | Start below ~70k–120k | Includes characters, environment and major transparent geometry |
| Typical visible draw calls | Start below ~120–160 including effects | Start below ~55–85 | Check shadow/post passes separately, not only main scene |
| Boss LOD0 mesh | ~20k–40k triangles if justified | ~6k–12k | Silhouette and deformation more important than small detail |
| Hero LOD0 mesh | ~5k–12k triangles | ~2k–5k | Shared rig and material layout; no loss of identity |
| Ordinary nearby enemy | ~3k–8k | ~1k–3k | Fewer materials and effects than boss/hero |
| Texture edge sizes | Usually 512–1024; 2048 only reviewed hero/boss surfaces | Usually 256–512, selected 1024 boss | Track decoded/compressed GPU size, not download bytes alone |
| Shadow map | One 1024–2048 map | One 512–1024 or approved contact fallback | Tight frustum to prevent waste/shimmer |
| Active particles | ~150–400 across all pools | ~40–100 | Count and translucent screen coverage bounded |
| Resident asset working set | Starting goal ~128–192 MB accounted resources | Starting goal ~48–96 MB accounted resources | Approximate accounting, not browser VRAM query |
| First interactive scene encoded transfer | **At most 8 MiB**, including engine + party + first kit | Same 8 MiB limit with progressive entry | PLAN section 8 governs; roster/world assets demand loaded |
| Active scene encoded assets | **At most 24 MiB** | Same limit; prefer low-LOD assets/textures | Includes all resources resident for that scene; transfer bytes differ from GPU residency |
| Entire published game | **At most 300 MiB** | Shared distribution budget | Review total runtime inventory; do not load it all at entry |
| Each added runtime file | **At most 1,024 KiB** | Same repository limit | Partition/compress assets and decoders; do not bypass pre-push policy |

Do not blindly optimize to triangle counts while draw calls, shadows, texture memory, shader compilation, or transparent fill dominate. Profile render passes and CPU allocations. Use instancing for repeated scenery and pickups where practical, merge compatible static meshes, reuse typed arrays/vectors, and avoid garbage allocation on every animation frame. Load only required party/NPC/encounter assets plus a small lookahead set. A bounded LRU/reference-counted cache must never dispose geometry still used by an active actor.

MDN recommends careful batching, texture/mipmap management, avoiding synchronous GPU stalls, and explicit resource release; its guidance also explains that portable total GPU-memory queries are unavailable. Thus memory figures here are asset accounting targets, not reported device capacity. [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

Adaptive quality should use rolling frame-time trends with hysteresis, not oscillate every frame. Lower expensive cosmetic features first, then internal resolution/LOD as necessary. Offer user quality choice and remember it. Do not use user-agent strings as the sole capability test or repeatedly force a user override back to automatic. Debug instrumentation can expose render counts and estimated residency during authorized manual acceptance without adding game-source tests.

## 9. Input, accessibility, and complete menu presentation

### 9.1 Inputs and command routing

| Input | Required mapping | Notes |
| --- | --- | --- |
| Keyboard movement | WASD / arrows, with reviewed diagonal modifier/bindings if supported | Ignore typing focus; prevent page scroll only while game owns relevant keys |
| Attack / interact / wait | Separate clearly labeled bindings | Communicate turn-consuming action; interactions differ from attacks |
| Move slots | Number keys and on-screen buttons | Show PP, disabled reason, range and selected target |
| Camera | Drag/orbit keys/buttons; zoom; recenter | No turn cost; no conflicting long-press item action |
| Touch | Direction pad or thumbstick plus explicit action buttons | Targets at least 44 CSS px; safe-area margins; avoid tiny inventory rows |
| Mouse/pointer | Optional selecting actor/tile plus explicit commit | Decorative mesh clicks do not change game rules |
| Controller if accepted | D-pad/stick movement, action, menu, camera, focus navigation | Optional implementation milestone; do not claim support without acceptance |
| Escape / back | Close panel first, then game menu with clear return path | Preserve arcade iframe focus restoration |

Use a stable command adapter. Input intent routes through controller to simulation; renderer never directly consumes keyboard to mutate actors. Multi-touch camera gestures must not accidentally dispatch movement. Provide a touch-friendly alternative to hover tooltips. Rebinding and camera-direction mode should be considered in the accepted settings scope rather than silently postponed.

### 9.2 Accessibility standards

Keep HUD/menus/dialogue as accessible DOM over canvas. Provide names, focus indicators, consistent tab order, keyboard navigation, Escape dismissal, focus return, semantic buttons, and disabled reasons. Avoid a canvas-only inventory or dialogue implementation. Announce concise turn results and critical warnings; do not flood screen readers with every animation frame. The battle log is reviewable, and detailed status/move descriptions are available on demand.

Include settings for reduced motion, camera shake, flash intensity, sound/music levels, text size, color-independent markers and graphics quality. Ensure HP, hunger, PP, target identity, status and warnings remain understandable without color alone. Combat destination and exit indicators need sufficient contrast over bright snow/lava. Respect `prefers-reduced-motion` on initial setup, with user override. Do not equate reduced motion with disabled gameplay feedback.

A turn-based pace is useful but does not by itself make a 3D game fully accessible. If screen-reader-complete dungeon play is outside an explicitly reviewed accessibility scope, say so; still make setup, menus, logs, save import/export and return-to-arcade accessible. Do not claim conformance from checklist wording alone.

### 9.3 HUD layout

Desktop: restrained party/HP/status panel in one top corner, floor/objective and boss health in the other/top center, collapsible event log, bottom action bar, compact map toggle and pause/settings. Leave central world and boss silhouette clear. Mobile: compact top status row, touch movement/actions at lower edges, collapsible log/map, large single-column panels. Respect iframe size, portrait orientation, safe-area insets and keyboard focus.

Display the current hero/partner names, levels, HP and statuses; hunger/PP/resources where appropriate; dungeon and floor; active objective; action/move targeting state; and readable consequences. Do not imply a real-time cooldown when combat is turn-based. Save/loading/error states need clear persistent feedback.

### 9.4 Screen/panel inventory tied to actual progression

| Screen / panel | Required content and actions | Rendering relationship |
| --- | --- | --- |
| Start / continue | New adventure, continue, settings, clear scope/reimagining notice, save/import access | Optional honest title diorama; not used as gameplay preview |
| Personality quiz | One question at a time, answer buttons, progress, accessible back policy | Original wording; no forced rapid interaction |
| Starter/partner selection | Species/name, types, available choice, preview and confirm | Use same approved model as gameplay; no misleading render-only species |
| Naming/team setup | Hero/team names, validation, review summary | Does not force login or network account |
| Town/home | Current chapter/objective, services, jobs, party, storage, departure | 3D hub supports accessible panel route to actual services |
| Dungeon selection | Name, progress/unlock reason, researched floor total, special rules, entry confirmation | Thumbnail or small local landmark preview; no fabricated completion claim |
| Party/team management | Recruited roster, member details, formation/eligibility and limits | Character preview optional and lazy loaded |
| Inventory | Category/count, item description, legal actions and target | UI owns selection; simulation validates use |
| Moves | Current moves, PP, range/type/category, selected slot and applicable linking features | Legal tiles/targets highlighted from data |
| Status / tactics | Current stats/status, partner behavior options actually implemented | No menu option without rule-side behavior |
| Rescue jobs | Acceptable jobs, objectives, destination, reward, completion/claim state | Quest markers represent actual active jobs |
| Shop/bank/storage/services | Funds/items, transfer controls, price and result feedback | Modelled service NPC does not replace usable DOM controls |
| Chapter dialogue | Speaker, original text, next/skip policy and transition | Camera is presentation only; story gating remains simulation/controller |
| Floor transition | Next floor, destination, progress and short loading status | Camera fades only when appropriate; not per turn |
| Defeat/revival | Explain current outcome, recovery choices supported by rules | No unearned permanent death or automatic reset |
| Dungeon completion | Rewards, rescues, recruits, story advancement and town return | Celebration clip optional, result real |
| Postgame routes | Explicit unlock dependencies, new goals, special rules | Maintain content completeness labels |
| Evolution/recruitment | Eligibility, requirements, choice/result and revised roster | Asset changes via accepted manifest; no generic scale-up substitution |
| Settings | Input, camera, accessibility, graphics, audio, save tools | Persist preferences independently from world rendering |
| Save import/export/reset | Clear file/data format handling, validation errors, destructive reset confirmation | UI/action boundary; renderer untouched until accepted state applies |
| Pause / return to arcade | Resume, settings, save status, leave action | Release renderer lifecycle and restore website focus |

All panels must have actual simulation/controller support before being marked implemented. Do not build a large attractive menu shell filled with nonfunctional actions.

## 10. Groudon screenshot and gameplay acceptance

The arcade card uses a captured frame of the actual game running the real Groudon practice encounter or reached campaign encounter. A title diorama, disconnected renderer showcase, generated image, composited fake HUD or scripted attack with no simulation outcome does not satisfy "actual gameplay screenshot." A practice entry is acceptable only if clearly named and backed by the same gameplay simulation and renderer.

### 10.1 Capture setup after implementation approval

1. Use the real static exported entry point beneath the site's configured base path and actual arcade iframe path.
2. Start a reached campaign encounter or the explicitly approved isolated Groudon practice encounter through supported UI or a documented developer route; D06 governs practice availability and campaign-save isolation. Use Pikachu hero and Charmander partner if this remains the reviewed composition.
3. Confirm real dungeon/floor state, enemy HP, legal movement/combat, and game-generated feedback. The screenshot must not imply a later stage or unimplemented encounter.
4. Use the default reviewed graphics tier for the target 1440×900 capture; state any altered resolution/quality or reduced-motion settings in review notes.
5. Frame Pikachu foreground-left and Groudon midground-right/center with visible face, armor seams, spikes/claws and tail shape; Charmander remains identifiable.
6. Capture an ordinary playable moment with real HUD, avoiding open debug panels, hidden errors, loading overlays and camera clipping. A short actual gameplay clip can corroborate that the image is not a static title scene.
7. Save the original capture and final card crop. Cropping/resizing is acceptable; do not paint in effects, edit characters or fabricate game UI.
8. At P36, after P35 full release acceptance and explicit permission to expose the game, wire the real capture into only the first arcade card, preserving the other two placeholders and existing site conventions. A P06 visual-proof capture never changes the public card.

### 10.2 Visual review rubric

| Area | Accept | Reject / revise |
| --- | --- | --- |
| Groudon recognition | Large red armored dinosaur, dark plate seams, pale claws/spikes, expressive focused eyes, recognizable heavy head and tail | Red generic lizard with a label; floating unrelated spheres; unreadable eyes or missing signature features |
| Hero recognition | Yellow body, black ear tips, red cheeks, back stripes and angular tail, useful face/silhouette | Yellow blob, missing tail, obscured by HUD or camera |
| Third-person framing | Hero visible at shoulder-follow scale, arena ahead, boss silhouette fits, user can orbit | Default overhead map, boss head cut off, camera inside wall, hero completely occludes target |
| Atmosphere | Layered cavern depth, controlled lava glow and warm/cool separation, grounded shadows | Flat single-color tiles, uniformly glowing scene, black unreadable characters |
| Tactical readability | Floor occupancy, hazards, target and actual action outcomes understandable | Safe/lava ambiguous, particles hide enemies, UI communicates false targeting |
| Materials | Coherent stylized PBR, distinct basalt/armor/claw/skin responses | Chrome Pokémon, noisy procedural textures masking poor geometry |
| Performance | Stable presentation on agreed target tiers; no obvious repeated stalls/asset popping during capture | Single pretty still while ordinary play stalls, unresolved missing models |
| Authenticity | Actual practice/campaign state, real combat/log/HP, same modules as game | Generated poster, title-only scene, fabricated UI, disconnected cinematic mockup |
| Website integration | Correct card image/path/base path, actual Play/Back flow, other cards preserved | Replaces all placeholders, external hosting dependency, iframe focus regression |

Visual acceptance requires explicit human review. Static syntax success cannot establish that a model is recognizable or a game is attractive.

## 11. Execution work packages for the future implementation model

Do not start these until the user approves the consolidated plan and prerequisite repository setup. Each package must leave a reviewable artifact and identify unresolved gaps. Do not skip ahead to roster multiplication before the art anchor passes.

### Rendering-task crosswalk to the governing work packages

The R tasks below are subtask detail, not a second execution schedule. PLAN's P dependencies, approval decisions, milestones and release gates remain authoritative. W-A–W-F are character-production waves mapped in section 4.3. A work package can draw on several R tasks without bypassing its prerequisites.

| Rendering subtask | Parent P package(s) | Ordering / scope note |
| --- | --- | --- |
| R0 inventory/pin | P01–P04 | Pin dependencies at P04 after source/provenance review; historical drafts are not authority |
| R1 style bible | P03, P06 | Establish/review art direction before mass asset production |
| R2 manifest | P02–P03, P32 | Coverage register begins early; final coverage waits for actual approved assets |
| R3 lifecycle | P05, P10 | Recoverable app shell first; full scene resources at renderer package |
| R4 camera/tiles | P09–P11 | Domain visibility must be projected; input does not mutate domain from camera code |
| R5 volcanic kit | P06, P10, P25, P32 | P06 visual proof first; actual Magma Cavern integrates at P25 |
| R6 hero/partner/Groudon | P03, P06, P32 | W-A anchor assets; no claim of whole-roster completion |
| R7 real battle presentation | P10, P13–P18, P25 | Requires actual combat/event contracts; P06 art proof alone is not gameplay |
| R8 accessible core UX | P05, P09, P18–P19 | Setup/HUD/controls align to real domain commands and onboarding |
| R9 encounter review | P06 art gate plus P18/P25 manual slice review | Internal evidence; no public arcade change and no campaign-completion claim |
| R10 main-story waves | P19, P23–P26, P32 | W-B/W-C art follows campaign inventory and accepted direction |
| R11 services/progression UX | P18, P20–P22, P27–P31 | Actual town/job/postgame/evolution services determine panel functionality |
| R12 postgame/remaining roster | P27–P33 | W-D/W-E and completed per-route art assignments |
| R13 performance/accessibility | P34–P35 | Detail budgets reconciled to PLAN section 8; representative physical-device acceptance |
| R14 final capture/integration | P35–P36 | Full release candidate accepted first; explicit exposure permission before public card |
| R15 final audit/delivery | P33, P35, P37 | Static/content/rights audit plus root-owned website checks and release authorization |

| Task | Concrete work | Dependency | Checkpoint / acceptance evidence |
| --- | --- | --- | --- |
| R0: inventory and pin | Review approved docs/contracts, proposed vendor source/version/license, asset sources and scope; do not revive parked code silently | Plan approval | File inventory; no accidental product artifacts promoted as finished |
| R1: style bible | Character scale/forward-axis conventions, material palette, biome scripts, Groudon composition, UI visual tokens | R0 | Reviewed visual reference sheet and written style rules |
| R2: asset manifest | All 386 IDs/form keys, coverage statuses, provenance fields, loader/fallback policies | R0/R1 | Complete explicit register; missing final assets visible |
| R3: browser/lifecycle skeleton | Constructor, error recovery, resize/dispose, local imports, capability gate and quality settings | R0 | Static inspection + user-approved later manual browser smoke capture; no game-source tests |
| R4: camera/tile presentation | Follow/orbit/zoom, coordinate conventions, wall obstruction, interpolation, mandatory visibility filtering, tile previews | R3 + approved immutable presentation snapshots | Manual corridor and boss framing review after authorization |
| R5: volcanic scenery anchor | Basalt/lava kit, instances/chunks, lights/fog/shadows, resource pools | R3/R1 | Neutral arena and actual encounter captures; count/resource record |
| R6: hero/partner/Groudon assets | Dedicated original assets, rigs, LODs, core clips and manifest entries | R1/R2 | Turntables plus close-up material/animation review; asset provenance |
| R7: real battle presentation | Actor diff/sync, move/hit/status effects, animation sequencing, camera response, pickups | R4/R5/R6 + real event contract | Actual playable Groudon fight capture and accessible feedback review |
| R8: accessible core UX | Setup, quiz, choice, HUD, action menus, pause/settings, loading/errors, mobile controls | Controller/simulation contracts | Keyboard/touch/focus review; no fake menu options |
| R9: vertical-slice gate | Review actual encounter against approved P06 art direction; retain internal capture only, no public card change | R7/R8 | Explicit user decision on quality; revise before multiplying assets |
| R10: starter/main-story waves | Starter/evolution art, common enemies, campaign bosses/NPCs, biome kits and setpieces | R9 | Per-wave coverage and actual-dungeon captures; no silent fallback substitutions |
| R11: full service/progression UX | Town services, inventory/storage/shop/jobs/team/evolution/recruitment/postgame menus | Actual rule-side services | Panel inventory reconciled with available rules/actions |
| R12: postgame/remaining roster | Legendary kits/forms, optional-route art assignments, remainder of 386 species | R10/R11 | All manifests assigned; final model/animation coverage status truthful |
| R13: performance and accessibility pass | Resource accounting, adaptive quality, loading/cache/context handling, text/contrast/motion/touch | Representative completed content | Authorized manual desktop/mobile review records and known limitations |
| R14: final capture/integration | Actual final Groudon screenshot, crop, arcade config and static paths | R13 + root integration | Real screenshot; site-only tests with stub iframe; README unchanged |
| R15: completion audit | Coverage, license/rights wording, source notices, static checks, integration/CI/root review | All accepted scope | No unresolved mandatory visual/content gaps; completion wording matches reality |

For each task, the smaller model should first read the relevant contracts and owned files; make bounded changes; run only allowed static checks; summarize files, rationale, evidence and gaps. It must not re-create the entire scene on each action or rewrite simulation to accommodate a camera/art shortcut. Follow the root's test boundary: no game-source tests; website integration tests must use stub HTML and never execute the real game. Actual screenshots/manual play acceptance are separate user-requested review activities after scope approval, not permission to add automated game tests.

## 12. Risk gates and explicit stopping criteria

| Risk | Early warning | Required gate |
| --- | --- | --- |
| 386-species art volume underestimated | Most entries point to one archetype; dedicated assets stop after starters | Coverage audit separates fallback from final; negotiate scope honestly before claiming completion |
| Unreal-like wording exceeds runtime | Promises of Lumen/Nanite/path tracing without a compatible runtime | State browser PBR approximation and approved art target; no engine-feature promise |
| Primitive-prototype quality accepted by inertia | Detailed implementation exists but silhouette/material reviews fail | Stop content multiplication at vertical slice; refine modeling/art direction |
| Asset rights uncertain | Commercial rips, unspecified author/source, ambiguous redistribution license | Do not import/publish until source/provenance/rights posture reviewed; original meshes do not erase character-IP questions |
| Mobile overdraw/memory | Many transparent effects, huge textures, all 386 models loaded at entry | Reduce effects/resolution/assets and establish bounded cache; preserve tactical readability |
| Third-person discovery leaks | Camera shows hidden enemies/loot behind walls | Require domain-projected visible/explored masks and render filtering; block release until resolved |
| Camera wrong for large forms | Boss cropped, walls block hero, wings fill HUD | Bounding-box framing hints and tested manual compositions for relevant body plans |
| UI front-end overpromises systems | Attractive panel contains unsupported service/action | Reconcile panel list with real simulation actions; disable with accurate explanation or implement missing scope |
| Shader/vendor compatibility | Code copied from newer docs uses removed/changed APIs | Pin version, inspect exact local source/docs and static imports; do not auto-upgrade during feature work |
| Quality adaptation hides correctness | Reduced tier removes hazards/target/status cues | Critical cues required on every tier; decorative effects degrade first |
| Resource leak/context loss | Switching floors grows resource counts; restored context stays black | Explicit ownership/recovery lifecycle; later authorized manual repeat-transition observations |
| Preview is fabricated | Title diorama/AI image used for arcade screenshot | Root reviews actual running practice/campaign encounter and records capture provenance |
| Planning pause ignored | Product files continue being written after user steering | Park prototype work, deliver plan/setup only, stop for user review |

## 13. Historical exploratory work, already parked

Before the user changed scope to planning, an unreviewed procedural-model draft and candidate local Three.js vendor files were written. The rendering draft included approximate sculptures for selected starters/evolution lines, Eevee variants, Groudon and selected legendaries, archetype fallbacks, a shared geometry/material pool and simple rig oscillation. Only a syntax check was performed; it was never rendered, integrated, screenshot-reviewed, exercised or tested. No renderer implementation was completed and no visual/performance success was established.

These drafts were already parked outside the deliverable planning branch. They are not current product files, approved architecture, final art coverage, installed dependencies or validation evidence. PLAN section 2 governs their status. Future P04 selects and verifies dependencies anew; future P06 establishes the art target through approved work. No executor should silently revive the drafts or treat their syntax result as completion evidence.

## 14. Technical source notes

Technical references were checked through public source search during planning on 2026-10-04. The implementation must use documentation compatible with the exact pinned Three release, because current online documentation may evolve.

- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): WebGL2 baseline and renderer configuration reference.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html): local glTF asset and decoder integration reference.
- [Three.js KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html): GPU texture transcoding integration reference.
- [Three.js WebGPURenderer introduction](https://threejs.org/manual/pages/webgpurenderer): clarifies renderer choices; WebGPU migration is not part of this plan.
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): browser GPU resource/performance guidance.
- [MDN WebGL2RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext): WebGL2 capability context.

No copyrighted game artwork, ripped models, copied scripts, or external runtime art dependencies are authorized by this appendix. The next action is review of the consolidated plan and repository setup, not rendering implementation.
