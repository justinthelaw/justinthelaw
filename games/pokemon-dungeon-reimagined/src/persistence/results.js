/** @typedef {import('./contracts.js').ErrorCode} ErrorCode */
/** @typedef {import('./contracts.js').Failure} Failure */
/** Fixed player-safe messages: neither imported strings nor raw exceptions. */
const messages = Object.freeze({
  invalid: 'This save is not a valid campaign. Your current progress is unchanged.',
  'too-large': 'This save exceeds the supported file size.',
  'unsupported-version': 'This save version is not supported by this build.',
  'content-mismatch': 'This save requires a different content revision.',
  'content-blocked': 'Required campaign rules or content are not ready in this build.',
  integrity: 'This save failed its integrity check. You can inspect the backup.',
  'crypto-unavailable': 'Save integrity checks are unavailable in this browser.',
  'storage-unavailable': 'Browser saving is unavailable. Export your progress to a file.',
  quota: 'Browser storage is full. Export your progress to a file.',
  'storage-corrupt': 'The stored save record could not be read safely. Export current progress before resetting.',
  conflict: 'The stored campaign changed in another operation or tab. Request this operation again.',
  stale: 'Your campaign changed while this operation was preparing. Request it again.',
  disposed: 'This game session has closed.',
  empty: 'There is no saved campaign in this slot.',
  'confirmation-required': 'Confirm replacement using the current preview before continuing.',
  'binding-failed': 'The campaign could not be prepared. Current progress is unchanged.',
  busy: 'A campaign replacement is in progress. Try again when it finishes.',
  superseded: 'A newer checkpoint replaced this queued save request.',
  'memory-only': 'This campaign is in memory only. Export it or explicitly confirm replacing the browser save.',
});
/** @param {ErrorCode} code @returns {Failure} */
export function fail(code) { return Object.freeze({ ok: false, code, message: messages[code] }); }
/** @template T @param {T} value @returns {Readonly<{ok:true,value:T}>} */
export function succeed(value) { return Object.freeze({ ok: true, value }); }
/** @param {unknown} error @returns {Failure} */
export function storageFailure(error) {
  return fail(error instanceof DOMException && error.name === 'QuotaExceededError' ? 'quota' : 'storage-unavailable');
}
