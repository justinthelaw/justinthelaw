import { sceneHandler } from './escort-scenes.js';
import { settleExpedition } from './escort-expedition.js';
import { createEscortTurnAdvance } from '../turns/escort-advance.js';
/** Return only to the actual saved native parent. The same scene owner handles
 * user acknowledgment and source EXP return; real return work remains until its
 * parent consumes it, so neither the scene nor settlement can restart growth.
 * @param {import('./support.js').Catalogs} catalogs
 * @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @param {(snapshot:import('../../contracts/campaign.js').CampaignSnapshot)=>boolean} tutorialSaved */
export function createEscortAdvance(catalogs,authored,tutorialSaved) {
  const scene = sceneHandler(authored,catalogs,tutorialSaved);
  return createEscortTurnAdvance(catalogs,(context,origin) => {
    if (origin.kind === 'scene') return scene.apply?.(context,{ type: 'ackScene',sceneId: origin.sceneId,sceneInstanceId: origin.sceneInstanceId,cursor: origin.cursor,revision: context.state.revision,optionId: null }) ?? { kind: 'rejected',reason: 'unavailable' };
    if (origin.kind === 'settlement') { settleExpedition(context,origin.outcome,catalogs,authored); return { kind: 'changed',resumeDungeon: false }; }
    return { kind: 'changed',resumeDungeon: true };
  });
}
