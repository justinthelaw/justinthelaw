import { createProfilePolicy } from './profile.js';
import { createPokemonPolicy } from './pokemon.js';
import { createItemPolicy } from './items.js';
import { createEconomyPolicy } from './economy.js';
import { createActorPolicy, createConditionsPolicy } from './expedition-current.js';
import { createEscortFloorPolicy } from './escort-floor.js';
import { validateScheduler, INITIAL_SCHEDULE_POLICY_ID } from './expedition.js';
import { withBattlePolicies } from './battle-mechanics.js';
import { withMovePolicies } from './move-mechanics.js';
import { partyMovePolicies } from './party-moves.js';
import { damageStatusPolicies } from './damage-status.js';
import { fieldMovePolicies } from './field-moves.js';
import { itemImpactPolicies } from './item-impact.js';
import { escortStunSeedPolicies } from './escort-stun-seed.js';
import { nativeWildPolicies } from './native-wild-ai.js';
import { steelExpeditionPolicies } from './steel-expedition.js';
import { workExpeditionPolicies } from './work-expedition.js';
import { continuationPolicies } from './continuation-policy.js';
import { validateCampaignOptions } from './options.js';
import { FRIENDS } from '../authored/friends.js';
import { ORDINARY_SUMMIT } from '../authored/steel-meanies.js';
import { STEEL } from '../authored/mt-steel.js';
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { OPENING_EXPEDITION as O } from '../authored/expedition.js';
import { DEFAULT_IQ } from './opening-facts.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
import { escortEntryProblem } from '../../src/domain/state/escort-entry-proof.js';
import { escortHistoryProblem } from '../../src/domain/state/escort-history-proof.js';
import { learningProblem, forgottenProblem } from '../../src/domain/state/escort-learning-proof.js';
import { createScheduler } from '../../src/domain/turns.js';
import { pendingSpecialSwap } from '../../src/domain/gameplay/swap-continuation.js';
/** Direct actual-state field owners; historical whole-campaign callbacks are
 * never invoked and the guest, slots, resources and history remain visible.
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies
 * @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/domain/gameplay/support.js').Catalogs} Catalogs */
/** Independently preflight new ownership before each callback.
 * @param {State} state @param {Catalogs} catalogs */
export function escortResourceProof(state,catalogs) {
  const r = diagnostics(),problem = escortEntryProblem(state,catalogs) ?? escortHistoryProblem(state) ?? learningProblem(state,catalogs);
  if (problem) r.check(false,'/session',problem);
  return r.result();
}
/** @param {Catalogs} catalogs
 * @param {import('../../src/contracts/campaign.js').CampaignIdentityLookup} identities
 * @param {(state:State)=>import('../../src/contracts/campaign.js').RuleCheck} completeRawProof
 * @returns {Pick<Policies,'profile'|'pokemon'|'actor'|'item'|'economy'|'floor'|'conditions'|'scheduler'|'expeditionEntry'|'options'>} */
