import { SINISTER_CACHE_FACTS as PREPARATION } from '../../../content/authored/sinister-cache-facts.js';
import { SINISTER_CACHE64_FACTS as FACTS } from '../../../content/authored/sinister-cache64-facts.js';
import { prepareSinisterFloorCache } from './sinister-floor-cache.js';
import { escortDungeonRandomInteger } from '../escort-dungeon-rng.js';
import { validateRandomState } from '../rng.js';
import { instanceId } from '../ids.js';
import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { fingerprint } from '../state/relations.js';

/** @typedef {import('../../contracts/sinister-cache64.js').SinisterCache64} Cache
 * @typedef {import('../../contracts/sinister-cache64.js').CacheOwner} Owner
 * @typedef {import('../../contracts/sinister-cache64.js').CacheRow} Row
 * @typedef {import('../../contracts/sinister-cache64.js').CacheMove} Move
 * @typedef {import('../../contracts/sinister-cache64.js').CacheRequest} Request
 * @typedef {import('../../contracts/sinister-cache64.js').LifecycleSource} Source
 * @typedef {import('../../contracts/sinister-cache64.js').FloorPreparation} Generation
 * @typedef {import('../../contracts/sinister-cache64.js').CacheOperation} Operation
 * @typedef {import('../../contracts/sinister-cache64.js').CacheReplacement} Replacement
 * @typedef {import('../../contracts/sinister-cache64.js').CacheRecipient} Recipient
 * @typedef {import('../../contracts/sinister-cache64.js').MissOrigin} MissOrigin
 * @typedef {import('../rng.js').RandomState} RandomState
 * @typedef {import('../../../content/state/campaign.js').CampaignCatalogs} Catalogs
 */
// A bounded detached prospective receipt, not a new canonical save allowance.
export const SINISTER_CACHE64_LIMITS = Object.freeze({ maxDepth:12,maxNodes:65536,maxArrayLength:424,maxObjectKeys:32,maxStringLength:160,maxTextLength:524288 });

/** @param {unknown} value @param {string} keys @returns {Record<string,import('../../contracts.js').JsonValue>} */
function exact(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Invalid exact Sinister cache64 record.');
  return /** @type {Record<string,import('../../contracts.js').JsonValue>} */ (value);
}
/** @param {unknown} value @param {number} min @param {number} max */
function integer(value,min,max) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new TypeError('Invalid Sinister cache64 counter.');
  return value;
}
/** @param {unknown} value @returns {Owner} */
function owner(value) {
  const raw = exact(value,'createdRevision,floorId,generationTransactionId,mapId,sessionId');
  if (typeof raw.floorId !== 'string' || !PREPARATION.floorFacts.some(row => row.floorId === raw.floorId)) throw new TypeError('Actual Sinister cache64 floor required.');
  return {sessionId:instanceId('session',raw.sessionId),mapId:instanceId('map',raw.mapId),floorId:raw.floorId,generationTransactionId:instanceId('transaction',raw.generationTransactionId),createdRevision:integer(raw.createdRevision,1,Number.MAX_SAFE_INTEGER)};
}
/** @param {unknown} value @returns {Source} */
function lifecycleSource(value) {
  const raw = exact(value,'commit,factsId,qualification,sourceFiles');
  const expected = {factsId:FACTS.id,commit:FACTS.commit,qualification:FACTS.qualification,sourceFiles:FACTS.sourceFiles};
  if (fingerprint(raw) !== fingerprint(expected)) throw new TypeError('Exact cache64 lifecycle source pins required.');
  return {factsId:FACTS.id,commit:FACTS.commit,qualification:FACTS.qualification,sourceFiles:FACTS.sourceFiles.map(pin => ({...pin}))};
}
/** @param {unknown} value @param {Owner} cacheOwner @returns {Operation} */
function operation(value,cacheOwner) {
  const raw = exact(value,'revision,transactionId');
  return {transactionId:instanceId('transaction',raw.transactionId),revision:integer(raw.revision,cacheOwner.createdRevision,Number.MAX_SAFE_INTEGER)};
}
/** Pinned SpeciesId returns the s16 identity. Never collapse base species/forms.
 * Unsupported dummy identities are held; Decoy has only the sourced level1 case.
 * @param {unknown} value @returns {Request} */
