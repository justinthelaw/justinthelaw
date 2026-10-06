// JSON/binary packaging only. No authoring or game module imports.
import { readFile, mkdir, writeFile, realpath, readdir, lstat, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../art/roster/', import.meta.url));
const output = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/assets/characters/pixel/', import.meta.url));
const check = process.argv.includes('--check'), maxBundle = 900 * 1024;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = await readFile(path.join(source, 'manifest.json'));
const author = JSON.parse(sourceBytes);
if (author.schemaVersion !== 2 || author.identities !== 419 || author.review !== 'candidate-unaccepted' || author.shards.length !== 27) throw new Error('Unexpected authoring contract');
const names = new Set(['manifest.json', 'integrity.js']);
const manifest = { schemaVersion: 2, profile: 'directional-pixel-clip-v2', review: 'roster-provisional-integration', sourceManifestSha256: hash(sourceBytes), cell: { width: 96, height: 96, footAnchor: [48, 92] }, page: { width: 384, height: 768 }, clips: author.clips.map(({ id, durationsMs, loop }) => ({ id, durationsMs, loop })), characters: [], shards: [], bundles: [], pageCount: 0 };
await mkdir(output, { recursive: true });
if (await realpath(output) !== output.replace(/\/$/, '')) throw new Error('Symlink output directory');
async function save(name, bytes) {
    if (!/^[a-z0-9.-]+$/.test(name) || bytes.length > maxBundle) throw new Error(`Unsafe output/size ${name}`);
    const file = path.join(output, name);
    try { if ((await lstat(file)).isSymbolicLink()) throw new Error('Symlink output file'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (check) { if (!(await readFile(file)).equals(bytes)) throw new Error(`Determinism mismatch ${name}`); }
    else await writeFile(file, bytes);
    names.add(name); return { path: name, sha256: hash(bytes), encodedBytes: bytes.length };
}
const serialize = value => Buffer.from(`${JSON.stringify(value)}\n`);
let totalBytes = 0, reusedPages = 0;
for (let i = 0; i < author.shards.length; i++) {
    const descriptor = author.shards[i];
    if (!/^manifests\/characters-\d{2}\.json$/.test(descriptor.path)) throw new Error('Unsafe character shard');
    const bytes = await readFile(path.join(source, descriptor.path));
    if (bytes.length !== descriptor.encodedBytes || hash(bytes) !== descriptor.sha256) throw new Error('Stale authoring shard');
    const characters = JSON.parse(bytes).characters;
    const shardId = `pages-${String(i + 1).padStart(2, '0')}`, shard = { schemaVersion: 2, id: shardId, pages: [] };
    let chunks = [], size = 0;
    const bundleId = () => `bundle-${String(manifest.bundles.length + 1).padStart(3, '0')}`;
    async function flush() {
        if (!size) return;
        const id = bundleId(); manifest.bundles.push({ id, ...await save(`${id}.bin`, Buffer.concat(chunks)), shardId }); chunks = []; size = 0;
    }
    for (const character of characters) {
        const formId = character.catalogFormId;
        if (!(formId === null || typeof formId === 'string') || character.formId !== (formId ?? 'default')) throw new Error('Ambiguous authoring form');
        manifest.characters.push({ profileId: character.profileId, speciesId: character.speciesId, formId, assetId: character.assetId, worldHeight: character.worldHeight, shardId });
        for (const page of character.pages) {
            if (!/^(?:output|\.\.\/production\/output)\/[a-z0-9-]+\.png$/.test(page.path)) throw new Error('Unsafe authoring PNG path');
            const file = path.resolve(source, page.path);
            if (await realpath(file) !== file) throw new Error('Symlink authoring PNG');
            const png = await readFile(file);
            if (png.length !== page.encodedBytes || hash(png) !== page.sha256 || png.length > 65536 || page.decodedRgbaBytes !== 1179648) throw new Error('Stale/unbounded source PNG');
            if (size + png.length > maxBundle) await flush();
            shard.pages.push({ profileId: character.profileId, speciesId: character.speciesId, formId, assetId: character.assetId, clip: page.clip, path: path.basename(page.path), sha256: page.sha256, encodedBytes: png.length, decodedRgbaBytes: page.decodedRgbaBytes, bundleId: bundleId(), offset: size });
            chunks.push(png); size += png.length; totalBytes += png.length; manifest.pageCount++; if (character.preserved) reusedPages++;
        }
    }
    await flush();
    const data = serialize(shard); if (data.length > 131072) throw new Error('Metadata shard budget');
    manifest.shards.push({ id: shardId, ...await save(`${shardId}.json`, data) });
}
if (manifest.characters.length !== 419 || manifest.pageCount !== 5028 || reusedPages !== 192) throw new Error('Incomplete runtime roster');
const bytes = serialize(manifest); if (bytes.length > 262144) throw new Error('Root metadata budget');
await save('manifest.json', bytes);
await save('integrity.js', Buffer.from(`// Generated from the deterministic runtime manifest; no runtime authoring dependency.\nexport const PIXEL_MANIFEST_SHA256 = '${hash(bytes)}';\n`));
for (const name of await readdir(output)) if (!names.has(name)) {
    if (check) throw new Error(`Unexpected runtime pixel file ${name}`);
    const file = path.join(output, name); if (!(await lstat(file)).isFile() || await realpath(file) !== file) throw new Error('Unexpected non-file in generated output');
    await unlink(file);
}
console.log(JSON.stringify({ mode: check ? 'compared' : 'exported', profiles: manifest.characters.length, pages: manifest.pageCount, preservedStarterPages: reusedPages, metadataShards: manifest.shards.length, bundles: manifest.bundles.length, encodedPngBytes: totalBytes, largestBundleBytes: Math.max(...manifest.bundles.map(b => b.encodedBytes)), rootBytes: bytes.length, files: names.size }));
