import { OPENING_EXPEDITION as O } from '../authored/expedition.js';
import { TEAM } from '../authored/team-formation.js';
import { MORNING } from '../authored/first-morning.js';
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { TOWN } from '../authored/town.js';
import { WORK } from '../authored/early-work.js';
import { STEEL } from '../authored/mt-steel.js';
import { FRIENDS, FRIEND_AREA_FACTS } from '../authored/friends.js';
import { ORDINARY_SUMMIT, MEANIES_POSTING } from '../authored/steel-meanies.js';
import { SINISTER_UNLOCK } from '../authored/escort-work.js';
import { BRONZE_JOB_FACTS as BRONZE } from '../authored/bronze-job-facts.js';
import { checkMissionAreaRewards } from './bronze-jobs.js';
import { eligibleEncounter } from './expedition-facts.js';
import { STEEL_SLEEP_CHANCES } from './steel-facts.js';
import { diagnostics, bounded, checkName, sameForm } from './pokemon-rules.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
import { bronzeJob, isBronzeJob, promisedBronzeReward } from '../../src/domain/gameplay/bronze-job-records.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('./campaign.js').CampaignCatalogs} Catalogs
 * @typedef {ReturnType<typeof diagnostics>} Report
 * @typedef {import('../../src/contracts.js').SceneId} SceneId */

/** Retained terminal receipts on the actual later campaign. Current work,
 * resources, sessions, guests and native counters have separate actual owners;
 * no earlier whole-episode policy is called with a manufactured prerequisite.
 * @param {State} state @param {Catalogs} catalogs
 * @returns {import('../../src/contracts/campaign.js').RuleCheck} */
