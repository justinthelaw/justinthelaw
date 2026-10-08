// Newly drawn species-specific polygon silhouettes, layered on an integer grid.
// Facing rows are camera-relative: front, front-right, right, back-right, back,
// back-left, left, front-left. Mirroring is explicit for these symmetric forms.
import { Raster } from './raster.mjs';
const ink = '#352b37';
function painter(raster, direction, bob = 0) {
  const mirror = direction > 4;
  const diagonal = direction % 2 === 1;
  const transform = (x, y) => { const px = diagonal ? 48 + (x - 48) * .86 : x; return [mirror ? 95 - px : px, y + bob]; };
  return {
    p: (points, color) => raster.polygon(points.map(([x, y]) => transform(x, y)), color),
    e: (x, y, rx, ry, color) => raster.ellipse(...transform(x, y), rx, ry, color),
    l: (x, y, ex, ey, color, width = 1) => raster.line(...transform(x, y), ...transform(ex, ey), color, width),
  };
}
function pikachu(r, direction, frame, clip) {
  const view = Math.min(direction, 8 - direction), side = view === 2, rear = view >= 3;
  const step = clip === 'walk' ? [0, -2, 0, 2][frame] : 0;
  const { p, e, l } = painter(r, direction, 4 + (clip === 'idle' ? [0, 0, -1, 0][frame] : 0));
  const yellow = '#f5cb36', light = '#ffe77a', shade = '#cf9130', brown = '#875039';
  // Wide lightning bolt is angular and has its characteristic brown root.
  p([[57, 70], [67, 64], [64, 54], [73, 50], [69, 40], [87, 35], [85, 50], [77, 54], [81, 64], [70, 69], [71, 76], [60, 81]], ink);
  p([[59, 71], [69, 65], [66, 55], [75, 51], [72, 42], [84, 38], [82, 48], [74, 53], [78, 62], [67, 68], [68, 73], [60, 77]], yellow);
  p([[59, 71], [66, 68], [68, 75], [60, 79]], brown);
  e(46, 66, side ? 13 : 17, 19, ink); e(46, 65, side ? 12 : 16, 18, shade); e(44, 63, side ? 10 : 14, 17, yellow);
  // Feet are flat, splayed, never spheres hanging below the body.
  p([[33, 78], [42, 77], [45, 84 + step], [38, 88], [28, 88], [28, 85]], ink);
  p([[34, 79], [41, 79], [42, 84 + step], [37, 86], [30, 86]], yellow);
  p([[49, 79], [57, 77], [67, 85 - step], [66, 88], [55, 88]], ink);
  p([[51, 80], [56, 79], [64, 85 - step], [64, 86], [56, 86]], yellow);
  // Long tapering ears, black tips, distinct forehead/cheek silhouette.
  p([[31, 44], [25, 21], [25, 9], [29, 10], [39, 34], [38, 43]], ink);
  p([[32, 40], [28, 23], [31, 22], [37, 36], [36, 42]], yellow);
  p([[49, 37], [57, 15], [66, 7], [66, 17], [58, 43]], ink);
  p([[52, 37], [58, 22], [63, 19], [57, 40]], yellow);
  p([[31, 36], [42, 32], [53, 33], [60, 39], [64, 49], [61, 57], [54, 61], [37, 61], [27, 55], [26, 46]], ink);
  p([[32, 38], [42, 34], [52, 35], [58, 40], [61, 49], [58, 56], [52, 59], [37, 58], [29, 53], [28, 46]], yellow);
  p([[32, 39], [42, 35], [49, 36], [48, 39], [35, 42], [31, 48], [29, 47]], light);
  if (rear) {
    p([[34, 65], [57, 63], [58, 67], [36, 69]], brown); p([[36, 73], [57, 71], [56, 75], [38, 77]], brown);
    if (view === 3) e(58, 51, 3, 4, '#de5336');
  } else {
    if (!side) { e(view === 1 ? 42 : 36, 46, 2.5, 3.5, ink); e(view === 1 ? 42 : 36, 45, 1, 1, '#fff7cf'); e(31, 52, 3, 3, '#da4b35'); }
    e(side ? 57 : 54, 46, 2.5, 3.5, ink); e(side ? 57 : 54, 45, 1, 1, '#fff7cf');
    e(side ? 58 : 59, 53, 3, 3, '#da4b35');
    p(side ? [[64, 48], [68, 50], [63, 51]] : [[44, 49], [48, 49], [46, 51]], ink);
    if (!side) { l(41, 54, 45, 55, ink); l(45, 55, 49, 53, ink); }
  }
  if (!rear) {
    const reach = clip === 'attack-physical' && frame === 2 ? 7 : 0;
    p([[32, 61], [30 - reach, 68], [35, 72], [39, 68], [37, 62]], ink); p([[33, 62], [32 - reach, 67], [35, 70], [37, 67]], yellow);
    p([[54, 61], [61 + reach, 66], [59, 72], [53, 70]], ink); p([[55, 63], [59 + reach, 67], [57, 70], [54, 68]], light);
  }
}
function charmander(r, direction, frame, clip) {
  const view = Math.min(direction, 8 - direction), side = view === 2, rear = view >= 3;
  const { p, e, l } = painter(r, direction, 3 + (clip === 'idle' ? [0, 0, -1, 0][frame] : 0));
  const orange = '#ed8b3c', light = '#ffb663', shade = '#c85f32', cream = '#ffe4a1';
  const step = clip === 'walk' ? [0, -2, 0, 2][frame] : 0;
  p([[51, 76], [65, 78], [73, 72], [77, 62], [81, 60], [82, 71], [77, 81], [67, 86], [53, 85]], ink);
  p([[54, 77], [66, 80], [75, 73], [78, 64], [80, 64], [79, 73], [75, 80], [65, 83], [53, 82]], shade);
  p([[59, 79], [66, 79], [75, 72], [77, 67], [77, 74], [70, 80], [64, 82]], orange);
  // Flame is attached to tail tip; four distinct flame silhouettes.
  p([[78, 66], [72, 59], [74, 51], [77, 54], [80 + frame % 2, 42], [84, 52], [87, 48 + frame], [89, 58], [85, 65]], '#a84034');
  p([[79, 64], [74, 58], [77, 52], [79, 56], [81, 47], [84, 56], [86, 52], [87, 59], [83, 64]], '#fa6930');
  p([[80, 64], [77, 59], [81, 53], [85, 59], [82, 64]], '#ffd74e'); e(81, 61, 2, 3, '#fff2af');
  p([[40, 52], [51, 51], [60, 65], [61, 78], [54, 85], [35, 85], [30, 77], [33, 65]], ink);
  p([[41, 53], [50, 53], [58, 66], [59, 77], [52, 83], [36, 83], [32, 77], [35, 65]], shade);
  p([[41, 55], [49, 54], [54, 66], [54, 77], [47, 82], [36, 81], [33, 75], [37, 63]], orange);
  if (!rear) { e(side ? 54 : 44, 71, side ? 5 : 10, 12, '#e4b77e'); e(side ? 53 : 43, 69, side ? 4 : 8, 11, cream); }
  p([[35, 77], [42, 79], [41, 85 + step], [34, 89], [24, 89], [26, 84]], ink); p([[35, 79], [40, 81], [38, 85 + step], [32, 87], [27, 87]], orange);
  p([[50, 78], [56, 78], [66, 85 - step], [65, 89], [53, 89], [49, 85]], ink); p([[52, 80], [56, 80], [63, 86 - step], [63, 87], [54, 87]], orange);
  for (const x of [27, 31, 55, 59]) p([[x, 86], [x + 2, 84], [x + 3, 87]], cream);
  // Rounded skull flows into broad muzzle, avoiding a ball-on-stick neck.
  p([[33, 27], [41, 22], [51, 23], [58, 29], [60, 38], [65, 42], [62, 50], [54, 55], [39, 55], [30, 49], [28, 39]], ink);
  p([[34, 28], [41, 24], [50, 25], [56, 30], [58, 40], [63, 43], [60, 49], [53, 53], [39, 53], [32, 48], [30, 39]], orange);
  p([[35, 29], [42, 25], [49, 26], [53, 29], [41, 28], [34, 36], [32, 42], [31, 37]], light);
  p([[34, 47], [43, 49], [55, 47], [60, 43], [61, 48], [53, 52], [39, 52]], rear ? shade : '#ffb467');
  if (!rear) {
    for (const x of side ? [55] : view === 1 ? [43, 56] : [36, 54]) {
      e(x, 37, 3, 5, ink); e(x, 38, 2, 3, '#357178'); e(x, 35, 1, 2, '#fff7dc');
    }
    l(side ? 57 : 38, 47, 57, 46, ink); e(side ? 62 : 47, 43, 1, 1, '#904b33');
  }
  const reach = clip === 'attack-physical' && frame === 2 ? 9 : 0;
  p([[35, 58], [30, 60], [25 - reach, 69], [29, 72], [36, 66]], ink); p([[34, 60], [31, 61], [28 - reach, 68], [30, 69], [34, 65]], orange);
  p([[53, 57], [60, 60], [66 + reach, 67], [63, 71], [56, 66]], ink); p([[55, 59], [60, 63], [63 + reach, 67], [61, 69], [57, 64]], light);
}
function groudon(r, direction, frame, clip) {
  const view = Math.min(direction, 8 - direction), rear = view >= 3;
  const { p, e, l } = painter(r, direction, clip === 'idle' ? [0, 0, -1, 0][frame] : 0);
  const red = '#d9473b', hi = '#f97856', shade = '#982e36', plate = '#e8d5bb';
  const step = clip === 'walk' ? [0, -2, 0, 2][frame] : 0;
  // Long flat plated tail, massive haunches and low forward snout.
  p([[52, 67], [73, 68], [91, 79], [83, 86], [60, 84], [44, 79]], ink);
  p([[55, 69], [72, 70], [87, 79], [81, 83], [60, 81], [49, 77]], shade);
  for (let x = 66; x < 84; x += 6) { p([[x, 73], [x + 4, 71], [x + 7, 77], [x + 3, 79]], red); p([[x + 3, 73], [x + 1, 65], [x + 8, 74]], plate); }
  p([[25, 28], [39, 21], [53, 22], [68, 31], [74, 49], [70, 67], [59, 78], [29, 78], [20, 63], [18, 45]], ink);
  p([[26, 31], [40, 24], [53, 25], [65, 33], [71, 49], [67, 66], [57, 75], [31, 75], [23, 61], [21, 45]], red);
  if (!rear) {
    p([[35, 48], [54, 47], [61, 56], [57, 70], [48, 76], [35, 70], [30, 59]], plate);
    for (let y = 54; y <= 68; y += 7) { l(33, y, 58, y + 2, ink, 2); l(35, y + 3, 55, y + 5, '#fff0d2'); }
  } else {
    for (let y = 37; y < 70; y += 8) { p([[29, y], [43, y - 4], [60, y], [62, y + 5], [43, y + 1], [28, y + 5]], shade); p([[39, y - 3], [44, y - 8], [47, y + 2]], plate); }
  }
  // Separate armored digitigrade thighs; broad toes and three pale claws.
  for (const [x, s] of [[25, step], [51, -step]]) {
    p([[x, 61], [x + 14, 63], [x + 18, 74], [x + 14, 81], [x + 20, 87 + s], [x + 18, 91], [x - 5, 91], [x - 7, 86], [x, 77], [x - 4, 70]], ink);
    p([[x + 1, 64], [x + 12, 65], [x + 15, 74], [x + 11, 81], [x + 17, 86 + s], [x + 16, 88], [x - 3, 88], [x - 4, 86], [x + 3, 77], [x - 1, 70]], red);
    p([[x + 1, 65], [x + 11, 66], [x + 13, 70], [x + 3, 70]], hi);
    l(x + 1, 75, x + 13, 76, ink, 2); l(x - 1, 83, x + 13, 84, ink, 2);
    for (const dx of [-3, 4, 11]) p([[x + dx, 87], [x + dx + 6, 87], [x + dx + 2, 93]], plate);
  }
  // Forelimbs project horizontally; plates and side spikes replace toy cylinders.
  for (const [x, sign] of [[26, -1], [61, 1]]) {
    const reach = clip === 'attack-physical' && frame === 2 ? sign * 5 : 0;
    p([[x, 28], [x + sign * 12, 35], [x + sign * 17 + reach, 52], [x + sign * 16 + reach, 64], [x + sign * 8, 70], [x - sign * 2, 62], [x - sign * 4, 44]], ink);
    p([[x, 31], [x + sign * 10, 38], [x + sign * 14 + reach, 52], [x + sign * 13 + reach, 63], [x + sign * 8, 67], [x, 60], [x - sign * 2, 44]], red);
    p([[x, 32], [x + sign * 9, 38], [x + sign * 11, 44], [x + sign * 2, 40]], hi);
    for (let y = 46; y <= 58; y += 6) l(x + sign * 2, y, x + sign * 12 + reach, y + 3, ink, 2);
    p([[x + sign * 11, 47], [x + sign * 21, 42], [x + sign * 15, 52]], plate);
    for (let c = 0; c < 3; c++) p([[x + sign * (3 + c * 4), 62], [x + sign * (7 + c * 4), 63], [x + sign * (5 + c * 4), 71]], plate);
  }
  // Broad head projects down/forward from the shoulder hump, covering the upper
  // chest. The snout is wider than the skull, not a rectangular head-on-neck.
  const offset = view === 1 ? 5 : 0;
  if (!rear) {
    p([[28 + offset, 28], [37 + offset, 21], [51 + offset, 22], [61 + offset, 29], [65 + offset, 37], [71 + offset, 41], [70 + offset, 49], [59 + offset, 56], [35 + offset, 56], [23 + offset, 48], [22 + offset, 40]], ink);
    p([[30 + offset, 29], [38 + offset, 24], [50 + offset, 25], [59 + offset, 31], [62 + offset, 39], [68 + offset, 42], [67 + offset, 48], [58 + offset, 53], [36 + offset, 53], [26 + offset, 47], [25 + offset, 41]], red);
    p([[32 + offset, 29], [39 + offset, 25], [49 + offset, 26], [54 + offset, 30], [43 + offset, 29], [37 + offset, 32]], hi);
    // Swept brow plates and gold slit eyes sit behind the protruding muzzle.
    p([[28 + offset, 32], [39 + offset, 36], [40 + offset, 40], [30 + offset, 38]], ink);
    p([[54 + offset, 36], [64 + offset, 31], [63 + offset, 38], [53 + offset, 40]], ink);
    l(31 + offset, 36, 36 + offset, 38, '#ffd86a', 2); l(56 + offset, 38, 61 + offset, 35, '#ffd86a', 2);
    l(34 + offset, 36, 34 + offset, 39, ink); l(58 + offset, 35, 58 + offset, 39, ink);
    p([[29 + offset, 40], [41 + offset, 38], [55 + offset, 38], [67 + offset, 42], [66 + offset, 46], [56 + offset, 49], [38 + offset, 49], [27 + offset, 45]], hi);
    p([[29 + offset, 47], [39 + offset, 50], [56 + offset, 50], [66 + offset, 47], [58 + offset, 53], [36 + offset, 53]], shade);
    l(30 + offset, 48, 39 + offset, 51, ink, 2); l(39 + offset, 51, 57 + offset, 51, ink, 2); l(57 + offset, 51, 66 + offset, 48, ink, 2);
    e(36 + offset, 43, 1, 1, ink); e(59 + offset, 43, 1, 1, ink);
    for (const x of [34 + offset, 60 + offset]) p([[x, 49], [x + 3, 49], [x + 1, 53]], '#fff2d4');
    p([[29 + offset, 29], [20 + offset, 25], [24 + offset, 36]], ink); p([[28 + offset, 29], [23 + offset, 28], [25 + offset, 33]], red);
    p([[60 + offset, 29], [68 + offset, 25], [65 + offset, 36]], ink); p([[62 + offset, 30], [66 + offset, 28], [64 + offset, 33]], red);
  } else {
    p([[28 + offset, 28], [37 + offset, 21], [53 + offset, 23], [63 + offset, 31], [63 + offset, 43], [54 + offset, 48], [35 + offset, 47], [25 + offset, 38]], ink);
    p([[30 + offset, 29], [38 + offset, 24], [52 + offset, 26], [60 + offset, 32], [60 + offset, 42], [53 + offset, 45], [36 + offset, 44], [28 + offset, 37]], red);
    l(29 + offset, 34, 60 + offset, 36, ink, 2); p([[39 + offset, 25], [44 + offset, 20], [48 + offset, 28]], hi);
  }
}
export function drawCharacter(name, direction, frame, clip) {
  const raster = new Raster();
  const artists = { pikachu, charmander, groudon };
  if (!artists[name]) throw new Error(`Unknown authored character: ${name}`);
  if (direction === 2 || direction === 6) { profile(raster, name, direction, frame, clip); return raster; }
  artists[name](raster, direction, frame, clip);
  return raster;
}

