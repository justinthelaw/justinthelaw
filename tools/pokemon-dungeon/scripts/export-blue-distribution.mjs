import { lstat, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';

// Parse source without importing or executing game code. This manifest is the
// actual production module closure, not the retained historical project tree.
const game = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/', import.meta.url));
const entry = 'src/blue/app.js';
const files = new Set(['index.html', 'blue.css',
  'content/blue-opening.json', 'content/onboarding/questions.json',
  'content/onboarding/results.json', 'content/onboarding/partners.json',
  'content/onboarding/algorithm.json']);
const pending = [entry];
function hasDynamicImport(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'ImportExpression') return true;
  return Object.values(node).some(value => Array.isArray(value)
    ? value.some(hasDynamicImport) : value && typeof value === 'object' && hasDynamicImport(value));
}
while (pending.length) {
  const filename = pending.pop();
  if (files.has(filename)) continue;
  files.add(filename);
  const source = await readFile(path.join(game, filename), 'utf8');
  const tree = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  for (const node of tree.body) {
    if (!['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) || !node.source) continue;
    const specifier = node.source.value;
    if (typeof specifier !== 'string' || !specifier.startsWith('.')) throw new Error(`Nonlocal runtime import: ${filename}`);
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(filename), specifier));
    if (resolved.startsWith('../') || !resolved.endsWith('.js')) throw new Error(`Invalid runtime import: ${specifier}`);
    pending.push(resolved);
  }
  if (hasDynamicImport(tree)) throw new Error(`Declare dynamic imports in the distribution owner: ${filename}`);
}
const spriteManifest = JSON.parse(await readFile(path.join(game, 'assets/blue/manifest.json'), 'utf8'));
if (!Array.isArray(spriteManifest.records) || spriteManifest.records.length > 64) throw new Error('Invalid opening sprite manifest');
files.add('assets/blue/manifest.json'); files.add('assets/blue/NOTICE.txt');
for (const record of spriteManifest.records) {
  if (!/^pokemon-\d{3}\.png$/.test(record.path) || record.path !== `${record.speciesId}.png`) throw new Error('Invalid opening sprite path');
  files.add(`assets/blue/${record.path}`);
}
for (const scene of spriteManifest.scenes ?? []) {
  if (!/^[a-z][a-z-]+\.png$/.test(scene.path) || scene.path !== `${scene.id}.png`) throw new Error('Invalid opening scene path');
  files.add(`assets/blue/${scene.path}`);
}
if (spriteManifest.portraitAtlas) {
  if (spriteManifest.portraitAtlas.path !== 'portraits.png') throw new Error('Invalid portrait atlas path');
  files.add('assets/blue/portraits.png');
}
const ordered = [...files].sort();
let totalBytes = 0;
const canonicalRoot = await realpath(game);
for (const filename of ordered) {
  const input = path.join(game, filename), canonical = await realpath(input);
  if (!(await lstat(input)).isFile() || !canonical.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error(`Nonlocal distribution resource: ${filename}`);
  totalBytes += (await stat(input)).size;
}
const manifest = { version: 1, entry, files: ordered, totalBytes,
  scope: 'Opening cinematic and menu through Tiny Woods and Caterpie rescue only' };
const output = `${JSON.stringify(manifest, null, 2)}\n`;
const target = path.join(game, 'distribution.json');
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== output) throw new Error('Opening distribution is stale. Run export-blue-distribution.mjs.');
} else await writeFile(target, output);
console.log(`Opening distribution: ${ordered.length} files, ${totalBytes} bytes; static module closure only.`);
