/** Transient opening generation records; no campaign/materialization types. */
/** @typedef {{readonly x:number,readonly z:number}} Position */
/** @typedef {import('../shared-types.js').RandomState} RandomState */
/** Original factual parameter fields; no branch is removed from called generators. */
/** @typedef {{allowDeadEnds: number, bgMusic: number, buriedItemDensity: number, enemyDensity: number, fixedRoomNumber: number, floorConnectivity: number, itemDensity: number, itemStickyChance: number, itemlessMonsterHouseChance: number, kecleonShopChance: number, kecleonShopLayout: number, layout: number, mazeRoomChance: number, moneyUpperBound: number, monsterHouseChance: number, numExtraHallways: number, roomDensity: number, roomFlags: number, secondaryStructuresBudget: number, standaloneLakeDensity: number, storedFloorNumber: number, tileset: number, trapDensity: number, unused0E: number, unused1A: number, unused1B: number, visibilityRange: number, weather: number}} Parameters */
/** @typedef {{x:number,z:number,width:number,height:number}} Bounds */
/** @typedef {{terrain:'wall'|'floor'|'water'|'lava'|'void',impassable:boolean,unbreakable:boolean,door:boolean,sealed:boolean,room:number|null,junction:boolean,shop:boolean,house:boolean,cornerCuttable:boolean,special:boolean,required:boolean}} Cell */
/** @typedef {{index:number,bounds:Bounds,kind:'ordinary'|'monster-house'|'shop'|'reward-chamber',hidden:boolean,secondary:boolean,imperfect:boolean,maze:boolean,merged:boolean,gridPosition:Position|null}} Room */
/** @typedef {{x:number,z:number,valid:boolean,room:boolean,bounds:Bounds|null,roomIndex:number|null,edges:Set<number>,absorbed:boolean}} GridCell */
/** @typedef {{cells:Cell[][],rooms:Room[],entry:Position|null,exit:Position|null,fixedRoleAnchors:Position[],reward:Position|null,keyDoor:Position|null,forceHouse:boolean,externalSecondary:boolean,protectedBounds:Bounds|null}} Geometry */
export {};
