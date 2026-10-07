import { diagnostics, bounded, sameForm } from './pokemon-rules.js';
import { steelAppend } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Exact successor statuses are checked before their neutral projection reaches
 * the immutable predecessor. The actual cached speed is checked independently.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Partial<Policies>} */
export function withMovePolicies(prior, catalogs) { return {
  progress(state) {
    const r = diagnostics(), field = state.moveState, session = state.session;
    r.check(field !== undefined, '/moveState', 'Current saves require an explicit field-ability owner.');
    if (field) {
      const actor = field.lightningRodActorId ? session?.actors[field.lightningRodActorId] : null;
      const rod = catalogs.species.identities.abilities.find(row => row.name === 'Lightningrod');
      r.check(session && field.sessionId === session.sessionId && field.mapId === session.floor.mapId && (field.lightningRodActorId === null || actor && rod && catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId).abilityIds.includes(rod.originalId)), '/moveState', 'Cached Lightningrod belongs to a historical actor on this exact session floor.');
    } else if (session) r.check(session.scheduler.continuation.pass === 'prephase' && session.scheduler.continuation.step <= 1, '/moveState', 'Null field cache is only legal before the first native refresh.');
    steelAppend(r, prior.progress(state)); return r.result();
  },
  conditions(actor, session, scope) {
    const r = diagnostics(), conditions = { ...actor.conditions };
    for (const group of /** @type {const} */ (['burn', 'sleep', 'bide'])) {
      const c = conditions[group]; if (c?.duration.policyId !== 'native-move-status-v11') continue;
      const paralysis = group === 'burn', charging = group === 'bide';
      const moveId = paralysis ? 'move-thunder-shock' : charging ? 'move-charge' : 'move-hypnosis';
      r.check(c.statusId === (paralysis ? 'paralysis' : charging ? 'charging' : 'sleep') && c.periodicCountdown === null && (charging ? c.duration.kind === 'indefinite' : c.duration.kind === 'counter' && bounded(c.duration.remaining, 1, paralysis ? 2 : 6)), `/conditions/${group}`, 'Move status retains its exact class and native duration.');
      const ref = c.source.kind === 'actor' || c.source.kind === 'ability' ? c.source.actor : null;
      const source = ref ? session.actors[ref.actorId] : null;
      r.check(ref && source && ref.sessionId === session.sessionId && ref.mapId === session.floor.mapId && sameForm(ref.identity, source.identity) && (c.source.kind === 'actor' && c.source.moveId === moveId && source.moves.slots.some(slot => slot?.moveId === moveId) || paralysis && c.source.kind === 'ability' && c.source.abilityId === 'ability-static' && catalogs.species.getProfile(source.identity.speciesId, source.identity.formId).abilityIds.includes(catalogs.species.identities.abilities.find(row => row.id === 'ability-static')?.originalId ?? -1)), `/conditions/${group}/source`, 'Move status retains the actual learned move and historical source actor.');
      if (charging) r.check(source?.actorId === actor.actorId && c.payload.kind === 'charge' && c.payload.moveId === moveId && c.payload.target.kind === 'self' && c.payload.storedDamage === 0 && actor.moves.slots.some(slot => slot?.moveSlotId === (c.payload.kind === 'charge' ? c.payload.moveSlotId : null) && slot.moveId === moveId), '/conditions/bide/payload', 'Charge belongs to its exact self move slot without a duration or accumulated damage.');
      else r.check(c.payload.kind === 'none', `/conditions/${group}/payload`, 'This finite status carries no extra payload.');
      const profile = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId);
      const immunity = paralysis ? ['Limber'] : charging ? [] : ['Insomnia', 'Vital Spirit'];
      for (const name of immunity) { const a = catalogs.species.identities.abilities.find(row => row.name === name); r.check(!a || !profile.abilityIds.includes(a.originalId), `/conditions/${group}`, 'The actual species ability excludes this status.'); }
      if (group === 'sleep') r.check(!actor.enabledIqSkillIds.some(id => id === 'iq-nonsleeper'), '/conditions/sleep', 'Nonsleeper excludes finite move sleep.');
      conditions[group] = null;
    }
    const removedParalysis = actor.conditions.burn?.duration.policyId === 'native-move-status-v11';
    const base = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId).baseMovementSpeed + actor.speed.positiveTimers.filter(Boolean).length - actor.speed.negativeTimers.filter(Boolean).length;
    if (removedParalysis) r.check(actor.speed.cachedStage === Math.max(0, Math.min(4, base - 1)), '/speed/cachedStage', 'Paralysis subtracts exactly one speed stage.');
    steelAppend(r, prior.conditions({ ...actor, conditions, speed: removedParalysis ? { ...actor.speed, cachedStage: Math.max(0, Math.min(4, base)) } : actor.speed }, session, scope));
    return r.result();
  },
}; }
