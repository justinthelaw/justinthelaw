import { palettes as P } from '../painter.mjs';
export const identity = { name: 'totodile', speciesId: 'pokemon-158', bodyPlan: 'biped-crocodile', worldHeight: 1.8, features: ['broad projecting jaw', 'visible small teeth', 'red dorsal spines', 'yellow chest chevron', 'thick tapering tail'] };
export function draw(a) {
  a.limb([0, 12, -8], [0, 9, -26], 7, P.blue, 'tail'); a.polygon([[-6, 11, -22], [0, 15, -36], [6, 11, -22]], P.blue[1], 'tail');
  a.feet({ x: 11, radius: 5, color: P.blue, claws: true });
  a.ellipse([0, 25, -1], [15, 19, 13], P.blue);
  for (const [y, z] of [[18, -15], [28, -15], [40, -12], [52, -7]]) a.polygon([[-4, y - 5, z], [0, y + 7, z - 8], [4, y - 5, z]], P.red[1]);
  a.polygon([[-10, 31, 11], [0, 25, 14], [10, 31, 11], [7, 18, 11], [0, 14, 13], [-7, 18, 11]], P.cream[1]);
  a.arms({ color: P.blue, x: 14, y: 32, radius: 4 });
  a.ellipse([0, 49, 6], [16, 17, 13], P.blue, 'head');
  a.ellipse([0, 41, 20], [17, 8, 17], P.blue, 'head');
  a.line([-12, 37, 27], [12, 37, 27], '#31576b', 2, 'head', 2);
  for (const s of [-1, 1]) a.polygon([[s * 10, 40, 29], [s * 8, 34, 30], [s * 6, 40, 30]], P.skull[2], 'head', { depth: 3 });
  a.face({ y: 51, z: 9, width: 10, depth: 11, eyes: '#bb684f' });
  for (const s of [-1, 1]) a.ellipse([s * 6, 45, 32], [1, 1, 1], P.blue[0], 'head', { outline: false });
}
