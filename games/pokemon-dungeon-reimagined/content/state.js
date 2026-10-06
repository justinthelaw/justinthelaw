/** Supported, independent joins for the future concrete CampaignContent.
 * This module deliberately does not export a CampaignContent implementation:
 * factual catalogs do not contain accepted scenes, semantic handlers or the
 * complete progression state projection. See plan/STATE-CATALOG-JOINS.md.
 */
export { createCatalogIdentityJoins } from './state/identities.js';
export { joinStartingPair } from './state/starters.js';
export { OPTION_BOUNDS, validateCampaignOptions } from './state/options.js';
export { createItemPolicy, decodePokeQuantity, encodePokeQuantity } from './state/items.js';
export { createEconomyPolicy } from './state/economy.js';
export { QUIZ_REVISION, createQuizSelectionLookup, createProfilePolicy } from './state/profile.js';
export { createPokemonPolicy } from './state/pokemon.js';
export { IQ_SKILLS, TACTICS, validateTacticSelection } from './state/pokemon-rules.js';
