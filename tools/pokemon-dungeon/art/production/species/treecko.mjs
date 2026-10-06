import { palettes as P } from '../painter.mjs';
export const identity = { name: 'treecko', speciesId: 'pokemon-252', bodyPlan: 'biped-gecko', worldHeight: 1.8, features: ['large gecko head', 'yellow slit eyes', 'red belly', 'two-lobed broad tail', 'round gripping digits'] };
export function draw(a) {
  a.ellipse([-5, 20, -17], [9, 17, 8], P.leaf, 'tail'); a.ellipse([6, 20, -23], [10, 19, 9], P.leaf, 'tail');
  a.line([0, 8, -17], [4, 31, -21], P.leaf[0], 2, 'tail', 8);
  a.feet({ x: 9, color: P.green, radius: 3 });
  a.ellipse([0, 27, 0], [10, 20, 9], P.green); a.ellipse([0, 26, 8], [7, 13, 3], P.red, 'body', { outline: false });
  a.arms({ x: 11, y: 34, radius: 2, color: P.green });
  a.ellipse([0, 54, 5], [20, 16, 15], P.green, 'head');
  for (const s of [-1, 1]) { a.polygon([[s * 9, 62, 1], [s * 23, 68, -3], [s * 19, 48, 2]], P.green[1], 'head'); }
  a.eyePatches({ y: 54, z: 8, width: 12, depth: 16, color: P.yellow, closedColor: P.green });
  a.face({ y: 54, z: 8, width: 12, depth: 16, eyes: '#473d45' });
  a.line([-12, 44, 18], [12, 44, 18], '#356459', 1, 'head', 8);
}
