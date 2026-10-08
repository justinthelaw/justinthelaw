# P09-A input adapter boundary

This bounded adapter owns keyboard and camera gesture intent. It does not
complete P09, bind the development shell to a campaign, or provide game rules.
All runtime imports are local relative JavaScript modules. No listeners are
installed until the composition root explicitly creates a controller.

## Public API

`src/input/index.js` exports `createInputController`. The following notation
describes the strict JSDoc types implemented in `controller.js` and `map.js`;
runtime source remains JavaScript.

```ts
type Direction = { readonly dx: -1 | 0 | 1; readonly dz: -1 | 0 | 1 };
type InputMode = 'world' | 'menu' | 'dialogue' | 'blocked';
type InputContext = {
  mode: InputMode;
  epoch: string | null;
  revision: number | null;
  worldReady: boolean;
  cameraYaw: number;
  controlDirection: 'camera' | 'grid';
};
type ApplicationIntent =
  | { readonly type: 'move' | 'face'; readonly direction: Direction }
  | { readonly type: 'primary' | 'cancel' | 'wait' | 'confirm' }
  | { readonly type: 'moveSlot'; readonly slot: 0 | 1 | 2 | 3 }
  | { readonly type: 'panel'; readonly panel: 'menu' | 'context' | 'map' | 'inventory' | 'tactics' }
  | { readonly type: 'navigate'; readonly direction: Direction };
type CameraIntent =
  | { readonly type: 'cameraAdjust'; readonly yaw: number; readonly zoom: number }
  | { readonly type: 'cameraRecenter' };
type IntentEnvelope = {
  mode: InputMode;
  epoch: string | null;
  revision: number | null;
  intent: ApplicationIntent | CameraIntent;
};
type InputOptions = {
  target: Document;
  cameraSurface: HTMLElement;
  onIntent: (envelope: IntentEnvelope) => void;
};
type InputController = {
  setContext: (context: InputContext) => void;
  flush: () => Direction | null;
  cancel: () => void;
  dispose: () => void;
};
function createInputController(options: InputOptions): InputController;
```

`target` must have a live `defaultView`; `cameraSurface` must belong to that
document. The controller starts blocked. The root supplies a fresh context
snapshot before accepting input and after every application transition.
`world` requires a nonempty epoch and nonnegative safe-integer revision;
other modes can use null when no Adventure is bound. A nonfinite yaw becomes
zero. Invalid mode, direction mode, epoch, revision or readiness throws without
changing the previous context. The context is copied, not retained by alias.

`flush()` has no time parameter, timer or animation loop. The root calls it
after the bridge's synchronous key dispatches, normally once per render frame.
It emits at most one application intent and one independently bounded camera
intent, camera first. It returns the currently selected world direction, or
null, for later orientation feedback. This return value is not legality or
visual metadata. Calls during a sink callback or after disposal return null.
Sink errors propagate; already emitted intents remain consumed.

## Readiness, queues and acknowledgment

The adapter holds one pending discrete application activation and one bounded
movement pulse. Sequential Up + Right updates the same movement press group to
one diagonal. A group ends when all owned movement keys are released. While a
group remains held, flush uses its current combined direction: releasing Right
while still holding Up selects Up. If the whole group finishes before flush, its
last combined press direction is retained as exactly one completed pulse. This
includes the website D-pad's synchronous keyboard/assistive press-and-release
activation. Opposing directions cancel, including W + Up versus Down.

The first completed pulse wins over later movement presses until consumed or
cancelled; extra completed taps cannot grow a backlog. Discrete application
actions still have priority over movement. A held movement emission consumes its
group's pulse, so later key releases cannot create a second movement. Release
ends held repetition, not an unconsumed completed tap. The pulse captures its
direction/facing and camera yaw at the last combined press; live held movement
uses camera yaw at flush. Revision/epoch/mode changes and interruption cancel
the pulse. A revision change preserves live holds but prevents their later
release from recreating a pulse from the previous context.
Menu/dialogue navigation queues one activation per press/release and never
inherits the world held-movement path.

