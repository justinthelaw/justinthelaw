import { getGroundItem, itemName, setMoveEnabled, setShortcut } from './mechanics.js';
import { IQ_SKILLS, TACTICS, canChangePolicy, hasIq, setTactic, tacticFor, talkToPartner, toggleIq } from './mechanics-policy.js';
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').OpeningData} OpeningData */
/** @typedef {import('./mechanics-types.js').DungeonAction} DungeonAction */
/** @typedef {{label:string,run:(event?:Event)=>void,disabled?:boolean}} MenuChoice */
/** @typedef {{title:string,choices:MenuChoice[],detail?:string,cancel?:()=>void}} Menu */
/** @typedef {{state:()=>DungeonState|null,data:OpeningData,show:(menu:Menu|null)=>void,act:(action:DungeonAction)=>void,commit:()=>void,title:()=>void,help:()=>void,settings:()=>void}} MenuHost */

/** Dungeon menus only describe available actions; the mechanics owner decides
 * whether an action takes a turn. No inventory beyond the two held slots.
 * @param {MenuHost} host
 */
export function createDungeonMenus(host) {
  /** @param {string} title @param {MenuChoice[]} choices @param {string} [detail] @param {()=>void} [cancel] */
  function show(title, choices, detail, cancel = main) { host.show({ title, choices, detail, cancel }); }
  function close() { host.show(null); }
  /** @param {string} detail @param {()=>void} [back] */
  function info(detail, back = main) { show('Information', [{ label: 'Back', run: back }], detail, back); }

  function main() {
    const state = host.state(); if (!state) return;
    show('Menu', [
      { label: 'Moves', run: () => moves('hero') },
      { label: 'Items', run: items },
      { label: 'Team', run: team },
      { label: 'Others', run: others },
      { label: 'Ground', run: () => ground() },
    ], undefined, close);
  }

  /** @param {'hero'|'partner'} actorId */
  function moves(actorId) {
    const actor = host.state()?.[actorId]; if (!actor) return;
    const struggle = actorId === 'hero' && actor.moves.every(move => move.pp === 0);
    show(`${actor.name}'s Moves`, [
      ...(struggle ? [{ label: 'Struggle', run() { close(); host.act({ type: 'struggle' }); } }] : []),
      ...actor.moves.map((move, slot) => ({
        label: `${actorId === 'hero' ? move.set ? '★ ' : '' : move.enabled ? '+ ' : '- '}${move.name} ${move.pp}/${move.maxPp}`,
        run: () => moveOptions(actorId, slot),
      })),
      { label: 'Back', run: actorId === 'hero' ? main : () => member('partner') },
    ], undefined, actorId === 'hero' ? main : () => member('partner'));
  }

  /** @param {'hero'|'partner'} actorId @param {number} slot */
  function moveOptions(actorId, slot) {
    const state = host.state(), move = state?.[actorId].moves[slot]; if (!state || !move) return;
    const fact = host.data.moves[move.id];
    /** @type {MenuChoice[]} */ const choices = [];
    if (actorId === 'hero') {
      choices.push({ label: 'Use', disabled:move.pp===0, run() {if(move.pp===0)return;close();host.act({type:'moveSlot',slot});} });
      choices.push({ label: move.set ? 'Deselect' : 'Set', run() {
        if (move.set) move.set = false; else setShortcut(state, slot);
        host.commit(); moves(actorId);
      } });
    } else choices.push({ label: 'Switch', run() {
      setMoveEnabled(state, actorId, slot, !move.enabled); host.commit(); moves(actorId);
    } });
    choices.push({ label: 'Info', run: () => info(`${move.name}\nType: ${fact?.type ?? 'None'}\nPP: ${move.pp}/${move.maxPp}\n${fact?.power ? `Power: ${fact.power}` : 'A status move.'}`, () => moveOptions(actorId, slot)) });
    choices.push({ label: 'Back', run: () => moves(actorId) });
    show(move.name, choices, undefined, () => moves(actorId));
  }

  function team() {
    const state = host.state(); if (!state) return;
    show('Team', [
      { label: state.hero.name, run: () => member('hero') },
      { label: state.partner.name, run: () => member('partner') },
      { label: 'Back', run: main },
    ], undefined, main);
  }

  /** @param {'hero'|'partner'} actorId */
  function member(actorId) {
    const actor = host.state()?.[actorId]; if (!actor) return;
    const species=host.data.species[actor.speciesId];
    /** @type {MenuChoice[]} */const choices=[
      { label: 'Summary', run: () => info(`${actor.name}  Level ${actor.level}\nHP ${actor.hp}/${actor.maxHp}   Belly ${Math.ceil(actor.belly)}/${actor.maxBelly}\nAttack ${actor.stats.attack}   Defense ${actor.stats.defense}\nSp. Atk ${actor.stats.specialAttack}   Sp. Def ${actor.stats.specialDefense}\nExperience ${actor.exp}\nType: ${species?.types.filter(type=>type!=='None').join(' / ')}\nAbilities: ${species?.abilities.filter(ability=>ability!=='None').join(' / ')}\nStatus: ${Object.keys(actor.status).filter(key=>(actor.status[key]??0)>0).join(', ')||'Normal'}`, () => member(actorId)) },
      { label: 'Moves', run: () => moves(actorId) },
    ];
    if(actorId==='partner')choices.push({label:'Talk',run(){const state=host.state();if(!state)return;const text=talkToPartner(state);host.commit();info(text,()=>member(actorId));}});
    choices.push({label:'Check IQ',run:()=>iq(actorId)});
    if(actorId==='partner')choices.push({label:'Tactics',run:tactics});
    show(actor.name,choices,undefined,team);
  }

  /** @param {'hero'|'partner'} actorId */
  function iq(actorId){
    const actor=host.state()?.[actorId];if(!actor)return;
    show(`${actor.name}'s IQ`,IQ_SKILLS.map(skill=>({label:`${hasIq(actor,skill.id)?'★ ':''}${skill.name}`,run(){
      show(skill.name,[
        {label:'Switch',disabled:!canChangePolicy(actor),run(){toggleIq(actor,skill.id);host.commit();iq(actorId);}},
        {label:'Info',run:()=>info(skill.description,()=>iq(actorId))},
      ],undefined,()=>iq(actorId));
    }})),undefined,()=>member(actorId));
  }

  function tactics(){
    const actor=host.state()?.partner;if(!actor)return;
    show(`${actor.name}'s Tactics`,TACTICS.map(tactic=>({label:`${tacticFor(actor)===tactic.id?'★ ':''}${tactic.name}`,run(){
      show(tactic.name,[
        {label:'Switch',disabled:!canChangePolicy(actor),run(){setTactic(actor,tactic.id);host.commit();tactics();}},
        {label:'Info',run:()=>info(tactic.description,tactics)},
      ],undefined,tactics);
    }})),undefined,()=>member('partner'));
  }

  function items() {
    const state=host.state();if(!state)return;
    const groundItem=getGroundItem(state);
    /** @type {MenuChoice[]} */const choices=[];
    if(groundItem)choices.push({label:`Ground: ${itemName(groundItem.kind)}`,run:()=>ground(items)});
    for(const actorId of /** @type {const} */(['hero','partner'])){
      const actor=state[actorId];
      if(actor.heldItem)choices.push({label:`${actor.name}: ${itemName(actor.heldItem.kind)}`,run:()=>held(actorId)});
    }
    if(!choices.length){info('You have no items.');return;}
    show('Items',choices,undefined,main);
  }

  /** @param {import('./mechanics-types.js').ItemKind} kind @param {()=>void} back */
  function itemInfo(kind,back) {
    const descriptions={
      poke:'Money used in the Pokémon world.',
      'oran-berry':'Restores 100 HP and slightly fills Belly. A thrown berry affects the Pokémon it hits.',
      'pecha-berry':'Cures poisoning and slightly fills Belly. A thrown berry affects the Pokémon it hits.',
      'rawst-berry':'Cures a burn and slightly fills Belly. A thrown berry affects the Pokémon it hits.',
    };
    info(`${itemName(kind)}\n${descriptions[kind]}`,back);
  }

  /** The no-toolbox held pages expose leader Eat or partner Use, then Info.
   * They do not inherit the toolbox Give/Take/Place/Throw commands.
   * @param {'hero'|'partner'} actorId */
  function held(actorId) {
    const actor = host.state()?.[actorId]; if (!actor) return;
    const item=actor.heldItem;
    if(!item){items();return;}
    /** @type {MenuChoice[]} */const choices=[];
    if(item.kind!=='poke')choices.push({label:actorId==='hero'?'Eat':'Use',run(){close();host.act({type:actorId==='hero'?'eatHeld':'usePartnerItem'});}});
    choices.push({label:'Info',run:()=>itemInfo(item.kind,()=>held(actorId))});
    show(`${actor.name}: ${itemName(item.kind)}`,choices,undefined,items);
  }

  /** @param {()=>void} [back] */
  function ground(back=main) {
    const state = host.state(); if (!state) return;
    const item = getGroundItem(state);
    if (state.hero.x === state.stairs.x && state.hero.y === state.stairs.y) { stairs(); return; }
    if (!item) { info('There is nothing on the ground here.',back); return; }
    const name=item.kind==='poke'?`${item.amount} Poké`:itemName(item.kind);
    const full=item.kind!=='poke'&&state.hero.heldItem!==null;
    /** @type {MenuChoice[]} */ const choices = [{ label: 'Get', disabled:full, run() {if(full)return;close();host.act({type:'pickup'});} }];
    if(item.kind!=='poke'){
      choices.push({label:'Eat',run(){close();host.act({type:'eatGround'});}});
      choices.push({label:'Throw',run(){close();host.act({type:'throwGround'});}});
    }
    choices.push({label:'Info',run:()=>itemInfo(item.kind,()=>ground(back))});
    show(name,choices,undefined,back);
  }

  function others() {
    const state = host.state(); if (!state) return;
    show('Others', [
      { label: 'Game Options', run: host.settings },
      { label: 'Quicksave or Give Up', run: saveOrGiveUp },
      { label: 'Message Log', run: () => info(state.log.slice(-7).join('\n'), others) },
      { label: 'Mission Objectives', run: () => info('Rescue Caterpie in Tiny Woods.',others) },
      { label: 'Hints', run: host.help },
    ]);
  }

  function saveOrGiveUp(){show('Quicksave or Give Up',[{label:'Quicksave',run:quicksave},{label:'Give Up',run:giveUp}],undefined,others);}

  function quicksave() {
    show('Quicksave and return?', [
      { label: 'Yes', run() { host.commit(); host.title(); } },
      { label: 'No', run: saveOrGiveUp },
    ], 'Your adventure will continue from this point.', saveOrGiveUp);
  }

  function giveUp() {
    show('Give up this rescue?', [
      { label: 'No', run: saveOrGiveUp },
      { label: 'Yes', run() {
        const state = host.state(); if (!state) return;
        state.status = 'defeated'; host.commit(); close();
        host.act({ type: 'wait' });
      } },
    ], 'You will have to start Tiny Woods again.', saveOrGiveUp);
  }

  function stairs() {
    show('Proceed to the next floor?', [
      { label: 'Proceed', run() { close(); host.act({ type: 'stairs' }); } },
      { label: 'No', run() { close(); host.act({ type: 'cancelStairs' }); } },
    ], undefined, () => { close(); host.act({ type: 'cancelStairs' }); });
  }

  function learning() {
    const state = host.state(), request = state?.pendingLearning[0]; if (!state || !request) return;
    const actor = request.actorId === 'hero' ? state.hero : state.partner;
    const name = host.data.moves[request.moveId]?.name ?? 'a move';
    show(`Learn ${name}?`, [
      { label: 'Forget a move', run() {
        show('Choose a move to forget', [
          ...actor.moves.map((move, slot) => ({ label: move.name, run() {
            close(); host.act({ type: 'learnMove', actorId: request.actorId, slot });
          } })),
          { label: 'Back', run: learning },
        ], undefined, learning);
      } },
      { label: 'Do not learn', run() { close(); host.act({ type: 'learnMove', actorId: request.actorId, slot: null }); } },
    ], `${actor.name} can learn ${name}, but already knows four moves.`, learning);
  }

  return { main, moves, items, team, others, stairs, learning, close };
}
