import { OPENING_EXPEDITION as O } from '../../../content/authored/expedition.js';
import { settleExpedition } from './expedition.js';
import { allocate, blocked } from './support.js';

/** @param {import('../turns/types.js').MutationContext} context @param {import('../../../content/authored/opening.js').AuthoredOpening} authored @param {import('../../../content/authored/opening.js').AuthoredScene} script */
export function requestScene(context, authored, script) {
  const state = context.state;
  state.pendingScene = { sceneInstanceId: allocate(state, 'scene-instance'), sceneId: script.id, cursor: 0, entryRevision: state.revision + 1,
    bindings: [ { roleId: authored.heroRoleId, kind: 'pokemon', pokemonId: state.profile.heroId }, { roleId: authored.partnerRoleId, kind: 'pokemon', pokemonId: state.profile.partnerId } ],
    choices: [], awaiting: { kind: 'advance' }, continuation: script.continuation };
  state.mode = 'scene'; context.emit({ type: 'sceneRequested', sceneId: script.id });
}
/** Scene cursor changes and completion receipts remain in the Adventure draft.
 * @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @param {import('./support.js').Catalogs} catalogs
 * @returns {import('../turns/types.js').CommandHandler} */
export function sceneHandler(authored, catalogs) { return {
  plan(state, intent) {
    if (intent.type !== 'ackScene' || intent.optionId !== null || state.mode !== 'scene' || !state.pendingScene || state.pendingScene.awaiting.kind !== 'advance') return { kind: 'rejected', reason: 'unavailable' };
    return { kind: 'mutation' };
  },
  apply(context) {
    const state = context.state; const scene = state.pendingScene;
    if (!scene) return { kind: 'rejected', reason: 'unavailable' };
    const script = authored.scenes.find(row => row.id === scene.sceneId);
    if (!script) return blocked('scene-script');
    if (scene.cursor + 1 < script.lines.length) scene.cursor++;
    else {
      const revision = state.revision + 1; const day = state.town.day;
      state.progress.seenScenes[scene.sceneId] = { sceneId: scene.sceneId, count: 1, firstRevision: revision, lastRevision: revision, firstDay: day, lastDay: day };
      if (scene.sceneId === O.rescueScene) {
        settleExpedition(context, 'success', catalogs);
        const next = authored.scenes.find(row => row.id === O.returnScene); if (!next) return blocked('reunion-scene');
        requestScene(context, authored, next); return { kind: 'changed', resumeDungeon: false };
      }
      if (scene.sceneId === O.returnScene) {
        const grantId = /** @type {import('../../contracts/campaign.js').GrantId} */ ('browser-reunion-reward');
        if (state.progress.appliedGrants.some(row => row.grantId === grantId)) return blocked('reunion-reward-replay');
        const bag = state.containers[state.economy.toolbox]; if (!bag) return blocked('reunion-toolbox');
        for (const id of ['item-oran-berry', 'item-pecha-berry', 'item-rawst-berry']) {
          const template = { itemId: /** @type {import('../../contracts.js').ItemId} */ (id), sticky: false, payload: /** @type {const} */ ({ kind: 'none' }) };
          if (bag.itemIds.length >= 20) {
            // R code_801B60C.c:180–198 automatically sends full-bag berry
            // rewards to per-item storage. Opening storage starts empty.
            const stored = state.economy.storedItems.find(row => row.template.itemId === id);
            if (stored && stored.count >= 999) return blocked('reward-storage-choice');
            if (stored) stored.count++; else state.economy.storedItems.push({ template, count: 1 });
            context.emit({ type: 'message', messageId: 'reward-sent-to-storage' }); continue;
          }
          const itemInstanceId = allocate(state, 'item-instance');
          state.items[itemInstanceId] = { itemInstanceId, template, quantity: 1, shopLotId: null }; bag.itemIds.push(itemInstanceId);
        }
        state.progress.appliedGrants.push({ grantId, revision, day });
      }
      if (scene.continuation.kind !== 'town' || scene.continuation.destination.kind !== 'town') return blocked('scene-continuation');
      state.town.mapDefinitionId = scene.continuation.destination.mapDefinitionId;
      state.pendingScene = null; state.mode = 'town';
    }
    return { kind: 'changed', resumeDungeon: false };
  },
}; }
/** @param {import('../../contracts/campaign.js').CampaignSnapshot} state @param {import('../../../content/authored/opening.js').AuthoredOpening} authored */
export function sceneText(state, authored) { return state.pendingScene ? authored.scenes.find(row => row.id === state.pendingScene?.sceneId)?.lines[state.pendingScene.cursor] ?? null : null; }
