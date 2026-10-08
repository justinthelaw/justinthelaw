// Presentation only. Pose completion never emits a game action or damage.
export const clips = [
  ['idle', [240, 200, 240, 200], true, 'breath-blink'],
  ['walk', [110, 110, 110, 110], true, 'alternating-contact'],
  ['turn', [110, 110, 130, 160], false, 'look-plant-settle'],
  ['attack-physical', [140, 90, 110, 180], false, 'anticipation-contact-recovery'],
  ['attack-special', [180, 120, 140, 200], false, 'gather-project-release'],
  ['cast-status', [170, 170, 200, 160], false, 'focus-raise-resolve'],
  ['hit-light', [90, 100, 130, 160], false, 'flinch-recover'],
  ['hit-heavy', [100, 170, 180, 220], false, 'recoil-brace-rise'],
  ['defeat', [150, 200, 240, 800], false, 'stagger-collapse-hold'],
  ['celebrate', [130, 160, 170, 170], false, 'crouch-hop-cheer-land'],
  ['rest-sleep', [320, 500, 640, 500], true, 'settled-closed-eye-breath'],
  ['interact', [180, 150, 190, 190], false, 'notice-greet-nod'],
].map(([id, durationsMs, loop, poseSequence]) => ({ id, durationsMs, frames: 4, loop, restart: 'explicit-caller', end: loop ? 'repeat' : 'clamp-last', poseSequence }));
export function pose(clip, frame) {
  const f = frame;
  const p = { lift: 0, lean: 0, head: 0, reach: 0, spread: 0, turn: 0, curl: 0, eye: 'open', mouth: 0, gait: 0, tail: [0, 1, 0, -1][f], collapse: 0, sleep: false };
  if (clip === 'idle') { p.head = [0, 1, 0, 0][f]; p.eye = f === 3 ? 'blink' : 'open'; }
  if (clip === 'walk') { p.gait = [1, 0, -1, 0][f]; p.lift = [0, 1, 0, 1][f]; p.head = [0, -1, 0, -1][f]; }
  if (clip === 'turn') { p.turn = [-.2, -.38, .2, 0][f]; p.head = [1, 2, 1, 0][f]; p.gait = [0, .5, -.5, 0][f]; }
  if (clip === 'attack-physical') { p.lean = [-3, 5, 8, 0][f]; p.head = [-2, 0, -2, 0][f]; p.reach = [-2, 7, 12, 0][f]; p.mouth = f === 2 ? 1 : 0; }
  if (clip === 'attack-special') { p.lean = [-1, -2, 3, 0][f]; p.head = [2, 4, 1, 0][f]; p.reach = [2, 5, 6, 0][f]; p.spread = [0, 3, 4, 0][f]; p.mouth = [0, 0, 2, 0][f]; p.tail = [0, -3, 4, 0][f]; }
  if (clip === 'cast-status') { p.head = [0, 4, 5, 0][f]; p.spread = [2, 6, 7, 0][f]; p.reach = [0, -2, -3, 0][f]; p.eye = f < 2 ? 'blink' : 'open'; }
  if (clip === 'hit-light') { p.lean = [-5, -3, 1, 0][f]; p.head = [-3, -1, 1, 0][f]; p.eye = f < 2 ? 'hurt' : 'open'; p.spread = [3, 1, 0, 0][f]; }
  if (clip === 'hit-heavy') { p.lean = [-7, -9, -3, 0][f]; p.collapse = [2, 8, 5, 0][f]; p.head = [-4, -7, -2, 0][f]; p.eye = f < 3 ? 'hurt' : 'open'; p.spread = [6, 8, 3, 0][f]; }
  if (clip === 'defeat') { p.lean = [-3, -5, 1, 3][f]; p.collapse = [3, 10, 19, 25][f]; p.head = [-3, -5, -11, -15][f]; p.eye = 'closed'; p.spread = [2, 3, 6, 7][f]; p.curl = [0, 1, 4, 6][f]; }
  if (clip === 'celebrate') { p.collapse = [4, 0, 0, 0][f]; p.lift = [0, 9, 5, 0][f]; p.head = [0, 4, 3, 0][f]; p.spread = [0, 8, 6, 2][f]; p.mouth = [0, 1, 1, 0][f]; p.tail = [0, 5, -4, 0][f]; }
  if (clip === 'rest-sleep') { p.sleep = true; p.collapse = [15, 16, 15, 16][f]; p.head = [-10, -11, -10, -11][f]; p.eye = 'closed'; p.curl = 7; p.tail = [0, 1, 0, 1][f]; }
  if (clip === 'interact') { p.head = [3, 4, -3, 0][f]; p.turn = [-.12, .16, 0, 0][f]; p.reach = [0, 2, 0, 0][f]; p.spread = [0, 4, 2, 0][f]; p.mouth = [0, 1, 0, 0][f]; }
  return p;
}
