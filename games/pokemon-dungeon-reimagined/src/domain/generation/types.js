/** Transient generation records; canonical campaign state remains the only saved owner. */
/** @template T @typedef {import('../../../content/navigation-types.js').ReadonlyData<T>} ReadonlyData */
/** @typedef {import('../../contracts.js').GridPosition} Position */
/** @typedef {import('../../contracts.js').RandomState} RandomState */
/** @typedef {import('../../../content/dungeons.js').GenerationProfile['parameters']} Parameters */
/** @typedef {{layout:RandomState,encountersItems:RandomState}} GenerationStreams */
/** @typedef {{x:number,z:number,width:number,height:number}} Bounds */
/** @typedef {{terrain:'wall'|'floor'|'water'|'lava'|'void',impassable:boolean,unbreakable:boolean,door:boolean,sealed:boolean,room:number|null,junction:boolean,shop:boolean,house:boolean,cornerCuttable:boolean,special:boolean,required:boolean}} Cell */
/** @typedef {{index:number,bounds:Bounds,kind:'ordinary'|'monster-house'|'shop'|'reward-chamber',hidden:boolean,secondary:boolean,imperfect:boolean,maze:boolean,merged:boolean,gridPosition:Position|null}} Room */
/** @typedef {{x:number,z:number,valid:boolean,room:boolean,bounds:Bounds|null,roomIndex:number|null,edges:Set<number>,absorbed:boolean}} GridCell */
/** @typedef {{cells:Cell[][],rooms:Room[],entry:Position|null,exit:Position|null,fixedRoleAnchors:Position[],reward:Position|null,keyDoor:Position|null,forceHouse:boolean,externalSecondary:boolean,protectedBounds:Bounds|null}} Geometry */
/** @typedef {{roleId:string,speciesId:string,formId:string|null,level:number}} EncounterSpec */
/** @typedef {{roleId:string,kind:'actor'|'item'|'objective',placement:'ordinary'|'near-entry'|'fixed-anchor'}} RequiredPlacement */
/** @typedef {{callbackId:string,actors:readonly EncounterSpec[],exit:'open'|'locked'|'none'}} FixedEncounterPlan */
/** @typedef {{floorType:'normal'|'fixed'|'rescue',missionSuppressesHouse:boolean,missionAddsEnemy:boolean,missionClient?:EncounterSpec,canChangeLeader:boolean,teamSize:number,enemyLimit:number,required:readonly RequiredPlacement[],fixedEncounter:FixedEncounterPlan|null,receivedTeam:readonly EncounterSpec[]|null,specialPopulation:readonly EncounterSpec[]|null,ownedRewardItemIds:readonly string[]}} GenerationContext */
/** Item quantity/payload construction belongs to the item owner; selection/placement never substitutes another item. */
/** @typedef {{kind:'item',itemId:string,position:Position,sticky:boolean,route:'floor'|'buried'|'monsterHouse'|'shop'|'fixed',deferredUntil:'key-open'|null,rewardFallbackItemId:string|null,quantityContext:{moneyUpperBound:number}}|{kind:'trap',trapId:string,position:Position,revealed:boolean}|{kind:'enemy',encounter:EncounterSpec,position:Position,route:'ordinary'|'monsterHouse'|'fixed'|'received-team'|'mission-client'}|{kind:'required',request:RequiredPlacement,position:Position}|{kind:'shopkeeper',position:Position,roomIndex:number}} Placement */
/** @typedef {{profile:ReadonlyData<import('../../../content/dungeons.js').DungeonFloor|import('../../../content/dungeons.js').DungeonScene>,generation:ReadonlyData<import('../../../content/dungeons.js').GenerationProfile>,streams:GenerationStreams,context:GenerationContext}} GenerateInput */
/** @typedef {{navigation:import('../../../content/navigation-types.js').NavigationCatalog,dungeons:Awaited<ReturnType<typeof import('../../../content/dungeons.js').loadDungeonCatalog>>,isEncounterEligible:(row:ReadonlyData<import('../../../content/dungeons.js').EncounterPool['rows'][number]>,route:'initial'|'arrival')=>boolean}} GenerationDependencies */
/** @typedef {{width:56,height:32,profileId:string,generationId:string,fixedIndex:number,layoutFamily:number,geometry:Geometry,placements:Placement[],partyPositions:Position[],diagnostics:{outerAttempts:number,geometryAttempts:number,fallback:boolean,adaptations:string[]}}} FloorBlueprint */
/** @typedef {{kind:'ready',blueprint:ReadonlyData<FloorBlueprint>,streams:Readonly<GenerationStreams>}|{kind:'blocked',requirementIds:readonly string[]}} GenerationResult */
/** @typedef {{sequence:import('../../contracts.js').IdSequence,existingIds:ReadonlySet<string>,location:import('../../contracts/campaign.js').FloorLocation,definitionId:import('../../contracts/campaign.js').MapDefinitionId,weather:import('../../contracts/campaign.js').WeatherState,windCounter:number,exit:{kind:import('../../contracts/campaign.js').ExitState['kind'],destination:import('../../contracts/campaign.js').Destination,lock:import('../../contracts/campaign.js').ExitState['lock']}|null}} MaterializeInput */
export {};
