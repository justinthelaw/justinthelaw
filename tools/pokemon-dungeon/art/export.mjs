// Offline P06 authoring export. Imports authoring builders and npm Three, never game source.
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'acorn';
import { Box3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const artRoot = fileURLToPath(new URL('./', import.meta.url));
const toolRoot = path.dirname(artRoot);
const repoRoot = path.resolve(toolRoot, '../..');
const manifestRoot = path.join(artRoot, 'manifests');
const manifestPath = path.join(manifestRoot, 'assets.json');
const maxBytes = 1_048_576;
const namePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const loopNames = new Set(['idle', 'locomotion', 'rest-sleep']);
const specs = [
  { slug: 'pikachu', file: 'characters/pikachu.mjs', method: 'buildPikachu', speciesId: 'pokemon-025', role: 'hero-anchor' },
  { slug: 'charmander', file: 'characters/charmander.mjs', method: 'buildCharmander', speciesId: 'pokemon-004', role: 'partner-anchor' },
  { slug: 'groudon', file: 'characters/groudon.mjs', method: 'buildGroudon', speciesId: 'pokemon-383', role: 'boss-anchor' },
  { slug: 'magma-cavern', file: 'environment/magma-cavern.mjs', method: 'buildMagmaCavern', speciesId: null, role: 'environment-anchor' },
];
const exportOptions = { binary: true, trs: true, onlyVisible: true, includeCustomExtensions: false, maxTextureSize: 1024 };
const notice = `P06 candidate assets: original procedural authoring by Codex for this project.\nThe source geometry and animation scripts are recorded in each authoring manifest entry.\nAsset distribution license review is pending; this notice grants no additional rights.\nPokemon character names and designs remain associated with their respective rights holders.\nOriginal geometry authorship does not establish clearance for Pokemon character IP.\nThree.js is an authoring tool under its separate MIT license; no commercial game models, textures or audio were extracted.\nCandidate art is not reviewed gameplay, a full roster, or a public release.\n`;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function names(values, label) {
  requireCondition(values.every((name) => typeof name === 'string' && namePattern.test(name)), `${label}: missing/noncanonical name`);
  requireCondition(new Set(values).size === values.length, `${label}: duplicate name`);
  return values;
}
function relativeToRepo(file) { return path.relative(repoRoot, file).split(path.sep).join('/'); }

// The pinned exporter uses FileReader only for asynchronously reading GLB Blobs.
class BinaryFileReader {
  result = null;
  onloadend = null;
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
}
if (!globalThis.FileReader) Object.defineProperty(globalThis, 'FileReader', { value: BinaryFileReader, configurable: true });

async function sourceClosure(entry, found = new Map()) {
  const canonical = await realpath(entry);
  const relative = path.relative(artRoot, canonical);
  requireCondition(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), 'authoring source escapes art directory');
  if (found.has(canonical)) return found;
  const bytes = await readFile(canonical);
  found.set(canonical, sha256(bytes));
  const tokens = [];
  const ast = parse(bytes.toString('utf8'), { ecmaVersion: 'latest', sourceType: 'module', onToken: tokens });
  for (let index = 0; index < tokens.length - 1; index += 1) {
    requireCondition(!((tokens[index].type.label === 'import' || tokens[index].value === 'require') && tokens[index + 1].type.label === '('), 'dynamic imports/require are outside the authoring source closure');
  }
  for (const statement of ast.body) {
    if (!['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(statement.type) || !statement.source) continue;
    const source = statement.source.value;
    requireCondition(typeof source === 'string', 'authoring import must be literal');
    if (source.startsWith('.')) await sourceClosure(path.resolve(path.dirname(canonical), source), found);
    else requireCondition(source === 'three', `unreviewed authoring dependency ${source}`);
  }
  return found;
}

function readGlb(bytes) {
  requireCondition(bytes.readUInt32LE(0) === 0x46546c67 && bytes.readUInt32LE(4) === 2 && bytes.readUInt32LE(8) === bytes.length, 'invalid exported GLB');
  const jsonLength = bytes.readUInt32LE(12);
  requireCondition(bytes.readUInt32LE(16) === 0x4e4f534a, 'missing GLB JSON');
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  const binaryHeader = 20 + jsonLength;
  requireCondition(bytes.readUInt32LE(binaryHeader + 4) === 0x004e4942, 'missing GLB BIN');
  const binary = bytes.subarray(binaryHeader + 8, binaryHeader + 8 + bytes.readUInt32LE(binaryHeader));
  return { document, binary };
}

function packGlb(document, binary) {
  const raw = Buffer.from(JSON.stringify(document));
  const json = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20);
  raw.copy(json);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + json.length + binary.length, 8);
  header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binary.length, 0); binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, json, binaryHeader, binary]);
}