Move, face, primary, wait and move-slot intents require `worldReady` and consume
a one-use permit before the sink runs. Repeated flushes and identical
`setContext()` values do not rearm that permit. A held direction against a wall
therefore emits once even if the rejected command leaves revision and readiness
unchanged. Rearming requires one of:

- A changed revision/epoch/mode with readiness true.
- An explicit readiness false-to-true transition.
- A fresh direction key activation from a neutral combined direction, while
  ready, or a newly queued discrete world action while ready.

Key release alone does not rearm. A player can release and press to retry a
rejected move. The root can explicitly signal readiness false then true if its
accepted scheduling policy permits a held retry; it must not pulse readiness on
every frame. There is no inferred gameplay repeat rate or elapsed-turn catch-up.
Panel and cancel intents do not require world readiness. They still share the
single application emission limit. While not ready, at most one discrete action
is retained and the held direction/completed pulse supplies one movement candidate.
The discrete action takes priority over movement.

The sink is a synchronous application boundary. Before doing any work, it must
compare envelope epoch/revision/mode to the active binding. It then resolves
primary action, selected move slot and UI intent against the current state once.
Only that application/domain boundary determines IDs, legality, costs, attack
versus interaction, scene cursors and accepted/rejected results. The adapter
does not interpret a return value as acknowledgment. The root synchronously
publishes resulting context/readiness with `setContext`; a queued envelope is
discarded when epoch, revision or mode changes. Revision changes preserve held
movement but discard pending actions and camera adjustments. Epoch changes and
all mode transitions cancel every key, pointer and pending intent. This is
stricter than only clearing movement when leaving the world.

`cancel()` clears all state and consumes the current permit without emitting.
Fresh presses can subsequently reactivate ready input. `dispose()` does the same
and removes every listener; repeated disposal and later context updates are safe.

## Bindings and ownership

| Input | World | Menu/dialogue |
| --- | --- | --- |
| WASD / arrows | Combined eight-direction movement | One navigation activation per press |
| ShiftLeft + direction | Facing intent | Shift-modified navigation is ignored |
| Z / bridge A | Primary action | Confirm |
| X / bridge B | Cancel | Cancel |
| Enter / bridge Start | Menu panel | Confirm |
| ShiftRight / bridge Select | Map panel | Ignored |
| Escape / bridge Menu | Context panel | Cancel |
| Space | Wait | Ignored |
| 1–4 | Selected move slot 0–3 | Ignored |
| I / T / M | Inventory / tactics / map | Ignored |
| Q / E | Orbit by -/+ π/8 radians per press | Ignored |
| R | Recenter camera | Ignored |

Only owned keys prevent browser defaults. Actions, menus, navigation and orbit
ignore browser repeat and duplicate keydowns until release. Native trusted keys
and untrusted bridge keys have separate ownership lanes; a synthetic ArrowUp
release cannot release a physically held ArrowUp. The website bridge remains
responsible for aggregating its own touch pointer roles into key events. Synthetic
trust is an ownership distinction, not an authentication boundary.

Typing focus is checked through the composed event path and the active-element
chain, descending through nested open shadow roots, for input, textarea, select
and contenteditable elements. This also protects synthetic bridge events that
target the document's active shadow host. A closed shadow component must put
`data-input-typing` on its host while its editable owns focus; the adapter cannot
inspect a closed root. The marker is also respected through event paths and
camera control exclusions. Focus entering a typing field cancels input.
Ctrl, Meta, Alt and composing key events cancel owned state
without preventing browser behavior. Shift is accepted only for ShiftLeft
facing and the exact ShiftRight Select binding. Unrelated browser keys are left
alone. Keyboard listeners attach to the supplied document, so the existing
website's bubbling, composed bridge events reach the same adapter as native keys.

## Camera and coordinates

Only a primary-button/touch press in the upper half of `cameraSurface` starts
camera ownership. Controls and HUD regions are excluded through the composed
path: native controls/links, editable nodes, button/menu/dialog roles and
`data-input-control` / `data-input-hud` markers. P18 must mark noninteractive HUD
containers and keep the surface rectangle aligned with the world viewport.

