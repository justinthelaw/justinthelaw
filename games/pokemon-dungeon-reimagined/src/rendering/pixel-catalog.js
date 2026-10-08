import { PIXEL_MANIFEST_SHA256 } from '../../assets/characters/pixel/integrity.js';
import { readLocalBytes, sha256 } from './asset-io.js';
/** @typedef {import('../presentation/types.js').ClipId} ClipId */
/** @typedef {{id:ClipId,durationsMs:number[],loop:boolean}} Clip */
/** @typedef {{profileId:string,speciesId:string,formId:string|null,assetId:string,worldHeight:number,shardId:string}} Character */
/** @typedef {import('./art-resources.js').Resource} Resource */
/** @typedef {Resource & {shardId:string}} Bundle */
/** @typedef {{profileId:string,speciesId:string,formId:string|null,assetId:string,clip:ClipId,path:string,sha256:string,encodedBytes:number,decodedRgbaBytes:number,bundleId:string,offset:number}} Page */
/** @typedef {{schemaVersion:number,profile:string,review:string,sourceManifestSha256:string,cell:{width:number,height:number,footAnchor:number[]},page:{width:number,height:number},characters:Character[],clips:Clip[],shards:Resource[],bundles:Bundle[],pageCount:number}} Manifest */
/** @typedef {{schemaVersion:number,id:string,pages:Page[]}} Shard */
export const PAGE_BYTES = 1179648;
export const PAGE_BUDGET = 24 * 1024 * 1024;
export const MAX_PNG_BYTES = 64 * 1024;
export const MAX_SHARD_BYTES = 128 * 1024;
export const MAX_BUNDLE_BYTES = 900 * 1024;
export const PIXEL_BASE = new URL('../../assets/characters/pixel/', import.meta.url);
const clipNames = ['idle', 'walk', 'turn', 'attack-physical', 'attack-special', 'cast-status', 'hit-light', 'hit-heavy', 'defeat', 'celebrate', 'rest-sleep', 'interact'];
/** @param {{speciesId:string,formId:string|null}} identity */
export function identityKey(identity) { return JSON.stringify([identity.speciesId, identity.formId]); }
/** @param {unknown} value */
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
/** @param {number} value @param {number} min @param {number} max */
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
/** @template T @param {T} value @returns {T} */
function freeze(value) { if (value && typeof value === 'object') { for (const item of Object.values(value)) freeze(item); Object.freeze(value); } return value; }
/** @param {Resource} definition @param {AbortSignal} signal */
export async function readArtResource(definition, signal) {
  const bytes = await readLocalBytes(new URL(definition.path, PIXEL_BASE), definition.encodedBytes, signal);
  if (bytes.length !== definition.encodedBytes || await sha256(bytes) !== definition.sha256) throw new Error(`Art resource integrity failed: ${definition.id}`);
  signal.throwIfAborted(); return bytes;
}
/** Root directory only: no page metadata, bundles or PNGs are preloaded.
 * @param {AbortSignal} signal @returns {Promise<Manifest>} */
