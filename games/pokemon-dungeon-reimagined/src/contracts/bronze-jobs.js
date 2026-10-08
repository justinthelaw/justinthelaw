/** Exact prospective generated metadata. Original sources remain byte-frozen.
 * @typedef {{kind:'generated',generationPolicyId:import('./campaign.js').PolicyId,posting:'board'|'mailbox',generatedDay:number,generatedRevision:number,seed:number,missionType:0|1|2|3|4,targetItem:import('../contracts.js').ItemId,itemReward:import('../contracts.js').ItemId,rewardType:0|1|2|3|4|5|6|7|8,unk2:number,friendAreaReward:import('./campaign.js').FriendAreaId|null}} BronzeSource
 * @typedef {Omit<import('./campaign.js').JobRecord,'source'> & {source:BronzeSource}} BronzeJobRecord
 * @typedef {{jobId:import('../contracts.js').JobId,areaId:import('./campaign.js').FriendAreaId,revision:number,day:number,outcome:'unlocked'|'already-owned-money'}} MissionAreaReceipt
 */
export {};