function request(value) {
  const raw = exact(value,'level,nativeSpeciesId');
  const nativeSpeciesId = integer(raw.nativeSpeciesId,1,421),level = integer(raw.level,1,100);
  if (nativeSpeciesId === 420 || nativeSpeciesId === 421 && level !== 1) throw new TypeError('Unsupported native cache64 dummy request.');
  return {nativeSpeciesId,level};
}
/** @param {unknown} value @param {Owner} cacheOwner @param {RandomState} random */
function generationAuthority(value,cacheOwner,random) {
  const actual = exact(value,'owner,random');
  if (fingerprint(owner(actual.owner)) !== fingerprint(cacheOwner) || fingerprint(validateRandomState(actual.random)) !== fingerprint(random)) throw new TypeError('Creation must use the actual supplied generation owner and stream.');
}
/** @param {unknown} value @param {Owner} cacheOwner @param {Operation} lookup @param {RandomState} random */
function lookupAuthority(value,cacheOwner,lookup,random) {
  const actual = exact(value,'operation,owner,random');
  if (fingerprint(owner(actual.owner)) !== fingerprint(cacheOwner) || fingerprint(operation(actual.operation,cacheOwner)) !== fingerprint(lookup) || fingerprint(validateRandomState(actual.random)) !== fingerprint(random)) throw new TypeError('Lookup must use the actual supplied lifetime, private transaction and stream.');
}
/** @param {Generation['rows'][number]} value @returns {Row} */
function preparedRow(value) {
  return {nativeSpeciesId:value.nativeSpeciesId,level:value.level,moves:value.moves.map(move => move === null ? null : {...move}),stats:{...value.stats}};
}
/** Native strict-greater scan retains the first ordered row on ties. Species is
 * ranked once even if multiple native rows contain it; nonselected entries are1.
 * This table is immutable for the floor and is not reranked on a lazy miss.
 * @param {Generation} prepared */
function rankings(prepared) {
  const result = Array.from({length:FACTS.nativeMonsterMax},() => 0);
  let rank = 1;
  for (let pass = 0; pass < prepared.rows.length; pass++) {
    let bestSpecies = -1,bestExperience = -1;
    for (const row of prepared.rows) {
      const base = FACTS.baseExperienceYields[row.nativeSpeciesId];
      if (base === undefined) throw new TypeError('Missing exact native EXP yield.');
      const experience = base+Math.trunc(base*(row.level-1)/10);
      if (result[row.nativeSpeciesId] === 0 && bestExperience < experience) { bestExperience = experience; bestSpecies = row.nativeSpeciesId; }
    }
    if (bestSpecies < 0) break;
    result[bestSpecies] = rank; rank += 2;
  }
  return result.map(rank => rank === 0 ? 1 : rank);
}
/** @param {Generation} prepared @param {Source} source @returns {Cache} */
function initialCache(prepared,source) {
  /** @type {Cache['entries']} */
  const entries = prepared.rows.map(row => ({...preparedRow(row),origin:{kind:'pre-cache',rowIndex:row.order}}));
  while (entries.length < FACTS.maxNativeCacheRows) entries.push({nativeSpeciesId:0});
  return {kind:'sinister-cache64-prepared',owner:{...prepared.owner},lifecycleSource:source,generation:prepared,entries,expYieldRankings:rankings(prepared)};
}
/** Accepted preparation replay uses only its detached original before stream.
 * It cannot touch the actual current stream or invent an old draw offset.
 * @param {unknown} value @returns {Generation} */
function acceptedGeneration(value) {
  const raw = exact(value,'afterRandom,beforeRandom,browserRandomMapping,encounterPoolId,factsId,kind,nativeTableIndex,owner,replacements,rows,source');
  if (!Array.isArray(raw.rows)) throw new TypeError('Complete native preparation rows required.');
  const rows = raw.rows.map(value => {
    const row = exact(value,'afterRandom,baseMovementSpeed,beforeRandom,bodySize,candidates,cumulativeWeight,evidence,formId,identityClass,level,levelEvidence,mobility,moves,nativeAbilities,nativeChanceAsleep,nativeSpeciesId,nativeTypes,nativeWild,order,publishedWeight,replacementDrawCount,speciesId,stats,usedEmptyFallback');
    return {order:row.order,nativeSpeciesId:row.nativeSpeciesId,level:row.level,publishedWeight:row.publishedWeight,cumulativeWeight:row.cumulativeWeight};
  });
  const replayed = prepareSinisterFloorCache({owner:raw.owner,source:raw.source,rows,random:raw.beforeRandom},escortDungeonRandomInteger);
  if (fingerprint(raw) !== fingerprint(replayed)) throw new TypeError('The complete retained generation must equal its accepted detached replay.');
  return replayed;
}
/** Every complete source candidate/stats/PP join is checked before sampling.
 * Catalogs are the actual qualified catalogs already admitted by the caller.
 * No effect-support filter may discard native candidates or duplicate entries.
 * @param {Request} wanted @param {Catalogs} catalogs */
