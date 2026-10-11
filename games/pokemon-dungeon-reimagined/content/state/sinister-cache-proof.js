import { SINISTER_CACHE_FACTS as FACTS } from '../authored/sinister-cache-facts.js';
import { prepareSinisterFloorCache } from '../../src/domain/gameplay/sinister-floor-cache.js';
import { escortDungeonRandomInteger } from '../../src/domain/escort-dungeon-rng.js';
import { copyPlainData } from '../../src/domain/state/plain.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { instanceId } from '../../src/domain/ids.js';
import { diagnostics, bounded } from './pokemon-rules.js';

/** Detached receipt inspection budget, not a native cache/allocation capacity.
 * The accepted preparation has at most32 ordered rows/candidates and16 draws.
 * @typedef {import('../../src/contracts.js').JsonValue} JsonValue */
const RECEIPT_LIMITS = Object.freeze({ maxDepth:8,maxNodes:8192,maxArrayLength:32,maxObjectKeys:32,maxStringLength:160,maxTextLength:131072 });

/** The bounded copier detaches aliases and rejects getters, cycles/hidden keys.
 * @param {unknown} value @param {string} keys @returns {Record<string,JsonValue>} */
function exactRecord(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Invalid exact Sinister cache receipt record.');
  return /** @type {Record<string,JsonValue>} */ (value);
}

/** An allocated-range identity is necessary, not proof of its past allocation.
 * @param {unknown} value @param {'session'|'map'|'transaction'} kind @param {number} next */
function allocatedId(value,kind,next) {
  const id = instanceId(kind,value),sequence = Number(id.slice(kind.length+1));
  return bounded(next,1,Number.MAX_SAFE_INTEGER) && sequence < next;
}

/** Qualifies a separately supplied accepted preparation against the real current
 * session/floor and exact immutable source facts. Replay consumes only detached
 * receipt input: no state RNG, current-stream equality or historical draw offset.
 * Allocation/revision ranges do not prove actual generation, spawn or restore
 * history. The future generation owner must supply and retain its genuine receipt;
 * this check neither stores a cache nor admits an old save into that successor.
 * @param {import('../../src/contracts/campaign.js').CampaignState} state
 * @param {unknown} receipt
 * @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {import('../../src/contracts/campaign.js').RuleCheck} */
export function checkSinisterCacheReceipt(state,receipt,catalogs) {
  const r = diagnostics();
  try {
    const raw = exactRecord(copyPlainData(receipt,RECEIPT_LIMITS),'afterRandom,beforeRandom,browserRandomMapping,encounterPoolId,factsId,kind,nativeTableIndex,owner,replacements,rows,source');
    const owner = exactRecord(raw.owner,'createdRevision,floorId,generationTransactionId,mapId,sessionId');
    if (!Array.isArray(raw.rows) || raw.rows.length > FACTS.maxFloorRows || !Array.isArray(raw.replacements) || raw.replacements.length > 16) throw new TypeError('Oversized Sinister cache row/replacement receipt.');
    for (const row of raw.rows) exactRecord(row,'afterRandom,baseMovementSpeed,beforeRandom,bodySize,candidates,cumulativeWeight,evidence,formId,identityClass,level,levelEvidence,mobility,moves,nativeAbilities,nativeChanceAsleep,nativeSpeciesId,nativeTypes,nativeWild,order,publishedWeight,replacementDrawCount,speciesId,stats,usedEmptyFallback');
    for (const replacement of raw.replacements) exactRecord(replacement,'afterRandom,beforeRandom,candidateIndex,rowIndex,slot');
    const session = state.session;
    if (!session || !['exploration','boss'].includes(session.floor.location.kind)) {
      r.check(false,'/session/floor','A Sinister cache receipt requires an actual addressed current expedition floor.');
      return r.result();
    }
    const floor = session.floor;
    if (floor.location.kind !== 'exploration' && floor.location.kind !== 'boss') throw new TypeError('Unaddressed Sinister floor.');
    const address = floor.location.address;
    const factual = catalogs.dungeons.getFloorById(address.floorId);
    const fact = FACTS.floorFacts.find(row => row.floorId === address.floorId);
    const pool = catalogs.dungeons.getEncounterPool(factual.encounterPoolId);
    r.check(fact && factual.id === address.floorId && factual.dungeonId === 'sinister-woods' && session.dungeonId === factual.dungeonId && address.dungeonId === factual.dungeonId && address.sectionId === factual.sectionId && factual.localFloor === fact.localFloor,'/session/floor/location','The actual addressed session floor must join the qualified Sinister source floor.');
    r.check(fact && pool.id === fact.encounterPoolId && pool.sourceIndices.length === 1 && pool.sourceIndices[0] === fact.nativeTableIndex && pool.rows.length === fact.rows.length,'/session/floor/location','The real floor encounter pool must retain its complete ordered native table, including zero-weight rows.');
    r.check(owner.sessionId === session.sessionId && session.entry.sessionId === session.sessionId && owner.mapId === floor.mapId && owner.floorId === address.floorId,'/sinisterCache/owner','Receipt ownership must match the actual session, current generated map and addressed floor.');
    const createdRevision = owner.createdRevision;
    if (typeof createdRevision !== 'number') throw new TypeError('Invalid Sinister cache creation revision.');
    r.check(bounded(state.revision,1,Number.MAX_SAFE_INTEGER) && bounded(session.entry.entryRevision,1,state.revision) && bounded(createdRevision,1,Number.MAX_SAFE_INTEGER) && createdRevision >= session.entry.entryRevision && createdRevision <= state.revision,'/sinisterCache/owner/createdRevision','Cache creation must lie within the genuine current expedition revision range.');
    r.check(allocatedId(owner.sessionId,'session',state.idSequence.next) && allocatedId(owner.mapId,'map',state.idSequence.next) && allocatedId(owner.generationTransactionId,'transaction',state.idSequence.next),'/sinisterCache/owner','Every receipt identity must have its exact kind and lie below the current allocation mark.');
    const joined = r.result();
    if (!joined.ok) return joined;
    const replayed = prepareSinisterFloorCache({ owner,source:raw.source,random:raw.beforeRandom,
      rows:pool.rows.map(row => ({ order:row.order,nativeSpeciesId:row.sourceMonsterIndex,level:row.level,publishedWeight:row.publishedWeight,cumulativeWeight:row.cumulativeWeight })),
    },escortDungeonRandomInteger);
    // Full equality also rejects every nested extra/missing field, altered source
    // pin, candidate/stat/move/PP fact, per-row stream or replacement observation.
    r.check(fingerprint(raw) === fingerprint(replayed),'/sinisterCache','The entire receipt must equal the accepted full ordered cache preparation and detached replacement RNG replay.');
  } catch {
    r.check(false,'/sinisterCache','Sinister cache receipt or actual floor/source join is not bounded, exact and replayable.');
  }
  return r.result();
}
