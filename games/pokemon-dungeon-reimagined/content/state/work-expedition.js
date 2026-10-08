import { TOWN } from '../authored/town.js';
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { DEFAULT_IQ } from './opening-facts.js';
import { diagnostics } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */ const same = (a,b) => fingerprint(a) === fingerprint(b);
/** Add the source-qualified neutral binding without modifying or bypassing the
 * predecessor's common numerical/resource checks. Its one unsupported binding
 * requirement is replaced by the complete explicit client checks below.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Pick<Policies,'actor'|'floor'>} */
export function workExpeditionPolicies(prior, catalogs) { return {
  actor(actor, session, state, scope) {
    const preceding = prior.actor(actor, session, state, scope);
    if (actor.binding.kind !== 'job-client') return preceding;
    const r = diagnostics();
    if (!preceding.ok) {
      if (preceding.kind === 'invalid') for (const issue of preceding.issues) r.check(false, issue.path, issue.message);
      else for (const id of preceding.requirementIds) if (id !== 'P16:actor-binding:job-client') r.need(id);
    }
    const binding = actor.binding;
    const job = state.progress.jobs[binding.jobId], objective = session.objectives.find(row => row.jobId === binding.jobId);
    const identity = job?.goal.kind === 'find-pokemon' ? job.goal.target.identity : job?.goal.client.identity;
    r.check(session.purpose.kind === 'ordinary' && actor.affiliation === 'neutral' && job && ['rescue', 'find-pokemon', 'deliver-item'].includes(job.goal.kind) && same(actor.identity, identity), '/binding', 'Ordinary clients join the exact taken source job and neutral target identity.');
    r.check(session.floor.location.kind === 'exploration' && job?.goal.destination.floorId === session.floor.location.address.floorId, '/binding', 'Client belongs only to its current objective floor.');
    const completed = job?.phase.kind === 'objective-complete';
    r.check(completed ? objective?.state.kind === 'complete' && actor.placement.kind === 'off-map' && actor.placement.reason === 'rescued' : job?.phase.kind === 'active' && objective?.state.kind === 'actor-target' && objective.state.actorId === actor.actorId && !objective.state.complete && (actor.placement.kind === 'map' || actor.placement.reason === 'fainted' && actor.resources.hp === 0), '/placement', 'Live/fainted client targets and rescued completion retain distinct objective states.');
    const profile = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId), growth = catalogs.species.getGrowthAtLevel(profile.id, 1);
    const learned = catalogs.species.getLearnset(profile.id).levelUp.filter(row => row[0] !== undefined && row[0] <= 1).map(row => catalogs.species.identities.moves.find(move => move.originalId === row[1])?.id);
    r.check(actor.growth.level === 1 && actor.growth.iqPoints === 1 && actor.growth.totalExperience.numerator / actor.growth.totalExperience.denominator === growth.cumulativeExperience && same(actor.growth.naturalStats, growth.stats) && Object.values(actor.growth.permanentStatBonuses).every(value => value === 0), '/growth', 'Client uses native level1 initialization without roster growth.');
    r.check(learned.length <= 4 && same(actor.moves.slots.flatMap(row => row ? [row.moveId] : []), learned) && actor.moves.links.length === 0 && actor.moves.setMoveSlotId === null && same(actor.enabledIqSkillIds, DEFAULT_IQ) && actor.gains.experience.numerator === 0, '/moves', 'Client retains exact source initial moves/IQ and no earned experience.');
    r.check(state.containers[actor.heldContainerId]?.itemIds.length === 0 && Object.values(actor.conditions).every(value => value === null), '/conditions', 'Current neutral clients have no held item or reachable condition source.');
    return r.result();
  },
  floor(floor, session, state, scope) {
    if (session.purpose.kind !== 'ordinary') return prior.floor(floor, session, state, scope);
    const r = diagnostics();
    for (const exit of Object.values(floor.exits)) if (exit.destination.kind === 'town') r.check(exit.destination.mapDefinitionId === TOWN.post && exit.destination.entryId === 'ordinary-return', '/exits', 'Ordinary final stairs return to the reward station, never a story rescue scene.');
    const exits = Object.fromEntries(Object.entries(floor.exits).map(([id, exit]) => [id, exit.destination.kind !== 'town' ? exit : { ...exit, destination: { kind: /** @type {const} */ ('town'), mapDefinitionId: session.dungeonId === T.dungeonId ? T.clearing : /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-opening-meadow'), entryId: session.dungeonId === T.dungeonId ? 'magnemite-rescue' : 'caterpie-clearing' } }]));
    const preceding = prior.floor({ ...floor, exits }, session, state, scope);
    if (!preceding.ok) {
      if (preceding.kind === 'invalid') for (const issue of preceding.issues) r.check(false, issue.path, issue.message);
      else for (const id of preceding.requirementIds) r.need(id);
    }
    return r.result();
  },
}; }