export async function loadPixelManifest(signal) {
  const bytes = await readLocalBytes(new URL('manifest.json', PIXEL_BASE), 262144, signal);
  if (await sha256(bytes) !== PIXEL_MANIFEST_SHA256) throw new Error('Pixel manifest integrity failed.');
  signal.throwIfAborted();
  /** @type {Manifest} */ const m = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (m.schemaVersion !== 2 || m.profile !== 'directional-pixel-clip-v2' || m.review !== 'roster-provisional-integration' || !digest(m.sourceManifestSha256) || m.cell?.width !== 96 || m.cell.height !== 96 || String(m.cell.footAnchor) !== '48,92' || m.page?.width !== 384 || m.page.height !== 768 || !Array.isArray(m.characters) || m.characters.length !== 419 || !Array.isArray(m.clips) || m.clips.length !== 12 || !Array.isArray(m.shards) || m.shards.length !== 27 || !Array.isArray(m.bundles) || m.bundles.length > 128 || m.pageCount !== 5028) throw new Error('Pixel directory does not match its contract.');
  const clips = new Set(), profiles = new Set(), identities = new Set(), shardIds = new Set(), bundleIds = new Set(), paths = new Set();
  for (const clip of m.clips) {
    if (!clipNames.includes(clip.id) || clips.has(clip.id) || typeof clip.loop !== 'boolean' || !Array.isArray(clip.durationsMs) || clip.durationsMs.length !== 4 || clip.durationsMs.some(ms => !integer(ms, 1, 5000))) throw new Error('Invalid clip timing.');
    clips.add(clip.id);
  }
  for (const shard of m.shards) {
    if (!/^pages-\d{2}$/.test(shard.id) || shard.path !== `${shard.id}.json` || shardIds.has(shard.id) || !digest(shard.sha256) || !integer(shard.encodedBytes, 1, MAX_SHARD_BYTES)) throw new Error('Invalid pixel metadata shard.');
    shardIds.add(shard.id); paths.add(shard.path);
  }
  for (const character of m.characters) {
    if (!/^[a-z0-9-]{1,64}$/.test(character.profileId) || !/^pokemon-\d{3}$/.test(character.speciesId) || !(character.formId === null || typeof character.formId === 'string' && /^[a-z0-9-]{1,64}$/.test(character.formId) && character.formId !== 'default') || character.assetId !== `character.${character.speciesId}.${character.formId ?? 'default'}.pixel-v2` || profiles.has(character.profileId) || identities.has(identityKey(character)) || !shardIds.has(character.shardId) || !Number.isFinite(character.worldHeight) || character.worldHeight <= 0 || character.worldHeight > 16) throw new Error('Invalid exact character identity.');
    profiles.add(character.profileId); identities.add(identityKey(character));
  }
  for (const shard of m.shards) { const count = m.characters.filter(c => c.shardId === shard.id).length; if (count < 1 || count > 16) throw new Error('Invalid shard identity coverage.'); }
  for (const bundle of m.bundles) {
    if (!/^bundle-\d{3}$/.test(bundle.id) || bundle.path !== `${bundle.id}.bin` || paths.has(bundle.path) || bundleIds.has(bundle.id) || !shardIds.has(bundle.shardId) || !digest(bundle.sha256) || !integer(bundle.encodedBytes, 1, MAX_BUNDLE_BYTES)) throw new Error('Invalid PNG bundle.');
    bundleIds.add(bundle.id); paths.add(bundle.path);
  }
  return freeze(m);
}
/** A shard owns complete, disjoint bundles. This permits overlap/closure checks
 * on demand without fetching metadata for any other species group.
 * @param {Resource} definition @param {Manifest} manifest @param {AbortSignal} signal @returns {Promise<Shard>} */
export async function loadPixelShard(definition, manifest, signal) {
  const bytes = await readArtResource(definition, signal);
  /** @type {Shard} */ const shard = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const characters = manifest.characters.filter(c => c.shardId === definition.id);
  if (shard.schemaVersion !== 2 || shard.id !== definition.id || !Array.isArray(shard.pages) || shard.pages.length !== characters.length * 12) throw new Error('Invalid shard page count.');
  const keys = new Set(), paths = new Set();
  for (const page of shard.pages) {
    const character = characters.find(c => c.profileId === page.profileId); const bundle = manifest.bundles.find(b => b.id === page.bundleId); const key = `${identityKey(page)}:${page.clip}`;
    if (!character || character.speciesId !== page.speciesId || character.formId !== page.formId || character.assetId !== page.assetId || !clipNames.includes(page.clip) || keys.has(key) || !/^[a-z0-9-]+\.png$/.test(page.path) || paths.has(page.path) || !digest(page.sha256) || !integer(page.encodedBytes, 1, MAX_PNG_BYTES) || page.decodedRgbaBytes !== PAGE_BYTES || !bundle || bundle.shardId !== definition.id || !integer(page.offset, 0, bundle.encodedBytes - page.encodedBytes)) throw new Error('Invalid pixel page identity/range.');
    keys.add(key); paths.add(page.path);
  }
  for (const bundle of manifest.bundles.filter(b => b.shardId === definition.id)) {
    let end = 0;
    for (const page of shard.pages.filter(p => p.bundleId === bundle.id).sort((a, b) => a.offset - b.offset)) { if (page.offset !== end) throw new Error('Overlapping or unindexed bundle bytes.'); end += page.encodedBytes; }
    if (end !== bundle.encodedBytes) throw new Error('Incomplete bundle closure.');
  }
  return freeze(shard);
}
