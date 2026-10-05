# P03-A: P06 asset authoring contract

**Contract 1.0.0; candidate production specification, no assets accepted.** This
bounded package consumes accepted Blue species identities, `style-b-v1`, and
the static WebGL2 platform. It leaves P01 mechanics research and P02/P07 domain
interfaces incomplete. Follow the bounded-order ruling in [PLAN.md](PLAN.md).
P06 human visual acceptance, P10 renderer integration, P36 exposure approval,
and P37 merge/deployment approval remain separate gates.

The companion [JSON Schema](../../../tools/pokemon-dungeon/schemas/asset-manifest.schema.json)
is Draft 2020-12. It describes actual exported 3D files; an empty `assets` array
is valid. No example entry, model, capture, hash, or approval is asserted here.
Raster sheets continue to use [ASSET-PIPELINE.md](ASSET-PIPELINE.md); this schema
covers glTF bundles, their textures, authoring evidence, and review records.

## 1. Four briefs and identity boundaries

| Subject | Stable identity / anchor role | Candidate asset ID | Recognition and scope |
| --- | --- | --- | --- |
| Pikachu | `pokemon-025` / `hero-anchor` | `model.pokemon-025.v001` | Ear tips, cheek patches, muzzle, paws, back markings and lightning-tail silhouette remain readable from front, side and back. |
| Charmander | `pokemon-004` / `partner-anchor` | `model.pokemon-004.v001` | Distinct muzzle, belly, hands/feet and long tail; tail flame uses a separate named socket/material and reduced-motion treatment. |
| Groudon | `pokemon-383` / `boss-anchor` | `model.pokemon-383.v001` | Broad armored silhouette, head/face, seams, spikes, claws and tail; articulated limbs and low-angle readability. |
| Magma Cavern | Presentation key `magma-cavern` / `environment-anchor` | `environment.magma-cavern.floor.v001` and separate wall/obsidian-prop/lava-surface/composition IDs | Original basalt, obsidian and lava art with clear ground, restrained sparks and warm/cool separation. No authored dungeon layout, legal terrain, boss-floor number or hazard behavior. |

