/** Supported, independent joins for the future concrete CampaignContent.
 * This module deliberately does not export a CampaignContent implementation:
 * factual catalogs do not contain accepted scenes, semantic handlers or the
 * complete progression state projection. See plan/STATE-CATALOG-JOINS.md.
 */
export { createCatalogIdentityJoins } from './state/identities.js';
export { joinStartingPair } from './state/starters.js';
export { OPTION_BOUNDS, validateCampaignOptions } from './state/options.js';
