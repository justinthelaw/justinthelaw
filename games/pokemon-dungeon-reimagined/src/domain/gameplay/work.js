import { CHAPTER_WORK_REVISION } from '../state/chapter-work-revision.js';
import { FRIENDS, placeFriendsGround } from '../../../content/authored/friends.js';
import { requestFriendsScene } from './friends.js';
import { deliverChapterMailbox, changeChapterJobSelection } from './chapter-job-records.js';
import { TOWN, placeInTown } from '../../../content/authored/town.js';
import { WORK } from '../../../content/authored/early-work.js';
import { TEAM } from '../../../content/authored/team-formation.js';
import { changeJobSelection, deliverEarlyMailbox, earlyJob, prepareJobReward } from './job-records.js';
import { completeJobClient, jobTargetItem } from './job-objectives.js';
import { receiveRewardItem, rewardItemChoiceProblem } from './reward-items.js';
import { requestScene } from './scenes.js';
import { settleExpedition } from './expedition.js';
import { interactableJobClient } from './job-interaction.js';
import { allocate, blocked, clone } from './support.js';

/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {{kind:'job',jobId:import('../../contracts.js').JobId,operation:'accept'|'take'|'suspend'|'delete'}|{kind:'read-news',newsId:number}|{kind:'discard-mail',jobId:import('../../contracts.js').JobId}|{kind:'station-next'}|{kind:'reward-choice',choice:import('./reward-items.js').RewardItemChoice}|{kind:'client-talk'}|{kind:'client-answer',yes:boolean}} WorkOrder
 */

/** Shared UI/command access, with mandatory return/dialogue ownership.
 * @param {Snapshot} state */
export function workReady(state) {
  return !!state.earlyWork && (state.progress.storyNodeId === TOWN.story && state.progress.seenScenes[TOWN.scenes[3] ?? '']?.count === 1 || chapterWorkReady(state)) && state.mode === 'town' && !state.session && !state.pendingScene && !state.pendingResult && !state.earlyWork.returned && !state.earlyWork.reward && !state.earlyWork.clientPrompt;
}
/** The new interval adds no bypass for a canonical input owner.
 * @param {Snapshot} state */
export function chapterWorkReady(state) { return state.contentRevision === CHAPTER_WORK_REVISION && state.friends?.phase === 'work-three' && state.progress.storyNodeId === FRIENDS.story && state.progress.native.scenarios.MAIN.chapter === 5 && state.progress.native.scenarios.MAIN.step === 5 && state.progress.native.clearCount < 3; }
/** Opening a new prompt also requires that no other client prompt owns input.
 * @param {Snapshot} state @param {import('./support.js').Catalogs} catalogs */
export function facingJobClient(state, catalogs) {
  return state.earlyWork?.clientPrompt ? null : interactableJobClient(state, catalogs);
}

/** @param {Context} context @param {import('../../../content/authored/opening.js').AuthoredOpening} authored */
function nextMorning(context, authored) {
  const state = context.state, work = state.earlyWork; if (!work?.returned || work.returned.cursor < work.returned.jobIds.length || work.reward || state.pendingResult) return blocked('work-return-unfinished');
  work.returned = null; state.town.day++;
  if (state.friends?.phase === 'work-three') {
    if (state.progress.native.clearCount >= 3) { state.friends.phase = 'meanies-morning'; requestFriendsScene(context,authored,5); }
    else {
      placeFriendsGround(state,TEAM.map);
      const delivered = deliverChapterMailbox(state,work);
      context.emit({ type: 'message',messageId: delivered ? 'work-new-mail' : 'work-next-morning' });
    }
    return;
  }
  placeInTown(state, TEAM.map);
  if (state.progress.native.clearCount >= 2) {
    state.progress.storyNodeId = WORK.story;
    const scene = authored.scenes.find(row => row.id === WORK.scenes[0]); if (!scene) return blocked('diglett-request-script');
    requestScene(context, authored, scene);
  } else {
    const delivered = deliverEarlyMailbox(state, work);
    context.emit({ type: 'message', messageId: delivered ? 'work-new-mail' : 'work-next-morning' });
  }
}

