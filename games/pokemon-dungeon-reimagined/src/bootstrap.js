/** @typedef {{ dispose(): void }} Application */

/** @param {string} id */
function element(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Startup element is missing: ${id}`);
  return node;
}
function sceneCanvas() {
  const node = element('scene');
  if (!(node instanceof HTMLCanvasElement)) throw new Error('Startup canvas is missing.');
  return node;
}
const heading = element('heading');
const status = element('status');
const failure = element('failure');
const progress = element('progress');
const retry = element('retry');
const application = element('application');
const canvas = sceneCanvas();
document.documentElement.dataset.bootstrap = 'started';

/** @type {Application | undefined} */
let running;
/** @type {AbortController | undefined} */
let attempt;
let active = true;

/** @param {string} message */
function showFailure(message) {
  heading.textContent = 'Unable to start';
  status.textContent = 'Check your connection and browser, then try again.';
  failure.textContent = message;
  failure.hidden = false;
  progress.hidden = true;
  application.setAttribute('aria-busy', 'false');
  retry.hidden = false;
  retry.focus();
}

async function start() {
  attempt?.abort();
  running?.dispose();
  running = undefined;
  const controller = new AbortController();
  attempt = controller;
  retry.hidden = true;
  failure.hidden = true;
  progress.hidden = false;
  application.setAttribute('aria-busy', 'true');
  heading.textContent = 'Preparing the adventure';
  status.textContent = 'Loading the application…';
  const timeout = window.setTimeout(() => {
    if (!active || attempt !== controller || controller.signal.aborted) return;
    controller.abort();
    showFailure('Loading took too long. No saved progress was changed.');
  }, 20000);
  try {
    const { createApplication } = await import('./shell/application.js');
    if (!active || controller.signal.aborted) return;
    const next = await createApplication(canvas, controller.signal, {
      status(message) { status.textContent = message; },
      unavailable(message) { showFailure(message); },
    });
    if (!active || controller.signal.aborted) { next.dispose(); return; }
    running = next;
    heading.textContent = 'Adventure in development';
    status.textContent = 'The application is ready. The campaign is not available in this development build.';
    application.setAttribute('aria-busy', 'false');
    progress.hidden = true;
  } catch (error) {
    if (!active || controller.signal.aborted) return;
    console.error('Application startup failed', error);
    showFailure(error instanceof Error ? error.message : 'An unexpected loading error occurred.');
  } finally {
    window.clearTimeout(timeout);
  }
}

retry.addEventListener('click', () => {
  // A fresh document also clears the browser's cached rejected module imports.
  window.location.reload();
});
window.addEventListener('pagehide', () => {
  active = false;
  attempt?.abort();
  running?.dispose();
  running = undefined;
});
window.addEventListener('pageshow', event => {
  if (event.persisted) { active = true; void start(); }
});
void start();
