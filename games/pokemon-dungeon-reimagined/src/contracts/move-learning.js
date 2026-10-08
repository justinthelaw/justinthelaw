/** @typedef {{kind:'turn';sourceActorId:import('../contracts.js').ActorId|null;}|{kind:'settlement';outcome:'success'|'fainting'|'wind-expulsion'|'give-up';casualties?:{actorId:import('../contracts.js').ActorId;level:number;}[]}|{kind:'scene';sceneId:import('../contracts.js').SceneId;sceneInstanceId:import('../contracts/campaign.js').SceneInstanceId;cursor:number;}} LearningOrigin
 * @typedef {{experienceBefore:import('./campaign.js').Quantity;gainsBefore:import('./campaign.js').Quantity;amount:number;level:number;awards:{defeatedActorId:import('../contracts.js').ActorId;attackerActorId:import('../contracts.js').ActorId;amount:number;awardedRevision:number;sourceRound:number;sourceFrame:import('./campaign.js').TurnContinuation;}[];}} PendingExperience
 * @typedef {{actorId:import('../contracts.js').ActorId;level:number;moveId:import('../contracts.js').MoveId;
 * selectionRevision:number;movesFingerprint:string;resumeFrameFingerprint:string;
 * candidateRng:import('../contracts.js').RandomState;beforeGrowth:import('./campaign.js').PokemonGrowth;beforeHp:number;
 * origin:LearningOrigin;actorOrder:import('../contracts.js').ActorId[];actorIndex:number;
 * schedulerTag:{kind:'ready'}|{kind:'scene-paused';sceneInstanceId:import('./campaign.js').SceneInstanceId};}} LearningChoice
 * @typedef {{actorId:import('../contracts.js').ActorId;moveSlot:import('./campaign.js').MoveSlot;forgottenRevision:number;}} ForgottenMove
 */
export {};
