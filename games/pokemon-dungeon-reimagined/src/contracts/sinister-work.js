/** Prospective v25 work only. Current v24 schema/factory does not admit it.
 * @typedef {import('./campaign.js').ActorSlotRef} Ref
 * @typedef {import('./campaign.js').ResolvedAction & {kind:'attack'|'struggle'|'move-use'}} Attack
 * @typedef {{kind:'prepared-move'|'impact'|'move-complete'|'opportunity-end'|'flush-end'|'follower-end'|'terminal';actor:Ref|null;createdRevision:number;frameFingerprint:string}} SinisterCheckpoint
 * @typedef {{actor:Ref;selectedAction:Attack;action:Attack;confused:boolean;facingBefore:import('./campaign.js').Facing;facingAfter:import('./campaign.js').Facing;directionRandom:import('../contracts.js').RandomState;chargeBefore:import('./campaign.js').SessionActor['conditions']['bide'];chargeOwned:boolean;preparedRevision:number;beforePp:number|null;afterPp:number|null;beforeRandom:import('../contracts.js').RandomState;afterRandom:import('../contracts.js').RandomState;totalHits:number;completedHits:number;disposition:'active'|'hit-count'|'cannot-attack'|'actor-removed'|'targets-empty'|'terminal'}} SinisterMoveReceipt
 * @typedef {{phase:'captured'|'return';origin:import('./move-learning.js').LearningOrigin & {kind:'settlement'|'scene'};requestedRevision:number;sourceFrame:import('./campaign.js').TurnContinuation;frameFingerprint:string;schedulerTag:{kind:'ready'}|{kind:'scene-paused';sceneInstanceId:import('./campaign.js').SceneInstanceId};casualties:{actor:Ref;level:number}[]}} SinisterTerminalReceipt
 * @typedef {{combat:import('../domain/gameplay/sinister-combat.js').SinisterCombatState;move:SinisterMoveReceipt|null;checkpoint:SinisterCheckpoint|null;terminal:SinisterTerminalReceipt|null}} SinisterTurnState
 */
export {};
