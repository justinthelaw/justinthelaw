import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const onboardingAuthorRoot = new URL('../content/onboarding-runtime/', import.meta.url);
export const onboardingRuntimeRoot = new URL('../../../games/pokemon-dungeon-reimagined/content/onboarding/', import.meta.url);
export const onboardingFiles = Object.freeze(['schema.json', 'questions.json', 'algorithm.json', 'results.json', 'partners.json', 'profiles.json', 'initialization.json', 'sources.json']);
export const hashBytes = value => createHash('sha256').update(value).digest('hex');
export function canonicalFacts(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalFacts).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalFacts(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const hashFacts = value => hashBytes(canonicalFacts(value));

export async function buildOnboardingExport() {
  const output = new Map();
  for (const file of onboardingFiles) {
    const bytes = await readFile(new URL(file, onboardingAuthorRoot), 'utf8');
    JSON.parse(bytes);
    if (Buffer.byteLength(bytes) >= 1024 * 1024) throw new Error(`Onboarding file too large: ${file}`);
    output.set(file, bytes);
  }
  output.set('manifest.json', `${JSON.stringify({
    schemaVersion: 1, catalogId: 'original-blue-onboarding', kind: 'manifest',
    resources: [...output].map(([file, bytes]) => ({ file, bytes: Buffer.byteLength(bytes), sha256: hashBytes(bytes) })),
  }, null, 2)}\n`);
  return output;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const output = await buildOnboardingExport();
  const check = process.argv.includes('--check');
  if (!check) await mkdir(onboardingRuntimeRoot, { recursive: true });
  for (const [file, bytes] of output) {
    const target = new URL(file, onboardingRuntimeRoot);
    if (check) {
      if (await readFile(target, 'utf8') !== bytes) throw new Error(`Stale onboarding export: ${file}`);
    } else await writeFile(target, bytes);
  }
  console.log(`Onboarding ${check ? 'export verified' : 'exported'}: ${output.size} bounded local JSON resources; no game code executed.`);
}
