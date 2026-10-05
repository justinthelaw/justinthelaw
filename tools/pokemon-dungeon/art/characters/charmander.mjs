import * as THREE from 'three';
import {
  createRoot, joint, createMaterial, addMesh, loft,
  normalizeGrounded, createClip,
} from './character-helper.mjs';

/**
 * Feature-sized tessellation preserves face markings without spending the
 * whole character budget on nostrils, fingertips or layered eye highlights.
 * @param {THREE.Object3D} parent
 * @param {string} name
 * @param {number[]} position
 * @param {number[]} radii
 * @param {THREE.ColorRepresentation} color
 * @param {THREE.MeshStandardMaterial} material
 * @param {number} detail
 */
function ellipsoid(parent, name, position, radii, color, material, detail) {
  const size = Math.max(...radii);
  const radial = size >= 0.15 ? [16, 12, 8] : size >= 0.08 ? [12, 8, 6] : [8, 6, 4];
  const rings = size >= 0.15 ? [12, 8, 5] : size >= 0.08 ? [8, 5, 3] : [5, 4, 3];
  const geometry = new THREE.SphereGeometry(1, radial[detail], rings[detail]);
  geometry.scale(radii[0], radii[1], radii[2]);
  return addMesh(parent, name, geometry, color, material, position);
}

/**
 * Original Charmander sculpture for the P06 art review, never a gameplay actor.
 * All geometry is authored here; no commercial mesh, texture or rig is used.
 * @param {number} detail 0: standard, 1: low, 2: distant.
 * @returns {{root: THREE.Group, clips: THREE.AnimationClip[], notes: string[]}}
 */
