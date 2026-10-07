import { diagnostics, bounded, sameForm } from './pokemon-rules.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** New status admission is versioned outside every predecessor condition owner.
 * Only specifically checked new classes are projected to neutral before the
 * unchanged policy validates all other conditions, stats and speed fields.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Partial<Policies>} */
export function withBattlePolicies(prior, catalogs) { return {
  conditions(actor, session, scope) {
    const r = diagnostics(), conditions = { ...actor.conditions };
    for (const [group, moveId, statusId, limit] of /** @type {const} */ ([['bide', 'move-bide', 'bide', 5], ['sureShot', 'move-focus-energy', 'focus-energy', 4], ['cringe', 'move-confusion', 'confused', 12]])) {
      const c = conditions[group];
      if (!c || c.duration.policyId !== 'native-battle-status-v9') continue;
      r.check(c.statusId === statusId && c.duration.kind === 'counter' && bounded(c.duration.remaining, 1, limit) && c.periodicCountdown === null, `/conditions/${group}`, 'Status class requires its exact native timer bounds and policy.');
      const source = c.source.kind === 'actor' ? c.source.actor : null;
      const sourceActor = source ? session.actors[source.actorId] : null;
      r.check(source && sourceActor && source.sessionId === session.sessionId && source.mapId === session.floor.mapId && sameForm(source.identity, sourceActor.identity) && c.source.kind === 'actor' && c.source.moveId === moveId && sourceActor.moves.slots.some(slot => slot?.moveId === moveId), `/conditions/${group}/source`, 'Status retains its actual learned-move actor source in this session and floor.');
      if (group !== 'cringe') r.check(source?.actorId === actor.actorId, `/conditions/${group}`, 'Self battle status belongs to its source actor.');
      if (group === 'bide') {
        r.check(c.payload.kind === 'charge' && c.payload.moveId === 'move-bide' && c.payload.target.kind === 'self' && bounded(c.payload.storedDamage, 0, 999) && actor.moves.slots.some(slot => slot?.moveSlotId === (c.payload.kind === 'charge' ? c.payload.moveSlotId : null) && slot.moveId === 'move-bide'), '/conditions/bide/payload', 'Bide retains its exact owning slot, self initiation and capped nominal damage.');
      } else r.check(c.payload.kind === 'none', `/conditions/${group}/payload`, 'No additional payload belongs to this status.');
      if (group === 'cringe') {
        const p = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId);
        const ownTempo = catalogs.species.identities.abilities.find(row => row.name === 'Own Tempo');
        r.check(!ownTempo || !p.abilityIds.includes(ownTempo.originalId), '/conditions/cringe', 'Own Tempo excludes confusion.');
      }
      conditions[group] = null;
    }
    // Confused friendly hits can trigger the same contact abilities. Preserve
    // the predecessor's exact status/timer/ability checks while replacing only
    // its former opposing-faction restriction, after checking a real source.
    const projectedActors = { ...session.actors };
    for (const c of Object.values(conditions)) {
      if (c?.duration.policyId !== 'native-cave-condition' || c.source.kind !== 'ability') continue;
      const source = session.actors[c.source.actor.actorId];
      if (!source || source.actorId === actor.actorId || source.affiliation !== actor.affiliation) continue;
      r.check(source.affiliation !== 'neutral' && actor.affiliation !== 'neutral', '/conditions/source', 'Only combat actors participate in confused friendly contact.');
      projectedActors[source.actorId] = { ...source, affiliation: actor.affiliation === 'team' ? 'hostile' : 'team' };
    }
    const preceding = prior.conditions({ ...actor, conditions }, { ...session, actors: projectedActors }, scope);
    if (!preceding.ok) {
      if (preceding.kind === 'invalid') for (const issue of preceding.issues) r.check(false, issue.path, issue.message);
      else for (const id of preceding.requirementIds) r.need(id);
    }
    return r.result();
  },
}; }
