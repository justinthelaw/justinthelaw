import * as THREE from 'three';
import {
  addMesh, createClip, createMaterial, createRoot, ellipsoid, extrudedShape,
  joint, loft, normalizeGrounded,
} from './character-helper.mjs';

const YELLOW = '#f8cc38';
const MUZZLE = '#ffe171';
const BROWN = '#795031';
const DARK = '#28252a';
const RED = '#e84a37';

/**
 * Original authored pear-shaped body, with width varying continuously by height.
 * @param {THREE.Group} pelvis
 * @param {THREE.MeshStandardMaterial} material
 * @param {number} detail
 */
function body(pelvis, material, detail) {
  const geometry = new THREE.SphereGeometry(1, [20, 14, 8][detail], [16, 10, 6][detail]);
  const points = geometry.getAttribute('position');
  for (let index = 0; index < points.count; index += 1) {
    const height = points.getY(index);
    const taper = 1 - height * 0.17;
    points.setXYZ(index, points.getX(index) * 0.177 * taper, height * 0.25 + 0.10, points.getZ(index) * 0.137 * taper);
  }
  geometry.computeVertexNormals();
  addMesh(pelvis, 'torso-mesh', geometry, YELLOW, material);
  for (const [stripe, center] of [0.16, 0.26].entries()) {
    const vertices = [];
    const indices = [];
    const columns = [12, 8, 5][detail];
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column <= columns; column += 1) {
        const u = column / columns * 2 - 1;
        const x = u * (stripe === 0 ? 0.132 : 0.112);
        const y = center + (row - 0.5) * 0.024 * (1 - Math.abs(u) * 0.45) + Math.abs(u) * 0.008;
        const ny = (y - 0.10) / 0.25;
        const taper = 1 - ny * 0.17;
        const z = -0.137 * taper * Math.sqrt(Math.max(0.02, 1 - ny * ny - (x / (0.177 * taper)) ** 2)) - 0.003;
        vertices.push(x, y, z);
        if (row === 0 && column < columns) {
          const a = column;
          const b = a + columns + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const marking = new THREE.BufferGeometry();
    marking.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    marking.setIndex(indices);
    marking.computeVertexNormals();
    addMesh(pelvis, `back-stripe-${stripe + 1}-mesh`, marking, BROWN, material);
  }
}

/**
 * @param {THREE.Group} head
 * @param {THREE.MeshStandardMaterial} fur
 * @param {THREE.MeshStandardMaterial} shine
 * @param {number} detail
 */
function face(head, fur, shine, detail) {
  ellipsoid(head, 'head-mesh', [0, 0.035, 0.01], [0.203, 0.17, 0.155], YELLOW, fur, detail);
  for (const [side, sign] of [['left', 1], ['right', -1]]) {
    const x = Number(sign);
    const eye = joint(head, `eye-${side}`, [x * 0.079, 0.067, 0.152]);
    ellipsoid(eye, `eye-${side}-mesh`, [0, 0, 0], [0.034, 0.044, 0.012], DARK, shine, detail);
    ellipsoid(eye, `iris-${side}-mesh`, [0, -0.015, 0.011], [0.022, 0.019, 0.003], '#573e32', shine, detail);
    ellipsoid(eye, `eye-highlight-${side}-mesh`, [-0.009, 0.015, 0.012], [0.01, 0.012, 0.004], '#fffaf0', shine, detail);
    if (detail === 0) {
      const glimmer = new THREE.SphereGeometry(1, 6, 4);
      glimmer.scale(0.0035, 0.004, 0.002);
      addMesh(eye, `eye-glimmer-${side}-mesh`, glimmer, '#ffedbf', shine, [0.012, -0.022, 0.013]);
    }
    const cheek = joint(head, `cheek-${side}`, [x * 0.143, -0.013, 0.125], [0, x * 0.45, 0]);
    ellipsoid(cheek, `cheek-${side}-mesh`, [0, 0, 0], [0.032, 0.030, 0.008], RED, fur, detail);
    ellipsoid(head, `muzzle-${side}-mesh`, [x * 0.022, -0.046, 0.151], [0.037, 0.020, 0.014], YELLOW, fur, detail);
    const ear = joint(head, `ear-${side}`, [x * 0.124, 0.148, -0.011], [0, x * -0.08, x * -0.19]);
    const curve = [[0, 0, 0], [x * 0.003, 0.06, 0], [x * 0.004, 0.125, -0.006], [0, 0.180, -0.014]];
    loft(ear, `ear-${side}-mesh`, curve, [[0.017, 0.027], [0.021, 0.045], [0.019, 0.037], [0.014, 0.025]], YELLOW, fur, detail);
    const tip = joint(ear, `ear-tip-${side}`, [0, 0.180, -0.014]);
    loft(tip, `ear-tip-${side}-mesh`, [[0, 0, 0], [x * -0.002, 0.041, -0.008], [x * -0.009, 0.087, -0.015]], [[0.014, 0.025], [0.011, 0.020], [0.001, 0.001]], DARK, fur, detail, { segments: [8, 6, 4][detail] });
  }
  const nose = extrudedShape(head, 'nose-mesh', [[-0.009, 0.004], [0.009, 0.004], [0, -0.006]], 0.011, DARK, shine, detail);
  nose.position.set(0, -0.019, 0.177);
  const mouth = joint(head, 'mouth', [0, 0, 0]);
  loft(mouth, 'smile-mesh', [[-0.030, -0.057, 0.169], [-0.017, -0.065, 0.173], [0, -0.056, 0.177], [0.017, -0.065, 0.173], [0.030, -0.057, 0.169]], [0.0025, 0.0025], DARK, fur, detail, { segments: [12, 10, 8][detail], sides: [6, 5, 4][detail] });
  joint(head, 'socket-mouth', [0, -0.060, 0.185]);
}

/**
 * @param {THREE.Group} pelvis
 * @param {THREE.Group} spine
 * @param {THREE.MeshStandardMaterial} fur
 * @param {number} detail
 */
function limbs(pelvis, spine, fur, detail) {
  for (const [side, direction] of [['left', 1], ['right', -1]]) {
    const sign = Number(direction);
    const arm = joint(spine, `upper-arm-${side}`, [sign * 0.153, 0.023, 0.024], [0, 0, sign * 0.10]);
    loft(arm, `upper-arm-${side}-mesh`, [[0, 0, 0], [sign * 0.025, -0.04, 0.012], [sign * 0.022, -0.080, 0.022]], [0.044, 0.036, 0.030], YELLOW, fur, detail, { segments: [9, 6, 4][detail] });
    const forearm = joint(arm, `forearm-${side}`, [sign * 0.022, -0.078, 0.022]);
    loft(forearm, `forearm-${side}-mesh`, [[0, 0, 0], [-sign * 0.005, -0.030, 0.015], [-sign * 0.012, -0.057, 0.023]], [0.030, 0.029, 0.022], YELLOW, fur, detail, { segments: [7, 5, 3][detail] });
    const hand = joint(forearm, `hand-${side}`, [-sign * 0.012, -0.057, 0.023]);
    ellipsoid(hand, `palm-${side}-mesh`, [0, -0.006, 0.005], [0.027, 0.023, 0.024], YELLOW, fur, detail);
    for (let digit = 0; digit < 3; digit += 1) {
      const x = (digit - 1) * 0.012;
      loft(hand, `finger-${digit + 1}-${side}-mesh`, [[x, -0.012, 0.012], [x, -0.030 + Math.abs(digit - 1) * 0.003, 0.017], [x, -0.033 + Math.abs(digit - 1) * 0.003, 0.010]], [0.007, 0.006, 0.003], MUZZLE, fur, detail, { segments: [5, 4, 3][detail], sides: [6, 5, 3][detail] });
    }
    joint(hand, `socket-hand-${side}`, [0, -0.008, 0.040]);
    const thigh = joint(pelvis, `thigh-${side}`, [sign * 0.093, -0.142, 0.004]);
    ellipsoid(thigh, `thigh-${side}-mesh`, [0, 0.021, 0], [0.064, 0.066, 0.060], YELLOW, fur, detail);
    const ankle = joint(thigh, `ankle-${side}`, [0, -0.064, 0.029], [0, sign * 0.12, 0]);
    ellipsoid(ankle, `foot-${side}-mesh`, [0, -0.007, 0.025], [0.061, 0.047, 0.100], YELLOW, fur, detail);
    for (let crease = 0; crease < 2; crease += 1) {
      const x = crease === 0 ? -0.019 : 0.019;
      loft(ankle, `toe-crease-${crease + 1}-${side}-mesh`, [[x, 0.010, 0.118], [x, 0.022, 0.105], [x, 0.026, 0.092]], [0.0018, 0.0018], BROWN, fur, detail, { segments: detail === 2 ? 3 : 4, sides: [5, 4, 3][detail] });
    }
  }
}

/**
 * @param {THREE.Group} pelvis
 * @param {THREE.MeshStandardMaterial} material
 * @param {number} detail
 */
function lightningTail(pelvis, material, detail) {
  const base = joint(pelvis, 'tail-base', [0.076, -0.065, -0.105], [-0.20, -0.24, -0.05]);
  extrudedShape(base, 'tail-stalk-mesh', [[-0.012, 0], [0.025, 0], [0.105, 0.133], [0.068, 0.154]], 0.035, BROWN, material, detail);
  const blade = joint(base, 'tail-blade', [0.074, 0.133, 0]);
  const mesh = extrudedShape(blade, 'tail-blade-mesh', [[0, 0], [-0.056, 0.147], [0.039, 0.160], [-0.046, 0.315], [0.115, 0.429], [0.242, 0.277], [0.077, 0.222], [0.144, 0.099], [0.026, 0.089], [0.044, 0.017]], 0.044, YELLOW, material, detail);
  mesh.geometry.scale(0.78, 0.78, 0.86);
  joint(blade, 'socket-tail-tip', [0.115 * 0.78, 0.429 * 0.78, 0]);
}

/**
 * Species-specific poses; the authored translation is local, never root motion.
 * @param {THREE.Group} root
 * @param {number} scale
 * @returns {THREE.AnimationClip[]}
 */
function animations(root, scale) {
  /** @type {(name:string,duration:number,frames:[number,Record<string,import('./character-helper.mjs').PoseOffset>][])=>(THREE.AnimationClip)} */
  const clip = (name, duration, frames) => createClip(root, name, duration, frames);
  const idle = {
    spine: { r: [0.022, 0, 0] }, head: { r: [-0.025, 0.025, -0.025] },
    pelvis: { p: [0, 0.007 * scale, 0] },
    'ear-left': { r: [0.04, 0, -0.045] }, 'ear-right': { r: [-0.02, 0, 0.06] },
    'tail-base': { r: [0, 0.10, 0.04] },
  };
  const strideA = {
    pelvis: { p: [0, 0.018 * scale, 0], r: [0.04, 0.045, 0.025] },
    'thigh-left': { r: [0.55, 0, 0] }, 'thigh-right': { r: [-0.55, 0, 0] },
    'ankle-left': { r: [-0.33, 0, 0] }, 'ankle-right': { r: [0.14, 0, 0] },
    'upper-arm-left': { r: [-0.45, 0, 0.08] }, 'upper-arm-right': { r: [0.45, 0, -0.08] },
    head: { r: [-0.045, -0.04, 0] }, 'ear-left': { r: [-0.12, 0, 0] },
    'ear-right': { r: [-0.17, 0, 0] }, 'tail-base': { r: [-0.12, -0.12, 0.07] },
  };
  const strideB = {
    pelvis: { p: [0, 0.018 * scale, 0], r: [0.04, -0.045, -0.025] },
    'thigh-left': { r: [-0.55, 0, 0] }, 'thigh-right': { r: [0.55, 0, 0] },
    'ankle-left': { r: [0.14, 0, 0] }, 'ankle-right': { r: [-0.33, 0, 0] },
    'upper-arm-left': { r: [0.45, 0, 0.08] }, 'upper-arm-right': { r: [-0.45, 0, -0.08] },
    head: { r: [-0.045, 0.04, 0] }, 'ear-left': { r: [-0.17, 0, 0] },
    'ear-right': { r: [-0.12, 0, 0] }, 'tail-base': { r: [-0.12, 0.12, -0.07] },
  };
  const charge = {
    spine: { r: [-0.11, 0, 0] }, head: { r: [-0.11, 0, 0] },
    'upper-arm-left': { r: [-0.15, 0, 0.85] }, 'upper-arm-right': { r: [-0.15, 0, -0.85] },
    'ear-left': { r: [-0.10, 0, 0.09] }, 'ear-right': { r: [-0.10, 0, -0.09] },
    'tail-base': { r: [-0.22, 0, 0.15] }, 'tail-blade': { r: [0, 0.15, -0.12] },
    'cheek-left': { s: [1.10, 1.10, 1.10] }, 'cheek-right': { s: [1.10, 1.10, 1.10] },
  };
  const sleep = {
    pelvis: { p: [0, -0.066 * scale, 0.022 * scale] }, spine: { r: [0.22, 0, 0] },
    head: { r: [0.36, -0.05, 0.10] },
    'thigh-left': { r: [-0.48, 0, 0.10] }, 'thigh-right': { r: [-0.48, 0, -0.10] },
    'upper-arm-left': { r: [-0.56, 0, -0.20] }, 'upper-arm-right': { r: [-0.56, 0, 0.20] },
    'ear-left': { r: [0.22, 0, -0.32] }, 'ear-right': { r: [0.20, 0, 0.22] },
    'eye-left': { s: [1, 0.10, 1] }, 'eye-right': { s: [1, 0.10, 1] },
    'tail-base': { r: [0.12, 0.3, 0.18] },
  };
  const sleepingBreath = { ...sleep, spine: { r: [0.235, 0, 0] }, head: { r: [0.375, -0.05, 0.10] } };
  return [
    clip('idle', 2.6, [[0, {}], [0.5, idle], [1, {}]]),
    clip('locomotion', 0.68, [[0, strideA], [0.25, {}], [0.5, strideB], [0.75, {}], [1, strideA]]),
    clip('attack-physical', 0.72, [[0, {}], [0.22, { pelvis: { p: [0, -0.024 * scale, -0.025 * scale] }, spine: { r: [-0.17, -0.22, 0] }, 'forearm-right': { r: [-0.8, 0, 0] } }], [0.48, { pelvis: { p: [0, 0.045 * scale, 0.055 * scale] }, spine: { r: [0.25, 0.3, 0] }, 'upper-arm-right': { r: [-1.45, 0, -0.08] }, 'forearm-right': { r: [0.12, 0, 0] }, 'tail-base': { r: [-0.20, -0.24, 0] }, 'ear-left': { r: [-0.28, 0, 0] }, 'ear-right': { r: [-0.28, 0, 0] } }], [0.75, { spine: { r: [0.10, 0.1, 0] } }], [1, {}]]),
    clip('attack-special', 1.22, [[0, {}], [0.26, charge], [0.44, { ...charge, head: { r: [0.13, 0, 0] }, 'tail-blade': { r: [0, -0.15, 0.07] } }], [0.56, charge], [0.68, { ...charge, head: { r: [0.12, 0, 0] }, 'tail-blade': { r: [0, -0.10, 0.04] } }], [1, {}]]),
    clip('cast-status', 1.45, [[0, {}], [0.26, { head: { r: [-0.10, 0.22, -0.14] }, 'upper-arm-left': { r: [-0.65, 0, 0.32] }, 'forearm-left': { r: [-0.45, 0, 0] }, 'ear-left': { r: [0.06, 0, -0.2] } }], [0.60, { head: { r: [-0.08, -0.18, 0.13] }, 'upper-arm-right': { r: [-0.7, 0, -0.3] }, 'forearm-right': { r: [-0.5, 0, 0] }, 'tail-base': { r: [0, -0.25, -0.06] } }], [1, {}]]),
    clip('hit-light', 0.42, [[0, {}], [0.24, { spine: { r: [-0.16, -0.10, 0.10] }, head: { r: [-0.18, -0.10, 0.09] }, 'ear-left': { r: [-0.2, 0, 0] }, 'ear-right': { r: [-0.15, 0, 0] } }], [1, {}]]),
    clip('hit-heavy', 0.88, [[0, {}], [0.22, { pelvis: { p: [0, -0.045 * scale, -0.03 * scale] }, spine: { r: [-0.34, 0.08, -0.15] }, head: { r: [-0.22, 0, -0.10] }, 'upper-arm-left': { r: [-0.3, 0, 0.50] }, 'upper-arm-right': { r: [-0.4, 0, -0.35] }, 'tail-base': { r: [0.24, 0.15, 0] } }], [0.61, { spine: { r: [0.17, 0, 0.12] }, head: { r: [0.15, 0, 0] } }], [1, {}]]),
    clip('defeat', 1.3, [[0, {}], [0.25, { pelvis: { p: [0, -0.06 * scale, 0] }, head: { r: [0.22, 0, 0] } }], [0.7, { pelvis: { p: [0, -0.12 * scale, 0.035 * scale], r: [0.18, 0, -0.35] }, spine: { r: [0.32, 0, 0] }, head: { r: [0.25, 0.08, -0.16] }, 'eye-left': { s: [1, 0.10, 1] }, 'eye-right': { s: [1, 0.10, 1] }, 'ear-left': { r: [0.24, 0, -0.34] }, 'ear-right': { r: [0.20, 0, 0.28] }, 'tail-base': { r: [0.1, 0, 0.2] } }], [1, { pelvis: { p: [0, -0.12 * scale, 0.035 * scale], r: [0.18, 0, -0.35] }, spine: { r: [0.35, 0, 0] }, head: { r: [0.28, 0.08, -0.16] }, 'eye-left': { s: [1, 0.10, 1] }, 'eye-right': { s: [1, 0.10, 1] }, 'ear-left': { r: [0.24, 0, -0.34] }, 'ear-right': { r: [0.20, 0, 0.28] }, 'tail-base': { r: [0.1, 0, 0.2] } }]]),
    clip('celebrate', 1.7, [[0, {}], [0.18, { pelvis: { p: [0, -0.026 * scale, 0] }, head: { r: [0.12, 0, 0] } }], [0.36, { pelvis: { p: [0, 0.115 * scale, 0] }, 'upper-arm-left': { r: [-0.24, 0, 2.1] }, 'upper-arm-right': { r: [-0.24, 0, -2.1] }, head: { r: [-0.18, 0.12, 0.08] }, 'ear-left': { r: [-0.12, 0, -0.12] }, 'ear-right': { r: [-0.1, 0, 0.13] }, 'tail-base': { r: [-0.14, -0.18, 0.1] } }], [0.52, { pelvis: { p: [0, 0, 0] }, 'upper-arm-left': { r: [-0.18, 0, 1.5] }, 'upper-arm-right': { r: [-0.18, 0, -1.5] }, head: { r: [-0.08, -0.1, -0.07] } }], [0.69, { pelvis: { p: [0, 0.075 * scale, 0] }, 'upper-arm-left': { r: [-0.2, 0, 1.95] }, 'upper-arm-right': { r: [-0.2, 0, -1.95] } }], [1, {}]]),
    clip('rest-sleep', 3.1, [[0, sleep], [0.5, sleepingBreath], [1, sleep]]),
    clip('interact', 1.55, [[0, {}], [0.25, { head: { r: [0.12, 0.18, -0.05] }, 'upper-arm-left': { r: [-0.72, 0, 0.30] }, 'forearm-left': { r: [-0.4, 0, 0] } }], [0.47, { head: { r: [-0.06, 0.13, 0.04] }, 'upper-arm-left': { r: [-1.03, 0, 0.54] }, 'hand-left': { r: [0, 0.24, 0.14] } }], [0.7, { head: { r: [0.06, 0.08, -0.02] }, 'upper-arm-left': { r: [-0.7, 0, 0.36] }, 'hand-left': { r: [0, -0.2, -0.1] } }], [1, {}]]),
  ];
}

/**
 * Build an original candidate; acceptance belongs to the P06 visual review.
 * @param {number} detail 0=standard, 1=low, 2=distant.
 * @returns {{root:THREE.Group,clips:THREE.AnimationClip[],notes:string[]}}
 */
export function buildPikachu(detail = 0) {
  const lod = Math.max(0, Math.min(2, Math.floor(detail)));
  const { root, rig } = createRoot();
  const fur = createMaterial('pikachu-fur-material');
  const shine = createMaterial('pikachu-face-material', { roughness: 0.33 });
  const pelvis = joint(rig, 'pelvis', [0, 0.26, 0]);
  const spine = joint(pelvis, 'spine', [0, 0.16, 0]);
  const neck = joint(spine, 'neck', [0, 0.145, 0.022]);
  const head = joint(neck, 'head', [0, 0.045, 0.010]);
  body(pelvis, fur, lod);
  face(head, fur, shine, lod);
  limbs(pelvis, spine, fur, lod);
  lightningTail(pelvis, fur, lod);
  rig.position.z = -(0.004 + 0.029 + Math.cos(0.12) * 0.025);
  const scale = normalizeGrounded(root, 1.0);
  return {
    root,
    clips: animations(root, scale),
    notes: [
      'Original procedural Pikachu art, authored from the approved species brief; no commercial mesh, texture, rig or animation copied.',
      'Rigid articulated transform rig with tapered ear controls, paired limb chains, layered face geometry, curved back markings and a two-control lightning tail.',
      'All eleven clips are authored in place. Idle, locomotion and rest-sleep are intended loops; remaining clips are one-shot previews without gameplay bindings.',
      'Two vertex-colored core MeshStandardMaterial surfaces; cel bands and selective contours belong to the later reviewed renderer.',
      'Neutral geometry is baked to one meter in height and grounded at Y=0; asset-root remains identity. Candidate art awaits front/side/back and animation review.',
    ],
  };
}
