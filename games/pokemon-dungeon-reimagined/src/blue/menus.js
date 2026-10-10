import { getGroundItem, setMoveEnabled, setShortcut } from './mechanics.js';
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').OpeningData} OpeningData */
/** @typedef {import('./mechanics-types.js').DungeonAction} DungeonAction */
/** @typedef {{label:string,run:()=>void}} MenuChoice */
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
      { label: 'Team', run: team },
      { label: 'Others', run: others },
      { label: 'Ground', run: ground },
      { label: 'Quicksave', run: quicksave },
      { label: 'Close', run: close },
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
      choices.push({ label: 'Use', run() { close(); host.act({ type: 'moveSlot', slot }); } });
      choices.push({ label: move.set ? 'Unset' : 'Set', run() {
        if (move.set) move.set = false; else setShortcut(state, slot);
        host.commit(); moves(actorId);
      } });
    } else choices.push({ label: move.enabled ? 'Switch off' : 'Switch on', run() {
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
    show(actor.name, [
      { label: 'Summary', run: () => info(`${actor.name}  Level ${actor.level}\nHP ${actor.hp}/${actor.maxHp}   Belly ${Math.ceil(actor.belly)}/${actor.maxBelly}\nAttack ${actor.stats.attack}   Defense ${actor.stats.defense}\nSp. Atk ${actor.stats.specialAttack}   Sp. Def ${actor.stats.specialDefense}\nExperience ${actor.exp}`, () => member(actorId)) },
      { label: 'Moves', run: () => moves(actorId) },
      { label: 'Held Item', run: () => held(actorId) },
      { label: 'Back', run: team },
    ], undefined, team);
  }

  /** @param {'hero'|'partner'} actorId */
  function held(actorId) {
    const actor = host.state()?.[actorId]; if (!actor) return;
    if (!actor.heldItem) { info(`${actor.name} is not holding an item.`, () => member(actorId)); return; }
    const name = actor.heldItem.kind.replaceAll('-', ' ').replace(/\b[a-z]/g, letter => letter.toUpperCase());
    if (actorId === 'partner') { info(`${actor.name} is holding ${name}. Your partner will use it when needed.`, () => member(actorId)); return; }
    show(name, [
      { label: 'Eat', run() { close(); host.act({ type: 'eatHeld' }); } },
      { label: 'Place', run() { close(); host.act({ type: 'dropHeld' }); } },
      { label: 'Back', run: () => member(actorId) },
    ], undefined, () => member(actorId));
  }

  function ground() {
    const state = host.state(); if (!state) return;
    const item = getGroundItem(state);
    if (state.hero.x === state.stairs.x && state.hero.y === state.stairs.y) { stairs(); return; }
    if (!item) { info('There is nothing on the ground here.'); return; }
    const name = item.kind === 'poke' ? `${item.amount} Poké` : item.kind.replaceAll('-', ' ');
    /** @type {MenuChoice[]} */ const choices = [{ label: 'Pick up', run() { close(); host.act({ type: 'pickup' }); } }];
    if (item.kind !== 'poke') choices.push({ label: 'Eat', run() { close(); host.act({ type: 'eatGround' }); } });
    choices.push({ label: 'Back', run: main });
    show(name, choices);
  }

  function others() {
    const state = host.state(); if (!state) return;
    show('Others', [
      { label: 'Game Options', run: host.settings },
      { label: 'Message Log', run: () => info(state.log.slice(-7).join('\n'), others) },
      { label: 'Hints', run: host.help },
      { label: 'Give Up', run: giveUp },
      { label: 'Back', run: main },
    ]);
  }

  function quicksave() {
    show('Quicksave and return?', [
      { label: 'Yes', run() { host.commit(); host.title(); } },
      { label: 'No', run: main },
    ], 'Your adventure will continue from this point.', main);
  }

  function giveUp() {
    show('Give up this rescue?', [
      { label: 'No', run: others },
      { label: 'Yes', run() {
        const state = host.state(); if (!state) return;
        state.status = 'defeated'; host.commit(); close();
        host.act({ type: 'wait' });
      } },
    ], 'You will have to start Tiny Woods again.', others);
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

  return { main, moves, team, others, stairs, learning, close };
}
