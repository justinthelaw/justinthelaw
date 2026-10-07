import { AI_ACTION_FACTS, REGULAR_ATTACK_WEIGHTS, WILD_ACTIVE_IQ } from '../../../content/ai-facts.js';
import { DIRECTIONS, canMeleeAttack } from '../navigation/geometry.js';
import { isActuallyInSight } from '../navigation/sight.js';
import { activeActors } from './move-targets.js';
import { draw, facing, navActor, navigationContext, blocked } from './support.js';

/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../../contracts/campaign.js').ResolvedAction} Action */
/** @typedef {NonNullable<import('../../contracts/campaign.js').CampaignState['session']>} Session */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {typeof AI_ACTION_FACTS[number]} Fact */
/** Explicit admission, not a move-weight filter. Broader wild/partner selection
 * remains a recorded consumer obligation until its effects/AI branches close. */
const MOVES = Object.freeze(['move-peck', 'move-growl', 'move-tackle', 'move-tail-whip', 'move-harden', 'move-confusion', 'move-rapid-spin', 'move-defense-curl', 'move-bide', 'move-meditate', 'move-take-down', 'move-focus-energy', 'move-vice-grip', 'move-leer', 'move-sand-attack']);
/** @param {Actor} actor @param {string} moveId */
function selfEligible(actor, moveId) {
  if (moveId === 'move-meditate') return actor.stages.attack < 20;
  if (['move-harden', 'move-defense-curl'].includes(moveId)) return actor.stages.defense < 20;
  if (moveId === 'move-bide') return actor.conditions.bide?.statusId !== 'bide';
  if (moveId === 'move-focus-energy') return actor.conditions.sureShot?.statusId !== 'focus-energy';
  return true;
}
/** @param {Actor} actor @param {Actor} target @param {string} moveId @param {Fact} fact */
function targetEligible(actor, target, moveId, fact) {
  if (target.affiliation === 'neutral' || target.affiliation === actor.affiliation || target.resources.hp === 0 || target.placement.kind !== 'map') return false;
  if (target.conditions.frozen?.statusId === 'frozen' && fact.cannotHitFrozen) return false;
  if (['move-leer', 'move-tail-whip'].includes(moveId)) return target.stages.defense > 0;
  if (moveId === 'move-sand-attack') return target.stages.accuracy > 0;
  if (moveId === 'move-growl') return target.stages.attack > 0;
  return true;
}
/** Current scoped wild IQ has neither Course Checker nor targeting-weight IQ.
 * Range0x80 therefore has no extra terrain/line-clearance check in AI: native
 * IsTargetInRange returns true before its Course Checker traversal. Execution
 * still owns its separate move geometry.
 * @param {Session} session @param {Actor} actor @param {string} moveId
 * @param {Fact} fact @param {Catalogs} catalogs @returns {number[]} */
function potentialDirections(session, actor, moveId, fact, catalogs) {
  if (actor.placement.kind !== 'map' || !selfEligible(actor, moveId)) return [];
  const origin = actor.placement.position, nav = navigationContext(session, catalogs), live = activeActors(session);
  const at = (/** @type {number} */ direction, /** @type {number} */ distance) => {
    const d = DIRECTIONS[direction]; if (!d) return null;
    return live.find(target => target.placement.kind === 'map' && target.placement.position.x === origin.x + d.x * distance && target.placement.position.z === origin.z + d.z * distance) ?? null;
  };
  /** @type {number[]} */ const result = [];
  const add = (/** @type {number} */ direction, /** @type {Actor|null} */ target) => {
    if (!target || result.includes(direction) || !targetEligible(actor, target, moveId, fact)) return false;
    result.push(direction); return true;
  };
  if (fact.targetFlags === 128) {
    for (const target of live) {
      if (target.placement.kind !== 'map' || target.actorId === actor.actorId) continue;
      const p = target.placement.position, dx = p.x - origin.x, dz = p.z - origin.z;
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== 1 || !isActuallyInSight(session.floor, origin, p, nav.visibilityRange)) continue;
      add(DIRECTIONS.findIndex(d => d.x === dx && d.z === dz), target);
    }
    return result;
  }
  if (![0, 32, 64].includes(fact.targetFlags)) return blocked('wild-ai-range-not-supported');
  for (let i = 0; i < DIRECTIONS.length; i++) {
    const d = DIRECTIONS[i]; if (!d) continue;
    if (fact.targetFlags !== 32 && !canMeleeAttack(navActor(actor), session.floor, { x: origin.x + d.x, z: origin.z + d.z }, nav)) continue;
    if (!add(i, at(i, 1)) && fact.targetFlags === 64) add(i, at(i, 2));
  }
  return result;
}
/** No targeting IQ: regular attack scans from current facing with no draw.
 * @param {Session} session @param {Actor} actor @param {Catalogs} catalogs */
