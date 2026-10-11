import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Read factual JSON only. This authoring projection never executes game modules.
const root = new URL('../../../games/pokemon-dungeon-reimagined/content/', import.meta.url);
const sourceFiles = new Map();
async function json(file) {
  const bytes = await readFile(new URL(file, root));
  sourceFiles.set(file, createHash('sha256').update(bytes).digest('hex'));
  return JSON.parse(bytes.toString('utf8'));
}
async function records(directory, prefix) {
  const files = (await readdir(new URL(`${directory}/`, root))).filter(file => file.startsWith(prefix) && file.endsWith('.json')).sort();
  return (await Promise.all(files.map(file => json(`${directory}/${file}`)))).flatMap(doc => doc.records);
}
const [starterDoc, speciesRows, profileRows, levelRows, learnRows, identities, actionRows, bodyRows, floorRows, generationRows, encounterRows, timerRows] = await Promise.all([
  json('onboarding/profiles.json'), records('species', 'species'), records('species', 'profiles-'), records('species', 'levels-'), records('species', 'learnsets'), json('species/identities.json'), records('effects', 'actions-'), records('effects', 'species-parameters-'), records('dungeons', 'floors-'), records('dungeons', 'generation-'), records('dungeons', 'encounters-'), records('effects', 'timers-'),
]);
const map = rows => new Map(rows.map(row => [row.id, row]));
const profiles = map(profileRows), levels = map(levelRows), learns = map(learnRows), names = map(speciesRows), bodies = new Map(bodyRows.map(row => [row.speciesId, row]));
const starterIds = starterDoc.records.map(row => row.speciesId);
const speciesIds = [...new Set([...starterIds, 'pokemon-010', 'pokemon-012', 'pokemon-016', 'pokemon-102', 'pokemon-191', 'pokemon-265'])];
const moves = new Map();
const moveNames = new Map(identities.moves.map(row => [row.originalId, row]));
const actionMap = new Map(actionRows.map(row => [row.internalId, row]));
const aiBytes = await readFile(new URL('../content/steel/ai-facts.json', import.meta.url));
sourceFiles.set('tools/pokemon-dungeon/content/steel/ai-facts.json', createHash('sha256').update(aiBytes).digest('hex'));
const ai = JSON.parse(aiBytes.toString('utf8'));
const aiMap = new Map(ai.actions.map(row => [row.actionId, row]));
function projectMove(id, name, internalId) {
  const action = actionMap.get(internalId);
  if (!action) throw new Error(`Missing move ${internalId}`);
  return { id, name, internalId, ...action.numeric, range: action.target.rangeCode, target: action.target.categoryCode, cutsCorners: action.target.wallCornerRules?.cutsCorners === true, effects: action.effects, hitCount: action.hitCount, aiWeight: aiMap.get(internalId)?.weight ?? 15 };
}
const species = Object.fromEntries(speciesIds.map(id => {
  const p = profiles.get(id), level = levels.get(p.levelResourceId), learn = learns.get(p.learnsetResourceId);
  const learnset = learn.levelUp.map(([at, internalId]) => {
    const name = moveNames.get(internalId), action = actionMap.get(internalId);
    if (!name || !action) throw new Error(`Missing move ${internalId}`);
    moves.set(name.id, projectMove(name.id, name.name, internalId));
    return [at, name.id];
  });
  return [id, { id, name: names.get(id).name, types: p.typeIds.map(n => identities.types.find(t => t.originalId === n)?.name ?? 'None'), abilities: p.abilityIds.filter(n => n !== null).map(n => identities.abilities.find(a => a.originalId === n)?.name), regenerationRate: p.regenerationRate, experienceYield: p.experienceYield, lowKickMultiplier: bodies.get(id).lowKickMultiplier[0], baseStats: level.baseStats, growth: level.rows, learnset, starting: starterDoc.records.find(row => row.speciesId === id)?.firstPlayable ?? null }];
}));
const regular = actionMap.get(355);
moves.set('regular-attack', { id: 'regular-attack', name: 'Attack', internalId: 355, ...regular.numeric, range: 0, target: 2, cutsCorners: false, effects: regular.effects, hitCount: regular.hitCount, aiWeight: 100 });
moves.set('move-struggle', projectMove('move-struggle', 'Struggle', 352));
moves.set('bide-release', projectMove('bide-release', 'Bide', 357));
const generations = map(generationRows), encounters = map(encounterRows);
const floors = floorRows.filter(floor => floor.dungeonId === 'tiny-woods').sort((a, b) => a.localFloor - b.localFloor).map(floor => ({ number: floor.localFloor, label: `${floor.display.prefix}${floor.display.number}${floor.display.suffix}`, generation: generations.get(floor.generationId).parameters, encounters: encounters.get(floor.encounterPoolId).rows.filter(row => row.entryRole === 'weighted-candidate').map(row => ({ speciesId: row.speciesId, level: row.level, threshold: row.selectionThreshold })) }));
const output = {
  version: 1, edition: 'Blue Rescue Team original opening', qualification: 'Existing qualified Blue/shared facts with explicitly comparative Red rules. Browser RNG and compact AI do not claim cartridge sequence parity.',
  sources: Object.fromEntries([...sourceFiles].sort(([a], [b]) => a.localeCompare(b))),
  starterIds, species, moves: Object.fromEntries([...moves].sort(([a], [b]) => a.localeCompare(b))), floors,
  timers: Object.fromEntries(timerRows.map(row => [row.id, { min: row.drawDomain.minInclusive, max: row.drawDomain.maxInclusive, indefinite: row.indefinite }])),
};
const target = new URL('blue-opening.json', root);
const bytes = `${JSON.stringify(output)}\n`;
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== bytes) throw new Error('Opening factual projection is stale.');
  console.log(`Opening factual projection verified (${Buffer.byteLength(bytes)} bytes).`);
} else {
  await writeFile(target, bytes);
  console.log(`Wrote opening factual projection (${Buffer.byteLength(bytes)} bytes).`);
}
