import { diagnostics, bounded, sameForm } from './pokemon-rules.js';
import { steelAppend } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** New move sources/classes are admitted independently; exact older condition
 * owners never gain new accepted sources through this successor projection.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Partial<Policies>} */
export function partyMovePolicies(prior, catalogs) { return {
  conditions(actor, session, scope) {
    const r = diagnostics(), conditions = { ...actor.conditions };
    for (const [group, status, moves, maximum] of /** @type {const} */ ([['burn', 'paralysis', ['move-thunder-wave', 'move-disable'], 2], ['cringe', 'infatuated', ['move-attract'], 6], ['sureShot', 'whiffer', ['move-smokescreen'], 6], ['reflect', 'reflect', ['move-reflect'], 12]])) {
      const condition = conditions[group];
      if (condition?.duration.policyId !== 'native-party-status-v14') continue;
      r.check(condition.statusId === status && condition.duration.kind === 'counter' && bounded(condition.duration.remaining, 1, maximum) && condition.periodicCountdown === null, `/conditions/${group}`, 'The party move has its exact status class and native timer range.');
      const ref = condition.source.kind === 'actor' ? condition.source.actor : null, source = ref ? session.actors[ref.actorId] : null;
      const moveId = condition.source.kind === 'actor' ? condition.source.moveId : null;
      r.check(ref && source && ref.sessionId === session.sessionId && ref.mapId === session.floor.mapId && sameForm(ref.identity, source.identity) && moves.some(id => id === moveId) && source.moves.slots.some(slot => slot?.moveId === moveId), `/conditions/${group}/source`, 'The exact learned move and historical actor own this status on the current floor.');
      if (group === 'reflect') r.check(source?.actorId === actor.actorId, `/conditions/${group}/source`, 'Reflect originates from the user.');
      r.check(condition.payload.kind === 'none', `/conditions/${group}/payload`, 'This move status has no secondary payload.');
      const immune = group === 'burn' ? 'Limber' : group === 'cringe' ? 'Oblivious' : null;
      if (immune) { const ability = catalogs.species.identities.abilities.find(row => row.name === immune); r.check(!ability || !catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId).abilityIds.includes(ability.originalId), `/conditions/${group}`, 'The recipient ability excludes this status.'); }
      conditions[group] = null;
    }
    const paralysis = actor.conditions.burn?.duration.policyId === 'native-party-status-v14';
    const base = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId).baseMovementSpeed + actor.speed.positiveTimers.filter(Boolean).length - actor.speed.negativeTimers.filter(Boolean).length;
    if (paralysis) r.check(actor.speed.cachedStage === Math.max(0, Math.min(4, base - 1)), '/speed/cachedStage', 'Direct paralysis subtracts one native speed stage.');
    steelAppend(r, prior.conditions({ ...actor, conditions, speed: paralysis ? { ...actor.speed, cachedStage: Math.max(0, Math.min(4, base)) } : actor.speed }, session, scope));
    return r.result();
  },
}; }
