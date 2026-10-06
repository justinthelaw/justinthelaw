import { createCampaignContent as createHeldV2Content, HELD_V2_REVISION } from '../../content/state/held-v2-campaign.js';
import { OPENING_EXPEDITION as O } from '../../content/authored/expedition.js';
import { commandContext, prepareTransaction } from '../domain/state/transaction.js';
import { validateCampaign } from '../domain/state/validate.js';
import { beginFormation } from '../domain/gameplay/scenes.js';
import { fail, succeed } from './results.js';

/** Exactly the navigation-backed predecessor. held-v1, partial catalog variants
 * and unknown revisions are not repair candidates. The four frozen authoring/
 * policy modules preserve held-v2 scene, item and session admission; shared
 * factual catalog/held ownership policies have not changed in this slice. */

/** Conversion runs only after codec checks original envelope agreement, time,
 * SHA-256 and exact held-v2 policy admission. It neither dispatches turns nor
 * reads/writes storage. Current encoding and repository confirmation stay outside.
 * @param {import('../../content/state/campaign.js').CampaignCatalogs} catalogs
 * @param {import('./contracts.js').CampaignContent} content
 * @param {import('../../content/authored/opening.js').AuthoredOpening} authored
 * @returns {import('./codec.js').SaveCompatibility} */
export function createOpeningCompatibility(catalogs, content, authored) {
  const legacy = createHeldV2Content(catalogs);
  if (legacy.contentRevision !== HELD_V2_REVISION) throw new TypeError('Held-v2 factual catalog boundary differs.');
  return Object.freeze({ content: legacy,
    convert(snapshot) {
      if (snapshot.contentRevision !== HELD_V2_REVISION) return fail('content-mismatch');
      // Defense in depth for direct callers; this cannot repair a malformed old
      // shape or admit a new await variant through the additive schema union.
      const admitted = validateCampaign(snapshot, legacy);
      if (!admitted.ok) return fail('invalid');
      try {
        const { draft, commitRevision } = prepareTransaction(admitted.snapshot, commandContext(admitted.snapshot));
        draft.contentRevision = content.contentRevision;
        if (draft.pendingScene?.sceneId === O.returnScene) {
          const script = authored.scenes.find(row => row.id === O.returnScene);
          if (!script) return fail('content-blocked');
          draft.pendingScene.continuation = script.continuation;
        } else if (draft.progress.seenScenes[O.returnScene]) {
          const visit = draft.progress.seenScenes[O.returnScene], grant = draft.progress.appliedGrants[0];
          if (draft.pendingScene || draft.session || draft.pendingResult || draft.mode !== 'town' || draft.progress.storyNodeId !== O.returnNode || !visit || visit.count !== 1 || draft.progress.appliedGrants.length !== 1 || grant?.grantId !== 'browser-reunion-reward' || grant.revision !== visit.lastRevision || grant.day !== 0 || !draft.progress.clears['tiny-woods']) return fail('invalid');
          beginFormation({ state: draft, emit() {} }, authored);
        }
        draft.revision = commitRevision;
        const checked = validateCampaign(draft, content);
        return checked.ok ? succeed(checked.snapshot) : fail(checked.kind === 'blocked' ? 'content-blocked' : 'invalid');
      } catch { return fail('invalid'); }
    },
  });
}