IDs name proposed briefs. Actual entries are created only after files exist.
The three `SpeciesId` values follow [DATA §2](DATA.md#2-exact-roster-and-identity-model)
and [SYSTEMS](SYSTEMS.md#ids-and-content-records). `anchorRole` is an art-review
role, **not** `ActorView.role`, recruitment, affiliation or combat metadata.

- A character's `formBinding` is `unresolved` with a reason until a reviewed
  catalog supplies its exact `FormId`, revision and evidence ID. Do not invent
  `default`, shiny, sex, status or alternate-form keys.
- Environment `domainBinding` similarly waits for the canonical `DungeonId`.
  The presentation key does not claim to be that ID.
- `assetId` ends in `.vNNN`; its decimal suffix equals positive `revision`,
  padded to at least three digits. Changed bytes, rig, naming or materials
  produce a new revision. IDs are case-sensitive; filenames are lowercase.
- Asset ID and subject must agree. Multiple form assets need a reviewed schema
  revision before expanding this deliberately small anchor inventory.

## 2. Space, pivots and rigs

| Convention | Contract |
| --- | --- |
| Coordinate frame | Right-handed; +Y up, +Z asset-facing direction; X/Z ground plane. One unit = one meter. |
| Tile reference | 2 meters per presentation tile, matching RENDERING §3.2; this does not define collision, recruitment body size or occupancy. |
| Root | Exactly one top-level `asset-root`, translation `[0,0,0]`, quaternion `[0,0,0,1]`, scale `[1,1,1]`. Bake authoring transforms before export; no negative scale. |
| Character pivot | Root at ground-center between standing contact points. Neutral sole/ground contact is Y=0; appendages may extend beyond the footprint. Record measured neutral-bind-pose AABB in meters. |
| Environment pivot | Ground-center of the component's nominal footprint at Y=0. A floor module uses a 2×2-meter footprint; larger pieces declare bounds and align on whole tile multiples. |
| Presentation height | Initial art targets: Pikachu 1.0 m, Charmander 1.1 m, Groudon 5.5 m in neutral pose. These are authored staging targets, not canonical Pokémon heights; P06 may revise them explicitly. |
| Rig family | Three species-specific bipeds may share conventions, never a substitute silhouette. `rig-root` below `asset-root`; pelvis/spine/head, paired limb chains, and species-specific ear/tail/claw controls as needed. |
| Naming | Unique lowercase kebab-case node, mesh and material names. Left/right suffixes describe the subject's own sides. Stable names across LODs; no dependence on exporter-generated indices. |
| Attachments | Named empty transform nodes, e.g. `socket-mouth`, `socket-hand-left`, `socket-hand-right`, `socket-tail-tip`; include only sockets that actually exist and record the parent node. |

The export applies the coordinate conversion once. Imported assets need no
species-specific corrective rotation or hidden scale multiplier. Skin weights,
bind matrices and pose bounds are inspected offline; static metadata cannot
establish good deformation or recognizable anatomy.

## 3. Clips and materials

Required accepted character clips are `idle`, `locomotion`, `attack-physical`,
`attack-special`, `cast-status`, `hit-light`, `hit-heavy`, `defeat`, `celebrate`,
`rest-sleep`, and `interact`. `turn-left`, `turn-right`, `roar`, and `boss-intro`
are optional named previews, included only when authored. P06 playback does not
bind any of them to a move, status, damage event, turn length or story trigger.

- Clips use seconds, positive measured durations and unique exact names.
  `idle`, `locomotion` and `rest-sleep` loop; other clips are one-shot.
- All clips are in-place: `asset-root` stays fixed. Local pelvis/limb motion is
  allowed; movement interpolation belongs to the later presentation contract.
- Each clip records its actual target nodes. Accepted LOD0/1/2 carry the same
  required clip vocabulary, compatible named skeleton and attachment sockets.
  Reduced motion may hold a readable pose; it never changes domain outcomes.
- glTF animations contain baked transforms/morph weights, with no authoring
  constraints, expressions, scripts, physics dependency or event callbacks.

| Material channel | Export and interpretation |
| --- | --- |
| Base color | glTF base color; color texture RGB interpreted as sRGB, alpha linear. Broad authored colors/markings; no baked directional shadows. Vertex colors are linear multipliers. |
| Normal | Optional tangent-space normal texture with glTF convention; linear data. Export normals and tangents when used; no painted normal-map claims. |
| Occlusion / roughness / metalness | Linear channels R / G / B when packed together; glTF occlusion references R and metallic-roughness references G/B. Organic surfaces and basalt use nonmetallic values. |
| Emissive | Color texture RGB is sRGB; factor is linear. Lava/flame brightness is a controlled artistic input; no baked screen glow or claim of safe/walkable terrain. |
| Alpha | Prefer `OPAQUE`; `MASK` only for deliberate cutouts. `BLEND` needs explicit visual review for sorting/overdraw. Double-sided materials must be intentional. |
| Style | `style-b-v1`: two or three readable light bands, selective contours and coherent broad colors. glTF carries material inputs; the later reviewed renderer applies cel shading. A standard glTF preview does not prove B shading. |

Use PNG/JPEG for baseline glTF textures. Core glTF does not encode WebP/KTX2
support; those formats and mesh compression require a reviewed extension/
locally vendored decoder decision. UI WebP remains covered by ASSET-PIPELINE.

## 4. Export and budgets

- Export glTF 2.0 as GLB when one file fits, otherwise `.gltf` plus separately
  partitioned `.bin`/PNG/JPEG files. No data URIs, remote resources, absolute
  paths, query/fragment URLs, traversal or runtime authoring dependencies.
- All local paths resolve from the directory containing the manifest, identically
  for authoring and runtime manifests. Authoring bundles are nested there; there
  is no separate implicit bundle root. Every external glTF buffer/image URI must
  resolve inside that directory and match a declared file. Record embedded GLB resources in material/node/mesh
  inventories; their bytes are already counted in the GLB.
- Baseline exports use core glTF only: no required extensions, Draco, meshopt,
  KTX2 or custom shader code. Triangulate explicitly, omit cameras/lights from
  reusable assets, export finite transforms, and retain named hierarchy/skins.
- Each actual file has lowercase SHA-256 and measured encoded bytes. Every file
  entering git is **at most 1,048,576 bytes**; target ≤1,000,000 for headroom.
  Partition or optimize without degrading the approved silhouette.

| Per-model target | LOD0 / standard | LOD1 / low | LOD2 / distant |
| --- | --- | --- | --- |
| Pikachu / Charmander triangles | ≤12,000 each | ≤5,000 each | ≤2,000 each |
| Groudon triangles | ≤40,000 | ≤12,000 | ≤6,000 |
| Materials per character LOD | ≤4 | ≤3 | ≤2 |
| Texture edge | Usually ≤1,024; 2,048 only reviewed | Usually ≤512; 1,024 only reviewed | Usually ≤256 |

These are P06 starting targets derived from RENDERING §8, not measured results
or automatic quality acceptance. Record per-LOD triangles, nodes, meshes,
materials, joints, clip names and bounds; retain eyes, ears, tail, armor and
claw readability. Select LOD by reviewed screen size later, not a guessed
world distance in this contract. Environment composition shares the scene
budget: begin below 250,000 main-pass triangles standard and 70,000 low.

PLAN's whole-scene limits remain ≤8 MiB initial encoded transfer including
engine, ≤24 MiB active encoded assets and ≤300 MiB total game. Count unique
shared files once; encoded sizes do not measure GPU residency or performance.
The schema enforces the existing per-file ceiling; P06 measures aggregate
budgets separately and records any reviewed adjustment to provisional targets.

## 5. Manifest, provenance and acceptance

| Record | Required meaning |
| --- | --- |
| `manifestKind: authoring` | Stored under `tools/pokemon-dungeon/art/manifests/`; every entry has authoring sources/export settings/captures/notes. Candidate/rejected bundles remain outside `games/`. |
| `manifestKind: runtime` | Portable projection with `authoring` removed; every asset is `reviewed`, has documented file licensing and accepted P06 art evidence, and has bound canonical identity. Candidate files cannot enter this projection. This does not grant publication permission. |
| `candidate` | Actual measured export awaiting review; `review.state` is `pending`. A record is not a finished-model claim. |
| `reviewed` | Human-approved art revision with reviewer/date/review ID and evidence-record hash. Does not claim gameplay, full roster, P10 or release acceptance. |
| `rejected` | Retained authoring evidence with the rejected review record; never a runtime entry. |
| Provenance | Actual creators/contributions, original/manual/procedural/mixed or permitted-third-party method, source record IDs, attribution, license ID, local notice URL and separate character-rights note. A model author's license does not establish Pokémon character-IP clearance. |
| Authoring sources | Preserved original files, generators/settings or reference records, locator and actual source hash. Mark references `reference-only`; never represent an anatomy reference as a redistributable texture/mesh. Source locators are metadata, never runtime fetch URLs. |
| Captures | Actual local path or authoring-only durable-artifact locator, hash/bytes/dimensions, device, quality tier, reduced-motion state and asset revision. Git-bound captures obey the 1 MiB limit. Label exactly `P06 art preview; not gameplay`; record accepted captures in a hashed review record. |

Store raw sources and large captures outside the published game tree; use the
approved durable artifact route when unsuitable for git, retaining retrieval
locators and hashes. A pending license review may record its uncertainty in an
authoring entry; it cannot be promoted by changing only an asset status.
License notices referenced by the portable projection must ship locally.

P06 acceptance requires neutral front/side/back turntables; readable clip
previews; material closeups; third-person Pikachu/Charmander/Groudon composition;
and low-tier/reduced-motion evidence on agreed devices. Environment captures
show ground/lava separation and near-camera clearance. Justin reviews actual
output before mass production. No generated loading illustration or mock HUD
qualifies as a gameplay screenshot, and no capture activates the arcade card.

## 6. Static checks and open interfaces

Schema validation checks shape, strict fields, local path syntax, per-file size,
review-state relationships and required accepted character clips/LODs. It
cannot prove existence, truth of hashes, license sufficiency, anatomy, or human
approval. The later authoring command additionally checks:

1. Unique asset/file/clip IDs, matching revision suffix/subject, LOD0 presence,
   unique LOD levels, and resolvable file/material/socket/clip references.
2. File existence, exact hashes/bytes, no symlink/path escape, and complete local
   glTF buffer/image dependency closure; actual glTF 2.0 validity.
3. Exported node/mesh/material/joint/triangle/clip inventories against measured
   records; bounds ordering, root convention, finite values and texture limits.
4. Cross-LOD rig/clip/silhouette requirements, aggregate budgets, local notices,
   source/evidence references and the explicit human review record.

These are offline asset/schema checks, not tests that execute/import game
source or automated gameplay. P03-A leaves actual exports, prompts/class anchors,
rig deformation, clips, audio mood, captures and P06 acceptance unproduced.
Canonical form/dungeon binding and runtime event/role/status mapping remain
blocked on P02/P07/P10. P04-A may consume this shape and local-file policy without
asserting that those dependencies or the full P03 acceptance gate are complete.

## Technical references

- [Khronos glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html): coordinate units, hierarchy, animations, material channels and resource conventions; checked 2026-10-04. Project-specific limits and names above are authoring decisions.
- [RENDERING §§3–4, 8](RENDERING.md): presentation scale, anchor wave, rig/clip coverage and provisional budgets.
- [PLAN P03/P06](PLAN.md): package scope, human acceptance and release boundaries.
