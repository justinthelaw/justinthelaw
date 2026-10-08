import { palettes as P } from '../painter.mjs';
export const identity = { name: 'torchic', speciesId: 'pokemon-255', bodyPlan: 'chick', worldHeight: 1.55, features: ['fluffy orange chick', 'three-point head tuft', 'yellow beak', 'tiny yellow wings', 'three-toed bird feet'] };
export function draw(a) {
  for (const s of [-1, 1]) {
    const gait = a.pose.gait * s;
    a.limb([s * 7, 14, 0], [s * 7, 4 + Math.max(gait, 0) * 3, gait * 4], 2, P.yellow, 'limb');
    for (const t of [-1, 0, 1]) a.line([s * 7, 4, gait * 4], [s * 7 + t * 4, 3, 7 + gait * 4], P.yellow[1], 2, 'limb', 1);
  }
  a.ellipse([0, 24, -1], [16, 18, 14], P.orange);
  a.polygon([[-5, 24, -13], [0, 33, -23], [5, 24, -13]], P.orange[1], 'tail');
  a.arms({ x: 15, y: 29, color: P.yellow, wing: true });
  a.ellipse([0, 47, 5], [19, 18, 16], P.orange, 'head');
  a.polygon([[-10, 59, 4], [-12, 72, 1], [-3, 68, 4], [0, 79, 4], [5, 69, 6], [12, 72, 5], [10, 59, 5]], P.orange[1], 'head');
  a.polygon([[-5, 61, 13], [-4, 70, 11], [0, 67, 13], [5, 70, 12], [5, 60, 14]], P.yellow[1], 'head', { outline: false });
  a.ellipse([0, 41, 21], [6, 4, 7], P.yellow, 'head'); a.line([-4, 40, 25], [4, 40, 25], P.orange[0], 1, 'head', 5);
  a.face({ y: 49, z: 9, width: 10, depth: 14 });
}