function inspect(document, root) {
  requireCondition(document.asset?.version === '2.0', 'export is not glTF 2.0');
  const pending = [document];
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object') continue;
    for (const [key, child] of Object.entries(value)) {
      requireCondition(!['extensions', 'extensionsUsed', 'extensionsRequired'].includes(key) || Object.keys(child).length === 0, `candidate requires a non-core glTF extension: ${JSON.stringify(child)}`);
      if (key !== 'extras') pending.push(child);
    }
  }
  requireCondition(!(document.images?.length) && !(document.textures?.length), 'this bounded exporter accepts texture-free materials only');
  requireCondition(document.buffers?.length === 1 && document.buffers[0].uri === undefined, 'GLB must contain one embedded buffer');
  const nodes = document.nodes ?? [];
  const nodeNames = names(nodes.map((node) => node.name), 'nodes');
  const rootIndex = nodes.findIndex((node) => node.name === 'asset-root');
  requireCondition(rootIndex >= 0 && document.scenes[document.scene ?? 0].nodes.length === 1 && document.scenes[document.scene ?? 0].nodes[0] === rootIndex, 'expected one asset-root');
  const rootNode = nodes[rootIndex];
  requireCondition(JSON.stringify(rootNode.translation ?? [0, 0, 0]) === '[0,0,0]' && JSON.stringify(rootNode.rotation ?? [0, 0, 0, 1]) === '[0,0,0,1]' && JSON.stringify(rootNode.scale ?? [1, 1, 1]) === '[1,1,1]', 'root transform violates contract');
  for (const [index, mesh] of (document.meshes ?? []).entries()) {
    const owner = nodes.find((node) => node.mesh === index);
    requireCondition(owner, 'unreferenced glTF mesh');
    mesh.name = `mesh-${owner.name}`; // Exporter omits mesh names; derive from stable authored node names.
  }
  const meshNames = names((document.meshes ?? []).map((mesh) => mesh.name), 'meshes');
  const materials = (document.materials ?? []).map((material) => ({
    name: material.name, shadingProfile: 'style-b-v1',
    channels: [...(material.pbrMetallicRoughness ? ['base-color', 'roughness', 'metalness'] : []), ...(material.emissiveFactor ? ['emissive'] : []), ...(document.meshes.some((mesh) => mesh.primitives.some((primitive) => primitive.material === document.materials.indexOf(material) && primitive.attributes.COLOR_0 !== undefined)) ? ['vertex-color'] : [])],
    textureFileIds: [], alphaMode: material.alphaMode ?? 'OPAQUE', doubleSided: material.doubleSided ?? false, maximumTextureEdge: 0,
  }));
  names(materials.map((material) => material.name), 'materials');
  const clips = (document.animations ?? []).map((animation) => {
    const targetNodes = [...new Set(animation.channels.map((channel) => nodes[channel.target.node].name))].sort();
    requireCondition(!targetNodes.includes('asset-root'), `${animation.name}: asset-root animation violates in-place contract`);
    const durationSeconds = Math.max(...animation.samplers.map((sampler) => document.accessors[sampler.input].max[0]));
    return { name: animation.name, durationSeconds, loop: loopNames.has(animation.name), rootMotion: 'in-place', targetNodes };
  });
  names(clips.map((clip) => clip.name), 'clips');
  let triangles = 0;
  for (const node of nodes) {
    if (node.mesh === undefined) continue;
    for (const primitive of document.meshes[node.mesh].primitives) {
      requireCondition((primitive.mode ?? 4) === 4, 'nontriangle primitive');
      const count = document.accessors[primitive.indices ?? primitive.attributes.POSITION].count;
      requireCondition(count % 3 === 0, 'incomplete triangle primitive');
      triangles += count / 3;
    }
  }
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root, true);
  requireCondition(!bounds.isEmpty() && [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite), 'invalid neutral bounds');
  const sockets = nodes.filter((node) => node.name.startsWith('socket-')).map((node) => {
    const index = nodes.indexOf(node);
    const parent = nodes.find((candidate) => candidate.children?.includes(index));
    requireCondition(parent, `${node.name}: missing socket parent`);
    return { name: node.name, parentNode: parent.name };
  });
  return { nodeNames, meshNames, materials, clips, sockets, triangles, nodeCount: nodes.length, meshCount: meshNames.length, materialCount: materials.length, skinJointCount: new Set((document.skins ?? []).flatMap((skin) => skin.joints)).size, boundsMeters: { min: bounds.min.toArray(), max: bounds.max.toArray(), measurementPose: 'neutral-bind-pose' } };
}

