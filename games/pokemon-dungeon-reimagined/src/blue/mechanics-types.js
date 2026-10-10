/**
 * Plain, JSON-safe state for the opening. The original campaign save graph is
 * deliberately not part of this game. Facts retain their source qualification.
 * @typedef {'s'|'sw'|'w'|'nw'|'n'|'ne'|'e'|'se'} Direction
 * @typedef {{x:number,y:number}} Point
 * @typedef {{hp:number,attack:number,specialAttack:number,defense:number,specialDefense:number}} Stats
 * @typedef {{op:string,stat?:string,delta?:number,recipient?:string,status?:string,chancePercent?:number,effect?:Effect,finalMultiplier?:number,fraction?:number[],minimum?:number,multiplier?:unknown}} Effect
 * @typedef {{id:string,name:string,internalId:number,type:string,power:number,pp:number,accuracyBeforeEffect:number,accuracyAfterDamage:number,criticalPercent:number,range:number,target:number,cutsCorners:boolean,effects:Effect[],hitCount:{min_hits:number|null,max_hits:number|null,hit_count_mode:string},aiWeight:number}} MoveData
 * @typedef {{id:string,name:string,types:string[],abilities:string[],regenerationRate:number,experienceYield:number,lowKickMultiplier:number,baseStats:number[],growth:number[][],learnset:[number,string][],starting:null|{level:number,cumulativeExp:number,stats:Stats,currentHP:number,moves:{moveId:string,currentPP:number,maximumPP:number}[]}}} SpeciesData
 * @typedef {{number:number,label:string,generation:import('../domain/generation/types.js').Parameters,encounters:{speciesId:string,level:number,threshold:number}[]}} FloorData
 * @typedef {{version:1,edition:string,qualification:string,starterIds:string[],species:Record<string,SpeciesData>,moves:Record<string,MoveData>,floors:FloorData[],timers:Record<string,{min:number,max:number,indefinite:boolean}>}} OpeningData
 * @typedef {{id:string,name:string,pp:number,maxPp:number,enabled:boolean,set:boolean}} MoveSlot
 * @typedef {'poke'|'oran-berry'|'pecha-berry'|'rawst-berry'} ItemKind
 * @typedef {{kind:ItemKind,amount:number}} HeldItem
 * @typedef {{id:string,kind:ItemKind,x:number,y:number,amount:number}} GroundItem
 * @typedef {{id:string,speciesId:string,name:string,x:number,y:number,direction:Direction,level:number,hp:number,maxHp:number,belly:number,maxBelly:number,exp:number,stats:Stats,moves:MoveSlot[],status:Record<string,number>,periodic:{poison:number,burn:number,leechSeed:number},stages:Record<string,number>,heldItem:HeldItem|null,regen:number,usedMove:boolean,experienceMarked:boolean,goal:Point|null,leechSource:string|null,bideDamage:number,skipAction:boolean}} Actor
 * @typedef {'playing'|'stairs'|'rescued'|'defeated'} DungeonStatus
 * @typedef {{actorId:string,moveId:string}} LearnRequest
 * @typedef {{version:1,floor:number,width:number,height:number,tiles:number[],roomIds:number[],explored:boolean[],visible:boolean[],rooms:{x:number,y:number,width:number,height:number}[],stairs:Point,hero:Actor,partner:Actor,enemies:Actor[],items:GroundItem[],money:number,turn:number,floorTurn:number,log:string[],status:DungeonStatus,rng:import('../contracts.js').RandomState,waterSport:number,nextId:number,pendingLearning:LearnRequest[],tutorials:string[],fidelityNotes:string[]}} DungeonState
 * @typedef {{type:'move'|'attack'|'damage'|'heal'|'defeat'|'message'|'floor'|'rescue'|'level'|'status'|'item',actorId?:string,targetId?:string,amount?:number,text?:string,from?:Point,to?:Point,moveId?:string}} GameEvent
 * @typedef {{type:'move'|'face',dx:number,dy:number}|{type:'moveSlot',slot:number}|{type:'attack'|'struggle'|'wait'|'stairs'|'cancelStairs'|'eatGround'|'eatHeld'|'dropHeld'|'pickup'}|{type:'learnMove',actorId:string,slot:number|null}} DungeonAction
 * @typedef {{consumedTurn:boolean,events:GameEvent[],status:DungeonStatus}} ActionResult
 * @typedef {{heroSpeciesId:string,partnerSpeciesId:string,heroName?:string,partnerName?:string,seed?:number|[number,number,number,number]}} DungeonOptions
 */
export {};
