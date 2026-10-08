/** Native threshold selection followed by availability rejection. Both floor
 * placement and arrivals use this owner; a bounded failure never changes pools.
 * @param {readonly import('../../../content/dungeons.js').EncounterPool['rows'][number][]} rows
 * @param {(row:import('../../../content/dungeons.js').EncounterPool['rows'][number])=>boolean} eligible
 * @param {(cap:number)=>number} draw */
export function selectEncounter(rows, eligible, draw) {
  for (let attempt = 0; attempt < 1024; attempt++) {
    const roll = draw(10000);
    const row = rows.find(row => row.selectionThreshold > 0 && row.selectionThreshold >= roll) ?? rows.find(row => row.selectionThreshold > 0);
    if (!row) return null;
    if (row.speciesId !== null && row.entryRole === 'weighted-candidate' && eligible(row)) return row;
  }
  return null;
}
