import { diagnostics, bounded, sameForm } from './pokemon-rules.js';
import { steelAppend } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Narrow nonself item-source admission; all other v16 policies run unchanged.
 * Historical source actors and fainted recipients retain their finite effect;
 * source references still resolve to the exact session/floor/identity.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Partial<Policies>} */
export function itemImpactPolicies(prior, catalogs) { return {
  conditions(actor, session, scope) {
    const c = actor.conditions.sleep;
    if (c?.duration.policyId !== 'native-item-impact-v17') return prior.conditions(actor, session, scope);
    const r = diagnostics(), ref = c.source.kind === 'item' ? c.source.user : null, user = ref ? session.actors[ref.actorId] : null;
    r.check(c.statusId === 'sleep' && c.duration.kind === 'counter' && bounded(c.duration.remaining, 1, 6) && c.periodicCountdown === null && c.payload.kind === 'none', '/conditions/sleep', 'Thrown Sleep Seed retains its exact ordinary class, finite timer and empty payload.');
    r.check(c.source.kind === 'item' && c.source.itemId === 'item-sleep-seed' && ref && user && user.actorId !== actor.actorId && ref.sessionId === session.sessionId && ref.mapId === session.floor.mapId && sameForm(ref.identity, user.identity), '/conditions/sleep/source', 'The exact Sleep Seed and real historical nonself user own this session/floor effect.');
    const active = [...session.scheduler.teamSlots, ...session.scheduler.wildSlots].includes(actor.actorId);
    const live = actor.placement.kind === 'map' && actor.placement.mapId === session.floor.mapId && actor.resources.hp > 0 && active;
    const fainted = actor.resources.hp === 0 && actor.placement.kind === 'off-map' && actor.placement.reason === 'fainted' && !active;
    r.check(live || fainted, '/conditions/sleep/recipient', 'The recipient is live and active on this floor, or an inactive historical fainted actor with zero HP.');
    const profile = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId);
    const immune = catalogs.species.identities.abilities.filter(row => ['Insomnia', 'Vital Spirit'].includes(row.name));
    r.check(!actor.enabledIqSkillIds.some(id => id === 'iq-nonsleeper') && !immune.some(row => profile.abilityIds.includes(row.originalId)), '/conditions/sleep/recipient', 'The recipient cannot have sleep-preventing IQ or ability.');
    steelAppend(r, prior.conditions({ ...actor, conditions: { ...actor.conditions, sleep: null } }, session, scope)); return r.result();
  },
}; }
