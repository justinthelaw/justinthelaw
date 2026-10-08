import { palettes as P } from '../painter.mjs';
export const identity = { name: 'skitty', speciesId: 'pokemon-300', bodyPlan: 'quadruped-cat', worldHeight: 1.65, features: ['four dainty paws', 'pink cat ears', 'cream crescent face', 'closed curved eyes', 'long tail with bulb and three knobs'] };
export function draw(a) {
  a.limb([0, 14, -12], [5, 21, -25], 2, P.pink, 'tail'); a.limb([5, 21, -25], [12, 36, -27], 2, P.pink, 'tail');
  a.ellipse([15, 41, -25], [9, 10, 8], P.pink, 'tail');
  for (const [x, y, z] of [[8, 48, -24], [16, 52, -25], [23, 47, -24]]) a.ellipse([x, y, z], [3, 4, 3], P.cream, 'tail');
  a.feet({ x: 9, z: 10, color: P.pink, radius: 3, quadruped: true }); a.ellipse([0, 21, -3], [14, 12, 18], P.pink);
  for (const s of [-1, 1]) { a.polygon([[s * 8, 43, 12], [s * 22, 65, 9], [s * 25, 39, 17]], P.pink[1], 'head'); a.polygon([[s * 14, 45, 16], [s * 21, 57, 12], [s * 21, 43, 18]], P.purple[1], 'head', { outline: false, depth: 1 }); }
  a.ellipse([0, 38, 17], [21, 17, 15], P.pink, 'head');
  a.ellipse([0, 34, 25], [16, 11, 8], P.cream, 'head', { outline: false });
  a.face({ y: 38, z: 22, width: 10, depth: 12, closed: true });
  if (a.front) a.ellipse([0, 33, 35], [2, 1.5, 1], '#a46678', 'head', { outline: false, depth: 8 });
}
