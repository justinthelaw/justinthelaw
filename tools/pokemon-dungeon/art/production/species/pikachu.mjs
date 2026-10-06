import { palettes as P } from '../painter.mjs';
export const identity = { name: 'pikachu', speciesId: 'pokemon-025', bodyPlan: 'biped-mouse', worldHeight: 1.7, features: ['long black-tipped ears', 'red cheeks', 'brown back stripes', 'angular lightning tail', 'short paws'] };
export function draw(a) {
  a.polygon([[0, 12, -8], [10, 16, -15], [8, 27, -18], [17, 29, -21], [12, 41, -25], [30, 48, -28], [31, 32, -26], [23, 29, -22], [26, 19, -19], [15, 17, -16], [14, 9, -12]], P.yellow[1], 'tail');
  a.polygon([[0, 12, -8], [10, 16, -15], [14, 9, -12], [6, 7, -8]], P.brown[0], 'tail');
  a.feet({ x: 10, radius: 4, color: P.yellow }); a.ellipse([0, 23, 0], [14, 19, 12], P.yellow);
  for (const y of [20, 29]) a.polygon([[-11, y, -8], [0, y - 2, -13], [11, y, -8], [10, y + 4, -9], [0, y + 2, -14], [-10, y + 4, -9]], P.brown[0], 'body', { outline: false });
  a.arms({ x: 13, y: 29, radius: 3, color: P.yellow });
  for (const s of [-1, 1]) {
    const flop = a.pose.sleep ? 12 : a.pose.tail;
    a.polygon([[s * 7, 54, 1], [s * 12, 75 - flop, -1], [s * 21, 79 - flop, -2], [s * 21, 70 - flop, 0], [s * 15, 51, 4]], P.yellow[1], 'head');
    a.polygon([[s * 14, 73 - flop, -1], [s * 21, 79 - flop, -2], [s * 21, 73 - flop, 0], [s * 17, 66 - flop, 2]], '#393340', 'head', { outline: false, depth: 1 });
  }
  a.ellipse([0, 47, 5], [18, 15, 14], P.yellow, 'head');
  for (const s of [-1, 1]) a.ellipse([s * 14, 42, 15], [3.5, 4, 3], P.red, 'head', { outline: false, depth: 2 });
  a.face({ y: 49, z: 9, width: 9, depth: 13 });
  if (a.front) a.ellipse([0, 44, 21], [1.5, 1, 1], '#443641', 'head', { depth: 8, outline: false });
}
