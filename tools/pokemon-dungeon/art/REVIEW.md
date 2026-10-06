# P06 art review — current pixels and historical rejected meshes

**P06 art preview; not gameplay.** These are actual locally rendered GLB assets,
not generated gameplay illustrations. The earlier record interpreted Justin's continuation as direction acceptance.
The later explicit EthrA pixel/real-3D reference and rejection of primitive
character anatomy supersede that inference. These rigid character candidates
are rejected and retained as historical evidence. P06 is not complete and no
asset is approved for runtime promotion.

## Current directional pixel proof (2026-10-05)

**Original art foundation; no gameplay and no final acceptance.** The actual user
EthrA frame was inspected: crisp directional pixel characters occupy textured,
illuminated three-dimensional spaces. The new code-native sources draw original
species-specific silhouettes; they do not pixelate the rejected GLBs or reuse
commercial pixels. The failed ImageGen attempt produced no asset and was not
retried or routed through an API.

| Candidate | Visible identity evidence | Remaining refinement |
| --- | --- | --- |
| Pikachu | Long black-tipped ears, red cheeks, two brown back stripes, broad angular lightning tail, flat paws; dedicated side silhouette | Diagonal volume, expressive poses, gait/contact refinement |
| Charmander | Rounded connected skull/muzzle, teal eyes, cream underside, three-toed feet, tapering tail with attached layered flame; distinct profile | Diagonal muzzle/body volume, flame/motion polish and full action clips |
| Groudon | Wedge snout, focused gold eyes, red plate seams, pale belly plates/side spikes/claws, broad haunches and flat armored tail; distinct hunched profile | Forward wedge jaw, raised shoulder hump and shortened visible belly revised after actual front-capture feedback; diagonal mass still stylized; full armor/anatomy and animation acceptance remains open |

All three use the [versioned contract](pixel/CONTRACT.md): eight rows, twelve
columns, 96×96 RGBA cells, fixed `[48,92]` feet, nearest character sampling and
explicit idle/walk/physical-attack studies. Full clips are missing and listed in
[the manifest](pixel/manifest.json). Three candidates are not roster coverage.

| Current evidence | Files |
| --- | --- |
| Direction strips | [Pikachu](pixel/output/pikachu-directions.png), [Charmander](pixel/output/charmander-directions.png), [Groudon](pixel/output/groudon-directions.png) |
| Real 3D material/composition proof | [Desktop](pixel/captures/composition-desktop.jpg), [390×844 mobile](pixel/captures/composition-mobile.jpg) |
| Individual examples | [Pikachu front](pixel/captures/pikachu-front.jpg), [Charmander side](pixel/captures/charmander-right.jpg), [Groudon side](pixel/captures/groudon-right.jpg), [Groudon back](pixel/captures/groudon-back.jpg) |
| Full capture inventory | [Browser/viewports/queries/errors](pixel/captures/capture-record.json): all 24 neutral directions, 8 fixed-world-forward orientation proofs and 12 held animation-study frames |

The proof viewer shows actual local Three.js textured terrain/rocks, warm lights,
fog/depth and yaw-only billboard sprites. The authoring camera selects rows from actor heading minus camera bearing.
A fixed +Z cyan world arrow in eight dedicated orientation captures independently
checks projected facing; camera +X must show the heading-zero nose pointing left. Ground contacts are simple translucent ellipses, not physical
character shadows. Sprite palette ramps are authored, with basic unlit materials;
scene lighting currently affects terrain, not dynamic character relighting.
The cavern is a texture/depth proof, not a finished campaign biome.

Visual inspection found frontal-image reuse did not provide adequate profiles;
independent side silhouettes were drawn for all three species. Feet were aligned
to the shared anchor and safety borders were checked across all 288 cells. The
first terrain capture hid most lava beneath an over-wide floor; the revised floor
reveals the side channels and replaces regular brick lines with broken stone.
Further front-capture feedback prompted a wider/forward Groudon jaw, a raised shoulder hump, shorter belly, lowered profile head, darker ground contacts and brighter warm terrain fill. Phone composition keeps hero/partner distinct but small; closer campaign camera
and physical-device review remain necessary. No quality/FPS claim is made.

Capture runs execute only the art viewer. Browser is Chromium 153.0.8010.12,
Linux SwiftShader software WebGL2; captured poses are held frames, not measured
frame pacing. The reproducible capture script reports zero page/console/resource
errors, with every request inside tools. No domain state, game route, combat,
save or playthrough is executed. Exact commands/results are in Task 1's report.

