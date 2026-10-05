import * as THREE from '../../../games/pokemon-dungeon-reimagined/vendor/three/three.module.min.js';
import { GLTFLoader } from '../../../games/pokemon-dungeon-reimagined/vendor/three/GLTFLoader.min.js';

/** @param {string} id */
function element(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing art control ${id}`);
  return node;
}
/** @param {string} id */
function select(id) {
  const node = element(id);
  if (!(node instanceof HTMLSelectElement)) throw new Error(`Missing select ${id}`);
  return node;
}
function canvasElement() {
  const node = element('preview');
  if (!(node instanceof HTMLCanvasElement)) throw new Error('Missing art canvas');
  return node;
}
function checkbox() {
  const node = element('reduced');
  if (!(node instanceof HTMLInputElement)) throw new Error('Missing motion control');
  return node;
}
const canvas = canvasElement();
const subject = select('subject');
const clip = select('clip');
const angle = select('angle');
const quality = select('quality');
const reduced = checkbox();
const status = element('status');
const sound = element('sound');
const query = new URLSearchParams(location.search);
for (const [control, key] of [[subject, 'subject'], [clip, 'clip'], [angle, 'angle'], [quality, 'quality']]) {
  if (!(control instanceof HTMLSelectElement) || typeof key !== 'string') continue;
  const requested = query.get(key);
  if (requested && [...control.options].some(option => option.value === requested)) control.value = requested;
}
reduced.checked = query.get('still') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#271832');
scene.fog = new THREE.Fog('#382241', 21, 62);
const camera = new THREE.PerspectiveCamera(44, 1, .05, 130);
scene.add(new THREE.HemisphereLight('#afb8e5', '#3b2230', .8));
const keyLight = new THREE.DirectionalLight('#fff1db', 1.65);
keyLight.position.set(-8, 13, 9);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -15;
keyLight.shadow.camera.right = 15;
keyLight.shadow.camera.top = 16;
keyLight.shadow.camera.bottom = -16;
keyLight.shadow.normalBias = .008;
keyLight.shadow.bias = -.00005;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#a9baff', 1.1);
rimLight.position.set(7, 8, -12);
scene.add(rimLight);
for (const x of [-8, 8]) {
  const light = new THREE.PointLight('#ff721c', 70, 25, 2);
  light.position.set(x, 1, -4);
  scene.add(light);
}

const gradient = new THREE.DataTexture(new Uint8Array([72, 72, 72, 255, 166, 166, 166, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
gradient.minFilter = THREE.NearestFilter;
gradient.magFilter = THREE.NearestFilter;
gradient.generateMipmaps = false;
gradient.needsUpdate = true;
const outlines = new THREE.MeshBasicMaterial({ color: '#221829', side: THREE.BackSide });
const platformMaterial = new THREE.MeshToonMaterial({ color: '#51405a', gradientMap: gradient });
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.06, .12, 64), platformMaterial);
pedestal.position.y = -.08;
pedestal.receiveShadow = true;
scene.add(pedestal);

/** @typedef {{ root: THREE.Group, mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[], materials: THREE.Material[] }} Model */
/** @type {Map<string, Model>} */
const models = new Map();
let generation = 0;
let animationFrame = 0;
let previousTime = 0;
let disposed = false;
let loading = false;
/** @type {AudioContext | undefined} */
let audio;
const loader = new GLTFLoader();
const names = ['pikachu', 'charmander', 'groudon', 'magma-cavern'];

/** @param {THREE.Group} root @param {boolean} character @param {THREE.Material[]} materials */
function applyStyle(root, character, materials) {
  /** @type {THREE.Mesh[]} */
  const meshes = [];
  root.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
  for (const mesh of meshes) {
    if (Array.isArray(mesh.material)) throw new Error('This art harness expects one material per primitive.');
    const source = mesh.material;
    if (!(source instanceof THREE.MeshStandardMaterial)) throw new Error('Unsupported candidate material.');
    const material = source.name.startsWith('lava-') ? new THREE.MeshBasicMaterial({
      color: source.color, vertexColors: source.vertexColors, side: source.side,
    }) : new THREE.MeshToonMaterial({
      color: source.color, emissive: source.emissive,
      vertexColors: source.vertexColors, gradientMap: gradient,
      side: source.side, transparent: source.transparent, opacity: source.opacity,
    });
    material.name = source.name;
    mesh.material = material;
    materials.push(material);
    mesh.castShadow = character;
    mesh.receiveShadow = true;
    if (character && source.emissive.getHex() === 0) {
      const outline = new THREE.Mesh(mesh.geometry, outlines);
      outline.name = 'preview-contour';
      outline.scale.setScalar(1.012);
      mesh.add(outline);
    }
  }
}

/** @param {Model} model */
function release(model) {
  model.mixer.stopAllAction();
  model.mixer.uncacheRoot(model.root);
  model.root.traverse(node => { if (node instanceof THREE.Mesh) node.geometry.dispose(); });
  for (const material of model.materials) material.dispose();
  scene.remove(model.root);
}

function playClip() {
  for (const [name, model] of models) {
    model.mixer.stopAllAction();
    const animation = model.clips.find(item => item.name === clip.value);
    if (!animation || name === 'magma-cavern') continue;
    const action = model.mixer.clipAction(animation);
    action.setLoop(['idle', 'locomotion', 'rest-sleep'].includes(clip.value) ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = true;
    action.reset().play();
    model.mixer.update(reduced.checked ? animation.duration * .35 : 0);
  }
}

function compose() {
  const composition = subject.value === 'composition';
  const name = subject.selectedOptions[0]?.textContent ?? 'Character';
  element('title').textContent = composition ? 'Into the molten depths' : `${name} • model study`;
  element('caption').textContent = composition ? 'MAGMA CAVERN' : name.toUpperCase();
  pedestal.visible = !composition;
  for (const [name, model] of models) {
    model.root.visible = composition || name === subject.value;
    model.root.position.set(0, 0, 0);
    model.root.rotation.set(0, 0, 0);
    if (composition) {
      if (name === 'pikachu') { model.root.position.set(-1.1, 0, 6); model.root.rotation.y = Math.PI; }
      if (name === 'charmander') { model.root.position.set(.6, 0, 5.75); model.root.rotation.y = Math.PI - .3; }
      if (name === 'groudon') model.root.position.set(0, 0, -7);
    }
  }
  frameView();
  playClip();
}

function frameView() {
  if (subject.value === 'composition') {
    const narrow = camera.aspect < 1.1;
    camera.position.set(angle.value === 'side' ? 10 : narrow ? 0 : 4.8, narrow ? 4.5 : 3.9, angle.value === 'back' ? -17 : 13.5);
    camera.lookAt(0, 1.7, -4);
  } else {
    const height = subject.value === 'groudon' ? 5.5 : subject.value === 'charmander' ? 1.1 : 1;
    const distance = height * 2.05 * Math.max(1, 1 / camera.aspect);
    const theta = angle.value === 'side' ? Math.PI / 2 : angle.value === 'back' ? Math.PI : angle.value === 'three-quarter' ? Math.PI / 4 : 0;
    camera.position.set(Math.sin(theta) * distance, height * .7, Math.cos(theta) * distance);
    camera.lookAt(0, height * .48, 0);
    pedestal.scale.set(height * .9, Math.max(height * .4, 1), height * .9);
    pedestal.position.y = -.06 * pedestal.scale.y;
  }
}

function resize() {
  if (disposed) return;
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width < 1 || bounds.height < 1) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.value === 'low' ? 1 : quality.value === 'high' ? 2 : 1.5));
  renderer.setSize(bounds.width, bounds.height, false);
  camera.aspect = bounds.width / bounds.height;
  camera.updateProjectionMatrix();
  frameView();
}

async function load() {
  const revision = ++generation;
  loading = true;
  status.textContent = 'Loading candidate models…';
  /** @type {Map<string, Model>} */
  const staged = new Map();
  function discardStaged() {
    for (const model of staged.values()) release(model);
    staged.clear();
  }
  try {
    for (const name of names) {
      const level = quality.value === 'low' ? 1 : 0;
      const file = new URL(`../art/manifests/models/${name}-lod${level}.glb`, import.meta.url);
      const gltf = await loader.loadAsync(file.href);
      /** @type {THREE.Material[]} */
      const materials = [];
      gltf.scene.traverse(node => {
        if (node instanceof THREE.Mesh) materials.push(...(Array.isArray(node.material) ? node.material : [node.material]));
      });
      const model = { root: gltf.scene, mixer: new THREE.AnimationMixer(gltf.scene), clips: gltf.animations, materials };
      staged.set(name, model);
      if (revision !== generation || disposed) { discardStaged(); return; }
      applyStyle(gltf.scene, name !== 'magma-cavern', materials);
      status.textContent = `Loaded ${staged.size} of ${names.length} art bundles`;
    }
    for (const model of models.values()) release(model);
    models.clear();
    for (const [name, model] of staged) { models.set(name, model); scene.add(model.root); }
    staged.clear();
    renderer.shadowMap.enabled = quality.value !== 'low';
    compose();
    resize();
    status.textContent = `${quality.value.toUpperCase()} • ${reduced.checked ? 'held pose' : 'animation playback'} • candidate assets awaiting visual review`;
  } catch (error) {
    discardStaged();
    console.error('Art preview load failed', error);
    if (revision === generation && !disposed) status.textContent = 'Candidate assets could not load. Any previous preview is retained; generate the GLBs, then use Reload assets.';
  } finally {
    if (revision === generation) loading = false;
  }
}

function draw(time = 0) {
  if (disposed) return;
  const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
  previousTime = time;
  if (!document.hidden) {
    if (!reduced.checked && !loading) for (const model of models.values()) model.mixer.update(delta);
    renderer.render(scene, camera);
  }
  animationFrame = window.requestAnimationFrame(draw);
}
const observer = new ResizeObserver(resize);
observer.observe(canvas);
for (const control of [subject, angle]) control.addEventListener('change', compose);
clip.addEventListener('change', playClip);
reduced.addEventListener('change', () => { playClip(); status.textContent = 'Art preview • motion preference updated'; });
quality.addEventListener('change', () => void load());
element('reload').addEventListener('click', () => void load());
sound.addEventListener('click', async () => {
  if (audio) { await audio.close(); audio = undefined; sound.setAttribute('aria-pressed', 'false'); return; }
  try {
    audio = new AudioContext();
    const output = audio.createGain();
    output.gain.value = .045;
    output.connect(audio.destination);
    for (const frequency of [49, 73.5, 98.1]) {
      const oscillator = audio.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(output);
      oscillator.start();
    }
    await audio.resume();
    sound.setAttribute('aria-pressed', 'true');
  } catch (error) { console.error('Art mood audio unavailable', error); status.textContent = 'Cavern sound is unavailable in this browser.'; }
});
document.addEventListener('visibilitychange', () => {
  previousTime = 0;
  if (document.hidden) void audio?.suspend();
  else if (sound.getAttribute('aria-pressed') === 'true') void audio?.resume();
});
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  status.textContent = 'Graphics were interrupted. Reload this art-preview page.';
  window.cancelAnimationFrame(animationFrame);
});
window.addEventListener('pagehide', () => {
  disposed = true;
  generation += 1;
  window.cancelAnimationFrame(animationFrame);
  observer.disconnect();
  for (const model of models.values()) release(model);
  renderer.dispose();
  gradient.dispose();
  outlines.dispose();
  platformMaterial.dispose();
  pedestal.geometry.dispose();
  void audio?.close();
});
window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
resize();
draw();
void load();
