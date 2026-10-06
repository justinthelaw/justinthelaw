import { Texture, NearestFilter, SRGBColorSpace } from '../../vendor/three/three.module.min.js';
import { PIXEL_MANIFEST_SHA256 } from '../../assets/characters/pixel/integrity.js';
/** @typedef {import('../presentation/types.js').ClipId} ClipId */
/** @typedef {{speciesId:string,assetId:string,clip:ClipId,path:string,sha256:string,encodedBytes:number,decodedRgbaBytes:number}} Page */
/** @typedef {{id:ClipId,durationsMs:number[],loop:boolean}} Clip */
/** @typedef {{schemaVersion:number,profile:string,review:string,sourceIndexSha256:string,cell:{width:number,height:number,footAnchor:number[]},page:{width:number,height:number},characters:{speciesId:string,formId:null,worldHeight:number}[],clips:Clip[],pages:Page[]}} Manifest */
/** @typedef {{texture:Texture,bitmap:ImageBitmap}} LoadedPage */
/** @typedef {{page:Page,refs:number,controller:AbortController,promise:Promise<LoadedPage>,loaded:LoadedPage|null,settled:boolean}} Entry */
/** @typedef {{promise:Promise<LoadedPage>,release:()=>void}} PageLease */
export const PAGE_BYTES = 1179648;
export const PAGE_BUDGET = 24 * 1024 * 1024;
const base = new URL('../../assets/characters/pixel/', import.meta.url);
const clipNames = ['idle', 'walk', 'turn', 'attack-physical', 'attack-special', 'cast-status', 'hit-light', 'hit-heavy', 'defeat', 'celebrate', 'rest-sleep', 'interact'];
/** Bounded stream reads before allocation/JSON/decode. @param {URL} url @param {number} limit @param {AbortSignal} signal */
export async function readLocalBytes(url, limit, signal) {
    if (url.origin !== base.origin || !url.pathname.startsWith(new URL('../../', import.meta.url).pathname))
        throw new Error('Art URL leaves the local game.');
    const response = await fetch(url, { signal, redirect: 'error', cache: 'no-cache' });
    if (!response.ok)
        throw new Error(`Art fetch failed (${response.status}).`);
    const reader = response.body?.getReader();
    if (!reader)
        throw new Error('Art response is empty.');
    let length = 0;
    const chunks = [];
    try {
        for (;;) {
            const value = await reader.read();
            if (value.done)
                break;
            length += value.value.byteLength;
            if (length > limit)
                throw new Error('Art response exceeds declared budget.');
            chunks.push(value.value);
        }
    }
    finally {
        await reader.cancel();
        reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return bytes;
}
/** @param {Uint8Array<ArrayBuffer>} bytes */
export async function sha256(bytes) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join(''); }
/** @param {AbortSignal} signal @returns {Promise<Manifest>} */
export async function loadPixelManifest(signal) {
    const manifestBytes = await readLocalBytes(new URL('manifest.json', base), 262144, signal);
    if (await sha256(manifestBytes) !== PIXEL_MANIFEST_SHA256) throw new Error('Pixel manifest integrity failed.');
    /** @type {Manifest} */ const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes));
    if (manifest.schemaVersion !== 1 || manifest.profile !== 'directional-pixel-clip-v2' || manifest.review !== 'starter-provisional-integration' || !/^[a-f0-9]{64}$/.test(manifest.sourceIndexSha256) || manifest.cell?.width !== 96 || manifest.cell.height !== 96 || String(manifest.cell.footAnchor) !== '48,92' || manifest.page?.width !== 384 || manifest.page.height !== 768 || !Array.isArray(manifest.pages) || !Array.isArray(manifest.characters) || !Array.isArray(manifest.clips) || manifest.pages.length > 8192 || manifest.clips.length !== 12)
        throw new Error('Pixel manifest does not match the reviewed contract.');
    const clips = new Set(), keys = new Set(), paths = new Set(), species = new Set();
    for (const clip of manifest.clips) {
        if (!clipNames.includes(clip.id) || clips.has(clip.id) || typeof clip.loop !== 'boolean' || clip.durationsMs.length !== 4 || clip.durationsMs.some(ms => !Number.isSafeInteger(ms) || ms < 1 || ms > 5000))
            throw new Error('Invalid clip timing.');
        clips.add(clip.id);
    }
    for (const character of manifest.characters) {
        if (!/^pokemon-\d{3}$/.test(character.speciesId) || character.formId !== null || species.has(character.speciesId) || !Number.isFinite(character.worldHeight) || character.worldHeight <= 0 || character.worldHeight > 16)
            throw new Error('Invalid character identity/scale.');
        species.add(character.speciesId);
    }
    for (const page of manifest.pages) {
        const key = `${page.speciesId}:${page.clip}`;
        if (keys.has(key) || paths.has(page.path) || !species.has(page.speciesId) || !clips.has(page.clip) || page.assetId !== `character.${page.speciesId}.default.pixel-v2` || !/^[a-z0-9-]+\.png$/.test(page.path) || !/^[a-f0-9]{64}$/.test(page.sha256) || !Number.isSafeInteger(page.encodedBytes) || page.encodedBytes < 1 || page.encodedBytes >= 1048576 || page.decodedRgbaBytes !== PAGE_BYTES)
            throw new Error('Invalid pixel page declaration.');
        keys.add(key);
        paths.add(page.path);
    }
    if (keys.size !== species.size * 12)
        throw new Error('Incomplete declared clip coverage.');
    return manifest;
}
/** Reference counted pages. Reservations persist until an aborted decode settles.
 * No idle-page cache, speculative roster preloads, hidden references or unbounded queue.
 */
