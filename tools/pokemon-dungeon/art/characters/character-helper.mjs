import * as THREE from 'three';

/** Original offline character-authoring helpers; no game runtime dependency. */
const RADIAL = [16, 12, 8];
const RINGS = [12, 8, 5];

/** @param {number} detail @returns {number} */
function level(detail) {
  return Math.max(0, Math.min(2, Math.floor(detail)));
}

/** @returns {{root: THREE.Group, rig: THREE.Group}} */
export function createRoot() {
  const root = new THREE.Group();
  root.name = 'asset-root';
  const rig = joint(root, 'rig-root');
  return { root, rig };
}

/**
 * @param {THREE.Object3D} parent
 * @param {string} name
 * @param {number[]} position
 * @param {number[]} rotation
 * @returns {THREE.Group}
 */
export function joint(parent, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const node = new THREE.Group();
  node.name = name;
  node.position.fromArray(position);
  node.rotation.set(rotation[0], rotation[1], rotation[2]);
  parent.add(node);
  return node;
}

/**
 * @param {string} name
 * @param {THREE.MeshStandardMaterialParameters} options
 * @returns {THREE.MeshStandardMaterial}
 */
export function createMaterial(name, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0,
    vertexColors: true,
    ...options,
  });
  material.name = name;
  return material;
}

/**
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.ColorRepresentation} color
 */
function colorGeometry(geometry, color) {
  const tint = new THREE.Color(color);
  const count = geometry.getAttribute('position').count;
  const values = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) tint.toArray(values, index * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(values, 3));
}

/**
 * @param {THREE.Object3D} parent
 * @param {string} name
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.ColorRepresentation} color
 * @param {THREE.MeshStandardMaterial} material
 * @param {number[]} position
 * @param {number[]} rotation
 * @returns {THREE.Mesh}
 */
export function addMesh(parent, name, geometry, color, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  if (!geometry.hasAttribute('color')) colorGeometry(geometry, color);
  geometry.name = `${name}-geometry`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.fromArray(position);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  parent.add(mesh);
  return mesh;
}

/**
 * @param {THREE.Object3D} parent
 * @param {string} name
 * @param {number[]} position
 * @param {number[]} radii
 * @param {THREE.ColorRepresentation} color
 * @param {THREE.MeshStandardMaterial} material
 * @param {number} detail
 * @returns {THREE.Mesh}
 */
export function ellipsoid(parent, name, position, radii, color, material, detail = 0) {
  const lod = level(detail);
  const geometry = new THREE.SphereGeometry(1, RADIAL[lod], RINGS[lod]);
  geometry.scale(radii[0], radii[1], radii[2]);
  return addMesh(parent, name, geometry, color, material, position);
}

/**
 * Curved cross sections provide tapered ears, limbs and tails. Vertex colors
 * are linear THREE.Color values and contain no baked light or shadow.
 * @param {THREE.Object3D} parent
 * @param {string} name
 * @param {number[][]} points
 * @param {(number | number[])[]} radii
 * @param {THREE.ColorRepresentation} color
 * @param {THREE.MeshStandardMaterial} material
 * @param {number} detail
 * @param {{segments?:number,sides?:number,endColor?:THREE.ColorRepresentation}} options
 * @returns {THREE.Mesh}
 */
