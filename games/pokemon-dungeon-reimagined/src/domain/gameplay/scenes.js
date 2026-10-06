import { TEAM, placeAtBase } from '../../../content/authored/team-formation.js';
import { checkName, diagnostics } from '../../../content/state/pokemon-rules.js';
import { OPENING_EXPEDITION as O } from '../../../content/authored/expedition.js';
import { settleExpedition } from './expedition.js';
import { allocate, blocked, clone } from './support.js';

/** @param {import('../turns/types.js').MutationContext} context @param {import('../../../content/authored/opening.js').AuthoredOpening} authored @param {import('../../../content/authored/opening.js').AuthoredScene} script */
export function requestScene(context, authored, script) {
  const state = context.state;
  state.pendingScene = { sceneInstanceId: allocate(state, 'scene-instance'), sceneId: script.id, cursor: 0, entryRevision: state.revision + 1,
    bindings: [ { roleId: authored.heroRoleId, kind: 'pokemon', pokemonId: state.profile.heroId }, { roleId: authored.partnerRoleId, kind: 'pokemon', pokemonId: state.profile.partnerId } ],
    choices: [], awaiting: clone(script.stages?.[0]?.awaiting ?? { kind: 'advance' }), continuation: script.continuation };
  state.mode = 'scene'; context.emit({ type: 'sceneRequested', sceneId: script.id });
}
/** Scene cursor changes and completion receipts remain in the Adventure draft.
 * @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @param {import('./support.js').Catalogs} catalogs
 * @returns {import('../turns/types.js').CommandHandler} */
export function sceneHandler(authored, catalogs) { return {
  plan(state, intent) {
    const scene = state.pendingScene;
    if (state.mode !== 'scene' || !scene || intent.type !== 'ackScene') return { kind: 'rejected', reason: 'unavailable' };
    const script = authored.scenes.find(row => row.id === scene.sceneId);
    if (!script) return { kind: 'content-blocked', requirement: 'scene-script' };
    if (scene.awaiting.kind === 'advance') {
      if (intent.optionId !== null) return { kind: 'rejected', reason: 'unavailable' };
    } else if (scene.awaiting.kind === 'choice' || scene.awaiting.kind === 'name-confirm') {
      if (intent.optionId === null || !scene.awaiting.optionIds.includes(intent.optionId) || !script.stages?.[scene.cursor]?.options.some(option => option.id === intent.optionId)) return { kind: 'rejected', reason: 'unavailable' };
    } else return { kind: 'rejected', reason: 'unavailable' };
    return { kind: 'mutation' };
  },
  apply(context, intent) {
    const state = context.state; const scene = state.pendingScene;
    if (!scene || intent.type !== 'ackScene') return { kind: 'rejected', reason: 'unavailable' };
    const script = authored.scenes.find(row => row.id === scene.sceneId);
    if (!script) return blocked('scene-script');
    const stage = script.stages?.[scene.cursor];
    if (script.stages && !stage) return blocked('scene-stage');
    let next = stage ? stage.next : scene.cursor + 1 < script.lines.length ? scene.cursor + 1 : null;
    if (stage && (scene.awaiting.kind === 'choice' || scene.awaiting.kind === 'name-confirm')) {
      const option = stage.options.find(row => row.id === intent.optionId);
      if (!option) return blocked('scene-option');
      next = option.next;
      if (scene.sceneId === TEAM.offer && option.id === TEAM.accept) scene.choices.push({ choiceId: TEAM.offerChoice, optionId: TEAM.accept });
      if (scene.sceneId === TEAM.naming && scene.awaiting.kind === 'name-confirm') {
        if (option.id === TEAM.edit) {
          const value = scene.awaiting.value; scene.cursor = 0; scene.awaiting = { kind: 'name-input', field: 'team', value };
          return { kind: 'changed', resumeDungeon: false };
        }
        if (option.id !== TEAM.confirm) return blocked('scene-option');
        scene.choices.push({ choiceId: TEAM.nameChoice, optionId: TEAM.confirm });
        state.profile.teamName = scene.awaiting.value;
        state.progress.native.scenarios.MAIN = { chapter: 3, step: 0 };
        if (state.progress.appliedGrants.some(row => row.grantId === TEAM.grant)) return blocked('team-founded-replay');
        state.progress.appliedGrants.push({ grantId: TEAM.grant, revision: state.revision + 1, day: state.town.day });
        state.progress.storyNodeId = TEAM.foundedStory;
      }
    }
    if (next !== null) {
      scene.cursor = next;
      scene.awaiting = clone(script.stages?.[next]?.awaiting ?? { kind: 'advance' });
    }
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
        beginFormation(context, authored); return { kind: 'changed', resumeDungeon: false };
      }
      if (scene.sceneId === TEAM.offer || scene.sceneId === TEAM.naming) {
        const nextId = scene.sceneId === TEAM.offer ? TEAM.naming : TEAM.celebration;
        const nextScript = authored.scenes.find(row => row.id === nextId); if (!nextScript) return blocked('team-scene');
        requestScene(context, authored, nextScript); return { kind: 'changed', resumeDungeon: false };
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

/** Atomic destination used by final reunion and the bounded old-save adapter.
 * It never grants rewards or records a reunion on behalf of the caller.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../../content/authored/opening.js').AuthoredOpening} authored */
export function beginFormation(context, authored) {
  const script = authored.scenes.find(row => row.id === TEAM.offer);
  if (!script) return blocked('team-offer-script');
  placeAtBase(context.state); context.state.progress.storyNodeId = TEAM.story;
  requestScene(context, authored, script);
}
/** @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @returns {import('../turns/types.js').CommandHandler} */
export function nameHandler(authored) { return {
  plan(state, intent) {
    const scene = state.pendingScene;
    if (intent.type !== 'submitSceneName' || typeof intent.name !== 'string' || state.mode !== 'scene' || scene?.sceneId !== TEAM.naming || scene.cursor !== 0 || scene.awaiting.kind !== 'name-input' || scene.awaiting.field !== 'team') return { kind: 'rejected', reason: 'unavailable' };
    const report = diagnostics(); checkName(intent.name, 'Pokémon', report, '/name'); const result = report.result();
    if (!result.ok) return result.kind === 'invalid' ? { kind: 'rejected', reason: 'invalid-command' } : { kind: 'content-blocked', requirement: 'name-native-glyph-crosswalk' };
    return { kind: 'mutation' };
  },
  apply(context, intent) {
    const scene = context.state.pendingScene;
    if (intent.type !== 'submitSceneName' || !scene) return { kind: 'rejected', reason: 'unavailable' };
    const next = authored.scenes.find(row => row.id === TEAM.naming)?.stages?.[1]?.awaiting;
    if (next?.kind !== 'name-confirm') return blocked('team-name-confirm-stage');
    scene.cursor = 1; scene.awaiting = { ...clone(next), value: intent.name };
    return { kind: 'changed', resumeDungeon: false };
  },
}; }
/** Read-only authored prompt. Unknown stage has no presentation fallback.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state
 * @param {import('../../../content/authored/opening.js').AuthoredOpening} authored */
export function scenePrompt(state, authored) {
  const scene = state.pendingScene; if (!scene) return null;
  const script = authored.scenes.find(row => row.id === scene.sceneId); const text = script?.lines[scene.cursor];
  if (!script || text === undefined || script.stages && !script.stages[scene.cursor]) return null;
  return { text: scene.sceneId === TEAM.celebration && scene.cursor === 0 ? `Team ${state.profile.teamName}! ${text}` : text,
    awaiting: scene.awaiting, options: script.stages?.[scene.cursor]?.options ?? [] };
}
