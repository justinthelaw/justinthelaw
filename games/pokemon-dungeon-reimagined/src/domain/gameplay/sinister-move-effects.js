import { changeStatStage } from './stat-effects.js';
import { inflictParalysis, statusTurns } from './conditions.js';
import { hasHeldItem } from './held-effects.js';
import { moveConditionSource } from './move-conditions.js';
import { SINISTER_EFFECT_POLICY } from './sinister-condition-lifecycle.js';
import { ability, profile, draw, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {{slots:import('../../contracts/campaign.js').MoveSlotId[],struggle:boolean}} LastUsedFlags */
/** Saved prospective flags, not current actor.memory's display selection. Native
 * MarkLastUsedMonMove clears all flags then sets the actual used slot. Import
 * conversion and actor creation must authenticate and initialize each row.
 * @typedef {{lastUsed:Record<string,LastUsedFlags>}} SinisterEffectState */
export const SINISTER_PRIMARY_MOVES = Object.freeze(['move-wrap', 'move-spite', 'move-curse', 'move-detect', 'move-yawn', 'move-encore', 'move-sweet-scent', 'move-growth', 'move-foresight', 'move-odor-sleuth', 'move-stun-spore']);
/** Validate actual bounded slot identities, not a matching display move ID.
 * @param {SinisterEffectState} state @param {Actor} actor */
export function lastUsedFlags(state, actor) {
  const row = state.lastUsed[actor.actorId];
  if (!row || !Array.isArray(row.slots) || row.slots.length > 4 || new Set(row.slots).size !== row.slots.length || typeof row.struggle !== 'boolean' || row.struggle && row.slots.length > 0 || Array.from(row.slots).some(id => !actor.moves.slots.some(slot => slot?.moveSlotId === id) || !actor.battleMoves.slots.some(slot => slot.moveSlotId === id))) return blocked('sinister-last-used-flags');
  return row;
}
/** Native source use flag is marked once after successful use availability and
 * before the hit-count draw. Failed PP/sealed/Encore use does not mark it.
 * @param {SinisterEffectState} state @param {Actor} actor
 * @param {import('./combat.js').PreparedAttack['action']} action */
export function markSinisterLastUsed(state, actor, action) {
  const row = lastUsedFlags(state, actor);
  if (action.kind === 'attack') return;
  row.slots = action.kind === 'move-use' ? [action.moveSlotId] : []; row.struggle = action.kind === 'struggle';
}
/** PP Checker use guard; regular attacks ignore Encore. Both player and AI
 * must call this before shared prepareAttack's PP/last-used mutation.
 * @param {SinisterEffectState} state @param {Actor} actor
 * @param {import('./combat.js').PreparedAttack['action']} action */
export function sinisterEncoreAllows(state, actor, action) {
  if (actor.conditions.cringe?.statusId !== 'encore' || action.kind === 'attack') return true;
  const flags = lastUsedFlags(state, actor);
  return action.kind === 'struggle' ? flags.struggle : action.kind === 'move-use' && flags.slots.includes(action.moveSlotId);
}
/** Native actions return TRUE after calling most status helpers even when a
 * guard prevented mutation; Spite alone returns whether a last-used slot exists.
 * Shared caller has already performed wake, protection and first accuracy.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {import('../../contracts.js').MoveId} moveId @param {Catalogs} catalogs
 * @param {SinisterEffectState} state @returns {boolean|null} */
export function applySinisterPrimary(context, user, target, moveId, catalogs, state) {
  if (!SINISTER_PRIMARY_MOVES.includes(moveId)) return null;
  if (moveId === 'move-spite') {
    const flags = lastUsedFlags(state, target); let changed = false;
    for (const slot of target.battleMoves.slots) if (flags.slots.includes(slot.moveSlotId)) { slot.currentPp = 0; changed = true; }
    context.emit({ type: 'message', messageId: changed ? 'spite-cleared-last-used-pp' : 'spite-no-last-used-slot' }); return changed;
  }
  const source = moveConditionSource(context, user, moveId);
  const counter = (/** @type {number} */ remaining) => ({ kind: /** @type {const} */ ('counter'), policyId: SINISTER_EFFECT_POLICY, remaining });
  const notify = (/** @type {string} */ messageId) => { context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId }); };
  const safeguard = target.conditions.reflect?.statusId === 'safeguard';
  if (moveId === 'move-growth') { changeStatStage(context, target, 'specialAttack', 1, catalogs); return true; }
  if (moveId === 'move-sweet-scent') { changeStatStage(context, target, 'evasion', -1, catalogs); return true; }
  if (moveId === 'move-detect') {
    if (target.conditions.reflect?.statusId !== 'protect') {
      target.conditions.reflect = { statusId: 'protect', source, duration: counter(3 + draw(context.state, 4)), periodicCountdown: null, payload: { kind: 'none' } }; notify('protect-status');
    } else context.emit({ type: 'message', messageId: 'protect-already-active' });
    return true;
  }
  if (moveId === 'move-yawn') {
    const remaining = statusTurns(context, target, 2, 2, catalogs) + 1;
    if (!safeguard && !target.conditions.sleep && !ability(target, catalogs, 'Insomnia') && !ability(target, catalogs, 'Vital Spirit') && !target.enabledIqSkillIds.some(id => id === 'iq-nonsleeper') && !hasHeldItem(context.state, target, 'item-insomniscope')) {
      target.conditions.sleep = { statusId: 'yawning', source, duration: counter(remaining), periodicCountdown: null, payload: { kind: 'none' } }; notify('yawning-status');
    } else context.emit({ type: 'message', messageId: 'yawn-no-effect' });
    return true;
  }
  if (moveId === 'move-stun-spore') { inflictParalysis(context, target, source, catalogs, SINISTER_EFFECT_POLICY); return true; }
  if (safeguard) { context.emit({ type: 'message', messageId: 'status-safeguard-protected' }); return true; }
  if (moveId === 'move-encore') {
    const flags = lastUsedFlags(state, target);
    if ((flags.slots.length || flags.struggle) && target.conditions.cringe?.statusId !== 'encore') {
      target.conditions.cringe = { statusId: 'encore', source, duration: counter(statusTurns(context, target, 10, 10, catalogs) + 1), periodicCountdown: null, payload: { kind: 'none' } }; notify('encore-status');
    } else context.emit({ type: 'message', messageId: 'encore-no-effect' });
    return true;
  }
  if (moveId === 'move-foresight' || moveId === 'move-odor-sleuth') {
    if (target.stages.evasion > 10) {
      target.stages.evasion = 10; context.emit({ type: 'conditionChanged', actorId: target.actorId });
      context.emit({ type: 'message', messageId: 'exposure-reset-evasion' });
    }
    if (profile(target.identity, catalogs).typeIds.includes(14) && !target.auxiliaryConditions.exposed) {
      target.auxiliaryConditions.exposed = { source, duration: { kind: 'floor', policyId: SINISTER_EFFECT_POLICY } }; notify('exposed-status');
    } else context.emit({ type: 'message', messageId: 'exposed-no-change' });
    return true;
  }
  if (moveId === 'move-curse') {
    if (!profile(user.identity, catalogs).typeIds.includes(14)) return blocked('sinister-ghost-curse-required');
    user.resources.hp = Math.max(1, Math.trunc(user.resources.hp / 2));
    if (target.conditions.curse?.statusId !== 'cursed') {
      target.conditions.curse = { statusId: 'cursed', source, duration: counter(statusTurns(context, target, 3, 5, catalogs) + 1), periodicCountdown: 0, payload: { kind: 'none' } };
    }
    context.emit({ type: 'conditionChanged', actorId: user.actorId }); notify('cursed-status'); return true;
  }
  if (moveId === 'move-wrap') {
    if ([user, target].some(actor => ['wrap', 'wrapped'].includes(actor.conditions.frozen?.statusId ?? ''))) { context.emit({ type: 'message', messageId: 'wrap-already-active' }); return true; }
    user.conditions.frozen = { statusId: 'wrap', source, duration: counter(127), periodicCountdown: 0, payload: { kind: 'actor-link', actorId: target.actorId } };
    target.conditions.frozen = { statusId: 'wrapped', source, duration: counter(statusTurns(context, target, 2, 5, catalogs) + 1), periodicCountdown: 0, payload: { kind: 'actor-link', actorId: user.actorId } };
    if (user.actorId !== target.actorId) context.emit({ type: 'conditionChanged', actorId: user.actorId }); notify('wrapped-status'); return true;
  }
  return blocked('sinister-primary-owner');
}
