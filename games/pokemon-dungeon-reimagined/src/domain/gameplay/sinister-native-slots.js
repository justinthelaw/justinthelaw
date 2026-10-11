import { SINISTER_NATIVE_SLOT_FACTS as FACTS } from '../../../content/authored/sinister-native-slot-facts.js';
import { SINISTER_ABILITY_DOMAIN_FACTS as DOMAIN } from '../../../content/authored/sinister-ability-domain-facts.js';
import { SINISTER_ROSTER_MAPPING_FACTS as MAPPING } from '../../../content/authored/sinister-roster-facts.js';
import { FRIEND_AREA_FACTS } from '../../../content/authored/friend-area-facts.js';
import { prepareSinisterRosterMapping } from './sinister-roster-mapping.js';
import { prepareSinisterRun,prepareSinisterFloorSeed } from './sinister-run-preparation.js';
import { createProspectiveNativeGeneralRandom } from './native-escort-entry.js';
import { ESCORT_GENERAL_POLICY } from './escort-entry-owner.js';
import { escortGeneralStateProblem } from '../state/escort-runtime-proof.js';
import { allocateId,instanceId } from '../ids.js';
import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { fingerprint } from '../state/relations.js';
/** @typedef {import('../../contracts/sinister-native-slots.js').SinisterNativeSlotMemory} Memory
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotCell} Cell
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotCreation} Creation
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotOperation} Operation
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotFloorOwner} FloorOwner
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotRequest} Request
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotReceipt} Receipt
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotRef} Ref
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeEntryMember} Member
 * @typedef {import('../../contracts/campaign.js').SpeciesForm} Identity
 * @typedef {import('./support.js').Catalogs} Catalogs */
const LIMITS = Object.freeze({maxDepth:24,maxNodes:262144,maxArrayLength:4096,maxObjectKeys:4096,maxStringLength:4096,maxTextLength:4194304});
/** @template T @param {T} value @returns {T} */
const clone = value => /** @type {T} */ (/** @type {unknown} */ (copyPlainData(value,LIMITS)));
/** @param {unknown} value @param {string} keys @returns {Record<string,import('../../contracts.js').JsonValue>} */
function exact(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Exact unselected native slot record required.');
  return /** @type {Record<string,import('../../contracts.js').JsonValue>} */ (value);
}
/** The complete predecessor keeps its established canonical plain-data budget.
 * Copy each envelope field from its own descriptor, without evaluating getters
 * or charging new entry metadata against the predecessor's original budget.
 * Native memory/preparation records retain the smaller scoped budget.
 * @param {unknown} input @returns {Record<string,import('../../contracts.js').JsonValue>} */
function entryInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Exact source entry envelope required.');
  const prototype=Object.getPrototypeOf(input),keys=Reflect.ownKeys(input);
  if (prototype !== Object.prototype && prototype !== null || keys.some(key => typeof key !== 'string') || keys.sort().join(',') !== 'mapping,operation,predecessor,run') throw new TypeError('Ordinary exact source entry envelope required.');
  /** @type {Record<string,import('../../contracts.js').JsonValue>} */ const row=Object.create(null);
  for (const key of /** @type {string[]} */ (keys)) {
    const descriptor=Object.getOwnPropertyDescriptor(input,key);
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor,'value')) throw new TypeError('Source entry envelope cannot contain accessors or hidden fields.');
    row[key]=key === 'predecessor' ? copyPlainData(descriptor.value) : copyPlainData(descriptor.value,LIMITS);
  }
  return row;
}
/** @param {unknown} value @param {number} min @param {number} max */
function integer(value,min,max) { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new TypeError('Native slot integer is outside its actual source domain.'); return value; }
/** @param {unknown} value */
function sequence(value) { const row=exact(value,'next'); return {next:integer(row.next,1,Number.MAX_SAFE_INTEGER-1)}; }
/** @param {unknown} value @returns {Operation} */
function operationRecord(value) { const row=exact(value,'beforeIdSequence,commitRevision,transactionId'); return {transactionId:instanceId('transaction',row.transactionId),commitRevision:integer(row.commitRevision,1,Number.MAX_SAFE_INTEGER),beforeIdSequence:sequence(row.beforeIdSequence)}; }
/** The genuine Adventure private caller supplies authority separately. Detached
 * equality is a necessary source join, never proof that a public record came
 * from that caller. The full factory must retain actual transaction history.
 * @param {unknown} value @param {unknown} authority @returns {Operation} */