export function checkEscortHeritage(state,catalogs) {
  const r = diagnostics(),p = state.progress,f = state.friends,steel = state.steel,work = state.earlyWork;
  if (!f || !steel || !work) { r.check(false,'/friends','Later work retains its actual early-work, Steel and onboarding owners.'); return r.result(); }
  const phases = ['work-three','meanies-morning','meanies-ready','meanies','work-two','caterpie-morning','caterpie-ready','caterpie','sinister-ready'];
  if (!phases.includes(f.phase)) { r.check(false,'/friends/phase','Terminal heritage belongs only to the actual post-rest work interval.'); return r.result(); }

  // The initial scene is the frozen createTeamOpeningContent awakening ID.
  const opening = [/** @type {SceneId} */ ('browser-opening-awakening'),O.rescueScene,O.returnScene,TEAM.offer,TEAM.naming,TEAM.celebration];
  let revision = sceneChain(r,state,opening,0,-1);
  revision = sceneChain(r,state,MORNING.scenes,1,revision);
  revision = sceneChain(r,state,[T.rescue,T.reward,T.evening],1,revision);
  sceneChain(r,state,TOWN.scenes,2,revision);
  r.check(p.milestones[O.boostGuard]?.milestoneId === O.boostGuard,'/milestones','The once-only opening boost guard remains in real milestone history.');
  r.check(Object.keys(p.milestones).every(id => id === O.boostGuard || id === SINISTER_UNLOCK) && Object.keys(p.branches).length === 0 && p.consumedMail.length === 0,'/progress','Only the opening guard and actual later route unlock extend this history; unrelated branch or imported-mail receipts are absent.');
  const sceneIds = [...opening,...MORNING.scenes,T.rescue,T.reward,T.evening,...TOWN.scenes,...WORK.scenes,...STEEL.scenes,...FRIENDS.scenes,ORDINARY_SUMMIT];
  r.check(Object.keys(p.seenScenes).every(id => sceneIds.some(key => key === id)),'/seenScenes','The retained episodes and independently owned later work scenes exhaust actual scene history.');
  checkName(state.profile.teamName,'Pokémon',r,'/profile/teamName');
  for (const [id,identity] of /** @type {const} */ ([[state.profile.heroId,state.profile.originalHeroIdentity],[state.profile.partnerId,state.profile.originalPartnerIdentity]])) {
    const record = state.roster[id];
    r.check(record && sameForm(record.identity,identity) && record.evolutionHistory.length === 0,'/roster','The original pair retains its actual species/form and unevolved identity.');
  }
  const tiny = p.clears['tiny-woods'],cave = p.clears[T.dungeonId];
  r.check(same(Object.keys(p.clears).sort(),['tiny-woods',T.dungeonId,STEEL.dungeonId].sort()),'/clears','Actual ordinary revisits preserve exactly the three settled story rescues.');
  // Held-v2 admission never joined the Tiny clear revision/day to Caterpie.
  r.check(tiny?.clearCount === 1 && same(tiny.reachedFloorIds,['tiny-woods-floor-01','tiny-woods-floor-02','tiny-woods-floor-03']),'/clears/tiny-woods','The inherited Tiny rescue retains exactly its three-floor clear without strengthening legacy joins.');
  r.check(cave?.clearCount === 1 && same(cave.reachedFloorIds,T.floors) && cave.firstClearRevision === p.seenScenes[T.rescue]?.lastRevision && cave.lastClearRevision === cave.firstClearRevision && cave.firstClearDay === 1 && cave.lastClearDay === 1,'/clears/thunderwave-cave','The acknowledged cave rescue owns its exact five-floor day-one clear and completion revision.');

  const grants = p.appliedGrants,expected = ['browser-reunion-reward',TEAM.grant,...MORNING.grants,T.grant,...STEEL.grants];
  r.check(same(grants.slice(0,expected.length).map(row => row.grantId),expected),'/appliedGrants','The opening, morning, cave and Steel grants retain their ordered historical prefix as later grants append.');
  r.check(grants.every(row => [...expected,FRIENDS.areaGrant,FRIENDS.grant,MEANIES_POSTING].some(id => id === row.grantId)),'/appliedGrants','Actual onboarding and the separately owned Meanies posting are the only later story grants.');
  grantAt(r,state,0,O.returnScene,0); grantAt(r,state,1,TEAM.naming,0);
  const morningScenes = [0,1,4,4,5,6,6];
  for (const [i,scene] of morningScenes.entries()) {
    if (i === 5) {
      const receipt = grants[i+2],delivery = p.seenScenes[MORNING.scenes[5] ?? ''],accepted = p.seenScenes[MORNING.scenes[6] ?? ''];
      r.check(receipt?.day === 1 && delivery && accepted && bounded(receipt.revision,delivery.lastRevision+1,accepted.lastRevision-1),'/appliedGrants','The real read-mail receipt follows delivery and precedes first-request acceptance.');
    } else grantAt(r,state,i+2,MORNING.scenes[scene] ?? '',1);
  }
  grantAt(r,state,9,T.reward,1);

  // Historical totals stop at the initial request; today's ordinary runs and
  // claim partition are owned by checkEscortWorkHistory on the same real state.
  r.check(bounded(work.startedRevision,1,state.revision) && bounded(work.storyExpeditions,2,steel.priorExpeditions),'/earlyWork','The real initial-work revision and story expedition baseline survive retries and legacy posting conversion.');
  const initialRuns = steel.priorExpeditions-work.storyExpeditions;
  r.check(bounded(initialRuns,0,steel.priorExpeditions) && steel.requestDay === 2+initialRuns,'/steel/requestDay','The historical Diglett request day derives from its actual pre-Steel ordinary expedition total.');
  const initialClaims = Object.values(p.jobs).filter(job => job.phase.kind === 'claimed' && job.phase.claimedRevision < f.startedRevision);
  r.check(initialClaims.length >= 2 && initialClaims.length <= 4 && initialClaims.every(job => job.reward.rankPoints === 5 && job.source.kind === 'generated' && job.source.generationPolicyId === 'browser-early-native-jobs-v1'),'/jobs','The initial two-receipt gate retains the full original-source final batch and its five-point claims.');
  const latestClaim = Math.max(0,...initialClaims.flatMap(job => job.phase.kind === 'claimed' ? [job.phase.claimedRevision] : []));
  sceneChain(r,state,WORK.scenes,steel.requestDay,latestClaim);
  checkSteel(r,state);

  const home = p.seenScenes[STEEL.scenes[8] ?? ''];
  r.check(home && bounded(f.startedRevision,home.lastRevision+1,state.revision) && f.startedDay === steel.requestDay+1 && state.town.day >= f.startedDay+1,'/friends','Onboarding begins after the genuine Steel home receipt and its completed rest remains historical.');
  r.check(f.priorExpeditions === steel.priorExpeditions+steel.attempts && bounded(f.priorExpeditions,2,p.statistics.expeditions),'/friends/priorExpeditions','The retained onboarding baseline is exactly the completed Steel expedition total, independent of later runs.');
  sceneChain(r,state,FRIENDS.scenes.slice(0,5),f.startedDay,f.startedRevision-1);
  const areaReceipts = grants.filter(row => row.grantId === FRIENDS.areaGrant),enrollment = grants.filter(row => row.grantId === FRIENDS.grant);
  const morning = p.seenScenes[FRIENDS.scenes[1] ?? ''],welcome = p.seenScenes[FRIENDS.scenes[2] ?? ''],area = areaReceipts[0],gift = enrollment[0];
  r.check(areaReceipts.length === 1 && enrollment.length === 1 && area && gift && morning && welcome && area.day === f.startedDay && gift.day === f.startedDay && gift.revision === area.revision && bounded(area.revision,morning.lastRevision,welcome.lastRevision-1),'/appliedGrants','Free areas and Magnemite share the actual naming-convergence receipt before Wigglytuff acknowledgment.');
  r.check(f.magnemiteId !== null && f.magnemiteId !== state.profile.heroId && f.magnemiteId !== state.profile.partnerId && f.nicknamePrompt === null,'/friends/magnemiteId','Completed enrollment retains its distinct original gift identity and no unfinished naming prompt.');
  const magnemite = f.magnemiteId ? state.roster[f.magnemiteId] : null;
  r.check(!magnemite || magnemite.identity.speciesId === 'pokemon-081' && magnemite.identity.formId === null && magnemite.origin.kind === 'scripted' && magnemite.origin.grantId === FRIENDS.grant && magnemite.origin.metLevel === 6 && magnemite.evolutionHistory.length === 0,'/roster','Any living Magnemite keeps the genuine story origin while current growth, moves and resources remain visible.');
  r.check(same(p.recruitedHistory,[state.profile.originalHeroIdentity,state.profile.originalPartnerIdentity,{ speciesId: 'pokemon-081',formId: null }]),'/recruitedHistory','The original pair and story gift retain acquisition history after any lawful farewell.');
  const seen = state.speciesSeen;
  r.check(seen && (seen.history === 'from-creation' ? seen.startedRevision === 0 : seen.history === 'legacy-incomplete' && bounded(seen.startedRevision,1,state.revision)) && seen.identities.filter(row => row.speciesId === 'pokemon-081').length === 1 && seen.identities.some(row => row.speciesId === 'pokemon-081' && row.formId === null) && new Set(seen.identities.map(row => `${row.speciesId}:${row.formId}`)).size === seen.identities.length,'/speciesSeen','The actual unique seen flags retain their creation or incomplete-legacy qualification and one story Magnemite.');
  for (const identity of p.recruitedHistory) r.check(seen?.identities.some(row => sameForm(row,identity)),'/speciesSeen','Every genuine acquisition retains its original seen flag.');
  const earlyEncounters = ['tiny-woods',T.dungeonId].flatMap(id => catalogs.dungeons.getDungeon(id).sectionIds.flatMap(section => catalogs.dungeons.getSection(section).variants.flatMap(variant => variant.floorIds.flatMap(floor => catalogs.dungeons.getEncounterPool(catalogs.dungeons.getFloorById(floor).encounterPoolId).rows.filter(eligibleEncounter)))));
  for (const identity of seen?.identities ?? []) r.check(p.recruitedHistory.some(row => sameForm(row,identity)) || earlyEncounters.some(row => row.speciesId === identity.speciesId && row.formId === identity.formId) || identity.formId === null && (Object.hasOwn(STEEL_SLEEP_CHANCES,identity.speciesId) || ['pokemon-227','pokemon-050'].includes(identity.speciesId)),'/speciesSeen','Historical seen flags remain in their original acquired, early-encounter or reached-Steel source family without reconstructing missing flags.');

  const starterAreas = /** @type {import('../../src/contracts.js').FriendAreaId[]} */ ([catalogs.species.getProfile(state.profile.originalHeroIdentity.speciesId,state.profile.originalHeroIdentity.formId).friendAreaId,catalogs.species.getProfile(state.profile.originalPartnerIdentity.speciesId,state.profile.originalPartnerIdentity.formId).friendAreaId]);
  const areas = [...new Set(starterAreas)];
  for (const id of FRIENDS.freeAreas) if (!areas.some(key => key === id)) areas.push(/** @type {import('../../src/contracts.js').FriendAreaId} */ (id));
  checkAreas(r,state,areas,welcome?.lastRevision ?? state.revision);
  return r.result();
}

