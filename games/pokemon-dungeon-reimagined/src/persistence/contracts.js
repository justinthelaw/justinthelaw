/** Browser persistence contracts; no domain event or command types. */
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} CampaignSnapshot */
/** @typedef {import('../contracts/campaign.js').CampaignContent} CampaignContent */
/** @typedef {'invalid'|'too-large'|'unsupported-version'|'content-mismatch'|'content-blocked'|'integrity'|'crypto-unavailable'|'storage-unavailable'|'quota'|'storage-corrupt'|'conflict'|'stale'|'disposed'|'empty'|'confirmation-required'|'binding-failed'|'busy'|'superseded'|'memory-only'} ErrorCode */
/** @typedef {Readonly<{ok:false,code:ErrorCode,message:string}>} Failure */
/** @template T @typedef {Readonly<{ok:true,value:T}>|Failure} Result */
/** @typedef {Readonly<{adventureEpoch:symbol,slotId:'campaign',sourceRevision:number|null}>} RequestContext */
/** @typedef {'save'|'load'|'export'|'import'|'reset'} Operation */
/** @typedef {Readonly<{notificationId:symbol,adventureEpoch:symbol,slotId:'campaign',sourceRevision:number|null,type:'storageSucceeded'|'storageFailed',operation:Operation,message:string,errorCode?:ErrorCode}>} PersistenceNotification */
/** @typedef {Readonly<{format:'pokemon-dungeon-reimagined',envelopeVersion:1,referenceEdition:'blue-rescue-team',schemaVersion:1,contentRevision:string,revision:number,savedAt:string,state:CampaignSnapshot}>} SaveBody */
/** @typedef {Readonly<SaveBody & {integrity:Readonly<{algorithm:'SHA-256',digest:string}>}>} SaveEnvelope */
/** @typedef {Readonly<{text:string,envelope:SaveEnvelope,snapshot:CampaignSnapshot}>} EncodedSave */
/** Adapter admission is per slot; a damaged payload never hides its sibling. */
/** @typedef {Result<string|null>} StorageSlot */
/** @typedef {Readonly<{generation:number,primary:StorageSlot,backup:StorageSlot}>} StorageRecord */
/** @typedef {Readonly<{primary:string|null,backup:string|null}>} StorageCandidate */
/** @typedef {()=>boolean} CommitGuard */
/** @typedef {{read():Promise<Result<StorageRecord>>,write(expectedGeneration:number,candidate:StorageCandidate,guard:CommitGuard):Promise<Result<StorageRecord>>,remove(expectedGeneration:number,guard:CommitGuard):Promise<Result<StorageRecord>>,close():void}} StorageAdapter */
/** @typedef {Readonly<{revision:number,savedAt:string,teamName:string,mode:CampaignSnapshot['mode']}>} SavePreview */
/** @typedef {Readonly<{status:'ready',preview:SavePreview}>|Readonly<{status:'empty'}>|Readonly<{status:'unavailable',code:ErrorCode,message:string}>} SlotView */
/** @typedef {Readonly<{generation:number,primary:SlotView,backup:SlotView}>} RecoveryView */
export {};
