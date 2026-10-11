import { SINISTER_CACHE_FACTS as FACTS } from '../../../content/authored/sinister-cache-facts.js';
import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { instanceId } from '../ids.js';
import { validateRandomState } from '../rng.js';
import { escortDungeonRandomInteger } from '../escort-dungeon-rng.js';

/** Unselected finite floor-cache preparation. The later caller proves actual
 * generation ownership and commits this returned stream/cache atomically.
 * No cache admission, actor allocation, history repair, seed or spawn is made.
 * @typedef {import('../../contracts.js').JsonValue} JsonValue
 * @typedef {import('../../contracts.js').RandomState} RandomState
 * @typedef {(typeof FACTS.species)[number]} SpeciesFacts
 * @typedef {{nativeMoveId:number,moveId:string|null,basePp:number}} PreparedMove
 * @typedef {(typeof FACTS.floorFacts)[number]['rows'][number]} FloorRow
 * @typedef {{path:string,sha256:string}} SourcePin
 */
const INPUT_LIMITS = Object.freeze({ maxDepth: 6,maxNodes: 1800,maxArrayLength: 32,maxObjectKeys: 6,maxStringLength: 160,maxTextLength: 32768 });

/** This requires an already detached graph; accessors were rejected and aliases
 * detached by the whole-graph bounded copier, before any draw/source selection.
 * @param {unknown} value @param {string} keys @returns {Record<string,JsonValue>} */
function exactRecord(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Invalid exact Sinister cache record.');
  return /** @type {Record<string,JsonValue>} */ (value);
}

/** @param {unknown} value @param {number} min @param {number} max @returns {number} */
function boundedInteger(value,min,max) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new TypeError('Invalid bounded Sinister cache number.');
  return value;
}

/** Exact manifest identity is checked here; the static source-byte audit proves
 * those bytes. This is not runtime source retrieval or a claim of Blue parity.
 * @param {unknown} input @param {readonly SourcePin[]} expected @returns {SourcePin[]} */
function sourcePins(input,expected) {
  if (!Array.isArray(input) || input.length !== expected.length) throw new TypeError('Missing exact Sinister cache source pins.');
  return input.map((value,index) => {
    const pin = exactRecord(value,'path,sha256'),target = expected[index];
    if (!target || pin.path !== target.path || pin.sha256 !== target.sha256) throw new TypeError('Mismatched Sinister cache source pin.');
    return { path: target.path,sha256: target.sha256 };
  });
}

/** Preflight every factual row before the first replacement draw. The generated
 * immutable facts are separately audited against native text/JSON and qualified
 * catalogs. Internal Decoy remains a dummy identity with no persistent profile.
 * @param {FloorRow} row @returns {SpeciesFacts} */
function qualifiedSpecies(row) {
  const fact = FACTS.species.find(value => value.nativeSpeciesId === row.nativeSpeciesId && value.level === row.level);
  if (!fact || fact.replacementDrawCount !== Math.max(0,fact.candidates.length-FACTS.maxMoveSlots) || fact.candidates.length > 32) throw new TypeError('Missing bounded Sinister species/level facts.');
  boundedInteger(fact.stats.hp,1,999);
  for (const value of [fact.stats.attack,fact.stats.specialAttack,fact.stats.defense,fact.stats.specialDefense]) boundedInteger(value,0,255);
  boundedInteger(fact.bodySize,1,4); boundedInteger(fact.baseMovementSpeed,1,4);
  if (!['standard','water','chasm','wall'].includes(fact.mobility)) throw new TypeError('Missing qualified Sinister mobility.');
  let priorLevel = 0;
  for (const [index,candidate] of fact.candidates.entries()) {
    if (candidate.order !== index || candidate.learnedAt < priorLevel || candidate.learnedAt > row.level) throw new TypeError('Invalid ordered source move candidate.');
    boundedInteger(candidate.learnedAt,1,100); boundedInteger(candidate.nativeMoveId,1,394); boundedInteger(candidate.basePp,1,99);
    if (typeof candidate.moveId !== 'string' || !/^move-[a-z0-9-]+$/.test(candidate.moveId)) throw new TypeError('Missing qualified candidate move identity.');
    priorLevel = candidate.learnedAt;
  }
  if (row.nativeSpeciesId === 421) {
    if (row.level !== 1 || fact.identityClass !== 'internal-decoy' || fact.speciesId !== null || fact.formId !== null || fact.levelEvidence !== null || fact.candidates.length !== 0) throw new TypeError('Invalid explicit internal Decoy facts.');
  } else if (fact.identityClass !== 'pokemon' || fact.speciesId === null || fact.levelEvidence === null || fact.candidates.length === 0) throw new TypeError('Missing qualified natural species profile.');
  return fact;
}

/** No mutation/draw before the entire bounded exact graph, pins, actual floor
 * and every ordered row/profile have passed preflight. Scalar owner spelling
 * cannot prove the actual session/map/transaction; that is the future caller.
 * @param {unknown} input */