function qualifiedOperation(value,authority) { const operation=operationRecord(value),actual=operationRecord(clone(authority)); if (fingerprint(operation) !== fingerprint(actual)) throw new TypeError('Actual private transaction authority required.'); return operation; }
/** @param {number[]} bytes @param {number} offset @param {number} width @param {number} value */
function writeScalar(bytes,offset,width,value) { for (let index=0;index<width;index++) bytes[offset+index]=Math.floor(value/2**(index*8))&255; }
/** @param {number[]} bytes @param {number} offset @param {number} width */
function readScalar(bytes,offset,width) { let value=0; for (let index=0;index<width;index++) value+=(bytes[offset+index] ?? 0)*2**(index*8); return value; }
/** Whole-Dungeon source zeroing applies only at this genuine new-run creation.
 * The slot bytes are preserved afterward; no later floor calls this helper.
 * @returns {Cell} */
function zeroCell() { return {entity:Array(FACTS.scalarSizes.entity).fill(0),info:Array(FACTS.scalarSizes.info).fill(0),infoPointer:null,spritePointer:null,aiTargetPointer:null,actorId:null,conversionSlot:null}; }
/** @param {Creation} creation @returns {Memory} */
function initialMemory(creation) { return {kind:'sinister-native-slot-memory-v1',factsId:FACTS.id,creation:clone(creation),preseed:clone(creation.run.preseed),floor:null,team:Array.from({length:FACTS.capacities.teamSlots},zeroCell),wild:Array.from({length:FACTS.capacities.wildSlots},zeroCell),active:Array(FACTS.capacities.activeSlots).fill(null),teamBody:Array(FACTS.capacities.teamBody).fill(0),wildBody:Array(FACTS.capacities.wildBody).fill(0),leader:null,generation:0,spriteGeneration:0,idSequence:clone(creation.afterIdSequence),operations:[]}; }
/** @param {Memory} memory @param {Operation} operation */
function chronological(memory,operation) {
  const previous=memory.operations.at(-1)?.operation ?? memory.creation.operation;
  if (operation.commitRevision < previous.commitRevision || operation.commitRevision === previous.commitRevision && operation.transactionId !== previous.transactionId || operation.beforeIdSequence.next < memory.idSequence.next || Number(operation.transactionId.slice('transaction:'.length)) >= operation.beforeIdSequence.next) throw new TypeError('Actual ordered transaction and ID cursor must precede native work.');
  if (memory.operations.length >= FACTS.maxOperations) throw new TypeError('This bounded source initialization/allocation tranche requires a newly qualified lifecycle extension.');
}
/** Ordered pointer scan, independent of HP or intended party leader/order.
 * @param {Memory} memory */
function rebuildActive(memory) {
  /** @type {(Ref|null)[]} */ const active=[];
  for (const side of /** @type {const} */ (['team','wild'])) for (let slot=0;slot<memory[side].length;slot++) if (readScalar(memory[side][slot]?.entity ?? [],FACTS.offsets.entity.type,4) !== 0) active.push({side,slot});
  while (active.length < FACTS.capacities.activeSlots) active.push(null);
  memory.active=active;
}
/** @param {unknown} value @param {Memory} memory @param {Operation} operation @returns {FloorOwner} */
function floorOwner(value,memory,operation) {
  const row=exact(value,'createdRevision,floorId,generationTransactionId,mapId,sessionId');
  const owner={sessionId:instanceId('session',row.sessionId),mapId:instanceId('map',row.mapId),floorId:String(row.floorId),generationTransactionId:instanceId('transaction',row.generationTransactionId),createdRevision:integer(row.createdRevision,1,Number.MAX_SAFE_INTEGER)};
  if (owner.sessionId !== memory.creation.owner.sessionId || owner.generationTransactionId !== operation.transactionId || owner.createdRevision !== operation.commitRevision || owner.floorId !== `sinister-woods-floor-${String(memory.preseed.floors+1).padStart(2,'0')}` || memory.preseed.floors >= 13) throw new TypeError('Real sequential Sinister floor generation owner required.');
  return owner;
}
/** Slot-only output of the new-floor preconstruction prefix. Source
 * sub_804513C writes type/pointers/body occupancy/active; later in that same
 * nonresume loop generation starts10 and sub_80687AC sets sprite0x400. Real
 * cache/Deoxys/layout/geometry owners must separately retain their intervening
 * operations; this helper neither samples nor certifies those operations.
 * @param {Memory} memory @param {Operation} operation @param {FloorOwner} owner
 * @param {ReturnType<typeof prepareSinisterFloorSeed>} floorSeed */
