// Frozen held-v2 opening policy boundary from 0e16251; do not widen admission.
import { OPENING_EXPEDITION as OPENING } from '../authored/expedition.js';
import { withGameplayPolicies } from './held-v2-gameplay.js';
import { copyPlainData } from '../../src/domain/state/plain.js';
import { freezeData } from '../../src/domain/state/validate.js';
import { createCatalogIdentityJoins } from './identities.js';
import { createProfilePolicy } from './profile.js';
import { createPokemonPolicy } from './pokemon.js';
import { createItemPolicy } from './items.js';
import { createEconomyPolicy } from './economy.js';
import { validateCampaignOptions } from './options.js';
import { createInitialCampaignLookup } from './initial.js';
import { createOpeningContent } from '../authored/held-v2-opening.js';
import { createOpeningPolicies } from './held-v2-opening-policies.js';
import { createActorPolicy, createConditionsPolicy, createFloorPolicy, validateScheduler, validateExpeditionEntry, INITIAL_SCHEDULE_POLICY_ID } from './expedition.js';

export const HELD_V2_REVISION = 'blue-campaign-state-v2-held-opening:browser-opening-v2:834c35ac48e325dd5444ffb2bc1fa5e7fbfd3fb3989b394ee5f84bb18d4ad461:b508ee769bd36619ac9eb07f22ad12455351323e7331f3568263b70a3cdcc44f:084d8380ed8dd09b02e5d7fbd660c65696b8c1830ea6b23da3aa262e423898cc:6d01abcea548861649dcbe24e37e27926b69c069e3c746cb1beb837969d466a8:947d052df0e8b6a6715b1d1039dd8b1cb425f974fa934b45363cecefaf0997dd:923f411ea7427579335db655885ec792ea30bbb7528c04242d980c99d34afa68';

/** @typedef {import('./starters.js').StarterCatalogs & import('./items.js').ItemCatalogs & {navigation?:import('../navigation-types.js').NavigationCatalog}} CampaignCatalogs */
/** @typedef {import('../../src/contracts/campaign.js').CampaignContent} CampaignContent */

/** Trusted, local content composition. Catalog lifetime stays with the loader;
 * this adapter never fetches, disposes, mutates saves or repairs missing facts.
 * The authored object is copied so later authoring edits cannot alter a live
 * content revision. Active unsupported mechanics retain field-specific owners.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/held-v2-opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createOpeningContent()) {
  const authored = /** @type {import('../authored/held-v2-opening.js').AuthoredOpening} */ (/** @type {unknown} */ (copyPlainData(authoredContent)));
  if (!authored.revision || !authored.profileId || authored.scenes.length !== 3 || !authored.scenes[0]?.lines.length || authored.scenes[0].lines.some(line => typeof line !== 'string' || !line.length) || !Number.isSafeInteger(authored.width) || !Number.isSafeInteger(authored.height) || authored.width < 1 || authored.height < 1) throw new TypeError('Incomplete authored opening contract.');
  freezeData(authored);
  const factual = createCatalogIdentityJoins(catalogs);
  /** @type {Partial<Record<import('../../src/contracts.js').CatalogKind,ReadonlySet<string>>>} */
  const authoredIds = {
    scene: new Set(authored.scenes.map(scene => scene.id)), 'map-definition': new Set([authored.town.mapDefinitionId, ...(catalogs.navigation?.definitionIds ?? [])]),
    'story-node': new Set([authored.storyNodeId, OPENING.storyNode, OPENING.returnNode]), 'scene-role': new Set([authored.heroRoleId, authored.partnerRoleId]),
    'story-branch': new Set(catalogs.campaign.getIdentities().filter(row => row.kind === 'branch').map(row => row.id)), milestone: new Set([OPENING.boostGuard, ...catalogs.campaign.getIdentities().filter(row => row.kind === 'milestone').map(row => row.id)]), grant: new Set(['browser-reunion-reward']), 'scene-choice': new Set(), 'scene-option': new Set(), 'story-actor': new Set(),
    policy: new Set([INITIAL_SCHEDULE_POLICY_ID, OPENING.entryPolicy, OPENING.outcomePolicy, 'native-spawn-sleep', 'native-opening-reaction']), encounter: new Set(['pokemon-016', 'pokemon-191', 'pokemon-265', 'pokemon-102'].map(id => `tiny-woods-${id}`)),
  };
  /** @type {CampaignContent['identities']} */
  const identities = Object.freeze({ ...factual,
    has(kind, id) {
      const local = authoredIds[kind];
      if (local) return local.has(id);
      if (kind === 'terrain' && catalogs.navigation) {
        try { catalogs.navigation.terrain(id); return true; } catch (error) { if (error instanceof RangeError) return false; throw error; }
      }
      return factual.has(kind, id);
    },
  });
  const initialCampaign = createInitialCampaignLookup(catalogs, authored);
  const opening = withGameplayPolicies(authored, createOpeningPolicies(authored, initialCampaign));
  return Object.freeze({ referenceEdition: 'blue-rescue-team', campaignSchemaVersion: 1,
    // Reviewed adapter revision binds all five factual catalogs plus authored
    // script/state contract; it is not one catalog's schemaVersion.
    contentRevision: HELD_V2_REVISION,
    identities, initialCampaign,
    policies: Object.freeze({ profile: createProfilePolicy(catalogs), pokemon: createPokemonPolicy(catalogs),
      actor: createActorPolicy(catalogs), item: createItemPolicy(catalogs), economy: createEconomyPolicy(catalogs),
      floor: createFloorPolicy(identities, catalogs), conditions: createConditionsPolicy(catalogs.species), scheduler: validateScheduler,
      expeditionEntry: validateExpeditionEntry, ...opening, options: validateCampaignOptions }),
  });
}