function missFacts(wanted,catalogs) {
  if (wanted.nativeSpeciesId === 421) {
    const dummy = PREPARATION.species.find(row => row.nativeSpeciesId === 421 && row.level === 1);
    if (!dummy || dummy.candidates.length !== 0) throw new TypeError('Missing explicit native Decoy facts.');
    return {stats:{...dummy.stats},candidates:/** @type {Move[]} */ ([])};
  }
  const profile = catalogs.species.getProfileByInternalId(wanted.nativeSpeciesId);
  if (profile.internalId !== wanted.nativeSpeciesId || !['blue-red-stats','red-only-levels'].includes(profile.evidence.stats ?? '') || profile.evidence.learnset !== 'blue-red-learning' || profile.experienceYield !== FACTS.baseExperienceYields[wanted.nativeSpeciesId]) throw new TypeError('Missing exact source-qualified cache miss profile.');
  const growth = catalogs.species.getGrowthAtLevel(profile.id,wanted.level),learn = catalogs.species.getLearnset(profile.id);
  if (growth.profileId !== profile.id || growth.level !== wanted.level || learn.id !== profile.learnsetResourceId) throw new TypeError('Cache miss stats/learnset must join the real profile.');
  const stats = {...growth.stats};
  integer(stats.hp,1,999);
  for (const value of [stats.attack,stats.specialAttack,stats.defense,stats.specialDefense]) integer(value,0,255);
  let priorLevel = 0;
  const candidates = learn.levelUp.flatMap(pair => {
    const learnedAt = integer(pair[0],1,100),nativeMoveId = integer(pair[1],1,394);
    if (learnedAt < priorLevel) throw new TypeError('Cache miss must retain native candidate order.');
    priorLevel = learnedAt;
    if (learnedAt > wanted.level) return [];
    const identity = catalogs.species.identities.moves.find(row => row.originalId === nativeMoveId);
    if (!identity) throw new TypeError('Unqualified native miss move identity.');
    const action = catalogs.effects.getMove(identity.id),basePp = integer(action.numeric.pp,1,99);
    if (action.internalId !== nativeMoveId) throw new TypeError('Native miss PP must join the actual source action.');
    return [{nativeMoveId,moveId:identity.id,basePp}];
  });
  if (candidates.length > 32) throw new TypeError('Cache miss source candidates exceed the qualified finite bound.');
  return {stats,candidates};
}
/** @param {Request} wanted @param {RandomState} before @param {Catalogs} catalogs @param {typeof escortDungeonRandomInteger} draw */
function sampleMiss(wanted,before,catalogs,draw) {
  const factual = missFacts(wanted,catalogs),drawCount = Math.max(0,factual.candidates.length-4);
  if (before.draws > Number.MAX_SAFE_INTEGER-drawCount) throw new RangeError('Cache miss would exhaust the supplied stream.');
  let random = before;
  /** @type {(Move|null)[]} */
  const moves = [null,null,null,null];
  /** @type {Replacement[]} */
  const replacements = [];
  for (const [candidateIndex,candidate] of factual.candidates.entries()) {
    let slot = candidateIndex;
    if (candidateIndex >= 4) {
      const prior = random,result = draw(prior,4);
      slot = integer(result.value,0,3); random = validateRandomState(result.state);
      if (random.draws !== prior.draws+1) throw new TypeError('A native replacement requires exactly one qualified browser transition.');
      replacements.push({candidateIndex,slot,beforeRandom:prior,afterRandom:random});
    }
    moves[slot] = {...candidate};
  }
  // Native lazy/full misses retain MOVE_NOTHING; only pre-cache owns Blowback.
  return {row:{...wanted,moves,stats:factual.stats},afterRandom:random,replacements};
}
/** Scan until the first species0 sentinel; a hit is exact SpeciesId+level.
 * @param {Cache['entries']} entries @param {Request} wanted */
