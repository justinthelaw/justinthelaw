import { SINISTER_SCENES } from '../../../content/authored/sinister-scenes.js';
import { SILENT_CHASM_SCENES } from '../../../content/authored/silent-chasm-scenes.js';
import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { instanceId } from '../ids.js';
/** @typedef {import('../../contracts/early-campaign-scenes.js').EarlyCampaignSceneCursor} Cursor
 * @typedef {import('../../../content/authored/campaign-scene-package.js').CampaignSceneDefinition} Script
 * @typedef {import('../../contracts.js').JsonValue} JsonValue */
const LIMITS = Object.freeze({ maxDepth: 4,maxNodes: 128,maxArrayLength: 10,maxObjectKeys: 8,maxStringLength: 160,maxTextLength: 8192 });
const PROGRAM_LIMITS = Object.freeze({ maxDepth: 8,maxNodes: 8192,maxArrayLength: 64,maxObjectKeys: 32,maxStringLength: 2048,maxTextLength: 65536 });
// Snapshot the exact authored graph once. No caller can supply new dialogue,
// edges, terminal owner or fallback stage through a save or shared data alias.
const scripts = /** @type {Readonly<Script[]>} */ (/** @type {unknown} */ (freezeData(copyPlainData([...SINISTER_SCENES.scenes,...SILENT_CHASM_SCENES.scenes],PROGRAM_LIMITS))));
/** @param {unknown} value @param {string} keys @returns {Record<string,JsonValue>} */
function record(value,keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== keys) throw new TypeError('Exact early scene cursor record required.');
  return /** @type {Record<string,JsonValue>} */ (value);
}
/** @param {unknown} value @param {number} minimum @returns {number} */
function integer(value,minimum) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) throw new TypeError('Invalid early scene revision or day.');
  return value;
}
/** @param {unknown} sceneId */
function scriptFor(sceneId) {
  const script = scripts.find(row => row.id === sceneId);
  if (!script) throw new TypeError('Unknown early campaign scene.');
  return script;
}
/** @param {Script} script @param {unknown} stageId */
function stageFor(script,stageId) {
  const stage = script.stages.find(row => row.id === stageId);
  if (!stage) throw new TypeError('Unknown original scene stage.');
  return stage;
}
/** An option is mandatory exactly at a real authored choice. Advancing a
 * dialogue stage cannot smuggle a choice, nor can null skip a choice stage.
 * @param {Script} script @param {string} stageId @param {unknown} optionId */
function nextStage(script,stageId,optionId) {
  const stage = stageFor(script,stageId);
  if (stage.choices.length) {
    const option = stage.choices.find(option => option.id === optionId);
    if (!option) throw new TypeError('The actual authored scene option is required.');
    return option.next;
  }
  if (optionId !== null) throw new TypeError('Dialogue acknowledgments have no option.');
  return stage.next;
}
/** Starts a detached prospective cursor only after its actual caller has proved
 * source entry, allocated this instance and bound real profile/session roles.
 * This does not authorize the native entry predicate or create canonical state.
 * @param {unknown} input @returns {Readonly<Cursor>} */
export function beginEarlyCampaignSceneCursor(input) {
  const raw = record(copyPlainData(input,LIMITS),'day,entryRevision,sceneId,sceneInstanceId');
  const script = scriptFor(raw.sceneId),sceneInstanceId = instanceId('scene-instance',raw.sceneInstanceId);
  return freezeData({ kind: 'early-campaign-scene-v1',sceneId: script.id,sceneInstanceId,
    entryRevision: integer(raw.entryRevision,1),day: integer(raw.day,0),stageId: script.firstStage,acknowledgments: [] });
}
/** Descriptor-safe detached admission of the complete original path. Every
 * record is an acknowledged predecessor, so branching scenes cannot skip or
 * replay a question or present both exclusive responses. Terminal null is
 * proved only by the final real edge; it is retained until the route owner
 * consumes its exact return. No current RNG/resource/history projection occurs.
 * @param {unknown} input @param {number} currentRevision @returns {Readonly<Cursor>} */
