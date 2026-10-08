import { palettes as P } from '../painter.mjs';
export const identity = { name: 'mudkip', speciesId: 'pokemon-258', bodyPlan: 'quadruped', worldHeight: 1.65, features: ['four stout feet', 'large upright head fin', 'orange cheek gills', 'pale broad tail fin', 'wide amphibian mouth'] };
export function draw(a) {
  a.polygon([[-4, 15, -15], [-13, 35, -28], [0, 41, -30], [13, 35, -28], [4, 10, -16]], P.blue[2], 'tail');
  a.line([0, 14, -16], [0, 36, -28], P.blue[0], 1, 'tail', 2);
  a.feet({ x: 11, z: 10, color: P.blue, radius: 4, quadruped: true });
  a.ellipse([0, 20, -4], [16, 13, 19], P.blue); a.ellipse([0, 17, 7], [13, 8, 12], P.blue[2]);
  a.ellipse([0, 37, 15], [20, 17, 16], P.blue, 'head');
  a.polygon([[0, 49, 24], [-3, 70, 13], [0, 80, -1], [3, 67, -6], [2, 51, 1]], P.blue[1], 'head');
  a.line([0, 53, 21], [0, 72, 9], P.blue[2], 2, 'head', 1);
  for (const s of [-1, 1]) a.polygon([[s * 16, 38, 20], [s * 29, 45, 17], [s * 25, 37, 20], [s * 31, 33, 19], [s * 24, 31, 22], [s * 27, 25, 21], [s * 16, 28, 23]], P.orange[1], 'head');
  a.face({ y: 39, z: 18, width: 11, depth: 15 });
}