function resetFloor(memory,operation,owner,floorSeed) {
  chronological(memory,operation);
  const expected=prepareSinisterFloorSeed(memory.preseed);
  if (fingerprint(floorSeed) !== fingerprint(expected)) throw new TypeError('The genuine next floor preseed witness must precede reset.');
  const next=clone(memory);
  for (const side of /** @type {const} */ (['team','wild'])) for (const cell of next[side]) writeScalar(cell.entity,FACTS.offsets.entity.type,4,0);
  next.teamBody=Array(FACTS.capacities.teamBody).fill(0); next.wildBody=Array(FACTS.capacities.wildBody).fill(0);
  next.active = Array(FACTS.capacities.activeSlots).fill(null); next.leader = null;
  next.generation=FACTS.floorGenerationStart; next.spriteGeneration=FACTS.floorSpriteStart;
  next.preseed=clone(expected.after); next.floor=clone(owner); next.idSequence=clone(operation.beforeIdSequence);
  next.operations.push({kind:'floor-reset',operation:clone(operation),owner:clone(owner),floorSeed:clone(expected)});
  return next;
}
/** This tranche has only the actual original pair/gift and positive Sinister
 * species. No Castform/current-weather appearance is guessed. A later domain
 * needs its own actual appearance/identity constructor before allocation.
 * @param {unknown} value @param {Memory} memory @param {Catalogs} catalogs
 * @returns {{request:Request,identity:Identity,nativeSpeciesId:number,bodySize:number}} */
function requestRecord(value,memory,catalogs) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Actual native slot allocation request required.');
  const raw=/** @type {Record<string,import('../../contracts.js').JsonValue>} */ (value);
  /** @type {Request} */ let request; /** @type {Identity} */ let identity;
  if (raw.side === 'team') {
    exact(raw,'conversionSlot,side'); const conversionSlot=integer(raw.conversionSlot,0,3),member=memory.creation.members.find(row => row.conversionSlot === conversionSlot);
    if (!member || memory.team.some(cell => readScalar(cell.entity,FACTS.offsets.entity.type,4) !== 0 && cell.conversionSlot === conversionSlot)) throw new TypeError('One real selected conversion may allocate one current source team entity.');
    identity=clone(member.identity); request={side:'team',conversionSlot};
  } else {
    exact(raw,'identity,side'); if (raw.side !== 'wild') throw new TypeError('Only source team/wild arrays exist.');
    const row=exact(raw.identity,'formId,speciesId');
    if (typeof row.speciesId !== 'string' || row.formId !== null || ![...DOMAIN.wildProfiles,...DOMAIN.bossProfiles].some(id => id === row.speciesId)) throw new TypeError('A real finite Sinister hostile source identity is required.');
    identity={speciesId:/** @type {Identity['speciesId']} */ (row.speciesId),formId:null}; request={side:'wild',identity:clone(identity)};
  }
  const profile=catalogs.species.getProfile(identity.speciesId,identity.formId);
  if (profile.formId !== null || ![...DOMAIN.starterProfiles,DOMAIN.giftProfile,...DOMAIN.wildProfiles,...DOMAIN.bossProfiles].some(id => id === profile.id)) throw new TypeError('Native appearance requires the exact untransformed original scoped profile.');
  return {request,identity,nativeSpeciesId:integer(profile.internalId,1,421),bodySize:integer(profile.bodySize,1,4)};
}
/** Exact source first-free allocation only. No position, HP/moves/HiddenPower,
 * held item, AI, sleep or geometry is constructed. Canonical actor allocation
 * is a separate explicit cursor transition beside the real native slot write.
 * @param {Memory} memory @param {Operation} operation @param {Request} supplied
 * @param {Catalogs} catalogs */
