import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Documentation export only. Run check-content.mjs first; no game modules load.
const checking = process.argv.length === 3 && process.argv[2] === '--check';
if (process.argv.length > 2 && !checking) throw new Error('Expected no arguments or --check.');
const contentRoot = new URL('../content/', import.meta.url);
const output = new URL('../../../games/pokemon-dungeon-reimagined/plan/CONTENT-COVERAGE.csv', import.meta.url);
const columns = [
  'id', 'category', 'name', 'source_status', 'source_refs', 'implementation_package',
  'asset_package', 'implementation_status', 'manual_acceptance', 'inventory', 'blockers',
];
const rows = [];
for (const filename of ['species.json', 'forms.json', 'locations.json', 'systems.json']) {
  const inventory = JSON.parse(await readFile(new URL(filename, contentRoot), 'utf8'));
  for (const record of inventory.records) {
    rows.push([
      record.id, record.recordKind, record.name, record.sourceStatus,
      record.provenanceIds.join(';'), record.implementationPackage, record.assetPackage,
      record.implementationStatus, record.acceptanceStatus,
      `../../../tools/pokemon-dungeon/content/${filename}#${record.id}`, record.blockerIds.join(';'),
    ]);
  }
}
rows.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
function cell(value) {
  const text = String(value);
  return /[,"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
const text = [columns, ...rows].map(row => row.map(cell).join(',')).join('\n') + '\n';
if (checking) {
  if (await readFile(output, 'utf8') !== text) throw new Error('Content coverage is stale; run npm run content:coverage.');
  console.log(`Content coverage matches all ${rows.length} authoring records (no gameplay acceptance).`);
} else {
  await writeFile(output, text);
  console.log(`Wrote ${rows.length} authoring coverage rows to ${fileURLToPath(output)}.`);
}
