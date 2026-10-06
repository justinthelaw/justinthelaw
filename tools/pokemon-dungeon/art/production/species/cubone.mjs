import { palettes as P } from '../painter.mjs';
export const identity = { name: 'cubone', speciesId: 'pokemon-104', bodyPlan: 'biped-bone-wielder', worldHeight: 1.75, features: ['ivory skull helmet', 'two rear skull horns', 'deep eye sockets', 'projecting skull snout', 'held bone and brown tail'] };
export function draw(a) {
  a.limb([0, 12, -8], [7, 9, -24], 5, P.brown, 'tail'); a.feet({ x: 10, color: P.brown, radius: 5, claws: true });
  a.ellipse([0, 24, 0], [13, 18, 11], P.brown); a.ellipse([0, 24, 9], [8, 13, 3], P.cream, 'body', { outline: false }); a.arms({ x: 13, y: 31, color: P.brown, radius: 3 });
  const by = 23 + a.pose.spread, bz = 5 + a.pose.reach, swing = a.pose.reach * .65;
  a.line([19, by - 6, bz], [27 + swing, by + 11 - swing, bz + swing], P.skull[0], 7, 'limb', 4); a.line([19, by - 6, bz + 1], [27 + swing, by + 11 - swing, bz + 1 + swing], P.skull[1], 5, 'limb', 5);
  for (const [x, y] of [[17, by - 7], [21, by - 7], [25 + swing, by + 12 - swing], [29 + swing, by + 11 - swing]]) a.ellipse([x, y, bz], [3, 3, 3], P.skull, 'limb', { depth: 8 });
  a.ellipse([0, 46, 5], [16, 17, 14], P.brown, 'head');
  for (const s of [-1, 1]) a.polygon([[s * 9, 58, -1], [s * 18, 73, -6], [s * 20, 56, 0]], P.skull[1], 'head');
  a.ellipse([0, 52, 7], [19, 18, 16], P.skull, 'head'); a.ellipse([0, 43, 20], [12, 9, 13], P.skull, 'head');
  for (const s of [-1, 1]) { a.ellipse([s * 5, 46, 30], [2, 2, 2], '#70695c', 'head', { depth: 3 }); }
  a.eyePatches({ y: 52, z: 12, width: 12, depth: 15, color: '#665b58', rx: 5, ry: 7 });
  a.face({ y: 52, z: 12, width: 12, depth: 15, eyes: '#bb9a70' });
  a.line([0, 66, 15], [-3, 60, 20], '#a09a84', 1, 'head', 6); a.line([-3, 60, 20], [0, 58, 22], '#a09a84', 1, 'head', 6);
}
