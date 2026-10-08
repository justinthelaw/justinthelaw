import { ESCORT_ENTRY_FACTS as FACTS } from '../../../content/authored/escort-entry-facts.js';
import { DEFAULT_IQ } from '../../../content/state/opening-facts.js';
import { freezeData } from '../state/validate.js';
import { copyPlainData } from '../state/plain.js';
import { instanceId } from '../ids.js';
import { nativeGeneralRandomInteger, seedNativeGeneralRandom, validateNativeGeneralRandomState } from '../native-general-rng.js';

/** Preparation is distinct from canonical actor allocation/placement and from
 * the saved successor's proof. The caller supplies the actual four native team
 * slots and source-ordered taken requests. No persistent guest/roster is made.
 * @typedef {import('../native-general-rng.js').NativeGeneralRandomState} GeneralState
 * @typedef {import('../../contracts/campaign.js').PokemonId} PokemonId
 * @typedef {import('../../contracts/campaign.js').JobId} JobId
 * @typedef {import('../../contracts/campaign.js').SpeciesForm} Identity
 * @typedef {{readonly pokemonId:PokemonId,readonly bodySize:number}} NativeEntryMember
 * @typedef {{readonly jobId:JobId,readonly dungeonId:string,readonly client:Readonly<Identity>,readonly recipient:Readonly<Identity>}} NativeTakenEscort
 * @typedef {{readonly nativeTypeId:number,readonly power:number}} NativeHiddenPower
 * @typedef {{readonly dungeonId:string,readonly teamSlots:readonly (NativeEntryMember|null)[],readonly takenEscorts:readonly NativeTakenEscort[],readonly generalRandom:GeneralState}} EntryInput
 */
const ENTRY_LIMITS = Object.freeze({ maxDepth: 6,maxNodes: 256,maxArrayLength: 8,maxObjectKeys: 4,maxStringLength: 96,maxTextLength: 8192 });

/** Exact scalar catalog spelling; canonical membership/ownership belongs to
 * the saved entry caller. No arbitrary extra data survives this boundary.
 * @param {unknown} value @returns {string} */
function entryCatalogId(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{0,95}$/.test(value) || ['constructor','prototype'].includes(value)) throw new TypeError('Invalid native entry catalog identity.');
  return value;
}
/** @param {unknown} value @param {string} keys @returns {Record<string,import('../../contracts.js').JsonValue>} */
function entryRecord(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Invalid exact native entry record.');
  return /** @type {Record<string,import('../../contracts.js').JsonValue>} */ (value);
}
/** @param {unknown} value @returns {Identity} */
function entryIdentity(value) {
  const record = entryRecord(value,'formId,speciesId');
  return { speciesId: /** @type {Identity['speciesId']} */ (entryCatalogId(record.speciesId)),formId: record.formId === null ? null : /** @type {Identity['formId']} */ (entryCatalogId(record.formId)) };
}

/** Validate/copy the whole caller graph before any conversion draw. The plain
 * copier rejects sparse arrays, undefined, accessors and hidden/extra fields;
 * subsequent exact records copy only validated scalar identities/resources.
 * @param {unknown} input @returns {EntryInput} */
function validateNativeEscortEntryInput(input) {
  const record = entryRecord(copyPlainData(input,ENTRY_LIMITS),'dungeonId,generalRandom,takenEscorts,teamSlots');
  const dungeonId = entryCatalogId(record.dungeonId);
  if (!Array.isArray(record.teamSlots) || record.teamSlots.length !== FACTS.maxTeamSlots || !Array.isArray(record.takenEscorts) || record.takenEscorts.length > 8) throw new TypeError('Native escort preparation requires four dense slots and at most eight taken requests.');
  const teamSlots = record.teamSlots.map(value => {
    if (value === null) return null;
    const member = entryRecord(value,'bodySize,pokemonId');
    if (typeof member.bodySize !== 'number' || !Number.isInteger(member.bodySize) || member.bodySize < 1 || member.bodySize > FACTS.maximumBodySize) throw new TypeError('Invalid native entry body size.');
    return { pokemonId: instanceId('pokemon',member.pokemonId),bodySize: member.bodySize };
  });
  const members = teamSlots.flatMap(member => member === null ? [] : [member]);
  if (new Set(members.map(member => member.pokemonId)).size !== members.length) throw new TypeError('Duplicate native entry member.');
  const takenEscorts = record.takenEscorts.map(value => {
    const job = entryRecord(value,'client,dungeonId,jobId,recipient');
    return { jobId: instanceId('job',job.jobId),dungeonId: entryCatalogId(job.dungeonId),client: entryIdentity(job.client),recipient: entryIdentity(job.recipient) };
  });
  if (new Set(takenEscorts.map(job => job.jobId)).size !== takenEscorts.length) throw new TypeError('Duplicate native taken request.');
  return { dungeonId,teamSlots,takenEscorts,generalRandom: validateNativeGeneralRandomState(record.generalRandom) };
}

/** First prospective use only. This native boot seed is explicit and sourced;
 * it cannot reconstruct any prior general draws or an authenticated old save.
 * Adoption/lifetime receipt belongs to the future saved successor, not import.
 * @returns {GeneralState} */
