/** @typedef {{id:string,path:string,sha256:string,encodedBytes:number}} Resource */
/** @template T @typedef {{promise:Promise<T>,release:()=>void}} Lease */
/** @template T @typedef {{definition:Resource,refs:number,controller:AbortController,promise:Promise<T>,resolve:(value:T)=>void,reject:(error:unknown)=>void,value:T|null,started:boolean,settled:boolean}} Entry */

/** Shared bounded fetch ownership. Queued work owns no response buffers; zero
 * references cancel queued/inflight work or immediately evict settled data.
 * A cancelled active reservation remains until its load actually settles.
 * @template T */
export class ArtResourcePool {
  /** @param {number} byteLimit @param {number} entryLimit @param {number} activeLimit @param {(definition:Resource,signal:AbortSignal)=>Promise<T>} load */
  constructor(byteLimit, entryLimit, activeLimit, load) {
    this.byteLimit = byteLimit; this.entryLimit = entryLimit; this.activeLimit = activeLimit; this.load = load;
    /** @type {Map<string,Entry<T>>} */ this.entries = new Map();
    this.reservedBytes = 0; this.peakBytes = 0; this.active = 0; this.disposed = false;
  }
  /** @param {Resource} definition @returns {Lease<T>} */
  acquire(definition) {
    if (this.disposed) throw new Error('Art resources are disposed.');
    let entry = this.entries.get(definition.id);
    if (entry && (entry.controller.signal.aborted || entry.definition.path !== definition.path || entry.definition.sha256 !== definition.sha256 || entry.definition.encodedBytes !== definition.encodedBytes)) throw new Error('Art resource is cancelling or has conflicting identity.');
    if (!entry) {
      if (this.entries.size >= this.entryLimit || definition.encodedBytes < 1 || definition.encodedBytes > this.byteLimit) throw new Error('Art resource queue exceeds its budget.');
      /** @type {(value:T)=>void} */ let resolve = () => {};
      /** @type {(error:unknown)=>void} */ let reject = () => {};
      const promise = new Promise(/** @param {(value:T)=>void} yes */ (yes, no) => { resolve = yes; reject = no; });
      // A caller can release before attaching its consumer; cancellation still
      // rejects that consumer, while never producing an unhandled rejection.
      void promise.catch(() => {});
      entry = { definition, refs: 0, controller: new AbortController(), promise, resolve, reject, value: null, started: false, settled: false };
      this.entries.set(definition.id, entry);
    }
    entry.refs++; const owned = entry; let released = false; this.pump();
    return { promise: entry.promise, release: () => { if (released) return; released = true; owned.refs--; if (owned.refs === 0) this.cancel(owned); } };
  }
  pump() {
    if (this.disposed) return;
    for (const entry of this.entries.values()) {
      // Settled-but-leased data occupies a residency slot too, so fast fetches
      // cannot accumulate parsed metadata while consumers are still awaiting it.
      if (this.active >= this.activeLimit || [...this.entries.values()].filter(e => e.started).length >= this.activeLimit) break;
      if (entry.started || entry.settled || entry.refs === 0 || this.reservedBytes + entry.definition.encodedBytes > this.byteLimit) continue;
      entry.started = true; this.active++; this.reservedBytes += entry.definition.encodedBytes; this.peakBytes = Math.max(this.peakBytes, this.reservedBytes);
      void Promise.resolve().then(() => this.load(entry.definition, entry.controller.signal)).then(value => {
        entry.controller.signal.throwIfAborted(); entry.value = value; entry.resolve(value);
      }).catch(error => entry.reject(error)).finally(() => {
        this.active--; entry.settled = true;
        if (entry.refs === 0 || entry.value === null || this.disposed) this.evict(entry);
        this.pump();
      });
    }
  }
  /** @param {Entry<T>} entry */
  cancel(entry) {
    entry.controller.abort();
    if (!entry.started) { entry.settled = true; entry.reject(new DOMException('Art request cancelled.', 'AbortError')); }
    if (entry.settled) this.evict(entry);
    this.pump();
  }
  /** @param {Entry<T>} entry */
  evict(entry) {
    if (this.entries.get(entry.definition.id) !== entry) return;
    this.entries.delete(entry.definition.id); if (entry.started) this.reservedBytes -= entry.definition.encodedBytes; entry.value = null;
  }
  dispose() { if (this.disposed) return; this.disposed = true; for (const entry of this.entries.values()) this.cancel(entry); }
  get metrics() { return Object.freeze({ reservedBytes: this.reservedBytes, peakBytes: this.peakBytes, active: this.active, queued: [...this.entries.values()].filter(e => !e.started && !e.settled).length, resources: this.entries.size, limitBytes: this.byteLimit }); }
}

/** Release only this consumer on abort; shared fetches survive other references.
 * @template T @param {Lease<T>} lease @param {AbortSignal} signal @returns {Promise<T>} */
export async function withArtLease(lease, signal) {
  const cancel = () => lease.release(); signal.addEventListener('abort', cancel, { once: true });
  try { signal.throwIfAborted(); const value = await lease.promise; signal.throwIfAborted(); return value; }
  catch (error) { lease.release(); throw error; }
  finally { signal.removeEventListener('abort', cancel); }
}
