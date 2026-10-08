import { showWork } from './work.js';
import { workReady } from '../domain/gameplay/work.js';
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
 * @param {{snapshot:Snapshot,catalogs:import('../domain/gameplay/support.js').Catalogs,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent)=>void,menu:()=>void,open:()=>void,explore:()=>void}} options */
export function showFriends({ snapshot, catalogs, view, send, menu, open, explore }) {
  const friends = snapshot.friends; if (!friends) return;
  const area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === snapshot.town.mapDefinitionId);
  /** @param {string} title @param {string} text @param {import('../ui/view.js').Action[]} actions @param {HTMLElement[]} [extra] */
  function show(title,text,actions,extra = []) { let token = Symbol('pending'); token = view.show(title,text,actions.map(action => ({ ...action,run() { if (view.ownsPanel(token)) action.run(); } })),extra); open(); }
  /** @param {Order} order @param {string} text @param {()=>void} back */
  function confirm(order,text,back) { const problem = residentOrderProblem(snapshot,order,catalogs); show('Confirm choice',problem ?? text,[{ label: 'Confirm',disabled: !!problem,detail: problem ?? text,run: () => send({ type: 'friendAction',order }) },{ label: 'Cancel',run: back }]); }
  function name() {
    const label = document.createElement('label'); label.textContent = 'Nickname ';
    const input = document.createElement('input'); input.type = 'text'; input.maxLength = 10; input.value = 'Magnemite'; label.append(input);
    show('Name your teammate','Choose a nickname, or keep Magnemite.',[{ label: 'Confirm nickname',run: () => send({ type: 'friendAction',order: { kind: 'nickname',name: input.value } }) },{ label: 'Keep Magnemite',run: () => send({ type: 'friendAction',order: { kind: 'nickname',name: null } }) },{ label: 'Campaign & saves',run: menu }],[label]);
  }
  if (friends.nicknamePrompt === 'ask') { show('Magnemite joins','Magnemite will live in Power Plant. Would you like to give it a nickname?',[{ label: 'Give nickname',run: () => send({ type: 'friendAction',order: { kind: 'nickname-answer',rename: true } }) },{ label: 'Keep Magnemite',run: () => send({ type: 'friendAction',order: { kind: 'nickname-answer',rename: false } }) },{ label: 'Campaign & saves',run: menu }]); return; }
  if (friends.nicknamePrompt === 'edit') { name(); return; }
  function shop() { show("Wigglytuff's Friend Areas",`Carried: ${snapshot.economy.carriedMoney} Poké. Choose an area to review its price.`,[...availableFriendAreas(snapshot).map(row => ({ label: `${row.name} · ${row.price} Poké · ${row.capacity} residents`,run: () => confirm({ kind: 'buy-area',areaId: row.id ?? '' },`Open ${row.name} for ${row.price} carried Poké?`,shop) })),{ label: 'Back',run: home }]); }
  function destinations() { show('Visit a Friend Area','Your friends can join you when you speak with them at home.',[...FRIEND_AREA_FACTS.filter(row => row.id && snapshot.economy.ownedFriendAreaIds.some(id => id === row.id)).map(row => ({ label: `${row.name} · ${areaResidents(snapshot,row.id ?? '').length}/${row.capacity}`,run: () => send({ type: 'townTravel',mapId: areaMapId(row.id ?? '') }) })),{ label: 'Back',run: home }]); }
  const resident = nearbyResident(snapshot);
  function talk() {
    if (!resident) { home(); return; }
    const pokemonId = resident.pokemonId, active = snapshot.selectedPartyIds.includes(pokemonId), heldId = snapshot.containers[resident.heldContainerId]?.itemIds[0], held = heldId ? snapshot.items[heldId] : null;
    show(resident.nickname,`${catalogs.species.getSpecies(resident.identity.speciesId).name} · Lv ${resident.growth.level} · ${active ? 'On your team' : 'Resting here'} · Holding ${held ? catalogs.effects.getItem(held.template.itemId).name : 'nothing'}.`,[
      .../** @type {const} */ (['join','standby','take','farewell']).map(operation => { const order = { kind: /** @type {const} */ ('resident'),pokemonId,operation },problem = residentOrderProblem(snapshot,order,catalogs); return { label: ({ join: 'Join team',standby: 'Standby here',take: 'Take held item',farewell: 'Say farewell' })[operation],disabled: !!problem,detail: problem ?? operation,run: () => confirm(order,operation === 'farewell' ? `Say farewell to ${resident.nickname}? Its held item returns to your toolbox or storage.` : `${operation === 'join' ? 'Invite' : operation === 'standby' ? 'Leave' : 'Take the held item from'} ${resident.nickname}${operation === 'join' ? ' onto the team' : operation === 'standby' ? ' here' : ''}?`,talk) }; }),
      { label: 'Give held item',run: () => show('Give an item','Choose a whole toolbox slot. Any previous held item returns to the freed slot.',[...(snapshot.containers[snapshot.economy.toolbox]?.itemIds ?? []).flatMap(id => { const item = snapshot.items[id]; return item ? [{ label: `${catalogs.effects.getItem(item.template.itemId).name} ×${item.quantity}`,run: () => confirm({ kind: 'give',pokemonId,itemInstanceId: id },`Give this whole slot to ${resident.nickname}?`,talk) }] : []; }),{ label: 'Back',run: talk }]) },
      { label: 'Summary',run: () => show(resident.nickname,`Lv ${resident.growth.level} · EXP ${resident.growth.totalExperience.numerator} · IQ ${resident.growth.iqPoints}\n${Object.entries(resident.growth.naturalStats).map(([key,value]) => `${key}: ${value + (resident.growth.permanentStatBonuses[/** @type {keyof typeof resident.growth.naturalStats} */ (key)] ?? 0)}`).join(' · ')}`,[{ label: 'Back',run: talk }]) },
      { label: 'Moves',run: moves },
      { label: 'Check IQ',run: iq },
      { label: 'Back',run: home },
    ]);
  }
  function iq() {
    if (!resident) return;
    show(`${resident.nickname} · IQ ${resident.growth.iqPoints}`,'Choose a skill, then Switch to enable or disable it. Enabling a skill turns off other skills in its group.',[...IQ_SKILLS.filter(row => row.minimumIq <= resident.growth.iqPoints).map(row => {
      const enabled = resident.enabledIqSkillIds.includes(row.id), name = row.id.replace('iq-','').split('-').map(word => word[0]?.toUpperCase() + word.slice(1)).join(' ');
      return { label: `${enabled ? 'Enabled' : 'Disabled'} · ${name}`,run: () => show(name,`${enabled ? 'Enabled' : 'Disabled'} · Requires IQ ${row.minimumIq}.`,[{ label: 'Switch',run: () => send({ type: 'friendAction',order: { kind: 'iq-toggle',pokemonId: resident.pokemonId,iqSkillId: row.id } }) },{ label: 'Back',run: iq }]) };
    }),{ label: 'Back',run: talk }]);
  }
  function moves() { if (!resident) return; show(`${resident.nickname} · moves`,'Choose whether your teammate may use each learned move.',[...resident.moves.slots.flatMap(slot => slot ? [{ label: `${slot.enabled ? 'Enabled' : 'Disabled'} · ${catalogs.effects.getMove(slot.moveId).name}`,run: () => send({ type: 'friendAction',order: { kind: 'move-toggle',pokemonId: resident.pokemonId,moveSlotId: slot.moveSlotId } }) }] : []),{ label: 'Back',run: talk }]); }
  /** @param {'board'|'jobs'|'mailbox'|'depart'} page */
  function jobs(page) { showWork({ snapshot,catalogs,view,send,back: home,menu,open },page); }
  function home() {
    if (friends?.phase === 'meanies-ready') { show('The next morning','You are awake inside the rescue base. Your partner is waiting outside.',[{ label: 'Leave home',run: () => send({ type: 'townTravel',mapId: TEAM.map }) },{ label: 'Campaign & saves',run: menu }]); return; }
    if (friends?.phase === 'work-two') { show('Rescue base','Pelipper has delivered a new request. You can file the mail and manage your Job List. Further departures are in development while escort requests and their rewards are completed.',[{ label: 'Check mailbox',run: () => jobs('mailbox') },{ label: 'Job List',run: () => jobs('jobs') },{ label: 'Campaign & saves',run: menu }]); return; }
    const square = snapshot.town.mapDefinitionId === TOWN.square, canExplore = square || !!area, readyWork = workReady(snapshot);
    const guidance = friends?.phase === 'morning-ready' ? 'Your partner is waiting outside.' : friends?.phase === 'tour' ? 'Visit Wigglytuff near the center of the Square. Walk beside the counter, then speak with Wigglytuff.' : friends?.phase === 'encounter-ready' ? 'A Jumpluff is asking for help near the northeast side of the Square. Walk over to hear the request.' : area ? 'Walk beside a resident, then use Talk to manage your team or held items.' : `Take rescue requests and finish their objectives in Tiny Woods, Thunderwave Cave or Mt. Steel. ${snapshot.progress.native.clearCount}/3 requests claimed this interval. Additional team entry remains in development; accepted jobs and selected residents are retained.${snapshot.earlyWork?.history === 'legacy-postings-unavailable' ? ' Imported posting history remains unavailable.' : ''}`;
    show(area?.name ?? (square ? 'Pokémon Square' : 'Rescue base'),guidance,[
      ...(readyWork ? [{ label: 'Job List',run: () => jobs('jobs') }] : []),
      ...(readyWork && snapshot.town.mapDefinitionId === TOWN.post ? [{ label: 'Bulletin board',run: () => jobs('board') }] : []),
      ...(readyWork && snapshot.town.mapDefinitionId === TEAM.map ? [{ label: 'Check mailbox',run: () => jobs('mailbox') },{ label: 'Choose dungeon',run: () => jobs('depart') }] : []),
      ...(canExplore ? [{ label: 'Explore on foot',run: explore }] : []),
      ...(resident ? [{ label: `Talk to ${resident.nickname}`,run: talk }] : []),
      ...(square && nearWigglytuff(snapshot) ? [{ label: friends?.phase === 'tour' ? 'Speak to Wigglytuff' : 'Buy Friend Areas',run: friends?.phase === 'tour' ? () => send({ type: 'friendAction',order: { kind: 'welcome' } }) : shop }] : []),
      ...(snapshot.progress.native.scenarios.MAIN.step >= 4 ? [{ label: 'Visit Friend Areas',run: destinations }] : []),
      ...(square ? [{ label: 'Town services',run: () => showTown({ snapshot,catalogs,view,send,menu,open,back: home }) }] : []),
      ...[{ mapId: TEAM.map,label: 'Return to base' },{ mapId: TOWN.square,label: 'Visit Pokémon Square' },{ mapId: TOWN.post,label: 'Visit Post Office' },{ mapId: MORNING.interior,label: 'Enter home' }].filter(row => row.mapId !== snapshot.town.mapDefinitionId && (friends?.phase === 'morning-ready' ? row.mapId === TEAM.map : friends?.phase !== 'tour' || [TEAM.map,TOWN.square].includes(row.mapId))).map(row => ({ label: row.label,run: () => send({ type: 'townTravel',mapId: row.mapId }) })),
      { label: 'Campaign & saves',run: menu },
    ]);
  }
  home();
}
