import * as THREE from 'three';
import { createEnvironment } from './environment.js';
/** @typedef {{id:string, firstColumn:number, frames:number, frameMs:number, loop:boolean}} Clip */
/** @typedef {{name:string, atlas:string, worldHeight:number}} Character */
/** @typedef {{characters:Character[],clips:Clip[]}} Manifest */
/** @param {string} id */
function select(id) { const node = document.getElementById(id); if (!(node instanceof HTMLSelectElement)) throw new Error(`Missing ${id}`); return node; }
function controls() {
  const canvas = document.getElementById('preview'), status = document.getElementById('status'), still = document.getElementById('still'), orbit = document.getElementById('orbit');
  if (!(canvas instanceof HTMLCanvasElement) || !status || !(still instanceof HTMLInputElement) || !(orbit instanceof HTMLButtonElement)) throw new Error('Missing art controls');
  return { canvas, status, still, orbit };
}
const { canvas, status, still, orbit } = controls();
const subject = select('subject'), angle = select('angle'), clipSelect = select('clip');
const params = new URLSearchParams(location.search);
for (const [key, control] of /** @type {const} */ ([['subject', subject], ['angle', angle], ['clip', clipSelect]])) if ([...control.options].some(option => option.value === params.get(key))) control.value = params.get(key) ?? control.value;
still.checked = params.get('still') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#302731'); scene.fog = new THREE.Fog('#302731', 21, 55);
const camera = new THREE.PerspectiveCamera(43, 1, .1, 100);
createEnvironment(scene);
/** @type {{name:string,mesh:THREE.Mesh,texture:THREE.Texture,heading:number,height:number,shadow:THREE.Mesh}[]} */
const actors = [];
// Review-only world-space reference: actor heading zero is fixed world +Z.
const facingProof = params.get('direction-proof') === '1';
const forwardMarker = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, .07, 0), 1, 0x77e3ed, .2, .13);
forwardMarker.visible = facingProof && subject.value !== 'composition'; scene.add(forwardMarker);
/** @type {Manifest | undefined} */ let manifest;
let orbiting = false, orbitOffset = 0, previous = 0, clock = 0, animation = 0, disposed = false;
function compose() {
  for (const actor of actors) {
    actor.mesh.visible = subject.value === 'composition' || subject.value === actor.name;
    actor.shadow.visible = actor.mesh.visible;
    actor.mesh.position.set(0, 0, 0); actor.heading = 0;
    if (subject.value === 'composition') {
      if (actor.name === 'pikachu') { actor.mesh.position.set(-1.15, 0, 5); actor.heading = Math.PI; }
      if (actor.name === 'charmander') { actor.mesh.position.set(.9, 0, 4.7); actor.heading = Math.PI; }
      if (actor.name === 'groudon') actor.mesh.position.set(0, 0, -5.4);
    }
    actor.shadow.position.set(actor.mesh.position.x, .005, actor.mesh.position.z);
  }
  const selected = actors.find(actor => actor.name === subject.value);
  forwardMarker.visible = facingProof && !!selected;
  if (selected) forwardMarker.setLength(selected.height * .9, selected.height * .16, selected.height * .12);
  clock = 0; orbitOffset = 0; frameCamera();
}
function frameCamera() {
  const yaw = Number(angle.value) * Math.PI / 4 + orbitOffset;
  if (subject.value === 'composition') {
    const distance = camera.aspect < 1 ? 22 : 17;
    camera.position.set(Math.sin(yaw + .17) * distance, camera.aspect < 1 ? 6.5 : 4.8, Math.cos(yaw + .17) * distance - 1);
    camera.lookAt(0, 1.6, -.5);
  } else {
    const height = actors.find(actor => actor.name === subject.value)?.height ?? 2;
    const distance = height * 2.05 * Math.max(1, 1 / camera.aspect);
    camera.position.set(Math.sin(yaw) * distance, height * .63, Math.cos(yaw) * distance);
    camera.lookAt(0, height * .48, 0);
  }
}
function resize() {
  if (disposed) return;
  const bounds = canvas.getBoundingClientRect(); if (!bounds.width || !bounds.height) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(bounds.width, bounds.height, false);
  camera.aspect = bounds.width / bounds.height; camera.updateProjectionMatrix(); frameCamera();
}
async function load() {
  try {
    const base = new URL('../../art/pixel/', import.meta.url);
    const response = await fetch(new URL('manifest.json', base)); if (!response.ok) throw new Error('Manifest unavailable');
    manifest = /** @type {Manifest} */ (await response.json());
    const loader = new THREE.TextureLoader();
    for (const character of manifest.characters) {
      const texture = await loader.loadAsync(new URL(character.atlas, base).href);
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false;
      texture.repeat.set(1 / 12, 1 / 8);
      const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: .5, side: THREE.DoubleSide });
      const geometry = new THREE.PlaneGeometry(character.worldHeight, character.worldHeight);
      geometry.translate(0, character.worldHeight * (92 / 96 - .5), 0);
      const mesh = new THREE.Mesh(geometry, material); scene.add(mesh);
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(character.worldHeight * .28, 32), new THREE.MeshBasicMaterial({ color: '#100e16', transparent: true, opacity: .65, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .62; scene.add(shadow);
      actors.push({ name: character.name, mesh, texture, heading: 0, height: character.worldHeight, shadow });
    }
    compose(); status.textContent = facingProof ? 'Cyan arrow: fixed world +Z / actor heading 0 · art orientation proof' : '3 candidate species · 8 views · partial clips · acceptance pending'; document.body.dataset.ready = 'true';
  } catch (error) { console.error(error); status.textContent = 'Art assets could not load. Run pixel:export, then reload this proof viewer.'; document.body.dataset.ready = 'error'; }
}
function draw(time = 0) {
  if (disposed) return;
  const delta = previous ? Math.min((time - previous) / 1000, .05) : 0; previous = time;
  if (!document.hidden) {
    if (!still.checked) clock += delta;
    if (orbiting) { orbitOffset += delta * .32; frameCamera(); }
    const clip = manifest?.clips.find(item => item.id === clipSelect.value);
    for (const actor of actors) {
      const bearing = Math.atan2(camera.position.x - actor.mesh.position.x, camera.position.z - actor.mesh.position.z);
      actor.mesh.rotation.y = bearing;
      const row = (Math.round((actor.heading - bearing) / (Math.PI / 4)) % 8 + 8) % 8;
      if (facingProof && actor.name === subject.value) document.body.dataset.facingRow = String(row);
      let column = 0;
      if (clip) { const requestedFrame = Number(params.get('frame') ?? 0); const frame = still.checked && Number.isInteger(requestedFrame) && requestedFrame >= 0 && requestedFrame < 4 ? requestedFrame : Math.floor(clock * 1000 / clip.frameMs); column = clip.firstColumn + (clip.loop ? frame % clip.frames : Math.min(frame, clip.frames - 1)); }
      actor.texture.offset.set(column / 12, 1 - (row + 1) / 8);
    }
    renderer.render(scene, camera);
  }
  animation = requestAnimationFrame(draw);
}
subject.addEventListener('change', compose); angle.addEventListener('change', () => { orbitOffset = 0; frameCamera(); }); clipSelect.addEventListener('change', () => { clock = 0; }); still.addEventListener('change', () => { clock = 0; });
orbit.addEventListener('click', () => { orbiting = !orbiting; orbit.setAttribute('aria-pressed', String(orbiting)); });
const observer = new ResizeObserver(resize); observer.observe(canvas);
document.addEventListener('visibilitychange', () => { previous = 0; });
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(animation); status.textContent = 'Graphics interrupted. Reload the art proof to recover.'; });
window.addEventListener('pagehide', () => {
  disposed = true; cancelAnimationFrame(animation); observer.disconnect();
  forwardMarker.dispose();
  scene.traverse(node => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); for (const material of Array.isArray(node.material) ? node.material : [node.material]) { if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose(); material.dispose(); } } }); renderer.dispose();
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
resize(); draw(); void load();
