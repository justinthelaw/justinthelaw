import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { FRIENDS, placeFriendsGround } from '../../../content/authored/friends.js';
import { placeCaterpieGround, SINISTER_UNLOCK } from '../../../content/authored/escort-work.js';
import { TEAM } from '../../../content/authored/team-formation.js';
import { MORNING } from '../../../content/authored/first-morning.js';
import { requestScene } from './scenes.js';
import { setFriendsStep } from './friends.js';
import { blocked } from './support.js';
/** @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('../../../content/authored/opening.js').AuthoredOpening} Authored */
/** Inside24 has completed and assigned5,8. Only actual outside ENTER_CONTROL
 * begins31; no mailbox/ground refresh occurs during either scene.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function caterpieExitReady(state) {
  return state.contentRevision === ESCORT_WORK_REVISION && state.friends?.phase === 'caterpie-ready' && state.mode === 'town' && state.town.mapDefinitionId === MORNING.interior && state.progress.native.scenarios.MAIN.chapter === 5 && state.progress.native.scenarios.MAIN.step === 8 && !state.session && !state.pendingScene && !state.pendingResult && !state.earlyWork?.returned && !state.earlyWork?.reward && !state.earlyWork?.clientPrompt;
}
/** @param {Context} context @param {Authored} authored */
export function beginCaterpieScene(context,authored) {
  const state = context.state;
  if (!caterpieExitReady(state) || !state.friends) return blocked('caterpie-base-exit');
  const script = authored.scenes.find(row => row.id === FRIENDS.scenes[8]); if (!script) return blocked('caterpie-request-script');
  state.friends.phase = 'caterpie'; placeCaterpieGround(state,0); requestScene(context,authored,script);
}
/** @param {Context} context @param {Authored} authored
 * @returns {import('../turns/types.js').MutationResult} */
export function advanceEscortWorkScene(context,authored) {
  const state = context.state,scene = state.pendingScene,friends = state.friends;
  if (state.contentRevision !== ESCORT_WORK_REVISION || !scene || !friends || ![FRIENDS.scenes[7],FRIENDS.scenes[8]].includes(scene.sceneId)) return { kind: 'rejected',reason: 'unavailable' };
  const morning = scene.sceneId === FRIENDS.scenes[7],script = authored.scenes.find(row => row.id === scene.sceneId);
  if (!script || friends.phase !== (morning ? 'caterpie-morning' : 'caterpie') || state.progress.seenScenes[scene.sceneId]) return blocked('caterpie-scene-owner');
  if (scene.cursor+1 < script.lines.length) { scene.cursor++; if (!morning) placeCaterpieGround(state,scene.cursor); return { kind: 'changed',resumeDungeon: false }; }
  const revision = state.revision+1,day = state.town.day;
  state.progress.seenScenes[scene.sceneId] = { sceneId: scene.sceneId,count: 1,firstRevision: revision,lastRevision: revision,firstDay: day,lastDay: day };
  state.pendingScene = null; state.mode = 'town';
  if (morning) { setFriendsStep(state,8); friends.phase = 'caterpie-ready'; }
  else {
    if (state.progress.milestones[SINISTER_UNLOCK]) return blocked('sinister-unlock-replay');
    state.progress.milestones[SINISTER_UNLOCK] = { milestoneId: SINISTER_UNLOCK,acquiredRevision: revision,acquiredDay: day };
    setFriendsStep(state,9); friends.phase = 'sinister-ready'; placeFriendsGround(state,TEAM.map); }
  return { kind: 'changed',resumeDungeon: false };
}