function scan(entries,wanted) {
  for (let index = 0; index < FACTS.maxNativeCacheRows; index++) {
    const row = entries[index];
    if (!row) throw new TypeError('Complete64 native cache entries required.');
    if (row.nativeSpeciesId === 0) return {mode:/** @type {const} */ ('append'),index};
    if ('level' in row && row.nativeSpeciesId === wanted.nativeSpeciesId && row.level === wanted.level) return {mode:/** @type {const} */ ('hit'),index};
  }
  return {mode:/** @type {const} */ ('full'),index:null};
}
/** Detach and authenticate all64 entries before a live prospective lookup.
 * Replay retained generation/append receipts only. The complete factory must
 * prove actual transaction/allocation history; these data relations alone cannot.
 * @param {unknown} input @param {Catalogs} catalogs @returns {Cache} */
export function inspectSinisterCache64(input,catalogs) {
  const raw = exact(copyPlainData(input,SINISTER_CACHE64_LIMITS),'entries,expYieldRankings,generation,kind,lifecycleSource,owner');
  const cacheOwner = owner(raw.owner),source = lifecycleSource(raw.lifecycleSource),generation = acceptedGeneration(raw.generation);
  const expected = initialCache(generation,source);
  if (raw.kind !== expected.kind || fingerprint(cacheOwner) !== fingerprint(generation.owner) || !Array.isArray(raw.entries) || raw.entries.length !== FACTS.maxNativeCacheRows || fingerprint(raw.expYieldRankings) !== fingerprint(expected.expYieldRankings)) throw new TypeError('Invalid exact cache64 lifetime/capacity/EXP table.');
  let priorRevision = cacheOwner.createdRevision,ended = false;
  for (const [index,value] of raw.entries.entries()) {
    if (index < generation.rows.length) {
      if (fingerprint(value) !== fingerprint(expected.entries[index])) throw new TypeError('Pre-cache prefix changed from its chosen generation.');
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value) && value.nativeSpeciesId === 0) {
      exact(value,'nativeSpeciesId'); ended = true; continue;
    }
    if (ended) throw new TypeError('A native cache append cannot skip its first free sentinel.');
    const row = exact(value,'level,moves,nativeSpeciesId,origin,stats'),origin = exact(row.origin,'kind,receipt');
    if (origin.kind !== 'miss') throw new TypeError('A lazy cache row needs its actual retained miss receipt.');
    const receipt = exact(origin.receipt,'afterRandom,beforeRandom,operation,replacements,request');
    const lookup = operation(receipt.operation,cacheOwner),wanted = request(receipt.request),before = validateRandomState(receipt.beforeRandom);
    if (lookup.revision < priorRevision || scan(expected.entries,wanted).mode !== 'append') throw new TypeError('Cache appends require actual chronological first-free misses.');
    priorRevision = lookup.revision;
    const sampled = sampleMiss(wanted,before,catalogs,escortDungeonRandomInteger);
    /** @type {MissOrigin} */
    const replayed = {operation:lookup,request:wanted,beforeRandom:before,afterRandom:sampled.afterRandom,replacements:sampled.replacements};
    if (fingerprint(receipt) !== fingerprint(replayed) || fingerprint({...sampled.row,origin:{kind:'miss',receipt:replayed}}) !== fingerprint(row)) throw new TypeError('Retained lazy row must equal its exact source miss and detached draw replay.');
    expected.entries[index] = {...sampled.row,origin:{kind:'miss',receipt:replayed}};
  }
  return freezeData(expected);
}
/** Actual creation boundary before layout/population. A new expedition/floor
 * supplies a fresh owner, even when8F/9F reuse their factual pool. There is no
 * old-cache argument, legacy conversion, seed default or history reconstruction.
 * The separate authority is supplied by the actual private generation caller;
 * the eventual complete factory must authenticate and retain that real witness.
 * @param {unknown} input @param {unknown} authority
 * @param {typeof escortDungeonRandomInteger} draw @param {Catalogs} catalogs
 * @returns {Cache} */
