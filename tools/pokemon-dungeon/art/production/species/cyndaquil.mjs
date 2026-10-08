import { palettes as P } from '../painter.mjs';
export const identity = { name: 'cyndaquil', speciesId: 'pokemon-155', bodyPlan: 'low-quadruped', worldHeight: 1.65, features: ['long tapered cream muzzle', 'dark teal arched back', 'closed narrow eyes', 'four short limbs', 'dorsal flame quills'] };
export function draw(a) {
  a.feet({ x: 10, z: 10, radius: 3, color: P.cream, quadruped: true });
  a.ellipse([0, 23, -6], [15, 20, 22], P.cream); a.ellipse([0, 30, -10], [14, 15, 18], P.teal);
  if (!a.pose.sleep) for (const [x, z, h] of [[-10, -15, 13], [0, -20, 21], [10, -13, 16], [-6, -3, 12], [5, -7, 18]]) {
    const f = a.pose.tail;
    a.polygon([[x - 6, 35, z], [x - 7, 46, z - 4], [x - 1, 42, z - 2], [x + 1, 42 + h + f, z - 7], [x + 6, 47, z - 1], [x + 9, 48, z + 3], [x + 5, 35, z + 5]], '#e76442', 'body');
    a.polygon([[x - 3, 36, z + 1], [x, 42 + h * .5, z - 2], [x + 5, 39, z + 3]], '#ffe181', 'body', { outline: false, depth: 1 });
  }
  a.ellipse([0, 41, 10], [13, 15, 14], P.teal, 'head');
  a.ellipse([0, 33, 19], [10, 10, 16], P.cream, 'head');
  a.polygon([[-8, 35, 21], [-4, 30, 38], [0, 29, 42], [4, 30, 38], [8, 35, 21]], P.cream[1], 'head');
  a.ellipse([0, 30, 40], [2, 2, 2], P.teal[0], 'head');
  a.face({ y: 39, z: 14, width: 9, depth: 13, closed: true });
}
