import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const campaignAuthorRoot = new URL('../content/campaign-runtime/', import.meta.url);
export const campaignRuntimeRoot = new URL('../../../games/pokemon-dungeon-reimagined/content/campaign/', import.meta.url);
export const campaignFiles = Object.freeze(['schema.json', 'model.json', 'predicates.json', 'transitions.json', 'routes.json', 'bosses.json', 'contracts.json', 'identities.json', 'sources.json']);
export const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');
export async function buildCampaignExport() {
  const resources = new Map();
  for (const file of campaignFiles) {
    const text = await readFile(new URL(file, campaignAuthorRoot), 'utf8');
    JSON.parse(text);
    if (Buffer.byteLength(text) >= 1024 * 1024) throw new Error(`Campaign resource exceeds budget: ${file}`);
    resources.set(file, text);
  }
  const manifest = `${JSON.stringify({ schemaVersion: 1, catalogId: 'original-blue-campaign-facts', kind: 'manifest', resources: [...resources].map(([file, text]) => ({ file, bytes: Buffer.byteLength(text), sha256: hashBytes(text) })) }, null, 2)}\n`;
  resources.set('manifest.json', manifest);
  const integrity = `/** Generated campaign manifest fingerprint; paired with the reviewed local resource set. */\nexport const CAMPAIGN_MANIFEST_SHA256 = '${hashBytes(manifest)}';\n`;
  return { resources, integrity };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { resources, integrity } = await buildCampaignExport();
  const check = process.argv.includes('--check');
  if (!check) await mkdir(campaignRuntimeRoot, { recursive: true });
  for (const [file, text] of [...resources, ['../campaign-integrity.js', integrity]]) {
    const target = new URL(file, campaignRuntimeRoot);
    if (check) {
      if (await readFile(target, 'utf8') !== text) throw new Error(`Stale campaign export: ${file}`);
    } else await writeFile(target, text);
  }
  console.log(`Campaign ${check ? 'export verified' : 'exported'}: ${resources.size} bounded resources; no game execution.`);
}