export function prepareSinisterCache64(input,authority,draw,catalogs) {
  const graph = exact(copyPlainData({input,authority},SINISTER_CACHE64_LIMITS),'authority,input');
  const raw = exact(graph.input,'lifecycleSource,owner,random,rows,source'),cacheOwner = owner(raw.owner),before = validateRandomState(raw.random),source = lifecycleSource(raw.lifecycleSource);
  generationAuthority(graph.authority,cacheOwner,before);
  if (draw !== escortDungeonRandomInteger) throw new TypeError('Explicit qualified browser Dungeon sampler required.');
  if (!catalogs.species.capabilities.numericProfileLookup) throw new TypeError('Qualified actual species catalog required.');
  // The accepted helper also checks all ordered rows/source pins before sampling.
  const preparationInput = {owner:cacheOwner,source:raw.source,rows:raw.rows,random:before};
  const prepared = prepareSinisterFloorCache(preparationInput,draw);
  const result = initialCache(prepared,source);
  return freezeData(result);
}

/** Fresh recipient move records are independent of immutable chosen cache rows.
 * Null native slots expose only cleared existence; unused native bytes are not
 * invented. Distinct persistent slot IDs/actor/held container belong to allocation.
 * @param {Row} row @returns {Recipient} */
function recipient(row) {
  return {moves:row.moves.map(move => move === null ? {exists:false} : {exists:true,enabled:true,nativeMoveId:move.nativeMoveId,moveId:move.moveId,basePp:move.basePp,currentPp:move.basePp,ginseng:0,moveFlags2:0}),struggleMoveFlags:0,stats:{...row.stats},counters:{bellyEmpty:false,usedLinkedMovesCounter:0,turnsSinceWarpScarfActivation:0}};
}
/** Hit consumes no move RNG and copies full PP into fresh mutable move records.
 * Miss appends at the first free sentinel; full64 returns an uncached sampled
 * result without changing cache/EXP rankings. No lazy/full Blowback fallback.
 * Every mutation is on detached data; caller commits cache/current stream and
 * actual actor allocation atomically after its independent private owner proof.
 * @param {unknown} input @param {unknown} authority
 * @param {typeof escortDungeonRandomInteger} draw @param {Catalogs} catalogs
 * @returns {import('../../contracts/sinister-cache64.js').CacheLookupResult} */
export function lookupSinisterCache64(input,authority,draw,catalogs) {
  const graph = exact(copyPlainData({input,authority},SINISTER_CACHE64_LIMITS),'authority,input');
  const raw = exact(graph.input,'cache,operation,random,request');
  if (draw !== escortDungeonRandomInteger) throw new TypeError('Explicit qualified browser Dungeon sampler required.');
  const cache = inspectSinisterCache64(raw.cache,catalogs),wanted = request(raw.request),lookup = operation(raw.operation,cache.owner),before = validateRandomState(raw.random);
  lookupAuthority(graph.authority,cache.owner,lookup,before);
  const latest = cache.entries.reduce((revision,row) => 'origin' in row && row.origin.kind === 'miss' ? Math.max(revision,row.origin.receipt.operation.revision) : revision,cache.owner.createdRevision);
  if (lookup.revision < latest) throw new TypeError('A live lookup cannot precede its retained cache lifetime.');
  const found = scan(cache.entries,wanted);
  /** @type {Row} */
  let row;
  let after = before;
  /** @type {Replacement[]} */
  let replacements = [];
  if (found.mode === 'hit') {
    const chosen = cache.entries[found.index];
    if (!chosen || !('level' in chosen)) throw new TypeError('Exact native hit row required.');
    row = {nativeSpeciesId:chosen.nativeSpeciesId,level:chosen.level,moves:chosen.moves.map(move => move === null ? null : {...move}),stats:{...chosen.stats}};
  } else {
    const sampled = sampleMiss(wanted,before,catalogs,draw);
    row = sampled.row; after = sampled.afterRandom; replacements = sampled.replacements;
  }
  const next = /** @type {Cache} */ (/** @type {unknown} */ (copyPlainData(cache,SINISTER_CACHE64_LIMITS)));
  if (found.mode === 'append') next.entries[found.index] = {...row,origin:{kind:'miss',receipt:{operation:lookup,request:wanted,beforeRandom:before,afterRandom:after,replacements}}};
  const receipt = freezeData({kind:/** @type {const} */ ('sinister-cache64-lookup'),owner:cache.owner,lifecycleSource:cache.lifecycleSource,operation:lookup,request:wanted,mode:found.mode,index:found.index,beforeRandom:before,afterRandom:after,replacements,row});
  return {cache:freezeData(next),receipt,recipient:recipient(row)};
}