/** Receipt is last: inventory cursor, money, points, count, accepted removal and
 * display commit in one draft. Loading an overflow choice never rerolls extras.
 * @param {Context} context @param {import('./reward-items.js').RewardItemChoice} [choice] */
function deliverPreparedReward(context, choice) {
  const state = context.state, work = state.earlyWork, prepared = work?.reward, returned = work?.returned;
  if (!work || !prepared || !returned) return blocked('work-reward-owner');
  const job = state.progress.jobs[prepared.jobId]; if (!job || job.phase.kind !== 'reward-ready') return blocked('work-reward-job');
  while (prepared.nextItem < job.reward.items.length) {
    const item = job.reward.items[prepared.nextItem]; if (!item) return blocked('work-reward-item');
    const result = receiveRewardItem(context, item, choice); choice = undefined;
    if (result === 'choice') return;
    prepared.nextItem++;
  }
  state.economy.carriedMoney = Math.min(99999, state.economy.carriedMoney + job.reward.money);
  state.progress.rankPoints = Math.min(99999999, state.progress.rankPoints + job.reward.rankPoints);
  state.progress.statistics.jobsCompleted++;
  state.progress.native.clearCount = Math.min(100, state.progress.native.clearCount + 1);
  job.phase = { kind: 'claimed', claimedRevision: state.revision + 1 };
  state.progress.acceptedJobIds.splice(state.progress.acceptedJobIds.indexOf(job.jobId), 1);
  returned.cursor++; work.reward = null;
  state.pendingResult = { resultId: allocate(state, 'result'), createdRevision: state.revision + 1, cursor: 0, kind: 'job-reward', jobId: job.jobId, reward: clone(job.reward), grantedRevision: state.revision + 1,
    continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: TOWN.post, entryId: 'ordinary-reward' } } };
}

/** @param {Context} context @param {import('../../../content/authored/opening.js').AuthoredOpening} authored */
function nextReward(context, authored) {
  const state = context.state, work = state.earlyWork, returned = work?.returned; if (!work || !returned || work.reward || state.pendingResult) return blocked('work-station-owner');
  while (returned.cursor < returned.jobIds.length) {
    const job = state.progress.jobs[returned.jobIds[returned.cursor] ?? '']; if (!job) return blocked('work-station-job');
    if (job.goal.kind === 'retrieve-item') {
      const item = jobTargetItem(state, job, state.economy.toolbox), bag = state.containers[state.economy.toolbox];
      if (!item || !bag) { returned.cursor++; continue; }
      bag.itemIds.splice(bag.itemIds.indexOf(item.itemInstanceId), 1); delete state.items[item.itemInstanceId];
      context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId });
      job.phase = { kind: 'reward-ready', completedRevision: state.revision + 1 };
    }
    if (job.phase.kind !== 'reward-ready') return blocked('work-station-phase');
    job.reward = prepareJobReward(state, earlyJob(job).source);
    work.reward = { jobId: job.jobId, preparedRevision: state.revision + 1, nextItem: 0 };
    deliverPreparedReward(context); return;
  }
  nextMorning(context, authored);
}

