import { createOpeningContent } from '../../../content/authored/opening.js';
import { createCampaignContent } from '../../../content/state/campaign.js';
import { freezeData } from '../state/validate.js';
import { createCommandHandlers } from './commands.js';
import { createTurnHooks } from './hooks.js';
import { visibility, presentation, actorsView } from './projection.js';
import { sceneText, scenePrompt } from './scenes.js';
import { admission } from './expedition.js';
import { supportedMove } from './combat.js';

/** Compose actual canonical content, commands and fifteen turn hooks. The caller
 * retains catalog lifetime and creates Adventure; no secondary state store exists.
 * @param {import('./support.js').Catalogs} catalogs
 * @param {{tutorialSaved?:(snapshot:import('../../contracts/campaign.js').CampaignSnapshot)=>boolean}} [options] */
export function createGameplay(catalogs, options = {}) {
  const authored = freezeData(createOpeningContent());
  const content = createCampaignContent(catalogs, authored);
  return Object.freeze({ content, authored,
    handlers: createCommandHandlers(catalogs, authored, options.tutorialSaved ?? (() => false)), turns: createTurnHooks(catalogs, authored),
    getScenePrompt: (/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ snapshot) => scenePrompt(snapshot, authored),
    getSceneText: (/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ snapshot) => sceneText(snapshot, authored),
    getDungeonChoices: (/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ snapshot) => Object.freeze([{ dungeonId: 'tiny-woods', name: 'Tiny Woods', requirement: admission(catalogs, snapshot) }]),
    getMoveChoices: (/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ snapshot) => {
      const actor = snapshot.session?.actors[snapshot.session.leaderActorId];
      return freezeData(actor?.moves.slots.flatMap(slot => {
        if (!slot) return [];
        const pp = actor.battleMoves.slots.find(pp => pp.moveSlotId === slot.moveSlotId);
        return [{ actorId: actor.actorId, moveSlotId: slot.moveSlotId, moveId: slot.moveId, name: catalogs.effects.getMove(slot.moveId).name, currentPp: pp?.currentPp ?? 0,
          requirement: !supportedMove(catalogs, slot.moveId) || actor.moves.links.some(link => link.includes(slot.moveSlotId)) ? 'move-effect-not-supported' : !pp || pp.sealed || pp.currentPp === 0 ? 'move-pp-unavailable' : null }];
      }) ?? []);
    },
    getVisibility: (/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ snapshot) => visibility(snapshot, catalogs),
    getActors: (/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ snapshot) => actorsView(snapshot, catalogs),
    getPresentation: (/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ snapshot, /** @type {string} */ epoch) => presentation(snapshot, catalogs, epoch),
  });
}
