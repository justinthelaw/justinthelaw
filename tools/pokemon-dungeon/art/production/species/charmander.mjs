import { palettes as P } from '../painter.mjs';
export const identity = { name: 'charmander', speciesId: 'pokemon-004', bodyPlan: 'biped-lizard', worldHeight: 1.8, features: ['rounded muzzle', 'cream ventral patch', 'three-toed feet', 'tapered tail with attached flame', 'teal eyes'] };
export function draw(a) {
  a.limb([0, 12, -7], [8, 9, -20], 6, P.orange, 'tail'); a.limb([8, 9, -20], [15, 22, -28], 3, P.orange, 'tail');
  const f = a.pose.tail;
  a.polygon([[12, 20, -28], [8, 29, -28], [13, 37 + f, -28], [15, 31, -28], [20, 43 + f, -28], [23, 31, -28], [27, 35, -28], [25, 24, -28], [19, 19, -28]], '#e4603d', 'tail');
  a.polygon([[14, 22, -27], [14, 29, -27], [19, 34 + f, -27], [22, 28, -27], [21, 21, -27]], '#ffe07b', 'tail', { outline: false, depth: 1 });
  a.feet({ x: 10, radius: 5, color: P.orange, claws: true });
  a.ellipse([0, 23, 0], [13, 19, 12], P.orange);
  a.ellipse([0, 22, 10], [9, 15, 4], P.cream, 'body', { outline: false });
  a.arms({ color: P.orange, y: 32, x: 12, radius: 3 });
  a.ellipse([0, 48, 3], [16, 17, 14], P.orange, 'head');
  a.ellipse([0, 40, 15], [13, 8, 10], P.orange, 'head');
  a.face({ y: 49, z: 6, width: 9, depth: 14, eyes: '#49898d', muzzle: true });
  if (a.front) for (const s of [-1, 1]) a.ellipse([s * 4, 42, 24], [1, 1, 1], '#92573f', 'head', { outline: false, depth: 8 });
}
