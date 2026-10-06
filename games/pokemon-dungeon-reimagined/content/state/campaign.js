import { SPECIES_MANIFEST_SHA256, ONBOARDING_MANIFEST_SHA256 } from '../catalog-integrity.js';
import { MORNING } from '../authored/first-morning.js';
import { withMorningPolicies } from './first-morning.js';
import { TEAM } from '../authored/team-formation.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { OPENING_EXPEDITION as OPENING } from '../authored/expedition.js';
import { withGameplayPolicies } from './gameplay.js';
import { NAVIGATION_MANIFEST_SHA256 } from '../navigation-integrity.js';
import { EFFECT_INDEX_SHA256 } from '../effects-integrity.js';
import { DUNGEON_INDEX_SHA256 } from '../dungeons-integrity.js';
import { CAMPAIGN_MANIFEST_SHA256 } from '../campaign-integrity.js';
import { copyPlainData } from '../../src/domain/state/plain.js';
import { freezeData } from '../../src/domain/state/validate.js';
import { createCatalogIdentityJoins } from './identities.js';
import { createProfilePolicy } from './profile.js';
import { createPokemonPolicy } from './pokemon.js';
import { createItemPolicy } from './items.js';
import { createEconomyPolicy } from './economy.js';
import { validateCampaignOptions } from './options.js';
import { createInitialCampaignLookup } from './initial.js';
import { createOpeningContent, createTeamOpeningContent } from '../authored/opening.js';
import { createOpeningPolicies } from './opening-policies.js';
import { createActorPolicy, createConditionsPolicy, createFloorPolicy, validateScheduler, validateExpeditionEntry, INITIAL_SCHEDULE_POLICY_ID } from './expedition.js';

/** @typedef {import('./starters.js').StarterCatalogs & import('./items.js').ItemCatalogs & {navigation?:import('../navigation-types.js').NavigationCatalog}} CampaignCatalogs */
/** @typedef {import('../../src/contracts/campaign.js').CampaignContent} CampaignContent */

/** Trusted, local content composition. Catalog lifetime stays with the loader;
 * this adapter never fetches, disposes, mutates saves or repairs missing facts.
 * The authored object is copied so later authoring edits cannot alter a live
 * content revision. Active unsupported mechanics retain field-specific owners.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @param {'morning'|'team'} [boundary]
 * @returns {Readonly<CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createOpeningContent(), boundary = 'morning') {
  if (boundary !== 'morning' && boundary !== 'team') throw new TypeError('Unknown campaign admission boundary.');
  const morning = boundary === 'morning';
  const authored = /** @type {import('../authored/opening.js').AuthoredOpening} */ (/** @type {unknown} */ (copyPlainData(authoredContent)));
  if (fingerprint(authored) !== fingerprint(morning ? createOpeningContent() : createTeamOpeningContent())) throw new TypeError('Incomplete or unknown finite authored opening contract.');
  freezeData(authored);
  const factual = createCatalogIdentityJoins(catalogs);
  /** @type {Partial<Record<import('../../src/contracts.js').CatalogKind,ReadonlySet<string>>>} */
  const authoredIds = {
    scene: new Set(authored.scenes.map(scene => scene.id)), 'map-definition': new Set([authored.town.mapDefinitionId, TEAM.map, ...(morning ? [MORNING.interior] : []), ...(catalogs.navigation?.definitionIds ?? [])]),
    'story-node': new Set([authored.storyNodeId, OPENING.storyNode, OPENING.returnNode, TEAM.story, TEAM.foundedStory, ...(morning ? [MORNING.story] : [])]), 'scene-role': new Set([authored.heroRoleId, authored.partnerRoleId]),
    'story-branch': new Set(catalogs.campaign.getIdentities().filter(row => row.kind === 'branch').map(row => row.id)), milestone: new Set([OPENING.boostGuard, ...catalogs.campaign.getIdentities().filter(row => row.kind === 'milestone').map(row => row.id)]), grant: new Set(['browser-reunion-reward', TEAM.grant, ...(morning ? MORNING.grants : [])]), 'scene-choice': new Set([TEAM.offerChoice, TEAM.nameChoice, ...(morning ? [MORNING.choice] : [])]), 'scene-option': new Set([TEAM.accept, TEAM.refuse, TEAM.confirm, TEAM.edit, ...(morning ? [MORNING.accept, MORNING.later] : [])]), 'story-actor': new Set(),
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
  const predecessor = withGameplayPolicies(authored, createOpeningPolicies(authored, initialCampaign));
  const opening = morning ? withMorningPolicies(authored, predecessor) : predecessor;
  return Object.freeze({ referenceEdition: 'blue-rescue-team', campaignSchemaVersion: 1,
    // Reviewed adapter revision binds all five factual catalogs plus authored
    // script/state contract; it is not one catalog's schemaVersion.
    contentRevision: `${morning ? 'blue-campaign-state-v4-morning-opening' : 'blue-campaign-state-v3-team-opening'}:${authored.revision}:${EFFECT_INDEX_SHA256}:${DUNGEON_INDEX_SHA256}:${CAMPAIGN_MANIFEST_SHA256}:${catalogs.navigation ? NAVIGATION_MANIFEST_SHA256 : 'no-navigation'}:${SPECIES_MANIFEST_SHA256}:${ONBOARDING_MANIFEST_SHA256}`,
    identities, initialCampaign,
    policies: Object.freeze({ profile: createProfilePolicy(catalogs), pokemon: createPokemonPolicy(catalogs),
      actor: createActorPolicy(catalogs), item: createItemPolicy(catalogs), economy: createEconomyPolicy(catalogs),
      floor: createFloorPolicy(identities, catalogs), conditions: createConditionsPolicy(catalogs.species), scheduler: validateScheduler,
      expeditionEntry: validateExpeditionEntry, ...opening, options: validateCampaignOptions }),
  });
}
