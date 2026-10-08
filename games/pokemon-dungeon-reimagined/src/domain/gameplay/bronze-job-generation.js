import { FRIEND_JOB_FACTS as FACTS } from '../../../content/authored/friend-job-facts.js';
import { BRONZE_JOB_FACTS as BRONZE } from '../../../content/authored/bronze-job-facts.js';
import { eligibleJobSpecies } from './friend-job-generation.js';
import { rescueRank } from './job-generation.js';
import { draw, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {{mimeJrFigureReceived:boolean,weavileFigureReceived:boolean}} ExclusiveRewardFlags
 * @typedef {{dungeonId:string,floor:number,escort:boolean}} Location
 * @typedef {{missionType:0|1|2|3|4,dungeonId:string,floor:number,seed:number,clientSpecies:string,targetSpecies:string,targetItem:string,itemReward:string,unk2:number,rewardType:0|1|2|3|4|5|6|7|8,friendAreaReward:string|null}} GeneratedJob */

/** Native helper discards a complete sample before the exclusion loop. The
 * inclusive threshold comparison and RandInt9999 preserve source ordering.
 * Set3 has neither exclusive figure, but their source flag predicates remain.
 * EVENT_B01P01 is distinct from the saved64 cutscene flags. The current pools
 * have no figure; any future pool requires its genuine event-flag owner.
 * @param {State} state @param {0|1|2|3|4} missionType
 * @param {Readonly<ExclusiveRewardFlags>} [exclusiveFlags] */
export function bronzeRewardItem(state, missionType, exclusiveFlags) {
  const facts = missionType === 2 ? BRONZE : FACTS;
  function sample() {
    const categoryRoll = draw(state,9999,'jobsRewards');
    const category = facts.rewardCategories.find(row => row.threshold >= categoryRoll)?.category;
    const itemRoll = draw(state,9999,'jobsRewards');
    const id = facts.rewardItems.find(row => row.category === category && row.threshold >= itemRoll)?.itemId;
    if (!id) return blocked('bronze-reward-source-pool');
    return id;
  }
  sample();
  let attempts = 0;
  for (;;) {
    if (++attempts > 4096) return blocked('bronze-exclusive-rejection-bound');
    const id = sample();
    if (id === 'item-weavile-fig' || id === 'item-mime-jr-fig') {
      if (!exclusiveFlags) return blocked('native-event-b01p01-reward-flag-owner');
      if (id === 'item-weavile-fig' ? exclusiveFlags.weavileFigureReceived : exclusiveFlags.mimeJrFigureReceived) continue;
    }
    return id;
  }
}
/** Destination is selected before mission type. Existing escort reserves its
 * entire route; previously generated ordinary floors remain when escort wins.
 * @param {State} state @param {readonly Location[]} occupied */
function destination(state,occupied) {
  const start = draw(state,FACTS.routes.length,'jobsRewards');
  for (let step = 0; step < FACTS.routes.length; step++) {
    const route = FACTS.routes[(start+step)%FACTS.routes.length];
    if (!route || !state.progress.clears[route.dungeonId]) return blocked('job-conquered-route');
    const first = draw(state,route.floorNumbers.length,'jobsRewards');
    for (let n = 0; n < route.floorNumbers.length; n++) {
      const floor = route.floorNumbers[(first+n)%route.floorNumbers.length];
      if (floor === undefined) return blocked('job-source-floor');
      if (!route.excludedFloorNumbers.includes(floor) && !occupied.some(row => row.dungeonId === route.dungeonId && (row.escort || row.floor === floor))) return { route,floor };
    }
  }
  return null;
}
/** Complete finite native generator. Paired rescue helpers have zero eligible
 * rows in the admitted19 species; escort still consumes its initial subtype
 * sample. Postgame target rewrites remain behind their genuine quest gate.
 * @param {State} state @param {readonly Location[]} occupied
 * @returns {Omit<GeneratedJob,'rewardType'|'friendAreaReward'>|null} */
export function generateBronzeJob(state,occupied) {
  const location = destination(state,occupied); if (!location) return null;
  let type = [0,1,2,3,4,2,1,0][draw(state,8,'jobsRewards')];
  if (type === 2 && rescueRank(state.progress.rankPoints) === 0) type = 0;
  if (type !== 0 && type !== 1 && type !== 2 && type !== 3 && type !== 4) return blocked('job-mission-table');
  const seed = draw(state,0x100000000,'jobsRewards') & 0xffffff;
  const species = eligibleJobSpecies(state);
  let client = species.length ? species[draw(state,species.length,'jobsRewards')] : FACTS.fallbackClient;
  let target = species.length ? species[draw(state,species.length,'jobsRewards')] : FACTS.fallbackTarget;
  if (!client || !target) return blocked('job-species-draw');
  if (type !== 1 && type !== 2) target = client;
  let targetItem = location.route.targetItemIds[draw(state,location.route.targetItemIds.length,'jobsRewards')];
  if (!targetItem) return blocked('job-target-item-pool');
  let itemReward = bronzeRewardItem(state,type), attempts = 0;
  while (itemReward === targetItem) {
    if (++attempts > 4096) return blocked('job-reward-rejection-bound');
    itemReward = bronzeRewardItem(state,type);
  }
  let unk2 = 0;
  if (type === 1 || type === 2 || type === 3 || type === 4) {
    const subtype = draw(state,0x100000000,'jobsRewards');
    if (type === 2 && (subtype & 0x3000) === 0x1000) {
      const pairs = BRONZE.escortPairs.filter(([a,b]) => a && b && species.includes(a) && species.includes(b));
      if (pairs.length) {
        const pair = pairs[draw(state,pairs.length,'jobsRewards')];
        if (!pair?.[0] || !pair[1]) return blocked('escort-pair-source');
        const orientation = draw(state,0x100000000,'jobsRewards') & 0x10;
        client = orientation ? pair[0] : pair[1]; target = orientation ? pair[1] : pair[0]; unk2 = 9;
      }
    }
    if ((type === 3 || type === 4) && (subtype & 0x700) === 0x300) {
      const favorites = FACTS.favoriteItems.filter(([id,item]) => id && item && species.includes(id) && location.route.targetItemIds.includes(item));
      if (favorites.length) {
        const chosen = favorites[draw(state,favorites.length,'jobsRewards')];
        if (!chosen?.[0] || !chosen[1]) return blocked('favorite-item-source');
        client = chosen[0]; target = client; targetItem = chosen[1]; unk2 = 6;
      }
    }
  }
  return { missionType: type,dungeonId: location.route.dungeonId,floor: location.floor,seed,clientSpecies: client,targetSpecies: target,targetItem,itemReward,unk2 };
}
/** @param {State} state @param {readonly Location[]} occupied @returns {GeneratedJob[]} */
export function generateBronzeBoard(state,occupied) {
  const count = 5+draw(state,4,'jobsRewards');
  /** @type {GeneratedJob[]} */ const jobs = [];
  for (let index = 0; index < count; index++) {
    const raw = generateBronzeJob(state,[...occupied,...jobs.map(row => ({ dungeonId: row.dungeonId,floor: row.floor,escort: row.missionType === 2 }))]);
    if (!raw) break;
    jobs.push({ ...raw,rewardType: /** @type {0|1|2|3} */ (draw(state,4,'jobsRewards')),friendAreaReward: null });
  }
  return jobs.sort((a,b) => (FACTS.routes.find(row => row.dungeonId === a.dungeonId)?.nativeDungeonId ?? 0)-(FACTS.routes.find(row => row.dungeonId === b.dungeonId)?.nativeDungeonId ?? 0) || a.floor-b.floor);
}
