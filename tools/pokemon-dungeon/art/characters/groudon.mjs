import * as THREE from 'three';

const PALETTE = {
  red: 0xc92f32,
  crown: 0xed4942,
  shadow: 0x8c202f,
  seam: 0x222431,
  ivory: 0xe6ddd0,
  belly: 0xa8aaa7,
  gold: 0xffbc35,
  black: 0x101420,
};

/** Original articulated hard-surface art candidate; no gameplay dependencies. */
export function buildGroudon(detail = 0) {
  const level = Math.min(2, Math.max(0, Math.round(detail)));
  const radial = [16, 12, 8][level];
  const vertical = [10, 8, 6][level];
  const root = new THREE.Group();
  root.name = 'asset-root';
  const joints = new Map();
  const material = new THREE.MeshStandardMaterial({
    name: 'groudon-armor-surface',
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.84,
    metalness: 0,
  });

  function group(parent, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const result = new THREE.Group();
    result.name = name;
    result.position.fromArray(position);
    result.rotation.set(...rotation);
    parent.add(result);
    joints.set(name, result);
    return result;
  }

  function mesh(parent, name, geometry, color, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const tint = new THREE.Color(color);
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const result = new THREE.Mesh(geometry, material);
    result.name = name;
    result.position.fromArray(position);
    result.rotation.set(...rotation);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }

  function ellipsoid(parent, name, size, color, position, rotation) {
    const geometry = new THREE.SphereGeometry(1, radial, vertical);
    geometry.scale(...size);
    return mesh(parent, name, geometry, color, position, rotation);
  }

  // An eight-sided cross section makes broad, deliberate armor planes.
  // Each station specifies z, half-width, lower y, upper y; no mesh is mirrored.
  function hull(parent, name, stations, color, position, rotation) {
    const vertices = [];
    const indices = [];
    for (const [z, width, bottom, top] of stations) {
      const bevel = (top - bottom) * 0.2;
      vertices.push(
        width, top - bevel, z,
        width * 0.7, top, z,
        -width * 0.7, top, z,
        -width, top - bevel, z,
        -width, bottom + bevel, z,
        -width * 0.7, bottom, z,
        width * 0.7, bottom, z,
        width, bottom + bevel, z,
      );
    }
    for (let station = 0; station < stations.length - 1; station += 1) {
      for (let side = 0; side < 8; side += 1) {
        const a = station * 8 + side;
        const b = station * 8 + (side + 1) % 8;
        indices.push(a, b, b + 8, a, b + 8, a + 8);
      }
    }
    for (let side = 1; side < 7; side += 1) {
      indices.push(0, side + 1, side);
      const end = (stations.length - 1) * 8;
      indices.push(end, end + side, end + side + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    const faceted = geometry.toNonIndexed();
    geometry.dispose();
    faceted.computeVertexNormals();
    return mesh(parent, name, faceted, color, position, rotation);
  }

  function plate(parent, name, width, height, depth, color, position, rotation) {
    const stations = [
      [-depth / 2, width * 0.38, -height * 0.38, height * 0.38],
      [-depth * 0.2, width / 2, -height / 2, height / 2],
      [depth * 0.35, width * 0.47, -height * 0.46, height * 0.46],
      [depth / 2, width * 0.38, -height * 0.32, height * 0.32],
    ];
    if (level === 2) stations.splice(2, 1);
    return hull(parent, name, stations, color, position, rotation);
  }

  function spike(parent, name, start, end, radius, color = PALETTE.ivory) {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const geometry = new THREE.ConeGeometry(radius, direction.length(), level === 2 ? 4 : 6);
    const result = mesh(parent, name, geometry, color);
    result.position.copy(from.add(to).multiplyScalar(0.5));
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return result;
  }

  function claw(parent, name, width, length, position, rotation) {
    return hull(parent, name, [
      [0, width, -width * 0.5, width * 0.7],
      [length * 0.45, width * 0.8, -width * 0.1, width * 0.8],
      [length * 0.82, width * 0.4, -width * 0.22, width * 0.28],
      [length, width * 0.04, -width * 0.42, -width * 0.35],
    ], PALETTE.ivory, position, rotation);
  }

  function ventralPlate(parent, name, width, height, curve, position, color) {
    const segments = [12, 10, 8][level];
    const vertices = [];
    const indices = [];
    for (let section = 0; section <= segments; section += 1) {
      const angle = (section / segments - 0.5) * 2.36;
      const x = Math.sin(angle) * width;
      const z = (Math.cos(angle) - 1) * curve;
      const arch = 0.075 * Math.cos(angle);
      vertices.push(x, -height / 2 + arch, z, x, height / 2 + arch, z,
        x, -height / 2 + arch, z - 0.065, x, height / 2 + arch, z - 0.065);
      if (section < segments) {
        const a = section * 4;
        indices.push(a, a + 4, a + 5, a, a + 5, a + 1,
          a + 2, a + 3, a + 7, a + 2, a + 7, a + 6,
          a + 1, a + 5, a + 7, a + 1, a + 7, a + 3,
          a, a + 2, a + 6, a, a + 6, a + 4);
      }
    }
    indices.push(0, 1, 3, 0, 3, 2);
    const end = segments * 4;
    indices.push(end, end + 3, end + 1, end, end + 2, end + 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(parent, name, geometry, color, position);
  }

  const rig = group(root, 'rig-root');
  const pelvis = group(rig, 'pelvis', [0, 1.91, 0]);
  const spine = group(pelvis, 'spine', [0, 0.43, 0]);
  ellipsoid(pelvis, 'pelvis-dark-joints', [1.24, 0.83, 0.97], PALETTE.red);
  ellipsoid(spine, 'torso-dark-understructure', [1.32, 1.3, 0.97], PALETTE.red, [0, 0.43, -0.05]);
  ventralPlate(pelvis, 'pelvis-forward-armor', 0.81, 0.46, 0.65, [0, -0.22, 0.94], PALETTE.belly);

  // Overlapping curved ventral scales wrap the barrel, with narrow dark joints.
  for (let row = 0; row < 6; row += 1) {
    const y = -0.43 + row * 0.31;
    const width = [0.92, 1.12, 1.24, 1.26, 1.18, 0.98][row];
    const front = [0.91, 1.01, 1.055, 1.035, 0.94, 0.76][row];
    ventralPlate(spine, `belly-plate-${row + 1}`, width, 0.34, 0.65, [0, y, front], PALETTE.belly);
    for (const [side, sign] of [['left', 1], ['right', -1]]) {
      plate(spine, `side-armor-${side}-${row + 1}`, 0.63, 0.37, 0.73, row === 5 ? PALETTE.crown : PALETTE.red,
        [sign * (width * 0.91), y - 0.01, 0.34], [0, sign * 0.43, sign * -0.08]);
    }
  }
  for (let row = 0; row < 4; row += 1) {
    plate(spine, `back-armor-${row + 1}`, 1.9 - row * 0.18, 0.4, 0.3,
      row % 2 ? PALETTE.red : PALETTE.shadow, [0, row * 0.34, -0.86]);
    spike(spine, `dorsal-ridge-${row + 1}`, [0, row * 0.36, -0.83],
      [0, row * 0.36 + 0.31, -1.31], 0.29, PALETTE.red);
  }
  for (const [side, sign] of [['left', 1], ['right', -1]]) {
    for (let row = 0; row < 3; row += 1) {
      spike(spine, `flank-blade-${side}-${row + 1}`,
        [sign * 1.18, 0.06 + row * 0.46, -0.29],
        [sign * (1.84 - row * 0.05), 0.28 + row * 0.46, -0.49], 0.24);
    }
  }

  const neck = group(spine, 'neck', [0, 1.04, 0.28]);
  ellipsoid(neck, 'neck-dark-joint', [0.68, 0.43, 0.68], PALETTE.red, [0, 0.05, 0]);
  ventralPlate(neck, 'neck-front-gorget', 0.66, 0.29, 0.33, [0, -0.13, 0.63], PALETTE.belly);
  const head = group(neck, 'head', [0, 0.31, 0.27]);
  head.scale.set(1.24, 1.13, 1.36);
  hull(head, 'head-armored-cranium', [
    [-0.62, 0.47, -0.16, 0.52],
    [-0.2, 0.72, -0.24, 0.68],
    [0.32, 0.78, -0.22, 0.56],
    [0.76, 0.64, -0.22, 0.26],
    [1.03, 0.48, -0.22, 0.13],
  ], PALETTE.red);
  plate(head, 'crown-central-plate', 0.78, 0.15, 0.86, PALETTE.crown, [0, 0.59, -0.07], [-0.14, 0, 0]);
  plate(head, 'muzzle-central-plate', 0.63, 0.1, 0.8, PALETTE.crown, [0, 0.32, 0.46], [0.47, 0, 0]);
  hull(head, 'mouth-dark-separation', [[-0.1, 0.59, -0.265, -0.21], [0.77, 0.63, -0.265, -0.21], [1.035, 0.48, -0.265, -0.21]], PALETTE.black);
  const jaw = group(head, 'jaw', [0, -0.225, -0.2]);
  hull(jaw, 'jaw-heavy-lower-armor', [[0, 0.54, -0.27, 0], [0.91, 0.6, -0.28, -0.02], [1.2, 0.43, -0.19, -0.02]], PALETTE.shadow);
  plate(jaw, 'jaw-pale-chin', 0.83, 0.16, 0.78, PALETTE.ivory, [0, -0.25, 0.62]);
  for (const [side, sign] of [['left', 1], ['right', -1]]) {
    plate(head, `eye-dark-socket-${side}`, 0.46, 0.23, 0.1, PALETTE.black, [sign * 0.58, 0.29, 0.66], [0, sign * 0.65, sign * 0.13]);
    ellipsoid(head, `eye-gold-${side}`, [0.17, 0.052, 0.042], PALETTE.gold, [sign * 0.581, 0.289, 0.727], [0, sign * 0.65, sign * 0.2]);
    ellipsoid(head, `eye-pupil-${side}`, [0.02, 0.046, 0.018], PALETTE.black, [sign * 0.563, 0.286, 0.77], [0, sign * 0.65, 0]);
    plate(head, `brow-ridge-${side}`, 0.65, 0.18, 0.22, PALETTE.crown, [sign * 0.59, 0.41, 0.52], [0.08, sign * 0.53, sign * 0.24]);
    ellipsoid(head, `nostril-${side}`, [0.065, 0.025, 0.036], PALETTE.black, [sign * 0.29, 0.11, 1.01]);
    spike(head, `cheek-blade-${side}`, [sign * 0.66, -0.08, 0.1], [sign * 1.03, -0.15, -0.28], 0.17);
    for (let tooth = 0; tooth < 3; tooth += 1) {
      const z = 0.35 + tooth * 0.23;
      spike(head, `tooth-${side}-${tooth + 1}`, [sign * (0.6 - tooth * 0.05), -0.2, z], [sign * (0.59 - tooth * 0.05), -0.38, z + 0.015], 0.064);
    }
  }
  group(head, 'socket-mouth', [0, -0.18, 1.08]);

  for (const [side, sign] of [['left', 1], ['right', -1]]) {
    const upper = group(spine, `arm-upper-${side}`, [sign * 1.22, 0.91, 0.02], [-0.17, 0, sign * 0.27]);
    ellipsoid(upper, `shoulder-dark-${side}`, [0.65, 0.53, 0.61], PALETTE.red);
    plate(upper, `shoulder-cap-${side}`, 1.05, 0.26, 1.0, PALETTE.crown, [sign * 0.08, 0.32, 0]);
    ellipsoid(upper, `upper-arm-dark-${side}`, [0.51, 0.58, 0.52], PALETTE.red, [0, -0.38, 0]);
    for (let band = 0; band < 2; band += 1) {
      plate(upper, `upper-arm-band-${side}-${band + 1}`, 0.88, 0.065, 0.92, PALETTE.seam, [0, -0.24 - band * 0.39, 0.04]);
    }
    const lower = group(upper, `arm-lower-${side}`, [0, -0.79, 0], [-0.29, 0, 0]);
    ellipsoid(lower, `elbow-dark-${side}`, [0.49, 0.36, 0.44], PALETTE.shadow);
    ellipsoid(lower, `forearm-mass-${side}`, [0.57, 0.56, 0.59], PALETTE.red, [0, -0.31, 0.09]);
    for (let band = 0; band < 2; band += 1) {
      plate(lower, `forearm-band-${side}-${band + 1}`, 1.04, 0.065, 1.07,
        PALETTE.seam, [0, -0.12 - band * 0.32, 0.07]);
    }
    spike(lower, `elbow-blade-${side}`, [sign * 0.38, -0.12, -0.13], [sign * 0.91, 0.2, -0.24], 0.23);
    const hand = group(lower, `hand-${side}`, [0, -0.69, 0.15], [-0.15, 0, 0]);
    ellipsoid(hand, `hand-armor-${side}`, [0.56, 0.33, 0.47], PALETTE.red, [0, -0.06, 0.09]);
    for (let finger = 0; finger < 3; finger += 1) {
      claw(hand, `hand-claw-${side}-${finger + 1}`, 0.16, 0.68, [(finger - 1) * 0.33, -0.14, 0.36], [0.48, 0, 0]);
    }
    group(hand, `socket-hand-${side}`, [0, -0.15, 0.57]);

    const thigh = group(pelvis, `leg-upper-${side}`, [sign * 0.88, -0.25, 0.04]);
    ellipsoid(thigh, `thigh-dark-${side}`, [0.78, 0.69, 0.7], PALETTE.red, [0, -0.26, 0.01]);
    plate(thigh, `thigh-major-armor-${side}`, 1.36, 0.09, 1.28, PALETTE.seam, [0, -0.28, 0.03]);
    plate(thigh, `thigh-upper-armor-${side}`, 1.39, 0.21, 1.18, PALETTE.crown, [0, 0.25, -0.05]);
    const shin = group(thigh, `leg-lower-${side}`, [0, -0.78, 0.11]);
    ellipsoid(shin, `knee-dark-${side}`, [0.56, 0.45, 0.53], PALETTE.red, [0, -0.09, 0.03]);
    plate(shin, `knee-armor-${side}`, 0.95, 0.17, 0.93, PALETTE.shadow, [0, -0.04, 0.16]);
    plate(shin, `shin-armor-${side}`, 0.91, 0.34, 0.83, PALETTE.red, [0, -0.35, 0.04]);
    const foot = group(shin, `foot-${side}`, [0, -0.56, 0.17]);
    hull(foot, `foot-heavy-armor-${side}`, [[-0.41, 0.43, -0.15, 0.26], [0.32, 0.65, -0.16, 0.22], [0.73, 0.56, -0.15, 0.08]], PALETTE.red);
    for (let toe = 0; toe < 3; toe += 1) claw(foot, `foot-claw-${side}-${toe + 1}`, 0.18, 0.62, [(toe - 1) * 0.41, -0.07, 0.59]);
  }

  const tailBase = group(pelvis, 'tail-base', [0, -0.24, -0.56], [0.33, Math.PI, 0]);
  const tailMid = group(tailBase, 'tail-mid', [0, 0, 0.94], [-0.08, 0, 0]);
  const tailTip = group(tailMid, 'tail-tip', [0, 0, 0.93], [-0.19, 0, 0]);
  for (const [index, joint] of [tailBase, tailMid, tailTip].entries()) {
    const width = [0.62, 0.46, 0.29][index];
    const end = index === 2 ? 0.04 : width * 0.7;
    hull(joint, `tail-understructure-${index + 1}`, [[-0.08, width, -0.28, 0.3], [1.04, end, -0.15, 0.17]], PALETTE.seam);
    for (let band = 0; band < 3; band += 1) {
      const taper = 1 - band * (index === 2 ? 0.29 : 0.13);
      plate(joint, `tail-armor-${index + 1}-${band + 1}`, width * 2 * taper, 0.42 * taper, 0.31,
        band % 2 ? PALETTE.crown : PALETTE.red, [0, 0.09, band * 0.34 + 0.08]);
    }
    for (const [side, sign] of [['left', 1], ['right', -1]]) {
      spike(joint, `tail-blade-${side}-${index + 1}`, [sign * width * 0.72, 0.12, 0.36], [sign * (width + 0.43), 0.2, 0.04], width * 0.31);
    }
  }
  group(tailTip, 'socket-tail-tip', [0, 0, 1.08]);

  // Bake the staging normalization into geometry and translations, leaving every scale positive/identity.
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const scale = 5.5 / (bounds.max.y - bounds.min.y);
  root.traverse((node) => {
    node.position.multiplyScalar(scale);
    if (node instanceof THREE.Mesh) node.geometry.scale(scale, scale, scale);
  });
  rig.position.y -= bounds.min.y * scale;
  root.updateMatrixWorld(true);
  const contacts = new THREE.Box3();
  const point = new THREE.Vector3();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || !node.name.startsWith('foot-heavy-armor-')) return;
    const positions = node.geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index).applyMatrix4(node.matrixWorld);
      if (point.y < 0.0001) contacts.expandByPoint(point);
    }
  });
  if (contacts.isEmpty()) throw new Error('Groudon neutral sole contacts could not be located');
  rig.position.x -= (contacts.min.x + contacts.max.x) / 2;
  rig.position.z -= (contacts.min.z + contacts.max.z) / 2;
  root.updateMatrixWorld(true);

  function rotationTrack(name, frames) {
    const base = joints.get(name).quaternion.clone();
    const values = [];
    for (const [, x, y, z] of frames) {
      const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
      base.clone().multiply(delta).toArray(values, values.length);
    }
    return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, frames.map((frame) => frame[0]), values);
  }

  function liftTrack(name, frames) {
    const base = joints.get(name).position;
    return new THREE.VectorKeyframeTrack(`${name}.position`, frames.map((frame) => frame[0]),
      frames.flatMap(([, lift]) => [base.x, base.y + lift * scale, base.z]));
  }

  function motion(name, duration, rotations, lifts = {}) {
    const tracks = Object.entries(rotations).map(([joint, frames]) => rotationTrack(joint, frames));
    tracks.push(...Object.entries(lifts).map(([joint, frames]) => liftTrack(joint, frames)));
    return new THREE.AnimationClip(name, duration, tracks);
  }

  const clips = [
    motion('idle', 3, {
      spine: [[0, 0, 0, 0], [1.5, 0.025, 0, 0], [3, 0, 0, 0]],
      head: [[0, 0, 0, 0], [1.5, -0.025, 0.025, 0], [3, 0, 0, 0]],
      'tail-base': [[0, 0, -0.04, 0], [1.5, 0, 0.04, 0], [3, 0, -0.04, 0]],
    }, { spine: [[0, 0], [1.5, 0.025], [3, 0]] }),
    motion('locomotion', 1.6, {
      'leg-upper-left': [[0, 0.23, 0, 0], [0.8, -0.23, 0, 0], [1.6, 0.23, 0, 0]],
      'leg-upper-right': [[0, -0.23, 0, 0], [0.8, 0.23, 0, 0], [1.6, -0.23, 0, 0]],
      'leg-lower-left': [[0, 0, 0, 0], [0.4, 0.29, 0, 0], [0.8, 0, 0, 0], [1.6, 0, 0, 0]],
      'leg-lower-right': [[0, 0, 0, 0], [0.8, 0, 0, 0], [1.2, 0.29, 0, 0], [1.6, 0, 0, 0]],
      'arm-upper-left': [[0, -0.16, 0, 0], [0.8, 0.16, 0, 0], [1.6, -0.16, 0, 0]],
      'arm-upper-right': [[0, 0.16, 0, 0], [0.8, -0.16, 0, 0], [1.6, 0.16, 0, 0]],
      'tail-base': [[0, 0, -0.09, 0], [0.8, 0, 0.09, 0], [1.6, 0, -0.09, 0]],
    }, { pelvis: [[0, 0], [0.4, 0.08], [0.8, 0], [1.2, 0.08], [1.6, 0]] }),
    motion('attack-physical', 1.15, {
      spine: [[0, 0, 0, 0], [0.32, -0.09, -0.24, 0], [0.56, 0.2, 0.27, 0], [1.15, 0, 0, 0]],
      'arm-upper-right': [[0, 0, 0, 0], [0.32, -1.1, -0.25, -0.22], [0.56, -0.44, 0.4, 0.35], [1.15, 0, 0, 0]],
      'arm-lower-right': [[0, 0, 0, 0], [0.32, -0.55, 0, 0], [0.56, 0.24, 0, 0], [1.15, 0, 0, 0]],
      head: [[0, 0, 0, 0], [0.56, -0.16, -0.14, 0], [1.15, 0, 0, 0]],
    }),
    motion('attack-special', 1.8, {
      neck: [[0, 0, 0, 0], [0.65, -0.3, 0, 0], [0.95, 0.17, 0, 0], [1.8, 0, 0, 0]],
      jaw: [[0, 0, 0, 0], [0.65, 0.42, 0, 0], [1.3, 0.5, 0, 0], [1.8, 0, 0, 0]],
      'arm-upper-left': [[0, 0, 0, 0], [0.65, -0.21, 0, 0.22], [1.3, -0.18, 0, 0.2], [1.8, 0, 0, 0]],
      'arm-upper-right': [[0, 0, 0, 0], [0.65, -0.21, 0, -0.22], [1.3, -0.18, 0, -0.2], [1.8, 0, 0, 0]],
    }),
    motion('cast-status', 2.2, {
      spine: [[0, 0, 0, 0], [0.8, -0.07, 0, 0], [1.45, -0.11, 0, 0], [2.2, 0, 0, 0]],
      'arm-upper-left': [[0, 0, 0, 0], [0.8, -0.55, 0, 0.4], [1.45, -0.65, 0, 0.5], [2.2, 0, 0, 0]],
      'arm-upper-right': [[0, 0, 0, 0], [0.8, -0.55, 0, -0.4], [1.45, -0.65, 0, -0.5], [2.2, 0, 0, 0]],
      'tail-mid': [[0, 0, 0, 0], [1.1, 0, 0.13, 0], [2.2, 0, 0, 0]],
    }),
    motion('hit-light', 0.55, {
      spine: [[0, 0, 0, 0], [0.12, -0.09, 0.06, 0], [0.55, 0, 0, 0]],
      head: [[0, 0, 0, 0], [0.12, -0.1, 0, 0.04], [0.55, 0, 0, 0]],
    }),
    motion('hit-heavy', 1.15, {
      spine: [[0, 0, 0, 0], [0.22, -0.23, 0, -0.1], [0.63, 0.11, 0, 0.07], [1.15, 0, 0, 0]],
      neck: [[0, 0, 0, 0], [0.22, -0.18, 0.12, 0], [1.15, 0, 0, 0]],
      'arm-upper-left': [[0, 0, 0, 0], [0.22, -0.2, 0, 0.28], [1.15, 0, 0, 0]],
    }, { spine: [[0, 0], [0.22, -0.11], [0.63, -0.05], [1.15, 0]] }),
    motion('defeat', 2.4, {
      spine: [[0, 0, 0, 0], [0.65, 0.16, 0, 0], [1.5, 0.42, 0, 0], [2.4, 0.46, 0, 0]],
      head: [[0, 0, 0, 0], [1.5, 0.24, 0, -0.08], [2.4, 0.28, 0, -0.08]],
      'arm-upper-left': [[0, 0, 0, 0], [1.5, 0.16, 0, -0.05], [2.4, 0.2, 0, -0.05]],
      'arm-upper-right': [[0, 0, 0, 0], [1.5, 0.16, 0, 0.05], [2.4, 0.2, 0, 0.05]],
    }),
    motion('celebrate', 2.4, {
      'arm-upper-left': [[0, 0, 0, 0], [0.7, -0.85, 0, 0.5], [1.2, -1, 0, 0.65], [1.7, -0.85, 0, 0.5], [2.4, 0, 0, 0]],
      'arm-upper-right': [[0, 0, 0, 0], [0.7, -0.85, 0, -0.5], [1.2, -1, 0, -0.65], [1.7, -0.85, 0, -0.5], [2.4, 0, 0, 0]],
      head: [[0, 0, 0, 0], [0.7, -0.16, 0, 0], [1.7, -0.16, 0, 0], [2.4, 0, 0, 0]],
      jaw: [[0, 0, 0, 0], [0.9, 0.4, 0, 0], [1.6, 0.4, 0, 0], [2.4, 0, 0, 0]],
    }, { pelvis: [[0, 0], [0.7, 0.1], [1.2, 0.04], [1.7, 0.1], [2.4, 0]] }),
    motion('rest-sleep', 4, {
      spine: [[0, 0.15, 0, 0], [2, 0.175, 0, 0], [4, 0.15, 0, 0]],
      head: [[0, 0.22, -0.07, 0], [2, 0.24, -0.07, 0], [4, 0.22, -0.07, 0]],
      'arm-upper-left': [[0, 0.07, 0, 0], [2, 0.09, 0, 0], [4, 0.07, 0, 0]],
      'arm-upper-right': [[0, 0.07, 0, 0], [2, 0.09, 0, 0], [4, 0.07, 0, 0]],
    }, { spine: [[0, 0], [2, 0.02], [4, 0]] }),
    motion('interact', 1.6, {
      head: [[0, 0, 0, 0], [0.5, 0.1, -0.15, 0], [1, 0.17, 0.08, 0], [1.6, 0, 0, 0]],
      'arm-upper-left': [[0, 0, 0, 0], [0.65, -0.42, -0.15, 0.08], [1.1, -0.36, -0.1, 0.08], [1.6, 0, 0, 0]],
      'arm-lower-left': [[0, 0, 0, 0], [0.65, -0.37, 0, 0], [1.6, 0, 0, 0]],
    }),
  ];

  return {
    root,
    clips,
    notes: [
      'Original procedural Groudon art candidate: authored armor hulls, seams, eyes, belly plates, claws and articulated tail; no extracted meshes, textures or commercial animation.',
      'Neutral measured staging height is 5.5 meters with the lowest neutral contact at Y=0; +Z is forward and asset-root has identity transforms.',
      'One opaque vertex-color MeshStandardMaterial serves every LOD. Textureless core glTF geometry; cel light bands belong to the reviewed preview renderer.',
      'Rigid plated transform hierarchy, not a skinned soft-tissue model. Art review must inspect joint separation, deformation, silhouette and all eleven in-place clips.',
      `LOD${level} reduces round-joint tessellation while retaining identifying armor, claws, face, rig names, sockets and clip vocabulary.`,
      'P06 art preview only; animations do not encode move timing, collision, damage, status, recruitment or story outcomes.',
    ],
  };
}
