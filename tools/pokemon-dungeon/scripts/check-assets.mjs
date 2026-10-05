#!/usr/bin/env node
// Offline JSON/binary inspection only. Never import a model, generator, or game module.
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validateBytes } from 'gltf-validator';
import { measureGltf, preflightGltfMeasurements } from './measure-gltf.mjs';

const toolRoot = fileURLToPath(new URL('../', import.meta.url));
const localPathPattern = /^(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*$/;
const maxFileBytes = 1_048_576;
const inspectedFiles = new Map();
const assetIds = new Set();
const limitations = 'P06 still requires inventory/rig/texture evidence review, aggregate scene budgets, source/review evidence authentication, and human art review. Passing static glTF and resource checks is not asset acceptance.';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values, label) {
  requireCondition(new Set(values).size === values.length, `duplicate ${label}`);
  return new Set(values);
}

function sameMembers(actual, expected, label) {
  requireCondition(actual.length === expected.length && actual.every(value => expected.includes(value)), `${label} mismatch`);
}

function near(actual, expected) {
  // Bounds are authored in doubles, exported as float32, then transformed.
  // Permit 10 micrometers absolute + one part per million relative error.
  return Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-5 + 1e-6 * Math.max(Math.abs(actual), Math.abs(expected));
}

function compareMaterial(actual, expected) {
  requireCondition(expected, `undeclared material ${actual.name}`);
  for (const property of ['alphaMode', 'doubleSided', 'maximumTextureEdge']) requireCondition(actual[property] === expected[property], `${actual.name}: ${property} mismatch`);
  sameMembers(actual.channels, expected.channels, `${actual.name}: channels`);
  sameMembers(actual.textureFileIds, expected.textureFileIds, `${actual.name}: textureFileIds`);
}

function within(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

function localPath(root, relative, base = root) {
  requireCondition(typeof relative === 'string' && localPathPattern.test(relative), `invalid local resource path: ${relative}`);
  const resolved = path.resolve(base, relative);
  requireCondition(within(root, resolved), `resource escapes manifest directory: ${relative}`);
  return resolved;
}

async function measuredFile(root, relative, expected) {
  const resolved = localPath(root, relative);
  let component = root;
  for (const segment of relative.split('/')) {
    component = path.join(component, segment);
    requireCondition(!(await lstat(component)).isSymbolicLink(), `symlink resource is unsupported: ${relative}`);
  }
  const canonical = await realpath(resolved);
  requireCondition(within(root, canonical), `symlink escapes manifest directory: ${relative}`);
  const info = await stat(canonical);
  requireCondition(info.isFile(), `not a regular file: ${relative}`);
  requireCondition(info.size > 0 && info.size <= maxFileBytes, `file outside 1..${maxFileBytes} byte limit: ${relative}`);
  requireCondition(info.size === expected.encodedBytes, `encodedBytes mismatch: ${relative}`);
  const bytes = await readFile(canonical);
  requireCondition(bytes.length === expected.encodedBytes, `file changed while reading: ${relative}`);
  requireCondition(createHash('sha256').update(bytes).digest('hex') === expected.sha256, `SHA-256 mismatch: ${relative}`);
  inspectedFiles.set(canonical, bytes.length);
  return bytes;
}

function json(bytes, label) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    throw new Error(`${label}: invalid UTF-8 JSON (${error.message})`, { cause: error });
  }
}

