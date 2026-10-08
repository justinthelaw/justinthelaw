import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { instanceId } from '../ids.js';
import { nativeGeneralRandom32, validateNativeGeneralRandomState } from '../native-general-rng.js';
import { generateNativeHiddenPower } from './native-escort-entry.js';
/** @typedef {import('../native-general-rng.js').NativeGeneralRandomState} GeneralState */
/** @typedef {import('../../contracts/campaign.js').PokemonId} PokemonId */
/** @typedef {{kind:'native-dungeon-preseed-v1',word:number,floors:number}} Preseed */
const LIMITS = Object.freeze({ maxDepth: 5,maxNodes: 80,maxArrayLength: 4,maxObjectKeys: 4,maxStringLength: 160,maxTextLength: 4096 });
/** @param {unknown} value @param {string} keys @returns {Record<string,import('../../contracts.js').JsonValue>} */
function record(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Exact prospective run record required.');
  return /** @type {Record<string,import('../../contracts.js').JsonValue>} */ (value);
}
/** @param {unknown} value @param {number} min @param {number} max */
function integer(value,min,max) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new TypeError('Invalid prospective run counter.');
  return value;
}
/** New non-rescue RunDungeon source boundary only. The complete actual entry
 * owner must authenticate actual selected members/body sizes, retained native
 * recruited-ID mapping (never final UI/leader order), and the supplied general
 * stream, then commit the entire returned receipt. No old save, quicksave or
 * already-active session can infer this history from its final actors.
 * All graph/ID/body/stream checks precede the first draw. Source preseed sampling
 * is paid BEFORE PokemonToDungeonMon conversions; temporary InitEntity Hidden
 * Power samples are separate later calls and cannot borrow these conversions.
 * @param {unknown} input */
export function prepareSinisterRun(input) {
  const raw = record(copyPlainData(input,LIMITS),'generalRandom,owner,teamSlots');
  const suppliedOwner = record(raw.owner,'entryRevision,sessionId,transactionId');
  const owner = { sessionId: instanceId('session',suppliedOwner.sessionId),transactionId: instanceId('transaction',suppliedOwner.transactionId),entryRevision: integer(suppliedOwner.entryRevision,1,Number.MAX_SAFE_INTEGER) };
  if (!Array.isArray(raw.teamSlots) || raw.teamSlots.length !== 4) throw new TypeError('Four dense actual native party slots are required.');
  const members = raw.teamSlots.flatMap((value,slot) => {
    if (value === null) return [];
    const row = record(value,'bodySize,nativeRecruitedId,pokemonId');
    return [{ slot,pokemonId: instanceId('pokemon',row.pokemonId),nativeRecruitedId: integer(row.nativeRecruitedId,0,412),bodySize: integer(row.bodySize,1,4) }];
  });
  if (!members.length || members.reduce((sum,row) => sum+row.bodySize,0) > 6 || new Set(members.map(row => row.pokemonId)).size !== members.length) throw new TypeError('Actual distinct party and native body capacity are required.');
  if (members.some((row,index) => row.slot !== index || index > 0 && row.nativeRecruitedId <= (members[index-1]?.nativeRecruitedId ?? -1))) throw new TypeError('Native conversion scans distinct recruited IDs in ascending order into compact slots.');
  const beforeGeneralRandom = validateNativeGeneralRandomState(raw.generalRandom);
  const sampled = nativeGeneralRandom32(beforeGeneralRandom),rawPreseed = sampled.value & 0xffffff;
  let generalRandom = sampled.state;
  const rosterConversions = members.map(member => {
    const before = generalRandom,result = generateNativeHiddenPower(before);
    generalRandom = result.generalRandom;
    return { ...member,hiddenPower: result.hiddenPower,beforeGeneralRandom: before,afterGeneralRandom: generalRandom };
  });
  return freezeData({ kind: 'sinister-new-run-prepared',owner,beforeGeneralRandom,preseedDraw: { value: sampled.value,beforeGeneralRandom,afterGeneralRandom: sampled.state },rawPreseed,
    preseed: /** @type {Preseed} */ ({ kind: 'native-dungeon-preseed-v1',word: (rawPreseed|1)&0xffffff,floors: 0 }),rosterConversions,generalRandom });
}
/** Source GenerateDungeonRNGSeed advances its own retained preseed twice. This
 * is a separate native source witness, not a reset or conversion of any browser
 * xoshiro stream. A future floor owner must retain the actual call/lifetime and
 * independently name the browser cache/layout/population sampler adaptation.
 * @param {unknown} input */
export function prepareSinisterFloorSeed(input) {
  const raw = record(copyPlainData(input,LIMITS),'floors,kind,word');
  if (raw.kind !== 'native-dungeon-preseed-v1') throw new TypeError('Actual prospective dungeon preseed required.');
  const word = integer(raw.word,0,0xffffffff),floors = integer(raw.floors,0,Number.MAX_SAFE_INTEGER-1);
  if ((word&1) !== 1 || floors === 0 && word > 0xffffff) throw new TypeError('Preseed must retain its actual odd source word and initial24-bit boundary.');
  const first = (Math.imul(word,0x5d588b65)+1)>>>0,second = (Math.imul(first,0x5d588b65)+1)>>>0;
  const dungeonSeed = ((((first>>>16)|(second&0xffff0000))&0xffffff)|1)>>>0;
  return freezeData({ kind: 'sinister-floor-seed-prepared',before: /** @type {Preseed} */ ({ kind: 'native-dungeon-preseed-v1',word,floors }),after: /** @type {Preseed} */ ({ kind: 'native-dungeon-preseed-v1',word: second,floors: floors+1 }),dungeonSeed });
}
