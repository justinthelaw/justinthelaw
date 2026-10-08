/** Unselected comparative native memory only. Actor construction, geometry,
 * native pointer observers, current resources and complete save admission have
 * distinct future owners. No caller may infer an old slot from final actors.
 * @typedef {import('../contracts.js').ActorId} ActorId
 * @typedef {import('../contracts.js').IdSequence} Sequence
 * @typedef {import('./campaign.js').SpeciesForm} Identity
 * @typedef {{side:'team'|'wild',slot:number}} NativeSlotRef
 * @typedef {{transactionId:import('../contracts.js').TransactionId,commitRevision:number,beforeIdSequence:Sequence}} NativeSlotOperation
 * @typedef {{sessionId:import('../contracts.js').SessionId,mapId:import('../contracts.js').MapId,floorId:string,generationTransactionId:import('../contracts.js').TransactionId,createdRevision:number}} NativeSlotFloorOwner
 * @typedef {{entity:number[],info:number[],infoPointer:NativeSlotRef|null,spritePointer:{nativeSpeciesId:number}|null,aiTargetPointer:NativeSlotRef|null,actorId:ActorId|null,conversionSlot:number|null}} NativeSlotCell
 * @typedef {{pokemonId:import('../contracts.js').PokemonId,identity:Identity,nativeRecruitedId:number,conversionSlot:number,bodySize:number}} NativeEntryMember
 * @typedef {{kind:'retained-escort'|'prospective-source-seed',policyId:string,adoptedRevision:number}} NativeGeneralOrigin
 * @typedef {{factsId:string,source:typeof import('../../content/authored/sinister-native-slot-facts.js').SINISTER_NATIVE_SLOT_FACTS,owner:{sessionId:import('../contracts.js').SessionId,transactionId:import('../contracts.js').TransactionId,entryRevision:number},mapping:ReturnType<typeof import('../domain/gameplay/sinister-roster-mapping.js').prepareSinisterRosterMapping>,run:ReturnType<typeof import('../domain/gameplay/sinister-run-preparation.js').prepareSinisterRun>,members:NativeEntryMember[],operation:NativeSlotOperation,afterIdSequence:Sequence,generalOrigin:NativeGeneralOrigin}} NativeSlotCreation
 * @typedef {{side:'team',conversionSlot:number}|{side:'wild',identity:Identity}} NativeSlotRequest
 * @typedef {{kind:'floor-reset',operation:NativeSlotOperation,owner:NativeSlotFloorOwner,floorSeed:ReturnType<typeof import('../domain/gameplay/sinister-run-preparation.js').prepareSinisterFloorSeed>}|{kind:'allocated',operation:NativeSlotOperation,request:NativeSlotRequest,slot:NativeSlotRef,actorId:ActorId,nativeGeneration:number,bodyStart:number,bodySize:number}} NativeSlotReceipt
 * @typedef {{kind:'sinister-native-slot-memory-v1',factsId:string,creation:NativeSlotCreation,preseed:import('../domain/gameplay/sinister-run-preparation.js').Preseed,floor:NativeSlotFloorOwner|null,team:NativeSlotCell[],wild:NativeSlotCell[],active:(NativeSlotRef|null)[],teamBody:number[],wildBody:number[],leader:NativeSlotRef|null,generation:number,spriteGeneration:number,idSequence:Sequence,operations:NativeSlotReceipt[]}} SinisterNativeSlotMemory
 */
export {};
