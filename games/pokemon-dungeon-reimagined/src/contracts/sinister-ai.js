/** Prospective observer projection, not a save revision or source-history producer.
 * Every field must come from the actual named construction/refresh call.
 * Native direction zero is south; native room 255 is corridor.
 * @typedef {{x:number,z:number}} AiPosition
 * @typedef {{side:'team'|'wild',slotIndex:number}} AiSlot
 * @typedef {{action:number,direction:number,unk3:number,parameters:{useIndex:number,itemPos:AiPosition}[],itemTargetPosition:AiPosition}} AiAction
 * @typedef {{objective:number,notNextToTarget:boolean,targetingEnemy:boolean,turningAround:boolean,targetGeneration:number,target:AiSlot|null,unkC:number,position:AiPosition}} AiTarget
 * @typedef {{target:AiTarget,targetPos:AiPosition,action:AiAction,allySkip:boolean,waiting:boolean,moveRandomly:number,mobileTurnTimer:number,visualFlags:number,previousVisualFlags:number,decoyAITracker:number}} AiRecord
 * @typedef {{actorId:string,generation:number,identity:import('./campaign.js').SpeciesForm,type:0|1,position:AiPosition,room:number,visible:boolean,facing:import('./campaign.js').Facing,hp:number,maxHp:number,belly:import('./campaign.js').Quantity,isTeamLeader:boolean,isNotTeamMember:boolean,tactic:number,behavior:number,shopkeeper:number,joinedAt:number,activeIq:number,abilities:number[],held:{itemId:string|null,exists:boolean,sticky:boolean},status:{sleep:number,frozen:number,cringe:number,bide:number,curse:number,invisible:number,blinker:number,terrifiedTurns:number},prevPos:AiPosition[],recalculateFollow:boolean,ai:AiRecord}} AiActor
 * @typedef {{type:number,visible:boolean,inShop:boolean}} AiObject
 * @typedef {{terrainFlags:number,room:number,walkableNeighborFlags:number[],monster:AiSlot|null,object:AiObject|null}} AiTile
 * @typedef {{bottomRightX:number,bottomRightZ:number,topLeftX:number,topLeftZ:number}} AiRoom
 * @typedef {{count:number,activePrefix:AiPosition[]}} AiJunctions
 * @typedef {{width:number,height:number,tiles:AiTile[][],oob:AiTile,roomData:AiRoom[],junctions:AiJunctions[],tileset:number,visibilityRange:number,monsterHouseTriggered:boolean,decoyIsActive:boolean}} AiGeometry
 * @typedef {{sessionId:string,mapId:string,actorId:string,generation:number,revision:number}} AiOwner
 * @typedef {{kind:'sinister-ai-input',phase:'initial'|'floor-refresh',owner:AiOwner,beforeRandom:import('../domain/rng.js').RandomState,actorSlot:AiSlot,slots:{team:(AiActor|null)[],wild:(AiActor|null)[],active:(AiSlot|null)[]},leaderSlot:AiSlot|null,geometry:AiGeometry}} SinisterAiInput
 * @typedef {{cap:number,value:number,beforeRandom:import('../domain/rng.js').RandomState,afterRandom:import('../domain/rng.js').RandomState}} AiDraw
 * @typedef {{kind:'sinister-ai-prepared',phase:SinisterAiInput['phase'],owner:AiOwner,beforeRandom:import('../domain/rng.js').RandomState,afterRandom:import('../domain/rng.js').RandomState,source:{branch:string,draws:AiDraw[],movementProbes:{direction:number,canMove:boolean,pokemonInFront:boolean}[]},beforeAi:AiRecord,afterAi:AiRecord,beforeLeaderSlot:AiSlot|null,afterLeaderSlot:AiSlot|null,facing:import('./campaign.js').Facing,orientationRequest:number|null,action:AiAction,allySkip:boolean,waiting:boolean}} SinisterAiPrepared
 */
export {};
