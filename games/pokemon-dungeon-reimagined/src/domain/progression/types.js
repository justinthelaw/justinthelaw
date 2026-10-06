/** @typedef {import('../../contracts/campaign.js').NativeProgressState} NativeProgressState */
/** @typedef {import('../../contracts/campaign.js').NativeScenarioId} NativeScenarioId */
/** @typedef {import('../../contracts/campaign.js').StateIssue} StateIssue */
/** @typedef {import('../../../content/campaign.js').CampaignCatalog} CampaignCatalog */
/** @typedef {import('../../../content/campaign-types.js').PredicatesDocument['records'][number]} NativePredicate */
/** @typedef {import('../../../content/campaign-types.js').TransitionsDocument['records'][number]['actions'][number]} CatalogAction */
/** @typedef {{status:'blocked'; requirementIds:readonly string[]} | {status:'invalid'; issues:readonly StateIssue[]}} ProgressionFailure */
/** @template T @typedef {{status:'ready'; value:T} | ProgressionFailure} ProgressionResult */
/** @typedef {Readonly<{kind:'eligible-job-reward-created'; jobId:import('../../contracts.js').JobId; grantId:import('../../contracts/campaign.js').GrantId}>} RewardReceipt */
/** Extra operations are deliberately named native boundaries, never interpreted research strings.
 * Receipts are trusted domain facts, not user commands or permission to skip jobs/grants validation.
 * @typedef {CatalogAction |
 * {kind:'completed-job-reward'; receipt:RewardReceipt} |
 * {kind:'record-return-frequency'; outcome:'won'|'mode-10'|'mode-11'|'lost'} |
 * {kind:'write-cutscene-flag'; flagId:string; scope:'pending'|'persistent'|'both'; value:boolean} |
 * {kind:'flush-pending-flags'; boundary:'boss-dispatch-after-weather-clear'} |
 * {kind:'clear-pending-flags'}
 * } NativeOperation
 */
/** Returned candidate is private transaction data. Milestones and consumed reward
 * receipts MUST be integrated with existing campaign histories before validation/commit.
 * @typedef {{native:NativeProgressState; acquiredMilestoneIds:readonly string[]; rewardReceipts:readonly RewardReceipt[]}} ProgressionCandidate
 */
export {};