// Dedicated right/left silhouette drawings: side views never reuse frontal torsos.
function profile(r, name, direction, frame, clip) {
  const { p, e, l } = painter(r, direction, (name === 'pikachu' ? 4 : name === 'charmander' ? 3 : 0) + (clip === 'idle' ? [0, 0, -1, 0][frame] : 0));
  const step = clip === 'walk' ? [0, -2, 0, 2][frame] : 0;
  const reach = clip === 'attack-physical' && frame === 2 ? 6 : 0;
  if (name === 'pikachu') {
    p([[38, 72], [27, 69], [31, 59], [20, 53], [26, 39], [10, 31], [9, 47], [17, 51], [14, 61], [24, 67], [22, 77], [37, 81]], ink);
    p([[37, 74], [25, 75], [27, 66], [17, 59], [20, 50], [12, 45], [12, 35], [23, 41], [18, 54], [28, 60], [25, 70]], '#f5cb36');
    p([[24, 73], [35, 72], [38, 79], [25, 78]], '#875039');
    e(45, 65, 14, 20, ink); e(45, 65, 12, 18, '#cf9130'); e(49, 64, 9, 17, '#f5cb36');
    p([[38, 78], [47, 79], [58, 85 + step], [57, 89], [39, 89], [36, 85]], ink); p([[40, 80], [46, 81], [55, 86 + step], [54, 87], [40, 87]], '#f5cb36');
    p([[42, 39], [32, 15], [32, 8], [37, 11], [48, 37]], ink); p([[43, 35], [37, 22], [39, 21], [47, 36]], '#e5af32');
    p([[48, 38], [47, 13], [51, 5], [55, 8], [55, 22], [55, 39]], ink); p([[50, 36], [50, 22], [53, 18], [53, 37]], '#ffe77a');
    p([[40, 35], [52, 32], [61, 35], [67, 44], [75, 48], [73, 54], [65, 57], [58, 62], [43, 59], [36, 51]], ink);
    p([[41, 37], [52, 34], [60, 37], [65, 46], [72, 49], [71, 52], [64, 55], [57, 60], [44, 57], [38, 50]], '#f5cb36');
    p([[42, 38], [53, 35], [58, 38], [43, 42], [39, 48]], '#ffe77a');
    e(61, 45, 3, 4, ink); e(61, 43, 1, 1, '#fff7dc'); e(58, 54, 4, 4, '#df5037'); l(69, 49, 73, 49, ink, 2); l(64, 54, 68, 54, ink);
    p([[53, 62], [57 + reach, 64], [61 + reach, 72], [57, 75], [51, 69]], ink); p([[54, 64], [56 + reach, 66], [58 + reach, 71], [56, 72], [53, 68]], '#ffe77a');
    p([[33, 65], [39, 63], [40, 67], [34, 69]], '#875039'); p([[34, 73], [40, 72], [40, 76], [36, 77]], '#875039');
  } else if (name === 'charmander') {
    p([[39, 73], [30, 77], [23, 72], [20, 62], [15, 59], [14, 72], [20, 81], [31, 85], [42, 83]], ink);
    p([[39, 76], [29, 80], [20, 74], [18, 64], [16, 64], [17, 72], [22, 79], [31, 82], [41, 80]], '#d57135');
    p([[17, 66], [10, 61], [9, 55], [13, 47], [15, 53], [19, 43 + frame], [21, 54], [24, 57], [22, 63]], '#bb4330');
    p([[17, 64], [12, 59], [13, 52], [16, 56], [19, 48 + frame], [19, 56], [22, 59], [20, 63]], '#ff7937'); p([[17, 63], [14, 58], [18, 53], [20, 59]], '#ffe071');
    p([[45, 51], [56, 51], [58, 62], [65, 71], [62, 82], [54, 85], [37, 82], [34, 72], [40, 61]], ink);
    p([[46, 53], [54, 53], [55, 63], [62, 72], [59, 81], [53, 83], [39, 80], [37, 72], [43, 61]], '#ed8b3c'); p([[54, 59], [55, 64], [61, 72], [59, 80], [54, 82], [52, 74]], '#ffe4a1');
    p([[39, 75], [50, 77], [50, 82], [63, 85 + step], [62, 89], [41, 89], [36, 84]], ink); p([[40, 78], [47, 79], [47, 83], [60, 86 + step], [59, 87], [42, 87], [39, 83]], '#dc7835');
    for (const x of [54, 58]) p([[x, 86], [x + 3, 84], [x + 5, 88]], '#ffe4a1');
    p([[40, 28], [49, 23], [59, 26], [63, 34], [64, 40], [75, 43], [77, 48], [72, 54], [57, 57], [44, 53], [36, 44], [36, 35]], ink);
    p([[41, 30], [49, 25], [57, 28], [61, 35], [62, 42], [73, 45], [74, 48], [70, 52], [57, 55], [45, 51], [38, 43], [38, 35]], '#ed8b3c');
    p([[41, 30], [49, 26], [56, 29], [45, 31], [39, 39]], '#ffb663'); p([[52, 50], [69, 48], [73, 47], [70, 52], [57, 54]], '#ffb663');
    e(58, 37, 3, 5, ink); e(58, 38, 2, 3, '#377980'); e(58, 35, 1, 2, '#fff4db'); e(72, 45, 1, 1, '#904b33'); l(61, 51, 71, 49, ink);
    p([[48, 58], [56, 60], [58 + reach, 69], [54 + reach, 73], [48, 69]], ink); p([[50, 60], [54, 62], [55 + reach, 69], [53 + reach, 70], [50, 67]], '#ffb663');
  } else {
    p([[33, 65], [25, 72], [8, 78], [6, 83], [28, 85], [43, 77]], ink); p([[33, 68], [26, 75], [10, 80], [11, 82], [27, 82], [40, 76]], '#a33136');
    for (let x = 12; x < 30; x += 6) { p([[x, 79], [x + 4, 70], [x + 8, 78]], '#e8d5bb'); l(x, 80, x + 4, 84, ink, 2); }
    p([[35, 24], [49, 19], [62, 26], [69, 40], [68, 59], [59, 76], [36, 81], [25, 69], [24, 45]], ink);
    p([[37, 26], [49, 22], [60, 28], [66, 41], [65, 58], [57, 73], [37, 78], [28, 67], [27, 45]], '#c93d39');
    p([[38, 28], [47, 23], [52, 27], [36, 41], [29, 53], [29, 43]], '#f07150');
    p([[58, 36], [65, 40], [64, 57], [57, 72], [51, 73], [58, 56]], '#d8c4ad'); for (let y = 45; y < 70; y += 7) l(56, y, 65, y - 1, ink, 2);
    for (let y = 32; y < 62; y += 8) { p([[30, y], [21, y - 7], [26, y + 6]], '#e8d5bb'); l(28, y + 6, 38, y + 2, ink, 2); }
    p([[37, 62], [51, 63], [58, 73], [53, 81], [68, 84 + step], [69, 90], [37, 91], [30, 85], [33, 75], [29, 68]], ink);
    p([[37, 65], [49, 66], [55, 73], [49, 81], [65, 86 + step], [65, 88], [38, 88], [33, 84], [36, 75], [32, 69]], '#d9473b'); p([[37, 66], [47, 67], [51, 71], [38, 72]], '#f97856'); l(35, 76, 51, 76, ink, 2); l(36, 83, 54, 84, ink, 2);
    for (const x of [52, 59, 66]) p([[x, 87], [x + 5, 85], [x + 5, 92], [x, 91]], '#e8d5bb');
    p([[51, 36], [62, 37], [67 + reach, 48], [77 + reach, 51], [77 + reach, 60], [65, 66], [55, 56], [48, 43]], ink);
    p([[52, 38], [61, 39], [65 + reach, 50], [74 + reach, 53], [74 + reach, 58], [65, 63], [57, 55], [51, 43]], '#e45340'); l(56, 47, 65 + reach, 46, ink, 2); l(59, 54, 68 + reach, 51, ink, 2);
    p([[64, 46], [67, 36], [70, 49]], '#e8d5bb'); for (const x of [67, 72, 77]) p([[x, 57], [x + 4, 57], [x + 3, 65]], '#e8d5bb');
    const { p: hp, e: he, l: hl } = painter(r, direction, 8 + (clip === 'idle' ? [0, 0, -1, 0][frame] : 0));
    hp([[45, 17], [56, 11], [67, 15], [72, 23], [84, 26], [89, 34], [85, 39], [60, 41], [47, 32], [41, 25]], ink);
    hp([[46, 19], [56, 13], [66, 17], [70, 25], [82, 28], [86, 34], [84, 37], [60, 38], [49, 30], [44, 24]], '#d9473b');
    hp([[48, 19], [56, 14], [64, 17], [59, 19]], '#f97856'); hp([[63, 27], [82, 29], [85, 34], [62, 33]], '#f97856');
    hp([[59, 21], [71, 24], [68, 28], [61, 27]], ink); hl(62, 24, 67, 25, '#ffdc71', 2); hl(65, 23, 65, 26, ink); hl(62, 35, 85, 35, ink, 2); he(82, 30, 1, 1, ink); hp([[74, 36], [78, 36], [76, 40]], '#fff2d4');
    hp([[48, 20], [38, 15], [44, 27]], ink); hp([[46, 20], [41, 18], [45, 24]], '#d9473b');
  }
}
