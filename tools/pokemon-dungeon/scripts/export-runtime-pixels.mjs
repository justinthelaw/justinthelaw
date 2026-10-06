import { readFile, mkdir, copyFile, writeFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../art/production/', import.meta.url));
const output = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/assets/characters/pixel/', import.meta.url));
const author = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
const indexBytes = await readFile(path.join(source, 'page-index.json'));
const index = JSON.parse(indexBytes);
await mkdir(output, { recursive: true });
const pages = [];
for (const page of index.pages) {
    if (!/^output\/[a-z0-9-]+\.png$/.test(page.path))
        throw new Error('Unsafe authoring page path');
    const from = path.join(source, page.path), name = path.basename(page.path);
    if (await realpath(from) !== from)
        throw new Error('Symlink art page');
    const bytes = await readFile(from);
    if (bytes.length !== page.encodedBytes || createHash('sha256').update(bytes).digest('hex') !== page.sha256)
        throw new Error(`Stale source ${page.path}`);
    await copyFile(from, path.join(output, name));
    pages.push({ ...page, path: name });
}
const manifest = { schemaVersion: 1, profile: 'directional-pixel-clip-v2', review: 'starter-provisional-integration', sourceIndexSha256: createHash('sha256').update(indexBytes).digest('hex'), cell: { width: 96, height: 96, footAnchor: [48, 92] }, page: { width: 384, height: 768 }, clips: author.clips.map(({ id, durationsMs, loop }) => ({ id, durationsMs, loop })), characters: author.characters.map(({ speciesId, worldHeight }) => ({ speciesId, formId: null, worldHeight })), pages };
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(output, 'manifest.json'), serialized);
await writeFile(path.join(output, 'integrity.js'), `// Generated from the deterministic runtime manifest; no runtime authoring dependency.\nexport const PIXEL_MANIFEST_SHA256 = '${createHash('sha256').update(serialized).digest('hex')}';\n`);
console.log(`Exported ${pages.length} exact original clip pages; no game source executed.`);
