import { palettes as P } from '../painter.mjs';
export const identity = { name: 'eevee', speciesId: 'pokemon-133', bodyPlan: 'quadruped-fox', worldHeight: 1.8, features: ['four slim paws', 'large dark-inner ears', 'full cream neck ruff', 'bushy cream-tipped tail', 'large brown eyes'] };
export function draw(a) {
  a.ellipse([2, 22, -22], [12, 11, 15], P.brown, 'tail');
  a.polygon([[-8, 26, -27], [-4, 34, -34], [0, 42, -39], [6, 35, -34], [12, 25, -29], [5, 25, -29], [2, 20, -30], [-2, 25, -29]], P.cream[1], 'tail');
  a.feet({ x: 10, z: 11, color: P.brown, radius: 3.5, quadruped: true });
  a.ellipse([0, 22, -4], [14, 14, 20], P.brown);
  a.ellipse([0, 29, 11], [18, 13, 15], P.cream);
  for (const s of [-1, 1]) a.polygon([[s * 10, 36, 15], [s * 21, 33, 12], [s * 17, 26, 15], [s * 19, 20, 13], [s * 10, 24, 19], [s * 6, 16, 20], [0, 22, 22]], P.cream[1]);
  for (const s of [-1, 1]) { const droop = a.pose.sleep ? 12 : a.pose.tail; a.polygon([[s * 7, 53, 13], [s * 13, 74 - droop, 9], [s * 25, 79 - droop, 6], [s * 24, 62 - droop, 11], [s * 17, 49, 16]], P.brown[1], 'head'); a.polygon([[s * 12, 57, 16], [s * 21, 76 - droop, 10], [s * 20, 61 - droop, 14], [s * 16, 54, 17]], '#68504a', 'head', { outline: false, depth: 1 }); }
  a.ellipse([0, 47, 17], [18, 16, 15], P.brown, 'head'); a.ellipse([0, 39, 29], [10, 6, 7], P.brown, 'head');
  a.face({ y: 49, z: 21, width: 10, depth: 13, eyes: '#885b45' });
  if (a.front) a.ellipse([0, 42, 36], [2, 1.5, 1], '#3d343b', 'head', { outline: false, depth: 8 });
}
