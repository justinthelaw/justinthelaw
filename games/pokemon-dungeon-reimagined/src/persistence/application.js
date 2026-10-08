import { snapshotPlainData } from '../domain/state.js';
import { savePreview } from './repository.js';
import { MAX_SAVE_BYTES } from './codec.js';
import { fail, succeed } from './results.js';
/** @typedef {import('./contracts.js').CampaignSnapshot} CampaignSnapshot */
/** @typedef {import('./contracts.js').RequestContext} RequestContext */
/** @typedef {import('./contracts.js').PersistenceNotification} PersistenceNotification */
/** @typedef {import('./contracts.js').Operation} Operation */
/** @typedef {import('./contracts.js').EncodedSave} EncodedSave */
/** @typedef {import('./contracts.js').SavePreview} SavePreview */
/** @typedef {import('./contracts.js').RecoveryView} RecoveryView */
/** @typedef {import('./repository.js').SaveRepository} SaveRepository */
/** @typedef {import('./repository.js').PreparedLoad} PreparedLoad */
/** @template T @typedef {import('./contracts.js').Result<T>} Result */
/** @typedef {'primary'|'backup'|'import'|'new-game'|'persist'|'reset'} ReplacementSource */
/** @typedef {Readonly<{requestId:symbol,context:RequestContext,source:ReplacementSource,storageMode:'durable'|'memory',message:string,preview:SavePreview|null,requiresConfirmation:true}>} ReplacementRequest */
/** @typedef {{save:EncodedSave|null,generation:number|null,source:ReplacementSource,storageMode:'durable'|'memory'}} PreparedReplacement */
/** @typedef {Readonly<{context:RequestContext,view:RecoveryView,primary:ReplacementRequest|null,backup:ReplacementRequest|null}>} LoadPreparation */
/** @template T @typedef {Readonly<{result:Result<T>,notification:PersistenceNotification|null,status:'complete'|'failed'|'unsaved'}>} ApplicationResult */
/** @template T @typedef {Readonly<{adventureEpoch:symbol,slotId:'campaign',instance:T|null}>} Binding */

/** @param {RequestContext} left @param {RequestContext} right @param {boolean} [revision] */
function sameContext(left, right, revision = true) {
  return left.adventureEpoch === right.adventureEpoch && left.slotId === right.slotId && (!revision || left.sourceRevision === right.sourceRevision);
}
/** Notifications are inert immutable display values; applying one cannot bind.
 * @param {PersistenceNotification} notification @param {RequestContext} current
 */
export function notificationApplies(notification, current) { return sameContext(notification, current, false); }
/** An older successful checkpoint must never mark newer progress saved.
 * @param {PersistenceNotification} notification @param {RequestContext} current
 */
export function notificationMarksSaved(notification, current) {
  return notification.type === 'storageSucceeded' && notification.operation === 'save' && sameContext(notification, current);
}

/** Application-owned binding cell. bind() is a synchronous, side-effect-free
 * constructor: return a NEW detached instance whose getCurrent result is exactly
 * the supplied frozen snapshot. It must not publish or mutate the old instance.
 * The service, not a user callback, publishes the pointer after durable commit.
 * Every command entry must check canAcceptCommands() and resolve getBinding().
 * pause() only suspends external input; its nonthrowing synchronous release must
 * not dispatch a command. Observer delivery belongs after the returned promise.
 * @template {object} T
 * @param {{repository:SaveRepository,initial:T|null,getCurrent:(instance:T)=>CampaignSnapshot,bind:(snapshot:CampaignSnapshot)=>T,pause:()=>()=>void}} options
 */
