/** Unselected comparative native geometry projection, not canonical save data.
 * Pointer strings identify actual retained native cells; their authentication,
 * layout writes and ordered call history belong to the future constructor.
 * @typedef {{x:number,z:number}} NativeGeometryPosition
 * @typedef {{terrainFlags:number,spawnOrVisibilityFlags:number,room:number,unk8:number,unkE:number,walkableNeighborFlags:number[],monster:string|null,object:string|null}} NativeGeometryTile
 * @typedef {{active:number,explored:number,bottomRightX:number,bottomRightZ:number,topLeftX:number,topLeftZ:number,pixelBounds:number[]}} NativeGeometryRoom
 * @typedef {{count:number,positions:NativeGeometryPosition[]}} NativeGeometryJunctions
 * @typedef {{width:56,height:32,tiles:NativeGeometryTile[][],roomData:NativeGeometryRoom[],junctions:NativeGeometryJunctions[],roomCount:number}} NativeGeometryObserver
 * @typedef {'reset-floor-tiles'|'finalize-junctions'|'rebuild-room-bounds'|'rebuild-neighbor-masks'} NativeGeometryOperation
 * @typedef {{sessionId:import('../contracts.js').SessionId,mapId:import('../contracts.js').MapId,transactionId:import('../contracts.js').TransactionId,revision:number,ordinal:number}} NativeGeometryOwner
 * @typedef {{kind:'sinister-native-geometry-input',owner:NativeGeometryOwner,operation:NativeGeometryOperation,before:NativeGeometryObserver}} NativeGeometryInput
 * @typedef {{kind:'sinister-native-geometry-prepared',owner:NativeGeometryOwner,operation:NativeGeometryOperation,before:NativeGeometryObserver,after:NativeGeometryObserver}} NativeGeometryPrepared
 */
export {};
