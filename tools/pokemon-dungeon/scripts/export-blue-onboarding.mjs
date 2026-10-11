import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Keep complete source facts and provenance in the authoring catalog. Emit
// only the fields consumed by opening character creation, preserving order.
const input = new URL('../content/blue-onboarding/', import.meta.url);
const output = new URL('../../../games/pokemon-dungeon-reimagined/content/onboarding/', import.meta.url);
const check = process.argv.includes('--check');
const pick = (record, keys) => Object.fromEntries(keys.map(key => [key, record[key]]));
if (!check) await mkdir(output, { recursive: true });
for (const name of ['algorithm', 'partners', 'questions', 'results']) {
  const source = JSON.parse(await readFile(new URL(`${name}.json`, input), 'utf8'));
  const header = { schemaVersion: 2, ...pick(source, ['catalogId', 'edition', 'kind']) };
  let body;
  if (name === 'algorithm') body = { natureOrder: source.natureOrder };
  else if (name === 'partners') body = { orderedPool: source.orderedPool,
    pairs: source.pairs.map(pair => pick(pair, ['heroSpeciesId', 'partnerSpeciesId'])) };
  else if (name === 'questions') body = { records: source.records.map(question => ({
    ...pick(question, ['id', 'categoryId', 'selectable', 'prompt']),
    options: question.options.map(option => pick(option, ['text', 'scores', 'followUp'])),
  })) };
  else body = { records: source.records.map(result => pick(result, ['natureId', 'description', 'maleSpeciesId', 'femaleSpeciesId'])) };
  const bytes = Buffer.from(JSON.stringify({ ...header, ...body }) + '\n');
  if (check) {
    if (!(await readFile(new URL(`${name}.json`, output))).equals(bytes)) throw new Error(`Stale opening character data: ${name}`);
  } else await writeFile(new URL(`${name}.json`, output), bytes);
}
console.log('Opening character data projected from four reviewed resources; no game execution.');
