# Task 1 report: production pixel renderer and projection

Implemented the immutable P10 presentation boundary, production Three renderer,
clip cache, camera, instanced terrain/props and explicit local art export. The
renderer is not wired into a fake campaign or startup demonstration.

## Files and interfaces

- `src/presentation/{types,projection,index}.js`: canonical dungeon projection
  requiring current visibility, explicit derived appearance/metadata; detached,
  recursively frozen WorldView/ActorView/PickupView/RenderSnapshot.
- `src/rendering/`: renderer lifecycle, actor UV/animation ownership, clip cache,
  follow/orbit camera, quality limits and basic/production EnvironmentKit bridge.
- `assets/characters/pixel/`: 192 exact original starter clip PNGs, compact manifest
  and generated exact manifest integrity pin.
- `tools/pokemon-dungeon/scripts/{export,check}-runtime-pixels.mjs`: deterministic
  copying and independent static byte/schema/hash/dimension/path checks.
- `plan/RENDERER-CONTRACT.md`: complete API, caller obligations and remaining gates.
- Authorized narrow shared edits: canonical DeepReadonly preserves primitives
  before mapped objects; rendering-only lint globals crypto/createImageBitmap.

Constructor exposes `ready`, callbacks onError/onAssetsPending/onContextState,
explicit quality/reducedMotion and EnvironmentKit. APIs: loadWorld, async
syncActors, syncPickups, setFollow, rotate, zoom, setPitch, recenter, flash,
update, resize, dispose; readonly metrics/cameraYaw. Root must await readiness
and current sync before domain input readiness, own frame/visibility timing and
serialize epoch/revision checks. No root/shared input/UI mutation was made.

Environment owner supplied the v1 kit manifest. Runtime adapter loads one exact
kit's textures and reusable parts. Kit textures are caller-owned across scene
instances; instance disposal releases its own buffers/materials/geometry only.
The production manifest and kit visuals remain owned/reviewed separately.

## Ownership and race reasoning

Character cache reserves 1,179,648 bytes before every new page fetch/decode;
21 pages are 23.625 MiB, never over the 24 MiB ceiling. Reservations survive
cancellation until completion. Actor leases share a decode/texture but retain
independent geometry UVs/materials. Last release disposes once; world/actor/clip
generations prevent stale completions. No speculative/roster preload. Reduced
motion does not change rules. Clip tokens prevent repeated attacks on identical
snapshots. Contact shadows, effects, instance resources and listeners have
explicit owners and idempotent disposal. Context restoration reuploads retained
resources; simulation remains external and unchanged.

## Static evidence

- Runtime export: 192 reviewed original clip pages copied without game execution.
- Runtime checker: exact schema, generated manifest pin, page hashes/dimensions,
  source copy equality and relative path closure passed.
- Final strict JSDoc/static type pass: 58 authored files parsed only, including
  all new renderer/projection files and canonical branded IDs.
- Final global lint/local import closure: 113 authored files passed; scoped
  renderer ESLint and staged pre-commit hooks passed. Concurrent authoring errors
  observed earlier were reported to their owners and cleared before commit.
- No game module imported/executed; no game test, automated capture or playthrough.

## Open acceptance and integration

Root owns package aliases and application wiring. The shell remains honest about
campaign availability. Mandatory domain visibility and effective appearance
resolvers do not exist merely because the renderer can consume their result.
Character integration is provisional scoped starter integration, not full 386
species/form coverage. All non-starter art, actual campaign events/staging,
P18 UI, production corridor/boss framing, mobile
performance, hidden-page timing and context-loss/rapid-transition human
acceptance remain open. Existing production art captures are authoring evidence,
not runtime or campaign screenshots. No release/full-game completion claim.

## Independent review repair: prop transform composition

The P2 in `task-1-review.md` was confirmed against the authoring viewer and
pinned Three source. Runtime previously added prop yaw to the local XYZ Euler
Y component; that does not rotate tilted multi-part props as a rigid object.
The adapter now constructs `parent = T(tileX*2,0,tileZ*2) * Ry(yaw)` and
`local = T(part.position) * Rxyz(part.rotation)`, then computes the instance
matrix as `parent * local`. The same composed matrix transforms camera bounds.

Static source trace agrees with the art viewer's `parent.matrix * dummy.matrix`.
The viewer uses unit primitive geometry and puts `part.size` in its local
matrix. Runtime `geometryFor` already bakes that same size into vertices:
BoxGeometry takes complete dimensions; cylinder/cone/sphere start with radius
0.5 and unit height/diameter and call geometry.scale once. Therefore both
runtime matrix scales stay one. The resulting world vertices are equivalent
without applying dimensions twice, and the pre-sized geometry bounding box
uses exactly the same instance matrix as rendering.

The `fossil-ribs` witness follows directly: with local X tilt a and parent yaw
pi/2, the cylinder Y axis becomes `(sin(a), cos(a), 0)` under `Ry * Rx` instead
of remaining `(0, cos(a), sin(a))` under the earlier additive-Euler ordering.
This is a source/matrix trace, not a game execution or automated runtime test.
All existing instancing, allocation and disposal ownership remains unchanged.
