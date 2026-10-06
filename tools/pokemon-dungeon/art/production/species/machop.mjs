import { palettes as P } from '../painter.mjs';
export const identity = { name: 'machop', speciesId: 'pokemon-066', bodyPlan: 'muscular-biped', worldHeight: 1.9, features: ['three head ridges', 'defined shoulders and upper arms', 'rib grooves', 'small tail', 'red eyes and broad muzzle'] };
export function draw(a) {
  a.limb([0, 11, -7], [0, 9, -23], 4, P.gray, 'tail');
  a.feet({ x: 11, color: P.gray, radius: 5 }); a.ellipse([0, 24, 0], [13, 19, 10], P.gray); a.ellipse([0, 37, 0], [18, 10, 11], P.gray);
  for (const s of [-1, 1]) { a.ellipse([s * 17, 34, 0], [7, 8, 7], P.gray); a.ellipse([s * 20, 25 + a.pose.spread, 3 + a.pose.reach], [6, 7, 6], P.gray, 'limb'); }
  a.arms({ x: 20, y: 32, color: P.gray, radius: 4 });
  for (const y of [22, 27, 32]) a.line([-8, y, 9], [8, y, 9], P.gray[0], 1);
  a.ellipse([0, 55, 4], [15, 15, 13], P.gray, 'head'); a.ellipse([0, 47, 14], [12, 7, 9], P.gray, 'head');
  for (const x of [-8, 0, 8]) a.polygon([[x - 3, 65, 13], [x - 2, 78, 4], [x + 2, 77, -5], [x + 3, 65, -6]], P.brown[1], 'head');
  a.face({ y: 56, z: 8, width: 9, depth: 12, eyes: '#be625e' });
}
