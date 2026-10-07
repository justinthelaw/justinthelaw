import { diagnostics, bounded, sameForm } from './pokemon-rules.js';
import { steelAppend } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Check new ownership before neutral projection to the frozen predecessor.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Partial<Policies>} */
export function fieldMovePolicies(prior, catalogs) { return {
  progress(state) {
    const r = diagnostics(), field = state.moveState;
    if (field) r.check('waterSportTurns' in field && bounded(field.waterSportTurns, 0, 11), '/moveState/waterSportTurns', 'Water Sport has a finite floor-wide native counter.');
    const projected = field ? { sessionId: field.sessionId, mapId: field.mapId, lightningRodActorId: field.lightningRodActorId } : field;
    steelAppend(r, prior.progress({ ...state, moveState: projected })); return r.result();
  },
  conditions(actor, session, scope) {
    const r = diagnostics(), c = actor.conditions.leechSeed;
    if (c?.duration.policyId !== 'native-field-moves-v16') return prior.conditions(actor, session, scope);
    r.check(c.statusId === 'leech-seed' && c.duration.kind === 'counter' && bounded(c.duration.remaining, 1, 12) && c.periodicCountdown !== null && bounded(c.periodicCountdown, 0, 2), '/conditions/leechSeed', 'Leech Seed has its exact class, finite timer and two-count pulse.');
    const ref = c.source.kind === 'actor' ? c.source.actor : null, user = ref ? session.actors[ref.actorId] : null;
    const active = [...session.scheduler.teamSlots, ...session.scheduler.wildSlots];
    r.check(actor.placement.kind === 'map' && actor.resources.hp > 0 && active.includes(actor.actorId) && !catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId).typeIds.includes(4), '/conditions/leechSeed/recipient', 'The seeded recipient is live on this floor and is not Grass type.');
    r.check(ref && user && ref.sessionId === session.sessionId && ref.mapId === session.floor.mapId && sameForm(ref.identity, user.identity) && user.actorId !== actor.actorId && user.placement.kind === 'map' && user.resources.hp > 0 && active.includes(user.actorId) && c.source.kind === 'actor' && c.source.moveId === 'move-leech-seed' && user.moves.slots.some(slot => slot?.moveId === 'move-leech-seed'), '/conditions/leechSeed/source', 'The original live user and learned Leech Seed own this floor link.');
    r.check(c.payload.kind === 'actor-link' && c.payload.actorId === user?.actorId, '/conditions/leechSeed/payload', 'The pulse recipient is exactly the historical move user.');
    steelAppend(r, prior.conditions({ ...actor, conditions: { ...actor.conditions, leechSeed: null } }, session, scope)); return r.result();
  },
}; }
