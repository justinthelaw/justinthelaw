import { checkSinisterCacheReceipt } from './sinister-cache-proof.js';
import { inspectSinisterCache64, lookupSinisterCache64, SINISTER_CACHE64_LIMITS } from '../../src/domain/gameplay/sinister-cache64.js';
import { escortDungeonRandomInteger } from '../../src/domain/escort-dungeon-rng.js';
import { copyPlainData } from '../../src/domain/state/plain.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { validateRandomState } from '../../src/domain/rng.js';
import { instanceId } from '../../src/domain/ids.js';
import { diagnostics } from './pokemon-rules.js';

/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('./campaign.js').CampaignCatalogs} Catalogs
 * @typedef {import('../../src/contracts/campaign.js').RuleCheck} RuleCheck
 */
/** @param {unknown} value @param {string} keys @returns {Record<string,import('../../src/contracts.js').JsonValue>} */
function exact(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Invalid exact cache64 proof record.');
  return /** @type {Record<string,import('../../src/contracts.js').JsonValue>} */ (value);
}
/** Allocation range is necessary, never a proof of historical allocation.
 * The actual retained private transaction witness is supplied separately.
 * @param {unknown} value @param {number} next */
function allocatedTransaction(value,next) {
  const id = instanceId('transaction',value),sequence = Number(id.slice('transaction:'.length));
  return Number.isSafeInteger(next) && next > sequence;
}
/** Direct prospective lifetime proof. The authority must come from the actual
 * independently authenticated retained generation transaction, not from reading
 * a final actor/map or manufacturing an in-range identity. This checks its exact
 * owner/stream equality and source receipts, then joins the actual current floor.
 * No current RNG equality, old-cache default, live reroll or historical repair.
 * This leaf does not replace whole-state raw admission or generation allocation.
 * @param {State} state @param {unknown} cache @param {unknown} authority
 * @param {Catalogs} catalogs @returns {RuleCheck} */
export function checkSinisterCache64(state,cache,authority,catalogs) {
  const r = diagnostics();
  try {
    const graph = exact(copyPlainData({cache,authority},SINISTER_CACHE64_LIMITS),'authority,cache');
    const actual = exact(graph.authority,'owner,random');
    const inspected = inspectSinisterCache64(graph.cache,catalogs);
    r.check(fingerprint(actual.owner) === fingerprint(inspected.owner) && fingerprint(validateRandomState(actual.random)) === fingerprint(inspected.generation.beforeRandom),'/sinisterCache64/generation','The retained cache must join the actual supplied generation owner and original prospective stream.');
    const generationCheck = checkSinisterCacheReceipt(state,inspected.generation,catalogs);
    if (!generationCheck.ok) return generationCheck;
    for (const [index,row] of inspected.entries.entries()) {
      if (!('origin' in row) || row.origin.kind !== 'miss') continue;
      const operation = row.origin.receipt.operation;
      r.check(allocatedTransaction(operation.transactionId,state.idSequence.next) && operation.revision >= inspected.owner.createdRevision && operation.revision <= state.revision,`/sinisterCache64/entries/${index}/origin`,'A retained miss needs its genuine current-lifetime operation revision and allocated transaction range.');
    }
  } catch {
    r.check(false,'/sinisterCache64','Cache64, actual generation authority or complete source replay is not bounded and exact.');
  }
  return r.result();
}
/** Fresh lookup/recipient construction proof only, before mutable PP/counters
 * are used. The actual private caller supplies both authenticated authorities.
 * State admission, unique actor/move-slot/container allocation and later mutable
 * lifecycle remain independent; reciprocal or in-range identities are not enough.
 * Replay uses the explicitly captured before stream, never state.random.
 * @param {State} state @param {unknown} beforeCache @param {unknown} result
 * @param {unknown} generationAuthority @param {unknown} lookupAuthority
 * @param {Catalogs} catalogs @returns {RuleCheck} */
export function checkSinisterCache64Lookup(state,beforeCache,result,generationAuthority,lookupAuthority,catalogs) {
  const r = diagnostics();
  try {
    const graph = exact(copyPlainData({beforeCache,result,generationAuthority,lookupAuthority},SINISTER_CACHE64_LIMITS),'beforeCache,generationAuthority,lookupAuthority,result');
    const prior = checkSinisterCache64(state,graph.beforeCache,graph.generationAuthority,catalogs);
    if (!prior.ok) return prior;
    const raw = exact(graph.result,'cache,receipt,recipient'),receipt = exact(raw.receipt,'afterRandom,beforeRandom,index,kind,lifecycleSource,mode,operation,owner,replacements,request,row');
    const actual = exact(graph.lookupAuthority,'operation,owner,random'),operation = exact(actual.operation,'revision,transactionId');
    r.check(allocatedTransaction(operation.transactionId,state.idSequence.next) && typeof operation.revision === 'number' && operation.revision === state.revision,'/sinisterCache64/lookup/operation','Fresh construction must use the actual allocated current private transaction.');
    const checked = r.result();
    if (!checked.ok) return checked;
    const replayed = lookupSinisterCache64({cache:graph.beforeCache,request:receipt.request,operation:receipt.operation,random:receipt.beforeRandom},actual,escortDungeonRandomInteger,catalogs);
    r.check(fingerprint(raw) === fingerprint(replayed),'/sinisterCache64/lookup','The entire result, cache transition, source draws and independent full-PP mutable recipient/counters must equal the actual lookup.');
  } catch {
    r.check(false,'/sinisterCache64/lookup','Fresh cache64 lookup or actual private authority is not bounded, exact and replayable.');
  }
  return r.result();
}
