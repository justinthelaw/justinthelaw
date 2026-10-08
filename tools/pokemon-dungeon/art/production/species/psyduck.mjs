import { palettes as P } from '../painter.mjs';
export const identity = { name: 'psyduck', speciesId: 'pokemon-054', bodyPlan: 'duck', worldHeight: 1.7, features: ['broad pale duck bill', 'three black head hairs', 'round yellow body', 'webbed feet', 'vacant large eyes'] };
export function draw(a) {
  a.polygon([[-6, 12, -10], [0, 26, -25], [7, 13, -11]], P.yellow[1], 'tail');
  for (const s of [-1, 1]) { const step = a.pose.gait * s * 4; a.polygon([[s * 7, 8, step], [s * 15, 4, 6 + step], [s * 14, 3, 13 + step], [s * 5, 3, 13 + step], [s * 3, 5, 7 + step]], P.cream[1], 'limb'); }
  a.ellipse([0, 24, -2], [18, 21, 15], P.yellow);
  a.arms({ x: 17, y: a.pose.eye === 'hurt' ? 46 : 31, color: P.yellow, radius: 4 });
  a.ellipse([0, 49, 6], [19, 18, 16], P.yellow, 'head');
  for (const s of [-1, 0, 1]) a.line([s * 3, 64, 3], [s * 6, 75 - Math.abs(s) * 3, 1], '#493d41', 2.5, 'head');
  a.ellipse([0, 40, 23], [13, 7, 13], P.cream, 'head'); a.line([-9, 39, 31], [9, 39, 31], '#bc9465', 1, 'head', 6);
  a.eyePatches({ y: 52, z: 12, width: 10, depth: 13, color: P.skull[2], closedColor: P.yellow });
  a.face({ y: 52, z: 12, width: 10, depth: 13 });
}