export function createPersistenceService({ repository, initial, getCurrent, bind, pause }) {
  /** @type {Binding<T>} */ let binding = Object.freeze({ adventureEpoch: Symbol('campaign-epoch'), slotId: 'campaign', instance: initial });
  let disposed = false;
  let disposalRequested = false;
  let committing = false;
  let paused = false;
  let memoryOnly = initial !== null;
  let queuedReplacements = 0;
  /** @type {Promise<unknown>} */ let transition = Promise.resolve();
  /** @type {RequestContext|null} */ let durable = null;
  /** @type {WeakMap<ReplacementRequest,PreparedReplacement>} */ const prepared = new WeakMap();
  /** @type {WeakSet<object>} */ const boundInstances = new WeakSet();
  if (initial) boundInstances.add(initial);
  /** @returns {RequestContext} */
  function context() {
    return Object.freeze({ adventureEpoch: binding.adventureEpoch, slotId: binding.slotId,
      sourceRevision: binding.instance === null ? null : getCurrent(binding.instance).revision });
  }
  /** @param {RequestContext} captured @param {boolean} [revision] @returns {boolean} */
  function matches(captured, revision = true) {
    try { return !disposed && sameContext(captured, context(), revision); } catch { return false; }
  }
  /** Detached capture before any asynchronous step; callbacks cannot alias saves.
   * @returns {{context:RequestContext,snapshot:CampaignSnapshot|null}}
   */
  function capture() {
    const snapshot = binding.instance === null ? null : getCurrent(binding.instance);
    const captured = Object.freeze({ adventureEpoch: binding.adventureEpoch, slotId: binding.slotId, sourceRevision: snapshot?.revision ?? null });
    return { context: captured, snapshot: snapshot === null ? null : /** @type {CampaignSnapshot} */ (/** @type {unknown} */ (snapshotPlainData(snapshot))) };
  }
  /** @template V @param {RequestContext} captured @param {Operation} operation @param {Result<V>} result @returns {ApplicationResult<V>} */
  function outcome(captured, operation, result) {
    /** @type {PersistenceNotification} */
    const notification = Object.freeze({ notificationId: Symbol('persistence-notification'), ...captured,
      type: result.ok ? 'storageSucceeded' : 'storageFailed', operation,
      message: result.ok ? ({ save: 'Checkpoint saved.', load: 'Saved campaign loaded.', export: 'Save file prepared. Download it to keep a copy.', import: 'Campaign imported.', reset: 'Saved campaign reset.' })[operation] : result.message,
      ...(!result.ok ? { errorCode: result.code } : {}) });
    return Object.freeze({ result, notification, status: result.ok ? 'complete' : 'failed' });
  }
  /** @param {RequestContext} captured @param {PreparedReplacement} value @returns {ReplacementRequest} */
  function request(captured, value) {
    const token = Object.freeze({ requestId: Symbol('replacement-request'), context: captured, source: value.source, storageMode: value.storageMode,
      message: value.storageMode === 'memory' ? 'This campaign will be unsaved in this browser. The existing browser save stays unchanged. Export to keep a copy.' : 'Confirm replacing the current campaign with this preview.',
      preview: value.save === null ? null : savePreview(value.save), requiresConfirmation: /** @type {const} */ (true) });
    prepared.set(token, value); return token;
  }
  /** @param {RequestContext} captured @param {PreparedLoad} loaded @returns {LoadPreparation} */
  function loadView(captured, loaded) {
    return Object.freeze({ context: captured, view: loaded.view,
      primary: loaded.primary.ok ? request(captured, { save: loaded.primary.value, generation: loaded.record.generation, source: 'primary', storageMode: 'durable' }) : null,
      backup: loaded.backup.ok ? request(captured, { save: loaded.backup.value, generation: loaded.record.generation, source: 'backup', storageMode: 'durable' }) : null });
  }
  /** @param {RequestContext} captured @param {EncodedSave} save @param {'import'|'new-game'|'persist'} source @param {'durable'|'memory'} storageMode @returns {Promise<Result<ReplacementRequest>>} */
  async function prepareCandidate(captured, save, source, storageMode) {
    if (storageMode !== 'durable' && storageMode !== 'memory') return fail('invalid');
    if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
    if (storageMode === 'memory') return succeed(request(captured, { save, generation: null, source, storageMode }));
    const loaded = await repository.prepareLoad(() => matches(captured));
    if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
    if (!loaded.ok) return loaded;
    return succeed(request(captured, { save, generation: loaded.value.record.generation, source, storageMode }));
  }
  /** @param {ReplacementRequest} token @param {PreparedReplacement} value @returns {Promise<Result<Binding<T>>>} */
  async function replace(token, value) {
    const captured = token.context;
    if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
    paused = true;
    /** @type {(()=>void)|null} */ let resume = null;
    try {
      resume = pause();
      if (typeof resume !== 'function') return fail('binding-failed');
      return await repository.exclusive(async scope => {
        const guard = () => matches(captured) && paused;
        // exclusive() has drained the already-running old checkpoint.
        if (!guard()) return fail(disposed ? 'disposed' : 'stale');
        const loaded = value.storageMode === 'memory' ? null : await scope.prepareLoad(guard);
        if (!guard()) return fail(disposed ? 'disposed' : 'stale');
        if (loaded && !loaded.ok) return loaded;
        if (loaded && loaded.value.record.generation !== value.generation) return fail('conflict');
        const save = value.source === 'primary' && loaded ? loaded.value.primary : value.source === 'backup' && loaded ? loaded.value.backup : value.save === null ? null : succeed(value.save);
        if (save && !save.ok) return save;
        /** @type {T|null} */ let instance = null;
        if (save?.ok) {
          try {
            instance = bind(save.value.snapshot);
            if (!instance || typeof instance !== 'object' || 'then' in instance || boundInstances.has(instance)
                || getCurrent(instance) !== save.value.snapshot) return fail('binding-failed');
          } catch { return fail('binding-failed'); }
        }
        // Allocate the complete next binding before storage commit; publication
        // below is one private pointer assignment and has no callback/await.
        /** @type {Binding<T>} */
        const next = Object.freeze({ adventureEpoch: Symbol('campaign-epoch'), slotId: 'campaign', instance });
        const nextDurable = Object.freeze({ adventureEpoch: next.adventureEpoch, slotId: next.slotId, sourceRevision: save?.ok ? save.value.snapshot.revision : null });
        if (!guard()) return fail(disposed ? 'disposed' : 'stale');
        if (value.storageMode === 'durable' && value.source !== 'primary' && loaded) {
          committing = true;
          const committed = save?.ok ? await scope.commit(save.value, loaded.value, guard) : await scope.reset(loaded.value.record.generation, guard);
          if (!committed.ok) return committed;
          // Commands and replacements remain exclusively paused through this
          // resume point. dispose() is deferred during this final commit window.
        }
        if (!guard()) return fail(disposed ? 'disposed' : 'stale');
        if (value.source === 'primary' && loaded) {
          const adopted = scope.acceptLoad(loaded.value.record.generation, guard);
          if (!adopted.ok) return adopted;
        }
        if (instance) boundInstances.add(instance);
        binding = next; memoryOnly = value.storageMode === 'memory';
        durable = memoryOnly ? null : nextDurable;
        return succeed(next);
      });
    } catch { return fail('binding-failed'); }
    finally {
      // No observer callbacks are invoked here. Input release cannot alter the
      // binding; a faulty release leaves the service paused until disposal.
      committing = false;
      try { resume?.(); paused = false; } catch { paused = true; }
      if (disposalRequested && !disposed) { disposed = true; repository.dispose(); }
    }
  }
  return Object.freeze({
    getBinding: () => binding,
    getContext: context,
    canAcceptCommands: () => !disposed && !disposalRequested && !paused,
    isCurrentRevisionSaved: () => durable !== null && durable.sourceRevision !== null && matches(durable),
    /** Queue only after a completed state-changing domain transaction.
     * @param {boolean} [autosave] @returns {Promise<ApplicationResult<import('./contracts.js').StorageRecord>>}
     */
    async save(autosave = false) {
      const captured = capture();
      if (disposed || paused) return outcome(captured.context, 'save', fail(disposed ? 'disposed' : 'busy'));
      if (!captured.snapshot) return outcome(captured.context, 'save', fail('empty'));
      if (memoryOnly) return outcome(captured.context, 'save', fail('memory-only'));
      const result = await repository.save(captured.context, captured.snapshot, () => matches(captured.context, false), autosave);
      if (result.ok && matches(captured.context)) durable = captured.context;
      if (!result.ok && result.code === 'conflict' && matches(captured.context, false)) durable = null;
      return outcome(captured.context, 'save', result);
    },
    /** File preparation works with denied/quota-limited browser storage.
     * @returns {Promise<ApplicationResult<EncodedSave>>}
     */
    async exportSave() {
      const captured = capture();
      if (disposed || !captured.snapshot) return outcome(captured.context, 'export', fail(disposed ? 'disposed' : 'empty'));
      const result = await repository.exportSave(captured.snapshot);
      return outcome(captured.context, 'export', matches(captured.context, false) ? result : fail(disposed ? 'disposed' : 'stale'));
    },
    /** Preparation exposes both validations; never automatically loads backup.
     * @returns {Promise<Result<LoadPreparation>>}
     */
    async prepareLoad() {
      const captured = capture().context;
      const loaded = await repository.prepareLoad(() => matches(captured));
      if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
      return loaded.ok ? succeed(loadView(captured, loaded.value)) : loaded;
    },
    /** @param {string} text @param {'durable'|'memory'} [storageMode] @returns {Promise<Result<ReplacementRequest>>} */
    async prepareImport(text, storageMode = 'durable') {
      const captured = capture().context;
      const save = await repository.prepareImport(text);
      if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
      return save.ok ? prepareCandidate(captured, save.value, 'import', storageMode) : save;
    },
    /** Check Blob size BEFORE reading or parsing; capture BEFORE file I/O.
     * @param {Blob} file @param {'durable'|'memory'} [storageMode] @returns {Promise<Result<ReplacementRequest>>}
     */
    async prepareImportFile(file, storageMode = 'durable') {
      const captured = capture().context;
      if (file.size > MAX_SAVE_BYTES) return fail('too-large');
      /** @type {string} */ let text;
      try { text = await file.text(); } catch { return fail('invalid'); }
      if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
      const save = await repository.prepareImport(text);
      if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
      return save.ok ? prepareCandidate(captured, save.value, 'import', storageMode) : save;
    },
    /** P19 supplies a fully validated new-game snapshot; no defaults are made.
     * @param {CampaignSnapshot} snapshot @param {'durable'|'memory'} [storageMode] @returns {Promise<Result<ReplacementRequest>>}
     */
    async prepareNewGame(snapshot, storageMode = 'durable') {
      const captured = capture().context;
      const save = await repository.exportSave(snapshot);
      if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
      return save.ok ? prepareCandidate(captured, save.value, 'new-game', storageMode) : save;
    },
    /** Explicitly preview moving a memory-only campaign into the browser slot.
     * Autosave never crosses this destructive-replacement boundary.
     * @returns {Promise<Result<ReplacementRequest>>}
     */
    async preparePersistCurrent() {
      const captured = capture();
      if (!captured.snapshot) return fail('empty');
      const save = await repository.exportSave(captured.snapshot);
      if (!matches(captured.context)) return fail(disposed ? 'disposed' : 'stale');
      return save.ok ? prepareCandidate(captured.context, save.value, 'persist', 'durable') : save;
    },
    /** Reset confirmation is tied to both live revision and durable generation.
     * @returns {Promise<Result<ReplacementRequest>>}
     */
    async prepareReset() {
      const captured = capture().context;
      const loaded = await repository.prepareLoad(() => matches(captured));
      if (!matches(captured)) return fail(disposed ? 'disposed' : 'stale');
      return loaded.ok ? succeed(request(captured, { save: null, generation: loaded.value.record.generation, source: 'reset', storageMode: 'durable' })) : loaded;
    },
    /** UI passes the exact preview token only after explicit confirmation. Tokens
     * are single-use and cannot refresh their context or impersonate a new epoch.
     * @param {ReplacementRequest} token @param {boolean} confirmed @returns {Promise<ApplicationResult<Binding<T>>>}
     */
    async confirmReplacement(token, confirmed) {
      const value = prepared.get(token);
      const operation = token.source === 'reset' ? 'reset' : token.source === 'import' ? 'import' : token.source === 'new-game' || token.source === 'persist' ? 'save' : 'load';
      if (!value || confirmed !== true) return outcome(token.context, operation, fail('confirmation-required'));
      prepared.delete(token);
      if (disposed || queuedReplacements >= 64) return outcome(token.context, operation, fail(disposed ? 'disposed' : 'busy'));
      queuedReplacements++;
      const work = transition.then(() => replace(token, value));
      transition = work.catch(() => undefined);
      try {
        const result = await work;
        if (value.storageMode === 'memory' && result.ok) return Object.freeze({ result, notification: null, status: 'unsaved' });
        return outcome(token.context, operation, result);
      }
      finally { queuedReplacements--; }
    },
    /** Cancels a preview without touching the campaign or storage. @param {ReplacementRequest} token */
    cancelReplacement(token) { prepared.delete(token); },
    /** Idempotent cancellation; all already-returned operations still settle. */
    dispose() {
      if (disposed || disposalRequested) return;
      disposalRequested = true;
      if (!committing) { disposed = true; repository.dispose(); }
    },
  });
}
