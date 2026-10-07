import { requireRelation as check, unique, keyed, checkMoves, fingerprint, hasMoveReference, actorHasMoveReference } from './relations.js';
import { checkInventory } from './inventory.js';
import { checkSession } from './session.js';
import { participantPokemonIds } from './participants.js';

/** @typedef {import('./relations.js').GraphContext} GraphContext */
/** @typedef {import('../../contracts/campaign.js').Continuation} Continuation */

/** @param {GraphContext} context @param {Continuation} continuation @param {string} path */
function checkContinuation(context, continuation, path) {
  const state = context.state;
  if ('sessionId' in continuation) check(context, state.session?.sessionId === continuation.sessionId, path, 'Continuation session is absent.');
  if (continuation.kind === 'await-rescue') check(context, state.rescue.suspended?.requestId === continuation.requestId, path, 'Continuation rescue suspension is absent.');
  if (continuation.kind === 'town') check(context, continuation.destination.kind === 'town', path, 'Town continuation requires a town destination.');
  if (continuation.kind === 'resume-turn') {
    const gate = continuation.gate;
    const scheduler = state.session?.scheduler;
    check(context, gate.kind === 'result' ? scheduler?.kind === 'choice-paused' && scheduler.resultId === gate.resultId && state.pendingResult?.resultId === gate.resultId : scheduler?.kind === 'scene-paused' && scheduler.sceneInstanceId === gate.sceneInstanceId && state.pendingScene?.sceneInstanceId === gate.sceneInstanceId, path, 'Continuation gate does not own the paused scheduler.');
  }
}
/** @param {GraphContext} context */
function checkFlows(context) {
  const state = context.state;
  const result = state.pendingResult;
  const scene = state.pendingScene;
  switch (state.mode) {
    case 'town': check(context, state.session === null && scene === null && (!result || ['job-reward', 'choice', 'move-learn-choice', 'expedition-complete', 'rescue'].includes(result.kind)), '/mode', 'Town mode is inconsistent with its flow owners.'); break;
    case 'dungeon': check(context, state.session !== null && scene === null && (!result || ['recruit-choice', 'move-learn-choice', 'choice', 'rescue'].includes(result.kind)) && (state.session?.status === 'active' || result !== null), '/mode', 'Dungeon mode is inconsistent with its flow owners.'); break;
    case 'scene': check(context, scene !== null && result === null, '/mode', 'Scene mode requires one pending scene.'); break;
    case 'awaitingRescue': check(context, state.session === null && scene === null && state.rescue.suspended !== null && (!result || result.kind === 'rescue'), '/mode', 'Awaiting rescue requires its isolated suspension.'); break;
    case 'defeat': check(context, state.session === null && scene === null && result?.kind === 'defeat', '/mode', 'Defeat requires its committed final result.'); break;
  }
  if (scene) {
    unique(context, scene.bindings.map(binding => binding.roleId), '/pendingScene/bindings');
    unique(context, scene.choices.map(choice => choice.choiceId), '/pendingScene/choices');
    if ((scene.awaiting.kind === 'choice' || scene.awaiting.kind === 'name-confirm')) unique(context, scene.awaiting.optionIds, '/pendingScene/awaiting');
    for (const binding of scene.bindings) {
      if (binding.kind === 'pokemon') check(context, !!state.roster[binding.pokemonId], '/pendingScene', 'Scene Pokemon binding is absent.');
      if (binding.kind === 'actor') check(context, !!state.session?.actors[binding.actorId], '/pendingScene', 'Scene actor binding is absent.');
      if (binding.kind === 'job') check(context, !!state.progress.jobs[binding.jobId], '/pendingScene', 'Scene job binding is absent.');
      if (binding.kind === 'item') check(context, !!state.items[binding.itemInstanceId], '/pendingScene', 'Scene item binding is absent.');
    }
    checkContinuation(context, scene.continuation, '/pendingScene/continuation');
  }
  if (result) {
    if ('continuation' in result) checkContinuation(context, result.continuation, '/pendingResult/continuation');
    if (result.kind === 'choice') {
      unique(context, result.options.map(option => option.optionId), '/pendingResult/options');
      check(context, result.options.length > 0, '/pendingResult/options', 'Choice has no offered options.');
      for (const option of result.options) checkContinuation(context, option.continuation, '/pendingResult/options');
    }
    if (result.kind === 'expedition-complete' || result.kind === 'defeat') {
      unique(context, result.summary.retainedPokemonIds, '/pendingResult/summary'); unique(context, result.summary.completedJobIds, '/pendingResult/summary');
      for (const id of result.summary.retainedPokemonIds) check(context, !!state.roster[id], '/pendingResult', 'Retained Pokemon is absent.');
      for (const id of result.summary.completedJobIds) check(context, !!state.progress.jobs[id], '/pendingResult', 'Completed result job is absent.');
      check(context, result.kind === 'defeat' ? ['fainting', 'wind-expulsion', 'rescue-abandoned', 'give-up'].includes(result.summary.outcome) : !['fainting', 'wind-expulsion', 'rescue-abandoned'].includes(result.summary.outcome), '/pendingResult', 'Defeat result has a successful outcome.');
    }
    if (result.kind === 'job-reward') {
      const job = state.progress.jobs[result.jobId];
      check(context, job?.phase.kind === 'claimed' && job.phase.claimedRevision === result.grantedRevision && result.grantedRevision === result.createdRevision && fingerprint(job.reward) === fingerprint(result.reward), '/pendingResult', 'Displayed reward differs from its committed job claim.');
    }
    if (result.kind === 'recruit-choice') {
      check(context, state.session?.sessionId === result.sessionId && state.session.actors[result.actorId]?.binding.kind === 'temporary-recruit', '/pendingResult', 'Recruit choice has no temporary recruit.');
      unique(context, result.optionIds, '/pendingResult'); check(context, result.optionIds.length > 0, '/pendingResult', 'Recruit choice has no options.');
    }
    if (result.kind === 'move-learn-choice') {
      const owner = result.owner;
      const pokemon = owner.kind === 'pokemon' ? state.roster[owner.pokemonId] : undefined;
      const actor = owner.kind === 'actor' ? state.session?.actors[owner.actorId] : undefined;
      check(context, (pokemon !== undefined || actor !== undefined) && result.replaceableSlotIds.every(id => pokemon ? hasMoveReference(pokemon.moves, id) : actorHasMoveReference(actor, id)), '/pendingResult', 'Move choice owner or slot is absent.');
      unique(context, result.replaceableSlotIds, '/pendingResult');
      check(context, result.sessionId === null ? owner.kind === 'pokemon' : state.session?.sessionId === result.sessionId, '/pendingResult', 'Move choice session is absent.');
    }
    if (result.kind === 'rescue') check(context, !!state.rescue.records[result.requestId], '/pendingResult', 'Rescue result request is absent.');
  }
}

