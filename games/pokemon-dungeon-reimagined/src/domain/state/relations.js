import { issue, pointer } from './structure.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} CampaignState */
/** @typedef {import('../../contracts/campaign.js').StateIssue} StateIssue */
/** @typedef {{state:CampaignState, issues:StateIssue[]}} GraphContext */

/** @param {GraphContext} context @param {unknown} condition @param {string} path @param {string} message */
export function requireRelation(context, condition, path, message) {
  if (!condition) issue(context.issues, 'relationship', path, message);
}
/** @param {unknown} value @returns {string} */
export function fingerprint(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(',')}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${fingerprint(v)}`).join(',')}}`;
}
/** @param {GraphContext} context @param {readonly string[]} ids @param {string} path */
export function unique(context, ids, path) {
  requireRelation(context, new Set(ids).size === ids.length, path, 'Duplicate ordered identity.');
}
/** @template T @param {GraphContext} context @param {Record<string,T>} records
 * @param {(record:T)=>string} identity @param {string} path
 */
export function keyed(context, records, identity, path) {
  for (const [key, record] of Object.entries(records)) {
    requireRelation(context, key === identity(record), pointer(path, key), 'Record key differs from its identity.');
  }
}
/** @param {GraphContext} context @param {import('../../contracts/campaign.js').MoveSet} moves @param {string} path */
export function checkMoves(context, moves, path) {
  const slots = moves.slots.filter(slot => slot !== null);
  unique(context, slots.map(slot => slot.moveSlotId), path);
  const grouped = new Set();
  for (const group of moves.links) {
    requireRelation(context, group.length >= 2, path, 'Linked moves require at least two slots.');
    const positions = group.map(id => moves.slots.findIndex(slot => slot?.moveSlotId === id));
    requireRelation(context, positions.every((position, i) => position >= 0 && (i === 0 || position === (positions[i - 1] ?? -2) + 1)), path, 'Move link must follow contiguous slot order.');
    for (const id of group) {
      requireRelation(context, !grouped.has(id), path, 'Move belongs to overlapping linked groups.'); grouped.add(id);
    }
  }
  requireRelation(context, moves.setMoveSlotId === null || slots.some(slot => slot.moveSlotId === moves.setMoveSlotId), path, 'Set move does not resolve.');
}
/** @param {GraphContext} context @param {import('../../contracts/campaign.js').BattleMoves} pp
 * @param {import('../../contracts/campaign.js').MoveSet} moves @param {string} path
 */
export function checkPp(context, pp, moves, path) {
  const ids = moves.slots.flatMap(slot => slot ? [slot.moveSlotId] : []);
  unique(context, pp.slots.map(slot => slot.moveSlotId), path);
  requireRelation(context, pp.slots.length === ids.length && pp.slots.every(slot => ids.includes(slot.moveSlotId) && slot.currentPp >= 0), path, 'PP slots must correspond exactly to learned moves.');
}
/** @param {GraphContext} context @param {import('../../contracts/campaign.js').GridPosition} position
 * @param {import('../../contracts/campaign.js').FloorState} floor @param {string} path
 */
export function inBounds(context, position, floor, path) {
  requireRelation(context, position.x >= 0 && position.z >= 0 && position.x < floor.width && position.z < floor.height, path, 'Position is outside the map.');
}

/** Slot existence is a structural relation within a specified move namespace.
 * @param {import('../../contracts/campaign.js').MoveSet|undefined} moves
 * @param {import('../../contracts.js').MoveSlotId} moveSlotId
 * @param {import('../../contracts.js').MoveId} [moveId]
 */
export function hasMoveReference(moves, moveSlotId, moveId) {
  return moves?.slots.some(slot => slot?.moveSlotId === moveSlotId && (moveId === undefined || slot.moveId === moveId)) ?? false;
}

/** The restored moves and copied channels coexist. Structural references may
 * resolve to either; actor/condition/scheduler/result policies select the legal
 * channel for each saved operation. PP is still checked against its own set.
 * @param {import('../../contracts/campaign.js').SessionActor|undefined} actor
 * @param {import('../../contracts.js').MoveSlotId} moveSlotId
 * @param {import('../../contracts.js').MoveId} [moveId]
 */
export function actorHasMoveReference(actor, moveSlotId, moveId) {
  if (!actor) return false;
  if (hasMoveReference(actor.moves, moveSlotId, moveId)) return true;
  const condition = actor.conditions.invisible;
  const copied = condition?.payload.kind === 'copied-combat' ? condition.payload.projection.moves : null;
  return copied !== null && hasMoveReference(copied, moveSlotId, moveId);
}
