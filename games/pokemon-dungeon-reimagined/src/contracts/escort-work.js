/** Prospective escort owner types. These declarations do not admit a save or
 * activate a campaign; the successor must independently prove its raw owners.
 * @typedef {import('./campaign.js').SessionActor} Actor
 * @typedef {{jobId:import('../contracts.js').JobId,client:import('./campaign.js').SpeciesForm,recipient:import('./campaign.js').SpeciesForm,slot:number,nativeRecruitedId:number,joinLocation:number,joinFloor:number,level:number,totalExperience:number,stats:import('./campaign.js').StatBlock,iqPoints:number,iqSkillIds:readonly string[],tacticId:string,isLeader:boolean,heldItem:null,belly:number,maxBelly:number,hiddenPower:{nativeTypeId:number,power:number},moves:readonly {moveId:string,nativeMoveId:number,basePp:number,enabled:boolean,currentPp:number,powerBoost:number,ppCapacityBonus:number}[],beforeGeneralRandom:import('../domain/native-general-rng.js').NativeGeneralRandomState,afterGeneralRandom:import('../domain/native-general-rng.js').NativeGeneralRandomState}} PreparedGuest
 * @typedef {{kind:'escort-guest',jobId:import('../contracts.js').JobId}} EscortGuestBinding
 * @typedef {Omit<Actor,'binding'> & {binding:EscortGuestBinding}} EscortGuestActor
 * @typedef {{actorId:import('../contracts.js').ActorId,jobId:import('../contracts.js').JobId,slot:number,nativeRecruitedId:number,joinLocation:number,joinFloor:number,client:import('./campaign.js').SpeciesForm,recipient:import('./campaign.js').SpeciesForm,hiddenPower:{nativeTypeId:number,power:number},moveSlotIds:import('../contracts.js').MoveSlotId[],heldContainerId:import('../contracts.js').ContainerId}} EscortGuestEntry
 */
export {};