/** Real purchase and mission revisions determine ownership order. The frozen
 * mission helper remains applicable when every purchase precedes all missions;
 * actual later purchases need this direct chronological owner, never a projection.
 * @param {Report} r @param {State} state @param {import('../../src/contracts.js').FriendAreaId[]} areas @param {number} welcome */
function checkAreas(r,state,areas,welcome) {
  const f = state.friends;if (!f) return;
  const missions = f.missionAreaRewards,work = state.earlyWork;
  const priorAreas = [...areas];
  for (const purchase of f.purchases) if (!priorAreas.includes(purchase.areaId)) priorAreas.push(purchase.areaId);
  if (missions !== undefined) r.check(missions.length > 0,'/friends/missionAreaRewards','Only a real mission delivery creates the optional receipt owner.');
  let previous = welcome;
  for (const purchase of f.purchases) {
    r.check(bounded(purchase.revision,previous+1,state.revision),'/friends/purchases','Actual purchases retain their strictly ordered revisions after Wigglytuff.'); previous = purchase.revision;
  }
  previous = 0;
  for (const receipt of missions ?? []) {
    r.check(bounded(receipt.revision,previous+1,state.revision),'/friends/missionAreaRewards','Actual mission receipts retain their strictly ordered delivery revisions.'); previous = receipt.revision;
  }
  r.check(new Set((missions ?? []).map(row => row.jobId)).size === (missions?.length ?? 0),'/friends/missionAreaRewards','A real mission owns at most one area delivery receipt.');
  const events = [...f.purchases.map(receipt => ({ kind: /** @type {const} */ ('purchase'),receipt })),...(missions ?? []).map(receipt => ({ kind: /** @type {const} */ ('mission'),receipt }))].sort((a,b) => a.receipt.revision-b.receipt.revision);
  previous = welcome;
  for (const event of events) {
    const receipt = event.receipt,owned = areas.includes(receipt.areaId);
    r.check(bounded(receipt.revision,previous+1,state.revision),'/ownedFriendAreaIds','Every actual purchase or mission transaction has a distinct chronological revision after onboarding.');
    if (event.kind === 'purchase') {
      const fact = FRIEND_AREA_FACTS.find(row => row.id === event.receipt.areaId);
      r.check(fact?.unlock === 'shop_story' && fact.price === event.receipt.price && !owned,'/friends/purchases','A genuine unowned story-shop purchase keeps its exact source price.');
    } else {
      const job = state.progress.jobs[event.receipt.jobId],source = job && isBronzeJob(job) ? bronzeJob(job).source : null;
      const promised = source?.rewardType === 8 ? promisedBronzeReward(source) : null,prepared = work?.reward;
      r.check(source?.rewardType === 8 && source.friendAreaReward === receipt.areaId && BRONZE.mailAreas.some(row => row.id === receipt.areaId && row.capacity > 0) && job && promised && job.reward.money === promised.money && job.reward.rankPoints === promised.rankPoints && same(job.reward.friendAreaIds,[receipt.areaId]),'/friends/missionAreaRewards','The genuine Bronze mission source owns the exact area capacity, money and five/twenty-point promised reward.');
      r.check(source && receipt.revision > source.generatedRevision && event.receipt.day >= source.generatedDay && event.receipt.day <= state.town.day && (job?.phase.kind === 'claimed' ? receipt.revision <= job.phase.claimedRevision : job?.phase.kind === 'reward-ready' && prepared?.jobId === job.jobId && prepared.prefixAppliedRevision === receipt.revision && prepared.unpaidPrefix === undefined && work?.returned?.jobIds[work.returned.cursor] === job.jobId),'/friends/missionAreaRewards','Each real area delivery joins its actual claimed job or exclusive applied prepared prefix, never unpaid debt.');
      r.check(event.receipt.outcome === (owned ? 'already-owned-money' : 'unlocked'),'/friends/missionAreaRewards','The actual ownership at delivery selects native1000 Poke compensation or one new unlock; current money is not reconstructed from history.');
    }
    if (!owned) areas.push(receipt.areaId);
    previous = receipt.revision;
  }
  r.check(same(areas,state.economy.ownedFriendAreaIds),'/ownedFriendAreaIds','Real purchase and mission revisions produce the exact actual owned-area order.');
  const firstMission = missions?.[0];
  if (!firstMission || f.purchases.every(row => row.revision < firstMission.revision)) {
    append(r,checkMissionAreaRewards(state,priorAreas));
  }
}

