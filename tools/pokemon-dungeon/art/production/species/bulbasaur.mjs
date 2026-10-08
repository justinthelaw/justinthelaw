import { palettes as P } from '../painter.mjs';
export const identity = { name: 'bulbasaur', speciesId: 'pokemon-001', bodyPlan: 'quadruped', worldHeight: 1.7, features: ['four squat legs', 'segmented dorsal bulb', 'wide frog muzzle', 'angular blue-green spots', 'red eyes'] };
export function draw(a) {
  a.feet({ x: 12, z: 12, radius: 5, color: P.green, quadruped: true, claws: true });
  a.ellipse([0, 21, -3], [18, 13, 22], P.green);
  a.ellipse([0, 43, -11], [18, 19, 17], P.leaf);
  a.polygon([[-15, 35, -10], [-8, 47, -15], [0, 64, -12], [5, 44, -3], [14, 37, -5], [0, 28, 3]], P.leaf[1]);
  for (const s of [-1, 1]) { a.line([s * 3, 52, -9], [s * 10, 36, 2], P.leaf[0], 2); a.polygon([[s * 14, 35, 13], [s * 17, 49, 12], [s * 8, 43, 18]], P.green[1], 'head'); }
  for (const s of [-1, 1]) { a.line([s * 5, 59, -22], [s * 12, 43, -26], P.leaf[0], 2); a.line([s * 12, 43, -26], [s * 7, 28, -18], P.leaf[0], 2); }
  a.line([0, 61, -24], [0, 30, -28], '#295643', 2);
  a.ellipse([0, 33, 17], [19, 16, 15], P.green, 'head');
  a.ellipse([0, 25, 26], [16, 8, 9], P.green, 'head');
  for (const s of [-1, 1]) { a.polygon([[s * 4, 46, 23], [s * 9, 43, 25], [s * 6, 39, 29]], P.teal[1], 'head', { outline: false }); a.polygon([[s * 15, 30, 24], [s * 19, 27, 23], [s * 16, 24, 28]], P.teal[1], 'head', { outline: false }); a.ellipse([s * 18, 23, -7], [1, 3, 4], P.teal[1], 'body', { outline: false }); }
  a.face({ y: 35, z: 19, width: 11, depth: 15, eyes: '#a94f66' });
  if (a.front) for (const s of [-1, 1]) a.ellipse([s * 5, 28, 34], [1, 1, 1], '#34545b', 'head', { outline: false, depth: 8 });
}