/** @param {import('./support.js').Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @returns {import('../turns/types.js').CommandHandlers} */
export function workHandlers(catalogs, authored) { return {
  workAction: {
    plan(state, intent) {
      if (intent.type !== 'workAction' || !state.earlyWork || !intent.order) return { kind: 'rejected', reason: 'unavailable' };
      const order = intent.order, work = state.earlyWork;
      if (order.kind === 'client-talk') return facingJobClient(state, catalogs) ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
      if (order.kind === 'client-answer') {
        const prompt = work.clientPrompt;
        return prompt && typeof order.yes === 'boolean' && (prompt.stage !== 'rescue' || interactableJobClient(state, catalogs)?.actorId === prompt.actorId) ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
      }
      if (order.kind === 'station-next') return state.mode === 'town' && work.returned && !work.reward && !state.pendingResult ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
      if (order.kind === 'reward-choice') {
        const item = work.reward ? state.progress.jobs[work.reward.jobId]?.reward.items[work.reward.nextItem] : null;
        return item && order.choice && !rewardItemChoiceProblem(state, item, order.choice) ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
      }
      if (!workReady(state)) return { kind: 'rejected', reason: 'unavailable' };
      if (order.kind === 'read-news' || order.kind === 'discard-mail') return state.town.mapDefinitionId === TEAM.map ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
      if (order.kind !== 'job') return { kind: 'rejected', reason: 'unavailable' };
      const posting = state.progress.jobs[order.jobId]?.source;
      const atPosting = posting?.kind === 'generated' && 'posting' in posting && state.town.mapDefinitionId === (posting.posting === 'board' ? TOWN.post : TEAM.map);
      return order.operation !== 'accept' || atPosting ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
    },
    apply(context, intent) {
      if (intent.type !== 'workAction') return { kind: 'rejected', reason: 'invalid-command' };
      const state = context.state, work = state.earlyWork, order = intent.order; if (!work) return blocked('work-owner');
      if (order.kind === 'station-next') nextReward(context, authored);
      else if (order.kind === 'reward-choice') deliverPreparedReward(context, order.choice);
      else if (order.kind === 'client-talk') {
        const client = facingJobClient(state, catalogs); if (!client) return { kind: 'rejected', reason: 'unavailable' };
        work.clientPrompt = { actorId: client.actorId, stage: 'rescue' };
      } else if (order.kind === 'client-answer') {
        const prompt = work.clientPrompt; if (!prompt) return { kind: 'rejected', reason: 'unavailable' };
        if (prompt.stage === 'rescue') {
          if (interactableJobClient(state, catalogs)?.actorId !== prompt.actorId) return { kind: 'rejected', reason: 'unavailable' };
          if (!order.yes) work.clientPrompt = null;
          else { completeJobClient(context, prompt.actorId); prompt.stage = 'leave'; }
        } else if (prompt.stage === 'leave') prompt.stage = order.yes ? 'confirm-leave' : 'confirm-stay';
        else if (prompt.stage === 'confirm-stay') { if (order.yes) work.clientPrompt = null; else prompt.stage = 'leave'; }
        else if (order.yes) { work.clientPrompt = null; settleExpedition(context, 'success', catalogs); }
        else prompt.stage = 'leave';
      } else if (order.kind === 'job') {
        if (!(state.friends ? changeChapterJobSelection : changeJobSelection)(state, work, order.jobId, order.operation)) return { kind: 'rejected', reason: 'unavailable' };
      } else if (order.kind === 'read-news') {
        const index = work.mailbox.findIndex(row => row.kind === 'news' && row.newsId === order.newsId);
        if (index < 0) return { kind: 'rejected', reason: 'unavailable' };
        work.newsRead.push(order.newsId); work.mailbox.splice(index,1);
      } else if (order.kind === 'discard-mail') {
        const index = work.mailbox.findIndex(row => row.kind === 'job' && row.jobId === order.jobId);
        if (index < 0 || state.progress.jobs[order.jobId]?.phase.kind !== 'offered') return { kind: 'rejected', reason: 'unavailable' };
        work.mailbox.splice(index,1); delete state.progress.jobs[order.jobId];
      } else return { kind: 'rejected', reason: 'invalid-command' };
      return { kind: 'changed', resumeDungeon: false };
    },
  },
  ackResult: {
    plan: (state, intent) => intent.type === 'ackResult' && intent.choice.kind === 'ack' && state.pendingResult?.kind === 'job-reward' && state.earlyWork?.returned ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' },
    apply(context) { context.state.pendingResult = null; return { kind: 'changed', resumeDungeon: false }; },
  },
}; }
