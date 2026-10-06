// Deterministic original-art exporter. No game imports, network or raster inputs.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Raster } from '../pixel/raster.mjs';
import { characters, render } from './characters.mjs';
import { clips } from './pose.mjs';
const root = new URL('./', import.meta.url);
const sha = data => createHash('sha256').update(data).digest('hex');
await mkdir(new URL('output/', root), { recursive: true }); await mkdir(new URL('evidence/', root), { recursive: true });
const sourceNames = ['characters.mjs', 'painter.mjs', 'pose.mjs', 'export.mjs', ...characters.map(c => `species/${c.identity.name}.mjs`)];
const sources = await Promise.all(sourceNames.map(async path => ({ path, sha256: sha(await readFile(new URL(path, root))) })));
const manifest = { schemaVersion: 2, profile: 'directional-pixel-clip-v2', scope: 'starter-wave-art-only', review: 'candidate-unaccepted', cell: { width: 96, height: 96, footAnchor: [48, 92], transparentBorder: 2 }, page: { width: 384, height: 768, columns: 4, rows: 8, origin: 'top-left' }, directions: ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left'], directionConvention: 'nearest 45 degrees of actor heading minus camera bearing', sampling: { min: 'nearest', mag: 'nearest', mipmaps: false, alpha: 'binary-straight', colorSpace: 'srgb' }, memory: { decodedRgbaBytesPerPage: 1179648, characterPageCeilingBytes: 25165824, maxResidentPages: 21, viewerVisiblePageLimit: 3, runtimeStreamingImplemented: false }, clips, provenance: { method: 'original-code-native-pixel-art', commercialAssetsExtracted: false, rasterInputs: false, sourceFiles: sources, sharedRaster: { path: '../pixel/raster.mjs', sha256: sha(await readFile(new URL('../pixel/raster.mjs', root))) } }, characters: [], evidence: [] };
async function output(path, raster) { const bytes = raster.png(); await writeFile(new URL(path, root), bytes); return { path, sha256: sha(bytes), encodedBytes: bytes.length }; }
for (const character of characters) {
  const c = { ...character.identity, assetId: `character.${character.identity.speciesId}.default.pixel-v2`, formId: 'default', review: 'candidate-unaccepted', runtimeIntegrated: false, source: `species/${character.identity.name}.mjs`, pages: [] };
  const contacts = new Raster(96 * 8, 96), motions = new Raster(96 * 4, 96 * 12);
  for (const clip of clips) {
    const page = new Raster(384, 768); const frameHashes = [];
    for (let row = 0; row < 8; row++) for (let frame = 0; frame < 4; frame++) {
      const cell = render(character, row, clip.id, frame); page.paste(cell, frame * 96, row * 96); frameHashes.push(sha(cell.data));
      if (clip.id === 'idle' && frame === 0) contacts.paste(cell, row * 96, 0);
      if (row === 1) motions.paste(cell, frame * 96, clips.indexOf(clip) * 96);
    }
    c.pages.push({ clip: clip.id, ...await output(`output/${c.name}-${clip.id}.png`, page), decodedRgbaBytes: 1179648, frameHashes });
  }
  manifest.characters.push(c);
  manifest.evidence.push({ species: c.name, kind: 'all-eight-directions', ...await output(`evidence/${c.name}-directions.png`, contacts) });
  manifest.evidence.push({ species: c.name, kind: 'all-twelve-clips-front-right', ...await output(`evidence/${c.name}-clips.png`, motions) });
}
const index = { schemaVersion: 2, pages: manifest.characters.flatMap(c => c.pages.map(p => ({ speciesId: c.speciesId, assetId: c.assetId, clip: p.clip, path: p.path, sha256: p.sha256, encodedBytes: p.encodedBytes, decodedRgbaBytes: p.decodedRgbaBytes }))) };
const indexBytes = Buffer.from(`${JSON.stringify(index, null, 2)}\n`); await writeFile(new URL('page-index.json', root), indexBytes); manifest.pageIndex = { path: 'page-index.json', sha256: sha(indexBytes) };
await writeFile(new URL('manifest.json', root), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Exported ${characters.length} dedicated species, ${index.pages.length} clip pages, 6144 cells; art acceptance pending.`);
