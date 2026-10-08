import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Raster, SIZE } from './raster.mjs';
import { drawCharacter } from './characters.mjs';
const root = new URL('./', import.meta.url);
const output = new URL('output/', root);
await mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = ['characters.mjs', 'raster.mjs', 'export.mjs'];
const sources = await Promise.all(sourceFiles.map(async file => ({ path: file, sha256: hash(await readFile(new URL(file, root))) })));
const directions = ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left'];
const clips = [{ id: 'idle', firstColumn: 0, frames: 4, frameMs: 180, loop: true }, { id: 'walk', firstColumn: 4, frames: 4, frameMs: 110, loop: true }, { id: 'attack-physical', firstColumn: 8, frames: 4, frameMs: 100, loop: false }];
const characters = [];
for (const [name, speciesId, height] of [['pikachu', 'pokemon-025', 1.65], ['charmander', 'pokemon-004', 1.75], ['groudon', 'pokemon-383', 4.8]]) {
  const atlas = new Raster(SIZE * 12, SIZE * 8);
  const contact = new Raster(SIZE * 8, SIZE);
  for (let direction = 0; direction < directions.length; direction++) {
    for (const clip of clips) for (let frame = 0; frame < clip.frames; frame++) atlas.paste(drawCharacter(name, direction, frame, clip.id), (clip.firstColumn + frame) * SIZE, direction * SIZE);
    contact.paste(drawCharacter(name, direction, 0, 'idle'), direction * SIZE, 0);
  }
  const bytes = atlas.png();
  await writeFile(new URL(`${name}.png`, output), bytes);
  await writeFile(new URL(`${name}-directions.png`, output), contact.png());
  characters.push({ assetId: `character.${speciesId}.default.pixel-v1`, speciesId, formId: 'default', name, atlas: `output/${name}.png`, sha256: hash(bytes), encodedBytes: bytes.length, decodedRgbaBytes: SIZE * 12 * SIZE * 8 * 4, worldHeight: height, review: 'candidate-unaccepted', coverage: { directions: 8, clips: clips.map(clip => clip.id), missingClips: ['turn', 'attack-special', 'cast-status', 'hit-light', 'hit-heavy', 'defeat', 'celebrate', 'rest-sleep', 'interact'], runtimeIntegrated: false } });
}
const manifest = { schemaVersion: 1, profile: 'directional-pixel-v1', scope: 'art-only-candidate', memory: { decodedRgbaBytesPerAtlas: 3538944, proofCharacterBytes: 10616832, proposedCharacterCacheBytes: 25165824, proposedResidentAtlasLimit: 6, runtimeStreamingImplemented: false }, cell: { width: SIZE, height: SIZE, footAnchor: [48, 92], transparentBorder: 2 }, atlas: { width: SIZE * 12, height: SIZE * 8, columns: 12, rows: 8, origin: 'top-left' }, directions, directionConvention: 'row 0 faces camera; row 2 faces screen-right; row 6 faces screen-left; select nearest 45 degrees of actor heading minus camera bearing', sampling: { min: 'nearest', mag: 'nearest', mipmaps: false, alpha: 'binary-straight', colorSpace: 'srgb' }, clips, provenance: { method: 'original-code-native-pixel-art', author: 'Codex, commissioned for this repository', sourceFiles: sources, commercialAssetsExtracted: false, reference: 'EthrA user frame: direction and 3D composition only; no source pixels sampled', rights: 'Original authored implementation; underlying Pokemon characters belong to their respective rights holders. No rights-holder license is asserted.', generationService: 'Built-in ImageGen attempt failed moderation and returned no asset; no retry or API fallback used.' }, characters };
await writeFile(new URL('manifest.json', root), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Exported ${characters.length} original candidates: 288 RGBA frames, eight directions, three partial animation studies; no game execution.`);
