import * as THREE from 'three';
import { createEnvironment } from '../pixel/environment.js';
/** @typedef {{id:string,durationsMs:number[],frames:number,loop:boolean}} Clip */
/** @typedef {{name:string,speciesId:string,worldHeight:number,features:string[],pages:{clip:string,path:string}[]}} Character */
/** @typedef {{characters:Character[],clips:Clip[],directions:string[]}} Manifest */
/** @typedef {{character:Character,mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>,texture:THREE.Texture,shadow:THREE.Mesh<THREE.CircleGeometry,THREE.MeshBasicMaterial>,heading:number}} Actor */
/** @param {string} id */
function select(id) { const node = document.getElementById(id); if (!(node instanceof HTMLSelectElement)) throw new Error(`Missing ${id}`); return node; }
/** @param {string} id */
function input(id) { const node = document.getElementById(id); if (!(node instanceof HTMLInputElement)) throw new Error(`Missing ${id}`); return node; }
/** @param {string} id */
function canvasElement(id) { const node = document.getElementById(id); if (!(node instanceof HTMLCanvasElement)) throw new Error(`Missing ${id}`); return node; }
/** @param {string} id */
function element(id) { const node = document.getElementById(id); if (!node) throw new Error(`Missing ${id}`); return node; }
const canvas = canvasElement('preview'), strip = canvasElement('strip'), context = strip.getContext('2d');
if (!context) throw new Error('2D inspector unavailable');
const status = element('status'), memory = element('memory'), detail = element('detail');
const subject = select('subject'), angle = select('angle'), clipSelect = select('clip'), frameSelect = select('frame');
const still = input('still'), composition = input('composition'), orbit = element('orbit');
const params = new URLSearchParams(location.search), base = new URL('../../art/roster/', import.meta.url);
still.checked = params.get('still') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches;
composition.checked = params.get('composition') === '1';
for (const [name, control] of /** @type {const} */ ([['angle', angle], ['frame', frameSelect]])) if ([...control.options].some(o => o.value === params.get(name))) control.value = params.get(name) ?? '0';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#302731'); scene.fog = new THREE.Fog('#302731', 20, 55);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 100); createEnvironment(scene);
const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, .04, 0), 1.6, 0x82e6e8, .25, .15); scene.add(arrow);
/** @type {Manifest | undefined} */ let manifest;
/** @type {Actor[]} */ const actors = [];
let loading = false, pendingSelection = false;
let generation = 0, livePages = 0, peakPages = 0, disposedPages = 0, disposed = false, orbiting = false, orbitOffset = 0, clock = 0, previous = 0, animation = 0;
function account() { const bytes = livePages * 1179648; if (bytes > 25165824) throw new Error('Character page ceiling exceeded'); peakPages = Math.max(peakPages, livePages); memory.textContent = `${livePages} resident clip page${livePages === 1 ? '' : 's'} · ${(bytes / 1048576).toFixed(3)} MiB decoded texels / 24 MiB ceiling · peak ${peakPages} pages · ${disposedPages} disposed. CPU image copies and terrain/framebuffers are additional.`; document.body.dataset.residentPages = String(livePages); document.body.dataset.peakPages = String(peakPages); document.body.dataset.disposedPages = String(disposedPages); }
function releaseActors() { for (const a of actors) { scene.remove(a.mesh, a.shadow); a.texture.dispose(); a.mesh.geometry.dispose(); a.mesh.material.dispose(); a.shadow.geometry.dispose(); a.shadow.material.dispose(); livePages--; disposedPages++; } actors.length = 0; context?.clearRect(0, 0, 384, 96); account(); }
function frameCamera() {
  const yaw = Number(angle.value) * Math.PI / 4 + orbitOffset;
  if (composition.checked) { const distance = camera.aspect < 1 ? 9.3 : 8.3; camera.position.set(Math.sin(yaw + .11) * distance, 3.0, Math.cos(yaw + .11) * distance + 1.2); camera.lookAt(0, 1.0, .2); }
  else { const height = actors[0]?.character.worldHeight ?? 1.8; const distance = height * 2.0 * Math.max(1, .8 / camera.aspect); camera.position.set(Math.sin(yaw) * distance, height * .75, Math.cos(yaw) * distance); camera.lookAt(0, height * .47, 0); }
}
function resize() { if (disposed) return; const bounds = canvas.getBoundingClientRect(); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(bounds.width, bounds.height, false); camera.aspect = bounds.width / bounds.height; camera.updateProjectionMatrix(); frameCamera(); }
async function loadSelection() {
  const token = ++generation;
  if (loading) { pendingSelection = true; return; }
  loading = true; releaseActors(); document.body.dataset.ready = 'loading'; clock = 0; orbitOffset = 0;
  if (!manifest) { loading = false; return; }
  const index = Math.max(0, manifest.characters.findIndex(c => c.name === subject.value));
  const selected = composition.checked ? [index, (index + 1) % manifest.characters.length, (index + 2) % manifest.characters.length].map(i => manifest?.characters[i]).filter((c) => c !== undefined) : [manifest.characters[index]].filter((c) => c !== undefined);
  try {
    for (const [i, character] of selected.entries()) {
      const page = character.pages.find(p => p.clip === clipSelect.value); if (!page) throw new Error('Selected clip is absent');
      const texture = await new THREE.TextureLoader().loadAsync(new URL(page.path, base).href);
      if (disposed || token !== generation) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false; texture.repeat.set(.25, .125);
      const height = character.worldHeight;
      const geometry = new THREE.PlaneGeometry(height, height); geometry.translate(0, height * (92 / 96 - .5), 0);
      const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: .5, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      if (composition.checked) mesh.position.set(i === 0 ? -.95 : i === 1 ? .95 : .1, 0, i === 2 ? -2 : 2);
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(height * .24, 32), new THREE.MeshBasicMaterial({ color: '#11101a', transparent: true, opacity: .7, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .65; shadow.position.set(mesh.position.x, .01, mesh.position.z);
      scene.add(mesh, shadow); actors.push({ character, mesh, texture, shadow, heading: composition.checked && i < 2 ? Math.PI : 0 }); livePages++; account();
    }
    arrow.visible = !composition.checked; frameCamera(); resize(); document.body.dataset.ready = 'true'; status.textContent = `${selected.map(c => c.name).join(' / ')} · ${clipSelect.value} · art only`;
  } catch (error) { if (token !== generation || disposed) return; releaseActors(); status.textContent = `Art page load failed: ${error instanceof Error ? error.message : String(error)}`; document.body.dataset.ready = 'error'; console.error(error); }
  finally { loading = false; if (pendingSelection && !disposed) { pendingSelection = false; void loadSelection(); } }
}
/** @param {Clip} clip */
function playbackFrame(clip) { if (still.checked) return Number(frameSelect.value); const duration = clip.durationsMs.reduce((a, b) => a + b, 0); let cursor = clip.loop ? clock % duration : Math.min(clock, duration - 1); for (let i = 0; i < 4; i++) { cursor -= clip.durationsMs[i] ?? 0; if (cursor < 0) return i; } return 3; }
/** @param {number} [time] */
function draw(time = 0) {
  if (disposed) return;
  const delta = previous ? Math.min(time - previous, 50) : 0; previous = time;
  if (!document.hidden) {
    if (!still.checked) clock += delta;
    if (orbiting) { orbitOffset += delta * .00032; frameCamera(); }
    const clip = manifest?.clips.find(c => c.id === clipSelect.value), frame = clip ? playbackFrame(clip) : 0;
    for (const [i, actor] of actors.entries()) {
      const bearing = Math.atan2(camera.position.x - actor.mesh.position.x, camera.position.z - actor.mesh.position.z);
      actor.mesh.rotation.y = bearing;
      const row = (Math.round((actor.heading - bearing) / (Math.PI / 4)) % 8 + 8) % 8;
      actor.texture.offset.set(frame / 4, 1 - (row + 1) / 8);
      if (i === 0) { document.body.dataset.facingRow = String(row); document.body.dataset.frame = String(frame); context?.clearRect(0, 0, 384, 96); context?.drawImage(/** @type {HTMLImageElement} */ (actor.texture.image), 0, row * 96, 384, 96, 0, 0, 384, 96); detail.textContent = `${actor.character.name} · ${clipSelect.value} · ${manifest?.directions[row]} · frame ${frame + 1}/4 · ${actor.character.features.join(', ')}`; }
    }
    renderer.render(scene, camera);
  }
  animation = requestAnimationFrame(draw);
}
subject.addEventListener('change', () => void loadSelection()); composition.addEventListener('change', () => void loadSelection()); clipSelect.addEventListener('change', () => void loadSelection());
angle.addEventListener('change', () => { orbitOffset = 0; frameCamera(); }); frameSelect.addEventListener('change', () => { still.checked = true; });
element('restart').addEventListener('click', () => { clock = 0; still.checked = false; }); orbit.addEventListener('click', () => { orbiting = !orbiting; orbit.setAttribute('aria-pressed', String(orbiting)); });
canvas.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); angle.value = String((Number(angle.value) + (event.key === 'ArrowRight' ? 1 : 7)) % 8); orbitOffset = 0; frameCamera(); } });
const observer = new ResizeObserver(resize); observer.observe(canvas); document.addEventListener('visibilitychange', () => { previous = 0; });
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(animation); status.textContent = 'Graphics interrupted. Reload this art viewer to recover.'; });
window.addEventListener('pagehide', () => { disposed = true; generation++; cancelAnimationFrame(animation); observer.disconnect(); releaseActors(); arrow.dispose(); const textures = new Set(); scene.traverse(node => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); for (const material of Array.isArray(node.material) ? node.material : [node.material]) { if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map); material.dispose(); } } }); for (const texture of textures) texture.dispose(); renderer.dispose(); });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
async function init() { try { const response = await fetch(new URL('viewer-index.json', base)); if (!response.ok) throw new Error('Manifest unavailable'); manifest = /** @type {Manifest} */ (await response.json()); for (const c of manifest.characters) { const option = document.createElement('option'); option.value = c.name; option.textContent = c.name[0]?.toUpperCase() + c.name.slice(1); subject.append(option); } for (const c of manifest.clips) { const option = document.createElement('option'); option.value = c.id; option.textContent = c.id; clipSelect.append(option); } subject.value = manifest.characters.some(c => c.name === params.get('subject')) ? params.get('subject') ?? 'bulbasaur' : 'bulbasaur'; clipSelect.value = manifest.clips.some(c => c.id === params.get('clip')) ? params.get('clip') ?? 'idle' : 'idle'; await loadSelection(); } catch (error) { console.error(error); status.textContent = 'Production art manifest unavailable.'; document.body.dataset.ready = 'error'; } }
resize(); draw(); void init();