function allocateNative(memory,operation,supplied,catalogs) {
  chronological(memory,operation); if (!memory.floor) throw new TypeError('The real first floor reset must precede native allocation.');
  const {request,nativeSpeciesId,bodySize}=requestRecord(supplied,memory,catalogs),occupancy=request.side === 'team' ? memory.teamBody : memory.wildBody,cells=memory[request.side];
  let bodyStart=-1;
  for (let start=0;start <= occupancy.length-bodySize;start++) { let free=true; for (let offset=0;offset<bodySize;offset++) if (occupancy[start+offset] !== 0) { free=false; break; } if (free) { bodyStart=start; break; } }
  if (bodyStart < 0) return {outcome: /** @type {const} */ ('body-capacity'),memory,receipt:null};
  const slotIndex=cells.findIndex(cell => readScalar(cell.entity,FACTS.offsets.entity.type,4) === 0);
  if (slotIndex < 0) return {outcome: /** @type {const} */ ('slots-full'),memory,receipt:null};
  const next=clone(memory),cell=next[request.side][slotIndex]; if (!cell) throw new TypeError('Actual source slot is absent.');
  const existing=new Set([...memory.team,...memory.wild].flatMap(row => row.actorId ? [row.actorId] : []));
  const allocated=allocateId(operation.beforeIdSequence,'actor',existing);
  writeScalar(cell.entity,FACTS.offsets.entity.type,4,1); writeScalar(cell.entity,FACTS.offsets.entity.slot,1,slotIndex);
  if (request.side === 'wild') writeScalar(cell.entity,FACTS.offsets.entity.unk22,1,0);
  cell.infoPointer={side:request.side,slot:slotIndex}; cell.spritePointer={nativeSpeciesId};
  writeScalar(cell.info,FACTS.offsets.info.species,2,nativeSpeciesId); writeScalar(cell.info,FACTS.offsets.info.apparentSpecies,2,nativeSpeciesId); writeScalar(cell.info,FACTS.offsets.info.isNotTeam,1,Number(request.side === 'wild'));
  writeScalar(cell.entity,FACTS.offsets.entity.animTimer,2,((bodyStart+(request.side === 'wild' ? 6 : 0))*16)+64);
  writeScalar(cell.entity,FACTS.offsets.entity.anim1,1,7); writeScalar(cell.entity,FACTS.offsets.entity.direction,1,0); writeScalar(cell.entity,FACTS.offsets.entity.anim2,1,255); writeScalar(cell.entity,FACTS.offsets.entity.orientation,1,1); writeScalar(cell.entity,FACTS.offsets.entity.spriteFlag,1,1); writeScalar(cell.entity,FACTS.offsets.entity.unk1C,4,0);
  // Source team rebuild precedes body writes; wild rebuild follows them.
  if (request.side === 'team') rebuildActive(next);
  writeScalar(cell.info,FACTS.offsets.info.bodyStart,1,bodyStart); writeScalar(cell.info,FACTS.offsets.info.bodySize,1,bodySize);
  const nextBody=request.side === 'team' ? next.teamBody : next.wildBody; for (let offset=0;offset<bodySize;offset++) nextBody[bodyStart+offset]=1;
  if (request.side === 'wild') rebuildActive(next);
  const nativeGeneration = next.generation;
  writeScalar(cell.entity,FACTS.offsets.entity.spawnGeneration,2,nativeGeneration); next.generation=(next.generation+1)&0xffff;
  cell.actorId=allocated.id; cell.conversionSlot = request.side === 'team' ? request.conversionSlot : null;
  next.idSequence=clone(allocated.sequence);
  /** @type {Receipt} */ const receipt={kind:'allocated',operation:clone(operation),request:clone(request),slot:{side:request.side,slot:slotIndex},actorId:allocated.id,nativeGeneration,bodyStart,bodySize};
  next.operations.push(receipt); return {outcome:/** @type {const} */ ('allocated'),memory:next,receipt};
}
/** Authenticate actual admitted predecessor, complete source mapping and real
 * run preparation before creating any native memory. The private caller must
 * atomically commit the returned session/cursor/run/memory; an already active
 * session and a historical import cannot use this new-run source producer.
 * @param {unknown} input @param {Catalogs} catalogs @param {unknown} authority */