Each captured camera pointer has its own ID and previous x coordinate. A pointer
retains its camera role while crossing a control; pointerup releases only that
pointer and cannot activate a crossed button. Capture failure leaves it unowned.
Multiple camera pointers accumulate bounded orbit deltas without sharing pointer
positions. There is no pinch gesture in this adapter. Browser default touch
gestures may cause cancellation; P18 must set appropriate `touch-action` on its
camera surface. The adapter does not alter DOM style or create an overlay.

Horizontal drag maps to `-deltaX * 0.005` radians, bounded to ±π/4 per event.
Wheel maps pixels / 600 to normalized zoom, with line units treated as 16 pixels
and page units as surface height. Wheel starts obey the same upper-world/control
exclusions. Ctrl/Meta wheel is never consumed, preserving browser zoom.
Accumulated camera adjustments are bounded to ±π/2 yaw and ±1 normalized zoom per
flush. Recenter supersedes adjustments pending in that flush. Positive zoom
requests increased distance; P10 owns actual distance and obstruction clamps.
These values are presentation tuning, not original-game mechanics or turn costs.

Grid mode is up `(0,-1)` and right `(1,0)`. Camera mode uses ground-forward
`(-sin(yaw),-cos(yaw))` and ground-right `(cos(yaw),-sin(yaw))`, combines axes, then
snaps to the nearest of eight sectors. Yaw is wrapped by `2π`; half-sector ties
round toward increasing `atan2` angle and negative zero becomes zero. No grid
corner/path legality is guessed. P10/P18 consume the selected direction to
present orientation and legal target feedback with simulation-supplied data.

## Cleanup and remaining acceptance

Document pointer cancellation, window blur/pagehide, hidden visibility, typing
focus, explicit cancellation, context replacement and disposal clear all held
owners, pending actions/camera intent and captured pointers. Unexpected loss of
an owned camera capture also clears all state. Intentional capture release
removes the ID first, so its later lost-capture event does not clear other active
pointers. Hidden documents cannot enqueue or flush input. Disposal removes the
same key, focus, visibility, pointer, wheel and window listeners it installed.

The controller is not yet wired to bootstrap, a scheduler, Adventure or UI.
P18 still owns direct-entry accessible touch controls, exact screen layout,
show/hide preferences, safe areas and pressed feedback. The existing website
overlay is consumed unchanged. Remapping and gamepad support are not claimed.
Static lint/type review is permitted; game-source execution and automated input
tests are prohibited. Later authorized manual acceptance must cover diagonal
bridge presses, blocked moves, readiness acknowledgment, simultaneous trusted
and synthetic keys, typing/shadow focus, yaw boundaries, multi-pointer capture,
camera/HUD crossings, interruption cleanup and complete game UI integration.

## Opening application consumer — 2026-10-06

`src/shell/application.js` now composes this adapter with canonical Adventure
commands. A 240 ms presentation admission interval bounds world `flush()` calls;
current generation actor synchronization is a second independent gate. Revision
and epoch contexts remain fresh, held movement survives ordinary revisions,
rejected/no-change actions rearm a single permit, and no timer advances turns.
Menus/dialogue/typing, replacement, blur, visibility and context loss interrupt
world input. Website touch controls remain the sole emulator overlay owner.
Human keyboard/touch acceptance remains open.

## V19 automatic work readiness — 2026-10-08

The shell now separates asset readiness from canonical `leaderInputReady`.
Continuing work cancels queued/held player input and disables action controls,
including face, move SET and equipment. Adventure's central gate independently
blocks player mutations, so renderer readiness never grants simulation authority.
Menus, inspection, camera, save/export and their existing typing controls remain
usable without consuming simulation time. Cadence resumes only at real input.

One owned RAF pump advances at most one finite committed unit per frame, captures
binding/Adventure epochs plus snapshot/revision and obtains fresh commandContext
only after rechecking them. It pauses/cancels on replacement/load/disposal,
hidden document, graphics loss, blur and menu/save pause; assets-ready load of
continuing resumes the saved PC. The280ms player clip-idle delay is not applied
to automatic chunks. See [TURN-CONTINUATION.md](TURN-CONTINUATION.md). Static
inspection does not replace human keyboard/touch/device/interruption acceptance.
