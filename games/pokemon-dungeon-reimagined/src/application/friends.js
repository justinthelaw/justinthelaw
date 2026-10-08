import { showWork } from './work.js';
import { createSnapshotPanel } from './snapshot-panel.js';
import { workReady } from '../domain/gameplay/escort-work.js';
import { IQ_SKILLS } from '../../content/state/pokemon-rules.js';
import { FRIEND_AREA_FACTS, areaMapId, areaResidents } from '../../content/authored/friends.js';
import { TOWN } from '../../content/authored/town.js';
import { TEAM } from '../../content/authored/team-formation.js';
import { MORNING } from '../../content/authored/first-morning.js';
import { availableFriendAreas, residentOrderProblem, nearbyResident, nearWigglytuff } from '../domain/gameplay/friend-residents.js';
import { showTown } from './town.js';
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../domain/gameplay/friend-residents.js').ResidentOrder} Order */
/** Ground menus select intentions only. Exploration, transactions, protected
 * residents and exact enrollment are owned by the persisted domain boundary.
 * @param {{snapshot:Snapshot,catalogs:import('../domain/gameplay/support.js').Catalogs,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent,shown:Snapshot)=>void,model?:ReturnType<typeof createSnapshotPanel>,menu:()=>void,open:()=>void,explore:(shown:Snapshot)=>void}} options */
