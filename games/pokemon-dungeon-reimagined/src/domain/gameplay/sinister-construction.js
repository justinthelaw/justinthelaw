import { prepareSinisterRosterMapping } from './sinister-roster-mapping.js';
import { prepareSinisterRun,prepareSinisterFloorSeed } from './sinister-run-preparation.js';
import { prepareSinisterNativeSlotMemory,prepareSinisterNativeFloorReset } from './sinister-native-slots.js';
import { createProspectiveNativeGeneralRandom } from './native-escort-entry.js';
import { ESCORT_GENERAL_POLICY } from './escort-entry-owner.js';
import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { fingerprint } from '../state/relations.js';
import { allocateId,instanceId } from '../ids.js';

/** Private, fresh-run construction owner. This composes authenticated predecessor
 * admission, source mapping, conversion draws, real native memory and source
 * zeroed geometry before exposing a snapshot. There is intentionally no public
 * journal-import or arbitrary observer/slot/stream replacement path.
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Campaign
 * @typedef {import('../../contracts/sinister-native-slots.js').NativeSlotOperation} Operation
 * @typedef {import('../../contracts/sinister-native-geometry.js').NativeGeometryObserver} Geometry
 * @typedef {import('../../contracts/sinister-construction.js').SinisterConstructionSnapshot} Snapshot
 * @typedef {import('./support.js').Catalogs} Catalogs
 */
const AUTHORITY_LIMITS=Object.freeze({maxDepth:3,maxNodes:16,maxArrayLength:1,maxObjectKeys:3,maxStringLength:48,maxTextLength:256});
/** Whole-Dungeon zeroing at this actual RunDungeon creation only. A later floor
 * retains this observer until a genuine layout operation writes it. Room0 here
 * is an actual zero byte, not ResetTile's later corridor255 value.
 * @returns {Geometry} */
function zeroGeometry() {
  return {width:56,height:32,roomCount:0,
    tiles:Array.from({length:32},() => Array.from({length:56},() => ({terrainFlags:0,spawnOrVisibilityFlags:0,room:0,unk8:0,unkE:0,walkableNeighborFlags:[0,0,0,0],monster:null,object:null}))),
    roomData:Array.from({length:32},() => ({active:0,explored:0,bottomRightX:0,bottomRightZ:0,topLeftX:0,topLeftZ:0,pixelBounds:[0,0,0,0]})),
    junctions:Array.from({length:32},() => ({count:0,positions:Array.from({length:32},() => ({x:0,z:0}))})),
  };
}
/** @param {unknown} authority @param {Campaign} predecessor @returns {Operation} */
function entryOperation(authority,predecessor) {
  const raw=/** @type {Operation} */ (/** @type {unknown} */ (copyPlainData(authority,AUTHORITY_LIMITS)));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).sort().join(',') !== 'beforeIdSequence,commitRevision,transactionId' || !Number.isSafeInteger(raw.commitRevision) || raw.commitRevision !== predecessor.revision+1 || !raw.beforeIdSequence || typeof raw.beforeIdSequence !== 'object' || Object.keys(raw.beforeIdSequence).join(',') !== 'next' || fingerprint(raw.beforeIdSequence) !== fingerprint(predecessor.idSequence)) throw new TypeError('Actual next Adventure transaction authority must own construction.');
  instanceId('transaction',raw.transactionId);
  return raw;
}
/** Full canonical predecessor budget stays separate from the small authority.
 * The complete existing mapper independently admits the actual v24 MAIN5,9
 * predecessor before reading its stream or constructing any new owner.
 * @param {unknown} predecessor @param {Catalogs} catalogs @param {unknown} authority */
export function createSinisterConstruction(predecessor,catalogs,authority) {
  const before=/** @type {Campaign} */ (/** @type {unknown} */ (copyPlainData(predecessor)));
  const mapping=prepareSinisterRosterMapping(before,catalogs),operation=entryOperation(authority,before);
  const transaction=allocateId(before.idSequence,'transaction',new Set()),session=allocateId(transaction.sequence,'session',new Set());
  if (transaction.id !== operation.transactionId) throw new TypeError('The actual allocated transaction must own the new source run.');
  const runtime=before.escortRuntime;
  if (runtime === undefined || runtime !== null && runtime.policyId !== ESCORT_GENERAL_POLICY) throw new TypeError('An actual retained general stream or explicit first adoption is required.');
  const generalRandom=runtime === null ? createProspectiveNativeGeneralRandom() : runtime.generalRandom;
  const run=prepareSinisterRun({owner:{sessionId:session.id,transactionId:transaction.id,entryRevision:operation.commitRevision},generalRandom,teamSlots:mapping.teamSlots});
  const memory=prepareSinisterNativeSlotMemory({predecessor:before,mapping,run,operation},catalogs,operation);
  /** @type {Snapshot} */ let current=freezeData({kind:/** @type {const} */ ('sinister-construction-v1'),phase:/** @type {const} */ ('new-run'),memory,geometry:zeroGeometry(),journal:[]});
  let disposed=false;
  return Object.freeze({
    /** This immutable snapshot is the only accepted continuation token. */
    getSnapshot() { return current; },
    /** Produce the first floor's actual map/cursor, native floor seed and slot
     * reset projection. No browser RNG is reseeded, no temporary actor is
     * allocated, and no absent layout/cache history is inferred. The existing
     * native slot helper includes separated source reset writes; this journal
     * names that projection rather than claiming a contiguous native call PC.
     * @param {Snapshot} expected */
    beginFirstFloor(expected) {
      if (disposed || expected !== current || current.phase !== 'new-run') throw new TypeError('A current fresh construction token is required.');
      const map=allocateId(current.memory.idSequence,'map',new Set());
      const floorSeed=prepareSinisterFloorSeed(current.memory.preseed);
      const floorOperation={transactionId:operation.transactionId,commitRevision:operation.commitRevision,beforeIdSequence:map.sequence};
      const owner={sessionId:session.id,mapId:map.id,floorId:'sinister-woods-floor-01',generationTransactionId:operation.transactionId,createdRevision:operation.commitRevision};
      const nextMemory=prepareSinisterNativeFloorReset({memory:current.memory,operation:floorOperation,owner,floorSeed},floorOperation,catalogs);
      const receipt={kind:/** @type {const} */ ('first-floor-prefix'),owner,mapAllocation:{beforeIdSequence:current.memory.idSequence,mapId:map.id,afterIdSequence:map.sequence},floorSeed};
      const next=freezeData({kind:/** @type {const} */ ('sinister-construction-v1'),phase:/** @type {const} */ ('floor-prefix-ready'),memory:nextMemory,geometry:current.geometry,journal:[receipt]});
      current=next; return current;
    },
    /** Discarding a prospective owner never changes the admitted predecessor. */
    dispose() { disposed=true; },
  });
}