function cacheInput(input) {
  const raw = exactRecord(copyPlainData(input,INPUT_LIMITS),'owner,random,rows,source');
  const owner = exactRecord(raw.owner,'createdRevision,floorId,generationTransactionId,mapId,sessionId');
  const floor = FACTS.floorFacts.find(value => value.floorId === owner.floorId);
  if (!floor) throw new TypeError('Cache preparation requires an actual Sinister floor.');
  const generation = {
    sessionId: instanceId('session',owner.sessionId),mapId: instanceId('map',owner.mapId),floorId: floor.floorId,
    generationTransactionId: instanceId('transaction',owner.generationTransactionId),createdRevision: boundedInteger(owner.createdRevision,1,Number.MAX_SAFE_INTEGER),
  };
  const supplied = exactRecord(raw.source,'catalogFiles,commit,qualification,sourceFiles');
  if (supplied.commit !== FACTS.commit || supplied.qualification !== FACTS.qualification) throw new TypeError('Invalid source qualification for Sinister cache preparation.');
  const source = {
    commit: FACTS.commit,qualification: FACTS.qualification,
    sourceFiles: sourcePins(supplied.sourceFiles,FACTS.sourceFiles),catalogFiles: sourcePins(supplied.catalogFiles,FACTS.catalogFiles),
  };
  if (!Array.isArray(raw.rows) || raw.rows.length !== floor.rows.length || raw.rows.length > FACTS.maxFloorRows) throw new TypeError('Cache requires the complete ordered native floor rows.');
  const rows = raw.rows.map((value,index) => {
    const actual = exactRecord(value,'cumulativeWeight,level,nativeSpeciesId,order,publishedWeight'),expected = floor.rows[index];
    if (!expected || actual.order !== index || actual.nativeSpeciesId !== expected.nativeSpeciesId || actual.level !== expected.level || actual.publishedWeight !== expected.publishedWeight || actual.cumulativeWeight !== expected.cumulativeWeight) throw new TypeError('Cache row differs from the actual native/catalog order.');
    return { ...expected,facts: qualifiedSpecies(expected) };
  });
  const random = validateRandomState(raw.random);
  const requiredDraws = rows.reduce((sum,row) => sum+row.facts.replacementDrawCount,0);
  if (random.draws > Number.MAX_SAFE_INTEGER-requiredDraws) throw new RangeError('Cache preparation would exhaust its explicit random stream.');
  return { owner: generation,source,floor,rows,random };
}

/** Explicit bounded pure draw provider. Only the existing qualified upper16
 * browser mapping is accepted; passing a generic modulo/rejection sampler is
 * rejected before any draw. This is not native LCG/Blue/shared-stream parity.
 * @param {unknown} input @param {typeof escortDungeonRandomInteger} draw */
export function prepareSinisterFloorCache(input,draw) {
  const prepared = cacheInput(input);
  if (draw !== escortDungeonRandomInteger) throw new TypeError('Supply the explicit qualified browser Dungeon sampler.');
  let random = prepared.random;
  /** @type {{rowIndex:number,candidateIndex:number,slot:number,beforeRandom:RandomState,afterRandom:RandomState}[]} */
  const replacements = [];
  const rows = prepared.rows.map(row => {
    const beforeRandom = random,fact = row.facts;
    /** @type {(PreparedMove|null)[]} */
    const moves = [null,null,null,null];
    for (const [candidateIndex,candidate] of fact.candidates.entries()) {
      let slot = candidateIndex;
      if (candidateIndex >= FACTS.maxMoveSlots) {
        const prior = random,result = draw(random,FACTS.maxMoveSlots);
        slot = boundedInteger(result.value,0,FACTS.maxMoveSlots-1);
        random = validateRandomState(result.state);
        if (random.draws !== prior.draws+1) throw new TypeError('A replacement requires exactly one browser transition.');
        replacements.push({ rowIndex: row.order,candidateIndex,slot,beforeRandom: prior,afterRandom: random });
      }
      moves[slot] = { nativeMoveId: candidate.nativeMoveId,moveId: candidate.moveId,basePp: candidate.basePp };
    }
    // Only pre-cache dummy fallback. Future lazy/full cache misses must not
    // borrow this rule. No sampler call or extra candidate is invented here.
    const usedEmptyFallback = moves[0] === null;
    if (usedEmptyFallback) moves[0] = { ...FACTS.preCacheEmptyFallback };
    return {
      order: row.order,nativeSpeciesId: fact.nativeSpeciesId,speciesId: fact.speciesId,formId: fact.formId,identityClass: fact.identityClass,level: fact.level,
      publishedWeight: row.publishedWeight,cumulativeWeight: row.cumulativeWeight,
      stats: { ...fact.stats },bodySize: fact.bodySize,baseMovementSpeed: fact.baseMovementSpeed,mobility: fact.mobility,
      nativeChanceAsleep: fact.nativeChanceAsleep,nativeAbilities: [...fact.nativeAbilities],nativeTypes: [...fact.nativeTypes],
      nativeWild: { ...fact.nativeWild,iqSkillIds: [...fact.nativeWild.iqSkillIds] },
      evidence: { ...fact.evidence },levelEvidence: fact.levelEvidence === null ? null : { ...fact.levelEvidence },
      candidates: fact.candidates.map(candidate => ({ ...candidate })),moves,usedEmptyFallback,replacementDrawCount: fact.replacementDrawCount,beforeRandom,afterRandom: random,
    };
  });
  return freezeData({ kind: 'sinister-floor-cache-prepared',factsId: FACTS.id,source: prepared.source,owner: prepared.owner,
    nativeTableIndex: prepared.floor.nativeTableIndex,encounterPoolId: prepared.floor.encounterPoolId,
    browserRandomMapping: FACTS.browserRandomMapping,beforeRandom: prepared.random,afterRandom: random,rows,replacements });
}
