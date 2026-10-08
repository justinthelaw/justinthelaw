/** Canonical campaign boundary. No browser, persistence or transition execution.
 * @typedef {import('./state/plain.js').PlainDataLimits} PlainDataLimits
 */
export { PLAIN_DATA_LIMITS, copyPlainData, snapshotPlainData } from './state/plain.js';
export { validateCampaign, copyCampaignDraft } from './state/validate.js';
export { createCampaign } from './state/create.js';
export { prepareTransaction, commandContext } from './state/transaction.js';