async function ensureDirectory(directory) {
  const relative = path.relative(artRoot, directory);
  requireCondition(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), 'output escapes authoring root');
  let current = artRoot;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      requireCondition(info.isDirectory() && !info.isSymbolicLink(), `unsafe output directory ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await mkdir(current);
    }
  }
}
async function writeOutput(relative, bytes) {
  requireCondition(bytes.length > 0 && bytes.length <= maxBytes, `${relative}: output exceeds 1 MiB`);
  const destination = path.join(manifestRoot, relative);
  await ensureDirectory(path.dirname(destination));
  try { requireCondition((await lstat(destination)).isFile() && !(await lstat(destination)).isSymbolicLink(), `unsafe output file ${relative}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeFile(destination, bytes);
}

async function main() {
  requireCondition(process.argv.length === 2, 'Usage: node art/export.mjs');
  const threePackage = JSON.parse(await readFile(path.join(toolRoot, 'node_modules/three/package.json'), 'utf8'));
  requireCondition(threePackage.version === '0.186.1', 'exporter requires pinned three@0.186.1');
  let previous = { assets: [] };
  try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  requireCondition(previous.assets.every((asset) => asset.status === 'candidate'), 'refusing to replace reviewed/rejected asset evidence');
  const allSources = new Map();
  const output = new Map([['notices/candidate-assets.txt', Buffer.from(notice)]]);
  const assets = [];
  for (const spec of specs) {
    const entry = path.join(artRoot, spec.file);
    const sources = await sourceClosure(entry);
    for (const file of [fileURLToPath(import.meta.url), path.join(toolRoot, 'package-lock.json'), path.join(toolRoot, 'node_modules/three/examples/jsm/exporters/GLTFExporter.js')]) sources.set(file, sha256(await readFile(file)));
    for (const [file, hash] of sources) {
      requireCondition(!allSources.has(file) || allSources.get(file) === hash, `shared authoring input changed: ${relativeToRepo(file)}`);
      allSources.set(file, hash);
    }
    const api = await import(pathToFileURL(entry).href);
    requireCondition(typeof api[spec.method] === 'function', `${spec.file}: missing ${spec.method}`);
    const measurements = [];
    const files = [];
    const notes = new Set();
    for (const level of [0, 1, 2]) {
      const built = api[spec.method](level);
      requireCondition(built.root?.isGroup && Array.isArray(built.clips) && Array.isArray(built.notes), `${spec.slug}: invalid authoring API`);
      built.root.traverse((node) => {
        requireCondition(!node.isCamera && !node.isLight, 'cameras/lights do not belong in reusable candidate exports');
        requireCondition([node.position, node.quaternion, node.scale].every((value) => value.toArray().every(Number.isFinite)), 'nonfinite authored transform');
        requireCondition(node.scale.toArray().every((value) => value > 0), 'nonpositive scale is outside the asset contract');
      });
      for (const note of built.notes) notes.add(note);
      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(built.root, { ...exportOptions, animations: built.clips });
      requireCondition(result instanceof ArrayBuffer, 'expected binary exporter output');
      const { document, binary } = readGlb(Buffer.from(result));
      let measured;
      try { measured = inspect(document, built.root); }
      catch (error) { throw new Error(`${spec.slug} LOD${level}: ${error.message}`, { cause: error }); }
      requireCondition(measured.clips.length === built.clips.length, 'exporter omitted an authored clip');
      const bytes = packGlb(document, binary);
      requireCondition(bytes.length <= maxBytes, `${spec.slug} LOD${level}: ${bytes.length} bytes exceeds 1 MiB`);
      const url = `models/${spec.slug}-lod${level}.glb`;
      const fileId = `${spec.slug}-lod${level}`;
      files.push({ fileId, url, role: 'model', mediaType: 'model/gltf-binary', sha256: sha256(bytes), encodedBytes: bytes.length });
      output.set(url, bytes);
      measurements.push({ level, ...measured, fileId });
      built.root.traverse((node) => { node.geometry?.dispose(); for (const material of [].concat(node.material ?? [])) material.dispose(); });
    }
    const first = measurements[0];
    requireCondition(measurements.every((measurement) => JSON.stringify(measurement.clips) === JSON.stringify(first.clips) && JSON.stringify(measurement.sockets) === JSON.stringify(first.sockets)), `${spec.slug}: LOD animation/socket interfaces differ`);
    files.push({ fileId: 'candidate-assets-notice', url: 'notices/candidate-assets.txt', role: 'license-notice', mediaType: 'text/plain', sha256: sha256(notice), encodedBytes: Buffer.byteLength(notice) });
    const old = previous.assets.find((asset) => asset.subject.kind === (spec.speciesId ? 'character' : 'environment') && (spec.speciesId ? asset.subject.speciesId === spec.speciesId : asset.subject.environmentKey === spec.slug));
    const changed = old && files.some((file) => !old.files.some((prior) => prior.url === file.url && prior.sha256 === file.sha256));
    const revision = old ? old.revision + (changed ? 1 : 0) : 1;
    const baseId = spec.speciesId ? `model.${spec.speciesId}` : 'environment.magma-cavern.composition';
    const sourceRecords = [...sources].sort(([a], [b]) => a.localeCompare(b)).map(([file, hash]) => {
      const kind = file === path.join(toolRoot, 'package-lock.json') ? 'generated-source'
        : file.startsWith(`${path.join(toolRoot, 'node_modules')}${path.sep}`) ? 'licensed-input' : 'original-authoring';
      const use = kind === 'generated-source' ? 'npm-generated record of the pinned third-party authoring dependency closure.'
        : kind === 'licensed-input' ? 'Pinned MIT glTF export tool; not copied game artwork.' : 'Reproducible candidate authoring source/tooling input.';
      return { sourceId: relativeToRepo(file).replace(/[^a-z0-9]+/gi, '-').toLowerCase(), kind, locator: relativeToRepo(file), sha256: hash, use };
    });
    const materialMap = new Map();
    for (const measurement of measurements) for (const material of measurement.materials) {
      requireCondition(!materialMap.has(material.name) || JSON.stringify(materialMap.get(material.name)) === JSON.stringify(material), `${spec.slug}: material contract changes across LODs`);
      materialMap.set(material.name, material);
    }
    assets.push({
      assetId: `${baseId}.v${String(revision).padStart(3, '0')}`, revision, status: 'candidate',
      subject: spec.speciesId ? { kind: 'character', speciesId: spec.speciesId, anchorRole: spec.role, formBinding: { state: 'unresolved', reason: 'Canonical original-Blue FormId binding awaits the P02/P07 catalog interface.' } } : { kind: 'environment', environmentKey: 'magma-cavern', anchorRole: spec.role, component: 'composition', domainBinding: { state: 'unresolved', reason: 'P06 composition only; no canonical DungeonId, layout, floor number or hazard binding.' } },
      styleProfile: 'style-b-v1', format: 'glTF-2.0',
      coordinates: { handedness: 'right', up: '+Y', forward: '+Z', metersPerUnit: 1, tileMeters: 2, rootNode: 'asset-root', pivot: 'ground-center', rootTranslation: [0, 0, 0], rootRotationQuaternion: [0, 0, 0, 1], rootScale: [1, 1, 1] },
      files, nodeNames: [...new Set(measurements.flatMap((measurement) => measurement.nodeNames))], meshNames: [...new Set(measurements.flatMap((measurement) => measurement.meshNames))], materials: [...materialMap.values()], clips: first.clips,
      lods: measurements.map((measurement) => ({ level: measurement.level, fileIds: [measurement.fileId], modelFileId: measurement.fileId, triangles: measurement.triangles, nodeCount: measurement.nodeCount, meshCount: measurement.meshCount, materialCount: measurement.materialCount, skinJointCount: measurement.skinJointCount, boundsMeters: measurement.boundsMeters, clipNames: measurement.clips.map((clip) => clip.name) })),
      sockets: first.sockets,
      provenance: { creationMethod: 'original-procedural', creators: [{ name: 'Codex', contribution: 'Original procedural candidate geometry, materials, hierarchy and animation authoring for this project.' }], sourceRecordIds: sourceRecords.map((source) => source.sourceId), license: { licenseId: 'LicenseRef-Pending-Asset-Review', reviewState: 'pending', attribution: 'Original procedural P06 candidate assets authored with Codex; generated using Three.js 0.186.1.', noticeUrl: 'notices/candidate-assets.txt', characterRightsNote: spec.speciesId ? 'Original modeled geometry does not establish permission for Pokemon character IP or public distribution.' : 'Original volcanic composition; project asset distribution review remains pending.' } },
      review: { state: 'pending' },
      authoring: { recordId: `p06-${spec.slug}-v${String(revision).padStart(3, '0')}`, sources: sourceRecords, exporter: { name: 'Three.js GLTFExporter / art/export.mjs', version: '0.186.1', settingsRecord: JSON.stringify(exportOptions) }, captures: changed ? [] : (old?.authoring.captures ?? []), notes: [...notes, 'Candidate procedural art only; no visual acceptance, game rules, gameplay or runtime promotion.', 'Triangle counts include each exported mesh-node instance; node/mesh/material/joint counts come from exported glTF JSON.', 'Neutral bounds are measured from authoring geometry/transforms; texture-free core glTF only.', 'P06 art review still must assess recognition, hierarchy deformation, materials, clip quality, LOD readability and original rights/provenance.'] },
    });
  }
  for (const [file, hash] of allSources) requireCondition(sha256(await readFile(file)) === hash, `authoring input changed during export: ${relativeToRepo(file)}`);
  for (const [relative, bytes] of output) await writeOutput(relative, bytes);
  await writeOutput('assets.json', Buffer.from(`${JSON.stringify({ schemaVersion: '1.0.0', manifestKind: 'authoring', assets }, null, 2)}\n`));
  console.log(`Exported ${assets.length} candidate assets / ${assets.reduce((sum, asset) => sum + asset.lods.length, 0)} GLBs; manifest art/manifests/assets.json. Review remains pending.`);
}

main().catch((error) => { console.error(`Authoring export failed: ${error.message}`); process.exitCode = 1; });
