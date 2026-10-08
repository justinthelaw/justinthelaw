import { palettes as P } from '../painter.mjs';
export const identity = { name: 'chikorita', speciesId: 'pokemon-152', bodyPlan: 'quadruped', worldHeight: 1.75, features: ['pear-shaped pale body', 'four stubby legs', 'large curved head leaf', 'green neck buds', 'red eyes'] };
export function draw(a) {
  a.feet({ x: 10, z: 10, radius: 4, color: P.lime, quadruped: true });
  a.ellipse([0, 20, -4], [17, 15, 20], P.lime); a.ellipse([0, 33, 11], [13, 19, 13], P.lime, 'head');
  a.ellipse([0, 46, 13], [16, 14, 14], P.lime, 'head');
  for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; a.ellipse([Math.sin(t) * 13, 29, 8 + Math.cos(t) * 12], [3, 3.5, 3], P.leaf); }
  a.line([0, 55, 13], [0, 67, 10], P.leaf[1], 3, 'head', 12);
  a.polygon([[0, 64, 10], [-7, 73, 4], [-11, 77, -12], [-7, 72, -25], [1, 62, -30], [8, 64, -17], [8, 69, -5]], P.leaf[1], 'head');
  a.line([0, 65, 10], [-3, 71, -12], P.leaf[2], 2, 'head', 1); a.line([-3, 71, -12], [1, 62, -28], P.leaf[0], 1, 'head', 1);
  a.face({ y: 47, z: 16, width: 9, depth: 13, eyes: '#ba647a' });
  a.ellipse([0, 19, -25], [4, 4, 8], P.lime, 'tail');
}
