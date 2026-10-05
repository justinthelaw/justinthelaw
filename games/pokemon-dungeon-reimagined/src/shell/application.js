import { Color, PerspectiveCamera, Scene, WebGLRenderer } from '../../vendor/three/three.module.min.js';
import { loadInitialScene } from './resources.js';

/** @typedef {{ status(message: string): void, unavailable(message: string): void }} StartupView */

/** Owns only presentation lifetime. There is no simulation or save access here.
 * @param {HTMLCanvasElement} canvas
 * @param {AbortSignal} signal
 * @param {StartupView} view
 */
export async function createApplication(canvas, signal, view) {
  view.status('Checking graphics support…');
  const context = canvas.getContext('webgl2', { alpha: false, antialias: true });
  if (!context) throw new Error('WebGL 2 is unavailable. Enable hardware acceleration or use a supported browser.');
  /** @type {WebGLRenderer | undefined} */
  let renderer;
  /** @type {ResizeObserver | undefined} */
  let observer;
  /** @type {MediaQueryList | undefined} */
  let densityQuery;
  const listeners = new AbortController();
  let disposed = false;
  let contextLost = false;
  let frame = 0;
  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 2, 5);

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.cancelAnimationFrame(frame);
    observer?.disconnect();
    densityQuery?.removeEventListener('change', watchDensity);
    listeners.abort();
    signal.removeEventListener('abort', dispose);
    renderer?.dispose();
    // Keep the context reusable when this document enters the back/forward cache.
    // The browser destroys it with the document when the iframe is removed.
    canvas.hidden = true;
  }

  function render() {
    frame = 0;
    if (disposed || contextLost || document.hidden || !renderer) return;
    try { renderer.render(scene, camera); }
    catch (error) {
      console.error('Presentation failed', error);
      dispose();
      view.unavailable('Graphics could not be displayed. Reload to try again.');
    }
  }

  function scheduleFrame() {
    if (!frame && !disposed && !contextLost && !document.hidden) frame = window.requestAnimationFrame(render);
  }

  function resize() {
    if (!renderer || disposed || contextLost) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    scheduleFrame();
  }

  function watchDensity() {
    densityQuery?.removeEventListener('change', watchDensity);
    if (disposed) return;
    densityQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    densityQuery.addEventListener('change', watchDensity, { once: true });
    resize();
  }

  signal.addEventListener('abort', dispose, { once: true });
  try {
    signal.throwIfAborted();
    // Attach loss handling before the renderer so recovery never leaves a blank page.
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      contextLost = true;
      window.cancelAnimationFrame(frame);
      frame = 0;
      view.status('Graphics were interrupted. Waiting for recovery…');
      view.unavailable('The graphics connection was lost. Reload to restore the scene.');
    }, { signal: listeners.signal });
    canvas.addEventListener('webglcontextrestored', () => {
      // Deliberate reload reconstructs resources; partial GPU state is never reused.
      view.unavailable('Graphics are available again. Reload to restore the scene.');
    }, { signal: listeners.signal });
    renderer = new WebGLRenderer({ canvas, context, alpha: false, antialias: true });
    view.status('Loading scene resources…');
    const initial = await loadInitialScene(signal);
    signal.throwIfAborted();
    if (contextLost) throw new Error('Graphics were interrupted during loading. Reload to restore the scene.');
    scene.background = new Color(initial.background);
    canvas.hidden = false;
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize, { signal: listeners.signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { window.cancelAnimationFrame(frame); frame = 0; }
      else resize();
    }, { signal: listeners.signal });
    watchDensity();
    return { dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
