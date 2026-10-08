import { decodeSave, encodeSave } from './codec.js';
import { fail, succeed, storageFailure } from './results.js';
/** @typedef {import('./contracts.js').CampaignContent} CampaignContent */
/** @typedef {import('./contracts.js').CampaignSnapshot} CampaignSnapshot */
/** @typedef {import('./contracts.js').EncodedSave} EncodedSave */
/** @typedef {import('./contracts.js').StorageAdapter} StorageAdapter */
/** @typedef {import('./contracts.js').StorageRecord} StorageRecord */
/** @typedef {import('./contracts.js').StorageSlot} StorageSlot */
/** @typedef {import('./contracts.js').RequestContext} RequestContext */
/** @typedef {import('./contracts.js').CommitGuard} CommitGuard */
/** @typedef {import('./contracts.js').SlotView} SlotView */
/** @typedef {import('./contracts.js').RecoveryView} RecoveryView */
/** @typedef {import('./contracts.js').SavePreview} SavePreview */
/** @template T @typedef {import('./contracts.js').Result<T>} Result */
/** @typedef {Readonly<{record:StorageRecord,primary:Result<EncodedSave>,backup:Result<EncodedSave>,view:RecoveryView}>} PreparedLoad */
/** @typedef {{context:RequestContext,snapshot:CampaignSnapshot,guard:CommitGuard,autosave:boolean,resolve:(result:Result<StorageRecord>)=>void}} SaveJob */
/** @typedef {{prepareLoad(guard:CommitGuard):Promise<Result<PreparedLoad>>,commit(save:EncodedSave,loaded:PreparedLoad,guard:CommitGuard):Promise<Result<StorageRecord>>,reset(generation:number,guard:CommitGuard):Promise<Result<StorageRecord>>,acceptLoad(generation:number,guard:CommitGuard):Result<null>}} ExclusiveRepository */
/** @typedef {ReturnType<typeof createSaveRepository>} SaveRepository */

/** Untrusted names are plain text, never HTML. @param {EncodedSave} save @returns {SavePreview} */
export function savePreview(save) {
  return Object.freeze({ revision: save.snapshot.revision, savedAt: save.envelope.savedAt, teamName: save.snapshot.profile.teamName, mode: save.snapshot.mode });
}
/** @param {Result<EncodedSave>} result @returns {SlotView} */
function slotView(result) {
  if (result.ok) return Object.freeze({ status: 'ready', preview: savePreview(result.value) });
  return result.code === 'empty' ? Object.freeze({ status: 'empty' }) : Object.freeze({ status: 'unavailable', code: result.code, message: result.message });
}
/** Repository owns all adapter access. A scope is valid only inside exclusive().
 * Saves serialize; waiting autosaves coalesce only within one epoch and slot.
 * @param {{adapter:StorageAdapter,content:CampaignContent,compatibility?:import('./codec.js').SaveCompatibility,now?:()=>string}} options
 */
