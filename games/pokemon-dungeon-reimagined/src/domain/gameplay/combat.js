import { calculateNormalDamage } from '../rules/damage.js';
import { ELEMENT_TYPES, isPhysicalType } from '../rules/type-context.js';
import { canMeleeAttack } from '../navigation/geometry.js';
import { draw, value, maxHp, ability, profile, blocked, navActor, navigationContext, quantity } from './support.js';

/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
// Pinned R dungeon_config.c:gAccEvsStatStageMultipliers (Q8 truncation).
const ACCURACY = [84, 89, 94, 102, 110, 115, 140, 153, 179, 204, 256, 320, 384, 409, 422, 435, 448, 460, 473, 486, 512];
const EVASION = [512, 486, 473, 460, 448, 435, 422, 409, 384, 345, 256, 204, 179, 153, 128, 102, 89, 76, 64, 51, 38];
/** @param {Actor} actor @param {Catalogs} catalogs @returns {[import('../rules/type-context.js').ElementType,import('../rules/type-context.js').ElementType]} */
function types(actor, catalogs) { const ids = profile(actor.identity, catalogs).typeIds; return [ELEMENT_TYPES[ids[0] ?? 0] ?? 'None', ELEMENT_TYPES[ids[1] ?? 0] ?? 'None']; }
/** @param {Catalogs} catalogs @param {string} id */
export function supportedMove(catalogs, id) {
  const move = catalogs.effects.getMove(id);
  return move.hitCountContract.count === 1 && move.target.rangeCode === 0 && move.effects.length === 1 && move.effects.every(effect => effect.op === 'normal-damage' && Object.keys(effect).every(key => ['op', 'finalMultiplier'].includes(key))) && move.effects.some(effect => effect.op === 'normal-damage' && (effect.finalMultiplier === undefined || typeof effect.finalMultiplier === 'number'));
}
/** @param {Context} context @param {Actor} attacker @param {Actor} target @param {number} base @param {boolean} physical @param {Catalogs} catalogs */
function accuracy(context, attacker, target, base, physical, catalogs) {
  const roll = draw(context.state, 100);
  if (base > 100) return true;
  const a = Math.max(0, Math.min(20, attacker.stages.accuracy + (ability(attacker, catalogs, 'Compoundeyes') ? 2 : 0)));
  const e = Math.max(0, Math.min(20, target.stages.evasion + (physical && ability(attacker, catalogs, 'Hustle') ? 2 : 0)));
  return roll < Math.trunc(Math.trunc(base * (ACCURACY[a] ?? 256) / 256) * (EVASION[e] ?? 256) / 256);
}
/** Single-impact supported actions resolve HP before returning to the scheduler.
 * @param {Context} context @param {Actor} attacker @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'attack'|'move-use'}} action @param {Catalogs} catalogs */
