import { withinSaveLimit } from './codec.js';
import { fail, succeed, storageFailure } from './results.js';
/** @typedef {import('./contracts.js').StorageAdapter} StorageAdapter */
/** @typedef {import('./contracts.js').StorageRecord} StorageRecord */
/** @typedef {import('./contracts.js').StorageSlot} StorageSlot */
/** @typedef {import('./contracts.js').StorageCandidate} StorageCandidate */
/** @typedef {import('./contracts.js').CommitGuard} CommitGuard */
/** @typedef {import('./contracts.js').Failure} Failure */
/** @template T @typedef {import('./contracts.js').Result<T>} Result */
const DATABASE = 'pokemon-dungeon-reimagined:campaign:v1';
const STORE = 'campaign';
const KEY = 'current';
/** Bound each payload independently and discard rejected raw values from views.
 * No JSON parsing or semantic validation happens inside an IDB transaction.
 * @param {unknown} value @returns {StorageSlot}
 */
function slot(value) {
  if (value === null) return succeed(null);
  if (typeof value !== 'string') return fail('invalid');
  return withinSaveLimit(value) ? succeed(value) : fail('too-large');
}
/** Framing/generation failure closes the whole record; envelope admission does
 * not. Both reads and CAS rereads therefore retain valid recovery/reset authority.
 * @param {unknown} value @returns {Result<StorageRecord>}
 */
function record(value) {
  if (value === undefined) return succeed(Object.freeze({ generation: 0, primary: succeed(null), backup: succeed(null) }));
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('storage-corrupt');
  const data = /** @type {Record<string,unknown>} */ (value);
  if (Object.keys(data).length !== 3 || !['generation', 'primary', 'backup'].every(key => Object.hasOwn(data, key))
      || !Number.isSafeInteger(data.generation) || typeof data.generation !== 'number' || data.generation < 1) return fail('storage-corrupt');
  return succeed(Object.freeze({ generation: data.generation, primary: slot(data.primary), backup: slot(data.backup) }));
}
/** One namespace, one primary+backup record, atomic generation-checked writes.
 * The browser factory is injected for boundary ownership, not for game tests.
 * @param {()=>IDBFactory} [getFactory] @returns {StorageAdapter}
 */
export function createIndexedDbAdapter(getFactory = () => globalThis.indexedDB) {
  /** @type {IDBDatabase|null} */ let database = null;
  /** @type {Promise<Result<IDBDatabase>>|null} */ let opening = null;
  /** @type {Failure|null} */ let closed = null;
  /** @type {Set<IDBTransaction>} */ const transactions = new Set();
  /** @type {(()=>void)|null} */ let cancelOpen = null;
  /** @param {Failure} reason */
  function closeWith(reason) {
    if (closed) return;
    closed = reason;
    cancelOpen?.();
    for (const transaction of transactions) { try { transaction.abort(); } catch { /* Already completed. */ } }
    database?.close(); database = null;
  }
  /** @returns {Promise<Result<IDBDatabase>>} */
  function open() {
    if (closed) return Promise.resolve(closed);
    if (database) return Promise.resolve(succeed(database));
    if (opening) return opening;
    opening = new Promise(resolve => {
      /** @type {IDBOpenDBRequest} */ let request;
      let settled = false;
      /** @param {Result<IDBDatabase>} result */
      function finish(result) {
        if (settled) return;
        settled = true; cancelOpen = null; resolve(result);
      }
      cancelOpen = () => finish(closed ?? fail('disposed'));
      try { request = getFactory().open(DATABASE, 1); }
      catch (error) { finish(storageFailure(error)); return; }
      request.onblocked = () => finish(fail('storage-unavailable'));
      request.onerror = () => finish(storageFailure(request.error));
      request.onupgradeneeded = () => {
        if (settled || closed) { request.transaction?.abort(); return; }
        request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => {
        const connection = request.result;
        if (settled || closed) { connection.close(); return; }
        connection.onversionchange = () => closeWith(fail('storage-unavailable'));
        connection.onclose = () => closeWith(fail('storage-unavailable'));
        database = connection; finish(succeed(connection));
      };
    });
    // Keep failures sticky; a new adapter is the explicit retry boundary.
    return opening;
  }
  /** All async hashing/validation has already finished before this transaction.
   * Request success is provisional; only oncomplete can report committed data.
   * @param {number|null} expected @param {StorageCandidate|null} candidate @param {CommitGuard} guard
   * @returns {Promise<Result<StorageRecord>>}
   */
  async function transact(expected, candidate, guard) {
    const connection = await open();
    if (!connection.ok) return connection;
    if (closed) return closed;
    return new Promise(resolve => {
      /** @type {IDBTransaction} */ let transaction;
      /** @type {Result<StorageRecord>} */ let result = fail('storage-unavailable');
      try {
        transaction = expected === null
          ? connection.value.transaction(STORE, 'readonly')
          : connection.value.transaction(STORE, 'readwrite', { durability: 'strict' });
      } catch (error) { resolve(storageFailure(error)); return; }
      transactions.add(transaction);
      transaction.oncomplete = () => { transactions.delete(transaction); resolve(result); };
      transaction.onerror = () => { result = storageFailure(transaction.error); };
      transaction.onabort = () => {
        transactions.delete(transaction);
        resolve(closed ?? (result.ok ? storageFailure(transaction.error) : result));
      };
      /** @param {Failure} reason */
      function abort(reason) { result = reason; try { transaction.abort(); } catch { /* Completion handler owns settlement. */ } }
      try {
        const store = transaction.objectStore(STORE);
        const request = store.get(KEY);
        request.onerror = () => { result = storageFailure(request.error); };
        request.onsuccess = () => {
          const current = record(request.result);
          if (!current.ok) { abort(current); return; }
          if (expected === null) { result = current; return; }
          if (current.value.generation !== expected || expected >= Number.MAX_SAFE_INTEGER) { abort(fail('conflict')); return; }
          try {
            if (!guard()) { abort(fail('stale')); return; }
            const next = Object.freeze({ generation: expected + 1, primary: candidate?.primary ?? null, backup: candidate?.backup ?? null });
            const put = store.put(next, KEY);
            put.onerror = () => { result = storageFailure(put.error); };
            put.onsuccess = () => {
              // A disposal or external invalidation between request and commit aborts.
              try { if (!guard()) { abort(fail('stale')); return; } }
              catch { abort(fail('stale')); return; }
              result = record(next);
            };
          } catch (error) { abort(storageFailure(error)); }
        };
      } catch (error) { abort(storageFailure(error)); }
    });
  }
  return Object.freeze({
    read: () => transact(null, null, () => true),
    /** @param {number} expected @param {StorageCandidate} candidate @param {CommitGuard} guard */
    write(expected, candidate, guard) {
      if (![candidate.primary, candidate.backup].every(text => text === null || typeof text === 'string' && withinSaveLimit(text))) return Promise.resolve(fail('too-large'));
      return transact(expected, candidate, guard);
    },
    /** Reset retains a generation tombstone: deleting the record would allow ABA.
     * @param {number} expected @param {CommitGuard} guard
     */
    remove: (expected, guard) => transact(expected, null, guard),
    close: () => closeWith(fail('disposed')),
  });
}