export function createEscortResourcePolicies(catalogs,identities,completeRawProof) {
  const baseActor = createActorPolicy(catalogs),basePokemon = createPokemonPolicy(catalogs);
  const profile = createProfilePolicy(catalogs),economy = createEconomyPolicy(catalogs),itemOwner = createItemPolicy(catalogs);
  // Each reused wrapper calls only its supplied field primitive. The final
  // factory installs other callbacks; no fabricated campaign state is supplied.
  const local = /** @type {Policies} */ (/** @type {unknown} */ ({ actor: baseActor,floor: createEscortFloorPolicy(identities,catalogs),conditions: createConditionsPolicy(catalogs.species),scheduler: validateScheduler }));
  const steel = steelExpeditionPolicies(local,catalogs),wild = nativeWildPolicies(local),clients = workExpeditionPolicies(local,catalogs);
  let conditionOwners = local;
  for (const build of [withBattlePolicies,withMovePolicies,partyMovePolicies,damageStatusPolicies,fieldMovePolicies,itemImpactPolicies,escortStunSeedPolicies]) conditionOwners = { ...conditionOwners,...build(conditionOwners,catalogs) };
  const conditions = conditionOwners.conditions,floorOwner = continuationPolicies({ ...local,floor: steel.floor },catalogs).floor,automaticScheduler = continuationPolicies(local,catalogs).scheduler;
  /** @param {State} state @param {()=>import('../../src/contracts/campaign.js').RuleCheck} run */
  function proven(state,run) {
    const raw = escortResourceProof(state,catalogs); if (!raw.ok) return raw;
    const complete = completeRawProof(state); return complete.ok ? run() : complete;
  }
  return {
    profile(state) { return proven(state,() => profile(state)); },
    economy(state) { return proven(state,() => economy(state)); },
    item(item,container,state,scope) { return proven(state,() => itemOwner(item,container,state,scope)); },
    pokemon(record,state,scope) { return proven(state,() => {
      const r = diagnostics(),story = record.origin.kind === 'scripted' && record.origin.grantId === FRIENDS.grant;
      if (story) {
        const receipt = state.progress.appliedGrants.filter(row => row.grantId === FRIENDS.grant);
        r.check(state.friends?.magnemiteId === record.pokemonId && receipt.length === 1 && receipt[0]?.day === state.friends.startedDay && record.identity.speciesId === 'pokemon-081' && record.identity.formId === null && record.origin.kind === 'scripted' && record.origin.metLevel === 6 && record.evolutionHistory.length === 0 && record.growth.level >= 6 && same(record.growth.naturalStats,catalogs.species.getGrowthAtLevel(catalogs.species.getProfile('pokemon-081',null).id,record.growth.level).stats) && record.growth.iqPoints === 1 && Object.values(record.growth.permanentStatBonuses).every(value => value === 0),'/origin','The actual one-time level6 story Magnemite grant remains its origin during normal source growth and move acquisition.');
      }
      append(r,basePokemon(record,state,scope),story ? [`P19:pokemon-grant:${FRIENDS.grant}`] : []); return r.result();
    }); },
    actor(actor,session,state,scope) { return proven(state,() => {
      if (actor.binding.kind === 'wild') return session.dungeonId === STEEL.dungeonId ? steel.actor(actor,session,state,scope) : wild.actor?.(actor,session,state,scope) ?? baseActor(actor,session,state,scope);
      if (actor.binding.kind === 'boss' || actor.binding.kind === 'guest') return steel.actor(actor,session,state,scope);
      if (actor.binding.kind === 'job-client') {
        const job = state.progress.jobs[actor.binding.jobId];
        if (job?.goal.kind !== 'escort') return clients.actor(actor,session,state,scope);
        return escortRecipient(actor,session,state,catalogs,baseActor(actor,session,state,scope));
      }
      const origin = session.learning?.origin ?? session.learningWork?.origin;
      const casualty = origin?.kind === 'settlement' && origin.outcome === 'fainting' && actor.binding.kind === 'roster' && actor.resources.hp === 0 && actor.placement.kind === 'map';
      // Only the already-proved pending loss bypasses the primitive live-HP
      // guard. Its real actor, source PC, slot and resources stay canonical.
      const checkedActor = casualty ? { ...actor,placement: /** @type {const} */ ({ kind: 'off-map',reason: 'fainted' }) } : actor;
      const r = diagnostics(); append(r,baseActor(checkedActor,session,state,scope),actor.binding.kind === 'escort-guest' ? ['P16:actor-binding:escort-guest'] : []);
      if (actor.binding.kind === 'escort-guest') r.check(scope.kind === 'live' && session === state.session && session.escortGuest?.entry.actorId === actor.actorId,'/binding','The independently source-proved temporary guest has one actual live owner, never a roster or rescue projection.');
      return r.result();
    }); },
    floor(floor,session,state,scope) { return proven(state,() => {
      const actual = session.learning || session.learningWork ? pendingSpecialSwap(session,catalogs)?.original ?? session : session;
      return floorOwner(floor,actual,state,scope);
    }); },
    conditions(actor,session,scope,state) {
      if (!state) { const r = diagnostics(); r.check(false,'/conditions','Raw condition admission requires the actual canonical state.'); return r.result(); }
      return proven(state,() => {
        const problem = forgottenProblem(session,catalogs,state.revision,state.roster);
        if (problem || session.forgottenMoves?.length && (scope.kind !== 'live' || state.session !== session || session.actors[actor.actorId] !== actor)) { const r = diagnostics(); r.check(false,'/forgottenMoves',problem ?? 'Historical slots require their actual live session and actor.'); return r.result(); }
        if (!session.forgottenMoves?.length) return conditions(actor,session,scope,state);
        // Retired slots authenticate historical condition provenance only.
        // Current AI, PP, move menus and team identities retain actual values.
        const actors = { ...session.actors };
        for (const source of Object.values(actors)) {
          const retired = session.forgottenMoves.filter(row => row.actorId === source.actorId).map(row => row.moveSlot);
          if (retired.length) actors[source.actorId] = { ...source,moves: { ...source.moves,slots: /** @type {typeof source.moves.slots} */ (/** @type {unknown} */ ([...source.moves.slots,...retired])) } };
        }
        return conditions(actors[actor.actorId] ?? actor,{ ...session,actors },scope,state);
      });
    },
    scheduler(session,state,scope) { return proven(state,() => {
      if (session.learning || session.learningWork) { const r = diagnostics(); r.check(scope.kind === 'live' && session === state.session && session.scheduler.schedulePolicyId === INITIAL_SCHEDULE_POLICY_ID,'/scheduler','The independently proved real learning PC retains the actual live native schedule.'); return r.result(); }
      if (session.purpose.kind === 'ordinary' && session.scheduler.kind === 'scene-paused') {
        const r = diagnostics(),s = session.scheduler,fresh = createScheduler(INITIAL_SCHEDULE_POLICY_ID,[...s.teamSlots],[...s.wildSlots]);
        r.check(scope.kind === 'live' && session === state.session && state.pendingScene?.sceneId === ORDINARY_SUMMIT && s.sceneInstanceId === state.pendingScene.sceneInstanceId && s.continuation.terminal === 'dungeon-exit' && s.roundNumber === 0 && s.schedulePolicyId === INITIAL_SCHEDULE_POLICY_ID && same({ ...s.continuation,terminal: 'none' },fresh.continuation),'/continuation','The actual ordinary summit retains its fresh source scheduler before any actor turn, including its genuine guest slot.'); return r.result();
      }
      const r = diagnostics(); append(r,session.scheduler.kind === 'continuing' ? automaticScheduler(session,state,scope) : session.purpose.kind === 'story' && session.dungeonId === STEEL.dungeonId ? steel.scheduler(session,state,scope) : validateScheduler(session,state,scope));
      const c = session.scheduler.continuation;
      if (session.scheduler.kind === 'ready' && c.pass === 'leader' && c.stage === 'decision') r.check(session.actors[session.leaderActorId]?.conditions.frozen?.statusId !== 'petrified','/continuation','Petrified leaders cannot expose an input boundary before actual upkeep.');
      return r.result();
    }); },
    expeditionEntry(session,state,_scope) { return proven(state,() => {
      const r = diagnostics(),entry = session.entry,policy = session.dungeonId === STEEL.dungeonId ? STEEL : session.dungeonId === T.dungeonId ? { entryPolicy: T.entryPolicy,outcomePolicy: T.outcomePolicy } : { entryPolicy: O.entryPolicy,outcomePolicy: O.outcomePolicy };
      r.check(['tiny-woods',T.dungeonId,STEEL.dungeonId].includes(session.dungeonId),'/dungeonId','Only the three actual source-qualified routes use this entry owner.');
      r.check(entry.entryPolicyId === policy.entryPolicy && entry.outcomePolicySetId === policy.outcomePolicy && same(Object.keys(entry.entrants),entry.selectedPartyIds),'/entry','Real selected roster entrants retain the route standard nonreset policies; guests remain separate.');
      for (const baseline of Object.values(entry.entrants)) {
        const p = baseline.pokemon;
        r.check(same(baseline.projectedGrowth,p.growth) && same(baseline.projectedMoves,p.moves) && same(baseline.projectedIqSkillIds,p.enabledIqSkillIds) && baseline.projectedTacticId === p.tacticId && baseline.projectedHiddenPower === null,'/entry/entrants','Every genuine entrant retains its own unchanged permanent baseline and explicit ordinary Hidden Power mapping.');
        r.check(baseline.projectedResources.hp === p.growth.naturalStats.hp+p.growth.permanentStatBonuses.hp && same(baseline.projectedResources.belly,{ numerator: 100,denominator: 1 }) && same(baseline.projectedResources.maxBelly,{ numerator: 100,denominator: 1 }) && same(baseline.projectedResources.hpRegenerationAccumulator,{ numerator: 0,denominator: 1 }),'/entry/entrants','Every real roster entrant receives full resources and zero regeneration before any turn.');
        r.check(baseline.projectedPp.slots.length === p.moves.slots.filter(Boolean).length && p.moves.slots.every(slot => !slot || baseline.projectedPp.slots.some(pp => pp.moveSlotId === slot.moveSlotId && pp.currentPp === catalogs.effects.getMove(slot.moveId).numeric.pp && !pp.sealed && !pp.usedForExperience)),'/entry/entrants/projectedPp','Source entry PP is full for each permanent move slot.');
      }
      r.check(bounded(entry.entryRevision,1,state.revision),'/entry/entryRevision','The entry receipt belongs to a real committed revision.'); return r.result();
    }); },
    options: validateCampaignOptions,
  };
}
/** @param {import('../../src/contracts/campaign.js').SessionActor} actor
 * @param {import('../../src/contracts/campaign.js').ExpeditionState} session
 * @param {State} state @param {Catalogs} catalogs
 * @param {import('../../src/contracts/campaign.js').RuleCheck} common */
