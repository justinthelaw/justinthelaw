import { validateCampaign } from '../domain/state.js';
import { fail, succeed } from './results.js';
/** @typedef {import('./contracts.js').CampaignContent} CampaignContent */
/** @typedef {import('./contracts.js').CampaignSnapshot} CampaignSnapshot */
/** @typedef {import('./contracts.js').EncodedSave} EncodedSave */
/** @typedef {import('./contracts.js').SaveBody} SaveBody */
/** @typedef {import('./contracts.js').SaveEnvelope} SaveEnvelope */
/** @template T @typedef {import('./contracts.js').Result<T>} Result */

/** Engineering byte budget, not an original-game roster limit. */
export const MAX_SAVE_BYTES = 64 * 1024 * 1024;
const encoder = new TextEncoder();
const bodyKeys = ['format', 'envelopeVersion', 'referenceEdition', 'schemaVersion', 'contentRevision', 'revision', 'savedAt', 'state'];

/** Canonical JSON: UTF-16 lexicographic object keys, JSON scalar spelling,
 * ordered arrays, no whitespace; UTF-8 bytes. Only validated plain data enters.
 * @param {unknown} value @returns {string}
 */
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const record = /** @type {Record<string,unknown>} */ (value);
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
}
/** Avoid allocating an encoded copy for inputs already over the budget.
 * @param {string} text @returns {boolean}
 */
export function withinSaveLimit(text) {
  return text.length <= MAX_SAVE_BYTES && encoder.encode(text).byteLength <= MAX_SAVE_BYTES;
}
/** @param {string} text @returns {Promise<Result<string>>} */
async function digest(text) {
  try {
    const bytes = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(text));
    return succeed(Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join(''));
  } catch { return fail('crypto-unavailable'); }
}
/** @param {unknown} value @param {readonly string[]} keys @returns {value is Record<string,unknown>} */
function exactRecord(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  const ownKeys = Reflect.ownKeys(value);
  return ownKeys.length === keys.length && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable === true && Object.hasOwn(descriptor, 'value');
  });
}
/** @param {unknown} value @returns {value is string} */
function canonicalTime(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
/** Full P07 validation, including every relevant semantic catalog policy.
 * @param {unknown} state @param {CampaignContent} content @returns {Result<CampaignSnapshot>}
 */
export function validateSave(state, content) {
  const result = validateCampaign(state, content);
  if (result.ok) return succeed(result.snapshot);
  if (result.kind === 'blocked') return fail('content-blocked');
  if (result.issues.some(issue => issue.code === 'content-mismatch')) return fail('content-mismatch');
  if (result.issues.some(issue => issue.code === 'unsupported-version')) return fail('unsupported-version');
  return fail('invalid');
}
/** Explicit migration admission. Version 1 is the sole supported format;
 * startup-shell data and unknown versions have no invented migration.
 * This checks version routing only; it NEVER certifies a campaign.
 * @param {unknown} input @returns {Result<Record<string,unknown>>}
 */
export function migrateSave(input) {
  if (!exactRecord(input, [...bodyKeys, 'integrity'])) return fail('invalid');
  if (input.format !== 'pokemon-dungeon-reimagined' || input.envelopeVersion !== 1 || input.schemaVersion !== 1 || input.referenceEdition !== 'blue-rescue-team') return fail('unsupported-version');
  return succeed(input);
}
/** @param {unknown} state @param {CampaignContent} content @param {string} [savedAt] @returns {Promise<Result<EncodedSave>>} */
export async function encodeSave(state, content, savedAt = new Date().toISOString()) {
  const checked = validateSave(state, content);
  if (!checked.ok) return checked;
  if (!canonicalTime(savedAt) || savedAt < checked.value.profile.createdAt) return fail('invalid');
  const snapshot = checked.value;
  /** @type {SaveBody} */
  const body = Object.freeze({ format: 'pokemon-dungeon-reimagined', envelopeVersion: 1, referenceEdition: 'blue-rescue-team', schemaVersion: 1,
    contentRevision: snapshot.contentRevision, revision: snapshot.revision, savedAt, state: snapshot });
  const bodyText = canonical(body);
  if (!withinSaveLimit(bodyText)) return fail('too-large');
  const hash = await digest(bodyText);
  if (!hash.ok) return hash;
  /** @type {SaveEnvelope} */
  const envelope = Object.freeze({ ...body, integrity: Object.freeze({ algorithm: 'SHA-256', digest: hash.value }) });
  const text = canonical(envelope);
  if (!withinSaveLimit(text)) return fail('too-large');
  return succeed(Object.freeze({ text, envelope, snapshot }));
}
/** Decode untrusted file/storage text without touching a binding or storage.
 * Hashing detects accidental corruption; it is not authentication or anti-editing.
 * @param {string} text @param {CampaignContent} content @returns {Promise<Result<EncodedSave>>}
 */
export async function decodeSave(text, content) {
  if (typeof text !== 'string') return fail('invalid');
  if (!withinSaveLimit(text)) return fail('too-large');
  /** @type {unknown} */ let parsed;
  try { parsed = JSON.parse(text); } catch { return fail('invalid'); }
  const migrated = migrateSave(parsed);
  if (!migrated.ok) return migrated;
  const raw = migrated.value;
  if (!canonicalTime(raw.savedAt) || typeof raw.contentRevision !== 'string' || !Number.isSafeInteger(raw.revision)
      || !exactRecord(raw.integrity, ['algorithm', 'digest']) || raw.integrity.algorithm !== 'SHA-256'
      || typeof raw.integrity.digest !== 'string' || !/^[0-9a-f]{64}$/.test(raw.integrity.digest)) return fail('invalid');
  const checked = validateSave(raw.state, content);
  if (!checked.ok) return checked;
  const snapshot = checked.value;
  if (snapshot.revision !== raw.revision || snapshot.contentRevision !== raw.contentRevision || snapshot.schemaVersion !== raw.schemaVersion
      || snapshot.profile.referenceEdition !== raw.referenceEdition || raw.savedAt < snapshot.profile.createdAt) return fail('invalid');
  const encoded = await encodeSave(snapshot, content, raw.savedAt);
  if (!encoded.ok) return encoded;
  if (encoded.value.envelope.integrity.digest !== raw.integrity.digest) return fail('integrity');
  return encoded;
}