export function createSaveRepository({ adapter, content, compatibility, now = () => new Date().toISOString() }) {
  let disposed = false;
  /** Last observed/committed generation prevents a later old-tab autosave
   * from adopting another tab's new generation as its write authority.
   * @type {number|null} */ let knownGeneration = null;
  let exclusive = false;
  /** @type {SaveJob[]} */ const queue = [];
  /** @type {Promise<void>|null} */ let running = null;
  /** @param {CommitGuard} guard @returns {boolean} */
  function current(guard) { try { return !disposed && guard(); } catch { return false; } }
  /** @template T @param {()=>Promise<Result<T>>} action @returns {Promise<Result<T>>} */
  async function boundary(action) { try { return await action(); } catch (error) { return storageFailure(error); } }
  /** Preserve individual admission failures without parsing rejected payloads.
   * @param {StorageSlot} slot @returns {Promise<Result<EncodedSave>>}
   */
  async function decodeSlot(slot) {
    if (!slot.ok) return slot;
    return slot.value === null ? fail('empty') : decodeSave(slot.value, content, compatibility);
  }
  /** @param {CommitGuard} guard @returns {Promise<Result<PreparedLoad>>} */
  async function prepareLoad(guard) {
    if (!current(guard)) return fail(disposed ? 'disposed' : 'stale');
    const stored = await boundary(() => adapter.read());
    if (!current(guard)) return fail(disposed ? 'disposed' : 'stale');
    if (!stored.ok) return stored;
    if (knownGeneration === null) knownGeneration = stored.value.generation;
    const primary = await decodeSlot(stored.value.primary);
    if (!current(guard)) return fail(disposed ? 'disposed' : 'stale');
    const backup = await decodeSlot(stored.value.backup);
    if (!current(guard)) return fail(disposed ? 'disposed' : 'stale');
    const view = Object.freeze({ generation: stored.value.generation, primary: slotView(primary), backup: slotView(backup) });
    return succeed(Object.freeze({ record: stored.value, primary, backup, view }));
  }
  /** A bad primary can never be copied over a validated backup.
   * @param {EncodedSave} save @param {PreparedLoad} loaded @param {CommitGuard} guard @returns {Promise<Result<StorageRecord>>}
   */
  async function commit(save, loaded, guard) {
    if (!current(guard)) return fail(disposed ? 'disposed' : 'stale');
    const backup = loaded.primary.ok ? loaded.primary.value.text : loaded.backup.ok ? loaded.backup.value.text : null;
    const result = await boundary(() => adapter.write(loaded.record.generation, Object.freeze({ primary: save.text, backup }), () => current(guard)));
    if (result.ok) knownGeneration = result.value.generation;
    return result;
  }
  /** @param {SaveJob} job @returns {Promise<Result<StorageRecord>>} */
  async function writeJob(job) {
    if (!current(job.guard)) return fail(disposed ? 'disposed' : 'stale');
    const encoded = await encodeSave(job.snapshot, content, now());
    if (!current(job.guard)) return fail(disposed ? 'disposed' : 'stale');
    if (!encoded.ok) return encoded;
    const loaded = await prepareLoad(job.guard);
    if (!loaded.ok) return loaded;
    if (loaded.value.record.generation !== knownGeneration) return fail('conflict');
    // Ordinary saves never erase a present unreadable campaign. Recovery/import
    // are separately confirmed replacement operations; export remains available.
    if (!loaded.value.primary.ok && loaded.value.primary.code !== 'empty') return loaded.value.primary;
    if (loaded.value.primary.ok && loaded.value.primary.value.snapshot.revision > job.snapshot.revision) return fail('conflict');
    return commit(encoded.value, loaded.value, job.guard);
  }
  function pump() {
    if (running || exclusive || disposed || queue.length === 0) return;
    running = Promise.resolve().then(async () => {
      while (!exclusive && !disposed && queue.length) {
        const job = queue.shift();
        if (!job) break;
        const result = await boundary(() => writeJob(job));
        job.resolve(result);
      }
    }).finally(() => { running = null; pump(); });
  }
  /** @param {'stale'|'disposed'} code */
  function invalidateQueued(code) { for (const job of queue.splice(0)) job.resolve(fail(code)); }
  return Object.freeze({
    /** Caller captures a committed immutable snapshot synchronously.
     * @param {RequestContext} context @param {CampaignSnapshot} snapshot @param {CommitGuard} guard @param {boolean} [autosave]
     * @returns {Promise<Result<StorageRecord>>}
     */
    save(context, snapshot, guard, autosave = false) {
      if (disposed || exclusive) return Promise.resolve(fail(disposed ? 'disposed' : 'busy'));
      if (context.sourceRevision !== snapshot.revision || !current(guard)) return Promise.resolve(fail('stale'));
      if (autosave) {
        const older = queue.find(job => job.autosave && job.context.adventureEpoch === context.adventureEpoch && job.context.slotId === context.slotId);
        if (older) {
          if (older.snapshot.revision >= snapshot.revision) return Promise.resolve(fail('superseded'));
          queue.splice(queue.indexOf(older), 1); older.resolve(fail('superseded'));
        }
      }
      if (queue.length >= 64) return Promise.resolve(fail('busy'));
      return new Promise(resolve => { queue.push({ context, snapshot, guard, autosave, resolve }); pump(); });
    },
    prepareLoad,
    /** @param {string} text @returns {Promise<Result<EncodedSave>>} */
    prepareImport: text => disposed ? Promise.resolve(fail('disposed')) : decodeSave(text, content, compatibility),
    /** Export never opens browser storage. @param {CampaignSnapshot} snapshot @returns {Promise<Result<EncodedSave>>} */
    exportSave: snapshot => disposed ? Promise.resolve(fail('disposed')) : encodeSave(snapshot, content, now()),
    /** Invalidate queued old work first, then drain the one running atomic write.
     * A new write cannot enter until the caller releases this scope by returning.
     * @template T @param {(scope:ExclusiveRepository)=>Promise<Result<T>>} action @returns {Promise<Result<T>>}
     */
    async exclusive(action) {
      if (disposed || exclusive) return fail(disposed ? 'disposed' : 'busy');
      exclusive = true; invalidateQueued('stale');
      let active = true;
      /** @param {CommitGuard} guard @returns {CommitGuard} */
      const scoped = guard => () => active && current(guard);
      try {
        await running;
        if (disposed) return fail('disposed');
        const scope = Object.freeze({
          /** A confirmed load adopts the generation it actually validated.
           * @param {number} generation @param {CommitGuard} guard
           */
          acceptLoad(generation, guard) {
            if (!current(scoped(guard))) return fail('stale');
            knownGeneration = generation; return succeed(null);
          },
          /** @param {CommitGuard} guard */
          prepareLoad: guard => prepareLoad(scoped(guard)),
          /** @param {EncodedSave} save @param {PreparedLoad} loaded @param {CommitGuard} guard */
          commit: (save, loaded, guard) => commit(save, loaded, scoped(guard)),
          /** @param {number} generation @param {CommitGuard} guard */
          async reset(generation, guard) {
            if (!current(scoped(guard))) return fail('stale');
            const result = await boundary(() => adapter.remove(generation, scoped(guard)));
            if (result.ok) knownGeneration = result.value.generation;
            return result;
          },
        });
        return await action(scope);
      } catch (error) { return storageFailure(error); }
      finally { active = false; exclusive = false; pump(); }
    },
    /** Synchronous idempotent cancellation. In-flight adapter transactions abort. */
    dispose() { if (disposed) return; disposed = true; invalidateQueued('disposed'); adapter.close(); },
  });
}
