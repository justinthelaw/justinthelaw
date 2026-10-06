import { readFile, readdir, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/', import.meta.url));
const target = path.join(root, 'assets/characters/pixel');
const source = fileURLToPath(new URL('../art/production/', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile(path.join(target, 'manifest.json'), 'utf8'));
const author = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
const indexBytes = await readFile(path.join(source, 'page-index.json'));
const index = JSON.parse(indexBytes);
const expected = { schemaVersion: 1, profile: 'directional-pixel-clip-v2', review: 'starter-provisional-integration', sourceIndexSha256: hash(indexBytes), cell: { width: 96, height: 96, footAnchor: [48, 92] }, page: { width: 384, height: 768 }, clips: author.clips.map(({ id, durationsMs, loop }) => ({ id, durationsMs, loop })), characters: author.characters.map(({ speciesId, worldHeight }) => ({ speciesId, formId: null, worldHeight })), pages: index.pages.map(page => ({ ...page, path: path.basename(page.path) })) };
if (JSON.stringify(manifest) !== JSON.stringify(expected))
    throw new Error('Runtime manifest schema/copy differs from reviewed authoring index');
const manifestBytes = await readFile(path.join(target, 'manifest.json'));
const integrity = await readFile(path.join(target, 'integrity.js'), 'utf8');
if (integrity !== `// Generated from the deterministic runtime manifest; no runtime authoring dependency.\nexport const PIXEL_MANIFEST_SHA256 = '${hash(manifestBytes)}';\n`) throw new Error('Stale runtime manifest integrity pin');
const names = new Set(['manifest.json', 'integrity.js']);
for (const page of manifest.pages) {
    if (!/^[a-z0-9-]+\.png$/.test(page.path) || names.has(page.path))
        throw new Error('Unsafe or duplicate page path');
    names.add(page.path);
    const file = path.join(target, page.path);
    if (await realpath(file) !== file)
        throw new Error('Runtime symlink');
    const bytes = await readFile(file), original = await readFile(path.join(source, 'output', page.path));
    if (!bytes.equals(original) || hash(bytes) !== page.sha256 || bytes.length !== page.encodedBytes || bytes.length >= 1048576 || page.decodedRgbaBytes !== 1179648)
        throw new Error(`Invalid copy ${page.path}`);
    if (bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== 384 || bytes.readUInt32BE(20) !== 768 || bytes[24] !== 8 || bytes[25] !== 6)
        throw new Error(`Invalid PNG dimensions/encoding ${page.path}`);
}
if ((await readdir(target)).some(name => !names.has(name)))
    throw new Error('Unexpected runtime pixel file');
console.log(`Runtime pixels: ${manifest.pages.length} pages, exact schema/hash/PNG dimensions/copies and local path closure checked; no game execution.`);