export function showFriends({ snapshot, catalogs, view, send: providedSend, menu, open, explore, model = createSnapshotPanel({snapshot,view,send:providedSend}) }) {
  snapshot = model.snapshot(); const send = model.send;
  let friends = snapshot.friends; if (!friends) return;
  let area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === snapshot.town.mapDefinitionId);
  let resident = nearbyResident(snapshot);
  function sync() { snapshot = model.snapshot(); friends = snapshot.friends; area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === snapshot.town.mapDefinitionId); resident = nearbyResident(snapshot); }
  /** @param {()=>void} rebuild @param {string} title @param {string} text @param {import('../ui/view.js').Action[]} actions @param {HTMLElement[]} [extra] */
  function show(rebuild,title,text,actions,extra = []) { model.show(rebuild,title,text,actions,extra); open(); }
  /** @param {Order} order @param {string} text @param {()=>void} back */
  function confirm(order,text,back) { sync(); const problem = residentOrderProblem(snapshot,order,catalogs); show(() => confirm(order,text,back),'Confirm choice',problem ?? text,[{ label: 'Confirm',disabled: !!problem,detail: problem ?? text,run: () => send({ type: 'friendAction',order }) },{ label: 'Cancel',run: back }]); }
  /** @param {string} [draft] */
  function name(draft = 'Magnemite') {
    sync();
    const label = document.createElement('label'); label.textContent = 'Nickname ';
    const input = document.createElement('input'); input.type = 'text'; input.maxLength = 10; input.value = draft; label.append(input);
    show(() => name(input.value),'Name your teammate','Choose a nickname, or keep Magnemite.',[{ label: 'Confirm nickname',run: () => send({ type: 'friendAction',order: { kind: 'nickname',name: input.value } }) },{ label: 'Keep Magnemite',run: () => send({ type: 'friendAction',order: { kind: 'nickname',name: null } }) },{ label: 'Campaign & saves',run: menu }],[label]);
  }
  function nicknameAsk() { sync(); show(nicknameAsk,'Magnemite joins','Magnemite will live in Power Plant. Would you like to give it a nickname?',[{ label: 'Give nickname',run: () => send({ type: 'friendAction',order: { kind: 'nickname-answer',rename: true } }) },{ label: 'Keep Magnemite',run: () => send({ type: 'friendAction',order: { kind: 'nickname-answer',rename: false } }) },{ label: 'Campaign & saves',run: menu }]); }
  if (friends.nicknamePrompt === 'ask') { nicknameAsk(); return; }
  if (friends.nicknamePrompt === 'edit') { name(); return; }
  function shop() { sync(); show(shop,"Wigglytuff's Friend Areas",`Carried: ${snapshot.economy.carriedMoney} Poké. Choose an area to review its price.`,[...availableFriendAreas(snapshot).map(row => ({ label: `${row.name} · ${row.price} Poké · ${row.capacity} residents`,run: () => confirm({ kind: 'buy-area',areaId: row.id ?? '' },`Open ${row.name} for ${row.price} carried Poké?`,shop) })),{ label: 'Back',run: home }]); }
  function destinations() { sync(); show(destinations,'Visit a Friend Area','Your friends can join you when you speak with them at home.',[...FRIEND_AREA_FACTS.filter(row => row.id && snapshot.economy.ownedFriendAreaIds.some(id => id === row.id)).map(row => ({ label: `${row.name} · ${areaResidents(snapshot,row.id ?? '').length}/${row.capacity}`,run: () => send({ type: 'townTravel',mapId: areaMapId(row.id ?? '') }) })),{ label: 'Back',run: home }]); }
  function talk() { sync();
    if (!resident) { home(); return; }
    const nickname = resident.nickname,pokemonId = resident.pokemonId, active = snapshot.selectedPartyIds.includes(pokemonId), heldId = snapshot.containers[resident.heldContainerId]?.itemIds[0], held = heldId ? snapshot.items[heldId] : null;
    show(talk,resident.nickname,`${catalogs.species.getSpecies(resident.identity.speciesId).name} · Lv ${resident.growth.level} · ${active ? 'On your team' : 'Resting here'} · Holding ${held ? catalogs.effects.getItem(held.template.itemId).name : 'nothing'}.`,[
      .../** @type {const} */ (['join','standby','take','farewell']).map(operation => { const order = { kind: /** @type {const} */ ('resident'),pokemonId,operation },problem = residentOrderProblem(snapshot,order,catalogs); return { label: ({ join: 'Join team',standby: 'Standby here',take: 'Take held item',farewell: 'Say farewell' })[operation],disabled: !!problem,detail: problem ?? operation,run: () => confirm(order,operation === 'farewell' ? `Say farewell to ${nickname}? Its held item returns to your toolbox or storage.` : `${operation === 'join' ? 'Invite' : operation === 'standby' ? 'Leave' : 'Take the held item from'} ${nickname}${operation === 'join' ? ' onto the team' : operation === 'standby' ? ' here' : ''}?`,talk) }; }),
      { label: 'Give held item',run: give },
      { label: 'Summary',run: summary },
      { label: 'Moves',run: moves },
      { label: 'Check IQ',run: iq },
      { label: 'Back',run: home },
    ]);
  }
  function give() { sync(); if (!resident) return; const pokemonId = resident.pokemonId; show(give,'Give an item','Choose a whole toolbox slot. Any previous held item returns to the freed slot.',[...(snapshot.containers[snapshot.economy.toolbox]?.itemIds ?? []).flatMap(id => { const item = snapshot.items[id]; return item ? [{ label: `${catalogs.effects.getItem(item.template.itemId).name} ×${item.quantity}`,run: () => confirm({ kind: 'give',pokemonId,itemInstanceId: id },`Give this whole slot to ${resident?.nickname}?`,talk) }] : []; }),{ label: 'Back',run: talk }]); }
  function summary() { sync(); if (!resident) return; const stats = resident.growth.naturalStats,bonuses = resident.growth.permanentStatBonuses; show(summary,resident.nickname,`Lv ${resident.growth.level} · EXP ${resident.growth.totalExperience.numerator} · IQ ${resident.growth.iqPoints}\n${Object.entries(stats).map(([key,value]) => `${key}: ${value + (bonuses[/** @type {keyof typeof stats} */ (key)] ?? 0)}`).join(' · ')}`,[{ label: 'Back',run: talk }]); }
  function iq() { sync();
    if (!resident) return; const member = resident;
    show(iq,`${member.nickname} · IQ ${member.growth.iqPoints}`,'Choose a skill, then Switch to enable or disable it. Enabling a skill turns off other skills in its group.',[...IQ_SKILLS.filter(row => row.minimumIq <= member.growth.iqPoints).map(row => {
      const enabled = member.enabledIqSkillIds.includes(row.id), name = row.id.replace('iq-','').split('-').map(word => word[0]?.toUpperCase() + word.slice(1)).join(' ');
      return { label: `${enabled ? 'Enabled' : 'Disabled'} · ${name}`,run: () => skill(row.id) };
    }),{ label: 'Back',run: talk }]);
  }
  /** @param {string} id */
  function skill(id) { sync(); const row = IQ_SKILLS.find(row => row.id === id); if (!resident || !row) return; const enabled = resident.enabledIqSkillIds.includes(row.id),name = row.id.replace('iq-','').split('-').map(word => word[0]?.toUpperCase() + word.slice(1)).join(' '),pokemonId = resident.pokemonId; show(() => skill(id),name,`${enabled ? 'Enabled' : 'Disabled'} · Requires IQ ${row.minimumIq}.`,[{ label: 'Switch',run: () => send({ type: 'friendAction',order: { kind: 'iq-toggle',pokemonId,iqSkillId: row.id } }) },{ label: 'Back',run: iq }]); }
  function moves() { sync(); if (!resident) return; const pokemonId = resident.pokemonId; show(moves,`${resident.nickname} · moves`,'Choose whether your teammate may use each learned move.',[...resident.moves.slots.flatMap(slot => slot ? [{ label: `${slot.enabled ? 'Enabled' : 'Disabled'} · ${catalogs.effects.getMove(slot.moveId).name}`,run: () => send({ type: 'friendAction',order: { kind: 'move-toggle',pokemonId,moveSlotId: slot.moveSlotId } }) }] : []),{ label: 'Back',run: talk }]); }
  /** @param {'board'|'jobs'|'mailbox'|'depart'} page */
  function jobs(page) { showWork({ snapshot:model.snapshot(),catalogs,view,send,back: home,menu,open,model },page); }
  function home() { sync();
    if ((friends?.phase === 'meanies-ready' || friends?.phase === 'caterpie-ready')) { show(home,'The next morning','You are awake inside the rescue base. Your partner is waiting outside.',[{ label: 'Leave home',run: () => send({ type: 'townTravel',mapId: TEAM.map }) },{ label: 'Campaign & saves',run: menu }]); return; }
    if (friends?.phase === 'sinister-ready') { show(home,"Caterpie's request","Metapod is waiting in Sinister Woods. This development checkpoint ends after accepting Caterpie's request.",[{ label: 'Campaign & saves',run: menu }]); return; }
    const square = snapshot.town.mapDefinitionId === TOWN.square, canExplore = square || !!area, readyWork = workReady(snapshot);
    const guidance = friends?.phase === 'morning-ready' ? 'Your partner is waiting outside.' : friends?.phase === 'tour' ? 'Visit Wigglytuff near the center of the Square. Walk beside the counter, then speak with Wigglytuff.' : friends?.phase === 'encounter-ready' ? 'A Jumpluff is asking for help near the northeast side of the Square. Walk over to hear the request.' : area ? 'Walk beside a resident, then use Talk to manage your team or held items.' : `Take rescue requests and finish their objectives in Tiny Woods, Thunderwave Cave or Mt. Steel. ${snapshot.progress.native.clearCount}/${friends?.phase === 'work-two' ? 2 : 3} requests claimed this interval. Up to three selected members can enter; an escort follows separately.${snapshot.earlyWork?.history === 'legacy-postings-unavailable' ? ' Imported posting history remains unavailable.' : ''}`;
    show(home,area?.name ?? (square ? 'Pokémon Square' : 'Rescue base'),guidance,[
      ...(readyWork ? [{ label: 'Job List',run: () => jobs('jobs') }] : []),
      ...(readyWork && snapshot.town.mapDefinitionId === TOWN.post ? [{ label: 'Bulletin board',run: () => jobs('board') }] : []),
      ...(readyWork && snapshot.town.mapDefinitionId === TEAM.map ? [{ label: 'Check mailbox',run: () => jobs('mailbox') },{ label: 'Choose dungeon',run: () => jobs('depart') }] : []),
      ...(canExplore ? [{ label: 'Explore on foot',run: () => explore(model.snapshot()) }] : []),
      ...(resident ? [{ label: `Talk to ${resident.nickname}`,run: talk }] : []),
      ...(square && nearWigglytuff(snapshot) ? [{ label: friends?.phase === 'tour' ? 'Speak to Wigglytuff' : 'Buy Friend Areas',run: friends?.phase === 'tour' ? () => send({ type: 'friendAction',order: { kind: 'welcome' } }) : shop }] : []),
      ...(snapshot.progress.native.scenarios.MAIN.step >= 4 ? [{ label: 'Visit Friend Areas',run: destinations }] : []),
      ...(square ? [{ label: 'Town services',run: () => showTown({ snapshot:model.snapshot(),catalogs,view,send,menu,open,back: home,model }) }] : []),
      ...[{ mapId: TEAM.map,label: 'Return to base' },{ mapId: TOWN.square,label: 'Visit Pokémon Square' },{ mapId: TOWN.post,label: 'Visit Post Office' },{ mapId: MORNING.interior,label: 'Enter home' }].filter(row => row.mapId !== snapshot.town.mapDefinitionId && (friends?.phase === 'morning-ready' ? row.mapId === TEAM.map : friends?.phase !== 'tour' || [TEAM.map,TOWN.square].includes(row.mapId))).map(row => ({ label: row.label,run: () => send({ type: 'townTravel',mapId: row.mapId }) })),
      { label: 'Campaign & saves',run: menu },
    ]);
  }
  home();
}