/** @param {Report} r @param {State} state @param {readonly SceneId[]} ids @param {number} day @param {number} previous */
function sceneChain(r,state,ids,day,previous) {
  for (const id of ids) {
    const visit = state.progress.seenScenes[id];
    r.check(visit && visit.sceneId === id && visit.count === 1 && visit.firstRevision === visit.lastRevision && bounded(visit.lastRevision,previous+1,state.revision) && visit.firstDay === day && visit.lastDay === day,'/seenScenes','Actual terminal scenes retain one ordered acknowledgment on their historical day.');
    previous = visit?.lastRevision ?? previous;
  }
  return previous;
}
/** @param {Report} r @param {State} state @param {number} index @param {SceneId|''} sceneId @param {number} day */
function grantAt(r,state,index,sceneId,day) {
  const receipt = state.progress.appliedGrants[index],scene = state.progress.seenScenes[sceneId];
  r.check(receipt && scene && receipt.day === day && receipt.revision === scene.lastRevision,'/appliedGrants','The retained original grant joins its actual acknowledged scene revision and historical day.');
}
/** @param {Report} r @param {State} state */
function checkSteel(r,state) {
  const steel = state.steel,p = state.progress;
  if (!steel) return;
  const quiet = Number(!!p.seenScenes[STEEL.scenes[10] ?? '']),battleVisits = steel.bossVisits-quiet,failures = steel.attempts-1;
  r.check(steel.phase === 'complete' && steel.rewardCursor === 3 && !steel.rewardChoice && steel.bossDefeated && steel.winRevision !== null && steel.lastSessionId !== null,'/steel','The historical Steel rescue is complete with its real session, success and three delivered rewards.');
  r.check(bounded(steel.startedRevision,1,state.revision) && steel.startedRevision > (p.seenScenes[WORK.scenes[1] ?? '']?.lastRevision ?? state.revision) && bounded(steel.priorExpeditions,2,p.statistics.expeditions) && bounded(steel.attempts,1,p.statistics.expeditions) && bounded(steel.bossVisits,1,steel.attempts) && bounded(battleVisits,0,steel.bossVisits) && bounded(steel.winRevision ?? 0,steel.startedRevision,state.revision),'/steel','Actual story entry, retries, summit visits and success keep their bounded retained history.');
  const counts = [1,Math.max(0,steel.attempts-1),Number(battleVisits>0),Math.max(0,battleVisits-1),failures,Number(!quiet),1,1,1,1,quiet];
  for (const [index,id] of STEEL.scenes.entries()) {
    const visit = p.seenScenes[id],count = counts[index] ?? -1;
    r.check(count >= 0 && (count === 0 ? !visit : visit && visit.sceneId === id && visit.count === count && visit.firstDay === steel.requestDay && visit.lastDay === steel.requestDay && bounded(visit.firstRevision,steel.startedRevision,state.revision) && bounded(visit.lastRevision,visit.firstRevision,state.revision) && (count > 1 || visit.firstRevision === visit.lastRevision)),'/seenScenes','Steel story scene counts derive only from retained attempts, boss visits and its one successful return.');
  }
  r.check(p.seenScenes[STEEL.scenes[quiet ? 10 : 5] ?? '']?.lastRevision === steel.winRevision,'/steel/winRevision','The actual departure or quiet-summit acknowledgment owns the story win revision.');
  let previous = steel.winRevision ?? 0;
  for (const index of [9,6,7,8]) {
    const visit = p.seenScenes[STEEL.scenes[index] ?? ''];
    r.check(visit && visit.firstRevision > previous,'/seenScenes','The successful bridge, crossing, thanks and home acknowledgments retain their original order.');
    previous = visit?.lastRevision ?? previous;
  }
  const crossing = p.seenScenes[STEEL.scenes[6] ?? ''],receipts = p.appliedGrants.filter(row => STEEL.grants.includes(row.grantId));
  r.check(same(receipts.map(row => row.grantId),STEEL.grants),'/appliedGrants','Steel cash, scarf and Ginseng retain exactly one ordered delivery each.');
  previous = crossing?.lastRevision ?? state.revision;
  for (const receipt of receipts) {
    r.check(crossing && receipt.day === steel.requestDay && receipt.revision > crossing.lastRevision && bounded(receipt.revision,previous,state.revision),'/appliedGrants','Real Steel reward revisions remain after crossing and nondecreasing on the rescue request day.');
    previous = receipt.revision;
  }
  const clear = p.clears[STEEL.dungeonId],home = p.seenScenes[STEEL.scenes[8] ?? ''];
  r.check(clear?.clearCount === 1 && same(clear.reachedFloorIds,STEEL.floors) && home && clear.firstClearRevision === home.lastRevision && clear.lastClearRevision === clear.firstClearRevision && clear.firstClearDay === steel.requestDay && clear.lastClearDay === steel.requestDay,'/clears/mt-steel','The retained nine-floor Diglett clear joins the genuine final home acknowledgment without ordinary replay.');
}
