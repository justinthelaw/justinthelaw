# Production presentation boundary (P10)

This package implements the production rendering boundary and provisionally
integrates the 16 reviewed starter species' 192 original clip pages. It does
not activate a campaign, certify device performance, complete the full roster,
or replace later campaign, biome, camera and character visual acceptance.

## Immutable projection

`src/presentation/types.js` defines presentation-only types; canonical state
continues to live in `src/contracts/campaign.js`. `projectDungeon(snapshot,
visibility, presentation)` consumes a validated immutable CampaignSnapshot,
current domain VisibilityView, and explicit PresentationCatalog. It returns
an independently cloned, recursively frozen RenderSnapshot. Renderer entry
points also detach retained views. No domain arrays or mutable records enter
the renderer. The canonical DeepReadonly helper preserves branded primitives
before traversing objects; this is a type-only correction.

| Record | Required fields and semantics |
| --- | --- |
| WorldView | worldId, revision, width, height, biomeId, tiles[z][x], visible, explored, exits, props |
| ActorView | actorId, speciesId, formId, name, x/z, heading, role, hp/maxHp, simultaneous statuses, clip, clipToken, tint, art bounds |
| PickupView | pickupId, x/z, kind (item/money/trap), label, quantity, color |
| RenderSnapshot | epoch, revision, world, actors, pickups, ordered events |
| VisibilityView | mapId/revision, visible/explored masks, permitted actor/item/trap/exit ID lists |
| PresentationCatalog | epoch, biomeId, exact terrain appearances, per-actor appearance/role/status/max-HP/clip metadata, item/trap labels, props and projected events |

Positions are logical tiles; one tile is two world units. Terrain appearances
are wall/floor/water/lava/void and confer no movement permissions. Unknown
terrain becomes void before exposure. The caller must provide the domain's
visibility result; explored memory, camera position and walls never derive
actor sight. Actor/item/trap IDs are independently admitted and still require
a visible tile. Buried items and unrevealed traps are excluded. Exit knowledge
requires an explicit permitted ID. Props expose explored scenery only.

Effective actor `appearance:{speciesId,formId}`, max HP, role and simultaneous
status descriptions are mandatory caller projections. The renderer does not
infer Transform, Decoy, form overrides or hidden-stat rules from base identity.
Missing presentation metadata throws. An authored town/story world can use
`immutableRenderSnapshot` directly, with equally explicit knowledge masks;
there is no generated placeholder town or Adventure.

`clipToken` is stable across repeated projections of one presentation action.
Changing token or clip restarts its clock; replaying an identical snapshot does
not restart attacks. Clip completion only clamps/loops, never grants a turn.
Application event IDs increase within an Adventure epoch. The application must
filter already-presented effects before calling flash and reset that cursor on
Adventure replacement. No events or camera data are saved as domain authority.

## Renderer API and composition ownership

Import `DungeonRenderer` from `src/rendering/index.js`. Constructor arguments
are `(canvas, {onError?, onContextState?, onAssetsPending?, reducedMotion?,
quality?, environmentKit?})`. It owns no RAF, input listeners, menus, RNG,
storage, audio or simulation. Keep one active renderer per application.

| API | Contract |
| --- | --- |
| ready | Promise for exact pinned pixel manifest validation; rejects on failure |
| loadWorld(world) | Detaches a world; new identity releases old world/actors/effects; same identity updates masks/instances without replacing the scene |
| syncActors(views) | Async stable-ID diff; resolve before setting world input ready; explicitly rejects absent species/forms/clips, failed bytes or page-budget overflow |
| syncPickups(views) | Reuses three instanced cue batches; current visible records only |
| setFollow(actorId/null) | Remembers explicit identity; after disappearance retains last camera target |
| rotate(radians), zoom(delta), setPitch(radians), recenter() | Presentation-only camera requests; yaw exposed by cameraYaw is the actual smoothed input-convention yaw |
| flash(x,z,type,color?) | Bounded visible-tile ring effect; hit/heal/status; reduced motion suppresses decoration |
| update(dtSeconds) | Explicit presentation time; clamps to 0-0.1 s, skips hidden documents/context loss; no catch-up simulation |
| resize() | Display-rectangle/DPR resize with pixel ceiling; ignores zero-size surfaces |
| metrics | Page reservations/residents/inflight/peak/disposed, actor/pickup/effect counts, draw calls, triangles, GPU resource counts |
| dispose() | Idempotent listener, request, instance, texture, bitmap, geometry and material cleanup |

The composition root must serialize current snapshot application and compare
its Adventure epoch/revision before publishing an async completion. It owns
ResizeObserver/window density handling and the active RAF. Pause input/time on
context loss and document hiding. Resume with a fresh frame origin; do not pass
hidden wall-clock time. onAssetsPending is a loading indication, not permission
to run a domain action. A rejected sync requires an explicit loading/error/retry
state; an absent sprite must never be treated as an invisible enemy.