function escortRecipient(actor,session,state,catalogs,common) {
  const r = diagnostics(); append(r,common,['P16:actor-binding:job-client']);
  const job = actor.binding.kind === 'job-client' ? state.progress.jobs[actor.binding.jobId] : null;
  if (job?.goal.kind !== 'escort') { r.check(false,'/binding','The neutral recipient requires its actual escort request.'); return r.result(); }
  const objective = session.objectives.find(row => row.jobId === job.jobId),profile = catalogs.species.getProfile(actor.identity.speciesId,actor.identity.formId),growth = catalogs.species.getGrowthAtLevel(profile.id,1);
  const moves = catalogs.species.getLearnset(profile.id).levelUp.filter(row => row[0] !== undefined && row[0] <= 1).map(row => catalogs.species.identities.moves.find(move => move.originalId === row[1])?.id);
  r.check(session.purpose.kind === 'ordinary' && actor.affiliation === 'neutral' && same(actor.identity,job.goal.recipient.identity) && session.floor.location.kind === 'exploration' && job.goal.destination.floorId === session.floor.location.address.floorId,'/binding','A native escort objective actor is the independent recipient on the actual request floor.');
  r.check(job.phase.kind === 'objective-complete' ? objective?.state.kind === 'complete' && actor.placement.kind === 'off-map' && actor.placement.reason === 'rescued' : job.phase.kind === 'active' && objective?.state.kind === 'actor-target' && objective.state.actorId === actor.actorId && !objective.state.complete && (actor.placement.kind === 'map' || actor.placement.reason === 'fainted' && actor.resources.hp === 0),'/placement','Recipient ownership retains the real active/fainted or completed branch.');
  r.check(actor.growth.level === 1 && actor.growth.iqPoints === 1 && actor.growth.totalExperience.numerator / actor.growth.totalExperience.denominator === growth.cumulativeExperience && same(actor.growth.naturalStats,growth.stats) && Object.values(actor.growth.permanentStatBonuses).every(value => value === 0) && moves.length <= 4 && same(actor.moves.slots.flatMap(row => row ? [row.moveId] : []),moves) && actor.moves.links.length === 0 && actor.moves.setMoveSlotId === null && same(actor.enabledIqSkillIds,DEFAULT_IQ) && actor.gains.experience.numerator === 0 && state.containers[actor.heldContainerId]?.itemIds.length === 0 && Object.values(actor.conditions).every(value => value === null),'/growth','The neutral recipient retains source level1 moves/stats/IQ and empty held/status resources.');
  return r.result();
}