export function buildCharmander(detail = 0) {
  if (![0, 1, 2].includes(detail)) throw new RangeError('Charmander detail must be 0, 1 or 2.');
  const { root, rig } = createRoot();
  const skin = createMaterial('charmander-surface', { roughness: 0.82 });
  const eyes = detail === 2 ? skin : createMaterial('charmander-eye-surface', { roughness: 0.3 });
  const fire = createMaterial('charmander-flame-surface', {
    roughness: 0.62, emissive: new THREE.Color('#e95b0c').multiplyScalar(0.36), emissiveIntensity: 1,
  });
  const orange = '#ed872b';
  const warmOrange = '#f39436';
  const cream = '#f4d5a0';
  const ivory = '#fff1d3';
  const dark = '#22323a';
  const sides = [10, 7, 5][detail];
  const tube = { segments: [10, 6, 3][detail], sides };
  const pelvis = joint(rig, 'pelvis', [0, 0.42, 0]);
  const spine = joint(pelvis, 'spine', [0, 0.13, 0]);

  // A continuous pear silhouette keeps the belly broad and the neck tapered.
  const torso = new THREE.SphereGeometry(1, [24, 16, 10][detail], [16, 11, 7][detail]);
  const positions = torso.getAttribute('position');
  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i);
    positions.setXYZ(i,
      positions.getX(i) * 0.237 * (1 - 0.23 * y),
      y * 0.302,
      positions.getZ(i) * 0.2 * (1 - 0.15 * y));
  }
  torso.computeVertexNormals();
  addMesh(spine, 'torso-mesh', torso, orange, skin, [0, -0.065, 0]);
  ellipsoid(spine, 'belly-mesh', [0, -0.097, 0.169], [0.172, 0.228, 0.058], cream, skin, detail);
  ellipsoid(spine, 'neck-mesh', [0, 0.175, 0.007], [0.115, 0.12, 0.109], orange, skin, detail);

  const head = joint(spine, 'head', [0, 0.337, 0.018]);
  ellipsoid(head, 'cranium-mesh', [0, 0, 0], [0.248, 0.237, 0.212], orange, skin, detail);
  ellipsoid(head, 'upper-muzzle-mesh', [0, -0.055, 0.126], [0.182, 0.094, 0.146], warmOrange, skin, detail);
  const jaw = joint(head, 'jaw', [0, -0.112, 0.086]);
  ellipsoid(jaw, 'lower-jaw-mesh', [0, -0.005, 0.06], [0.162, 0.058, 0.114], warmOrange, skin, detail);
  ellipsoid(jaw, 'mouth-interior-mesh', [0, 0.035, 0.08], [0.136, 0.011, 0.077], '#743b32', skin, detail);
  loft(head, 'mouth-line-mesh', [
    [-0.143, -0.079, 0.217], [-0.096, -0.1, 0.245],
    [0, -0.111, 0.262], [0.096, -0.1, 0.245], [0.143, -0.079, 0.217],
  ], [0.005, 0.005, 0.005, 0.005, 0.005], '#6c4330', skin, detail, tube);
  joint(head, 'socket-mouth', [0, -0.08, 0.28]);

  for (const [side, direction] of [['left', 1], ['right', -1]]) {
    const sign = Number(direction);
    // Shallow eye layers follow the smaller head's tangent instead of forming
    // freestanding oval lenses. The existing eye controls still close them.
    const eye = joint(head, `eye-${side}`, [sign * 0.147, 0.062, 0.154], [-0.23, sign * 0.6, sign * -0.045]);
    ellipsoid(eye, `eye-outline-${side}-mesh`, [0, 0, 0], [0.053, 0.08, 0.011], dark, eyes, detail);
    ellipsoid(eye, `eye-white-${side}-mesh`, [0, 0, 0.005], [0.049, 0.074, 0.009], '#fff5df', eyes, detail);
    ellipsoid(eye, `eye-iris-${side}-mesh`, [-sign * 0.0035, 0.005, 0.0125], [0.033, 0.06, 0.0065], '#278985', eyes, detail);
    ellipsoid(eye, `eye-pupil-${side}-mesh`, [-sign * 0.0035, 0.0085, 0.018], [0.017, 0.045, 0.004], '#102c35', eyes, detail);
    ellipsoid(eye, `eye-highlight-${side}-mesh`, [-0.01, 0.034, 0.022], [0.0095, 0.017, 0.0035], '#fff9eb', eyes, detail);
    ellipsoid(head, `nostril-${side}-mesh`, [sign * 0.055, -0.017, 0.255], [0.0105, 0.007, 0.005], '#8c4a27', skin, detail);

    const shoulder = joint(spine, `shoulder-${side}`, [sign * 0.189, 0.079, 0.002]);
    loft(shoulder, `upper-arm-${side}-mesh`, [[0, 0, 0], [sign * 0.037, -0.064, 0.007], [sign * 0.052, -0.143, 0.03]],
      [0.07, 0.057, 0.049], orange, skin, detail, tube);
    const elbow = joint(shoulder, `elbow-${side}`, [sign * 0.052, -0.143, 0.03]);
    ellipsoid(elbow, `elbow-${side}-mesh`, [0, 0, 0], [0.05, 0.052, 0.051], orange, skin, detail);
    loft(elbow, `forearm-${side}-mesh`, [[0, 0, 0], [sign * 0.011, -0.05, 0.019], [sign * 0.014, -0.09, 0.035]],
      [0.048, 0.046, 0.041], warmOrange, skin, detail, tube);
    const hand = joint(elbow, `hand-${side}`, [sign * 0.014, -0.1, 0.037]);
    ellipsoid(hand, `palm-${side}-mesh`, [0, 0, 0], [0.061, 0.058, 0.05], warmOrange, skin, detail);
    joint(hand, `socket-hand-${side}`, [0, -0.005, 0.063]);

    const hip = joint(pelvis, `hip-${side}`, [sign * 0.144, -0.137, 0.003]);
    ellipsoid(hip, `thigh-${side}-mesh`, [0, -0.036, 0.015], [0.096, 0.143, 0.105], orange, skin, detail);
    const knee = joint(hip, `knee-${side}`, [0, -0.131, 0.038]);
    ellipsoid(knee, `shin-${side}-mesh`, [0, -0.055, 0.002], [0.067, 0.085, 0.07], warmOrange, skin, detail);
    const ankle = joint(knee, `ankle-${side}`, [0, -0.103, 0.022]);
    ellipsoid(ankle, `foot-${side}-mesh`, [0, 0.011, 0.054], [0.092, 0.055, 0.136], warmOrange, skin, detail);
    joint(ankle, `socket-foot-${side}`, [0, -0.044, 0.054]);
    for (let toe = 0; toe < 3; toe += 1) {
      const x = (toe - 1) * 0.047;
      ellipsoid(hand, `finger-${side}-${toe + 1}-mesh`, [x * 0.69, -0.035, 0.025], [0.022, 0.032, 0.031], warmOrange, skin, detail);
      loft(hand, `finger-claw-${side}-${toe + 1}-mesh`, [[x * 0.69, -0.035, 0.048], [x * 0.71, -0.049, 0.069], [x * 0.7, -0.059, 0.078]],
        [0.012, 0.009, 0.001], ivory, skin, detail, { segments: 3, sides: detail === 2 ? 3 : 5 });
      loft(ankle, `toe-claw-${side}-${toe + 1}-mesh`, [[x, 0.008, 0.155], [x * 1.04, 0.003, 0.18], [x * 1.04, -0.005, 0.205]],
        [0.022, 0.017, 0.001], ivory, skin, detail, { segments: 3, sides: detail === 2 ? 3 : 6 });
    }
  }

  // Each tail segment owns its geometry and the next segment's pivot.
  const tailOffsets = [[0, -0.052, -0.163], [0.025, 0.007, -0.155], [0.044, 0.085, -0.129], [0.034, 0.125, -0.073], [0.009, 0.102, 0.002]];
  const tailRadii = [0.094, 0.076, 0.058, 0.043, 0.031, 0.019];
  let tail = joint(pelvis, 'tail-base', [0, -0.109, -0.135]);
  for (let segment = 0; segment < tailOffsets.length; segment += 1) {
    const offset = tailOffsets[segment];
    loft(tail, `tail-segment-${segment + 1}-mesh`, [[0, 0, 0], offset],
      [tailRadii[segment], tailRadii[segment + 1]], orange, skin, detail, tube);
    tail = joint(tail, `tail-${segment + 1}`, offset);
    ellipsoid(tail, `tail-junction-${segment + 1}-mesh`, [0, 0, 0],
      [tailRadii[segment + 1], tailRadii[segment + 1], tailRadii[segment + 1]], orange, skin, detail);
  }
  joint(tail, 'socket-tail-tip');
  const flame = joint(tail, 'socket-tail-flame');
  loft(flame, 'flame-main-mesh', [[0, -0.018, 0], [0.008, 0.058, 0], [-0.017, 0.129, 0.005], [0.015, 0.209, -0.011], [0.034, 0.27, -0.008]],
    [0.025, 0.073, 0.058, 0.025, 0.001], '#ff8c19', fire, detail, { ...tube, endColor: '#e94c13' });
  loft(flame, 'flame-left-tongue-mesh', [[-0.026, 0.035, 0], [-0.077, 0.097, 0.008], [-0.075, 0.169, -0.005]],
    [0.038, 0.036, 0.001], '#ff9e22', fire, detail, { ...tube, endColor: '#f15c0c' });
  loft(flame, 'flame-right-tongue-mesh', [[0.027, 0.025, -0.006], [0.081, 0.064, 0.014], [0.071, 0.143, 0.006]],
    [0.039, 0.031, 0.001], '#ff9a1e', fire, detail, { ...tube, endColor: '#f15c0c' });
  loft(flame, 'flame-core-mesh', [[0, 0.016, 0.028], [-0.008, 0.063, 0.056], [0.006, 0.116, 0.052], [-0.011, 0.167, 0.026]],
    [0.025, 0.041, 0.022, 0.001], '#ffe57b', fire, detail, { ...tube, endColor: '#ffd33f' });

  // The standing soles share Z=0.117 in authoring space. Center their midpoint
  // on the asset origin, then bake neutral geometry/pivots to metres. Animation
  // translations below are deliberately authored in final presentation metres.
  rig.position.z = -0.117;
  normalizeGrounded(root, 1.1);
  const clips = [
    createClip(root, 'idle', 2.4, [
      [0, { spine: { s: [1, 1, 1] }, 'tail-base': { r: [0, -0.06, 0] } }],
      [0.4, { spine: { s: [1.025, 1.014, 1.025] }, head: { r: [-0.025, 0.025, 0] }, 'tail-base': { r: [0, 0.075, 0] }, 'socket-tail-flame': { s: [0.95, 1.08, 0.95] } }],
      [0.72, { spine: { s: [1.009, 1.004, 1.009] }, head: { r: [0.01, -0.015, 0] }, 'tail-base': { r: [0, 0, 0] } }],
      [1, { spine: { s: [1, 1, 1] }, 'tail-base': { r: [0, -0.06, 0] } }],
    ]),
    createClip(root, 'locomotion', 0.72, [
      [0, { 'hip-left': { r: [-0.45, 0, 0] }, 'hip-right': { r: [0.45, 0, 0] }, 'shoulder-left': { r: [0.35, 0, 0] }, 'shoulder-right': { r: [-0.35, 0, 0] }, 'tail-base': { r: [0, 0.1, 0] } }],
      [0.25, { pelvis: { p: [0, 0.027, 0] }, 'knee-left': { r: [0.25, 0, 0] }, 'knee-right': { r: [0.45, 0, 0] }, head: { r: [-0.025, 0, 0] } }],
      [0.5, { 'hip-left': { r: [0.45, 0, 0] }, 'hip-right': { r: [-0.45, 0, 0] }, 'shoulder-left': { r: [-0.35, 0, 0] }, 'shoulder-right': { r: [0.35, 0, 0] }, 'tail-base': { r: [0, -0.1, 0] } }],
      [0.75, { pelvis: { p: [0, 0.027, 0] }, 'knee-left': { r: [0.45, 0, 0] }, 'knee-right': { r: [0.25, 0, 0] }, head: { r: [-0.025, 0, 0] } }],
      [1, { 'hip-left': { r: [-0.45, 0, 0] }, 'hip-right': { r: [0.45, 0, 0] }, 'shoulder-left': { r: [0.35, 0, 0] }, 'shoulder-right': { r: [-0.35, 0, 0] }, 'tail-base': { r: [0, 0.1, 0] } }],
    ]),
    createClip(root, 'attack-physical', 0.74, [
      [0, {}],
      [0.28, { spine: { r: [0, 0.22, 0] }, 'shoulder-right': { r: [0.35, 0, -0.15] }, 'elbow-right': { r: [-0.6, 0, 0] }, 'tail-base': { r: [0, -0.2, 0] } }],
      [0.48, { pelvis: { p: [0, -0.026, 0.025] }, spine: { r: [0.15, -0.2, 0] }, 'shoulder-right': { r: [-1.32, -0.1, -0.14] }, 'elbow-right': { r: [-0.08, 0, 0] }, 'hand-right': { r: [0.05, 0, 0.1] }, head: { r: [-0.08, 0.12, 0] } }],
      [0.67, { spine: { r: [0.05, -0.1, 0] }, 'shoulder-right': { r: [-0.65, 0, -0.05] } }],
      [1, {}],
    ]),
    createClip(root, 'attack-special', 1.2, [
      [0, {}],
      [0.28, { spine: { s: [1.04, 1.025, 1.06], r: [-0.08, 0, 0] }, head: { r: [-0.1, 0, 0] }, 'shoulder-left': { r: [0.12, 0, 0.2] }, 'shoulder-right': { r: [0.12, 0, -0.2] } }],
      [0.46, { spine: { r: [0.12, 0, 0] }, head: { r: [-0.13, 0, 0] }, jaw: { r: [0.42, 0, 0] }, 'tail-3': { r: [-0.12, 0, 0] }, 'socket-tail-flame': { s: [1.12, 1.17, 1.12] } }],
      [0.73, { spine: { r: [0.09, 0, 0] }, head: { r: [-0.11, 0, 0] }, jaw: { r: [0.36, 0, 0] }, 'socket-tail-flame': { s: [1.03, 1.1, 1.03] } }],
      [1, {}],
    ]),
    createClip(root, 'cast-status', 1.35, [
      [0, {}],
      [0.3, { head: { r: [0.15, 0, 0] }, 'shoulder-left': { r: [-0.52, 0, 0.55] }, 'shoulder-right': { r: [-0.52, 0, -0.55] }, 'elbow-left': { r: [-0.5, 0, 0] }, 'elbow-right': { r: [-0.5, 0, 0] }, 'tail-2': { r: [-0.1, 0, 0] } }],
      [0.65, { head: { r: [-0.08, 0, 0] }, spine: { s: [1.02, 1.03, 1.02] }, 'shoulder-left': { r: [-0.72, 0, 0.67] }, 'shoulder-right': { r: [-0.72, 0, -0.67] }, 'socket-tail-flame': { s: [0.9, 1.18, 0.9] } }],
      [1, {}],
    ]),
    createClip(root, 'hit-light', 0.42, [
      [0, {}], [0.23, { head: { r: [-0.17, 0.12, 0.08] }, spine: { r: [-0.1, 0, 0] }, 'shoulder-left': { r: [0.2, 0, 0.13] }, 'tail-base': { r: [0, -0.15, 0] } }], [1, {}],
    ]),
    createClip(root, 'hit-heavy', 0.9, [
      [0, {}],
      [0.25, { pelvis: { p: [0, -0.065, -0.045] }, spine: { r: [-0.28, -0.12, -0.08] }, head: { r: [-0.24, 0.2, 0] }, 'shoulder-left': { r: [0.35, 0, 0.55] }, 'shoulder-right': { r: [0.35, 0, -0.55] }, 'hip-left': { r: [-0.2, 0, 0] }, 'hip-right': { r: [-0.2, 0, 0] }, 'tail-base': { r: [0, -0.3, 0] } }],
      [0.65, { pelvis: { p: [0, -0.03, -0.01] }, spine: { r: [0.1, 0, 0] }, head: { r: [0.11, 0, 0] } }], [1, {}],
    ]),
    createClip(root, 'defeat', 1.5, [
      [0, {}],
      [0.3, { pelvis: { p: [0, -0.1, 0] }, head: { r: [0.3, 0, -0.1] }, spine: { r: [0.14, 0, -0.1] }, 'shoulder-left': { r: [-0.2, 0, 0] }, 'shoulder-right': { r: [-0.2, 0, 0] } }],
      [0.65, { pelvis: { p: [0.08, -0.21, 0], r: [0, 0, -1.32] }, head: { r: [0.12, 0, 0.08] }, 'shoulder-left': { r: [-0.6, 0, 0.35] }, 'shoulder-right': { r: [-0.4, 0, -0.1] }, 'hip-left': { r: [-0.35, 0, 0] }, 'hip-right': { r: [-0.25, 0, 0] }, 'tail-base': { r: [0, -0.45, 0.16] } }],
      [1, { pelvis: { p: [0.08, -0.215, 0], r: [0, 0, -1.32] }, head: { r: [0.13, 0, 0.08] }, 'shoulder-left': { r: [-0.6, 0, 0.35] }, 'shoulder-right': { r: [-0.4, 0, -0.1] }, 'hip-left': { r: [-0.35, 0, 0] }, 'hip-right': { r: [-0.25, 0, 0] }, 'tail-base': { r: [0, -0.45, 0.16] }, 'eye-left': { s: [1, 0.12, 1] }, 'eye-right': { s: [1, 0.12, 1] } }],
    ]),
    createClip(root, 'celebrate', 1.6, [
      [0, {}],
      [0.2, { pelvis: { p: [0, -0.055, 0] }, spine: { r: [0.1, 0, 0] } }],
      [0.43, { pelvis: { p: [0, 0.09, 0] }, 'shoulder-left': { r: [-0.3, 0, 1.8] }, 'shoulder-right': { r: [-0.3, 0, -1.8] }, head: { r: [-0.12, 0, 0] }, jaw: { r: [0.24, 0, 0] }, 'tail-base': { r: [0, 0.18, 0] } }],
      [0.66, { pelvis: { p: [0, -0.025, 0] }, 'shoulder-left': { r: [-0.2, 0, 1.4] }, 'shoulder-right': { r: [-0.2, 0, -1.4] }, head: { r: [-0.06, 0.1, 0] }, 'tail-base': { r: [0, -0.15, 0] } }], [1, {}],
    ]),
    createClip(root, 'rest-sleep', 3.4, [
      [0, { pelvis: { p: [0, -0.095, 0] }, spine: { r: [0.15, 0, 0] }, head: { r: [0.25, 0.08, 0] }, 'hip-left': { r: [-0.5, 0, 0.1] }, 'hip-right': { r: [-0.5, 0, -0.1] }, 'knee-left': { r: [0.5, 0, 0] }, 'knee-right': { r: [0.5, 0, 0] }, 'tail-base': { r: [0, 0.34, 0] }, 'eye-left': { s: [1, 0.12, 1] }, 'eye-right': { s: [1, 0.12, 1] } }],
      [0.5, { pelvis: { p: [0, -0.091, 0] }, spine: { r: [0.15, 0, 0], s: [1.022, 1.012, 1.023] }, head: { r: [0.24, 0.08, 0] }, 'hip-left': { r: [-0.5, 0, 0.1] }, 'hip-right': { r: [-0.5, 0, -0.1] }, 'knee-left': { r: [0.5, 0, 0] }, 'knee-right': { r: [0.5, 0, 0] }, 'tail-base': { r: [0, 0.35, 0] }, 'eye-left': { s: [1, 0.12, 1] }, 'eye-right': { s: [1, 0.12, 1] }, 'socket-tail-flame': { s: [0.95, 0.94, 0.95] } }],
      [1, { pelvis: { p: [0, -0.095, 0] }, spine: { r: [0.15, 0, 0] }, head: { r: [0.25, 0.08, 0] }, 'hip-left': { r: [-0.5, 0, 0.1] }, 'hip-right': { r: [-0.5, 0, -0.1] }, 'knee-left': { r: [0.5, 0, 0] }, 'knee-right': { r: [0.5, 0, 0] }, 'tail-base': { r: [0, 0.34, 0] }, 'eye-left': { s: [1, 0.12, 1] }, 'eye-right': { s: [1, 0.12, 1] } }],
    ]),
    createClip(root, 'interact', 1.4, [
      [0, {}],
      [0.25, { head: { r: [0.03, 0.15, -0.07] }, 'shoulder-left': { r: [-0.6, 0, 0.8] }, 'elbow-left': { r: [-0.9, 0, 0] }, 'hand-left': { r: [0, 0, 0.22] } }],
      [0.5, { head: { r: [-0.04, 0.15, -0.03] }, 'shoulder-left': { r: [-0.6, 0, 0.8] }, 'elbow-left': { r: [-0.9, 0, 0] }, 'hand-left': { r: [0, 0, -0.22] }, jaw: { r: [0.13, 0, 0] } }],
      [0.72, { head: { r: [0.05, 0.1, 0] }, 'shoulder-left': { r: [-0.5, 0, 0.65] }, 'elbow-left': { r: [-0.7, 0, 0] }, 'hand-left': { r: [0, 0, 0.16] } }], [1, {}],
    ]),
  ];
  return {
    root, clips,
    notes: [
      'Original procedural Charmander candidate: continuous pear torso, cream belly, broad muzzle, articulated jaw, teal eyes, clawed hands/feet and segmented flame tail.',
      'Species-specific rigid-part articulation; no claim of a skinned production deformation rig or P06 visual acceptance.',
      'Neutral mesh and pivots are baked to 1.1 metres; +Y up, +Z forward, identity asset-root, named mouth/hand/foot/tail/flame sockets.',
      'Eleven in-place clips. Idle, locomotion and rest-sleep have matching endpoint poses; remaining clips are authored as one-shots.',
      'Flame is opaque sculpted geometry with one separate emissive material. Reduced-motion preview should hold its neutral pose without particles or flicker.',
      'All three detail levels retain the same named hierarchy and sockets; distant eyes share the body material.',
    ],
  };
}