export function readEarlyCampaignSceneCursor(input,currentRevision) {
  integer(currentRevision,1);
  const cursor = record(copyPlainData(input,LIMITS),'acknowledgments,day,entryRevision,kind,sceneId,sceneInstanceId,stageId');
  if (cursor.kind !== 'early-campaign-scene-v1') throw new TypeError('Invalid early scene cursor version.');
  const script = scriptFor(cursor.sceneId);
  instanceId('scene-instance',cursor.sceneInstanceId);
  integer(cursor.day,0);
  const entryRevision = integer(cursor.entryRevision,1);
  if (entryRevision > currentRevision || !Array.isArray(cursor.acknowledgments) || cursor.acknowledgments.length > script.stages.length) throw new TypeError('Invalid early scene entry or acknowledgment count.');
  /** @type {string|null} */ let stageId = script.firstStage;
  let lastRevision = entryRevision;
  for (const value of cursor.acknowledgments) {
    const ack = record(value,'optionId,revision,stageId');
    integer(ack.revision,1);
    if (stageId === null || ack.stageId !== stageId || typeof ack.revision !== 'number' || ack.revision <= lastRevision || ack.revision > currentRevision) throw new TypeError('Scene acknowledgments must follow the actual path in strict revision order.');
    stageId = nextStage(script,stageId,ack.optionId);
    lastRevision = ack.revision;
  }
  if (cursor.stageId !== stageId) throw new TypeError('The displayed scene stage must follow every saved acknowledgment.');
  return freezeData(/** @type {Cursor} */ (/** @type {unknown} */ (cursor)));
}
/** Exactly one acknowledgment in the caller's next committed transaction.
 * Selection is checked before a new receipt is constructed. No scene entry,
 * return effect, EXP, resource mutation, allocation, RNG or events occur here.
 * @param {unknown} input @param {unknown} optionId @param {number} currentRevision @returns {Readonly<Cursor>} */
export function advanceEarlyCampaignSceneCursor(input,optionId,currentRevision) {
  const cursor = readEarlyCampaignSceneCursor(input,currentRevision),script = scriptFor(cursor.sceneId);
  if (currentRevision >= Number.MAX_SAFE_INTEGER || cursor.stageId === null) throw new TypeError('Completed or exhausted scene cursor cannot advance.');
  const stageId = nextStage(script,cursor.stageId,optionId);
  const acknowledgment = { stageId: cursor.stageId,optionId: /** @type {string|null} */ (optionId),revision: currentRevision+1 };
  return freezeData({ ...cursor,stageId,acknowledgments: [...cursor.acknowledgments,acknowledgment] });
}
/** Stable IDs also identify authored staging/audio rows. Return null only for
 * a genuinely completed cursor; invalid inputs throw instead of falling back.
 * @param {unknown} input @param {number} currentRevision */
export function earlyCampaignScenePrompt(input,currentRevision) {
  const cursor = readEarlyCampaignSceneCursor(input,currentRevision),script = scriptFor(cursor.sceneId);
  return cursor.stageId === null ? null : freezeData({ sceneId: script.id,mapId: script.mapId,stage: stageFor(script,cursor.stageId) });
}
/** A terminal handoff description is not authorization to perform its effects.
 * Actual route code must independently join this instance/entry/day/trace to its
 * source caller and consume it once, with mandatory terminal learning first.
 * Keeping the exact return owner avoids invented reward, expedition or guest
 * operations when a scene completes (notably source script5 and ground Zapdos).
 * @param {unknown} input @param {number} currentRevision */
export function earlyCampaignSceneReturn(input,currentRevision) {
  const cursor = readEarlyCampaignSceneCursor(input,currentRevision),script = scriptFor(cursor.sceneId);
  if (cursor.stageId !== null) throw new TypeError('Only the actual terminal scene edge returns to its caller.');
  const final = cursor.acknowledgments.at(-1);
  if (!final) throw new TypeError('Terminal scene requires its final acknowledgment.');
  return freezeData({ sceneId: script.id,sceneInstanceId: cursor.sceneInstanceId,entryRevision: cursor.entryRevision,day: cursor.day,
    completedRevision: final.revision,sourceId: script.sourceId,returnOwner: script.returnOwner,acknowledgments: cursor.acknowledgments });
}

/** Immutable authored source requirements are data, not admission proof.
 * @param {unknown} sceneId */
export function earlyCampaignSceneDefinition(sceneId) { return scriptFor(sceneId); }
