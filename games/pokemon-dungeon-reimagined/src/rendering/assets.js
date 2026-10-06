import { Texture, NearestFilter, SRGBColorSpace } from '../../vendor/three/three.module.min.js';
import { sha256 } from './asset-io.js';
import { PAGE_BYTES, PAGE_BUDGET, MAX_PNG_BYTES, MAX_SHARD_BYTES, MAX_BUNDLE_BYTES, identityKey, loadPixelShard, readArtResource } from './pixel-catalog.js';
import { ArtResourcePool, withArtLease } from './art-resources.js';
export { readLocalBytes, sha256 } from './asset-io.js';
export { PAGE_BYTES, PAGE_BUDGET, loadPixelManifest } from './pixel-catalog.js';
/** @typedef {import('./pixel-catalog.js').Manifest} Manifest */
/** @typedef {import('./pixel-catalog.js').Character} Character */
/** @typedef {import('./pixel-catalog.js').Clip} Clip */
/** @typedef {import('./pixel-catalog.js').Page} Page */
/** @typedef {{texture:Texture,bitmap:ImageBitmap}} LoadedPage */
/** @typedef {{character:Character,clip:Clip,refs:number,controller:AbortController,promise:Promise<LoadedPage>,loaded:LoadedPage|null,settled:boolean}} Entry */
/** @typedef {{promise:Promise<LoadedPage>,release:()=>void}} PageLease */
/** Reference counted pages. Reservations persist until an aborted decode settles.
 * No idle-page cache, speculative roster preloads, hidden references or unbounded queue.
 */
