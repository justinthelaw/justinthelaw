import { blocked } from './support.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../../contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../../contracts/campaign.js').JobRecord} Job
 */

/** Native only taken6 jobs enter a dungeon's objective set; accepted5 remains
 * suspended. Ordinary job entry never changes a story request's purpose.
 * @param {State} state @param {Session} session */
export function enterJobObjectives(state, session) {
  if (session.purpose.kind !== 'ordinary') return;
  for (const id of state.progress.acceptedJobIds) {
    const job = state.progress.jobs[id];
    if (!job || job.phase.kind !== 'accepted' || job.goal.destination.dungeonId !== session.dungeonId) continue;
    const objectiveIndex = session.objectives.length;
    session.objectives.push({ jobId: id, definitionId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-early-job-objective'), state: { kind: 'pending' } });
    job.phase = { kind: 'active', sessionId: session.sessionId, objectiveIndex };
  }
}

/** Only native rescue0/1 and delivery4 replace a floor monster with a client.
 * Find-item3 is checked against returned toolbox ownership, not floor visitation.
 * @param {Snapshot} state @param {string} floorId */
export function floorJobClient(state, floorId) {
  const session = state.session; if (session?.purpose.kind !== 'ordinary') return null;
  const jobs = state.progress.acceptedJobIds.flatMap(id => {
    const job = state.progress.jobs[id];
    return job?.phase.kind === 'active' && job.phase.sessionId === session.sessionId && job.goal.destination.floorId === floorId && job.goal.kind !== 'retrieve-item' ? [job] : [];
  });
  if (jobs.length > 1) return blocked('conflicting-floor-jobs');
  const job = jobs[0]; if (!job) return null;
  if (job.goal.kind === 'escort') return blocked('escort-objective-dependency');
  return { jobId: job.jobId, identity: job.goal.kind === 'find-pokemon' ? job.goal.target.identity : job.goal.client.identity };
}

/** Off-floor objective states cannot retain a dangling actor reference when
 * the shared kernel deletes old wild/client actors. Completion remains durable.
 * @param {Session} session */
export function leaveJobFloor(session) {
  for (const objective of session.objectives) if (objective.state.kind === 'actor-target') {
    if (objective.state.complete) return blocked('job-completion-state');
    objective.state = { kind: 'pending' };
  }
}

/** Native scans toolbox slots, excluding in-shop and sticky+SET. The browser
 * represents equipped items in separate held containers, so toolbox sticky
 * items remain eligible; held items never count for either item objective.
 * @param {Snapshot} state @param {Job} job @param {import('../../contracts.js').ContainerId} containerId */
export function jobTargetItem(state, job, containerId) {
  if (job.goal.kind !== 'retrieve-item' && job.goal.kind !== 'deliver-item') return null;
  const target = job.goal.itemId;
  return state.containers[containerId]?.itemIds.map(id => state.items[id]).find(item => item?.template.itemId === target && item.shopLotId === null) ?? null;
}

/** Caller has confirmed the adjacent client interaction. Delivery consumes a
 * complete eligible inventory slot before marking native8 objective completion.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts.js').ActorId} actorId */
export function completeJobClient(context, actorId) {
  const state = context.state, session = state.session, actor = session?.actors[actorId];
  if (!session || session.purpose.kind !== 'ordinary' || actor?.binding.kind !== 'job-client' || actor.resources.hp <= 0 || actor.placement.kind !== 'map') return blocked('job-client-unavailable');
  const job = state.progress.jobs[actor.binding.jobId];
  if (!job || job.phase.kind !== 'active' || job.phase.sessionId !== session.sessionId || session.floor.location.kind !== 'exploration' || job.goal.destination.floorId !== session.floor.location.address.floorId) return blocked('job-client-objective');
  const objective = session.objectives[job.phase.objectiveIndex];
  if (!objective || objective.state.kind !== 'actor-target' || objective.state.actorId !== actorId) return blocked('job-client-binding');
  if (job.goal.kind === 'deliver-item') {
    const item = jobTargetItem(state, job, session.inventory), bag = state.containers[session.inventory];
    if (!item || !bag) return blocked('job-delivery-item');
    bag.itemIds.splice(bag.itemIds.indexOf(item.itemInstanceId), 1); delete state.items[item.itemInstanceId];
    context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId });
  } else if (!['rescue', 'find-pokemon'].includes(job.goal.kind)) return blocked('job-client-kind');
  job.phase = { kind: 'objective-complete', sessionId: session.sessionId, completedRevision: state.revision + 1 };
  objective.state = { kind: 'complete', completedRevision: state.revision + 1 };
  actor.placement = { kind: 'off-map', reason: 'rescued' };
  actor.speed.movementPending = false; actor.speed.endEffectsPending = false; actor.speed.deferred = false;
  const slot = session.scheduler.wildSlots.indexOf(actorId); if (slot >= 0) session.scheduler.wildSlots[slot] = null;
  context.emit({ type: 'message', messageId: 'job-objective-complete' });
}

/** Runs after carried item loss/retention. Success promotes native8→9; loss
 * removes completed8 without a receipt, while unfinished taken6 remains.
 * Failed ordinary81 returns never enter the station, including retained finds.
 * The successful find-item candidates are rechecked individually at the station
 * so one returned item cannot satisfy two requests.
 * @param {State} state @param {Session} session @param {boolean} success
 * @returns {import('../../contracts.js').JobId[]} */
export function settleJobObjectives(state, session, success) {
  /** @type {import('../../contracts.js').JobId[]} */ const ready = [];
  for (const id of [...state.progress.acceptedJobIds]) {
    const job = state.progress.jobs[id]; if (!job) return blocked('accepted-job-reference');
    if (job.phase.kind === 'objective-complete' && job.phase.sessionId === session.sessionId) {
      if (success) { job.phase = { kind: 'reward-ready', completedRevision: job.phase.completedRevision }; ready.push(id); }
      else {
        job.phase = { kind: 'failed', reasonId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-completed-job-lost-return'), failedRevision: state.revision + 1 };
        state.progress.acceptedJobIds.splice(state.progress.acceptedJobIds.indexOf(id), 1);
      }
    } else if (job.phase.kind === 'active' && job.phase.sessionId === session.sessionId) {
      job.phase = { kind: 'accepted', acceptedRevision: state.revision + 1 };
      if (success && job.goal.kind === 'retrieve-item' && jobTargetItem(state, job, state.economy.toolbox)) ready.push(id);
    }
  }
  return ready;
}
