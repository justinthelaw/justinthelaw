import { readFile, mkdir, writeFile } from 'node:fs/promises';

// The opening owns only the personality algorithm, questions, results and
// partner choices. Copy their reviewed factual JSON without game execution.
const input = new URL('../content/blue-onboarding/', import.meta.url);
const output = new URL('../../../games/pokemon-dungeon-reimagined/content/onboarding/', import.meta.url);
const check = process.argv.includes('--check');
if (!check) await mkdir(output, { recursive: true });
for (const file of ['algorithm.json', 'partners.json', 'questions.json', 'results.json']) {
  const bytes = await readFile(new URL(file, input));
  JSON.parse(bytes.toString('utf8'));
  if (check) {
    if (!(await readFile(new URL(file, output))).equals(bytes)) throw new Error(`Stale opening character data: ${file}`);
  } else await writeFile(new URL(file, output), bytes);
}
console.log('Opening personality and partner facts: four reviewed resources; no game execution.');