export function prepareSinisterNativeSlotMemory(input,catalogs,authority) {
  const raw=entryInput(input),operation=qualifiedOperation(raw.operation,authority);
  const mapping=prepareSinisterRosterMapping(raw.predecessor,catalogs);
  const predecessor=/** @type {import('../../contracts/campaign.js').CampaignSnapshot} */ (/** @type {unknown} */ (raw.predecessor));
  if (operation.commitRevision !== mapping.mappingRevision || fingerprint(operation.beforeIdSequence) !== fingerprint(predecessor.idSequence) || fingerprint(raw.mapping) !== fingerprint(mapping)) throw new TypeError('Actual predecessor source mapping and private revision/ID authority required.');
  const entryTransaction=allocateId(predecessor.idSequence,'transaction',new Set()),sessionAllocation=allocateId(entryTransaction.sequence,'session',new Set());
  if (entryTransaction.id !== operation.transactionId) throw new TypeError('Actual prepared transaction identity must own new native memory.');
  const runtime=predecessor.escortRuntime;
  if (runtime === undefined || runtime !== null && runtime.policyId !== ESCORT_GENERAL_POLICY) throw new TypeError('The admitted predecessor must retain its exact explicit general owner or genuine unadopted null.');
  const generalRandom=runtime === null ? createProspectiveNativeGeneralRandom() : clone(runtime.generalRandom);
  const run=prepareSinisterRun({owner:{sessionId:sessionAllocation.id,transactionId:entryTransaction.id,entryRevision: operation.commitRevision},generalRandom,teamSlots:mapping.teamSlots});
  if (fingerprint(raw.run) !== fingerprint(run)) throw new TypeError('Actual complete new-run preseed/conversion receipt required.');
  /** @type {Member[]} */ const members=mapping.teamSlots.flatMap((row,conversionSlot) => { if (!row) return []; const record=predecessor.roster[row.pokemonId]; if (!record) throw new TypeError('Actual source selected member is missing.'); return [{...row,conversionSlot,identity:clone(record.identity)}]; });
  /** @type {Creation} */ const creation={factsId:FACTS.id,source:FACTS,owner:clone(run.owner),mapping:clone(mapping),run:clone(run),members,operation:clone(operation),afterIdSequence:clone(sessionAllocation.sequence),generalOrigin:{kind:runtime === null ? 'prospective-source-seed' : 'retained-escort',policyId:ESCORT_GENERAL_POLICY,adoptedRevision:runtime === null ? operation.commitRevision : runtime.adoptedRevision}};
  return freezeData(initialMemory(creation));
}
/** Exact bounded replay proves only the declared new-run/reset/allocation
 * tranche. Future construction byte writes need new authentic source owners
 * and journal variants; this reader refuses silently repaired slot data.
 * @param {unknown} input @param {Catalogs} catalogs @returns {Memory} */
