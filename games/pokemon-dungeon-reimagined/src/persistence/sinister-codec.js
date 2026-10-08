import { decodeSave, encodeSave, migrateSave, validateSave, withinSaveLimit } from './codec.js';
import { ESCORT_WORK_REVISION } from '../domain/state/escort-work-revision.js';
import { SINISTER_WORK_REVISION } from '../domain/state/sinister-work-revision.js';
import { fail } from './results.js';
/** @typedef {import('./contracts.js').CampaignContent} Content */
/** @typedef {import('./contracts.js').CampaignSnapshot} Snapshot */
/** @typedef {import('./codec.js').SaveCompatibility} Compatibility */

/** A trusted two-owner codec family. A live v24 expedition keeps its original
 * exact factory and payload; only a genuine future entry transaction creates
 * v25 evidence. Earlier envelopes use their original v24 compatibility chain.
 * Revision routing is not admission: the unchanged codec checks the entire
 * original body/envelope, time, hash and selected factory before conversion.
 * No storage, dispatch, default source receipts or revision mutation occurs here.
 * @param {Content} escort @param {Content} sinister
 * @param {Compatibility} earlier */
export function createSinisterSaveFamily(escort,sinister,earlier) {
  if (escort.contentRevision !== ESCORT_WORK_REVISION || sinister.contentRevision !== SINISTER_WORK_REVISION || earlier.some(row => row.content.contentRevision === ESCORT_WORK_REVISION || row.content.contentRevision === SINISTER_WORK_REVISION) || new Set(earlier.map(row => row.content.contentRevision)).size !== earlier.length) throw new TypeError('Exact distinct predecessor and prospective save owners are required.');
  const compatibility = Object.freeze([...earlier]);
  /** This lookup selects only a trusted owner, never validates supplied data.
   * @param {unknown} revision @returns {Content|null} */
  function contentForRevision(revision) {
    return revision === ESCORT_WORK_REVISION ? escort : revision === SINISTER_WORK_REVISION ? sinister : null;
  }
  /** Descriptor inspection cannot execute an untrusted contentRevision getter.
   * Whole bounded plain-data validation still belongs to the selected codec.
   * @param {unknown} state @returns {Content|null} */
  function contentForState(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    try {
      const descriptor = Object.getOwnPropertyDescriptor(state,'contentRevision');
      return descriptor && Object.hasOwn(descriptor,'value') && descriptor.enumerable ? contentForRevision(descriptor.value) : null;
    } catch { return null; }
  }
  return Object.freeze({
    contentForRevision,
    /** @param {unknown} state */
    validate(state) {
      const content = contentForState(state);
      return content ? validateSave(state,content) : fail('content-mismatch');
    },
    /** @param {unknown} state @param {string} [savedAt] */
    async encode(state,savedAt) {
      const content = contentForState(state);
      return content ? encodeSave(state,content,savedAt) : fail('content-mismatch');
    },
    /** Header inspection is bounded and grants no acceptance or conversion.
     * Unknown/older revisions still face original codec admission; compatibility
     * can produce only the real escort owner because that codec re-encodes it.
     * @param {string} text */
    async decode(text) {
      if (typeof text !== 'string') return fail('invalid');
      if (!withinSaveLimit(text)) return fail('too-large');
      /** @type {unknown} */ let parsed;
      try { parsed = JSON.parse(text); } catch { return fail('invalid'); }
      const header = migrateSave(parsed);
      if (!header.ok) return header;
      return header.value.contentRevision === SINISTER_WORK_REVISION ? decodeSave(text,sinister) : decodeSave(text,escort,compatibility);
    },
  });
}
