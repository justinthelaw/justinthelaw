/** Prospective stable scene cursor, separate from historical PendingScene.
 * The actual route caller owns admission, bindings, canonical scene mode,
 * allocation, session pause, grants and the source return transaction.
 * @typedef {{stageId:string;optionId:string|null;revision:number}} EarlySceneAcknowledgment
 * @typedef {{kind:'early-campaign-scene-v1';sceneId:string;sceneInstanceId:import('./campaign.js').SceneInstanceId;entryRevision:number;day:number;stageId:string|null;acknowledgments:EarlySceneAcknowledgment[]}} EarlyCampaignSceneCursor
 */
export {};
