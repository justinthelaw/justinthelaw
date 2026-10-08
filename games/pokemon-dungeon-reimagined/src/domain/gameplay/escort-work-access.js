import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { FRIENDS } from '../../../content/authored/friends.js';
/** Actual inherited first interval or actual new MAIN5,7 second interval, under
 * the same mandatory return/reward/scene/result/client owners. No pair is force
 * selected and neither claims nor day/history are inferred here.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function escortWorkReady(state) {
  const main = state.progress.native.scenarios.MAIN;
  const interval = state.friends?.phase === 'work-three' && main.chapter === 5 && main.step === 5 && state.progress.native.clearCount < 3 || state.friends?.phase === 'work-two' && main.chapter === 5 && main.step === 7 && state.progress.native.clearCount < 2;
  return state.contentRevision === ESCORT_WORK_REVISION && interval && state.progress.storyNodeId === FRIENDS.story && !!state.earlyWork && state.mode === 'town' && !state.session && !state.pendingScene && !state.pendingResult && !state.earlyWork.returned && !state.earlyWork.reward && !state.earlyWork.clientPrompt;
}