`npm run pixel:export`, `npm run pixel:check`, `npm run check` and
`PIXEL_CAPTURE_BROWSER=/path/to/chromium npm run pixel:capture` from the tools
package reproduce the original bytes and the art-only evidence. The new viewer
is `art-preview/pixel/`; the original viewer below remains a historical inspector.

## Historical rigid-mesh output

| Candidate revision 2 | LOD0 / LOD1 / LOD2 triangles | GLB bytes, LOD0 / LOD1 / LOD2 |
| --- | --- | --- |
| Pikachu | 9,296 / 4,674 / 1,956 | 418,136 / 277,768 / 187,280 |
| Charmander | 9,016 / 4,432 / 1,864 | 431,180 / 294,132 / 214,296 |
| Groudon | 11,792 / 8,904 / 5,848 | 903,388 / 813,392 / 646,520 |
| Magma Cavern composition | 7,586 / 7,586 / 3,906 | 80,588 / 80,588 / 51,580 |

The three characters each contain eleven named in-place clips. They use rigid
articulated node hierarchies; `skinJointCount: 0` is intentional, and no smooth
skinned deformation is claimed. Each file remains below 1,048,576 bytes.
All model bytes, local notices, sources, bounds, names, counts and clips are
recorded in [the candidate manifest](manifests/assets.json). Canonical form and
dungeon bindings remain unresolved, and licensing/review status stays pending.

## Historical rendered views

| Subject | Views |
| --- | --- |
| Cavern composition | [Standard](manifests/captures/composition-standard-front.jpg), [high](manifests/captures/composition-high-front.jpg), [low at phone viewport](manifests/captures/composition-low-front.jpg) |
| Pikachu, neutral pose | [Front](manifests/captures/pikachu-standard-front.jpg), [side](manifests/captures/pikachu-standard-side.jpg), [back](manifests/captures/pikachu-standard-back.jpg) |
| Charmander, neutral pose | [Front](manifests/captures/charmander-standard-front.jpg), [side](manifests/captures/charmander-standard-side.jpg), [back](manifests/captures/charmander-standard-back.jpg) |
| Groudon, neutral pose | [Front](manifests/captures/groudon-standard-front.jpg), [side](manifests/captures/groudon-standard-side.jpg), [back](manifests/captures/groudon-standard-back.jpg) |
| Locomotion sampling | [Six-second motion study](manifests/captures/locomotion-study.mp4): three subjects, eight sampled frames per second; actual glTF animation playback, no game actions |

Chrome for Testing **154.0.8037.92**, Linux, **SwiftShader software WebGL2**.
Standard/high composition: 1440×1000 browser viewport. Neutral model views:
1100×1000. Low composition: 390×844. Captures hold motion unless labeled the
motion study. The movie samples an authoring clock; it is not measured frame
pacing. Its 704×576 export is silent; sound is available separately through the
preview's explicit Cavern sound button as original procedural mood synthesis.

No page/console errors were reported during successful art captures. Initial
local-server connection failure was corrected by running the preview server
and browser capture in the same execution environment. No game module, domain
state, persistence or gameplay was executed by the capture workflow.

Actual render inspection prompted fuller ears/adjusted tail on Pikachu,
embedded smaller Charmander eyes, broader Groudon anatomy/curved belly plates,
less washed-out lighting and portrait camera framing. These changes improve the
candidate; they do not constitute Justin's acceptance.

## Historical candidate limitations

- The old continuation inference was superseded by explicit rejection. Do not
  continue the primitive anatomy or claim acceptance; preserve this evidence.
- Review all eleven clips per character, joins/deformation, contact and
  expression in the local harness; a short locomotion sample is not exhaustive.
- Review actual low/standard/high quality and reduced motion on agreed physical
  devices. A small viewport and software renderer do not establish mobile FPS.
- Complete environment effects, material detail and sound-direction review;
  this scene is an initial geometry/light composition, not a finished biome.
- Resolve catalog bindings, provenance/distribution records and P10 integration
  before runtime promotion. The game still lacks its simulation, campaign,
  postgame, onboarding, usable menus, saves and end-to-end playthrough evidence.

## Reproduce

See [the tooling guide](../README.md). Run `npm run art:export` then
`npm run check` from `tools/pokemon-dungeon/`. Serve the repository locally and
open `tools/pokemon-dungeon/art-preview/`. Only the separate pinned Three.js
vendor closure and these candidate assets are imported. This disposable
inspector is not an alternate game or a Groudon practice mode.
