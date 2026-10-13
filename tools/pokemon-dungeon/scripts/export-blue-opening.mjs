import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Read factual JSON only. This authoring projection never executes game modules.
const root = new URL('../../../games/pokemon-dungeon-reimagined/content/', import.meta.url);
const sourceFiles = new Map();
const sourceBytes = await readFile(new URL('../content/blue-source.json', import.meta.url));
sourceFiles.set('tools/pokemon-dungeon/content/blue-source.json', createHash('sha256').update(sourceBytes).digest('hex'));
const source = JSON.parse(sourceBytes.toString('utf8'));
if (source.schemaVersion !== 1 || source.scope !== 'Original Blue Rescue Team opening through Tiny Woods only') throw new Error('Unsupported opening factual source.');
const { starterProfiles: starterDoc, species: speciesRows, profiles: profileRows,
  levels: levelRows, learnsets: learnRows, identities, actions: actionRows,
  bodies: bodyRows, floors: floorRows, generations: generationRows,
  encounters: encounterRows, timers: timerRows, ai } = source;
for (const [rows, count] of [[speciesRows, 22], [profileRows, 22], [levelRows, 22],
  [learnRows, 22], [actionRows, 115], [bodyRows, 22], [floorRows, 3],
  [generationRows, 3], [encounterRows, 2]]) {
  if (!Array.isArray(rows) || rows.length !== count || new Set(rows.map(row => row.id)).size !== count) throw new Error('Opening factual source coverage changed.');
}
const map = rows => new Map(rows.map(row => [row.id, row]));
const profiles = map(profileRows), levels = map(levelRows), learns = map(learnRows), names = map(speciesRows), bodies = new Map(bodyRows.map(row => [row.speciesId, row]));
const spawnBytes = await readFile(new URL('../content/blue-wild-spawns.json', import.meta.url));
sourceFiles.set('tools/pokemon-dungeon/content/blue-wild-spawns.json', createHash('sha256').update(spawnBytes).digest('hex'));
const spawnFacts = JSON.parse(spawnBytes.toString('utf8'));
if (spawnFacts.schemaVersion !== 1 || spawnFacts.dungeon.id !== 'tiny-woods' || spawnFacts.dungeon.randomMovementChance !== 0) throw new Error('Unsupported opening wild-spawn facts.');
const spawnRows = new Map(spawnFacts.species.map(row => [row.speciesId, row]));
if (spawnRows.size !== 4 || [...spawnRows.keys()].sort().join(',') !== 'pokemon-016,pokemon-102,pokemon-191,pokemon-265') throw new Error('Opening wild-spawn coverage changed.');
for (const [id, row] of spawnRows) {
  if (row.internalId !== profiles.get(id)?.internalId || row.bodySize !== 1 || !Number.isInteger(row.chanceAsleep) || row.chanceAsleep < 0 || row.chanceAsleep > 100) throw new Error(`Invalid wild-spawn row: ${id}`);
}
const secondaryGateBytes = await readFile(new URL('../content/blue-secondary-gates.json', import.meta.url));
sourceFiles.set('tools/pokemon-dungeon/content/blue-secondary-gates.json', createHash('sha256').update(secondaryGateBytes).digest('hex'));
const secondaryGateFacts = JSON.parse(secondaryGateBytes.toString('utf8'));
if (secondaryGateFacts.schemaVersion !== 1 || secondaryGateFacts.sourceCommit !== '013475aa04f5be3191e5527c186d9bfceae7cae0') throw new Error('Unsupported opening secondary-gate facts.');
const secondaryGates = new Map(secondaryGateFacts.records.map(row => [row.moveId, row]));
if (secondaryGates.size !== 2 || secondaryGateFacts.records.length !== 2) throw new Error('Opening secondary-gate coverage changed.');
for (const [id, internalId, handler] of [['move-mud-slap', 213, 'MudSlapMoveAction'], ['move-dynamic-punch', 246, 'DynamicPunchMoveAction']]) {
  const row = secondaryGates.get(id);
  if (!row || row.internalId !== internalId || row.handler !== handler || row.gate !== 'sub_805727C' || row.chanceArgument !== 0) throw new Error(`Invalid secondary-gate row: ${id}`);
}
const starterIds = starterDoc.records.map(row => row.speciesId);
const speciesIds = [...new Set([...starterIds, 'pokemon-016', 'pokemon-102', 'pokemon-191', 'pokemon-265'])];
const moves = new Map();
const moveNames = new Map(identities.moves.map(row => [row.originalId, row]));
const actionMap = new Map(actionRows.map(row => [row.internalId, row]));
const aiMap = new Map(ai.actions.map(row => [row.actionId, row]));
function projectMove(id, name, internalId) {
  const action = actionMap.get(internalId);
  if (!action) throw new Error(`Missing move ${internalId}`);
  const gate = secondaryGates.get(id);
  let effects = action.effects;
  if (gate) {
    const secondary = effects.filter(effect => effect.op === 'secondary');
    if (internalId !== gate.internalId || secondary.length !== 1 || secondary[0].chancePercent !== 100) throw new Error(`Secondary-gate projection mismatch: ${id}`);
    effects = effects.map(effect => effect.op === 'secondary' ? { ...effect, gate: 'secondary-effect-common', secondaryChanceRaw: gate.chanceArgument } : effect);
  }
  const numeric = { ...action.numeric }; delete numeric.ginsengCap;
  return { id, name, ...numeric, range: action.target.rangeCode, target: action.target.categoryCode, cutsCorners: action.target.wallCornerRules?.cutsCorners === true, effects, aiWeight: aiMap.get(internalId)?.weight ?? 15 };
}
const species = Object.fromEntries(speciesIds.map(id => {
  const p = profiles.get(id), level = levels.get(p.levelResourceId), learn = learns.get(p.learnsetResourceId);
  const isStarter = starterIds.includes(id);
  const levelUp = isStarter ? learn.levelUp : learn.levelUp.filter(([at]) => at <= 1);
  const learnset = levelUp.map(([at, internalId]) => {
    const name = moveNames.get(internalId), action = actionMap.get(internalId);
    if (!name || !action) throw new Error(`Missing move ${internalId}`);
    moves.set(name.id, projectMove(name.id, name.name, internalId));
    return [at, name.id];
  });
  return [id, { name: names.get(id).name, ...(spawnRows.has(id) ? { chanceAsleep: spawnRows.get(id).chanceAsleep } : {}), types: p.typeIds.map(n => identities.types.find(t => t.originalId === n)?.name ?? 'None'), abilities: p.abilityIds.filter(n => n !== null).map(n => identities.abilities.find(a => a.originalId === n)?.name), regenerationRate: p.regenerationRate, experienceYield: p.experienceYield, lowKickMultiplier: bodies.get(id).lowKickMultiplier[0], baseStats: level.baseStats, growth: isStarter ? level.rows : level.rows.slice(0, 2), learnset }];
}));
moves.set('regular-attack', { ...projectMove('regular-attack', 'Attack', 355), aiWeight: 100 });
moves.set('move-struggle', projectMove('move-struggle', 'Struggle', 352));
moves.set('bide-release', projectMove('bide-release', 'Bide', 357));
const generations = map(generationRows), encounters = map(encounterRows);
const floors = floorRows.filter(floor => floor.dungeonId === 'tiny-woods').sort((a, b) => a.localFloor - b.localFloor).map(floor => ({ number: floor.localFloor, label: `${floor.display.prefix}${floor.display.number}${floor.display.suffix}`, generation: generations.get(floor.generationId).parameters, encounters: encounters.get(floor.encounterPoolId).rows.filter(row => row.entryRole === 'weighted-candidate').map(row => ({ speciesId: row.speciesId, level: row.level, threshold: row.selectionThreshold })) }));
const output = {
  version: 1, edition: 'Blue Rescue Team original opening', qualification: 'Existing qualified Blue/shared facts with explicitly comparative Red rules. Browser RNG and compact AI do not claim cartridge sequence parity.',
  sources: Object.fromEntries([...sourceFiles].sort(([a], [b]) => a.localeCompare(b))),
  wildSpawn: { randomMovementChance: spawnFacts.dungeon.randomMovementChance },
  starterIds, species, moves: Object.fromEntries([...moves].sort(([a], [b]) => a.localeCompare(b))), floors,
  timers: Object.fromEntries(timerRows.map(row => [row.id, { min: row.drawDomain.minInclusive, max: row.drawDomain.maxInclusive, indefinite: row.indefinite }])),
};
// Keep the reviewed original catalogs immutable; Roux is an authored addition.
const rouxBytes = await readFile(new URL('../content/roux-adventure.json', import.meta.url));
const roux = JSON.parse(rouxBytes.toString('utf8'));
if (roux.schemaVersion !== 1 || roux.speciesId !== 'pokemon-roux' || roux.evolves !== false) throw new Error('Unsupported Roux profile.');
output.starterIds.push(roux.speciesId);
output.species[roux.speciesId] = roux.species;
for (const move of roux.moves) {
  if (output.moves[move.id]) throw new Error(`Authored move replaces a Blue fact: ${move.id}`);
  output.moves[move.id] = move;
}
output.edition = "Pokémon Mystery Dungeon: Roux's Adventure";
output.qualification += ` ${roux.qualification} Roux-only Pickup is an authored floor-entry berry chance.`;
output.sources['tools/pokemon-dungeon/content/roux-adventure.json'] = createHash('sha256').update(rouxBytes).digest('hex');
const target = new URL('blue-opening.json', root);
const bytes = `${JSON.stringify(output)}\n`;
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== bytes) throw new Error('Opening factual projection is stale.');
  console.log(`Opening factual projection verified (${Buffer.byteLength(bytes)} bytes).`);
} else {
  await writeFile(target, bytes);
  console.log(`Wrote opening factual projection (${Buffer.byteLength(bytes)} bytes).`);
}
