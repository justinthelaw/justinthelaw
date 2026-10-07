import { EARLY_JOB_FACTS as FACTS } from '../../../content/authored/early-job-facts.js';
import { draw, blocked } from './support.js';

/** Native numeric mission semantics, independent of the conflicting C names.
 * @typedef {0|1|3|4} EarlyMissionType
 * @typedef {{dungeonId:string,floor:number,escort:boolean}} JobLocation
 * @typedef {{missionType:EarlyMissionType,dungeonId:string,floor:number,seed:number,clientSpecies:string,targetSpecies:string,targetItem:string,itemReward:string,rewardType:0|1|2|3}} GeneratedJob
 * @typedef {import('../../contracts/campaign.js').CampaignState} State
 */
/** Native rescue_team_info.c thresholds; points are never truncated to keep a
 * later dependency unreachable. @param {number} points */
export function rescueRank(points) {
  return [50, 500, 1500, 3000, 7500, 15000].filter(threshold => points >= threshold).length;
}

/** Source pokemon_mail.c:sub_803C110. The factual finite pool already excludes
 * all native bans and nonbase forms; hero/partner and recorded seen flags remain
 * runtime predicates. No absent legacy history is filled from encounter tables.
 * @param {State} state */
export function eligibleJobSpecies(state) {
  const seen = state.speciesSeen; if (!seen) return blocked('job-seen-history');
  const hero = state.roster[state.profile.heroId], partner = state.roster[state.profile.partnerId];
  return FACTS.eligibleSeenSpecies.filter(id => id !== hero?.identity.speciesId && id !== partner?.identity.speciesId && seen.identities.some(identity => identity.speciesId === id && identity.formId === null));
}

/** Set1 category/item thresholds, preserving sub_803C37C's discarded sample.
 * This owner is deliberately difficulty1 only (both ordinary early routes).
 * @param {State} state */
export function earlyRewardItem(state) {
  /** @returns {string} */
  function sample() {
    const categoryRoll = draw(state, 9999, 'jobsRewards');
    const category = FACTS.rewardCategories.find(row => row.threshold >= categoryRoll)?.category;
    const itemRoll = draw(state, 9999, 'jobsRewards');
    const item = FACTS.rewardItems.find(row => row.category === category && row.threshold >= itemRoll)?.itemId;
    if (!item) return blocked('job-reward-source-pool');
    return item;
  }
  sample(); return sample();
}

/** Native dungeon-first circular search, then circular floor search. Accepted,
 * mailbox and current-board records all participate in the caller's occupancy.
 * @param {State} state @param {readonly JobLocation[]} occupied */
function destination(state, occupied) {
  const start = draw(state, FACTS.routes.length, 'jobsRewards');
  for (let step = 0; step < FACTS.routes.length; step++) {
    const route = FACTS.routes[(start + step) % FACTS.routes.length];
    if (!route || !state.progress.clears[route.dungeonId]) return blocked('job-conquered-route');
    const first = draw(state, route.floorNumbers.length, 'jobsRewards');
    for (let n = 0; n < route.floorNumbers.length; n++) {
      const floor = route.floorNumbers[(first + n) % route.floorNumbers.length];
      if (floor === undefined) return blocked('job-source-floor');
      if (!occupied.some(row => row.dungeonId === route.dungeonId && (row.escort || row.floor === floor))) return { route, floor };
    }
  }
  return null;
}

/** Shared early generator. Source pair/favorite rewrites have no eligible rows
 * in this finite pool; the subtype sample is still consumed. Postgame item
 * rewrites remain behind their native quest gate. Seed is retained as source
 * job identity data; browser floor generation uses its documented domain RNG.
 * @param {State} state @param {readonly JobLocation[]} occupied
 * @returns {Omit<GeneratedJob,'rewardType'>|null} */
export function generateEarlyJob(state, occupied) {
  const location = destination(state, occupied); if (!location) return null;
  let type = [0, 1, 2, 3, 4, 2, 1, 0][draw(state, 8, 'jobsRewards')];
  if (type === 2 && rescueRank(state.progress.rankPoints) === 0) type = 0;
  if (type !== 0 && type !== 1 && type !== 3 && type !== 4) return blocked('escort-objective-dependency');
  const seed = draw(state, 0x100000000, 'jobsRewards') & 0xffffff;
  const species = eligibleJobSpecies(state);
  const client = species.length ? species[draw(state, species.length, 'jobsRewards')] : FACTS.fallbackClient;
  let target = species.length ? species[draw(state, species.length, 'jobsRewards')] : FACTS.fallbackTarget;
  if (!client || !target) return blocked('job-species-draw');
  if (type !== 1) target = client;
  const targetItem = location.route.targetItemIds[draw(state, location.route.targetItemIds.length, 'jobsRewards')];
  if (!targetItem) return blocked('job-target-item-pool');
  let itemReward = earlyRewardItem(state), attempts = 0;
  while (itemReward === targetItem) {
    // Browser transaction resource bound, not a replacement reward or altered
    // accepted draw. Failure rolls back the entire draft/RNG transaction.
    if (++attempts > 4096) return blocked('job-reward-rejection-bound');
    itemReward = earlyRewardItem(state);
  }
  if (type === 1 || type === 3 || type === 4) draw(state, 0x100000000, 'jobsRewards');
  return { missionType: type, dungeonId: location.route.dungeonId, floor: location.floor, seed, clientSpecies: client, targetSpecies: target, targetItem, itemReward };
}

/** GeneratePelipperJobs makes5–8 attempts with a maximum8 slots. Two early
 * routes have only five legal locations; conflicts may leave fewer offers.
 * @param {State} state @param {readonly JobLocation[]} occupied
 * @returns {GeneratedJob[]} */
export function generateEarlyBoard(state, occupied) {
  const count = 5 + draw(state, 4, 'jobsRewards');
  /** @type {GeneratedJob[]} */ const jobs = [];
  for (let index = 0; index < count; index++) {
    const job = generateEarlyJob(state, [...occupied, ...jobs.map(row => ({ dungeonId: row.dungeonId, floor: row.floor, escort: false }))]);
    if (!job) break;
    jobs.push({ ...job, rewardType: /** @type {0|1|2|3} */ (draw(state, 4, 'jobsRewards')) });
  }
  return jobs.sort((a, b) => (FACTS.routes.find(row => row.dungeonId === a.dungeonId)?.nativeDungeonId ?? 0) - (FACTS.routes.find(row => row.dungeonId === b.dungeonId)?.nativeDungeonId ?? 0) || a.floor - b.floor);
}