function readModel(file, bytes) {
  if (file.mediaType === 'model/gltf+json') return { document: json(bytes, file.url), binary: null };
  requireCondition(bytes.length >= 20 && bytes.readUInt32LE(0) === 0x46546c67, `${file.url}: invalid GLB header`);
  requireCondition(bytes.readUInt32LE(4) === 2 && bytes.readUInt32LE(8) === bytes.length, `${file.url}: invalid GLB version/length`);
  const chunks = [];
  for (let offset = 12; offset < bytes.length;) {
    requireCondition(offset + 8 <= bytes.length, `${file.url}: truncated GLB chunk header`);
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    requireCondition(length > 0 && length % 4 === 0 && offset + 8 + length <= bytes.length, `${file.url}: invalid GLB chunk length`);
    chunks.push({ type, bytes: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  requireCondition(chunks.length <= 2 && chunks[0]?.type === 0x4e4f534a && (!chunks[1] || chunks[1].type === 0x004e4942), `${file.url}: expected JSON then optional BIN chunk; other GLB chunks unsupported`);
  return { document: json(chunks[0].bytes, file.url), binary: chunks[1]?.bytes ?? null };
}

function object(value, label) {
  requireCondition(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  return value;
}

function array(value, label) {
  requireCondition(value === undefined || Array.isArray(value), `${label}: expected array`);
  return value ?? [];
}

function indexed(values, index, label) {
  requireCondition(Number.isSafeInteger(index) && index >= 0 && index < values.length, `${label}: invalid index ${index}`);
  return values[index];
}

function coreOnly(document) {
  // Extension resources need a reviewed decoder/resource policy. Do not silently ignore them.
  const pending = [document];
  while (pending.length) {
    const value = pending.pop();
    if (value === null || typeof value !== 'object') continue;
    for (const [key, child] of Object.entries(value)) {
      if (['extensions', 'extensionsUsed', 'extensionsRequired'].includes(key)) {
        requireCondition(child !== null && typeof child === 'object' && Object.keys(child).length === 0, 'non-core glTF extensions are unsupported');
      }
      if (key !== 'extras') pending.push(child);
    }
  }
}

function inspectModel(asset, file, bytes, root, filesByPath, fileBytes) {
  const { document: parsed, binary } = readModel(file, bytes);
  const document = object(parsed, file.url);
  requireCondition(document.asset?.version === '2.0', `${file.url}: expected glTF 2.0`);
  requireCondition(document.asset.minVersion === undefined || document.asset.minVersion === '2.0', `${file.url}: unsupported glTF minVersion`);
  coreOnly(document);
  const dependencies = new Set([file.fileId]);
  function dependency(uri, role) {
    const resolved = localPath(root, uri, path.dirname(localPath(root, file.url)));
    const entry = filesByPath.get(resolved);
    requireCondition(entry?.role === role, `${file.url}: undeclared ${role} resource ${uri}`);
    dependencies.add(entry.fileId);
    return entry;
  }
  const buffers = array(document.buffers, 'buffers').map((entry, index) => {
    object(entry, `buffer ${index}`);
    requireCondition(Number.isSafeInteger(entry.byteLength) && entry.byteLength > 0, `buffer ${index}: invalid byteLength`);
    if (entry.uri !== undefined) {
      const external = dependency(entry.uri, 'buffer');
      requireCondition(fileBytes.get(external.fileId).length >= entry.byteLength, `buffer ${index}: resource shorter than byteLength`);
    } else {
      requireCondition(index === 0 && binary !== null, `buffer ${index}: missing local URI or GLB BIN chunk`);
      requireCondition(binary.length >= entry.byteLength && binary.length <= entry.byteLength + 3, 'GLB BIN length does not match buffer 0');
      requireCondition(binary.subarray(entry.byteLength).every((byte) => byte === 0), 'GLB BIN padding must be zero');
    }
    return entry;
  });
  requireCondition(binary === null || (buffers[0] && buffers[0].uri === undefined), 'unreferenced GLB BIN chunk');
  const views = array(document.bufferViews, 'bufferViews').map((entry, index) => {
    object(entry, `bufferView ${index}`);
    const buffer = indexed(buffers, entry.buffer, `bufferView ${index} buffer`);
    const offset = entry.byteOffset ?? 0;
    requireCondition(Number.isSafeInteger(offset) && offset >= 0 && Number.isSafeInteger(entry.byteLength) && entry.byteLength > 0 && offset + entry.byteLength <= buffer.byteLength, `bufferView ${index}: invalid range`);
    return entry;
  });
  const images = array(document.images, 'images');
  for (const [index, entry] of images.entries()) {
    object(entry, `image ${index}`);
    requireCondition((entry.uri !== undefined) !== (entry.bufferView !== undefined), `image ${index}: use exactly one URI or bufferView`);
    if (entry.uri !== undefined) {
      const external = dependency(entry.uri, 'texture');
      requireCondition(entry.mimeType === undefined || entry.mimeType === external.mediaType, `image ${index}: MIME type differs from declared texture`);
    } else {
      indexed(views, entry.bufferView, `image ${index} bufferView`);
      requireCondition(['image/png', 'image/jpeg'].includes(entry.mimeType), `image ${index}: unsupported embedded MIME type`);
    }
  }
  const nodes = array(document.nodes, 'nodes');
  nodes.forEach((node, index) => object(node, `node ${index}`));
  const animations = array(document.animations, 'animations');
  const clipNames = unique(animations.map((animation) => object(animation, 'animation').name), 'glTF animation names');
  for (const animation of animations) {
    const clip = asset.clips.find((entry) => entry.name === animation.name);
    requireCondition(clip !== undefined, `undeclared animation ${animation.name}`);
    const targets = new Set();
    for (const channel of array(animation.channels, `animation ${animation.name} channels`)) {
      object(channel, 'animation channel');
      const target = object(channel.target, 'animation target');
      const node = indexed(nodes, target.node, `animation ${animation.name} target`);
      requireCondition(typeof node.name === 'string' && asset.nodeNames.includes(node.name), `animation ${animation.name}: undeclared target node`);
      requireCondition(node.name !== asset.coordinates.rootNode, `animation ${animation.name}: asset-root must remain in place`);
      targets.add(node.name);
    }
    requireCondition(targets.size === clip.targetNodes.length && clip.targetNodes.every((name) => targets.has(name)), `animation ${animation.name}: targetNodes mismatch`);
  }
  const bufferBytes = buffers.map(entry => entry.uri === undefined ? binary : fileBytes.get(dependency(entry.uri, 'buffer').fileId));
  const imageBytes = images.map(entry => {
    if (entry.uri !== undefined) {
      const external = dependency(entry.uri, 'texture');
      return { bytes: fileBytes.get(external.fileId), fileId: external.fileId };
    }
    const view = views[entry.bufferView];
    return { bytes: bufferBytes[view.buffer].subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength), fileId: null };
  });
  return { dependencies, clipNames, document, bufferBytes, imageBytes };
}

async function inspectAsset(asset, root) {
  requireCondition(!assetIds.has(asset.assetId), `duplicate assetId ${asset.assetId} across inspected manifests`);
  assetIds.add(asset.assetId);
  const suffix = asset.assetId.match(/\.v([0-9]+)$/)[1];
  requireCondition(Number.isSafeInteger(asset.revision) && Number(suffix) === asset.revision, 'revision differs from assetId suffix');
  const identity = asset.subject.kind === 'character'
    ? `model.${asset.subject.speciesId}`
    : `environment.${asset.subject.environmentKey}.${asset.subject.component}`;
  requireCondition(asset.assetId === `${identity}.v${suffix}`, 'assetId and subject disagree');
  unique(asset.files.map((entry) => entry.fileId), 'file IDs');
  unique(asset.files.map((entry) => entry.url), 'file URLs');
  const clipNames = unique(asset.clips.map((entry) => entry.name), 'clip names');
  unique(asset.materials.map((entry) => entry.name), 'material names');
  unique(asset.sockets.map((entry) => entry.name), 'socket names');
  const levels = unique(asset.lods.map((entry) => entry.level), 'LOD levels');
  requireCondition(levels.has(0), 'LOD0 is required');
  const files = new Map(asset.files.map((entry) => [entry.fileId, entry]));
  const filesByPath = new Map(asset.files.map((entry) => [localPath(root, entry.url), entry]));
  const fileBytes = new Map();
  const mediaTypes = { model: ['model/gltf+json', 'model/gltf-binary'], buffer: ['application/octet-stream'], texture: ['image/png', 'image/jpeg'], 'license-notice': ['text/plain'] };
  for (const file of asset.files) {
    requireCondition(mediaTypes[file.role].includes(file.mediaType), `${file.fileId}: role/mediaType mismatch`);
    fileBytes.set(file.fileId, await measuredFile(root, file.url, file));
  }
  const notice = filesByPath.get(localPath(root, asset.provenance.license.noticeUrl));
  requireCondition(notice?.role === 'license-notice', 'license noticeUrl must identify a declared license-notice file');
  for (const material of asset.materials) {
    for (const id of material.textureFileIds) requireCondition(files.get(id)?.role === 'texture', `${material.name}: unresolved texture ${id}`);
  }
  for (const clip of asset.clips) {
    for (const node of clip.targetNodes) requireCondition(asset.nodeNames.includes(node), `${clip.name}: unknown node ${node}`);
  }
  for (const socket of asset.sockets) {
    requireCondition(asset.nodeNames.includes(socket.name) && asset.nodeNames.includes(socket.parentNode), `${socket.name}: unknown socket or parent node`);
  }
  const models = new Map();
  for (const file of asset.files.filter((entry) => entry.role === 'model')) {
    const model = inspectModel(asset, file, fileBytes.get(file.fileId), root, filesByPath, fileBytes);
    preflightGltfMeasurements(model.document);
    const report = await validateBytes(new Uint8Array(fileBytes.get(file.fileId)), {
      uri: file.url,
      maxIssues: 100,
      externalResourceFunction(uri) {
        const resolved = localPath(root, uri, path.dirname(localPath(root, file.url)));
        const declared = filesByPath.get(resolved);
        requireCondition(declared !== undefined, `undeclared validator resource ${uri}`);
        return Promise.resolve(new Uint8Array(fileBytes.get(declared.fileId)));
      },
    });
    if (report.issues.numErrors || report.issues.numWarnings) console.log(`${file.url}: ${JSON.stringify(report.issues)}`);
    requireCondition(report.issues.numErrors === 0, `${file.url}: Khronos glTF validation failed`);
    const measurements = measureGltf(model.document, model.bufferBytes, model.imageBytes);
    models.set(file.fileId, { ...model, measurements });
    for (const material of measurements.materials) compareMaterial(material, asset.materials.find(entry => entry.name === material.name));
    for (const [name, duration] of measurements.durations) requireCondition(near(duration, asset.clips.find(clip => clip.name === name).durationSeconds), `${name}: durationSeconds mismatch`);
    const socketKey = socket => `${socket.name}/${socket.parentNode}`;
    sameMembers(measurements.sockets.map(socketKey), asset.sockets.map(socketKey), `${file.url}: sockets`);
  }
  for (const property of ['nodeNames', 'meshNames']) sameMembers([...new Set([...models.values()].flatMap(model => model.measurements[property]))], asset[property], property);
  sameMembers([...new Set([...models.values()].flatMap(model => model.measurements.materials.map(material => material.name)))], asset.materials.map(material => material.name), 'material inventory');
  sameMembers([...new Set([...models.values()].flatMap(model => [...model.clipNames]))], [...clipNames], 'clip inventory');
  for (const lod of asset.lods) {
    requireCondition(lod.boundsMeters.min.every((minimum, axis) => minimum <= lod.boundsMeters.max[axis]), `LOD${lod.level}: reversed bounds`);
    for (const id of lod.fileIds) requireCondition(files.has(id), `LOD${lod.level}: unknown file ${id}`);
    const model = models.get(lod.modelFileId);
    requireCondition(model !== undefined && lod.fileIds.includes(lod.modelFileId), `LOD${lod.level}: modelFileId must reference an included model`);
    for (const property of ['triangles', 'nodeCount', 'meshCount', 'materialCount', 'skinJointCount']) requireCondition(lod[property] === model.measurements[property], `LOD${lod.level}: ${property} mismatch (recorded ${lod[property]}, measured ${model.measurements[property]})`);
    for (const edge of ['min', 'max']) requireCondition(lod.boundsMeters[edge].every((value, axis) => near(model.measurements.boundsMeters[edge][axis], value)), `LOD${lod.level}: boundsMeters.${edge} mismatch`);
    for (const id of model.dependencies) requireCondition(lod.fileIds.includes(id), `LOD${lod.level}: missing dependency ${id}`);
    requireCondition(lod.clipNames.length === model.clipNames.size && lod.clipNames.every((name) => clipNames.has(name) && model.clipNames.has(name)), `LOD${lod.level}: clipNames differ from model/manifest`);
    if (asset.status === 'reviewed' && asset.subject.kind === 'character') {
      requireCondition(asset.clips.every((clip) => lod.clipNames.includes(clip.name)), `LOD${lod.level}: reviewed character clips missing`);
    }
  }
  if (asset.authoring) {
    const sourceIds = unique(asset.authoring.sources.map((source) => source.sourceId), 'authoring source IDs');
    for (const source of asset.authoring.sources) {
      if (!source.locator.startsWith('tools/pokemon-dungeon/')) continue;
      const relative = source.locator.slice('tools/pokemon-dungeon/'.length);
      // Authoring locators retain upstream case (e.g. GLTFExporter.js); they
      // are evidence metadata, not portable runtime URLs.
      requireCondition(/^(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*$/i.test(relative), `invalid source locator: ${source.locator}`);
      const filename = path.resolve(toolRoot, relative);
      requireCondition(within(toolRoot, filename), `source locator escapes tools: ${source.locator}`);
      let component = toolRoot;
      for (const part of relative.split('/')) {
        component = path.join(component, part);
        requireCondition(!(await lstat(component)).isSymbolicLink(), `source locator follows symlink: ${source.locator}`);
      }
      requireCondition((await stat(filename)).isFile(), `authoring source is not a file: ${source.locator}`);
      const bytes = await readFile(filename);
      requireCondition(createHash('sha256').update(bytes).digest('hex') === source.sha256, `authoring source changed; regenerate candidate assets: ${source.locator}`);
    }
    for (const id of asset.provenance.sourceRecordIds) requireCondition(sourceIds.has(id), `unresolved authoring sourceRecordId ${id}`);
    unique(asset.authoring.captures.map((capture) => capture.captureId), 'capture IDs');
    for (const capture of asset.authoring.captures) {
      requireCondition(capture.assetRevision === asset.revision, `${capture.captureId}: capture revision differs from asset`);
      if (capture.location.storage === 'git') await measuredFile(root, capture.location.path, capture);
    }
  }
}

async function discover(directory) {
  let entries;
  try {
    requireCondition((await lstat(directory)).isDirectory(), `manifest directory must not be a symlink: ${directory}`);
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const found = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const target = path.join(directory, entry.name);
    requireCondition(!entry.isSymbolicLink(), `manifest discovery does not follow symlinks: ${target}`);
    if (entry.isDirectory()) found.push(...await discover(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) found.push(target);
  }
  return found;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/check-assets.mjs [manifest.json ...]\nWithout paths, recursively inspect art/manifests/*.json. Paths inside each manifest resolve from its own directory. Only static data is read.');
    return;
  }
  requireCondition(args.every((arg) => !arg.startsWith('-')), 'expected manifest paths or --help');
  const schema = json(await readFile(path.join(toolRoot, 'schemas/asset-manifest.schema.json')), 'asset schema');
  // Conditional subschemas inherit their object types; retain all other strict checks.
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false, strictRequired: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const manifests = args.length ? args.map((arg) => path.resolve(arg)) : await discover(path.join(toolRoot, 'art/manifests'));
  const seenManifests = new Set();
  let assets = 0;
  let errors = 0;
  for (const manifestPath of manifests) {
    try {
      requireCondition((await lstat(manifestPath)).isFile(), 'manifest must be a regular file, not a symlink');
      const canonical = await realpath(manifestPath);
      requireCondition(!seenManifests.has(canonical), 'manifest supplied more than once');
      seenManifests.add(canonical);
      const root = await realpath(path.dirname(manifestPath));
      const manifest = json(await readFile(canonical), manifestPath);
      requireCondition(validate(manifest), ajv.errorsText(validate.errors, { separator: '\n' }));
      for (const asset of manifest.assets) {
        assets += 1;
        try {
          await inspectAsset(asset, root);
        } catch (error) {
          errors += 1;
          console.error(`${manifestPath} [${asset.assetId}]: ${error.message}`);
        }
      }
    } catch (error) {
      errors += 1;
      console.error(`${manifestPath}: ${error.message}`);
    }
  }
  const bytes = [...inspectedFiles.values()].reduce((sum, value) => sum + value, 0);
  console.log(`Static asset audit: ${manifests.length} manifests, ${assets} assets inspected; ${inspectedFiles.size} unique local files hash/size checked (${bytes} bytes); ${errors} errors.`);
  if (manifests.length === 0) console.log('Zero manifests found: zero assets inspected; no asset-completion claim.');
  console.log(limitations);
  if (errors) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Static asset audit failed: ${error.message}`);
  process.exitCode = 1;
});
