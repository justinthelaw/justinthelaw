import { diagnostics, bounded, sameForm } from './pokemon-rules.js';
import { steelAppend } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Only item-origin Petrified is new. Exact prior Sleep/Leech and all other
 * policies still run, with this one owned group neutralized.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Partial<Policies>} */
export function stunSeedPolicies(prior, catalogs) { return {
  scheduler(session, state, scope) {
    const r = diagnostics(), frame = session.scheduler.continuation;
    steelAppend(r, prior.scheduler(session, state, scope));
    if (session.scheduler.kind === 'ready' && frame.pass === 'leader' && frame.stage === 'decision') r.check(session.actors[session.leaderActorId]?.conditions.frozen?.statusId !== 'petrified', '/continuation', 'A Petrified leader has no ready input decision before its own upkeep releases or expires the condition.');
    return r.result();
  },
  conditions(actor, session, scope) {
    const c = actor.conditions.frozen;
    if (c?.duration.policyId !== 'native-stun-seed-v18') return prior.conditions(actor, session, scope);
    const r = diagnostics(), ref = c.source.kind === 'item' ? c.source.user : null, user = ref ? session.actors[ref.actorId] : null;
    r.check(c.statusId === 'petrified' && c.duration.kind === 'counter' && c.periodicCountdown === null && c.payload.kind === 'none', '/conditions/frozen', 'Stun Seed owns only nonperiodic Petrified with a native counter and empty payload.');
    r.check(c.source.kind === 'item' && c.source.itemId === 'item-stun-seed' && ref && user && ['roster', 'wild', 'boss'].includes(user.binding.kind) && ref.sessionId === session.sessionId && ref.mapId === session.floor.mapId && sameForm(ref.identity, user.identity), '/conditions/frozen/source', 'The real Stun Seed user resolves to this exact historical session, map, actor and identity.');
    r.check(['roster', 'wild', 'boss'].includes(actor.binding.kind), '/conditions/frozen/recipient', 'This owner adds no guest, client or other role permission.');
    const active = [...session.scheduler.teamSlots, ...session.scheduler.wildSlots].includes(actor.actorId);
    const live = actor.placement.kind === 'map' && actor.placement.mapId === session.floor.mapId && actor.resources.hp > 0 && active;
    const fainted = actor.resources.hp === 0 && actor.placement.kind === 'off-map' && actor.placement.reason === 'fainted' && !active;
    r.check(live || fainted, '/conditions/frozen/recipient', 'The recipient is active and live on this floor, or its inactive zero-HP historical fainted actor.');
    const profile = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId);
    const naturalCure = catalogs.species.identities.abilities.find(row => row.name === 'Natural Cure');
    const maximum = naturalCure && profile.abilityIds.includes(naturalCure.originalId) ? 6 : actor.enabledIqSkillIds.some(id => id === 'iq-self-curer') ? 15 : 30;
    r.check(c.duration.kind === 'counter' && (actor.actorId === session.leaderActorId ? bounded(c.duration.remaining, 1, maximum) : [127, 128].includes(c.duration.remaining)), '/conditions/frozen/duration', 'The unchanged leader role has its finite curer bound; nonleaders retain native128-to-127 indefinite timing.');
    steelAppend(r, prior.conditions({ ...actor, conditions: { ...actor.conditions, frozen: null } }, session, scope)); return r.result();
  },
}; }