export function attack(context, attacker, action, catalogs) {
  const session = context.state.session;
  if (!session || attacker.placement.kind !== 'map') return blocked('combat-session');
  const regular = action.kind === 'attack';
  const move = regular ? catalogs.effects.getAction(355) : catalogs.effects.getMove(action.moveId);
  if (!regular && !supportedMove(catalogs, action.moveId)) return blocked('move-effect-not-supported');
  const slot = !regular ? attacker.moves.slots.find(row => row?.moveSlotId === action.moveSlotId) : null;
  if (!regular) {
    const pp = attacker.battleMoves.slots.find(row => row.moveSlotId === action.moveSlotId);
    if (!pp || pp.currentPp === 0 || pp.sealed || !slot) return blocked('move-pp-unavailable');
    pp.currentPp--; pp.usedForExperience = true;
    attacker.memory.lastUsedMove = { moveId: action.moveId, moveSlotId: action.moveSlotId };
  }
  const target = action.target.kind === 'actor' ? session.actors[action.target.actorId] : null;
  if (!target || target.placement.kind !== 'map' || !canMeleeAttack(navActor(attacker), session.floor, target.placement.position, navigationContext(session, catalogs))) {
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: null, outcome: 'miss' }); return;
  }
  const moveType = ELEMENT_TYPES.find(type => type.toLowerCase() === move.numeric.type);
  if (!moveType) return blocked('move-type');
  const physical = isPhysicalType(moveType);
  // Source physical-type retaliation is resolved below after positive damage.
  if (!accuracy(context, attacker, target, move.numeric.accuracyBeforeEffect, physical, catalogs) || !accuracy(context, attacker, target, move.numeric.accuracyAfterDamage, physical, catalogs)) {
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'miss' }); return;
  }
  const a = (/** @type {string} */ name) => ability(attacker, catalogs, name);
  const d = (/** @type {string} */ name) => ability(target, catalogs, name);
  const offense = physical ? 'attack' : 'specialAttack'; const defense = physical ? 'defense' : 'specialDefense';
  const armor = d('Battle Armor') || d('Shell Armor');
  const early = attacker.actorId !== session.leaderActorId && Math.floor(value(attacker.resources.belly)) === 0 || regular && d('Wonder Guard');
  const effect = move.effects.find(effect => effect.op === 'normal-damage');
  const multiplier = effect && typeof effect.finalMultiplier === 'number' ? effect.finalMultiplier : 1;
  const result = calculateNormalDamage({
    type: { moveType, attackerTypes: types(attacker, catalogs), defenderTypes: types(target, catalogs), defenderExposed: false,
      abilities: { wonderGuard: d('Wonder Guard'), thickFat: d('Thick Fat'), flashFire: d('Flash Fire'), levitate: d('Levitate'), torrent: a('Torrent'), overgrow: a('Overgrow'), swarm: a('Swarm'), blaze: a('Blaze') },
      attackerHp: attacker.resources.hp, attackerMaxHp: maxHp(attacker), weather: 'clear', mudSport: false, waterSport: false, charging: false },
    stats: { rawOffense: attacker.growth.naturalStats[offense] + attacker.growth.permanentStatBonuses[offense], rawDefense: target.growth.naturalStats[defense] + target.growth.permanentStatBonuses[defense], movePower: move.numeric.power + (slot?.powerBoost ?? 0), offenseStage: attacker.stages[offense], defenseStage: target.stages[defense], offensiveMultiplierQ8: value(attacker.multipliers[offense]) * 256, defensiveMultiplierQ8: value(target.multipliers[defense]) * 256,
      flashFireBoost: 0, attackerForm: 'none', defenderForm: 'none', skullBash: false, attackerItem: 'none', defenderItem: 'none',
      abilities: { guts: a('Guts'), attackerNegativeStatus: false, hugePower: a('Huge Power'), purePower: a('Pure Power'), hustle: a('Hustle'), plus: a('Plus'), minus: a('Minus'), sameSidePlus: false, sameSideMinus: false, intimidate: d('Intimidate'), marvelScale: d('Marvel Scale'), defenderNegativeStatus: false } },
    critical: { moveChance: move.numeric.criticalPercent, focusEnergy: false, typeAdvantageMaster: false, battleArmor: d('Battle Armor'), shellArmor: d('Shell Armor') },
    teamMember: attacker.affiliation === 'team', leader: attacker.actorId === session.leaderActorId, integerBelly: Math.floor(value(attacker.resources.belly)), level: attacker.growth.level, regularAttack: regular,
    targetEffectsApply: true, reflect: false, lightScreen: false, moveEffectMultiplierQ8: Math.trunc(multiplier * 256), rolls: early ? null : { sharedPowerRoll: draw(context.state, 100), criticalRoll: armor ? null : draw(context.state, 100), varianceRoll: draw(context.state, 16384) } });
  if (target.conditions.sleep?.duration.kind === 'indefinite') target.conditions.sleep = null;
  target.resources.hp = Math.max(0, target.resources.hp - result.damage);
  if (physical && result.damage > 0 && target.resources.hp > 0 && (!target.conditions.sleep || target.conditions.sleep.statusId === 'sleepless') && target.conditions.frozen?.statusId !== 'frozen' && target.conditions.frozen?.statusId !== 'petrified' && !target.conditions.bide) {
    for (const [name, status, group, lower, width] of /** @type {const} */ ([['Static', 'paralysis', 'burn', 1, 1], ['Cute Charm', 'infatuated', 'cringe', 4, 2]])) {
      if (!d(name) || draw(context.state, 100) >= 12) continue;
      if (ability(attacker, catalogs, status === 'paralysis' ? 'Limber' : 'Oblivious') || attacker.conditions[group]?.statusId === status) continue;
      // Opening reactions affect native wild actors; neither has curer abilities/IQ.
      const sourceAbility = catalogs.species.identities.abilities.find(row => row.name === name); if (!sourceAbility) return blocked('reaction-ability');
      attacker.conditions[group] = { statusId: status, source: { kind: 'ability', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: target.actorId, identity: { ...target.identity } }, abilityId: /** @type {import('../../contracts/campaign.js').AbilityId} */ (sourceAbility.id) }, duration: { kind: 'counter', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-opening-reaction'), remaining: lower + draw(context.state, width) + 1 }, periodicCountdown: null, payload: { kind: 'none' } };
      if (status === 'paralysis') attacker.speed.cachedStage = Math.max(0, attacker.speed.cachedStage - 1);
      context.emit({ type: 'conditionChanged', actorId: attacker.actorId });
    }
  }
  if (!regular && result.damage > 0 && !target.memory.experienceContributors.includes(attacker.actorId)) target.memory.experienceContributors.push(attacker.actorId);
  context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: result.damage ? 'hit' : 'immune' });
  if (target.resources.hp === 0 && target.affiliation !== 'team') {
    // R CalculateEXPGain and dungeon_damage.c: half credit until a move hits.
    const p = profile(target.identity, catalogs); const base = p.experienceYield + Math.trunc(p.experienceYield * (target.growth.level - 1) / 10);
    const xp = Math.max(1, target.memory.experienceContributors.length ? base : Math.trunc(base / 2));
    for (const id of session.teamOrder) {
      const actor = session.actors[id]; if (!actor) continue;
      actor.growth.totalExperience = quantity(Math.min(9999999, value(actor.growth.totalExperience) + xp));
      actor.gains.experience = quantity(value(actor.gains.experience) + xp);
    }
    target.placement = { kind: 'off-map', reason: 'fainted' };
    target.speed.movementPending = false; target.speed.endEffectsPending = false; target.speed.deferred = false;
    const index = session.scheduler.wildSlots.indexOf(target.actorId); if (index >= 0) session.scheduler.wildSlots[index] = null;
    context.emit({ type: 'message', messageId: 'enemy-fainted' });
  }
}
