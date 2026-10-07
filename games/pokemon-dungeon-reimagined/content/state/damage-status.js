import { diagnostics, bounded, sameForm } from './pokemon-rules.js';
import { steelAppend } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Versioned new move sources, with exact v14 policy delegated unchanged.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Partial<Policies>} */
export function damageStatusPolicies(prior, catalogs) { return {
  conditions(actor, session, scope) {
    const r = diagnostics(), conditions = { ...actor.conditions };
    for (const [group, status, moves, maximum] of /** @type {const} */ ([['burn', 'burn', ['move-ember'], 128], ['cringe', 'cringe', ['move-bite', 'move-bone-club', 'move-headbutt'], 2], ['bide', 'enraged', ['move-rage'], 10]])) {
      const c = conditions[group]; if (c?.duration.policyId !== 'native-damage-status-v15') continue;
      r.check(c.statusId === status && c.duration.kind === 'counter' && bounded(c.duration.remaining, group === 'burn' ? 127 : 1, maximum), `/conditions/${group}`, 'The damaging move has its exact status class and native timer range.');
      const ref = c.source.kind === 'actor' ? c.source.actor : null, source = ref ? session.actors[ref.actorId] : null, moveId = c.source.kind === 'actor' ? c.source.moveId : null;
      r.check(ref && source && ref.sessionId === session.sessionId && ref.mapId === session.floor.mapId && sameForm(ref.identity, source.identity) && moves.some(id => id === moveId) && source.moves.slots.some(slot => slot?.moveId === moveId), `/conditions/${group}/source`, 'This learned move and actual historical actor own the condition in this floor.');
      r.check(group === 'burn' ? c.periodicCountdown !== null && bounded(c.periodicCountdown, 0, 20) : c.periodicCountdown === null, `/conditions/${group}/periodicCountdown`, 'Only burn has a periodic damage counter.');
      if (group === 'bide') r.check(source?.actorId === actor.actorId && c.payload.kind === 'charge' && c.payload.moveId === 'move-rage' && c.payload.target.kind === 'self' && c.payload.storedDamage === 0 && actor.moves.slots.some(slot => slot?.moveSlotId === (c.payload.kind === 'charge' ? c.payload.moveSlotId : null) && slot.moveId === 'move-rage'), '/conditions/bide/payload', 'Rage retains its owning self move slot without Bide damage accumulation.');
      else r.check(c.payload.kind === 'none', `/conditions/${group}/payload`, 'This condition has no additional payload.');
      const p = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId), immune = group === 'burn' ? 'Water Veil' : group === 'cringe' ? 'Inner Focus' : null;
      if (immune) { const ability = catalogs.species.identities.abilities.find(row => row.name === immune); r.check(!ability || !p.abilityIds.includes(ability.originalId), `/conditions/${group}`, 'Recipient ability excludes the status.'); }
      if (group === 'burn') r.check(!p.typeIds.includes(2), '/conditions/burn', 'Fire types cannot be burned.');
      conditions[group] = null;
    }
    steelAppend(r, prior.conditions({ ...actor, conditions }, session, scope)); return r.result();
  },
}; }
