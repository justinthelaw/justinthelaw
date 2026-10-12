/** Primitive types shared by the scoped opening helpers; no campaign graph. */
/** @typedef {{[key:string]:JsonValue}} JsonObject */
/** @typedef {Array<JsonValue>} JsonArray */
/** @typedef {null|boolean|number|string|JsonArray|JsonObject} JsonValue */
/** @typedef {readonly [number,number,number,number]} RandomWords */
/** @typedef {{readonly algorithm:'xoshiro128ss-v1',readonly words:RandomWords,readonly draws:number}} XoshiroRandomState */
/** @typedef {{readonly algorithm:'pmd-dungeon-lcg-v1',readonly state:number,readonly preseed:number,readonly draws:number,readonly floors:number}} DungeonLcgRandomState */
/** @typedef {XoshiroRandomState|DungeonLcgRandomState} RandomState */
export {};
