import { palettes as P } from '../painter.mjs';
export const identity = { name: 'squirtle', speciesId: 'pokemon-007', bodyPlan: 'biped-turtle', worldHeight: 1.65, features: ['brown segmented shell', 'pale shell rim', 'cream plated belly', 'curled blue tail', 'rounded blue head'] };
export function draw(a) {
  a.limb([0, 12, -10], [10, 12, -22], 5, P.blue, 'tail'); a.ellipse([13, 19, -24], [8, 8, 6], P.blue, 'tail');
  a.line([17, 20, -22], [12, 23, -22], P.blue[0], 2, 'tail', 8); a.line([12, 23, -22], [10, 18, -22], P.blue[0], 2, 'tail', 8); a.line([10, 18, -22], [14, 16, -22], P.blue[0], 2, 'tail', 8);
  a.feet({ x: 10, radius: 5, color: P.blue });
  a.ellipse([0, 25, -4], [17, 19, 13], P.cream);
  a.ellipse([0, 26, -9], [15, 17, 12], P.brown);
  for (const s of [-1, 1]) { a.line([0, 41, -17], [s * 9, 31, -19], '#755344', 2); a.line([s * 9, 31, -19], [s * 7, 18, -19], '#755344', 2); a.line([s * 7, 18, -19], [0, 10, -16], '#755344', 2); }
  a.ellipse([0, 23, 7], [12, 17, 7], P.cream);
  for (const y of [16, 24, 31]) a.line([-10, y, 12], [10, y, 12], P.cream[0], 1);
  a.arms({ color: P.blue, x: 15, y: 33, radius: 4 });
  a.ellipse([0, 49, 8], [18, 16, 15], P.blue, 'head'); a.ellipse([0, 42, 18], [14, 7, 8], P.blue, 'head');
  a.face({ y: 50, z: 10, width: 10, depth: 14, eyes: '#71456b' });
}
