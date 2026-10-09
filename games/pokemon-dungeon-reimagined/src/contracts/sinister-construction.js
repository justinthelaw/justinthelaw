/** Fresh private construction snapshots only, not a save-admission schema.
 * @typedef {{kind:'first-floor-prefix',owner:import('./sinister-native-slots.js').NativeSlotFloorOwner,mapAllocation:{beforeIdSequence:import('../contracts.js').IdSequence,mapId:import('../contracts.js').MapId,afterIdSequence:import('../contracts.js').IdSequence},floorSeed:ReturnType<typeof import('../domain/gameplay/sinister-run-preparation.js').prepareSinisterFloorSeed>}} SinisterConstructionFloorReceipt
 * @typedef {{kind:'sinister-construction-v1',phase:'new-run'|'floor-prefix-ready',memory:import('./sinister-native-slots.js').SinisterNativeSlotMemory,geometry:import('./sinister-native-geometry.js').NativeGeometryObserver,journal:SinisterConstructionFloorReceipt[]}} SinisterConstructionSnapshot
 */
export {};
