/** @template T @typedef {T extends string|number|boolean|null|undefined ? T : T extends readonly unknown[] ? {readonly [K in keyof T]:ReadonlyData<T[K]>} : T extends object ? {readonly [K in keyof T]:ReadonlyData<T[K]>} : T} ReadonlyData */
/** @typedef {'wall'|'floor'|'water'|'lava'|'void'} TerrainKind */
/** @typedef {{id:string,kind:TerrainKind,impassable:boolean,door:boolean,revealedTerrainId:string|null}} TerrainDefinition */
/** @typedef {{internalId:number,speciesId:string|null,formId:string|null,movementType:number,canMove:boolean,baseMovementSpeed:number}} MobilityRecord */
/** @typedef {{speciesId:string|null,formId:string|null,internalId:number,behavior:string,count:number}} FixedActorRole */
/** @typedef {{index:number,id:string,width:number,height:number,kind:'sentinel'|'floorwide'|'embedded'|'unused',canonical:boolean,playerAnchors:number,stairs:number,doors:number,access:'floor'|'liquid'|'wall',rewardItemId:string|null,roles:FixedActorRole[],sceneOnly:boolean,hasLiquid:boolean,hasVoid:boolean,sourceSymbol:string|null}} FixedDefinition */
/** @typedef {{schemaVersion:1,catalogId:'original-blue-navigation',mobility:MobilityRecord[],terrain:TerrainDefinition[],fixed:FixedDefinition[],tilesetLiquid:('none'|'water'|'lava')[],shopChances:number[][][],source:{commit:string,qualification:string,corpusSha256:string}}} NavigationData */
/** @typedef {{mobility:(speciesId:string,formId:string|null)=>ReadonlyData<MobilityRecord>,terrain:(id:string)=>ReadonlyData<TerrainDefinition>,fixed:(index:number)=>ReadonlyData<FixedDefinition>,liquid:(tileset:number)=>'none'|'water'|'lava',shopChances:(index:number)=>readonly (readonly number[])[],terrainIds:readonly string[],definitionIds:readonly string[],source:ReadonlyData<NavigationData['source']>,dispose:()=>void}} NavigationCatalog */
/** @typedef {Readonly<{isSpeciesForm:(speciesId:string,formId:string|null)=>boolean,isItemId:(id:string)=>boolean,fetchResource?:typeof fetch}>} NavigationDependencies */
export {};
