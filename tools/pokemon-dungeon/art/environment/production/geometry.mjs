// Original reusable three-dimensional prop construction, authored in world units.
const part = (shape, size, position, materialId, rotation = [0, 0, 0], segments = 6) => ({ shape, size, position, rotation, materialId, segments });
const box = (size, position, material, rotation) => part('box', size, position, material, rotation);
const ball = (size, position, material, rotation, segments = 7) => part('sphere', size, position, material, rotation, segments);
const cylinder = (size, position, material, rotation, segments = 6) => part('cylinder', size, position, material, rotation, segments);
const cone = (size, position, material, rotation, segments = 6) => part('cone', size, position, material, rotation, segments);
function boulder(material = 'wall') {
  return [ball([1.6, 1.2, 1.4], [0, .5, 0], material, [.1, .4, .14]), ball([.9, .8, 1.2], [-.6, .28, .22], material, [.2, 1.1, -.2]), ball([.8, .55, .75], [.55, .19, -.35], material, [0, .8, .3])];
}
function broadleaf() {
  const p = [cylinder([.54, 2.8, .58], [0, 1.4, 0], 'bark', [0, .2, -.05])];
  for (const [x, y, z, sx, sy, sz] of [[-.9, 2.95, .1, 2.4, 1.5, 2.2], [.8, 3.15, .15, 2.2, 1.6, 2.2], [0, 3.65, -.3, 2.5, 1.85, 2.4], [0, 2.9, -1, 1.7, 1.4, 1.8], [-.5, 4.05, -.25, 1.3, 1.25, 1.3]]) p.push(ball([sx, sy, sz], [x, y, z], y>3.3?'leaf-light':'leaf', [.05, x, .08], 10));
  for (const s of [-1, 1]) { p.push(cylinder([.24, 1.6, .24], [s * .5, 2.2, 0], 'bark', [0, 0, -s * .75])); p.push(cone([.65, .95, .55], [s * .42, .25, .12], 'bark', [0, .4, s * -.7])); }
  return p;
}
function pine(snow = false) {
  const p = [cylinder([.35, 3.7, .38], [0, 1.85, 0], 'bark')];
  for (let i = 0; i < 4; i++) { const w = 2.5 - i * .48, y = 1.5 + i * .72; p.push(cone([w, 1.7, w], [0, y, 0], 'leaf', [0, i * .35, 0], 7)); if (snow) p.push(cone([w * .82, 1.25, w * .82], [0, y + .34, 0], 'trim', [0, i * .35, 0], 7)); }
  return p;
}
function fern() {
  const p = [];
  for (let i = 0; i < 7; i++) { const yaw = i * Math.PI * 2 / 7; p.push(cone([.21, .8, .56], [Math.sin(yaw) * .23, .33, Math.cos(yaw) * .23], 'leaf', [Math.sin(yaw) * .55, yaw, Math.cos(yaw) * -.55], 4)); }
  return p;
}
function flowers() {
  const p = [];
  for (const [x, z, h] of [[-.3, 0, .4], [.2, .18, .55], [.1, -.24, .38]]) {
    p.push(cylinder([.04, h, .04], [x, h / 2, z], 'leaf', undefined, 4));
    p.push(ball([.27, .16, .27], [x, h, z], 'accent', undefined, 6));
    p.push(ball([.1, .08, .1], [x, h + .065, z], 'trim', undefined, 5));
  }
  return p;
}
function crystals() {
  const p = [];
  for (const [x, z, h, tilt] of [[0, 0, 1.6, .05], [-.38, .15, .95, -.23], [.38, -.12, 1.1, .25]]) {
    p.push(cylinder([.38, h * .7, .38], [x, h * .35, z], 'accent', [0, x, tilt], 5));
    p.push(cone([.38, h * .4, .38], [x + tilt * .22, h * .82, z], 'accent', [0, x, tilt], 5));
  }
  return p;
}
function stoneArch() {
  const p = [];
  for (const sign of [-1, 1]) for (let i = 0; i < 3; i++) p.push(box([.9, .74, 1], [sign * 1.35, .37 + i * .72, 0], 'wall', [0, i * .04, sign * -.04]));
  for (let i = 0; i < 5; i++) { const t = Math.PI * .15 + i * Math.PI * .175; p.push(box([.93, .7, 1.07], [Math.cos(t) * 1.47, 2 + Math.sin(t) * 1.1, 0], 'trim', [0, 0, t - Math.PI / 2])); }
  return p;
}
function pillar(broken = false) {
  const p = [box([1.05, .28, 1.05], [0, .14, 0], 'trim'), cylinder([.75, broken ? 1.6 : 2.6, .75], [0, broken ? 1.03 : 1.53, 0], 'wall', undefined, 8)];
  p.push(box([1.02, .28, 1.02], [0, broken ? 1.95 : 2.95, 0], 'trim', broken ? [0, .25, -.12] : undefined));
  for (const x of [-.24, .24]) p.push(box([.08, 1.2, .06], [x, 1.2, .37], 'trim'));
  return p;
}
function cottage() {
  return [box([2.8, 1.9, 2.3], [0, .95, 0], 'plaster'), box([2.85, .2, 2.35], [0, .17, 0], 'wall'), cone([4.1, 1.9, 3.6], [0, 2.6, 0], 'roof', [0, Math.PI / 4, 0], 4), box([.72, 1.25, .12], [0, .65, 1.2], 'bark'), box([.65, .72, .08], [-.87, 1.14, 1.22], 'window'), box([.65, .72, .08], [.87, 1.14, 1.22], 'window'), box([2.9, .12, .14], [0, 1.66, 1.24], 'bark'), ...[-1.32, 1.32].map(x => box([.15, 1.9, .15], [x, .98, 1.23], 'bark')), box([.36, 1.1, .45], [.95, 3, -.4], 'wall')];
}
function gate() {
  return [box([.45, 3.2, .45], [-1.4, 1.6, 0], 'bark'), box([.45, 3.2, .45], [1.4, 1.6, 0], 'bark'), box([3.5, .4, .7], [0, 3, 0], 'roof'), box([3.1, .18, .3], [0, 2.5, 0], 'trim'), box([1.1, .52, .16], [0, 2.7, .45], 'accent')];
}
function reeds() { const p = []; for (let i = 0; i < 6; i++) { const x = (i % 3) * .18 - .18, z = Math.floor(i / 3) * .18, h = .6 + (i % 3) * .19; p.push(cylinder([.04, h, .04], [x, h / 2, z], 'leaf', [0, i, .09 * (i % 2 ? 1 : -1)], 4)); p.push(cone([.16, .3, .12], [x, h, z], 'accent', undefined, 4)); } return p; }
function coral() { const p = [cylinder([.18, 1.1, .18], [0, .55, 0], 'accent', [0, .4, .1], 5)]; for (const s of [-1, 1]) { p.push(cylinder([.15, .8, .15], [s * .3, .65, 0], 'accent', [0, 0, -s * .7], 5)); p.push(ball([.27, .27, .27], [s * .5, .97, 0], 'accent', undefined, 5)); } p.push(ball([.27, .3, .27], [.04, 1.14, 0], 'trim', undefined, 5)); return p; }
function machine() { return [box([1.4, .3, 1.2], [0, .15, 0], 'wall'), cylinder([.85, 1.3, .85], [0, .95, 0], 'trim', undefined, 8), ...[.65, .95, 1.25].map(y => cylinder([1.05, .13, 1.05], [0, y, 0], 'accent', undefined, 8)), cone([.5, .6, .5], [0, 1.85, 0], 'accent')]; }
export const propLibrary = {
  'boulder-cluster': boulder(), 'mossy-rock': [...boulder(), ball([1.2, .2, 1], [-.1, 1.02, 0], 'leaf')],
  'broadleaf-tree': broadleaf(), 'pine-tree': pine(), 'snow-pine': pine(true), 'fern-cluster': fern(), 'flower-patch': flowers(),
  'fallen-log': [cylinder([.72, 2.8, .72], [0, .4, 0], 'bark', [0, 0, Math.PI / 2], 8), cylinder([.6, .025, .6], [1.42, .4, 0], 'trim', [0, 0, Math.PI / 2], 8), box([.18, .4, .19], [-.4, .9, 0], 'bark', [0, 0, -.4])],
  'root-arch': [cylinder([.8, 2.6, .8], [-1, 1.25, 0], 'bark', [0, 0, -.2]), cylinder([.65, 2.8, .65], [1, 1.3, 0], 'bark', [0, 0, .2]), cylinder([.85, 2.4, .85], [0, 2.6, 0], 'bark', [0, 0, Math.PI / 2]), ball([2.5, .7, 1.4], [.2, 2.95, 0], 'leaf')],
  'mushroom-ring': [-.5, 0, .5].flatMap((x, i) => [cylinder([.13, .4 + i * .09, .13], [x, .2, (i % 2) * .35], 'trim'), ball([.65, .26, .6], [x, .48 + i * .05, (i % 2) * .35], 'accent')]),
  'stalagmite-cluster': [cone([.8, 2.2, .85], [0, 1.1, 0], 'wall', [0, .3, -.1]), cone([.55, 1.2, .6], [-.55, .6, .2], 'wall', [0, 1, .12]), cone([.5, .9, .45], [.55, .45, -.1], 'trim')],
  'crystal-cluster': crystals(), 'basalt-organ': [0, 1, 2, 3, 4].map(i => cylinder([.65, 1.3 + i % 3 * .65, .65], [(i - 2) * .45, (1.3 + i % 3 * .65) / 2, (i % 2) * .3], 'wall', [0, .3, .02 * i], 6)),
  'obsidian-spire': [cone([1.15, 3.7, 1.1], [0, 1.85, 0], 'wall', [0, .4, .13], 5), cone([.75, 2.2, .65], [.6, 1.1, .1], 'wall', [0, .1, -.2], 5)],
  'lava-vent': [cylinder([1.25, .5, 1.25], [0, .25, 0], 'wall', undefined, 7), cylinder([.8, .08, .8], [0, .52, 0], 'lava', undefined, 7), ...[-.3, .3].map(x => cone([.35, .7, .35], [x, .5, -.3], 'wall'))],
  'ice-shard': [cone([1, 3, .7], [0, 1.5, 0], 'accent', [0, .2, -.2], 4), cone([.65, 1.6, .5], [.55, .8, .2], 'accent', [0, -.4, .2], 4)],
  'snow-drift': [ball([2.3, .7, 1.5], [0, .25, 0], 'trim', undefined, 9), ball([1.3, .55, 1.3], [.6, .2, .1], 'trim', undefined, 7)],
  'stone-arch': stoneArch(), 'carved-pillar': pillar(), 'broken-pillar': pillar(true),
  'stairway': [0, 1, 2, 3, 4].map(i => box([1.65, .22, 1.45 - i * .18], [0, .11 + i * .22, -i * .18], 'trim')),
  'rune-plinth': [box([1.5, .25, 1.5], [0, .125, 0], 'wall'), box([1.15, .7, 1.15], [0, .58, 0], 'trim'), cone([.6, .8, .6], [0, 1.31, 0], 'accent', undefined, 4)],
  'cloud-bank': [ball([3.6, 1.5, 2.1], [0, .3, 0], 'trim', undefined, 9), ball([2.1, 1.35, 1.9], [-1.2, .5, 0], 'trim', undefined, 9), ball([2.2, 1.2, 1.8], [1.3, .5, -.1], 'trim', undefined, 9)],
  'floating-island': [cone([3.2, 3.5, 3.0], [0, 0, 0], 'wall', [Math.PI, .2, 0], 7), cylinder([3.25, .25, 3.05], [0, 1.85, 0], 'floor', undefined, 7)],
  'coral-fan': coral(), 'reed-bed': reeds(), 'shell-cluster': [ball([.7, .3, .5], [0, .16, 0], 'trim', [0, .3, 0], 5), ball([.4, .22, .35], [.5, .1, .3], 'accent', [0, 1.1, 0], 5)],
  'waterfall-rock': [...boulder(), box([1.35, 2.4, 1.2], [0, 1.2, -.35], 'wall'), box([.75, 2.1, .12], [0, 1.4, .3], 'water'), ball([1.3, .15, .8], [0, .12, .6], 'trim')],
  // Original letter box: post, raised housing, pitched cap, dark slot and flag.
  'mailbox': [box([.18, 1.25, .18], [0, .625, 0], 'bark'), box([.78, .55, .65], [0, 1.45, 0], 'trim'), cone([1.1, .4, .95], [0, 1.91, 0], 'roof', [0, Math.PI / 4, 0], 4), box([.48, .07, .035], [0, 1.48, .345], 'bark'), box([.04, .55, .04], [.45, 1.55, 0], 'bark'), box([.24, .15, .04], [.55, 1.8, 0], 'accent')],
  'cottage': cottage(), 'timber-gate': gate(),
  'fence-section': [box([.14, 1.1, .14], [-.75, .55, 0], 'bark'), box([.14, 1.1, .14], [.75, .55, 0], 'bark'), box([1.6, .13, .1], [0, .4, 0], 'bark'), box([1.6, .13, .1], [0, .85, 0], 'bark')],
  'notice-board': [box([.14, 1.6, .14], [-.55, .8, 0], 'bark'), box([.14, 1.6, .14], [.55, .8, 0], 'bark'), box([1.5, .85, .16], [0, 1.25, 0], 'bark'), box([.92, .6, .025], [0, 1.25, .1], 'trim'), box([1.75, .16, .5], [0, 1.77, 0], 'roof')],
  'pond-well': [cylinder([1.8, .55, 1.8], [0, .275, 0], 'wall', undefined, 10), cylinder([1.3, .03, 1.3], [0, .565, 0], 'water', undefined, 10), cylinder([.25, .9, .25], [0, .85, 0], 'trim')],
  'training-post': [cylinder([.45, 1.8, .45], [0, .9, 0], 'bark'), cylinder([.75, .6, .75], [0, 1.1, 0], 'trim'), cylinder([.17, 1.5, .17], [0, 1.5, 0], 'bark', [0, 0, Math.PI / 2])],
  'hanging-banner': [box([.1, 2.7, .1], [0, 1.35, 0], 'bark'), box([1.3, .1, .1], [0, 2.7, 0], 'bark'), box([.9, 1.45, .045], [0, 1.91, .04], 'accent'), box([.15, .55, .06], [0, 2, .07], 'trim')],
  'cactus': [cylinder([.44, 1.65, .44], [0, .82, 0], 'leaf', undefined, 6), ball([.44, .45, .44], [0, 1.64, 0], 'leaf'), cylinder([.28, .8, .28], [.38, .95, 0], 'leaf', [0, 0, Math.PI / 2]), cylinder([.28, .8, .28], [.68, 1.27, 0], 'leaf'), ball([.31, .25, .31], [.68, 1.68, 0], 'accent')],
  'sandstone-fin': [box([.55, 2.8, 2.1], [0, 1.4, 0], 'wall', [0, .2, -.17]), box([.65, 1.6, 1.4], [.7, .8, .3], 'wall', [0, -.2, -.1])],
  'fossil-ribs': [-.6, 0, .6].flatMap(x => [cylinder([.16, 1.1, .16], [x, .55, -.25], 'trim', [.35, 0, 0]), cylinder([.16, .9, .16], [x, .85, .25], 'trim', [-.9, 0, 0])]),
  'conducting-coil': machine(),
  'lab-table': [box([1.7, .18, 1], [0, .9, 0], 'trim'), ...[-.6, .6].flatMap(x => [-.3, .3].map(z => box([.16, .8, .16], [x, .4, z], 'wall'))), cylinder([.28, .4, .28], [-.35, 1.2, 0], 'accent'), box([.5, .08, .3], [.3, 1.04, .1], 'bark')],
};
