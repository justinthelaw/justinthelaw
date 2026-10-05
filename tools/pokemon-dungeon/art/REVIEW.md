# P06 candidate 3D review

**P06 art preview; not gameplay.** These are actual locally rendered GLB assets,
not generated gameplay illustrations. Justin's visual review remains pending;
P06 is not complete and no asset is approved for runtime promotion.

## Concrete output

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

## Rendered views

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

## Remaining acceptance

- Review character recognition, proportions, cel bands, contours and cavern
  direction before mass production, as required by PLAN P06 and game AGENTS.
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