function regularDirection(session, actor, catalogs) {
  const nativeFacing = DIRECTIONS.findIndex(d => facing(d.x, d.z) === actor.facing);
  const fact = AI_ACTION_FACTS[355]; if (!fact) return blocked('regular-ai-fact');
  const candidates = potentialDirections(session, actor, 'move-regular-attack', fact, catalogs);
  for (let i = 0; i < 8; i++) if (candidates.includes((nativeFacing + i) % 8)) return (nativeFacing + i) % 8;
  return null;
}
/** Preconditions: outer CannotAttack/Run Away/confusion guard has already run.
 * Every slot is retained; unsupported admission blocks before any selection.
 * Native unlinked Steel wild profiles have Status/PP Checker at IQ1, no
 * threshold gating, linked slots, Taunt/Encore, or targeting-weight skills.
 * @param {import('../turns/types.js').MutationContext} context @param {Actor} actor
 * @param {Catalogs} catalogs @returns {Action|null} */
export function chooseNativeWildMove(context, actor, catalogs) {
  const session = context.state.session;
  if (!session || actor.affiliation !== 'hostile' || actor.moves.links.length || actor.enabledIqSkillIds.length !== WILD_ACTIVE_IQ.length || !WILD_ACTIVE_IQ.every(id => actor.enabledIqSkillIds.some(value => value === id))) return blocked('wild-ai-profile-not-supported');
  const slots = actor.moves.slots.flatMap(slot => slot ? [slot] : []);
  if (!slots.every(slot => MOVES.includes(slot.moveId))) return blocked('wild-ai-move-not-supported');
  const ppFor = (/** @type {typeof slots[number]} */ slot) => { const pp = actor.battleMoves.slots.find(row => row.moveSlotId === slot.moveSlotId); if (!pp) return blocked('wild-ai-pp'); return pp; };
  const actionFor = (/** @type {number} */ direction, /** @type {typeof slots[number]|null} */ slot, /** @type {boolean} */ struggle = false) => {
    const d = DIRECTIONS[direction]; if (!d) return blocked('wild-ai-direction');
    actor.facing = facing(d.x, d.z);
    return slot ? /** @type {Action} */ ({ kind: 'move-use', actorId: actor.actorId, moveSlotId: slot.moveSlotId, moveId: slot.moveId, target: { kind: 'facing' } }) : /** @type {Action} */ ({ kind: struggle ? 'struggle' : 'attack', actorId: actor.actorId, target: { kind: 'facing' } });
  };
  const consider = (/** @type {string} */ moveId, /** @type {Fact} */ fact) => {
    const directions = potentialDirections(session, actor, moveId, fact, catalogs);
    return directions.length ? directions[draw(context.state, directions.length)] ?? null : null;
  };
  if (slots.reduce((sum, slot) => sum + ppFor(slot).currentPp, 0) === 0) {
    const fact = AI_ACTION_FACTS[352]; if (!fact) return blocked('struggle-ai-fact');
    const direction = consider('move-struggle', fact);
    return direction === null ? null : actionFor(direction, null, true);
  }
  const weighted = slots.map(slot => {
    const nativeId = catalogs.species.identities.moves.find(row => row.id === slot.moveId)?.originalId;
    const fact = nativeId === undefined ? undefined : AI_ACTION_FACTS[nativeId];
    if (!fact) return blocked('wild-ai-move-fact');
    const pp = ppFor(slot);
    return { slot, fact, weight: slot.enabled && pp.currentPp > 0 && !pp.sealed ? fact.weight : 0 };
  });
  const regularWeight = REGULAR_ATTACK_WEIGHTS[slots.filter(slot => slot.enabled).length];
  if (regularWeight === undefined) return blocked('wild-ai-slot-count');
  const total = weighted.reduce((sum, row) => sum + row.weight, regularWeight);
  if (total === 0) return null;
  const roll = draw(context.state, total), regular = regularDirection(session, actor, catalogs);
  let cumulative = 0;
  for (const row of weighted) {
    if (!row.weight) continue;
    cumulative += row.weight;
    if (cumulative >= roll) {
      const direction = consider(row.slot.moveId, row.fact);
      if (direction !== null) return actionFor(direction, row.slot);
      break;
    }
  }
  return regular === null ? null : actionFor(regular, null);
}
