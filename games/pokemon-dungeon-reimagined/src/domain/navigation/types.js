/** Navigation owns permission and geometry, never campaign mutation or action costs. */
/** @template T @typedef {import('../../../content/navigation-types.js').ReadonlyData<T>} ReadonlyData */
/** @typedef {import('../../contracts.js').GridPosition} Position */
/** @typedef {import('../../contracts.js').ActorId} ActorId */
/** @typedef {ReadonlyData<import('../../contracts/campaign.js').FloorState>} NavigationMap */
/** @typedef {import('../../../content/navigation-types.js').NavigationCatalog} NavigationCatalog */
/** @typedef {{catalog:NavigationCatalog,tileset:number,visibilityRange:number}} NavigationContext */
/** Facts must describe actual identity, not the apparent Transform identity. */
/** @typedef {{actorId:ActorId,identity:{speciesId:string,formId:string|null},position:Position,mobile:boolean,mobileScarf:boolean,allTerrainHiker:boolean,superMobile:boolean}} NavigationActor */
/** @typedef {{actorId:ActorId,position:Position}} Occupant */
/** @typedef {{houseAvoider:boolean,trapAvoider:boolean,lavaEvader:boolean,eyedrops:boolean}} AiPreferences */
/** @typedef {{kind:'allowed'}|{kind:'blocked',reason:string}} Permission */
/** @typedef {{actor:NavigationActor,immobilized:boolean,confused:boolean,sleep:'none'|'sleepless'|'yawning'|'other',charging:boolean,swapEligible:boolean}} SwapActor */
/** @typedef {{kind:'allowed',unsafe:boolean,first:Position,second:Position}|{kind:'blocked',reason:string}|{kind:'confirmation-required',reason:string}} SwapResult */
/** @typedef {{actorId:ActorId,position:Position,present:boolean,invisible:boolean}} VisibleActor */
/** @typedef {{position:Position,blinded:boolean,seesInvisible:boolean}} SightViewer */
/** @typedef {{itemId:string,position:Position,onGround:boolean}} VisibleItem */
/** @typedef {{map:NavigationMap,context:NavigationContext,revision:number,viewer:SightViewer,actors:readonly VisibleActor[],items:readonly VisibleItem[],revealTraps:boolean}} VisibilityInput */
export {};
