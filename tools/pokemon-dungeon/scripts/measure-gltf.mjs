// Static glTF data inspection. No loader, authoring builder or game module is evaluated.
import { Matrix4, Quaternion, Vector3 } from 'three';

function check(condition, message) {
  if (!condition) throw new Error(`glTF measurements: ${message}`);
}

function named(entries, label) {
  const names = entries.map(entry => entry.name);
  check(names.every(name => typeof name === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)), `${label} need canonical names`);
  check(new Set(names).size === names.length, `duplicate ${label} names`);
  return names;
}

// Run before Khronos validation: small sparse payloads can describe enormous
// decoded arrays. This checks declarations, never allocates from their counts.
export function preflightGltfMeasurements(document) {
  const accessors = document.accessors ?? [];
  const meshes = document.meshes ?? [];
  const nodes = document.nodes ?? [];
  check(Array.isArray(accessors) && Array.isArray(meshes) && Array.isArray(nodes), 'invalid measurement arrays');
  const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  let components = 0;
  for (const accessor of accessors) {
    const width = widths[accessor?.type];
    check(width && Number.isSafeInteger(accessor.count) && accessor.count > 0, 'invalid accessor count/type');
    check(accessor.count * width <= 2_097_152, 'measured accessor exceeds 16 MiB decoded budget');
    components += accessor.count * width;
    check(components <= 8_388_608, 'model exceeds 64 MiB decoded measurement budget');
  }
  let vertices = 0;
  for (const node of nodes) {
    if (node.mesh === undefined) continue;
    check(Number.isSafeInteger(node.mesh) && Array.isArray(meshes[node.mesh]?.primitives), 'invalid mesh declaration');
    for (const primitive of meshes[node.mesh].primitives) {
      const index = primitive.attributes?.POSITION;
      check(Number.isSafeInteger(index) && accessors[index]?.type === 'VEC3', 'invalid POSITION accessor');
      vertices += accessors[index].count;
      check(vertices <= 4_194_304, 'model exceeds 4194304 transformed vertex instances');
    }
  }
}

// Decode actual bytes, including sparse overrides and interleaved strides. Never
// use accessor min/max as evidence for a vertex or animation measurement.
function accessorsOf(document, buffers) {
  const cache = new Map();
  let decodedComponents = 0;
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const formats = {
    5120: [1, 'readInt8', 127], 5121: [1, 'readUInt8', 255],
    5122: [2, 'readInt16LE', 32767], 5123: [2, 'readUInt16LE', 65535],
    5125: [4, 'readUInt32LE', 4294967295], 5126: [4, 'readFloatLE', 1],
  };
  function values(viewIndex, byteOffset, count, width, componentType, normalized = false) {
    const view = document.bufferViews[viewIndex];
    const buffer = buffers[view.buffer];
    const [size, method, divisor] = formats[componentType];
    const stride = view.byteStride ?? width * size;
    const start = (view.byteOffset ?? 0) + byteOffset;
    check(byteOffset + Math.max(0, count - 1) * stride + width * size <= view.byteLength, 'accessor exceeds buffer view');
    const result = new Float64Array(count * width);
    for (let row = 0; row < count; row += 1) for (let column = 0; column < width; column += 1) {
      let value = buffer[method](start + row * stride + column * size);
      if (normalized) value = Math.max(value / divisor, -1);
      check(Number.isFinite(value), 'nonfinite accessor component');
      result[row * width + column] = value;
    }
    return result;
  }
  return index => {
    if (cache.has(index)) return cache.get(index);
    const accessor = document.accessors[index];
    const width = components[accessor.type];
    check(width !== undefined && formats[accessor.componentType], 'unsupported measured accessor layout');
    // Bounded decoded storage also covers a tiny sparse file claiming huge arrays.
    check(accessor.count * width <= 2_097_152, 'measured accessor exceeds 16 MiB decoded budget');
    decodedComponents += accessor.count * width;
    check(decodedComponents <= 8_388_608, 'model exceeds 64 MiB decoded measurement budget');
    const result = accessor.bufferView === undefined ? new Float64Array(accessor.count * width)
      : values(accessor.bufferView, accessor.byteOffset ?? 0, accessor.count, width, accessor.componentType, accessor.normalized);
    if (accessor.sparse) {
      const sparse = accessor.sparse;
      const indices = values(sparse.indices.bufferView, sparse.indices.byteOffset ?? 0, sparse.count, 1, sparse.indices.componentType);
      const replacements = values(sparse.values.bufferView, sparse.values.byteOffset ?? 0, sparse.count, width, accessor.componentType, accessor.normalized);
      for (let row = 0; row < sparse.count; row += 1) result.set(replacements.subarray(row * width, (row + 1) * width), indices[row] * width);
    }
    cache.set(index, result);
    return result;
  };
}

function imageEdge(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    check(bytes.toString('ascii', 12, 16) === 'IHDR', 'PNG is missing IHDR');
    return Math.max(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
  }
  check(bytes.length >= 4 && bytes.readUInt16BE(0) === 0xffd8, 'unsupported image bytes');
  for (let offset = 2; offset + 3 < bytes.length;) {
    check(bytes[offset] === 0xff, 'invalid JPEG marker');
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    check(length >= 2 && offset + length <= bytes.length, 'invalid JPEG segment');
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      check(length >= 8, 'invalid JPEG frame');
      return Math.max(bytes.readUInt16BE(offset + 3), bytes.readUInt16BE(offset + 5));
    }
    offset += length;
  }
  throw new Error('glTF measurements: JPEG frame dimensions missing');
}