/** @param {import('../../contracts/campaign.js').CampaignState} state @param {import('../../contracts/campaign.js').StateIssue[]} issues */
export function checkGraph(state, issues) {
  const context = { state, issues };
  keyed(context, state.roster, pokemon => pokemon.pokemonId, '/roster');
  check(context, state.profile.heroId !== state.profile.partnerId && !!state.roster[state.profile.heroId] && !!state.roster[state.profile.partnerId], '/profile', 'Distinct hero and partner records are required.');
  unique(context, state.selectedPartyIds, '/selectedPartyIds');
  for (const id of state.selectedPartyIds) check(context, !!state.roster[id], '/selectedPartyIds', 'Selected individual is absent.');
  unique(context, state.economy.ownedFriendAreaIds, '/economy/ownedFriendAreaIds');
  unique(context, state.economy.storedItems.map(stack => fingerprint(stack.template)), '/economy/storedItems');
  for (const stack of state.economy.storedItems) check(context, stack.count > 0, '/economy/storedItems', 'Stored stack must be positive.');
  for (const pokemon of Object.values(state.roster)) {
    checkMoves(context, pokemon.moves, `/roster/${pokemon.pokemonId}/moves`);
    unique(context, pokemon.enabledIqSkillIds, `/roster/${pokemon.pokemonId}`);
    check(context, state.economy.ownedFriendAreaIds.includes(pokemon.friendAreaId), '/roster', 'Pokemon accommodation is not owned.');
  }
  checkInventory(context, state, state.session, state.roster, 'live', '', state.economy.toolbox);
  if (state.session) checkSession(context, state.session, false, '/session');
  const suspended = state.rescue.suspended;
  if (suspended) {
    checkSession(context, suspended.session, true, '/rescue/suspended/session');
    checkInventory(context, suspended.itemArchive, suspended.session, {}, 'rescue-suspended', '/rescue/suspended/itemArchive', null);
    const record = state.rescue.records[suspended.requestId];
    check(context, record?.direction === 'self' && ['requested', 'accepted', 'completed'].includes(record.phase) && record.digest === suspended.requestDigest, '/rescue/suspended', 'Suspension has no matching self-rescue request.');
    if (state.session) {
      check(context, state.session.sessionId !== suspended.session.sessionId, '/session', 'One run cannot be active and suspended.');
      const reserved = participantPokemonIds(suspended.session);
      for (const id of participantPokemonIds(state.session)) check(context, !reserved.has(id), '/session/entry', 'Active run reuses a reserved suspended participant.');
    }
    for (const id of Object.keys(suspended.itemArchive.items)) check(context, !Object.hasOwn(state.items, id), '/rescue/suspended', 'Suspended item remains live.');
    for (const id of Object.keys(suspended.itemArchive.containers)) check(context, !Object.hasOwn(state.containers, id), '/rescue/suspended', 'Suspended container remains live.');
  }
  keyed(context, state.progress.jobs, job => job.jobId, '/progress/jobs');
  keyed(context, state.progress.branches, branch => branch.branchId, '/progress/branches');
  keyed(context, state.progress.milestones, milestone => milestone.milestoneId, '/progress/milestones');
  keyed(context, state.progress.clears, clear => clear.dungeonId, '/progress/clears');
  keyed(context, state.progress.seenScenes, scene => scene.sceneId, '/progress/seenScenes');
  unique(context, state.progress.acceptedJobIds, '/progress/acceptedJobIds');
  for (const id of state.progress.acceptedJobIds) check(context, !!state.progress.jobs[id] && ['accepted', 'active', 'objective-complete', 'reward-ready'].includes(state.progress.jobs[id].phase.kind), '/progress/acceptedJobIds', 'Accepted job is missing or has an incompatible phase.');
  for (const job of Object.values(state.progress.jobs)) {
    if (['accepted', 'active', 'objective-complete', 'reward-ready'].includes(job.phase.kind)) check(context, state.progress.acceptedJobIds.includes(job.jobId), '/progress/jobs', 'Accepted job is missing from order.');
    if (job.phase.kind === 'active') {
      const phase = job.phase;
      const run = [state.session, suspended?.session].find(session => session?.sessionId === phase.sessionId);
      check(context, run?.objectives[phase.objectiveIndex]?.jobId === job.jobId, '/progress/jobs', 'Active job objective does not resolve.');
    }
  }
  unique(context, state.progress.appliedGrants.map(grant => grant.grantId), '/progress/appliedGrants');
  unique(context, state.progress.consumedMail.map(mail => fingerprint([mail.formatId, mail.digest])), '/progress/consumedMail');
  check(context, state.progress.consumedMail.length <= 10000, '/progress/consumedMail', 'Mail replay-protection budget is exhausted.');
  for (const clear of Object.values(state.progress.clears)) {
    check(context, clear.firstClearRevision <= clear.lastClearRevision && clear.firstClearDay <= clear.lastClearDay && clear.clearCount > 0, '/progress/clears', 'Clear history ordering is invalid.'); unique(context, clear.reachedFloorIds, '/progress/clears');
  }
  for (const visit of Object.values(state.progress.seenScenes)) check(context, visit.firstRevision <= visit.lastRevision && visit.firstDay <= visit.lastDay && visit.count > 0, '/progress/seenScenes', 'Scene history ordering is invalid.');
  unique(context, state.town.placements.map(placement => fingerprint(placement.reference)), '/town/placements');
  for (const placement of state.town.placements) if (placement.reference.kind === 'pokemon') check(context, !!state.roster[placement.reference.pokemonId], '/town/placements', 'Town individual is absent.');
  unique(context, state.town.serviceStock.map(stock => stock.serviceId), '/town/serviceStock');
  for (const stock of state.town.serviceStock) if ('items' in stock) unique(context, stock.items.map(stack => fingerprint(stack.template)), '/town/serviceStock');
  keyed(context, state.rescue.records, record => record.requestId, '/rescue/records');
  keyed(context, state.rescue.importedTeams, team => team.teamId, '/rescue/importedTeams');
  for (const record of Object.values(state.rescue.records)) if (record.linkedJobId) check(context, !!state.progress.jobs[record.linkedJobId], '/rescue/records', 'Rescue linked job is absent.');
  for (const team of Object.values(state.rescue.importedTeams)) {
    unique(context, team.members.map(member => member.memberKey), '/rescue/importedTeams');
    for (const member of team.members) checkMoves(context, member.moves, '/rescue/importedTeams');
  }
  checkFlows(context);
}
