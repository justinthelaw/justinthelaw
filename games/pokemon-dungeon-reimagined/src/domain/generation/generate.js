import { snapshotNavigationData } from '../../../content/navigation.js';
import { Draws, positions, ordinary, finalizeGeometry, reachable } from './support.js';
import { buildLayout, fallbackLayout, layoutFamily } from './layouts.js';
import { buildFixedArena, buildEmbeddedChamber } from './fixed.js';
import { applyRoomFeatures, applySecondaryTerrain } from './features.js';
import { placePopulation } from './placement.js';
/** @param {import('./types.js').Geometry} map */
function enoughRooms(map) { const floors = positions(map, t => ordinary(t) && t.room !== null); return floors.length >= 30 && new Set(floors.map(p => map.cells[p.z]?.[p.x]?.room)).size >= 2; }
/** Ordinary floor validation excludes protected reward chambers and generation-marked islands.
 * @param {import('./types.js').Geometry} map
 */
function connected(map) { if (!map.entry)
    return false; const seen = reachable(map, map.entry, true); return positions(map, t => ordinary(t) && !t.unbreakable && !t.special).every(p => seen.has(p.z * 56 + p.x)); }
/** Generate a detached proposal. Rejection never exposes consumed streams for commit.
 * @param {import('./types.js').GenerateInput} input @param {import('./types.js').GenerationDependencies} dependencies @returns {import('./types.js').GenerationResult}
 */
export function generateFloor(input, dependencies) {
    const p = input.generation.parameters, c = input.context, profile = input.profile;
    if (profile.generationId !== input.generation.id || !Number.isInteger(c.teamSize) || c.teamSize < 1 || c.teamSize > 4 || !Number.isInteger(c.enemyLimit) || c.enemyLimit < 0 || c.enemyLimit > 124)
        throw new TypeError('Invalid generation request.');
    const fixed = dependencies.navigation.fixed(p.fixedRoomNumber);
    if (fixed.kind === 'unused' || (fixed.kind !== 'sentinel' && !fixed.canonical))
        return { kind: 'blocked', requirementIds: ['noncanonical-fixed-room'] };
    if (fixed.kind === 'floorwide' && c.fixedEncounter === null)
        return { kind: 'blocked', requirementIds: [`fixed-encounter-plan:${fixed.index}`] };
    if (profile.populationRoute === 'imported-team-data' && c.receivedTeam === null)
        return { kind: 'blocked', requirementIds: ['received-team-population'] };
    if (p.enemyDensity === 255 && c.specialPopulation === null && c.receivedTeam === null && fixed.kind !== 'floorwide')
        return { kind: 'blocked', requirementIds: ['meteor-cave-special-population'] };
    if (c.required.length > 64)
        return { kind: 'blocked', requirementIds: ['required-placement-capacity'] };
    const layout = new Draws(input.streams.layout), population = new Draws(input.streams.encountersItems), family = layoutFamily(p.layout), liquid = dependencies.navigation.liquid(p.tileset) === 'lava' ? 'lava' : 'water';
    let budget = p.secondaryStructuresBudget, totalGeometry = 0, secondaryEver = false;
    for (let outer = 0; outer < 11; outer++) {
        let map = fallbackLayout(), fallback = outer === 10;
        if (!fallback)
            for (let inner = 0; inner < 10; inner++) {
                totalGeometry++;
                if (inner > 0)
                    budget = 0;
                map = fixed.kind === 'floorwide' ? buildFixedArena(fixed, liquid) : fixed.kind === 'embedded' ? buildEmbeddedChamber(fixed, p, layout, liquid) : buildLayout(p, layout, budget);
                budget = applyRoomFeatures(map, p, c, layout, liquid, budget, family);
                secondaryEver = secondaryEver || map.externalSecondary;
                if (fixed.kind === 'floorwide')
                    break;
                finalizeGeometry(map);
                if (enoughRooms(map))
                    break;
                if (inner === 9) {
                    map = fixed.kind === 'embedded' ? buildEmbeddedChamber(fixed, p, layout, liquid) : fallbackLayout();
                    fallback = true;
                    if (fixed.kind === 'sentinel')
                        applyRoomFeatures(map, p, c, layout, liquid, 0, 2);
                }
            }
        if (outer === 10) {
            if (fixed.kind === 'embedded')
                map = buildEmbeddedChamber(fixed, p, layout, liquid);
            else if (fixed.kind === 'floorwide')
                map = buildFixedArena(fixed, liquid);
            else
                applyRoomFeatures(map, p, c, layout, liquid, 0, 2);
        }
        map.externalSecondary = secondaryEver && fixed.kind === 'sentinel';
        finalizeGeometry(map);
        applySecondaryTerrain(map, p, layout, liquid);
        const result = placePopulation(map, input, dependencies, population, outer === 10);
        if (!result || (fixed.kind !== 'floorwide' && !connected(map)))
            continue;
        if (fixed.kind === 'embedded' && (!map.reward || !map.keyDoor && fixed.doors > 0))
            return { kind: 'blocked', requirementIds: ['protected-chamber-recovery'] };
        return snapshotNavigationData({ kind: 'ready', blueprint: { width: 56, height: 32, profileId: profile.id, generationId: input.generation.id, fixedIndex: fixed.index, layoutFamily: family, geometry: map, placements: result.placements, partyPositions: result.partyPositions, diagnostics: { outerAttempts: outer + 1, geometryAttempts: totalGeometry, fallback, adaptations: ['browser-xoshiro-u16-source-scaling', 'bounded-actual-neighbor-dead-end-repair', 'independent-fixed-geometry', 'ordinary-required-target-component'] } }, streams: { layout: layout.state, encountersItems: population.state } });
    }
    return Object.freeze({ kind: 'blocked', requirementIds: Object.freeze(['generation-connectivity-or-population-budget']) });
}
