import { ESCORT_SPATIAL_FACTS as FACTS } from '../../../content/authored/escort-spatial-facts.js';
import { cell } from './support.js';
/** Native ordinary entry uses exactly the first source offset segment, twice:
 * same spawn room first, then any room. Leader/locked partner precede actual
 * remaining native slots. Only monster occupancy and species CanStand matter;
 * floor items/traps/exits do not become invented placement blockers.
 * Existing independent browser floor geometry/anchor remains qualified.
 * @param {import('./types.js').Geometry} map
 * @param {readonly import('./types.js').NativePartyMember[]} members
 * @param {import('./types.js').GenerationDependencies} dependencies @param {number} tileset
 * @returns {import('./types.js').Position[]|null} */
export function placeNativeEscortParty(map,members,dependencies,tileset) {
  if (!map.entry || !members.length || members.length > 4 || new Set(members.map(row => row.slot)).size !== members.length || members.some(row => !Number.isInteger(row.slot) || row.slot < 0 || row.slot >= 4 || !['leader','locked-partner','member'].includes(row.priority)) || members.filter(row => row.priority === 'leader').length !== 1 || members.filter(row => row.priority === 'locked-partner').length > 1) throw new TypeError('Invalid actual native party placement owner.');
  const origin = map.entry,room = cell(map,origin.x,origin.z)?.room;
  const occupied = new Set(),positions = new Map();
  const rank = (/** @type {typeof members[number]} */ row) => row.priority === 'leader' ? 0 : row.priority === 'locked-partner' ? 1 : 2;
  const ordered = [...members].sort((a,b) => rank(a)-rank(b) || a.slot-b.slot);
  for (const member of ordered) {
    const native = dependencies.navigation.mobility(member.identity.speciesId,member.identity.formId).movementType;
    const liquid = dependencies.navigation.liquid(tileset);
    const mobility = native === 4 ? liquid === 'lava' ? 1 : 0 : native === 5 ? liquid === 'lava' ? 0 : 1 : native;
    let selected = null;
    for (let pass = 0; pass < 2 && selected === null; pass++) for (const [dx = 0,dz = 0] of FACTS.entryOffsets) {
      const position = { x: origin.x+dx,z: origin.z+dz },tile = cell(map,position.x,position.z);
      if (!tile || tile.impassable || occupied.has(position.z*56+position.x) || pass === 0 && tile.room !== room) continue;
      const normal = tile.terrain === 'floor',secondary = tile.terrain === 'water' || tile.terrain === 'lava';
      if (mobility === 0 && !normal || mobility === 1 && !normal && !secondary || mobility === 2 && !normal && !secondary) continue;
      selected = position; break;
    }
    if (!selected) return null;
    occupied.add(selected.z*56+selected.x); positions.set(member.slot,selected);
  }
  return members.map(row => positions.get(row.slot) ?? (() => { throw new TypeError('Missing genuine native slot placement.'); })());
}
