import { prepareAttack, resolveAttackImpact, releaseBide, supportedMove } from './combat.js';
import { moveTargets, activeActors } from './move-targets.js';
import { SINISTER_PRIMARY_MOVES, applySinisterPrimary, lastUsedFlags, markSinisterLastUsed, sinisterEncoreAllows } from './sinister-move-effects.js';
import { SINISTER_DAMAGE_MOVES, sinisterDamageSecondary } from './sinister-damage-status.js';
import { sinisterImmobilized } from './sinister-condition-lifecycle.js';
import { clone, profile, draw, FACINGS, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('./combat.js').PreparedAttack['move']} Move */
/** @typedef {{actorId:import('../../contracts.js').ActorId,sessionId:import('../../contracts/campaign.js').SessionId,mapId:import('../../contracts/campaign.js').MapId,action:import('./combat.js').PreparedAttack['action'],nextHit:number,totalHits:number}} SinisterMoveSequence */
/** The successor must put both actual flags and this cursor in its raw schema.
 * Prepared factual move records are reconstructed, never serialized as owners.
 * @typedef {import('./sinister-move-effects.js').SinisterEffectState & {sequence:SinisterMoveSequence|null}} SinisterCombatState */
export const SINISTER_ADDITIONAL_MOVES = Object.freeze([...SINISTER_PRIMARY_MOVES, ...SINISTER_DAMAGE_MOVES, 'move-barrage']);
/** Source range2 enumerates eight adjacent tiles starting at current facing;
 * no wall/corner probe. Attacker sorts last in every prospective target array.
 * @param {Context} context @param {Actor} user @param {Move} move
 * @param {import('../../contracts/campaign.js').TargetSelector} selector @param {Catalogs} catalogs */
function sinisterTargets(context, user, move, selector, catalogs) {
  const session = context.state.session;
  if (!session || user.placement.kind !== 'map') return [];
  let targets;
  if (move.target.rangeCode !== 2) targets = moveTargets(session, user, move.target.rangeCode, catalogs, selector, move.target.categoryCode);
  else {
    const confused = user.conditions.cringe?.statusId === 'confused' && !user.enabledIqSkillIds.some(id => id === 'iq-nontraitor');
    const active = activeActors(session), origin = user.placement.position, first = FACINGS.indexOf(user.facing);
    targets = [];
    for (let i = 0; i < 8; i++) {
      const angle = ((first + i) % 8) * Math.PI / 4;
      const other = active.find(actor => actor.placement.kind === 'map' && actor.placement.position.x === origin.x + Math.round(Math.sin(angle)) && actor.placement.position.z === origin.z - Math.round(Math.cos(angle)));
      if (other && other.affiliation !== 'neutral' && (confused || other.affiliation !== user.affiliation)) targets.push(other);
    }
  }
  return [...targets.filter(target => target.actorId !== user.actorId), ...targets.filter(target => target.actorId === user.actorId)];
}
/** @param {SinisterCombatState} state @returns {import('./combat.js').CombatExtension} */
function extension(state) {
  return {
    supports: id => SINISTER_ADDITIONAL_MOVES.includes(id), targets: sinisterTargets,
    primaryMove: id => SINISTER_PRIMARY_MOVES.includes(id),
    guardTarget(context, user, target, move) {
      if (target.conditions.reflect?.statusId === 'protect' && [0, 4, 5, 2].includes(move.target.categoryCode)) {
        context.emit({ type: 'message', messageId: 'protect-blocked-move' });
        context.emit({ type: 'attackResolved', actorId: user.actorId, targetId: target.actorId, outcome: 'immune' }); return false;
      }
      return true;
    },
    primary(context, user, target, moveId, catalogs) {
      // BasicFireMoveAction thaws after first accuracy and before CalcDamage.
      if (moveId === 'move-fire-punch' && target.conditions.frozen?.statusId === 'frozen') {
        target.conditions.frozen = null; context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId: 'thawed-status' });
      }
      return applySinisterPrimary(context, user, target, moveId, catalogs, state);
    },
    secondary: sinisterDamageSecondary,
    damageAmount(context, user, target, move, amount) {
      // Native damage guard follows CalcDamage AND second accuracy.
      if (target.conditions.frozen?.statusId === 'frozen') { context.emit({ type: 'message', messageId: 'frozen-prevented-damage' }); return 0; }
      return amount;
    },
    exposed: target => target.auxiliaryConditions.exposed !== null,
    selfAlwaysHits: moveId => moveId !== 'move-detect',
  };
}
/** Begin once after source opportunity/use guards, before hit enumeration.
 * Cursor is unconsumed work, not a completed action. Canonical successor owns
 * and saves it atomically before releasing a frame/learning UI.
 * @param {Context} context @param {Actor} actor @param {import('./combat.js').PreparedAttack['action']} action
 * @param {Catalogs} catalogs @param {SinisterCombatState} state */
