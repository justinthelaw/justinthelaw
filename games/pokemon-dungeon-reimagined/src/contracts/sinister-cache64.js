/** Unselected prospective cache64 shapes. These are not canonical save shapes.
 * A complete successor must authenticate the actual private generation/lookup
 * transaction and retain its receipts before selecting any of these owners.
 * @typedef {import('../domain/rng.js').RandomState} RandomState
 * @typedef {{path:string,sha256:string}} SourcePin
 * @typedef {{sessionId:string,mapId:string,floorId:string,generationTransactionId:string,createdRevision:number}} CacheOwner
 * @typedef {{factsId:string,commit:string,qualification:string,sourceFiles:SourcePin[]}} LifecycleSource
 * @typedef {{transactionId:string,revision:number}} CacheOperation
 * @typedef {{owner:CacheOwner,random:RandomState}} GenerationAuthority
 * @typedef {{owner:CacheOwner,operation:CacheOperation,random:RandomState}} LookupAuthority
 * @typedef {{nativeSpeciesId:number,level:number}} CacheRequest
 * @typedef {{nativeMoveId:number,moveId:string|null,basePp:number}} CacheMove
 * @typedef {{hp:number,attack:number,specialAttack:number,defense:number,specialDefense:number}} NaturalStats
 * @typedef {{candidateIndex:number,slot:number,beforeRandom:RandomState,afterRandom:RandomState}} CacheReplacement
 * @typedef {{operation:CacheOperation,request:CacheRequest,beforeRandom:RandomState,afterRandom:RandomState,replacements:CacheReplacement[]}} MissOrigin
 * @typedef {{nativeSpeciesId:number,level:number,moves:(CacheMove|null)[],stats:NaturalStats}} CacheRow
 * @typedef {{nativeSpeciesId:0}} EmptyCacheEntry
 * @typedef {{kind:'pre-cache',rowIndex:number}|{kind:'miss',receipt:MissOrigin}} CacheOrigin
 * @typedef {CacheRow & {origin:CacheOrigin}} FilledCacheEntry
 * @typedef {EmptyCacheEntry|FilledCacheEntry} CacheEntry
 * @typedef {ReturnType<import('../domain/gameplay/sinister-floor-cache.js').prepareSinisterFloorCache>} FloorPreparation
 * @typedef {{kind:'sinister-cache64-prepared',owner:CacheOwner,lifecycleSource:LifecycleSource,generation:FloorPreparation,entries:CacheEntry[],expYieldRankings:number[]}} SinisterCache64
 * @typedef {{kind:'sinister-cache64-lookup',owner:CacheOwner,lifecycleSource:LifecycleSource,operation:CacheOperation,request:CacheRequest,mode:'hit'|'append'|'full',index:number|null,beforeRandom:RandomState,afterRandom:RandomState,replacements:CacheReplacement[],row:CacheRow}} CacheLookupReceipt
 * @typedef {{exists:false}|{exists:true,enabled:true,nativeMoveId:number,moveId:string|null,basePp:number,currentPp:number,ginseng:0,moveFlags2:0}} NativeMutableMove
 * @typedef {{moves:NativeMutableMove[],struggleMoveFlags:0,stats:NaturalStats,counters:{bellyEmpty:false,usedLinkedMovesCounter:0,turnsSinceWarpScarfActivation:0}}} CacheRecipient
 * @typedef {{cache:SinisterCache64,receipt:CacheLookupReceipt,recipient:CacheRecipient}} CacheLookupResult
 */
export {};
