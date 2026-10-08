import { FRIEND_AREA_FACTS } from '../../content/authored/friend-area-facts.js';
import { workReady } from '../domain/gameplay/escort-work.js';
import { meaniesMailboxReady } from '../domain/gameplay/escort-meanies-scenes.js';
import { rescueRank } from '../domain/gameplay/job-generation.js';
import { TOWN } from '../../content/authored/town.js';
import { STEEL } from '../../content/authored/mt-steel.js';
import { WORK } from '../../content/authored/early-work.js';
import { admission } from '../domain/gameplay/escort-expedition.js';
import { jobTargetItem } from '../domain/gameplay/job-objectives.js';
import { showRewardChoices } from './reward-panel.js';
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** Read-only selection/confirmation views. All callbacks keep the shown snapshot
 * and panel token; the shell separately binds the save/adventure epoch.
 * @param {{snapshot:Snapshot,catalogs:import('../domain/gameplay/support.js').Catalogs,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent)=>void,back:()=>void,menu:()=>void,open:()=>void}} options
 * @param {'board'|'jobs'|'mailbox'|'depart'|'flow'} page */
export function showWork({ snapshot, catalogs, view, send, back, menu, open }, page) {
  const work = snapshot.earlyWork; if (!work) return;
  if (page !== 'flow' && !workReady(snapshot) && !(meaniesMailboxReady(snapshot) && ['jobs','mailbox'].includes(page))) return;
  const itemName = (/** @type {string} */ id) => catalogs.effects.getItem(id).name;
  const person = (/** @type {string} */ id) => catalogs.species.getSpecies(id).name;
  const routeName = (/** @type {string} */ id) => id === 'tiny-woods' ? 'Tiny Woods' : id === STEEL.dungeonId ? 'Mt. Steel' : 'Thunderwave Cave';
  /** @param {string} title @param {string} text @param {import('../ui/view.js').Action[]} actions */
  function show(title, text, actions) {
    let token = Symbol('pending'); token = view.show(title, text, actions.map(action => ({ ...action, run() { if (view.ownsPanel(token)) action.run(); } })));
    open();
  }
  /** @param {import('../domain/gameplay/escort-work.js').WorkOrder} order */
  const dispatch = order => send({ type: 'workAction', order });
  /** @param {string} text @param {()=>void} yes @param {()=>void} no */
  function confirm(text, yes, no) { show('Confirm', text, [{ label: 'Confirm', run: yes }, { label: 'Cancel', run: no }]); }
  /** @param {Snapshot['progress']['jobs'][string]} job */
  function description(job) {
    const goal = job.goal, client = person(goal.client.identity.speciesId);
    const task = goal.kind === 'escort' ? `Escort ${client} to ${person(goal.recipient.identity.speciesId)}.` : goal.kind === 'find-pokemon' ? `Help ${person(goal.target.identity.speciesId)} for ${client}.` : goal.kind === 'deliver-item' ? `Bring ${itemName(goal.itemId)} to ${client}.` : goal.kind === 'retrieve-item' ? `Bring ${itemName(goal.itemId)} back for ${client}. A matching item already in your toolbox counts on a successful return; held items do not count.` : `Rescue ${client}.`;
    const extra = job.source.kind === 'generated' && 'rewardType' in job.source ? job.source.rewardType === 3 ? ' plus one extra item' : job.source.rewardType === 7 ? ' plus two extra items' : '' : '';
    return `${task} Listed location: ${routeName(goal.destination.dungeonId)}, ${Number(goal.destination.floorId.split('-').at(-1))}F. Promised reward: ${job.reward.money ? `${job.reward.money} Poké` : ''}${job.reward.money && job.reward.items.length ? ' + ' : ''}${job.reward.items.map(row => `${itemName(row.template.itemId)} ×${row.quantity}`).join(', ')}${extra}${job.reward.friendAreaIds.map(id => FRIEND_AREA_FACTS.find(row => row.id === id)?.name ?? id).join(', ')}. Rescue rank: ${job.reward.rankPoints} points. Accepted requests must also be marked Take Job before departure.`;
  }
  /** @param {import('../contracts.js').JobId} id @param {()=>void} previous */
  function detail(id, previous) {
    const job = snapshot.progress.jobs[id]; if (!job) return;
    /** @type {import('../ui/view.js').Action[]} */ const actions = [];
    if (job.phase.kind === 'offered') {
      actions.push({ label: 'Accept request', disabled: snapshot.progress.acceptedJobIds.length >= 8, detail: 'Eight accepted request slots are available.', run: () => confirm('Accept this request into your Job List? It starts suspended until you choose Take Job.', () => dispatch({ kind: 'job', jobId: id, operation: 'accept' }), () => detail(id, previous)) });
      if (work?.mailbox.some(row => row.kind === 'job' && row.jobId === id)) actions.push({ label: 'Discard letter', run: () => confirm('Discard this unaccepted request?', () => dispatch({ kind: 'discard-mail', jobId: id }), () => detail(id, previous)) });
    } else if (job.phase.kind === 'suspended' || job.phase.kind === 'accepted') {
      const operation = job.phase.kind === 'suspended' ? 'take' : 'suspend';
      actions.push({ label: operation === 'take' ? 'Take Job' : 'Suspend Job', run: () => dispatch({ kind: 'job', jobId: id, operation }) },
        { label: 'Delete request', run: () => confirm('Remove this request from your Job List?', () => dispatch({ kind: 'job', jobId: id, operation: 'delete' }), () => detail(id, previous)) });
    }
    show('Rescue request', description(job), [...actions, { label: 'Back', run: previous }]);
  }
  function list() {
    if (!work) return;
    const ids = page === 'board' ? work.boardJobIds : snapshot.progress.acceptedJobIds;
    show(page === 'board' ? 'Bulletin board' : 'Job List', page === 'board' ? 'Accept a request, then choose Take Job in your Job List. Accepted offers stay displayed until the board refreshes.' : `${ids.length}/8 accepted · ${snapshot.progress.rankPoints} rescue points · ${rescueRank(snapshot.progress.rankPoints) === 0 ? 'Normal' : 'Bronze'} rank. Only taken requests create objectives.`, [
      ...ids.flatMap(id => { const job = snapshot.progress.jobs[id]; return job ? [{ label: `${routeName(job.goal.destination.dungeonId)} ${Number(job.goal.destination.floorId.split('-').at(-1))}F · ${job.goal.kind.replaceAll('-',' ')} · ${job.phase.kind === 'accepted' ? 'Taken' : job.phase.kind === 'suspended' ? 'Suspended' : 'Available'}`, run: () => detail(id,list) }] : []; }),
      { label: 'Back', run: back },
    ]);
  }
  function mailbox() {
    if (!work) return;
    show('Mailbox', work.mailbox.length ? 'Read and file news, or accept a request into your Job List.' : 'The mailbox is empty. The Post Office board may have work.', [
      ...work.mailbox.map(row => row.kind === 'job' ? { label: `Rescue request · ${routeName(snapshot.progress.jobs[row.jobId]?.goal.destination.dungeonId ?? '')}`, run: () => detail(row.jobId, mailbox) }
        : { label: `Pokémon News ${row.newsId + 1}`, run: () => show('Pokémon News', row.newsId === 1 ? 'Requests wait at the Post Office and in your mailbox. Accept a request, then choose Take Job. Check its destination and pack supplies before leaving.' : 'Your rescue badge can send a rescued client safely home. After helping a client, choose whether to return or continue exploring. A successful return brings your team to the clients waiting to thank you.', [{ label: 'Read and file', run: () => dispatch({ kind: 'read-news', newsId: row.newsId }) }, { label: 'Back', run: mailbox }]) }),
      { label: 'Back', run: back },
    ]);
  }
  function depart() {
    show('Choose a dungeon', `Taken requests are active in their named dungeon. Ordinary exploration without completing a request earns no job reward or request count.${snapshot.friends ? ' Mt. Steel has eight exploration floors and a quiet summit. Up to three selected members may enter; an accepted escort follows as a separate temporary client.' : ''} Stun Seeds can be eaten or thrown. Purchased TMs, orbs and Warp Seeds can be carried; their uses remain unavailable.`, [
      ...['tiny-woods','thunderwave-cave', ...(snapshot.friends ? [STEEL.dungeonId] : [])].map(id => ({ label: `Enter ${routeName(id)}`, disabled: !!admission(catalogs,snapshot,id), detail: admission(catalogs,snapshot,id) ?? 'Begin an ordinary expedition', run: () => confirm(`Enter ${routeName(id)} with your current toolbox and taken jobs?`, () => send({ type: 'enterDungeon', dungeonId: /** @type {import('../contracts.js').DungeonId} */ (id) }), depart) })),
      { label: 'Cancel', run: back },
    ]);
  }
  function flow() {
    if (!work) return;
    const prompt = work.clientPrompt;
    if (prompt) {
      const actor = snapshot.session?.actors[prompt.actorId], job = actor?.binding.kind === 'job-client' ? snapshot.progress.jobs[actor.binding.jobId] : null;
      const missing = prompt.stage === 'rescue' && job?.goal.kind === 'deliver-item' && snapshot.session && !jobTargetItem(snapshot, job, snapshot.session.inventory);
      const text = prompt.stage === 'rescue' ? missing ? `This client needs ${itemName(job.goal.itemId)} in your toolbox. You can come back with it.` : `Help ${actor ? person(actor.identity.speciesId) : 'this client'} now?${job?.goal.kind === 'deliver-item' ? ` Hand over ${itemName(job.goal.itemId)} from your toolbox.` : ''}` : prompt.stage === 'leave' ? 'The client is safe. Would you like to leave the dungeon now?' : prompt.stage === 'confirm-leave' ? 'Really return to town now?' : 'Continue exploring this dungeon?';
      const answers = [{ label: 'Yes', disabled: !!missing, run: () => dispatch({ kind: 'client-answer', yes: true }) }, { label: 'No', run: () => dispatch({ kind: 'client-answer', yes: false }) }];
      if (prompt.stage === 'confirm-leave' || prompt.stage === 'confirm-stay') answers.reverse();
      show('Rescue team', text, [...answers, { label: 'Campaign & saves', run: menu }]); return;
    }
    const result = snapshot.pendingResult;
    if (result?.kind === 'job-reward') {
      const areaReceipt = snapshot.friends?.missionAreaRewards?.find(row => row.jobId === result.jobId);
      const areaText = areaReceipt ? ` ${FRIEND_AREA_FACTS.find(row => row.id === areaReceipt.areaId)?.name ?? areaReceipt.areaId}: ${areaReceipt.outcome === 'unlocked' ? 'unlocked' : 'already owned; 1000 Poké compensation awarded'}.` : '';
      show("Client's thanks", `Request complete. ${result.reward.money} Poké and ${result.reward.rankPoints} rescue points awarded.${areaText} Promised items: ${result.reward.items.map(row => `${itemName(row.template.itemId)} ×${row.quantity}`).join(', ') || 'none'}. Items went to your toolbox or storage, or were discarded according to your confirmed choices.`, [
        { label: 'Continue', run: () => send({ type: 'ackResult', resultId: result.resultId, cursor: result.cursor, revision: snapshot.revision, choice: { kind: 'ack' } }) }, { label: 'Campaign & saves', run: menu },
      ]); return;
    }
    const reward = work.reward, grant = reward ? snapshot.progress.jobs[reward.jobId]?.reward.items[reward.nextItem] : null;
    if (grant) { showRewardChoices({ snapshot, grant, itemName, show, menu, send: choice => dispatch({ kind: 'reward-choice', choice }) }); return; }
    if (work.returned) {
      const pending = work.returned.cursor < work.returned.jobIds.length;
      show(work.returned.outcome === 'success' ? 'Back from the dungeon' : 'Recovered at home', pending ? 'Clients are waiting to thank you. Find-item requests will check what remains in your toolbox as each reward is processed.' : work.returned.outcome === 'success' ? 'This expedition is settled. Rest and begin the next morning.' : 'There are no job rewards after this failed return. Unfinished taken requests remain in your Job List; clients rescued before this loss no longer offer a reward. Growth is retained, while carried items and money follow the loss rules.', [
        { label: pending ? 'Receive thanks' : 'Begin next morning', run: () => dispatch({ kind: 'station-next' }) }, { label: 'Campaign & saves', run: menu },
      ]); return;
    }
    if (snapshot.progress.storyNodeId === WORK.story) show("Dugtrio's request", 'Diglett is waiting at the summit. Climb Mt. Steel with your partner and bring him home.', [{ label: 'Enter Mt. Steel', disabled: !!admission(catalogs, snapshot, STEEL.dungeonId), run: () => send({ type: 'enterDungeon', dungeonId: /** @type {import('../contracts.js').DungeonId} */ (STEEL.dungeonId) }) }, { label: 'Prepare in town', run: () => send({ type: 'townTravel', mapId: TOWN.square }) }, { label: 'Campaign & saves', run: menu }]);
  }
  if (page === 'board' || page === 'jobs') list(); else if (page === 'mailbox') mailbox(); else if (page === 'depart') depart(); else flow();
}