export function beginSinisterAttack(context, actor, action, catalogs, state) {
  const session = context.state.session;
  if (!session || state.sequence || action.actorId !== actor.actorId || actor.placement.kind !== 'map' || actor.resources.hp <= 0) return blocked('sinister-move-sequence-owner');
  lastUsedFlags(state, actor);
  if (action.kind === 'move-use' && action.moveId === 'move-curse' && !profile(actor.identity, catalogs).typeIds.includes(14)) return blocked('sinister-ghost-curse-required');
  if (sinisterImmobilized(actor)) { context.emit({ type: 'message', messageId: 'frozen-class-prevents-action' }); return null; }
  if (!sinisterEncoreAllows(state, actor, action)) { context.emit({ type: 'message', messageId: 'encore-prevents-move' }); return null; }
  if (action.kind === 'move-use' && !actor.moves.slots.some(slot => slot?.moveSlotId === action.moveSlotId && slot.moveId === action.moveId)) return blocked('sinister-move-slot-owner');
  const prepared = prepareAttack(context, actor, action, catalogs, extension(state));
  if (!prepared) return null;
  markSinisterLastUsed(state, actor, action);
  const totalHits = action.kind === 'move-use' && action.moveId === 'move-barrage' ? 2 + draw(context.state, 4) : 1;
  state.sequence = { actorId: actor.actorId, sessionId: session.sessionId, mapId: session.floor.mapId, action: clone(action), nextHit: 0, totalHits };
  return state.sequence;
}
/** One complete impact per call with sampled total and paid PP. Caller supplies
 * actual loss/terminal/pending-learning gate before EACH hit. Paused work remains
 * intact; later hits reenumerate targets and cease when empty. Misses do not
 * truncate Barrage. Immediate faint/Reviver/EXP stay with shared owners.
 * @param {Context} context @param {Catalogs} catalogs @param {SinisterCombatState} state
 * @param {(context:Context)=>boolean} mayContinue @returns {'paused'|'impact'|'complete'} */