export function loft(parent, name, points, radii, color, material, detail = 0, options = {}) {
  const lod = level(detail);
  const segments = options.segments ?? [14, 9, 5][lod];
  const sides = options.sides ?? [10, 7, 5][lod];
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3().fromArray(point)));
  const frames = curve.computeFrenetFrames(segments, false);
  const positions = [];
  const colors = [];
  const indices = [];
  const base = new THREE.Color(color);
  const end = new THREE.Color(options.endColor ?? color);
  const tint = new THREE.Color();
  const vertex = new THREE.Vector3();
  const section = radii.map((radius) => typeof radius === 'number' ? [radius, radius] : radius);
  for (let row = 0; row <= segments; row += 1) {
    const t = row / segments;
    const center = curve.getPoint(t);
    const interval = t * (section.length - 1);
    const lower = Math.min(section.length - 2, Math.floor(interval));
    const fraction = interval - lower;
    const radiusX = THREE.MathUtils.lerp(section[lower][0], section[lower + 1][0], fraction);
    const radiusY = THREE.MathUtils.lerp(section[lower][1], section[lower + 1][1], fraction);
    tint.copy(base).lerp(end, t);
    for (let column = 0; column <= sides; column += 1) {
      const angle = column / sides * Math.PI * 2;
      vertex.copy(center)
        .addScaledVector(frames.normals[row], Math.cos(angle) * radiusX)
        .addScaledVector(frames.binormals[row], Math.sin(angle) * radiusY);
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(tint.r, tint.g, tint.b);
      if (row < segments && column < sides) {
        const a = row * (sides + 1) + column;
        const b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const firstCenter = positions.length / 3;
  positions.push(...points[0]);
  colors.push(base.r, base.g, base.b);
  const lastCenter = positions.length / 3;
  positions.push(...points[points.length - 1]);
  colors.push(end.r, end.g, end.b);
  for (let side = 0; side < sides; side += 1) {
    const last = segments * (sides + 1) + side;
    indices.push(firstCenter, side + 1, side, lastCenter, last, last + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return addMesh(parent, name, geometry, color, material);
}

/**
 * @param {THREE.Object3D} parent
 * @param {string} name
 * @param {number[][]} outline
 * @param {number} depth
 * @param {THREE.ColorRepresentation} color
 * @param {THREE.MeshStandardMaterial} material
 * @param {number} detail
 * @returns {THREE.Mesh}
 */
export function extrudedShape(parent, name, outline, depth, color, material, detail = 0) {
  const shape = new THREE.Shape(outline.map((point) => new THREE.Vector2(point[0], point[1])));
  shape.closePath();
  const bevel = level(detail) < 2;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: bevel,
    bevelSegments: 1,
    bevelThickness: depth * 0.15,
    bevelSize: depth * 0.12,
    curveSegments: 2,
  });
  geometry.translate(0, 0, -depth / 2);
  return addMesh(parent, name, geometry, color, material);
}

/**
 * Bake a uniform authored size into local positions and geometry, retaining
 * the identity asset root and unit object scales. Call before creating clips.
 * @param {THREE.Group} root
 * @param {number} height
 * @returns {number}
 */
export function normalizeGrounded(root, height) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const scale = height / (bounds.max.y - bounds.min.y);
  const rig = root.getObjectByName('rig-root');
  if (!rig) throw new Error('Character requires rig-root');
  rig.position.y -= bounds.min.y;
  const scaled = new Set();
  root.traverse((node) => {
    if (node !== root) node.position.multiplyScalar(scale);
    if (node instanceof THREE.Mesh && !scaled.has(node.geometry)) {
      node.geometry.scale(scale, scale, scale);
      scaled.add(node.geometry);
    }
  });
  root.updateMatrixWorld(true);
  return scale;
}

/** @typedef {{r?:number[],p?:number[],s?:number[]}} PoseOffset */
/**
 * Bake authored pose offsets into core glTF-compatible transform tracks.
 * @param {THREE.Group} root
 * @param {string} name
 * @param {number} duration
 * @param {[number,Record<string,PoseOffset>][]} frames
 * @returns {THREE.AnimationClip}
 */
export function createClip(root, name, duration, frames) {
  const times = frames.map(([time]) => time * duration);
  const targets = new Set(frames.flatMap(([, pose]) => Object.keys(pose)));
  const tracks = [];
  for (const target of targets) {
    const node = root.getObjectByName(target);
    if (!node || target === 'asset-root') throw new Error(`Invalid animation target: ${target}`);
    for (const channel of /** @type {const} */ (['r', 'p', 's'])) {
      if (!frames.some(([, pose]) => pose[target]?.[channel])) continue;
      const values = [];
      for (const [, pose] of frames) {
        const offset = pose[target]?.[channel];
        if (channel === 'r') {
          const rotation = offset ?? [0, 0, 0];
          const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
          node.quaternion.clone().multiply(delta).toArray(values, values.length);
        } else if (channel === 'p') {
          const translation = offset ?? [0, 0, 0];
          values.push(node.position.x + translation[0], node.position.y + translation[1], node.position.z + translation[2]);
        } else {
          const scale = offset ?? [1, 1, 1];
          values.push(node.scale.x * scale[0], node.scale.y * scale[1], node.scale.z * scale[2]);
        }
      }
      if (channel === 'r') tracks.push(new THREE.QuaternionKeyframeTrack(`${target}.quaternion`, times, values));
      if (channel === 'p') tracks.push(new THREE.VectorKeyframeTrack(`${target}.position`, times, values));
      if (channel === 's') tracks.push(new THREE.VectorKeyframeTrack(`${target}.scale`, times, values));
    }
  }
  return new THREE.AnimationClip(name, duration, tracks);
}
