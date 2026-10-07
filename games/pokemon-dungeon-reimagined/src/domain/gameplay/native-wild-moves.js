import { DEFAULT_IQ } from '../../../content/state/opening-facts.js';
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
const MOVES = Object.freeze(['move-peck', 'move-growl', 'move-tackle', 'move-tail-whip', 'move-harden', 'move-confusion', 'move-rapid-spin', 'move-defense-curl', 'move-bide', 'move-meditate', 'move-take-down', 'move-focus-energy', 'move-vice-grip', 'move-leer', 'move-sand-attack', 'move-scratch', 'move-pound', 'move-thunder-shock', 'move-hypnosis', 'move-absorb', 'move-quick-attack', 'move-charge', 'move-metal-sound', 'move-withdraw', 'move-helping-hand', 'move-thunder-wave', 'move-disable', 'move-attract', 'move-smokescreen', 'move-reflect', 'move-low-kick', 'move-metal-claw', 'move-mud-slap', 'move-water-gun', 'move-ember', 'move-bite', 'move-bone-club', 'move-headbutt', 'move-rage', 'move-razor-leaf', 'move-bubble']);
/** @param {Actor} actor @param {string} moveId */
function selfEligible(actor, moveId) {
  if (!actor.enabledIqSkillIds.some(id => id === 'iq-status-checker')) return true;
  if (moveId === 'move-rage') return actor.conditions.bide?.statusId !== 'enraged';
  if (moveId === 'move-reflect') return actor.conditions.reflect?.statusId !== 'reflect';
  if (moveId === 'move-charge') return actor.conditions.bide?.statusId !== 'charging';
  if (moveId === 'move-meditate') return actor.stages.attack < 20;
  if (['move-harden', 'move-defense-curl', 'move-withdraw'].includes(moveId)) return actor.stages.defense < 20;
  if (moveId === 'move-bide') return actor.conditions.bide?.statusId !== 'bide';
  if (moveId === 'move-focus-energy') return actor.conditions.sureShot?.statusId !== 'focus-energy';
  return true;
}
/** @param {Actor} actor @param {Actor} target @param {string} moveId @param {Fact} fact */
function targetEligible(actor, target, moveId, fact) {
  if (target.affiliation === 'neutral' || target.affiliation === actor.affiliation || target.resources.hp === 0 || target.placement.kind !== 'map') return false;
  if (actor.affiliation === 'team' && target.conditions.frozen?.statusId === 'petrified') return false;
  if (!actor.enabledIqSkillIds.some(id => id === 'iq-status-checker')) return true;
  if (['move-thunder-wave', 'move-disable'].includes(moveId) && target.conditions.burn?.statusId === 'paralysis') return false;
  if (moveId === 'move-attract' && target.conditions.cringe?.statusId === 'infatuated') return false;
  if (moveId === 'move-smokescreen' && target.conditions.sureShot?.statusId === 'whiffer') return false;
  if (moveId === 'move-hypnosis' && ['sleep', 'nightmare', 'napping'].includes(target.conditions.sleep?.statusId ?? '')) return false;
  if (target.conditions.frozen?.statusId === 'frozen' && fact.cannotHitFrozen) return false;
  if (moveId === 'move-metal-sound') return target.stages.specialDefense > 0;
  if (['move-leer', 'move-tail-whip'].includes(moveId)) return target.stages.defense > 0;
  if (moveId === 'move-sand-attack') return target.stages.accuracy > 0;
  if (moveId === 'move-growl') return target.stages.attack > 0;
  return true;
}
/** Current scoped wild IQ has neither Course Checker nor targeting-weight IQ.
 * Range0x80 has no extra line check without Course Checker. Default party IQ
 * does have it: wall tiles and intervening actors block before reaching the
 * intended target. Execution still owns its separate move geometry.
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
  if (moveId === 'move-helping-hand' && actor.enabledIqSkillIds.some(id => id === 'iq-status-checker') && !live.some(other => other.actorId !== actor.actorId && other.affiliation === actor.affiliation && other.placement.kind === 'map' && isActuallyInSight(session.floor, origin, other.placement.position, nav.visibilityRange) && other.stages.attack < 20 && other.stages.specialAttack < 20)) return [];
  if (fact.targetFlags === 48) {
    const direction = DIRECTIONS.findIndex(d => facing(d.x, d.z) === actor.facing);
    for (const target of live) if (target.placement.kind === 'map' && isActuallyInSight(session.floor, origin, target.placement.position, nav.visibilityRange)) add(direction, target);
    return result;
  }
  if (fact.targetFlags === 128 || fact.targetFlags === 80) {
    const maximum = fact.targetFlags === 80 ? 10 : 1;
    for (const target of live) {
      if (target.placement.kind !== 'map' || target.actorId === actor.actorId) continue;
      const p = target.placement.position, dx = p.x - origin.x, dz = p.z - origin.z;
      const distance = Math.max(Math.abs(dx), Math.abs(dz));
      if (!distance || distance > maximum || dx !== 0 && dz !== 0 && Math.abs(dx) !== Math.abs(dz) || !isActuallyInSight(session.floor, origin, p, nav.visibilityRange)) continue;
      const stepX = Math.sign(dx), stepZ = Math.sign(dz);
      if (actor.enabledIqSkillIds.some(id => id === 'iq-course-checker')) {
        let reaches = false;
        for (let n = 1; n <= distance; n++) {
          const x = origin.x + stepX * n, z = origin.z + stepZ * n, tile = session.floor.tiles[z]?.[x];
          if (x < 1 || z < 1 || x >= session.floor.width - 1 || z >= session.floor.height - 1 || !tile || catalogs.navigation.terrain(tile.terrainId).kind === 'wall') break;
          const occupant = live.find(other => other.placement.kind === 'map' && other.placement.position.x === x && other.placement.position.z === z);
          if (occupant?.actorId === target.actorId) { reaches = true; break; }
          if (occupant) break;
        }
        if (!reaches) continue;
      }
      add(DIRECTIONS.findIndex(d => d.x === stepX && d.z === stepZ), target);
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
 * Native unlinked early wild profiles have Status/PP Checker independently of
 * IQ1. Default party IQ instead has Course Checker and may select exhausted
 * slots. These profiles have no targeting-weight skills or linked chains.
 * Party dispatch remains gated until every actual learned effect is closed.
 * @param {import('../turns/types.js').MutationContext} context @param {Actor} actor
 * @param {Catalogs} catalogs @returns {Action|null} */
export function chooseNativeWildMove(context, actor, catalogs) {
  const session = context.state.session;
  const expectedIq = actor.affiliation === 'team' ? DEFAULT_IQ : WILD_ACTIVE_IQ;
  if (!session || actor.affiliation === 'neutral' || actor.moves.links.length || actor.enabledIqSkillIds.length !== expectedIq.length || !expectedIq.every(id => actor.enabledIqSkillIds.some(value => value === id))) return blocked('wild-ai-profile-not-supported');
  const ppChecker = actor.enabledIqSkillIds.some(id => id === 'iq-pp-checker'), charging = actor.conditions.bide?.statusId === 'charging';
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
    const available = slot.enabled && !pp.sealed && (!ppChecker || pp.currentPp > 0);
    const weight = charging ? slot.moveId === 'move-charge' ? 0 : catalogs.effects.getMove(slot.moveId).numeric.type === 'electric' ? fact.weight : 1 : fact.weight;
    return { slot, fact, weight: available ? weight : 0 };
  });
  const regularWeight = charging ? 0 : REGULAR_ATTACK_WEIGHTS[slots.filter(slot => slot.enabled).length];
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