export function inspectSinisterNativeSlotMemory(input,catalogs) {
  const raw=exact(clone(input),'active,creation,factsId,floor,generation,idSequence,kind,leader,operations,preseed,spriteGeneration,team,teamBody,wild,wildBody');
  const actual=/** @type {Memory} */ (/** @type {unknown} */ (raw));
  const c=exact(actual.creation,'afterIdSequence,factsId,generalOrigin,mapping,members,operation,owner,run,source');
  if (actual.kind !== 'sinister-native-slot-memory-v1' || actual.factsId !== FACTS.id || c.factsId !== FACTS.id || fingerprint(c.source) !== fingerprint(FACTS) || !Array.isArray(actual.operations) || actual.operations.length > FACTS.maxOperations) throw new TypeError('Exact source slot memory and bounded real lifecycle required.');
  const creation=actual.creation,operation=operationRecord(creation.operation),tx=allocateId(operation.beforeIdSequence,'transaction',new Set()),session=allocateId(tx.sequence,'session',new Set());
  exact(creation.owner,'entryRevision,sessionId,transactionId'); exact(creation.generalOrigin,'adoptedRevision,kind,policyId');
  if (tx.id !== operation.transactionId || session.id !== creation.owner.sessionId || creation.owner.transactionId !== tx.id || creation.owner.entryRevision !== operation.commitRevision || fingerprint(creation.afterIdSequence) !== fingerprint(session.sequence) || creation.mapping.mappingRevision !== operation.commitRevision || creation.mapping.predecessorRevision !== operation.commitRevision-1) throw new TypeError('Retained source creation lost its actual transaction/session/revision/cursor joins.');
  const run=prepareSinisterRun({owner:creation.owner,generalRandom:creation.run.beforeGeneralRandom,teamSlots:creation.mapping.teamSlots});
  const origin=creation.generalOrigin;
  const prospective=origin.kind === 'prospective-source-seed' && origin.adoptedRevision === operation.commitRevision && fingerprint(run.beforeGeneralRandom) === fingerprint(createProspectiveNativeGeneralRandom());
  const retained=origin.kind === 'retained-escort' && Number.isSafeInteger(origin.adoptedRevision) && origin.adoptedRevision >= 1 && origin.adoptedRevision < operation.commitRevision;
  if (origin.policyId !== ESCORT_GENERAL_POLICY || escortGeneralStateProblem(run.beforeGeneralRandom) || !prospective && !retained) throw new TypeError('Retained general origin requires genuine exact old adoption or explicit new source adoption without historical draws.');
  if (fingerprint(run) !== fingerprint(creation.run) || !Array.isArray(creation.members) || creation.members.length !== run.rosterConversions.length || creation.members.some((member,index) => { const converted=run.rosterConversions[index],profile=catalogs.species.getProfile(member.identity.speciesId,member.identity.formId); return !converted || member.pokemonId !== converted.pokemonId || member.conversionSlot !== converted.slot || member.nativeRecruitedId !== converted.nativeRecruitedId || member.bodySize !== converted.bodySize || member.bodySize !== profile.bodySize || member.identity.formId !== null || ![...DOMAIN.starterProfiles,DOMAIN.giftProfile].some(id => id === profile.id); })) throw new TypeError('Every actual selected conversion must retain its exact source identity/body/address and general draw receipt.');
  const mapping=creation.mapping;
  exact(mapping,'acquisitions,factsId,kind,leaderSlot,mappingRevision,predecessorRevision,selectedPartyIds,source,teamSlots');
  if (mapping.kind !== 'sinister-original-roster-mapping-prepared' || mapping.factsId !== MAPPING.id || fingerprint(mapping.source) !== fingerprint(MAPPING) || !Array.isArray(mapping.acquisitions) || mapping.acquisitions.length !== 3 || new Set(mapping.acquisitions.map(row => row.pokemonId)).size !== 3 || !Array.isArray(mapping.selectedPartyIds) || mapping.selectedPartyIds.length < 2 || mapping.selectedPartyIds.length > 3 || new Set(mapping.selectedPartyIds).size !== mapping.selectedPartyIds.length) throw new TypeError('The complete retained original mapping and genuine selected party must remain explicit.');
  const hero=mapping.acquisitions[0],partner=mapping.acquisitions[1],gift=mapping.acquisitions[2],heroMember=creation.members.find(row => row.pokemonId === hero?.pokemonId),partnerMember=creation.members.find(row => row.pokemonId === partner?.pokemonId);
  if (!hero || !partner || !gift || !heroMember || !partnerMember || mapping.selectedPartyIds[0] !== hero.pokemonId || !mapping.selectedPartyIds.includes(partner.pokemonId) || !hero.survives || !partner.survives) throw new TypeError('The actual original leader and partner remain selected genuine surviving individuals.');
  catalogs.onboarding.getPair(heroMember.identity.speciesId,partnerMember.identity.speciesId);
  let start=0; const areas=FRIEND_AREA_FACTS.map(area => { const row={...area,start}; start+=area.capacity; return row; }),occupied=new Set();
  for (const [index,acquisition] of mapping.acquisitions.entries()) {
    exact(acquisition,'friendAreaId,nativeRecruitedId,pokemonId,role,survives'); instanceId('pokemon',acquisition.pokemonId);
    const identity=index === 0 ? heroMember.identity : index === 1 ? partnerMember.identity : /** @type {Identity} */ ({speciesId:'pokemon-081',formId:null}),profile=catalogs.species.getProfile(identity.speciesId,identity.formId),area=areas.find(row => row.id === profile.friendAreaId);
    if (!area || acquisition.friendAreaId !== area.id || acquisition.role !== ['hero','partner','story-gift'][index] || typeof acquisition.survives !== 'boolean') throw new TypeError('The retained original source acquisition roles and habitats are exact.');
    let address=area.start; while (occupied.has(address) && address < area.start+area.capacity) address++;
    if (address >= area.start+area.capacity || acquisition.nativeRecruitedId !== address) throw new TypeError('The retained original address must be the actual native first-free habitat allocation.'); occupied.add(address);
  }
  const selected=creation.members.map(row => row.pokemonId);
  for (const member of creation.members) { exact(member,'bodySize,conversionSlot,identity,nativeRecruitedId,pokemonId'); exact(member.identity,'formId,speciesId'); const acquisition=mapping.acquisitions.find(row => row.pokemonId === member.pokemonId); if (!acquisition?.survives || acquisition.nativeRecruitedId !== member.nativeRecruitedId) throw new TypeError('The selected current generation retains its genuine surviving source acquisition.'); }
  /** @type {Creation['mapping']['teamSlots']} */ const slots=creation.members.map(row => ({pokemonId:row.pokemonId,nativeRecruitedId:row.nativeRecruitedId,bodySize:row.bodySize})); while (slots.length < 4) slots.push(null);
  if (fingerprint([...selected].sort()) !== fingerprint([...mapping.selectedPartyIds].sort()) || fingerprint(slots) !== fingerprint(mapping.teamSlots) || mapping.leaderSlot !== selected.indexOf(hero.pokemonId)) throw new TypeError('Native conversion order and explicit original leader conversion slot remain independent of entity allocation.');
  let expected = initialMemory(creation);
  for (const saved of actual.operations) {
    const op=operationRecord(saved.operation);
    if (saved.kind === 'floor-reset') { exact(saved,'floorSeed,kind,operation,owner'); const owner=floorOwner(saved.owner,expected,op); expected=resetFloor(expected,op,owner,saved.floorSeed); }
    else if (saved.kind === 'allocated') { exact(saved,'actorId,bodySize,bodyStart,kind,nativeGeneration,operation,request,slot'); const prepared=allocateNative(expected,op,saved.request,catalogs); if (prepared.outcome !== 'allocated' || fingerprint(prepared.receipt) !== fingerprint(saved)) throw new TypeError('Retained allocation differs from actual source first-free writes.'); expected=prepared.memory; }
    else throw new TypeError('A new source byte mutation requires an independently qualified real constructor/lifecycle variant.');
  }
  if (fingerprint(actual) !== fingerprint(expected)) throw new TypeError('Source slot memory lost genuine zeros, retained bytes, pointers, counters or operation results.');
  return expected;
}
/** Source floor reset changes no actor resources or generation history on old
 * active browser sessions. Input and output remain detached and unselected.
 * @param {unknown} input @param {unknown} authority @param {Catalogs} catalogs */
export function prepareSinisterNativeFloorReset(input,authority,catalogs) {
  const raw=exact(clone(input),'floorSeed,memory,operation,owner'),operation=qualifiedOperation(raw.operation,authority),memory=inspectSinisterNativeSlotMemory(raw.memory,catalogs),owner=floorOwner(raw.owner,memory,operation);
  const seed=/** @type {ReturnType<typeof prepareSinisterFloorSeed>} */ (/** @type {unknown} */ (raw.floorSeed));
  return freezeData(resetFloor(memory,operation,owner,seed));
}
/** Native allocation failure consumes no ID, body byte, generation or stream.
 * Real source placement admission precedes this call at the future constructor;
 * success here is not permission to expose an unconstructed actor to turns.
 * @param {unknown} input @param {unknown} authority @param {Catalogs} catalogs */
export function allocateSinisterNativeSlot(input,authority,catalogs) {
  const raw=exact(clone(input),'memory,operation,request'),operation=qualifiedOperation(raw.operation,authority),memory=inspectSinisterNativeSlotMemory(raw.memory,catalogs),request=requestRecord(raw.request,memory,catalogs).request;
  return freezeData(allocateNative(memory,operation,request,catalogs));
}