export function continueSinisterAttack(context, catalogs, state, mayContinue) {
  const sequence = state.sequence, session = context.state.session;
  if (!sequence || !session || sequence.sessionId !== session.sessionId || sequence.mapId !== session.floor.mapId || !Number.isSafeInteger(sequence.nextHit) || !Number.isSafeInteger(sequence.totalHits) || sequence.nextHit < 0 || sequence.nextHit >= sequence.totalHits || sequence.totalHits < 1 || sequence.totalHits > 5) return blocked('sinister-move-sequence');
  if (!mayContinue(context)) return 'paused';
  const actor = session.actors[sequence.actorId];
  if (!actor) return blocked('sinister-move-sequence-actor');
  if (actor.placement.kind !== 'map' || actor.resources.hp <= 0 || sinisterImmobilized(actor) || actor.conditions.cringe?.statusId === 'cringe' || actor.conditions.cringe?.statusId === 'infatuated' || actor.conditions.burn?.statusId === 'paralysis' || ['sleep', 'nightmare', 'napping'].includes(actor.conditions.sleep?.statusId ?? '')) { state.sequence = null; return 'complete'; }
  const action = sequence.action, regular = action.kind === 'attack', learned = action.kind === 'move-use';
  const move = action.kind === 'move-use' ? catalogs.effects.getMove(action.moveId) : catalogs.effects.getAction(regular ? 355 : 352);
  if (action.kind === 'move-use' && !supportedMove(catalogs, action.moveId) && !SINISTER_ADDITIONAL_MOVES.includes(action.moveId)) return blocked('sinister-sequence-move');
  const barrage = action.kind === 'move-use' && action.moveId === 'move-barrage';
  if (barrage ? sequence.totalHits < 2 : sequence.totalHits !== 1) return blocked('sinister-sequence-hits');
  const slot = action.kind === 'move-use' ? actor.moves.slots.find(row => row?.moveSlotId === action.moveSlotId && row.moveId === action.moveId) : null;
  if (learned && !slot) return blocked('sinister-sequence-slot');
  const ext = extension(state);
  if (sequence.nextHit > 0 && !ext.targets(context, actor, move, action.target, catalogs).length) { state.sequence = null; return 'complete'; }
  resolveAttackImpact(context, actor, { action, move, slot, regular, learned }, catalogs, ext);
  sequence.nextHit++;
  if (sequence.nextHit === sequence.totalHits) { state.sequence = null; return 'complete'; }
  return 'impact';
}
/** Additional Status Checker predicates run during native candidate weighting
 * before selection. This does not filter source learnsets/effect inventories.
 * @param {SinisterCombatState} state @param {Actor} user @param {Actor} target
 * @param {string} moveId @param {Catalogs} catalogs */
export function sinisterStatusCheckerAllows(state, user, target, moveId, catalogs) {
  const move = catalogs.effects.getMove(moveId);
  if (target.conditions.frozen?.statusId === 'frozen' && move.flags.cannotHitFrozen) return false;
  if (moveId === 'move-detect') return user.conditions.reflect?.statusId !== 'protect';
  if (moveId === 'move-growth') return user.stages.specialAttack < 20;
  if (moveId === 'move-wrap') return !['wrap', 'wrapped'].includes(target.conditions.frozen?.statusId ?? '');
  if (moveId === 'move-curse') return !profile(user.identity, catalogs).typeIds.includes(14) || target.conditions.curse?.statusId !== 'cursed';
  if (moveId === 'move-yawn') return !['yawning', 'sleep', 'nightmare', 'napping'].includes(target.conditions.sleep?.statusId ?? '');
  if (moveId === 'move-encore') {
    const flags = lastUsedFlags(state, target);
    return target.conditions.cringe?.statusId !== 'encore' && (flags.slots.length > 0 || flags.struggle);
  }
  if (moveId === 'move-stun-spore') return target.conditions.burn?.statusId !== 'paralysis';
  if (moveId === 'move-spite') return !target.battleMoves.slots.some(slot => lastUsedFlags(state, target).slots.includes(slot.moveSlotId) && slot.currentPp === 0);
  if (moveId === 'move-sweet-scent') return target.stages.evasion > 0;
  if (moveId === 'move-foresight' || moveId === 'move-odor-sleuth') return profile(target.identity, catalogs).typeIds.includes(14) && !target.auxiliaryConditions.exposed || target.stages.evasion > 10;
  return true;
}

/** Prospective internal Bide uses the shared fixed damage owner with the same
 * Protect/Frozen/exposed inputs, not a duplicate faint/EXP implementation.
 * @param {Context} context @param {Actor} actor @param {number} amount
 * @param {Catalogs} catalogs @param {SinisterCombatState} state */
export function releaseSinisterBide(context, actor, amount, catalogs, state) { releaseBide(context, actor, amount, catalogs, extension(state)); }
