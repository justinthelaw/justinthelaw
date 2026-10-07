import { blankGeometry, addRoom, cell } from './support.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
/** Original 9x17 tactical composition inside the canonical 56x32 grid. Diglett's
 * isolated ledge is intentional. Source tiles are not copied; no stairs or
 * arbitrary all-enemies trigger can clear the fixed Skarmory encounter.
 * @returns {import('./types.js').Geometry} */
export function buildSteelArena() {
  const map = blankGeometry();
  map.protectedBounds = { x: 5, z: 5, width: 9, height: 17 };
  for (const row of map.cells) for (const tile of row) { tile.terrain = 'void'; tile.impassable = true; tile.unbreakable = true; }
  addRoom(map, { x: 6, z: 6, width: 7, height: 15 });
  for (let z = 6; z <= 20; z++) for (let x = 6; x <= 12; x++) {
    const tile = cell(map, x, z); if (!tile) continue;
    tile.impassable = false; tile.terrain = z === 9 || z === 10 || z < 9 && (x < 8 || x > 10) ? 'void' : 'floor'; tile.room = 0;
  }
  map.entry = { ...STEEL.entryPosition }; map.exit = null;
  map.fixedRoleAnchors = [{ ...STEEL.bossPosition }, { ...STEEL.clientPosition }];
  const entry = cell(map, map.entry.x, map.entry.z); if (entry) entry.required = true;
  return map;
}
