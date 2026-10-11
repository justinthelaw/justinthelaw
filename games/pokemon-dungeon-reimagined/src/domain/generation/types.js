/** Transient opening generation records; no campaign/materialization types. */
/** @typedef {{readonly x:number,readonly z:number}} Position */
/** @typedef {import('../shared-types.js').RandomState} RandomState */
/** Original factual parameter fields retained for exact Tiny Woods admission. */
/** @typedef {{allowDeadEnds: number, bgMusic: number, buriedItemDensity: number, enemyDensity: number, fixedRoomNumber: number, floorConnectivity: number, itemDensity: number, itemStickyChance: number, itemlessMonsterHouseChance: number, kecleonShopChance: number, kecleonShopLayout: number, layout: number, mazeRoomChance: number, moneyUpperBound: number, monsterHouseChance: number, numExtraHallways: number, roomDensity: number, roomFlags: number, secondaryStructuresBudget: number, standaloneLakeDensity: number, storedFloorNumber: number, tileset: number, trapDensity: number, unused0E: number, unused1A: number, unused1B: number, visibilityRange: number, weather: number}} Parameters */
/** @typedef {{x:number,z:number,width:number,height:number}} Bounds */
/** @typedef {{terrain:'wall'|'floor',impassable:boolean,room:number|null,junction:boolean}} Cell */
/** @typedef {{index:number,bounds:Bounds,merged:boolean}} Room */
/** @typedef {{x:number,z:number,valid:boolean,room:boolean,bounds:Bounds|null,roomIndex:number|null,edges:Set<number>,absorbed:boolean}} GridCell */
/** @typedef {{cells:Cell[][],rooms:Room[]}} Geometry */
export {};
