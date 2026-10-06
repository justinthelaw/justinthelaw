import { palettes as P } from '../painter.mjs';
export const identity = { name: 'meowth', speciesId: 'pokemon-052', bodyPlan: 'biped-cat', worldHeight: 1.75, features: ['oval forehead coin', 'three whiskers each side', 'dark ear backs', 'curled brown-tipped tail', 'cream feline face'] };
export function draw(a) {
  a.limb([0, 12, -8], [13, 13, -20], 3, P.cream, 'tail'); a.limb([13, 13, -20], [17, 26, -21], 3, P.brown, 'tail'); a.ellipse([13, 29, -21], [6, 5, 4], P.brown, 'tail'); a.ellipse([12, 28, -18], [3, 2, 2], P.cream, 'tail', { outline: false, depth: 4 });
  a.feet({ x: 9, color: P.brown, radius: 4 }); a.ellipse([0, 23, 0], [10, 18, 9], P.cream); a.arms({ x: 10, y: 31, color: P.cream, radius: 2.5 });
  for (const s of [-1, 1]) { a.polygon([[s * 6, 53, 3], [s * 19, 74, 0], [s * 22, 52, 4]], '#55434c', 'head'); a.polygon([[s * 11, 57, 6], [s * 18, 68, 3], [s * 18, 53, 7]], P.pink[1], 'head', { outline: false, depth: 1 }); }
  a.ellipse([0, 48, 7], [20, 17, 14], P.cream, 'head');
  a.ellipse([0, 61, 17], [4, 8, 2], P.yellow, 'head', { depth: 3 }); a.line([0, 56, 20], [0, 67, 19], P.yellow[0], 1, 'head', 7);
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) a.line([s * 14, 43, 17], [s * 30, 43 + k * 7, 19], '#65544c', 1.5, 'head', 10);
  a.face({ y: 48, z: 11, width: 10, depth: 13 });
  if (a.front) { a.ellipse([0, 43, 23], [2, 1, 1], '#845b5c', 'head', { outline: false, depth: 8 }); for (const s of [-1, 1]) a.polygon([[s * 4, 39, 22], [s * 5, 35, 22], [s * 7, 39, 22]], P.skull[2], 'head', { depth: 8 }); }
}
