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
const target = path.join(repository, 'tools/pokemon-dungeon/art/pixel/captures');
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
  const base = `http://127.0.0.1:${address.port}/tools/pokemon-dungeon/art-preview/pixel/`;
  const sourceFiles = await Promise.all(['art/pixel/manifest.json', 'art-preview/pixel/viewer.js', 'art-preview/pixel/environment.js', 'art-preview/pixel/index.html', 'art-preview/pixel/style.css'].map(async relative => ({ path: relative, sha256: createHash('sha256').update(await readFile(path.join(repository, 'tools/pokemon-dungeon', relative))).digest('hex') })));
  const errors = [], captures = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith(`http://127.0.0.1:${address.port}/tools/pokemon-dungeon/`)) errors.push(`Non-tool resource: ${request.url()}`); });
  const views = ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left'];
  async function capture(name, query) {
    await page.goto(`${base}?still=1&${query}`);
    await page.waitForSelector('body[data-ready="true"]', { timeout: 20000 });
    await page.screenshot({ path: path.join(target, `${name}.jpg`), type: 'jpeg', quality: 90 });
    const facingRow = await page.locator('body').getAttribute('data-facing-row');
    captures.push({ ...(facingRow === null ? {} : { facingRow: Number(facingRow) }), file: `${name}.jpg`, query: `still=1&${query}`, viewport: page.viewportSize() });
  }
  await capture('composition-desktop', 'subject=composition');
  await page.setViewportSize({ width: 390, height: 844 });
  await capture('composition-mobile', 'subject=composition');
  await page.setViewportSize({ width: 900, height: 900 });
  for (const subject of ['pikachu', 'charmander', 'groudon']) for (let angle = 0; angle < 8; angle++) await capture(`${subject}-${views[angle]}`, `subject=${subject}&angle=${angle}`);
  for (let angle = 0; angle < 8; angle++) {
    await capture(`facing-pikachu-camera-${angle}`, `subject=pikachu&angle=${angle}&direction-proof=1`);
    const actual = await page.locator('body').getAttribute('data-facing-row');
    const expected = [0, 7, 6, 5, 4, 3, 2, 1][angle];
    if (Number(actual) !== expected) throw new Error(`Art facing proof camera ${angle}: expected row ${expected}, got ${actual}`);
  }
  for (const clip of ['idle', 'walk', 'attack-physical']) for (let frame = 0; frame < 4; frame++) await capture(`motion-${clip}-${frame}`, `subject=composition&clip=${clip}&frame=${frame}`);
  await writeFile(path.join(target, 'capture-record.json'), `${JSON.stringify({ browser: browser.version(), renderer: 'headless Chromium / SwiftShader', scope: 'art-only; no game modules or game routes', sourceFiles, motion: 'held atlas frames; not measured performance', errors, captures }, null, 2)}\n`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Captured ${captures.length} art-only frames; zero console/page/resource errors. ${target}`);
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