Three's pinned WebGLRenderer restores its GPU backend before the restoration
callback. Live CPU geometry, page bitmaps, texture sources and current detached
views remain available for reupload. Context status is reported to the root;
no simulation snapshot is reconstructed or mutated. Failures report onError.

## Character pages and bounded ownership

Runtime export copies the original reviewed production PNGs byte-for-byte;
it never imports the rejected models or re-rasterizes generic bodies. The
compact manifest contains clip timing, exact identities/scales, page paths,
encoded sizes, SHA-256 and decoded sizes. A generated local integrity module
pins the exact manifest bytes. Static verification compares manifest/schema,
integrity pin, original PNG bytes, SHA, dimensions, local paths and file closure.
Authoring sources/previews remain outside the game tree.

Each 384x768 page is 1,179,648 decoded RGBA bytes. ClipPageCache reserves before
fetch/decode and never exceeds 25,165,824 bytes: at most 21 pages, 23.625 MiB.
Reservations include in-flight/cancelling decodes until settlement. The ceiling
is per active renderer; GPU framebuffers, CPU encoded/image copies, terrain and
driver allocations are separately budgeted. There is no whole-roster or idle
page preload, and no speculative next-page queue. Actors sharing one page
share its texture and decode; each owns UV geometry/material and one releasable
lease. The final lease cancels pending work or disposes texture/bitmap exactly
once. Stale actor/world/clip completions cannot install a texture. Disposing a
renderer retains reservations until outstanding aborted work finishes.

Fetches are same-origin, beneath the relative game root, bounded before decode,
and reject redirects. Pages must match exact byte length, SHA-256 and 384x768
RGBA8 PNG dimensions. Decoded dimensions are checked again. Characters use
nearest sampling, no mipmaps, sRGB, opaque depth-writing alpha test 0.5 and the
96x96 cell foot anchor [48,92]. Atlas pages remain immutable; each actor changes
its own UVs. Rows use the nearest 45-degree sector of heading minus the actual
camera-to-actor bearing, including shoulder offset. Heading zero faces +Z.

## Terrain, camera and quality

The basic kit creates original textured 3D stone terrain and readable physical
stairs; it is an engineering fallback, not accepted complete biome art. Item,
money and known trap cues remain simple distinct geometry pending P18 icon/UI
production. Non-stair exits use visible ring cues; authored story staging remains
later work.

`loadEnvironmentKit(kitId, signal)` loads one explicit local production kit and
its exact-hash PNGs, with a separate 16 MiB decoded-plus-mipmap ceiling. It uses
the environment owner's v1 declarative primitives/material/lighting contract.
The returned EnvironmentKit has `lighting`, synchronous `create(world)` and
`dispose`. Each instance returns `{root, obstacles, syncVisibility, dispose}`.
Instances own geometry/material/instance buffers; the caller owns the shared
kit's textures and must dispose the kit after all its instances. Unknown kit,
material and prop identities fail. World biomeId explicitly selects the kit;
canonical dungeon/section/location bindings are resolved outside rendering.

Terrain uses reusable instanced batches; props use one instanced batch per
reusable part, growing bounded instance buffers only when exploration needs
more capacity. Props provide visual camera obstruction bounds, never domain
collision. Explored-only surfaces are dimmed and unknown surfaces are absent.
The character contact shadow, authored tint, depth testing and terrain lights
keep grounding/readability without expensive dynamic shadow maps.

Camera controls follow the input convention: offset (sin(yaw),cos(yaw)), forward
(-sin(yaw),-cos(yaw)). Follow/orbit/zoom/pitch ease with explicit time; reduced
motion snaps without overshoot. Pitch is clamped to 0.25-0.85 rad and ordinary
zoom to 4.5-12 units. Art bounds bias visible boss framing; portrait aspect expands
distance and shifts world focus above the lower-half control overlay. Ray/box obstruction shortens the arm against projected walls/unknown
cells and authored prop bounds, with an elevated tight-corridor fallback.
These presentation bounds do not alter occupancy or reveal concealed actors.
All silhouette, corridor and boss/device framing still requires manual review.

Desktop caps DPR at 2, pixels at 3.6 million, and effects at 32. Mobile caps DPR
at 1.5, pixels at 1.6 million, and effects at 16. Both disable costly dynamic
shadows/antialiasing and preserve all knowledge-filtered strategic cues.

## Verification and unresolved gates

Permitted evidence is static syntax/lint/types, local import closure, exact art
schema/hash/copy checks and source review. No automated test or capture imports
or executes game source. Existing starter captures execute authoring tools only
and are not production renderer evidence. Runtime camera, context restoration,
repeated transitions, rapid cancellation, mobile frame budgets, and actual
campaign animation/composition acceptance remain unmeasured. Full roster,
non-starter forms, rich pickup UI, encounter staging and campaign binding are
separate package work, not silently substituted by this renderer.
