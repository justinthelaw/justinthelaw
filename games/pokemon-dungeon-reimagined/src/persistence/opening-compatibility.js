import { createCampaignContent as createPartyCampaignContent } from '../../content/state/party-status-campaign.js';
import { createCampaignContent as createWildCampaignContent } from '../../content/state/wild-ai-campaign.js';
import { createCampaignContent as createFriendsCampaignContent } from '../../content/state/friends-campaign.js';
import { initializeEarlierWildAi } from '../domain/gameplay/actors.js';
import { createCampaignContent as createMovesCampaignContent } from '../../content/state/moves-campaign.js';
import { refreshFieldAbilities } from '../domain/gameplay/field-abilities.js';
import { createCampaignContent as createSteelCampaignContent } from '../../content/state/steel-campaign.js';
import { createCampaignContent as createBattleCampaignContent } from '../../content/state/battle-campaign.js';
import { createCampaignContent as createWorkCampaignContent } from '../../content/state/work-campaign.js';
import { createCampaignContent as createSeenCampaignContent } from '../../content/state/seen-campaign.js';
import { initializeEarlyWork } from '../domain/gameplay/job-records.js';
import { createCampaignContent as createTownCampaignContent } from '../../content/state/town-campaign.js';
import { initializeSpeciesSeen } from '../domain/state/species-seen.js';
import { createCampaignContent } from '../../content/state/opening-campaign.js';
import { createTeamOpeningContent, createMorningOpeningContent, createThunderwaveOpeningContent, createTownOpeningContent, createSeenOpeningContent } from '../../content/authored/opening.js';
import { createCampaignContent as createHeldV2Content, HELD_V2_REVISION } from '../../content/state/held-v2-campaign.js';
import { OPENING_EXPEDITION as O } from '../../content/authored/expedition.js';
import { commandContext, prepareTransaction } from '../domain/state/transaction.js';
import { validateCampaign } from '../domain/state/validate.js';
import { beginFormation } from '../domain/gameplay/scenes.js';
import { fail, succeed } from './results.js';

/** Exactly the navigation-backed held-v2, v3-team, v4-morning, v5-Thunderwave v6-town and v7-seen predecessors. held-v1, partial catalog variants
 * and unknown revisions are not repair candidates. The four frozen held-v2 authoring/
 * policy modules preserve held-v2 scene, item and session admission; shared
 * factual catalog/held ownership policies have not changed in this slice. V3
 * uses its exact six-scene body/shared policy pins; v4 retains its exact thirteen-scene body and morning wrappers. V5 retains its
 * sixteen-scene body, factory and expedition wrappers. V6 retains its twenty-scene
 * body, factory and town/stock policies. V7 retains its exact seen root, factory,
 * authored body and seen-history policy. */

/** Conversion runs only after codec checks original envelope agreement, time,
 * SHA-256 and exact selected predecessor policy admission. It neither dispatches turns nor
 * reads/writes storage. Current encoding and repository confirmation stay outside.
 * @param {import('../../content/state/campaign.js').CampaignCatalogs} catalogs
 * @param {import('./contracts.js').CampaignContent} content
 * @param {import('../../content/authored/opening.js').AuthoredOpening} authored
 * @returns {import('./codec.js').SaveCompatibility} */