export class ClipPageCache {
    constructor() {
        /** @type {Map<string,Entry>} */ this.entries = new Map();
        this.reservedBytes = 0;
        this.peakBytes = 0;
        this.disposedPages = 0;
        this.disposed = false;
    }
    /** @param {Page} page @returns {PageLease} */
    acquire(page) {
        if (this.disposed)
            throw new Error('Pixel cache is disposed.');
        const key = page.path;
        let entry = this.entries.get(key);
        if (entry && (entry.page.sha256 !== page.sha256 || entry.controller.signal.aborted))
            throw new Error('Pixel page is still cancelling; retry the presentation sync.');
        if (!entry) {
            if (this.reservedBytes + PAGE_BYTES > PAGE_BUDGET)
                throw new Error('Visible character art exceeds the 24 MiB page budget.');
            this.reservedBytes += PAGE_BYTES;
            this.peakBytes = Math.max(this.peakBytes, this.reservedBytes);
            const controller = new AbortController();
            entry = { page, refs: 0, controller, promise: Promise.resolve(/** @type {LoadedPage} */ ({})), loaded: null, settled: false };
            const owned = entry;
            this.entries.set(key, owned);
            owned.promise = this.load(page, controller.signal).then(loaded => { owned.loaded = loaded; return loaded; }).finally(() => { owned.settled = true; if (owned.refs === 0 || this.disposed || !owned.loaded)
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
    /** @param {Page} page @param {AbortSignal} signal @returns {Promise<LoadedPage>} */
    async load(page, signal) {
        const bytes = await readLocalBytes(new URL(page.path, base), page.encodedBytes, signal);
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
        return; this.disposed = true; for (const [key, entry] of this.entries) {
        entry.controller.abort();
        if (entry.settled)
            this.evict(key, entry);
    } }
    get metrics() { return Object.freeze({ reservedBytes: this.reservedBytes, peakBytes: this.peakBytes, residentPages: [...this.entries.values()].filter(entry => entry.loaded).length, inflightPages: [...this.entries.values()].filter(entry => !entry.settled).length, disposedPages: this.disposedPages, limitBytes: PAGE_BUDGET }); }
}
