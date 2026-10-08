import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { continuingSession } from '../state/continuation.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState|import('../../contracts/campaign.js').CampaignSnapshot} State */

/** Simulation authority, independent of asset readiness or menu presentation.
 * @param {State|null} state */
export function leaderInputReady(state) {
  const s = state?.session, c = s?.scheduler.continuation;
  const leader = s?.actors[s.leaderActorId];
  return !!state && state.mode === 'dungeon' && !state.pendingScene && !state.pendingResult && !state.earlyWork?.clientPrompt && s?.status === 'active' && s.scheduler.kind === 'ready' && c?.terminal === 'none' && c.pass === 'leader' && c.stage === 'decision' && c.beginningRan && c.active?.side === 'team' && c.active.actorId === s.leaderActorId && s.scheduler.teamSlots[c.active.slot] === c.active.actorId && c.action === null && c.activeEffect === null && c.flushing === null && c.special === null && leader?.placement.kind === 'map' && leader.placement.mapId === s.floor.mapId && leader.resources.hp > 0 && leader.conditions.frozen?.statusId !== 'petrified';
}

/** Fresh-floor initialization remains distinct from a saved work checkpoint.
 * Calling advance at an ordinary leader decision must not commit empty turns.
 * @param {State|null} state */
export function automaticTurnReady(state) {
  const s = state?.session, c = s?.scheduler.continuation;
  if (state?.contentRevision === ESCORT_WORK_REVISION && s?.scheduler.kind === 'learning-continuing') return !!s.learningWork && !s.learning && !state.pendingResult && !state.earlyWork?.clientPrompt && s.status === 'active' && (state.mode === 'dungeon' && !state.pendingScene || state.mode === 'scene' && !!state.pendingScene && s.learningWork.origin.kind === 'scene');
  if (!state || !s || state.mode !== 'dungeon' || state.pendingScene || state.pendingResult || state.earlyWork?.clientPrompt || s.status !== 'active') return false;
  if (s.scheduler.kind === 'continuing') return continuingSession(s, state);
  return s.scheduler.kind === 'ready' && s.scheduler.roundNumber === 0 && c?.phase === 0 && c.pass === 'prephase' && c.step === 0 && c.stage === 'select' && c.active === null && c.action === null && c.activeEffect === null && c.terminal === 'none' && c.flushing === null && c.special === null;
}