export function createProspectiveNativeGeneralRandom() {
  const [a,b,c,d,e,f] = FACTS.prospectiveSeedBytes;
  if (FACTS.prospectiveSeedBytes.length !== 6 || a === undefined || b === undefined || c === undefined || d === undefined || e === undefined || f === undefined) throw new TypeError('Missing native prospective seed bytes.');
  return seedNativeGeneralRandom([a,b,c,d,e,f]);
}

/** Every PokemonToDungeonMon conversion calls this even without Hidden Power
 * in its moves. Power draw comes first; actual type0 retries consume their calls.
 * Source's Fire fallback occurs only after all100 type samples are zero.
 * @param {GeneralState} input */
export function generateNativeHiddenPower(input) {
  let generalRandom = validateNativeGeneralRandomState(input);
  const powerDraw = nativeGeneralRandomInteger(generalRandom,FACTS.hiddenPowerPowers.length);
  generalRandom = powerDraw.state;
  const power = FACTS.hiddenPowerPowers[powerDraw.value];
  if (power === undefined) throw new TypeError('Missing source Hidden Power power.');
  let nativeTypeId = FACTS.fallbackType;
  for (let attempt = 0; attempt < FACTS.hiddenPowerTypeAttempts; attempt++) {
    const typeDraw = nativeGeneralRandomInteger(generalRandom,FACTS.typeCount);
    generalRandom = typeDraw.state;
    if (typeDraw.value !== 0) { nativeTypeId = typeDraw.value; break; }
  }
  return freezeData({ hiddenPower: { nativeTypeId,power },generalRandom });
}

/** Real source admission: selected conversions precede guest admission. A full
 * team/body-size failure retains those actual draws, and performs no guest draw.
 * The first matching taken escort uses its client, independently of recipient.
 * A future caller must prove input order/identity and commit the returned RNG
 * with real actor/container/archive ownership; this pure precursor commits none.
 * @param {EntryInput} input
 */
export function prepareNativeEscortEntry(input) {
  const prepared = validateNativeEscortEntryInput(input);
  const members = prepared.teamSlots.flatMap((member,slot) => member === null ? [] : [{ pokemonId: member.pokemonId,bodySize: member.bodySize,slot }]);
  const beforeGeneralRandom = prepared.generalRandom;
  let generalRandom = beforeGeneralRandom;
  const rosterConversions = members.map(member => {
    const before = generalRandom,result = generateNativeHiddenPower(before);
    generalRandom = result.generalRandom;
    return { pokemonId: member.pokemonId,slot: member.slot,hiddenPower: result.hiddenPower,beforeGeneralRandom: before,afterGeneralRandom: generalRandom };
  });
  const job = prepared.takenEscorts.find(job => job.dungeonId === prepared.dungeonId);
  if (!job) return freezeData({ kind: 'no-escort',beforeGeneralRandom,generalRandom,rosterConversions });
  const client = FACTS.clients.find(row => row.speciesId === job.client.speciesId && row.formId === job.client.formId);
  // These19 source-qualified clients are the genuine current generator pool.
  // New eligibility must export/prove its exact data, never filter the job/draw.
  if (!client) throw new TypeError('Escort client requires a new qualified native entry fact.');
  const bodySize = members.reduce((sum,member) => sum + member.bodySize,client.bodySize);
  if (bodySize > FACTS.maximumBodySize) return freezeData({ kind: 'guest-not-admitted',reason: 'body-size',jobId: job.jobId,beforeGeneralRandom,generalRandom,rosterConversions });
  const slot = prepared.teamSlots.indexOf(null);
  if (slot < 0) return freezeData({ kind: 'guest-not-admitted',reason: 'team-slots-full',jobId: job.jobId,beforeGeneralRandom,generalRandom,rosterConversions });
  const guestBefore = generalRandom,hiddenPower = generateNativeHiddenPower(guestBefore);
  generalRandom = hiddenPower.generalRandom;
  return freezeData({ kind: 'guest-prepared',beforeGeneralRandom,generalRandom,rosterConversions,guest: {
    jobId: job.jobId,client: { speciesId: job.client.speciesId,formId: job.client.formId },recipient: { speciesId: job.recipient.speciesId,formId: job.recipient.formId },slot,
    nativeRecruitedId: FACTS.temporaryRecruitedId,joinLocation: FACTS.joinLocation,joinFloor: FACTS.joinFloor,
    level: 1,totalExperience: 0,stats: { ...client.stats },iqPoints: FACTS.minimumDungeonIq,
    iqSkillIds: [...DEFAULT_IQ],tacticId: 'tactic-lets-go-together',isLeader: false,
    heldItem: null,belly: 100,maxBelly: 100,hiddenPower: hiddenPower.hiddenPower,
    moves: client.moves.map(move => ({ ...move,enabled: true,currentPp: move.basePp,powerBoost: 0,ppCapacityBonus: 0 })),
    beforeGeneralRandom: guestBefore,afterGeneralRandom: generalRandom,
  } });
}
