// Disposable art-only capture, never opens or imports any games source.
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repository = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(path.join(repository, 'package.json'));
const { chromium } = require('playwright');
const target = path.join(repository, 'tools/pokemon-dungeon/art/production/evidence/captures');
await mkdir(target, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).slice(1);
    if (!relative.startsWith('tools/pokemon-dungeon/') || relative.split('/').includes('..')) { response.writeHead(403); response.end(); return; }
    let filename = path.join(repository, relative);
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] ?? 'application/octet-stream' }); response.end(await readFile(filename));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ ...(process.env.PIXEL_CAPTURE_BROWSER ? { executablePath: process.env.PIXEL_CAPTURE_BROWSER } : {}), headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}/tools/pokemon-dungeon/art-preview/production/`;
  const sourceFiles = await Promise.all(['art/production/manifest.json', 'art/production/page-index.json', 'art-preview/production/viewer.js', 'art-preview/pixel/environment.js', 'art-preview/production/index.html', 'art-preview/production/style.css'].map(async relative => ({ path: relative, sha256: createHash('sha256').update(await readFile(path.join(repository, 'tools/pokemon-dungeon', relative))).digest('hex') })));
  const errors = [], captures = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith(`http://127.0.0.1:${address.port}/tools/pokemon-dungeon/`)) errors.push(`Non-tool resource: ${request.url()}`); });
  async function capture(name, query) {
    await page.goto(`${base}?still=1&${query}`);
    await page.waitForSelector('body[data-ready="true"]', { timeout: 20000 });
    await page.screenshot({ path: path.join(target, `${name}.jpg`), type: 'jpeg', quality: 90 });
    const facingRow = await page.locator('body').getAttribute('data-facing-row');
    const residentPages = Number(await page.locator('body').getAttribute('data-resident-pages'));
    if (residentPages > 3) throw new Error('Visible-only page limit exceeded');
    captures.push({ residentPages, ...(facingRow === null ? {} : { facingRow: Number(facingRow) }), file: `${name}.jpg`, query: `still=1&${query}`, viewport: page.viewportSize() });
  }
  const roster = ['bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil', 'totodile', 'treecko', 'torchic', 'mudkip', 'pikachu', 'meowth', 'psyduck', 'machop', 'cubone', 'eevee', 'skitty'];
  for (const subject of roster) for (const angle of [0, 1, 2, 4]) await capture(`${subject}-camera-${angle}`, `subject=${subject}&angle=${angle}`);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const subject of ['bulbasaur', 'chikorita', 'treecko', 'pikachu', 'machop', 'skitty']) await capture(`composition-${subject}-${width}`, `subject=${subject}&composition=1&clip=idle`);
  }
  await page.setViewportSize({ width: 900, height: 1000 });
  for (let angle = 0; angle < 8; angle++) {
    await capture(`facing-pikachu-camera-${angle}`, `subject=pikachu&angle=${angle}`);
    const actual = await page.locator('body').getAttribute('data-facing-row');
    const expected = [0, 7, 6, 5, 4, 3, 2, 1][angle];
    if (Number(actual) !== expected) throw new Error(`Art facing camera ${angle}: expected row ${expected}, got ${actual}`);
  }
  for (const [subject, clip, frame] of [['bulbasaur', 'walk', 2], ['pikachu', 'attack-physical', 2], ['squirtle', 'attack-special', 2], ['chikorita', 'cast-status', 2], ['machop', 'hit-heavy', 1], ['eevee', 'defeat', 3], ['torchic', 'celebrate', 1], ['skitty', 'rest-sleep', 1], ['meowth', 'interact', 1]]) await capture(`pose-${subject}-${clip}`, `subject=${subject}&clip=${clip}&frame=${frame}&angle=7`);
  // Exercise only authoring UI disposal, not game code or game routes.
  await page.goto(`${base}?subject=bulbasaur&composition=1&still=1`);
  await page.waitForSelector('body[data-ready="true"]');
  for (const clip of ['walk', 'turn', 'defeat', 'idle']) { await page.selectOption('#clip', clip); await page.waitForSelector('body[data-ready="true"]'); }
  const lifecycle = await page.locator('body').evaluate(body => ({ live: Number(body.dataset.residentPages), peak: Number(body.dataset.peakPages), disposed: Number(body.dataset.disposedPages) }));
  if (lifecycle.live !== 3 || lifecycle.peak > 3 || lifecycle.disposed !== 12) throw new Error(`Page lifecycle mismatch: ${JSON.stringify(lifecycle)}`);
  await page.locator('#composition').uncheck(); await page.waitForSelector('body[data-ready="true"]');
  await page.locator('#preview').focus(); await page.keyboard.press('ArrowRight');
  if (await page.locator('#angle').inputValue() !== '1') throw new Error('Art camera keyboard control failed');
  console.log(`Authoring lifecycle: ${JSON.stringify(lifecycle)}; keyboard orbit observed.`);
  await writeFile(path.join(target, 'capture-record.json'), `${JSON.stringify({ browser: browser.version(), renderer: 'headless Chromium / SwiftShader', scope: 'art-only; no game modules or game routes', sourceFiles, motion: 'held clip-page frames; not measured performance', lifecycle, errors, captures }, null, 2)}\n`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Captured ${captures.length} art-only frames; zero console/page/resource errors. ${target}`);
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
