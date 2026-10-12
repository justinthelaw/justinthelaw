/**
 * Plain, JSON-safe state for the opening. The original campaign save graph is
 * deliberately not part of this game. Facts retain their source qualification.
 * @typedef {'s'|'sw'|'w'|'nw'|'n'|'ne'|'e'|'se'} Direction
 * @typedef {'together'|'after-foes'|'avoid-first-hit'} Tactic
 * @typedef {'item-catcher'|'course-checker'|'dedicated-traveler'|'item-master'|'exclusive-move-user'} IqSkill
 * @typedef {{x:number,y:number}} Point
 * @typedef {{hp:number,attack:number,specialAttack:number,defense:number,specialDefense:number}} Stats
 * @typedef {{op:string,turns?:number,skipWeather?:string,weatherMultiplier?:Readonly<Record<string,number>>,stat?:string,delta?:number,recipient?:string,status?:string,chancePercent?:number,secondaryChanceRaw?:number,effect?:Effect,finalMultiplier?:number,fraction?:number[],factor?:number[],minimum?:number|number[],multiplier?:unknown,multiplierByTargetStatus?:Readonly<Record<string,number>>,amountByWeather?:Readonly<Record<string,number>>,amount?:number|string|null,basis?:string,requires?:string|string[],blockedBy?:string|string[],gate?:string,phase?:string,cureStatusClasses?:string[],maxStage?:number,targetType?:string,incomingTypes?:string[],fromActor?:string,toActor?:string,sport?:string,durationBounds?:number[],damageMultiplier?:number[],affectedType?:string}} Effect
 * @typedef {{id:string,name:string,type:string,power:number,pp:number,accuracyBeforeEffect:number,accuracyAfterDamage:number,criticalPercent:number,chainedHitsRaw:number,range:number,target:number,cutsCorners:boolean,effects:Effect[],aiWeight:number}} MoveData
 * @typedef {{name:string,chanceAsleep?:number,types:string[],abilities:string[],regenerationRate:number,experienceYield:number,lowKickMultiplier:number,baseStats:number[],growth:number[][],learnset:[number,string][]}} SpeciesData
 * @typedef {{number:number,label:string,generation:import('../domain/generation/types.js').Parameters,encounters:{speciesId:string,level:number,threshold:number}[]}} FloorData
 * @typedef {{version:1,edition:string,qualification:string,wildSpawn:{randomMovementChance:number},starterIds:string[],species:Record<string,SpeciesData>,moves:Record<string,MoveData>,floors:FloorData[],timers:Record<string,{min:number,max:number,indefinite:boolean}>}} OpeningData
 * @typedef {{id:string,name:string,pp:number,maxPp:number,enabled:boolean,set:boolean}} MoveSlot
 * @typedef {'poke'|'oran-berry'|'pecha-berry'|'rawst-berry'} ItemKind
 * @typedef {{kind:ItemKind,amount:number}} HeldItem
 * @typedef {{id:string,kind:ItemKind,x:number,y:number,amount:number}} GroundItem
 * @typedef {{id:string,speciesId:string,name:string,x:number,y:number,direction:Direction,level:number,hp:number,maxHp:number,belly:number,maxBelly:number,exp:number,stats:Stats,moves:MoveSlot[],status:Record<string,number>,periodic:{poison:number,burn:number,leechSeed:number},stages:Record<string,number>,heldItem:HeldItem|null,regen:number,usedMove:boolean,experienceMarked:boolean,goal:Point|null,leechSource:string|null,bideDamage:number,skipAction:boolean,physicalOffenseMultiplierQ8?:number,specialOffenseMultiplierQ8?:number,physicalDefenseMultiplierQ8?:number,specialDefenseMultiplierQ8?:number,useHeldItem?:boolean,tactic?:Tactic,enabledIq?:IqSkill[],abilityVisualFlags?:number,skullBashSlot?:number,solarBeamSlot?:number,constrictionTurns?:number,constrictionCountdown?:number,constrictionEffectId?:59|316}} Actor
 * @typedef {'playing'|'stairs'|'rescued'|'defeated'} DungeonStatus
 * @typedef {'unprepared'|'input'|'forced'|'blocked'} DungeonTurnPhase
 * @typedef {{actorId:string,moveId:string}} LearnRequest
 * @typedef {{version:1,floor:number,width:number,height:number,tiles:number[],roomIds:number[],explored:boolean[],visible:boolean[],rooms:{x:number,y:number,width:number,height:number}[],stairs:Point,hero:Actor,partner:Actor,enemies:Actor[],items:GroundItem[],money:number,turn:number,floorTurn:number,baseBeat?:number,leaderPrepared?:boolean,log:string[],status:DungeonStatus,rng:import('../domain/shared-types.js').RandomState,mudSport?:number,waterSport:number,nextId:number,pendingLearning:LearnRequest[],tutorials:string[],fidelityNotes:string[]}} DungeonState
 * @typedef {{type:'presentation'|'move'|'attack'|'damage'|'heal'|'defeat'|'message'|'floor'|'rescue'|'level'|'status'|'item'|'tutorial'|'throw'|'talk',presentation?:import('./battle-events.js').BattleEvent,actorId?:string,targetId?:string,amount?:number,text?:string,from?:Point,to?:Point,moveId?:string}} GameEvent
 * @typedef {{type:'move'|'face',dx:number,dy:number,skipPickup?:boolean,runRequested?:boolean}|{type:'moveSlot',slot:number}|{type:'attack'|'regularAttack'|'struggle'|'wait'|'stairs'|'cancelStairs'|'eatGround'|'eatHeld'|'usePartnerItem'|'throwGround'|'pickup'}|{type:'learnMove',actorId:string,slot:number|null}} DungeonAction
 * @typedef {{consumedTurn:boolean,events:GameEvent[],status:DungeonStatus}} ActionResult
 * @typedef {ActionResult & {phase:'input'|'forced'|'advanced'|'blocked',changed:boolean}} PreparationResult
 * @typedef {{heroSpeciesId:string,partnerSpeciesId:string,heroName?:string,partnerName?:string,seed?:number|[number,number,number,number]}} DungeonOptions
 */
export {};
