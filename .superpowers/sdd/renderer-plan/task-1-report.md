# Archived renderer/projection task report

Historical P10 boundary and Three renderer implementation, now retired by the
[Canvas 2D Blue opening](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md).
[Original report](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/.superpowers/sdd/renderer-plan/task-1-report.md).
The source paths/contracts below describe that former game tree, not present work.

## Implementation and ownership evidence

`src/presentation/{types,projection,index}.js` produced detached, recursively
frozen world/actor/pickup/render snapshots with explicit visibility and appearance.
`src/rendering/` owned lifecycle, actor UV/animation, page cache, follow/orbit
camera and instanced terrain/props. A v1 EnvironmentKit adapter shared caller-owned
textures; scene instances disposed only their own buffers/materials/geometry.
Narrow shared edits corrected primitive DeepReadonly handling and rendering-only
crypto/createImageBitmap lint globals. The retired API contract was
`plan/RENDERER-CONTRACT.md`.

The API exposed readiness/error/context callbacks, quality/reduced motion,
world/actor/pickup sync, camera controls, update/resize/dispose and readonly
metrics/yaw. The caller owned domain-input readiness, timing and epoch/revision
serialization. No fake campaign/startup demonstration or root input/UI change
was included.

The cache reserved 1,179,648 bytes before each fetch/decode: 21 pages = 23.625 MiB,
under 24 MiB. Reservations survived cancellation through settlement; leases shared
decode/texture while retaining independent UV/materials. Last release disposed
once; generation tokens prevented stale completion. There was no speculative
roster preload. Context restoration reuploaded retained resources without changing
simulation; reduced motion changed presentation only.

## Recorded checks and limits

The static export copied 192 original starter pages. Independent checks passed
schema, manifest pin, hashes, dimensions, exact source bytes and relative paths.
Strict JSDoc checking parsed 58 authored files; lint/import closure covered 113.
Scoped ESLint and staged hooks passed after concurrent authoring errors cleared.
No game import/execution, automated capture or playthrough was run.

Application wiring, actual campaign staging, effective appearance/visibility
resolvers, non-starter art, P18 UI, corridor/boss framing, mobile performance,
hidden-page timing and context-loss/rapid-transition acceptance remained open.
Authoring captures did not establish runtime or campaign correctness. Later roster
work is separately recorded in the [atlas report](../FULL-GAME-EXECUTION/runtime-roster-report.md).

## Review repair: prop transforms

Review P2 (`task-1-review.md` in the historical work) found additive Euler yaw
failed to rotate tilted multipart props rigidly. The repair composed
`parent = T(tileX*2,0,tileZ*2) * Ry(yaw)` and
`local = T(part.position) * Rxyz(part.rotation)`, then used `parent * local` for
both instances and camera bounds, matching the authoring viewer.

Runtime geometry already baked in part dimensions, so both matrix scales stayed
one; applying size again would double-scale. The `fossil-ribs` witness changed a
cylinder's Y axis to `(sin(a), cos(a), 0)` under `Ry(pi/2) * Rx(a)`, instead of
`(0, cos(a), sin(a))` under additive Euler ordering. This was source/matrix evidence,
not a runtime test; instancing, allocation and disposal ownership were unchanged.