export function createOpeningCompatibility(catalogs, content, authored) {
  const legacy = createHeldV2Content(catalogs);
  if (legacy.contentRevision !== HELD_V2_REVISION) throw new TypeError('Held-v2 factual catalog boundary differs.');
  const team = createCampaignContent(catalogs, createTeamOpeningContent(), 'team');
  const teamRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v3-team-opening:browser-opening-v3-team:');
  if (team.contentRevision !== teamRevision) throw new TypeError('Team-v3 factual catalog boundary differs.');
  const morning = createCampaignContent(catalogs, createMorningOpeningContent(), 'morning');
  const morningRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v4-morning-opening:browser-opening-v4-morning:');
  if (morning.contentRevision !== morningRevision) throw new TypeError('Morning-v4 factual catalog boundary differs.');
  const thunderwave = createCampaignContent(catalogs, createThunderwaveOpeningContent(), 'thunderwave');
  const thunderwaveRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v5-thunderwave-opening:browser-opening-v5-thunderwave:');
  if (thunderwave.contentRevision !== thunderwaveRevision) throw new TypeError('Thunderwave-v5 factual catalog boundary differs.');
  const town = createTownCampaignContent(catalogs, createTownOpeningContent());
  const townRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v6-town-opening:browser-opening-v6-town:');
  if (town.contentRevision !== townRevision) throw new TypeError('Town-v6 factual catalog boundary differs.');
  const seen = createSeenCampaignContent(catalogs, createSeenOpeningContent());
  const seenRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v7-seen-opening:browser-opening-v7-seen:');
  if (seen.contentRevision !== seenRevision) throw new TypeError('Seen-v7 factual catalog boundary differs.');
  const work = createWorkCampaignContent(catalogs);
  const workRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v8-work-opening:browser-opening-v8-work:');
  if (work.contentRevision !== workRevision) throw new TypeError('Work-v8 factual catalog boundary differs.');
  const battle = createBattleCampaignContent(catalogs);
  const battleRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v9-battle-opening:browser-opening-v9-battle:');
  if (battle.contentRevision !== battleRevision) throw new TypeError('Battle-v9 factual catalog boundary differs.');
  const steel = createSteelCampaignContent(catalogs);
  const steelRevision = HELD_V2_REVISION.replace('blue-campaign-state-v2-held-opening:browser-opening-v2:', 'blue-campaign-state-v10-steel-opening:browser-opening-v10-steel:');
  if (steel.contentRevision !== steelRevision) throw new TypeError('Steel-v10 factual catalog boundary differs.');
  const moves = createMovesCampaignContent(catalogs);
  const movesRevision = steelRevision.replace('v10-steel-opening:browser-opening-v10-steel:', 'v11-moves-opening:browser-opening-v11-moves:');
  if (moves.contentRevision !== movesRevision) throw new TypeError('Moves-v11 factual catalog boundary differs.');
  const friends = createFriendsCampaignContent(catalogs);
  const friendsRevision = movesRevision.replace('v11-moves-opening:browser-opening-v11-moves:', 'v12-friends-opening:browser-opening-v12-friends:');
  if (friends.contentRevision !== friendsRevision) throw new TypeError('Friends-v12 factual catalog boundary differs.');
  const wild = createWildCampaignContent(catalogs);
  const wildRevision = friendsRevision.replace('v12-friends-opening:', 'v13-wild-ai-opening:');
  if (wild.contentRevision !== wildRevision) throw new TypeError('Wild-v13 factual catalog boundary differs.');
  const party = createPartyCampaignContent(catalogs);
  if (party.contentRevision !== wildRevision.replace('v13-wild-ai-opening:', 'v14-party-moves-opening:')) throw new TypeError('Party-v14 factual catalog boundary differs.');
  return Object.freeze([...([party, wild, friends, moves, steel, battle, work, seen, town, thunderwave, morning, team].map(predecessor => ({ content: predecessor,
    /** @param {import('../contracts/campaign.js').CampaignSnapshot} snapshot */
    convert(snapshot) {
      const admitted = validateCampaign(snapshot, predecessor);
      if (!admitted.ok || snapshot.contentRevision !== predecessor.contentRevision) return fail('invalid');
      try {
        const { draft, commitRevision } = prepareTransaction(admitted.snapshot, commandContext(admitted.snapshot));
        draft.contentRevision = content.contentRevision; draft.revision = commitRevision;
        if (!Object.hasOwn(draft, 'friends')) draft.friends = null;
        if (!Object.hasOwn(draft, 'steel')) draft.steel = null;
        if (!draft.speciesSeen) initializeSpeciesSeen(draft, true);
        if (!Object.hasOwn(draft, 'earlyWork')) initializeEarlyWork(draft, commitRevision, true);
        if (!Object.hasOwn(draft, 'moveState')) refreshFieldAbilities(draft, /** @type {import('../domain/gameplay/support.js').Catalogs} */ (catalogs));
        initializeEarlierWildAi(draft);
        const checked = validateCampaign(draft, content);
        return checked.ok ? succeed(checked.snapshot) : fail(checked.kind === 'blocked' ? 'content-blocked' : 'invalid');
      } catch { return fail('invalid'); }
    },
  }))), { content: legacy,
    /** @param {import('../contracts/campaign.js').CampaignSnapshot} snapshot */
    convert(snapshot) {
      if (snapshot.contentRevision !== HELD_V2_REVISION) return fail('content-mismatch');
      // Defense in depth for direct callers; this cannot repair a malformed old
      // shape or admit a new await variant through the additive schema union.
      const admitted = validateCampaign(snapshot, legacy);
      if (!admitted.ok) return fail('invalid');
      try {
        const { draft, commitRevision } = prepareTransaction(admitted.snapshot, commandContext(admitted.snapshot));
        draft.contentRevision = content.contentRevision; draft.friends = null; draft.steel = null;
        if (draft.pendingScene?.sceneId === O.returnScene) {
          const script = authored.scenes.find(row => row.id === O.returnScene);
          if (!script) return fail('content-blocked');
          draft.pendingScene.continuation = script.continuation;
        } else if (draft.progress.seenScenes[O.returnScene]) {
          const visit = draft.progress.seenScenes[O.returnScene], grant = draft.progress.appliedGrants[0];
          if (draft.pendingScene || draft.session || draft.pendingResult || draft.mode !== 'town' || draft.progress.storyNodeId !== O.returnNode || !visit || visit.count !== 1 || draft.progress.appliedGrants.length !== 1 || grant?.grantId !== 'browser-reunion-reward' || grant.revision !== visit.lastRevision || grant.day !== 0 || !draft.progress.clears['tiny-woods']) return fail('invalid');
          beginFormation({ state: draft, emit() {} }, authored);
        }
        draft.revision = commitRevision; initializeSpeciesSeen(draft, true); initializeEarlyWork(draft, commitRevision, true);
        if (!Object.hasOwn(draft, 'moveState')) refreshFieldAbilities(draft, /** @type {import('../domain/gameplay/support.js').Catalogs} */ (catalogs));
        initializeEarlierWildAi(draft);
        const checked = validateCampaign(draft, content);
        return checked.ok ? succeed(checked.snapshot) : fail(checked.kind === 'blocked' ? 'content-blocked' : 'invalid');
      } catch { return fail('invalid'); }
    },
  }]);
}