/** Inspect a structurally validated core glTF using only its hash-checked bytes. */
export function measureGltf(document, buffers, images) {
  preflightGltfMeasurements(document);
  const nodes = document.nodes ?? [];
  const meshes = document.meshes ?? [];
  const materials = document.materials ?? [];
  // This production wave has rigid hierarchy animation only. Deformed neutral
  // bounds need a separately reviewed skin/morph measurement implementation.
  check(!(document.skins?.length) && nodes.every(node => node.skin === undefined && node.weights === undefined)
    && meshes.every(mesh => mesh.weights === undefined && mesh.primitives.every(primitive => !(primitive.targets?.length))), 'skin/morph bounds are not supported by this static measurement gate');
  const read = accessorsOf(document, buffers);
  const nodeNames = named(nodes, 'node');
  const meshNames = named(meshes, 'mesh');
  named(materials, 'material');
  const scene = document.scenes?.[document.scene ?? 0];
  check(document.scenes?.length === 1 && scene.nodes.length === 1, 'expected one scene and one asset root');
  const rootIndex = scene.nodes[0];
  check(nodes[rootIndex].name === 'asset-root', 'scene root differs from asset-root');
  const worlds = new Map();
  const parents = new Map();
  const pending = [[rootIndex, new Matrix4()]];
  while (pending.length) {
    const [index, parent] = pending.pop();
    check(!worlds.has(index), 'node repeated in scene hierarchy');
    const node = nodes[index];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale ?? [1, 1, 1]),
    );
    if (index === rootIndex) check(local.equals(new Matrix4()), 'asset-root transform is not identity');
    const world = parent.clone().multiply(local);
    worlds.set(index, world);
    for (const child of node.children ?? []) { parents.set(child, index); pending.push([child, world]); }
  }
  check(worlds.size === nodes.length, 'nodes outside the asset scene are unsupported');
  const usedMeshes = new Set();
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  let triangles = 0;
  let measuredVertices = 0;
  for (const [index, world] of worlds) {
    const node = nodes[index];
    if (node.mesh === undefined) continue;
    usedMeshes.add(node.mesh);
    const mesh = meshes[node.mesh];
    for (const primitive of mesh.primitives) {
      check((primitive.mode ?? 4) === 4, 'only triangle primitives have a supported geometry budget');
      const positionAccessor = document.accessors[primitive.attributes.POSITION];
      measuredVertices += positionAccessor.count;
      check(measuredVertices <= 4_194_304, 'model exceeds 4194304 transformed vertex instances');
      const positions = read(primitive.attributes.POSITION);
      const count = document.accessors[primitive.indices ?? primitive.attributes.POSITION].count;
      check(count % 3 === 0, 'incomplete triangle primitive');
      triangles += count / 3;
      for (let vertex = 0; vertex < positionAccessor.count; vertex += 1) {
        const point = new Vector3().fromArray(positions, vertex * 3).applyMatrix4(world);
        check(point.toArray().every(Number.isFinite), 'nonfinite transformed position');
        min.min(point); max.max(point);
      }
    }
  }
  check(usedMeshes.size === meshes.length, 'unreferenced mesh definitions are unsupported');
  check([...min.toArray(), ...max.toArray()].every(Number.isFinite), 'empty geometry bounds');
  const materialRecords = materials.map((material, index) => {
    const channels = [];
    const textures = [];
    const pbr = material.pbrMetallicRoughness;
    if (pbr) { channels.push('base-color', 'roughness', 'metalness'); textures.push(pbr.baseColorTexture, pbr.metallicRoughnessTexture); }
    if (material.normalTexture) { channels.push('normal'); textures.push(material.normalTexture); }
    if (material.occlusionTexture) { channels.push('occlusion'); textures.push(material.occlusionTexture); }
    if (material.emissiveFactor || material.emissiveTexture) channels.push('emissive');
    textures.push(material.emissiveTexture);
    if (meshes.some(mesh => mesh.primitives.some(primitive => primitive.material === index && primitive.attributes.COLOR_0 !== undefined))) channels.push('vertex-color');
    const usedImages = textures.filter(Boolean).map(texture => images[document.textures[texture.index].source]);
    return { name: material.name, channels, textureFileIds: [...new Set(usedImages.flatMap(image => image.fileId ? [image.fileId] : []))], alphaMode: material.alphaMode ?? 'OPAQUE', doubleSided: material.doubleSided ?? false, maximumTextureEdge: Math.max(0, ...usedImages.map(image => imageEdge(image.bytes))) };
  });
  const durations = new Map((document.animations ?? []).map(animation => [animation.name, Math.max(...animation.samplers.map(sampler => {
    const times = read(sampler.input);
    return times[times.length - 1];
  }))]));
  const sockets = nodes.flatMap((node, index) => node.name.startsWith('socket-') ? [{ name: node.name, parentNode: nodes[parents.get(index)]?.name }] : []);
  return { triangles, nodeCount: nodes.length, meshCount: meshes.length, materialCount: materials.length, skinJointCount: new Set((document.skins ?? []).flatMap(skin => skin.joints)).size, boundsMeters: { min: min.toArray(), max: max.toArray() }, nodeNames, meshNames, materials: materialRecords, durations, sockets };
}