export class ClipPageCache {
    constructor() {
        /** @type {Map<string,Entry>} */ this.entries = new Map();
        /** @type {Manifest|null} */ this.manifest = null;
        /** @type {ArtResourcePool<import('./pixel-catalog.js').Shard>} */ this.metadata = new ArtResourcePool(MAX_SHARD_BYTES * 2, 21, 2, (definition, signal) => {
            if (!this.manifest) throw new Error('Pixel directory is unavailable.');
            return loadPixelShard(definition, this.manifest, signal);
        });
        /** @type {ArtResourcePool<Uint8Array<ArrayBuffer>>} */ this.bundles = new ArtResourcePool(MAX_BUNDLE_BYTES * 2, 21, 2, readArtResource);
        this.reservedBytes = 0;
        this.peakBytes = 0;
        this.disposedPages = 0;
        this.disposed = false;
    }
    /** @param {Character} character @param {Clip} clip @param {Manifest} manifest @returns {PageLease} */
    acquire(character, clip, manifest) {
        if (this.disposed)
            throw new Error('Pixel cache is disposed.');
        if (this.manifest && this.manifest !== manifest) throw new Error('A pixel cache cannot mix catalog revisions.');
        this.manifest = manifest;
        const key = `${identityKey(character)}:${clip.id}`;
        let entry = this.entries.get(key);
        if (entry && (entry.character.assetId !== character.assetId || entry.controller.signal.aborted))
            throw new Error('Pixel page is still cancelling; retry the presentation sync.');
        if (!entry) {
            if (this.reservedBytes + PAGE_BYTES > PAGE_BUDGET)
                throw new Error('Visible character art exceeds the 24 MiB page budget.');
            this.reservedBytes += PAGE_BYTES;
            this.peakBytes = Math.max(this.peakBytes, this.reservedBytes);
            const controller = new AbortController();
            entry = { character, clip, refs: 0, controller, promise: Promise.resolve(/** @type {LoadedPage} */ ({})), loaded: null, settled: false };
            const owned = entry;
            this.entries.set(key, owned);
            owned.promise = this.load(character, clip, manifest, controller.signal).then(loaded => { owned.loaded = loaded; return loaded; }).finally(() => { owned.settled = true; if (owned.refs === 0 || this.disposed || !owned.loaded)
                this.evict(key, owned); });
        }
        entry.refs++;
        const owned = entry;
        let released = false;
        return { promise: owned.promise, release: () => { if (released)
                return; released = true; owned.refs--; if (owned.refs === 0) {
                owned.controller.abort();
                if (owned.settled)
                    this.evict(key, owned);
            } } };
    }
    /** Lazy metadata and bundle ownership ends before PNG hash/decode. Each
     * extracted PNG has its own <=64KiB reservation within the 21 page slots.
     * @param {Character} character @param {Clip} clip @param {Manifest} manifest @param {AbortSignal} signal */
    async pngBytes(character, clip, manifest, signal) {
        const definition = manifest.shards.find(shard => shard.id === character.shardId);
        if (!definition) throw new Error('Missing exact character metadata.');
        const metadata = this.metadata.acquire(definition);
        /** @type {Page} */ let page;
        try {
            const shard = await withArtLease(metadata, signal);
            const found = shard.pages.find(page => page.speciesId === character.speciesId && page.formId === character.formId && page.clip === clip.id);
            if (!found) throw new Error('Missing exact species/form/clip page.');
            page = { ...found };
        } finally { metadata.release(); }
        const bundle = manifest.bundles.find(bundle => bundle.id === page.bundleId);
        if (!bundle) throw new Error('Missing declared PNG bundle.');
        const lease = this.bundles.acquire(bundle);
        try {
            const packed = await withArtLease(lease, signal);
            return { page, bytes: packed.slice(page.offset, page.offset + page.encodedBytes) };
        } finally { lease.release(); }
    }
    /** @param {Character} character @param {Clip} clip @param {Manifest} manifest @param {AbortSignal} signal @returns {Promise<LoadedPage>} */
    async load(character, clip, manifest, signal) {
        const { page, bytes } = await this.pngBytes(character, clip, manifest, signal);
        if (bytes.length !== page.encodedBytes || await sha256(bytes) !== page.sha256)
            throw new Error(`Character art integrity failed: ${page.path}`);
        signal.throwIfAborted();
        const view = new DataView(bytes.buffer);
        if (bytes.length < 33 || view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a || view.getUint32(16) !== 384 || view.getUint32(20) !== 768 || bytes[24] !== 8 || bytes[25] !== 6)
            throw new Error('Character PNG format mismatch.');
        const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }), { premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'flipY' });
        if (signal.aborted || bitmap.width !== 384 || bitmap.height !== 768) {
            bitmap.close();
            throw new Error('Character decode cancelled or wrong dimensions.');
        }
        const texture = new Texture(bitmap);
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;
        texture.generateMipmaps = false;
        texture.flipY = false;
        texture.needsUpdate = true;
        return { texture, bitmap };
    }
    /** @param {string} key @param {Entry} entry */
    evict(key, entry) {
        if (this.entries.get(key) !== entry)
            return;
        this.entries.delete(key);
        this.reservedBytes -= PAGE_BYTES;
        if (entry.loaded) {
            entry.loaded.texture.dispose();
            entry.loaded.bitmap.close();
            entry.loaded = null;
            this.disposedPages++;
        }
    }
    dispose() { if (this.disposed)
        return; this.disposed = true; this.metadata.dispose(); this.bundles.dispose(); for (const [key, entry] of this.entries) {
        entry.controller.abort();
        if (entry.settled)
            this.evict(key, entry);
    } }
    get metrics() { return Object.freeze({ reservedBytes: this.reservedBytes, peakBytes: this.peakBytes, residentPages: [...this.entries.values()].filter(entry => entry.loaded).length, inflightPages: [...this.entries.values()].filter(entry => !entry.settled).length, disposedPages: this.disposedPages, limitBytes: PAGE_BUDGET, pngReservedBytes: this.entries.size * MAX_PNG_BYTES, transientBufferLimitBytes: 3 * (2 * MAX_BUNDLE_BYTES + 2 * MAX_SHARD_BYTES) + 2 * 21 * MAX_PNG_BYTES, metadata: this.metadata.metrics, bundles: this.bundles.metrics }); }
}
